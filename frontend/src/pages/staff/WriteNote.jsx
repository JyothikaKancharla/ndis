import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../api/api";

// --- Styles ---
const styles = {
  page: {
    background: "#F8F9ED",
    minHeight: "100vh",
    fontFamily: "Inter, Poppins, Roboto, Arial, sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 2px 8px #E0E7EF",
    padding: 32,
    maxWidth: 480,
    width: "100%"
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 18
  },
  backBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    marginRight: 4
  },
  pageTitle: {
    fontWeight: 500,
    fontSize: 22,
    color: "#2E2E2E",
    margin: 0
  },
  sectionLabel: {
    color: "#6B6B6B",
    fontSize: 15,
    marginBottom: 10
  },
  category: {
    color: "#B8A6D9",
    fontWeight: 500
  },
  textarea: {
    width: "100%",
    minHeight: 120,
    borderRadius: 8,
    border: "1.5px solid #B8A6D9",
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    background: "#F8F9ED",
    color: "#2E2E2E"
  },
  actionRow: {
    display: "flex",
    gap: 16
  },
  cancelBtn: {
    background: "#fff",
    color: "#B8A6D9",
    border: "1.5px solid #B8A6D9",
    borderRadius: 8,
    padding: "10px 24px",
    fontWeight: 500,
    fontSize: 16,
    cursor: "pointer"
  },
  saveBtn: {
    background: "#B8A6D9",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 24px",
    fontWeight: 600,
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6
  },
  error: {
    color: "#C53030",
    marginBottom: 12,
    fontSize: 15
  }
};

const WriteNote = () => {
  const { id: clientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { category } = location.state || {};
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await api.post(`/api/staff/clients/${clientId}/notes`, {
        clientId,
        category,
        content: note,
        noteType: "text",
        status: "Pending"
      });
      navigate(-1); // Go back to client notes page
    } catch (err) {
      setError("Failed to save note");
    }
    setSaving(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, cursor: "pointer", width: "fit-content" }} onClick={() => navigate(-1)}>
          <svg width="28" height="28" fill="none" stroke="#805AD5" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ color: "#B8A6D9", fontWeight: 500, fontSize: 16 }}>Back</span>
        </div>
        <div style={styles.headerRow}>
          <h2 style={styles.pageTitle}>Write Note</h2>
        </div>
        <div style={styles.sectionLabel}>Category: <span style={styles.category}>{category}</span></div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={`Type your observation for ${category}...`}
          style={styles.textarea}
        />
        {error && <div style={styles.error}>{error}</div>}
        <div style={styles.actionRow}>
          <button onClick={() => navigate(-1)} style={styles.cancelBtn}>Cancel</button>
          <button onClick={handleSave} style={styles.saveBtn} disabled={saving || !note.trim()}>
            <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg> Save Note
          </button>
        </div>
      </div>
	</div>
  );
}

export default WriteNote;
