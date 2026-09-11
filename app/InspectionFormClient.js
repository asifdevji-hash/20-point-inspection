"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

const BLANK_SITE_INFO = {
  siteName: "",
  siteAddress: "",
  clientContactEmail: "",
  clientContactPhone: "",
  servicePmEmail: "",
  servicePmPhone: "",
  techOnsiteEmail: "",
  techOnsitePhone: "",
  generalNotes: "",
};

export default function InspectionForm({ technicianName }) {
  const router = useRouter();
  const [siteInfo, setSiteInfo] = useState(BLANK_SITE_INFO);
  const [itemState, setItemState] = useState(initialItemState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function setField(field, value) {
    setSiteInfo((prev) => ({ ...prev, [field]: value }));
  }

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
    setSiteInfo(BLANK_SITE_INFO);
    setItemState(initialItemState());
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!siteInfo.siteName.trim()) {
      setError("Site name is required.");
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
          site_name: siteInfo.siteName,
          site_address: siteInfo.siteAddress,
          client_contact_email: siteInfo.clientContactEmail,
          client_contact_phone: siteInfo.clientContactPhone,
          service_pm_email: siteInfo.servicePmEmail,
          service_pm_phone: siteInfo.servicePmPhone,
          tech_onsite_email: siteInfo.techOnsiteEmail,
          tech_onsite_phone: siteInfo.techOnsitePhone,
          general_notes: siteInfo.generalNotes,
          items,
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push("/login");
        return;
      }
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
          <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
            Log out
          </a>
        </nav>
      </header>

      <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 12 }}>
        Signed in as <strong>{technicianName}</strong>
      </div>

      {error && <div className="msg error">{error}</div>}
      {success && (
        <div className="msg success">Inspection submitted. Form has been reset.</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="section-title" style={{ marginTop: 0 }}>Site Information</div>

          <label htmlFor="site">Site name</label>
          <input
            id="site"
            type="text"
            value={siteInfo.siteName}
            onChange={(e) => setField("siteName", e.target.value)}
            placeholder="Site or customer name"
          />

          <label htmlFor="site-address">Service site address</label>
          <input
            id="site-address"
            type="text"
            value={siteInfo.siteAddress}
            onChange={(e) => setField("siteAddress", e.target.value)}
            placeholder="Street, city, state, zip"
          />

          <div className="contact-group-label">Client / Site Contact Info</div>
          <div className="field-row">
            <div>
              <label htmlFor="client-email">Email</label>
              <input
                id="client-email"
                type="email"
                value={siteInfo.clientContactEmail}
                onChange={(e) => setField("clientContactEmail", e.target.value)}
                placeholder="client@example.com"
              />
            </div>
            <div>
              <label htmlFor="client-phone">Phone</label>
              <input
                id="client-phone"
                type="tel"
                value={siteInfo.clientContactPhone}
                onChange={(e) => setField("clientContactPhone", e.target.value)}
                placeholder="(555) 555-5555"
              />
            </div>
          </div>

          <div className="contact-group-label">Prospect Solar Service PM</div>
          <div className="field-row">
            <div>
              <label htmlFor="pm-email">Email</label>
              <input
                id="pm-email"
                type="email"
                value={siteInfo.servicePmEmail}
                onChange={(e) => setField("servicePmEmail", e.target.value)}
                placeholder="pm@prospectsolar.com"
              />
            </div>
            <div>
              <label htmlFor="pm-phone">Phone</label>
              <input
                id="pm-phone"
                type="tel"
                value={siteInfo.servicePmPhone}
                onChange={(e) => setField("servicePmPhone", e.target.value)}
                placeholder="(555) 555-5555"
              />
            </div>
          </div>

          <div className="contact-group-label">Prospect Solar Tech Onsite</div>
          <div className="field-row">
            <div>
              <label htmlFor="tech-email">Email</label>
              <input
                id="tech-email"
                type="email"
                value={siteInfo.techOnsiteEmail}
                onChange={(e) => setField("techOnsiteEmail", e.target.value)}
                placeholder="tech@prospectsolar.com"
              />
            </div>
            <div>
              <label htmlFor="tech-phone">Phone</label>
              <input
                id="tech-phone"
                type="tel"
                value={siteInfo.techOnsitePhone}
                onChange={(e) => setField("techOnsitePhone", e.target.value)}
                placeholder="(555) 555-5555"
              />
            </div>
          </div>

          <label htmlFor="general-notes">General notes (optional)</label>
          <textarea
            id="general-notes"
            value={siteInfo.generalNotes}
            onChange={(e) => setField("generalNotes", e.target.value)}
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
