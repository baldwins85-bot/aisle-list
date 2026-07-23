import { neon } from "@neondatabase/serverless";

// Lazy init so `next build` doesn't require DATABASE_URL at build time.
let _sql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL!);
  return _sql;
}
