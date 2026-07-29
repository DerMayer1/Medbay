import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(here, "../../supabase/migrations");
const shimPath = path.join(here, "supabase-shim.sql");

export type TestDatabase = {
  db: PGlite;
  /** Runs SQL as an authenticated end user with the given identity, so RLS applies. */
  asUser<T>(userId: string, sql: string, params?: unknown[]): Promise<T[]>;
  /** Runs SQL with owner privileges, used for seeding and inspection. */
  asOwner<T>(sql: string, params?: unknown[]): Promise<T[]>;
  /** Returns the error message raised by a statement, or undefined if it succeeded. */
  errorFrom(run: () => Promise<unknown>): Promise<string | undefined>;
};

/**
 * Boots an in-process PostgreSQL instance and applies the repository migrations
 * in order on top of the Supabase shim. This proves the SQL contracts —
 * triggers, constraints, row-level security and transaction boundaries — against
 * a real engine. It does not cover Supabase's hosted auth or storage services.
 */
export async function createTestDatabase(): Promise<TestDatabase> {
  const db = await PGlite.create({ extensions: { pgcrypto } });

  await db.exec(await readFile(shimPath, "utf8"));

  const migrations = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();
  for (const migration of migrations) {
    await db.exec(await readFile(path.join(migrationsDir, migration), "utf8"));
  }

  // The application connects as an ordinary authenticated user, so the test role
  // must hold table privileges and must not bypass row-level security.
  await db.exec(`
    grant select, insert, update, delete on all tables in schema public to authenticated;
    grant usage, select on all sequences in schema public to authenticated;
  `);

  async function asOwner<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const result = await db.query<T>(sql, params as never[]);
    return result.rows;
  }

  async function asUser<T>(userId: string, sql: string, params?: unknown[]): Promise<T[]> {
    await db.exec(`set role authenticated; set medbay.test_user_id = '${userId}';`);
    try {
      const result = await db.query<T>(sql, params as never[]);
      return result.rows;
    } finally {
      await db.exec(`reset role; reset medbay.test_user_id;`);
    }
  }

  async function errorFrom(run: () => Promise<unknown>) {
    try {
      await run();
      return undefined;
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }

  return { db, asUser, asOwner, errorFrom };
}
