"use client";

import { useState } from "react";
import { SECTIONS, STATUS_OPTIONS } from "../lib/items";

const MAX_DIMENSION = 1000;
const JPEG_QUALITY = 0.6;

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function initialItemState() {
  const state = {};
  SECTIONS.forEach((section) => {
    section.items.forEach((item) => {
      state[item.id] = { status: null, notes: "", photo: null };
    });
  });
  return state;
}

export default function InspectionForm() {
  const [technician, setTechnician] = useState("");
  const [siteName, setSiteName] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [itemState, setItemState] = useState(initialItemState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function setStatus(id, status) {
    setItemState((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: prev[id].status === status ? null : status },
    }));
  }

  function setNotes(id, notes) {
    setItemState((prev) => ({ ...prev, [id]: { ...prev[id], notes } }));
  }

  async function handlePhoto(id, file) {
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      setItemState((prev) => ({ ...prev, [id]: { ...prev[id], photo: dataUrl } }));
    } catch {
      setError("Couldn't process that photo. Try a different one.");
    }
  }

  function removePhoto(id) {
    setItemState((prev) => ({ ...prev, [id]: { ...prev[id], photo: null } }));
  }

  function resetForm() {
    setTechnician("");
    setSiteName("");
    setGeneralNotes("");
    setItemState(initialItemState());
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!technician.trim() || !siteName.trim()) {
      setError("Technician and site name are required.");
      return;
    }

    const items = Object.entries(itemState).map(([id, v]) => ({
      id: Number(id),
      status: v.status,
      notes: v.notes,
      photo: v.photo,
    }));

    setSubmitting(true);
    try {
      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technician,
          site_name: siteName,
          general_notes: generalNotes,
          items,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit inspection");
      }
      setSuccess(true);
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <header className="top">
        <h1>20-Point Inspection</h1>
        <nav>
          <a href="/log">View log</a>
        </nav>
      </header>

      {error && <div className="msg error">{error}</div>}
      {success && (
        <div className="msg success">Inspection submitted. Form has been reset.</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <label htmlFor="technician">Technician</label>
          <input
            id="technician"
            type="text"
            value={technician}
            onChange={(e) => setTechnician(e.target.value)}
            placeholder="Your name"
          />

          <label htmlFor="site">Site name</label>
          <input
            id="site"
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="Site or customer name"
          />

          <label htmlFor="general-notes">General notes (optional)</label>
          <textarea
            id="general-notes"
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            placeholder="Anything worth noting about the site or visit overall"
          />
        </div>

        {SECTIONS.map((section) => (
          <div className="card" key={section.name}>
            <div className="section-title">{section.name}</div>
            {section.items.map((item) => {
              const state = itemState[item.id];
              return (
                <div className="item" key={item.id}>
                  <div className="item-label">
                    {item.id}. {item.label}
                    {item.notify && <span className="notify-badge">NOTIFY</span>}
                  </div>
                  <div className="status-row">
                    {STATUS_OPTIONS.map((opt) => {
                      const cls =
                        opt === "Pass" ? "pass" : opt === "Flag" ? "flag" : "na";
                      return (
                        <button
                          type="button"
                          key={opt}
                          className={`status-btn ${cls}${
                            state.status === opt ? " active" : ""
                          }`}
                          onClick={() => setStatus(item.id, opt)}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  <textarea
                    placeholder="Result / recommendation (optional)"
                    value={state.notes}
                    onChange={(e) => setNotes(item.id, e.target.value)}
                  />
                  <div className="photo-row">
                    {state.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="photo-thumb" src={state.photo} alt="" />
                    )}
                    <label className="file-btn" style={{ margin: 0 }}>
                      {state.photo ? "Replace photo" : "Add photo"}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: "none" }}
                        onChange={(e) => handlePhoto(item.id, e.target.files?.[0])}
                      />
                    </label>
                    {state.photo && (
                      <button
                        type="button"
                        className="file-btn"
                        onClick={() => removePhoto(item.id)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div className="submit-bar">
          <button className="submit-btn" type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit Inspection"}
          </button>
        </div>
      </form>
    </div>
  );
}
