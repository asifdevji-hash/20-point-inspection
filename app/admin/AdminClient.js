"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminClient() {
  const router = useRouter();
  const [technicians, setTechnicians] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setError("");
    const res = await fetch("/api/admin/technicians");
    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load technicians");
      return;
    }
    setTechnicians(data.technicians);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/technicians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, name, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add technician");
      setUsername("");
      setName("");
      setPassword("");
      setNotice(`Added ${data.technician.name} (username: ${data.technician.username})`);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(tech) {
    setError("");
    setNotice("");
    const res = await fetch(`/api/admin/technicians/${tech.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !tech.active }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to update technician");
      return;
    }
    load();
  }

  async function resetPassword(tech) {
    const newPassword = window.prompt(
      `New password for ${tech.name} (min 8 characters):`
    );
    if (!newPassword) return;
    setError("");
    setNotice("");
    const res = await fetch(`/api/admin/technicians/${tech.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to reset password");
      return;
    }
    setNotice(`Password reset for ${tech.name}`);
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="page">
      <header className="top">
        <h1>Technician Admin</h1>
        <nav>
          <a href="/">Form</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
            Log out
          </a>
        </nav>
      </header>

      {error && <div className="msg error">{error}</div>}
      {notice && <div className="msg success">{notice}</div>}

      <div className="card">
        <div className="section-title" style={{ marginTop: 0 }}>Add technician</div>
        <form onSubmit={handleAdd}>
          <label htmlFor="new-name">Full name</label>
          <input id="new-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jordan Lee" />

          <label htmlFor="new-username">Username</label>
          <input id="new-username" type="text" autoCapitalize="none" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. jlee" />

          <label htmlFor="new-password">Initial password</label>
          <input id="new-password" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />

          <button className="submit-btn" type="submit" disabled={submitting}>
            {submitting ? "Adding…" : "Add technician"}
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: technicians?.length ? 0 : 16 }}>
        <div className="section-title" style={{ margin: "16px 16px 8px" }}>
          Technicians
        </div>
        {technicians === null && !error && <div className="empty-state">Loading…</div>}
        {technicians?.length === 0 && <div className="empty-state">No technicians yet.</div>}
        {technicians?.map((tech) => (
          <div key={tech.id} className="log-row" style={{ padding: "12px 16px" }}>
            <div className="log-row-summary">
              <div>
                <div className="site">{tech.name}</div>
                <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                  @{tech.username} · {tech.active ? (
                    <span className="pass-tag">active</span>
                  ) : (
                    <span className="flag-tag">deactivated</span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="file-btn" onClick={() => resetPassword(tech)}>
                  Reset password
                </button>
                <button className="file-btn" onClick={() => toggleActive(tech)}>
                  {tech.active ? "Deactivate" : "Reactivate"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
