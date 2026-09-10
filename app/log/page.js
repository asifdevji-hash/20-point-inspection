"use client";

import { useEffect, useState } from "react";
import { ALL_ITEMS } from "../../lib/items";

function statusClass(status) {
  if (status === "Pass") return "pass-tag";
  if (status === "Flag") return "flag-tag";
  return "na-tag";
}

function InspectionRow({ inspection }) {
  const [open, setOpen] = useState(false);
  const flagged = (inspection.items || []).filter((i) => i.status === "Flag").length;

  return (
    <div className="log-row" onClick={() => setOpen((o) => !o)}>
      <div className="log-row-summary">
        <div>
          <div className="site">{inspection.site_name}</div>
          <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
            {inspection.technician}
            {flagged > 0 && (
              <span className="flag-tag"> · {flagged} flagged</span>
            )}
          </div>
        </div>
        <div className="date">
          {new Date(inspection.created_at).toLocaleString()}
        </div>
      </div>

      {open && (
        <div className="log-detail">
          {inspection.general_notes && (
            <p style={{ marginTop: 0 }}>
              <strong>Notes:</strong> {inspection.general_notes}
            </p>
          )}
          {(inspection.items || []).map((item) => {
            const meta = ALL_ITEMS.find((i) => i.id === item.id);
            if (!item.status && !item.notes && !item.photo) return null;
            return (
              <div className="log-item-row" key={item.id}>
                <div>
                  <div>
                    {item.id}. {meta ? meta.label : "Unknown item"}{" "}
                    {item.status && (
                      <span className={statusClass(item.status)}>
                        [{item.status}]
                      </span>
                    )}
                  </div>
                  {item.notes && (
                    <div style={{ color: "#4b5563" }}>{item.notes}</div>
                  )}
                  {item.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="photo-thumb"
                      style={{ marginTop: 6 }}
                      src={item.photo}
                      alt=""
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LogPage() {
  const [inspections, setInspections] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/inspections")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setInspections(data.inspections || []);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <header className="top">
        <h1>Inspection Log</h1>
        <nav>
          <a href="/">New inspection</a>
        </nav>
      </header>

      {error && <div className="msg error">{error}</div>}

      <div className="card" style={{ padding: inspections?.length ? 0 : 16 }}>
        {inspections === null && !error && (
          <div className="empty-state">Loading…</div>
        )}
        {inspections?.length === 0 && (
          <div className="empty-state">No inspections submitted yet.</div>
        )}
        {inspections?.map((inspection) => (
          <div key={inspection.id} style={{ padding: "0 16px" }}>
            <InspectionRow inspection={inspection} />
          </div>
        ))}
      </div>
    </div>
  );
}
