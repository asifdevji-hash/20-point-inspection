import { NextResponse } from "next/server";
import { getPool, ensureSchema } from "../../../lib/db";
import { ALL_ITEMS, STATUS_OPTIONS } from "../../../lib/items";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSchema();
    const pool = getPool();
    const { rows } = await pool.query(
      "SELECT id, created_at, technician, site_name, general_notes, items FROM inspections ORDER BY created_at DESC LIMIT 200"
    );
    return NextResponse.json({ inspections: rows });
  } catch (err) {
    console.error("GET /api/inspections failed:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load inspections" },
      { status: 500 }
    );
  }
}

function validate(body) {
  if (!body || typeof body !== "object") return "Invalid request body";
  if (!body.technician || !String(body.technician).trim())
    return "Technician name is required";
  if (!body.site_name || !String(body.site_name).trim())
    return "Site name is required";
  if (!Array.isArray(body.items) || body.items.length === 0)
    return "At least one checklist item is required";

  const validIds = new Set(ALL_ITEMS.map((i) => i.id));
  for (const item of body.items) {
    if (!validIds.has(item.id)) return `Unknown item id: ${item.id}`;
    if (item.status && !STATUS_OPTIONS.includes(item.status)) {
      return `Invalid status "${item.status}" for item ${item.id}`;
    }
  }
  return null;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 });
  }

  const validationError = validate(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    await ensureSchema();
    const pool = getPool();
    const { rows } = await pool.query(
      `INSERT INTO inspections (technician, site_name, general_notes, items)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at, technician, site_name, general_notes, items`,
      [
        String(body.technician).trim(),
        String(body.site_name).trim(),
        body.general_notes ? String(body.general_notes).trim() : null,
        JSON.stringify(body.items),
      ]
    );
    return NextResponse.json({ inspection: rows[0] }, { status: 201 });
  } catch (err) {
    console.error("POST /api/inspections failed:", err);
    return NextResponse.json(
      { error: err.message || "Failed to save inspection" },
      { status: 500 }
    );
  }
}
