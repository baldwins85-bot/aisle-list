import { auth } from "@clerk/nextjs/server";
import { getSql } from "@/lib/db";
import { CATEGORY_BY_ID, CategoryId } from "@/lib/categories";

export const runtime = "nodejs";

interface WireItem {
  id: string;
  name: string;
  category: CategoryId;
  quantity: number;
  checked: boolean;
  addedAt: number;
}

async function requireUser(): Promise<string | null> {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.DATABASE_URL) {
    return null;
  }
  const { userId } = await auth();
  return userId;
}

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      checked BOOLEAN NOT NULL DEFAULT FALSE,
      added_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS items_user_idx ON items(user_id)`;
  tableReady = true;
}

function sanitize(raw: unknown): WireItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || r.id.length === 0 || r.id.length > 64) return null;
  if (typeof r.name !== "string" || r.name.length === 0) return null;
  const category =
    typeof r.category === "string" && r.category in CATEGORY_BY_ID
      ? (r.category as CategoryId)
      : "other";
  const quantity =
    typeof r.quantity === "number" && Number.isFinite(r.quantity)
      ? Math.min(999, Math.max(1, Math.round(r.quantity)))
      : 1;
  const addedAt =
    typeof r.addedAt === "number" && Number.isFinite(r.addedAt) ? r.addedAt : Date.now();
  return {
    id: r.id,
    name: r.name.slice(0, 200),
    category,
    quantity,
    checked: r.checked === true,
    addedAt,
  };
}

export async function GET() {
  const userId = await requireUser();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await ensureTable();
  const sql = getSql();
  const rows = (await sql`
    SELECT id, name, category, quantity, checked, added_at
    FROM items WHERE user_id = ${userId}
    ORDER BY added_at ASC
  `) as {
    id: string;
    name: string;
    category: string;
    quantity: number;
    checked: boolean;
    added_at: string;
  }[];
  const items: WireItem[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: (r.category in CATEGORY_BY_ID ? r.category : "other") as CategoryId,
    quantity: r.quantity,
    checked: r.checked,
    addedAt: Number(r.added_at),
  }));
  return Response.json({ items });
}

// Upsert a batch of items for the signed-in user.
export async function PUT(request: Request) {
  const userId = await requireUser();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const rawItems = (body as { items?: unknown[] })?.items;
  if (!Array.isArray(rawItems) || rawItems.length > 500) {
    return Response.json({ error: "Expected items array (max 500)" }, { status: 400 });
  }

  const items = rawItems.map(sanitize).filter((i): i is WireItem => i !== null);
  await ensureTable();
  const sql = getSql();
  const now = Date.now();
  for (const item of items) {
    // ON CONFLICT only updates rows this user owns, so one user can't
    // overwrite another's item by guessing an id.
    await sql`
      INSERT INTO items (id, user_id, name, category, quantity, checked, added_at, updated_at)
      VALUES (${item.id}, ${userId}, ${item.name}, ${item.category}, ${item.quantity},
              ${item.checked}, ${item.addedAt}, ${now})
      ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            category = EXCLUDED.category,
            quantity = EXCLUDED.quantity,
            checked = EXCLUDED.checked,
            updated_at = EXCLUDED.updated_at
        WHERE items.user_id = EXCLUDED.user_id
    `;
  }
  return Response.json({ ok: true, count: items.length });
}

// Delete items by id (or all with {all: true}) for the signed-in user.
export async function DELETE(request: Request) {
  const userId = await requireUser();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { ids, all } = (body ?? {}) as { ids?: unknown; all?: unknown };
  await ensureTable();
  const sql = getSql();

  if (all === true) {
    await sql`DELETE FROM items WHERE user_id = ${userId}`;
    return Response.json({ ok: true });
  }
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string") || ids.length > 500) {
    return Response.json({ error: "Expected ids array (max 500)" }, { status: 400 });
  }
  await sql`DELETE FROM items WHERE user_id = ${userId} AND id = ANY(${ids as string[]})`;
  return Response.json({ ok: true });
}
