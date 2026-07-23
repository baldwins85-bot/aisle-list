"use client";

import { useMemo, useRef, useState } from "react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import {
  CATEGORY_ORDER,
  CategoryId,
} from "@/lib/categories";
import { parseTranscript } from "@/lib/parse";
import { useShoppingList, ShoppingItem, SyncState } from "@/lib/useShoppingList";
import { useSpeech } from "@/lib/useSpeech";

const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function Home() {
  if (!clerkConfigured) {
    // Guest/local-only mode until auth keys are provisioned.
    return <ListScreen userId={null} authUi={null} />;
  }
  return <AuthedHome />;
}

function AuthedHome() {
  const { isLoaded, user } = useUser();
  const userId = isLoaded ? (user?.id ?? null) : undefined;

  const authUi = !isLoaded ? null : user ? (
    <UserButton />
  ) : (
    <SignInButton mode="modal">
      <button className="rounded-full border border-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-400 active:bg-emerald-600/20">
        Sign in to sync
      </button>
    </SignInButton>
  );

  return <ListScreen userId={userId} authUi={authUi} />;
}

function SyncBadge({ state }: { state: SyncState }) {
  const map: Record<SyncState, { text: string; cls: string }> = {
    local: { text: "On this device only", cls: "text-slate-500" },
    syncing: { text: "Syncing…", cls: "text-amber-400" },
    synced: { text: "Synced ✓", cls: "text-emerald-500" },
    error: { text: "Sync failed — changes saved here", cls: "text-rose-400" },
  };
  const { text, cls } = map[state];
  return <span className={`text-[11px] ${cls}`}>{text}</span>;
}

