import React, { useEffect, useState } from "react";
import api from "../../api/api";

const TABS = ["All Shifts", "Current", "Completed"];

export default function Shifts() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(0);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (!user) throw new Error("Not authenticated");
        const res = await api.get(`/api/staff/${user.id}/shifts/overview`);
        setOverview(res.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load shifts"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  if (loading) return <div style={styles.center}>Loading shifts…</div>;
  if (error) return <div style={{ ...styles.center, color: "#C53030" }}>{error}</div>;
  if (!overview) return null;

  const currentShift = overview.currentShift || {};

  let filtered = overview.shiftHistory;
  if (tab === 1) filtered = filtered.filter(s => s.status === "active");
  if (tab === 2) filtered = filtered.filter(s => s.status === "completed");

  return (
    <div style={styles.page}>
      {/* Back */}
      <div style={styles.back} onClick={() => window.history.back()}>
        <svg width="24" height="24" fill="none" stroke="#6B46C1" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </div>

      <div style={styles.container}>
        <h1 style={styles.title}>My Shifts</h1>
        <p style={styles.subtitle}>Track your work schedule and history</p>

        {/* Summary */}
        <section style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <div style={styles.label}>Current Shift</div>
            <div style={styles.value}>
              {currentShift.startTime
                ? `${currentShift.startTime} - ${currentShift.endTime}`
                : "—"}
            </div>
            <span style={currentShift.status === "active" ? styles.active : styles.completed}>
              {currentShift.status || "—"}
            </span>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.label}>Clients This Week</div>
            <div style={styles.value}>{overview.clientsThisWeek}</div>
            <div style={styles.sub}>unique clients</div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.label}>Notes Recorded</div>
            <div style={styles.value}>{overview.notesRecordedThisWeek}</div>
            <div style={styles.sub}>this week</div>
          </div>
        </section>

        {/* Tabs */}
        <div style={styles.tabs}>
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              style={i === tab ? styles.tabActive : styles.tab}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Shift History */}
        <section style={styles.list}>
          {filtered.length === 0 && (
            <div style={styles.empty}>No shifts found</div>
          )}

          {filtered.map(shift => (
            <div key={shift._id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.date}>
                  {shift.date
                    ? new Date(shift.date).toLocaleDateString()
                    : "—"}
                </div>
                <span style={shift.status === "active" ? styles.active : styles.completed}>
                  {shift.status}
                </span>
              </div>

              <div style={styles.time}>
                {shift.startTime} – {shift.endTime}
                {shift.durationHours && (
                  <span style={styles.duration}>
                    ({shift.durationHours}h)
                  </span>
                )}
              </div>

              <div style={styles.clientsLabel}>
                Assigned Clients ({shift.assignedClients.length})
              </div>

              {shift.assignedClients.map(client => (
                <div key={client._id} style={styles.client}>
                  👤 {client.name}
                  <span style={styles.noteBadge}>
                    {client.notesRecorded} note
                    {client.notesRecorded !== 1 && "s"}
                  </span>
                </div>
              ))}

              <div style={styles.footer}>
                <span>Clients: <b>{shift.assignedClients.length}</b></span>
                <span>Notes: <b>{shift.notesCount}</b></span>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    background: "#F9FAF7",
    minHeight: "100vh",
    fontFamily: "Inter, sans-serif",
  },

  back: {
    position: "sticky",
    top: 0,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 20,
    cursor: "pointer",
    color: "#6B46C1",
    fontWeight: 600,
    background: "#F9FAF7",
    zIndex: 10,
  },

  container: {
    maxWidth: 1100,
    margin: "auto",
    padding: "10px 20px 40px",
  },

  title: {
    fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
    fontWeight: 800,
    color: "#6B46C1",
  },

  subtitle: {
    color: "#6B7280",
    marginBottom: 24,
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 20,
    marginBottom: 30,
  },

  summaryCard: {
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
  },

  label: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: 600,
  },

  value: {
    fontSize: 22,
    fontWeight: 800,
    marginTop: 6,
  },

  sub: {
    fontSize: 13,
    color: "#A78BFA",
  },

  active: {
    display: "inline-block",
    background: "#DCFCE7",
    color: "#166534",
    padding: "4px 12px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    marginTop: 8,
  },

  completed: {
    display: "inline-block",
    background: "#E5E7EB",
    color: "#374151",
    padding: "4px 12px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    marginTop: 8,
  },

  tabs: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
    flexWrap: "wrap",
  },

  tab: {
    background: "#fff",
    border: "1px solid #E5E7EB",
    padding: "8px 16px",
    borderRadius: 999,
    cursor: "pointer",
    fontWeight: 600,
    color: "#6B7280",
  },

  tabActive: {
    background: "#6B46C1",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: 999,
    cursor: "pointer",
    fontWeight: 700,
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },

  card: {
    background: "#fff",
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  date: {
    fontWeight: 700,
  },

  time: {
    marginTop: 6,
    color: "#6B7280",
  },

  duration: {
    marginLeft: 6,
  },

  clientsLabel: {
    marginTop: 14,
    fontWeight: 700,
    color: "#A78BFA",
  },

  client: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 6,
    fontSize: 14,
  },

  noteBadge: {
    background: "#EDE9FE",
    color: "#6B46C1",
    padding: "2px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },

  footer: {
    marginTop: 14,
    display: "flex",
    gap: 20,
    color: "#6B7280",
    fontSize: 14,
  },

  center: {
    padding: 60,
    textAlign: "center",
    fontSize: 18,
  },

  empty: {
    textAlign: "center",
    color: "#A78BFA",
    padding: 40,
    fontSize: 18,
  },
};
