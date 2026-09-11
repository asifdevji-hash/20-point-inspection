import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPool, ensureSchema, getActiveTechnician } from "../../../lib/db";
import { ALL_ITEMS, STATUS_OPTIONS } from "../../../lib/items";
import { readSession } from "../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = readSession(cookies());
  if (!session || !(await getActiveTechnician(session.id))) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    await ensureSchema();
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT id, created_at, technician, site_name, site_address,
              client_contact_name, client_contact_email, client_contact_phone,
              service_pm_name, service_pm_email, service_pm_phone,
              tech_onsite_name, tech_onsite_email, tech_onsite_phone,
              general_notes, items
       FROM inspections ORDER BY created_at DESC LIMIT 200`
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

// Optional free-text fields: trimmed, empty string becomes null so the DB
// and the log view can tell "not provided" apart from "provided but blank".
function optionalText(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

function validate(body) {
  if (!body || typeof body !== "object") return "Invalid request body";
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
  // Technician identity comes from the verified, still-active session,
  // never from the request body — otherwise anyone could submit as someone
  // else, or a deactivated technician's old cookie would keep working.
  const session = readSession(cookies());
  const technician = session && (await getActiveTechnician(session.id));
  if (!technician) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

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
      `INSERT INTO inspections (
         technician, technician_id, site_name, site_address,
         client_contact_name, client_contact_email, client_contact_phone,
         service_pm_name, service_pm_email, service_pm_phone,
         tech_onsite_name, tech_onsite_email, tech_onsite_phone,
         general_notes, items
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id, created_at, technician, site_name, site_address,
                 client_contact_name, client_contact_email, client_contact_phone,
                 service_pm_name, service_pm_email, service_pm_phone,
                 tech_onsite_name, tech_onsite_email, tech_onsite_phone,
                 general_notes, items`,
      [
        technician.name,
        technician.id,
        String(body.site_name).trim(),
        optionalText(body.site_address),
        optionalText(body.client_contact_name),
        optionalText(body.client_contact_email),
        optionalText(body.client_contact_phone),
        optionalText(body.service_pm_name),
        optionalText(body.service_pm_email),
        optionalText(body.service_pm_phone),
        optionalText(body.tech_onsite_name),
        optionalText(body.tech_onsite_email),
        optionalText(body.tech_onsite_phone),
        optionalText(body.general_notes),
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
