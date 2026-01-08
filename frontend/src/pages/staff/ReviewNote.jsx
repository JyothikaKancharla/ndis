import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";




const ReviewNote = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clientId, noteId, id } = useParams();
  // Support both /:id/review-note and /:clientId/review-note/:noteId
  const resolvedClientId = clientId || id;
  const resolvedNoteId = noteId;
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
    maxWidth: 540,
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
    fontSize: 24,
    color: "#2E2E2E",
    margin: 0
  },
  sectionDesc: {
    color: "#6B6B6B",
    fontSize: 15,
    marginBottom: 16
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 18
  },
  infoLabel: {
    fontWeight: 500,
    color: "#805AD5",
    fontSize: 14
  },
  infoValue: {
    fontWeight: 500,
    fontSize: 16,
    color: "#2E2E2E"
  },
  infoSub: {
    color: "#B8A6D9",
    fontSize: 13,
    marginBottom: 4
  },
  categoryPill: {
    background: "#F8F9ED",
    color: "#805AD5",
    borderRadius: 8,
    padding: "2px 10px",
    fontWeight: 500,
    fontSize: 13,
    marginRight: 8
  },
  statusPill: {
    background: "#FDF6D6",
    color: "#B7791F",
    borderRadius: 8,
    padding: "2px 10px",
    fontWeight: 500,
    fontSize: 13
  },
  sectionLabel: {
    fontWeight: 500,
    color: "#805AD5",
    fontSize: 15,
    marginBottom: 6
  },
  textarea: {
    width: "100%",
    borderRadius: 8,
    border: "1.5px solid #B8A6D9",
    padding: 10,
    fontSize: 15,
    marginBottom: 12,
    background: "#F8F9ED"
  },
  observationBox: {
    minHeight: 60,
    background: "#fff",
    borderRadius: 8,
    border: "1px solid #E6E6FA",
    padding: "10px 12px",
    fontSize: 16,
    marginBottom: 12
  },
  infoBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#F8F9ED",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 14,
    color: "#805AD5",
    marginBottom: 12
  },
  error: {
    color: "#C53030",
    marginBottom: 12,
    fontSize: 15
  },
  actionRow: {
    display: "flex",
    gap: 16,
    marginTop: 8
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
  editBtn: {
    background: "#fff",
    color: "#B8A6D9",
    border: "1.5px solid #B8A6D9",
    borderRadius: 8,
    padding: "10px 24px",
    fontWeight: 500,
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6
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
  }
};
  const { transcript, category: stateCategory, client: stateClient, user: stateUser, noteType, allowEdit } = location.state || {};
  const [editMode, setEditMode] = useState(false);
  const [note, setNote] = useState(transcript || "");
  const [category, setCategory] = useState(stateCategory || "");
  const [client, setClient] = useState(stateClient || null);
  const [user, setUser] = useState(stateUser || null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [allowEditNote, setAllowEdit] = useState(allowEdit !== false);

  // Fetch note and client if not provided
  useEffect(() => {
    async function fetchNoteAndClient() {
      // If no noteId, but transcript exists in location.state, allow review for new note
      if (!resolvedNoteId) {
        if (location.state && location.state.transcript) {
          setNote(location.state.transcript);
          setCategory(location.state.category || "");
          setClient(location.state.client || null);
          setError("");
          // Enable editing for new notes
          setAllowEdit(true);
          return;
        } else {
          setError("Invalid note link. No note ID provided.");
          return;
        }
      }
      if ((!transcript && resolvedNoteId) || !client) {
        setLoading(true);
        try {
          // Fetch note
          const noteRes = await api.get(`/api/staff/notes/${resolvedNoteId}`);
          setNote(noteRes.data.content || "");
          setCategory(noteRes.data.category || "");
          // Fetch client
          const clientRes = await api.get(`/api/staff/clients/${noteRes.data.clientId || resolvedClientId}`);
          setClient(clientRes.data);
        } catch (err) {
          if (err.response && err.response.status === 404) {
            setError("Note not found. It may have been deleted or the link is invalid.");
          } else {
            setError("Failed to load note or client info");
          }
        }
        setLoading(false);
      }
    }
    fetchNoteAndClient();
    // eslint-disable-next-line
  }, [resolvedNoteId, resolvedClientId]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    // Use resolvedClientId for new notes
    const postClientId = clientId || resolvedClientId;
    try {
      await api.post(`/api/staff/clients/${postClientId}/notes`, {
        clientId: postClientId,
        category,
        content: note,
        noteType: noteType || "voice",
        status: "Pending"
      });
      navigate(`/staff/clients/${postClientId}/notes`, { state: { category } });
    } catch (err) {
      setError("Failed to save note");
    }
    setSaving(false);
  };

  if (loading) return <div style={styles.page}><div style={styles.card}>Loading...</div></div>;
  if (error) return <div style={styles.page}><div style={styles.card}><div style={styles.error}>{error}</div><button onClick={() => navigate(-1)} style={styles.cancelBtn}>Back</button></div></div>;
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <button onClick={() => navigate(-1)} style={styles.backBtn} aria-label="Back to Notes">
            <svg width="22" height="22" fill="none" stroke="#B8A6D9" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h2 style={styles.pageTitle}>Review Note</h2>
        </div>
        <div style={styles.sectionDesc}>Please review the transcribed note below. Make any necessary corrections before saving.</div>
        <div style={styles.infoRow}>
          <div>
            <div style={styles.infoLabel}>Client</div>
            <div style={styles.infoValue}>{client?.name || "-"}</div>
            <div style={styles.infoSub}>ID: {client?.code || resolvedClientId}</div>
            <span style={styles.categoryPill}>{category}</span>
            <span style={styles.statusPill}>Pending Review</span>
          </div>
          <div>
            <div style={styles.infoLabel}>Recorded By</div>
            <div style={styles.infoValue}>{user?.name || "Staff"}</div>
            <div style={styles.infoSub}>{new Date().toLocaleString()}</div>
          </div>
        </div>
        <div style={styles.sectionLabel}>Observation</div>
        {editMode ? (
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={5}
            style={styles.textarea}
          />
        ) : (
          <div style={styles.observationBox}>{note}</div>
        )}
        <div style={styles.infoBox}>
          <svg width="18" height="18" fill="none" stroke="#B8A6D9" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          <span>Review the transcribed text carefully. You can edit any inaccuracies before saving to the client's record.</span>
        </div>
        {error && <div style={styles.error}>{error}</div>}
        <div style={styles.actionRow}>
          <button onClick={() => navigate(-1)} style={styles.cancelBtn}>Cancel</button>
          {!editMode && allowEditNote && (
            <button onClick={() => setEditMode(true)} style={styles.editBtn}>
              <svg width="16" height="16" fill="none" stroke="#B8A6D9" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 1 1 2.828 2.828L11.828 15.828a2 2 0 0 1-2.828 0L9 13z"/></svg> Edit Note
            </button>
          )}
          <button onClick={handleSave} style={styles.saveBtn} disabled={saving || !note.trim()}>
            <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg> Save Note
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReviewNote;