function ListScreen({
  userId,
  authUi,
}: {
  userId: string | null | undefined;
  authUi: React.ReactNode;
}) {
  const list = useShoppingList(userId);
  const [manualText, setManualText] = useState("");
  const [lastHeard, setLastHeard] = useState<string | null>(null);
  const lastHeardTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFinalChunk = (chunk: string) => {
    const trimmed = chunk.trim();
    if (!trimmed) return;
    list.addParsed(parseTranscript(trimmed));
    setLastHeard(trimmed);
    if (lastHeardTimer.current) clearTimeout(lastHeardTimer.current);
    lastHeardTimer.current = setTimeout(() => setLastHeard(null), 4000);
  };

  const speech = useSpeech(handleFinalChunk);

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const text = manualText.trim();
    if (!text) return;
    list.addParsed(parseTranscript(text));
    setManualText("");
  };

  const grouped = useMemo(() => {
    const byCat = new Map<CategoryId, ShoppingItem[]>();
    for (const item of list.items) {
      const arr = byCat.get(item.category) ?? [];
      arr.push(item);
      byCat.set(item.category, arr);
    }
    // Within a category: unchecked first, then by when added.
    for (const arr of byCat.values()) {
      arr.sort((a, b) =>
        a.checked === b.checked ? a.addedAt - b.addedAt : a.checked ? 1 : -1
      );
    }
    return CATEGORY_ORDER.filter((c) => byCat.has(c.id)).map((c) => ({
      meta: c,
      items: byCat.get(c.id)!,
    }));
  }, [list.items]);

  const total = list.items.length;
  const done = list.items.filter((i) => i.checked).length;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight">🛒 Aisle List</h1>
            <div className="flex items-center gap-2">
              <p className="truncate text-xs text-slate-400">
                Dictate it. Shop it aisle by aisle.
              </p>
              <SyncBadge state={list.syncState} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {total > 0 && (
              <div className="text-right">
                <div className="text-sm font-semibold text-emerald-400">
                  {done}/{total} ticked
                </div>
                {done > 0 && (
                  <button
                    onClick={list.clearChecked}
                    className="text-xs text-slate-400 underline underline-offset-2 active:text-slate-200"
                  >
                    Clear ticked
                  </button>
                )}
              </div>
            )}
            {authUi}
          </div>
        </div>
        {total > 0 && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${total ? (done / total) * 100 : 0}%` }}
            />
          </div>
        )}
      </header>

      {/* List */}
      <div className="flex-1 px-4 pb-48 pt-3">
        {!list.hydrated ? null : total === 0 ? (
          <div className="mt-16 text-center text-slate-400">
            <div className="text-5xl">🎤</div>
            <p className="mt-4 text-lg font-medium text-slate-200">
              Your list is empty
            </p>
            <p className="mx-auto mt-2 max-w-xs text-sm">
              Tap the mic and walk around your kitchen — say things like
              &ldquo;we need milk, two bananas and washing up liquid&rdquo;.
              Everything gets sorted into aisles automatically.
            </p>
          </div>
        ) : (
          grouped.map(({ meta, items }) => (
            <section key={meta.id} className="mb-4">
              <h2 className="mb-1.5 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400">
                <span>{meta.emoji}</span>
                {meta.label}
                <span className="font-normal text-slate-600">
                  {items.filter((i) => !i.checked).length}
                </span>
              </h2>
              <ul className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                {items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={() => list.toggle(item.id)}
                    onRemove={() => list.remove(item.id)}
                    onSetCategory={(cat) => list.setCategory(item.id, cat)}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      {/* Bottom controls */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-lg border-t border-slate-800 bg-slate-950/95 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur">
        {/* Live transcript / status */}
        {(speech.interim || lastHeard || speech.error) && (
          <div className="mb-2 min-h-5 text-center text-sm">
            {speech.error ? (
              <span className="text-rose-400">{speech.error}</span>
            ) : speech.interim ? (
              <span className="italic text-emerald-300">
                &ldquo;{speech.interim.trim()}&rdquo;
              </span>
            ) : lastHeard ? (
              <span className="text-slate-400">
                Heard: &ldquo;{lastHeard}&rdquo;
              </span>
            ) : null}
          </div>
        )}

        <div className="flex items-center gap-3">
          <form onSubmit={handleManualAdd} className="flex-1">
            <input
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Or type: milk, eggs, 2 bananas…"
              className="w-full rounded-full border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              enterKeyHint="done"
            />
          </form>

          {speech.supported ? (
            <button
              onClick={speech.listening ? speech.stop : speech.start}
              aria-label={speech.listening ? "Stop listening" : "Start dictating"}
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl shadow-lg transition-colors ${
                speech.listening
                  ? "mic-listening bg-emerald-500 text-white"
                  : "bg-emerald-600 text-white active:bg-emerald-500"
              }`}
            >
              {speech.listening ? "⏹" : "🎤"}
            </button>
          ) : (
            <div className="max-w-[9rem] text-xs text-slate-500">
              Voice input needs Chrome or Safari — typing still works.
            </div>
          )}
        </div>

        {speech.listening && (
          <p className="mt-2 text-center text-xs text-emerald-400">
            Listening… just talk naturally, items appear as you speak.
          </p>
        )}
      </div>
    </main>
  );
}

function ItemRow({
  item,
  onToggle,
  onRemove,
  onSetCategory,
}: {
  item: ShoppingItem;
  onToggle: () => void;
  onRemove: () => void;
  onSetCategory: (cat: CategoryId) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <li className="border-b border-slate-800 last:border-b-0">
      <div className="flex items-center gap-3 px-3 py-1">
        <button
          onClick={onToggle}
          aria-label={item.checked ? "Untick item" : "Tick item off"}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm transition-colors ${
            item.checked
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-slate-600 text-transparent active:border-emerald-400"
          }`}
        >
          ✓
        </button>
        <button
          onClick={() => setShowActions((s) => !s)}
          className="flex-1 py-2 text-left"
        >
          <span
            className={`capitalize transition-colors ${
              item.checked ? "text-slate-500 line-through" : "text-slate-100"
            }`}
          >
            {item.name}
          </span>
          {item.quantity > 1 && (
            <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-emerald-400">
              ×{item.quantity}
            </span>
          )}
        </button>
        <button
          onClick={onRemove}
          aria-label="Remove item"
          className="px-2 py-2 text-slate-600 active:text-rose-400"
        >
          ✕
        </button>
      </div>
      {showActions && (
        <div className="flex flex-wrap gap-1.5 px-3 pb-3">
          <span className="w-full text-xs text-slate-500">Move to aisle:</span>
          {CATEGORY_ORDER.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                onSetCategory(c.id);
                setShowActions(false);
              }}
              className={`rounded-full px-2.5 py-1 text-xs ${
                c.id === item.category
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-300 active:bg-slate-700"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}
