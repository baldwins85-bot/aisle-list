"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CategoryId } from "./categories";
import { ParsedItem } from "./parse";

export interface ShoppingItem {
  id: string;
  name: string;
  category: CategoryId;
  quantity: number;
  checked: boolean;
  addedAt: number;
}

export type SyncState = "local" | "syncing" | "synced" | "error";

const STORAGE_KEY = "aisle-list-v2";
const LEGACY_KEY = "aisle-list-v1";

interface StoredList {
  owner: string | null; // Clerk user id this cache was last synced for
  items: ShoppingItem[];
}

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadStored(): StoredList {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.items)) {
        return { owner: parsed.owner ?? null, items: parsed.items };
      }
    }
    // Migrate the v1 (pre-accounts) list if present.
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const items = JSON.parse(legacy);
      if (Array.isArray(items)) {
        localStorage.removeItem(LEGACY_KEY);
        return { owner: null, items };
      }
    }
  } catch {
    // fall through to empty list
  }
  return { owner: null, items: [] };
}

function saveStored(list: StoredList) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage full / private mode — list still works for this session
  }
}

async function apiGet(): Promise<ShoppingItem[] | null> {
  const res = await fetch("/api/items");
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data.items) ? data.items : null;
}

async function apiUpsert(items: ShoppingItem[]): Promise<boolean> {
  if (items.length === 0) return true;
  const res = await fetch("/api/items", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  return res.ok;
}

async function apiDelete(payload: { ids?: string[]; all?: boolean }): Promise<boolean> {
  const res = await fetch("/api/items", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

/**
 * Shopping list state, offline-first.
 *
 * - Signed out (userId === null): pure localStorage, like v1.
 * - Signed in (userId set): localStorage acts as a cache for instant load;
 *   the server is the source of truth. On first sign-in any local items are
 *   pushed up (merged), then the server copy replaces local. Mutations apply
 *   optimistically and sync in the background; the list refetches when the
 *   tab regains focus so ticks made on your phone show up on your laptop.
 * - userId === undefined: auth still loading — show cache, don't sync yet.
 */
export function useShoppingList(userId: string | null | undefined) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("local");

  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const lastWriteRef = useRef(0);
  const syncedForRef = useRef<string | null>(null);

  // Persist to localStorage on every change (as cache when signed in).
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => {
    if (!hydrated) return;
    saveStored({ owner: userIdRef.current ?? null, items });
  }, [items, hydrated]);

  // Initial hydrate from localStorage for instant display.
  useEffect(() => {
    setItems(loadStored().items);
    setHydrated(true);
  }, []);

  // Sync lifecycle when auth state resolves.
  useEffect(() => {
    if (!hydrated || userId === undefined) return;
    if (userId === null) {
      setSyncState("local");
      syncedForRef.current = null;
      return;
    }
    let cancelled = false;

    const initialSync = async () => {
      setSyncState("syncing");
      try {
        const stored = loadStored();
        // First sync for this user on this device: push any local items up
        // so nothing the user dictated before signing in is lost.
        if (stored.owner !== userId && stored.items.length > 0) {
          await apiUpsert(stored.items);
        }
        const serverItems = await apiGet();
        if (cancelled) return;
        if (serverItems === null) {
          setSyncState("error");
          return;
        }
        syncedForRef.current = userId;
        setItems(serverItems);
        setSyncState("synced");
      } catch {
        if (!cancelled) setSyncState("error");
      }
    };
    initialSync();

    // Refetch when the tab becomes visible so cross-device changes appear.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (syncedForRef.current !== userId) return;
      // Skip if we just wrote — avoid clobbering an in-flight optimistic update.
      if (Date.now() - lastWriteRef.current < 3000) return;
      apiGet()
        .then((serverItems) => {
          if (!cancelled && serverItems !== null) {
            setItems(serverItems);
            setSyncState("synced");
          }
        })
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [userId, hydrated]);

  // Background remote write with basic error surfacing.
  const remote = useCallback((op: () => Promise<boolean>) => {
    if (!userIdRef.current) return;
    lastWriteRef.current = Date.now();
    setSyncState("syncing");
    op()
      .then((ok) => setSyncState(ok ? "synced" : "error"))
      .catch(() => setSyncState("error"));
  }, []);

  const addParsed = useCallback(
    (parsed: ParsedItem[]): number => {
      if (parsed.length === 0) return 0;
      let added = 0;
      const touched: ShoppingItem[] = [];
      setItems((prev) => {
        const next = [...prev];
        for (const p of parsed) {
          const existingIdx = next.findIndex(
            (it) => !it.checked && it.name === p.name && it.category === p.category
          );
          if (existingIdx >= 0) {
            const updated = {
              ...next[existingIdx],
              quantity: next[existingIdx].quantity + (p.quantity ?? 1),
            };
            next[existingIdx] = updated;
            touched.push(updated);
          } else {
            const item: ShoppingItem = {
              id: newId(),
              name: p.name,
              category: p.category,
              quantity: p.quantity ?? 1,
              checked: false,
              addedAt: Date.now(),
            };
            next.push(item);
            touched.push(item);
            added += 1;
          }
        }
        return next;
      });
      remote(() => apiUpsert(touched));
      return added;
    },
    [remote]
  );

  const toggle = useCallback(
    (id: string) => {
      let updated: ShoppingItem | undefined;
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          updated = { ...it, checked: !it.checked };
          return updated;
        })
      );
      remote(() => (updated ? apiUpsert([updated]) : Promise.resolve(true)));
    },
    [remote]
  );

  const remove = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((it) => it.id !== id));
      remote(() => apiDelete({ ids: [id] }));
    },
    [remote]
  );

  const setCategory = useCallback(
    (id: string, category: CategoryId) => {
      let updated: ShoppingItem | undefined;
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          updated = { ...it, category };
          return updated;
        })
      );
      remote(() => (updated ? apiUpsert([updated]) : Promise.resolve(true)));
    },
    [remote]
  );

  const clearChecked = useCallback(() => {
    const ids = itemsRef.current.filter((it) => it.checked).map((it) => it.id);
    setItems((prev) => prev.filter((it) => !it.checked));
    remote(() => apiDelete({ ids }));
  }, [remote]);

  const clearAll = useCallback(() => {
    setItems([]);
    remote(() => apiDelete({ all: true }));
  }, [remote]);

  return {
    items,
    hydrated,
    syncState,
    addParsed,
    toggle,
    remove,
    setCategory,
    clearChecked,
    clearAll,
  };
}
