import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPool, ensureSchema } from "../../../../../lib/db";
import { readAdminSession, hashPassword } from "../../../../../lib/auth";

function requireAdmin() {
  return readAdminSession(cookies());
}

// No hard DELETE: inspections reference technicians by id, and deleting a
// technician who has submissions would break that history. Deactivating
// (active=false) blocks login while keeping past submissions intact.
export async function PATCH(request, { params }) {
  if (!requireAdmin()) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid technician id" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 });
  }

  try {
    await ensureSchema();
    const pool = getPool();

    if (typeof body.active === "boolean") {
      const { rows } = await pool.query(
        `UPDATE technicians SET active = $1 WHERE id = $2
         RETURNING id, username, name, active, created_at`,
        [body.active, id]
      );
      if (!rows[0]) {
        return NextResponse.json({ error: "Technician not found" }, { status: 404 });
      }
      return NextResponse.json({ technician: rows[0] });
    }

    if (typeof body.password === "string") {
      if (body.password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }
      const passwordHash = hashPassword(body.password);
      const { rows } = await pool.query(
        `UPDATE technicians SET password_hash = $1 WHERE id = $2
         RETURNING id, username, name, active, created_at`,
        [passwordHash, id]
      );
      if (!rows[0]) {
        return NextResponse.json({ error: "Technician not found" }, { status: 404 });
      }
      return NextResponse.json({ technician: rows[0] });
    }

    return NextResponse.json(
      { error: "Nothing to update — pass `active` or `password`" },
      { status: 400 }
    );
  } catch (err) {
    console.error("PATCH /api/admin/technicians/[id] failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
