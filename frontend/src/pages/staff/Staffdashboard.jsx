import React, { useEffect, useState, useContext } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

/* Back Icon */
const BackIcon = () => (
  <svg width="26" height="26" fill="none" stroke="#6B46C1" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.get("/api/staff/dashboard");
        setDashboard(res.data);
      } catch {
        setError("Unable to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) loadDashboard();
  }, [user?.id]);

  if (loading)
    return <div style={styles.center}>Loading dashboard...</div>;

  if (error)
    return <div style={{ ...styles.center, color: "#C53030" }}>{error}</div>;

  return (
    <>
      {/* Back */}
      <div style={styles.back} onClick={() => navigate(-1)}>
        <BackIcon />
        <span>Back</span>
      </div>

      <main style={styles.container}>
        {/* Header */}
        <h1 style={styles.title}>
          Welcome back, {user?.name || dashboard?.staffName} 👋
        </h1>
        <p style={styles.subtitle}>
          Here’s a quick overview of your work today
        </p>

        {/* Shift Card */}
        <section style={styles.shiftCard}>
          <div>
            <div style={styles.label}>Current Shift</div>
            <div style={styles.shiftTime}>
              {dashboard?.startTime && dashboard?.endTime
                ? `${dashboard.startTime} - ${dashboard.endTime}`
                : "Not Assigned"}
            </div>
            <div style={styles.meta}>
              {dashboard?.daysPerWeek && (
                <div>Days / Week: {dashboard.daysPerWeek}</div>
              )}
              {dashboard?.assignmentStart && (
                <div>
                  Start Date:{" "}
                  {new Date(dashboard.assignmentStart).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          <div style={styles.clientCount}>
            👥 {dashboard?.clientCount || 0}
            <span>Clients</span>
          </div>
        </section>

        {/* Action Cards */}
        <section style={styles.grid}>
          <div style={styles.card} onClick={() => navigate("/staff/clients")}>
            <div style={styles.cardIcon}>📋</div>
            <h3>My Clients</h3>
            <p>View and manage your assigned clients</p>
            <span style={styles.badge}>{dashboard?.clientCount || 0}</span>
          </div>

          <div style={styles.card} onClick={() => navigate("/staff/shifts")}>
            <div style={styles.cardIcon}>⏰</div>
            <h3>My Shifts</h3>
            <p>View your current & previous shifts</p>
          </div>
        </section>

        {/* Tips */}
        <section style={styles.tips}>
          <h4>💡 Quick Tips</h4>
          <ul>
            <li>Use speech-to-text for faster note writing</li>
            <li>Always review your shift timings</li>
            <li>Notes are auto-linked to shifts</li>
          </ul>
        </section>
      </main>
    </>
  );
}

/* ================= STYLES ================= */

const styles = {
  center: {
    padding: 50,
    textAlign: "center",
    fontSize: 18,
  },

  back: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: "20px",
    cursor: "pointer",
    color: "#6B46C1",
    fontWeight: 600,
  },

  container: {
    minHeight: "100vh",
    padding: "20px",
    background: "#F9FAF7",
    fontFamily: "Inter, sans-serif",
    maxWidth: 1100,
    margin: "auto",
  },

  title: {
    fontSize: "clamp(1.8rem, 5vw, 2.5rem)",
    fontWeight: 800,
    color: "#6B46C1",
  },

  subtitle: {
    marginTop: 6,
    marginBottom: 30,
    color: "#6B7280",
    fontSize: 16,
  },

  shiftCard: {
    background: "white",
    borderRadius: 18,
    padding: 24,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
    marginBottom: 30,
  },

  label: {
    fontSize: 14,
    fontWeight: 600,
    color: "#805AD5",
  },

  shiftTime: {
    fontSize: 22,
    fontWeight: 700,
    marginTop: 6,
  },

  meta: {
    marginTop: 10,
    color: "#6B7280",
    fontSize: 14,
  },

  clientCount: {
    background: "#EDE9FE",
    padding: "16px 20px",
    borderRadius: 14,
    fontSize: 22,
    fontWeight: 800,
    color: "#6B46C1",
    textAlign: "center",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 20,
  },

  card: {
    background: "white",
    borderRadius: 18,
    padding: 24,
    position: "relative",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
  },

  cardIcon: {
    fontSize: 32,
    marginBottom: 12,
  },

  badge: {
    position: "absolute",
    top: 16,
    right: 16,
    background: "#6B46C1",
    color: "white",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },

  tips: {
    marginTop: 40,
    background: "#EDE9FE",
    borderRadius: 18,
    padding: 24,
    color: "#4C1D95",
  },
};
