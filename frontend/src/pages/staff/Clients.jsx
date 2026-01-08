import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";

/* ================= ICONS ================= */

const BackIcon = () => (
  <svg width="24" height="24" fill="none" stroke="#6B46C1" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const UserIcon = () => (
  <svg width="26" height="26" fill="none" stroke="#A78BFA" strokeWidth="1.5" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-2.5 3.5-4.5 8-4.5s8 2 8 4.5" strokeLinecap="round" />
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" fill="none" stroke="#A78BFA" strokeWidth="1.5" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" strokeLinecap="round" />
  </svg>
);

/* ================= PRIORITY COLORS ================= */

const priorityColors = {
  High: { bg: "#FEE2E2", color: "#B91C1C" },
  Medium: { bg: "#FEF3C7", color: "#92400E" },
  Normal: { bg: "#DCFCE7", color: "#166534" },
};

/* ================= COMPONENT ================= */

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (!user) throw new Error("Not authenticated");
        const res = await api.get(`/api/staff/${user.id}/clients`);
        setClients(res.data);
        setFiltered(res.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load clients");
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  useEffect(() => {
    if (!search) {
      setFiltered(clients);
    } else {
      setFiltered(
        clients.filter(
          c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            (c.code && c.code.toLowerCase().includes(search.toLowerCase()))
        )
      );
    }
  }, [search, clients]);

  if (loading) return <div style={styles.center}>Loading clients…</div>;
  if (error) return <div style={{ ...styles.center, color: "#C53030" }}>{error}</div>;

  return (
    <div style={styles.page}>
      {/* Back */}
      <div style={styles.back} onClick={() => navigate(-1)}>
        <BackIcon />
        Back
      </div>

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>My Clients</h1>
          <span style={styles.count}>{filtered.length} assigned</span>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by name or ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={styles.search}
        />

        {/* Clients Grid */}
        <section style={styles.grid}>
          {filtered.map(client => {
            const p = priorityColors[client.priority] || priorityColors.Normal;

            return (
              <div
                key={client._id}
                style={styles.card}
                tabIndex={0}
                onClick={() => navigate(`/staff/clients/${client._id}`)}
              >
                {/* Card Header */}
                <div style={styles.cardHeader}>
                  <div style={styles.avatar}>
                    <UserIcon />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.name}>{client.name}</div>
                    <div style={styles.code}>ID: {client.code}</div>
                  </div>
                  <span style={{ ...styles.priority, background: p.bg, color: p.color }}>
                    {client.priority}
                  </span>
                </div>

                {/* Details */}
                <div style={styles.row}>
                  <b>Care Level:</b> {client.careLevel || "—"}
                </div>
                <div style={styles.row}>
                  <b>Care Plan:</b> {client.carePlan || "—"}
                </div>
                <div style={styles.row}>
                  <b>Medical Notes:</b> {client.medicalNotes || "—"}
                </div>

                <div style={styles.row}>
                  <ClockIcon />
                  <span>
                    Last note: <b>{client.lastNote?.time || "—"}</b>
                  </span>
                </div>

                {/* Action */}
                <button
                  style={styles.notesBtn}
                  onClick={e => {
                    e.stopPropagation();
                    navigate(`/staff/clients/${client._id}/notes`);
                  }}
                >
                  Open Notes
                </button>
              </div>
            );
          })}
        </section>

        {/* Footer */}
        <div style={styles.footer}>
          Showing {filtered.length} of {clients.length} clients
        </div>
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
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 20,
    cursor: "pointer",
    fontWeight: 600,
    color: "#6B46C1",
  },

  container: {
    maxWidth: 1100,
    margin: "auto",
    padding: "0 20px 40px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
    fontWeight: 800,
    color: "#6B46C1",
  },

  count: {
    background: "#6B46C1",
    color: "#fff",
    padding: "6px 14px",
    borderRadius: 999,
    fontWeight: 700,
    fontSize: 14,
  },

  search: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #E5E7EB",
    marginBottom: 24,
    fontSize: 16,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 20,
  },

  card: {
    background: "#fff",
    borderRadius: 18,
    padding: 20,
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
    transition: "transform 0.15s ease",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "#EDE9FE",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  name: {
    fontWeight: 700,
    fontSize: 18,
  },

  code: {
    fontSize: 13,
    color: "#6B7280",
  },

  priority: {
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },

  row: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    fontSize: 14,
    color: "#374151",
  },

  notesBtn: {
    marginTop: 14,
    width: "100%",
    padding: "10px",
    borderRadius: 12,
    border: "none",
    background: "#6B46C1",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },

  footer: {
    textAlign: "center",
    marginTop: 30,
    color: "#6B7280",
  },

  center: {
    padding: 60,
    textAlign: "center",
    fontSize: 18,
  },
};
