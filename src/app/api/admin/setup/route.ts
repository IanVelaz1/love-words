/**
 * ONE-TIME DATABASE SETUP ROUTE
 * ─────────────────────────────
 * Call this ONCE to initialize the Supabase schema.
 * Requires SUPABASE_SERVICE_ROLE_KEY in env (get it from your Supabase dashboard).
 * DELETE this file after setup is complete.
 *
 * Usage: POST /api/admin/setup
 * Headers: Authorization: Bearer <SETUP_SECRET>
 */
import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

const SETUP_SECRET = process.env.SETUP_SECRET ?? "love-words-setup-2024";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${SETUP_SECRET}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY not set. Add it to .env.local" },
      { status: 500 }
    );
  }

  try {
    const migrationPath = path.join(process.cwd(), "supabase", "migrations", "001_init.sql");
    const sql = readFileSync(migrationPath, "utf-8");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      // Try alternative Supabase SQL endpoint
      const alt = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/sql",
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: sql,
      });
      const altText = await alt.text();
      return NextResponse.json({
        note: "Could not run via API. Copy the SQL from /supabase/migrations/001_init.sql into the Supabase SQL editor at https://supabase.com/dashboard",
        altResponse: altText,
      });
    }

    return NextResponse.json({ success: true, message: "Migration applied successfully" });
  } catch (err) {
    return NextResponse.json({
      error: String(err),
      note: "Run the SQL manually in the Supabase dashboard SQL editor.",
      sqlPath: "supabase/migrations/001_init.sql",
    });
  }
}
