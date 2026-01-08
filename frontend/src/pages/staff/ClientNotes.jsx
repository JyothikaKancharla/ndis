import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../api/api";
import { AuthContext } from "../../context/AuthContext";


// Outline icons (Heroicons/Material) for categories
const CategoryIcons = {
  Bathing: (
    <svg width="22" height="22" fill="none" stroke="#B8A6D9" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M7 17a5 5 0 0 1 10 0v1a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3v-1z"/><path d="M12 3v7"/><circle cx="12" cy="3" r="1.5"/></svg>
  ),
  Medication: (
    <svg width="22" height="22" fill="none" stroke="#B8A6D9" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V3"/><circle cx="12" cy="7" r="2"/></svg>
  ),
  Eating: (
    <svg width="22" height="22" fill="none" stroke="#B8A6D9" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 10h16M9 21V10m6 11V10"/></svg>
  ),
  "Emotional State": (
    <svg width="22" height="22" fill="none" stroke="#B8A6D9" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9z"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/></svg>
  ),
  "Movement/Mobility": (
    <svg width="22" height="22" fill="none" stroke="#B8A6D9" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
  ),
  "General Observation": (
    <svg width="22" height="22" fill="none" stroke="#B8A6D9" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
  ),
  Other: (
    <svg width="22" height="22" fill="none" stroke="#B8A6D9" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8h8M8 12h8M8 16h4"/></svg>
  )
};
const NOTE_CATEGORIES = [
  { key: "Bathing", label: "Bathing", desc: "Hygiene and bathing activities", color: "#B8A6D9", bg: "#F8F9ED" },
  { key: "Medication", label: "Medication", desc: "Medication administration", color: "#B8A6D9", bg: "#F8F9ED" },
  { key: "Eating", label: "Eating", desc: "Meal and nutrition intake", color: "#B8A6D9", bg: "#F8F9ED" },
  { key: "Emotional State", label: "Emotional State", desc: "Mood and emotional observations", color: "#B8A6D9", bg: "#F8F9ED" },
  { key: "Movement/Mobility", label: "Movement/Mobility", desc: "Physical activity and mobility", color: "#B8A6D9", bg: "#F8F9ED" },
  { key: "General Observation", label: "General Observation", desc: "Other observations", color: "#B8A6D9", bg: "#F8F9ED" },
  { key: "Other", label: "Other", desc: "Other category not listed above", color: "#B8A6D9", bg: "#F8F9ED" }
];
const statusColors = {
  Approved: "#22C55E",
  Pending: "#F59E42",
  Rejected: "#EF4444",
  Draft: "#64748B"
};

const ClientNotes = () => {
    const { id: clientId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext);
    const [showVoiceModal, setShowVoiceModal] = React.useState(false);
    const [showWriteModal, setShowWriteModal] = useState(false);
    const [recording, setRecording] = React.useState(false);
    const [transcript, setTranscript] = React.useState("");
    const [editText, setEditText] = React.useState("");
    const [error, setError] = React.useState("");
    const recognitionRef = React.useRef(null);
    const isSpeechRecognitionSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    // State for Previous Notes modal
    const [showPrevNotes, setShowPrevNotes] = useState(false);
    const [noteFilter, setNoteFilter] = useState("week"); // 'week', 'month', 'year', 'all'
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState("");
    const [category, setCategory] = useState(() => (location.state && location.state.category) || "General Observation");
    const [client, setClient] = useState(null);

    useEffect(() => {
      const fetchClient = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/api/staff/clients/${clientId}`);
          setClient(res.data);
          setLoading(false);
        } catch (err) {
          setError("Failed to load client info");
          setLoading(false);
        }
      };
      const fetchNotes = async () => {
        try {
          const res = await api.get(`/api/staff/clients/${clientId}/notes?period=${noteFilter}`);
          setNotes(res.data);
        } catch (err) {
          setError("Failed to load notes");
        }
      };
      fetchClient();
      fetchNotes();
    }, [clientId, noteFilter]);

    const handleEdit = (note) => {
      setEditingId(note._id);
      setEditContent(note.content);
    };

    const handleEditSave = async () => {
      try {
        await api.put(`/api/staff/notes/${editingId}`, { content: editContent });
        setNotes(notes.map(n => n._id === editingId ? { ...n, content: editContent, draft: false } : n));
        setEditingId(null);
        setEditContent("");
      } catch (err) {
        setError("Failed to update note");
      }
    };

    const handleStartRecording = () => {
      if (!isSpeechRecognitionSupported) return;
      setTranscript("");
      setEditText("");
      setRecording(true);
      setError("");
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.onresult = (event) => {
        let interim = "";
        let final = "";
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setTranscript(final + interim);
        setEditText(final + interim);
      };
      recognition.onerror = (event) => {
        setError('Speech recognition error: ' + event.error);
        setRecording(false);
      };
      recognition.onend = () => {
        setRecording(false);
      };
      recognitionRef.current = recognition;
      recognition.start();
    };

    const handleStopRecording = () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setRecording(false);
      // Ensure category is never empty
      const safeCategory = category && category.trim() !== "" ? category : "General Observation";
      // Navigate to review page after stopping
      navigate(`/staff/clients/${clientId}/review-note`, {
        state: {
          transcript,
          client: location.state?.client,
          user,
          noteType: "voice",
          allowEdit: false,
          category: safeCategory
        }
      });
    };

    const handleSaveAndReview = () => {
      if (recording) handleStopRecording();
      const safeCategory = category && category.trim() !== "" ? category : "General Observation";
      navigate(`/staff/clients/${clientId}/review-note`, {
        state: {
          transcript: editText,
          client: location.state?.client,
          user,
          noteType: "voice",
          allowEdit: false,
          category: safeCategory
        }
      });
    };

    if (loading) return <div style={styles.loading}>Loading...</div>;
    // Only show error if not a 403 supervisor error (which staff should not see)
    if (error && !error.includes('403')) return <div style={styles.error}>{error}</div>;
    if (!client) return <div style={styles.error}>No client found.</div>;


    // Notes are now filtered by backend, so just use notes as-is
    const filteredNotes = notes;

    return (
      <div style={styles.page}>
        {/* Header */}
        <div style={styles.headerRow}>
          <button onClick={() => navigate(-1)} style={styles.backBtn} aria-label="Back to Clients">
            <svg width="22" height="22" fill="none" stroke="#B8A6D9" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h1 style={styles.pageTitle}>Client Notes</h1>
        </div>
        {/* Client Info Card */}
        <div style={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginRight: 12, display: 'flex', alignItems: 'center' }} aria-label="Back">
              {/* Material Icon: arrow_back */}
              <svg width="28" height="28" fill="none" stroke="#805AD5" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F8F9ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="40" height="40" fill="none" stroke="#805AD5" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-2.5 3.5-4.5 8-4.5s8 2 8 4.5"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontWeight: 700, fontSize: 22, color: '#2F2F2F' }}>{client.name}</div>
              <div style={{ color: '#805AD5', fontSize: 14, marginTop: 2 }}>ID: {client.code || client._id}</div>
              <div style={{ color: '#805AD5', fontSize: 14, marginTop: 2 }}>Care Level: <span style={{ color: '#2F2F2F' }}>{client.careLevel || '—'}</span></div>
              <div style={{ color: '#805AD5', fontSize: 14, marginTop: 2 }}>Care Plan: <span style={{ color: '#2F2F2F' }}>{client.carePlan || '—'}</span></div>
              <div style={{ color: '#805AD5', fontSize: 14, marginTop: 2 }}>Medical Notes: <span style={{ color: '#2F2F2F' }}>{client.medicalNotes || '—'}</span></div>
              <div style={{ color: '#805AD5', fontSize: 14, marginTop: 2 }}>Priority: <span style={{ color: '#2F2F2F' }}>{client.priority || 'Normal'}</span></div>
            </div>
          </div>
        </div>
        {/* Priority Card (renamed to Category) */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>Category</div>
          <div style={styles.sectionDesc}>Select the type of observation</div>
          <div style={styles.categoryGrid}>
            {NOTE_CATEGORIES.map(cat => (
              <div
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                style={{
                  ...styles.categoryCard,
                  border: category === cat.key ? `2.5px solid #B8A6D9` : "1.5px solid #E0E0E0",
                  background: category === cat.key ? "#F8F9ED" : "#fff",
                  boxShadow: category === cat.key ? "0 2px 8px #E0E7EF" : "none"
                }}
                tabIndex={0}
                aria-label={cat.label}
              >
                <span style={styles.categoryIcon}>{CategoryIcons[cat.key]}</span>
                <span style={styles.categoryLabel}>{cat.label}</span>
                <span style={styles.categoryDesc}>{cat.desc}</span>
                {category === cat.key && (
                  <span style={styles.selectedMark}>Selected</span>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Record Observation Card */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>Record Observation</div>
          <div style={styles.sectionDesc}>Choose how you want to add your note</div>
          <div style={styles.actionRow}>
            <button
              onClick={() => setShowVoiceModal(true)}
              style={styles.actionBtn}
            >
              <svg width="22" height="22" fill="none" stroke="#B8A6D9" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="14" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/><path d="M12 19v3"/></svg>
              <span>Voice Note</span>
            </button>
            <button
              onClick={() => setShowWriteModal(true)}
              style={{ ...styles.actionBtn, background: "#fff", color: "#2E2E2E", border: "1.5px solid #B8A6D9" }}
            >
              <svg width="22" height="22" fill="none" stroke="#B8A6D9" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8h8M8 12h8M8 16h4"/></svg>
              <span>Write Note</span>
            </button>
            <button
              onClick={() => setShowPrevNotes(true)}
              style={{ ...styles.actionBtn, background: "#fff", color: "#805AD5", border: "1.5px solid #805AD5" }}
            >
              <svg width="22" height="22" fill="none" stroke="#805AD5" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8h8M8 12h8M8 16h4"/></svg>
              <span>Previous Notes</span>
            </button>
          </div>
          {/* Previous Notes Modal */}
          {showPrevNotes && (
            <div style={styles.modalOverlay}>
              <div style={styles.modalContent}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={styles.sectionTitle}>Previous Notes</div>
                  <button onClick={() => setShowPrevNotes(false)} style={styles.closeModalBtn} aria-label="Close">
                    <svg width="22" height="22" fill="none" stroke="#805AD5" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
                <div style={styles.filterRow}>
                  <button
                    style={{ ...styles.filterBtn, background: noteFilter === "week" ? "#B8A6D9" : "#fff", color: noteFilter === "week" ? "#fff" : "#2E2E2E" }}
                    onClick={() => setNoteFilter("week")}
                  >This Week</button>
                  <button
                    style={{ ...styles.filterBtn, background: noteFilter === "month" ? "#B8A6D9" : "#fff", color: noteFilter === "month" ? "#fff" : "#2E2E2E" }}
                    onClick={() => setNoteFilter("month")}
                  >This Month</button>
                  <button
                    style={{ ...styles.filterBtn, background: noteFilter === "year" ? "#B8A6D9" : "#fff", color: noteFilter === "year" ? "#fff" : "#2E2E2E" }}
                    onClick={() => setNoteFilter("year")}
                  >This Year</button>
                  <button
                    style={{ ...styles.filterBtn, background: noteFilter === "all" ? "#B8A6D9" : "#fff", color: noteFilter === "all" ? "#fff" : "#2E2E2E" }}
                    onClick={() => setNoteFilter("all")}
                  >All</button>
                </div>
                {filteredNotes.length === 0 ? (
                  <div style={styles.sectionDesc}>No notes yet.</div>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, maxHeight: 320, overflowY: 'auto' }}>
                    {filteredNotes.map(note => (
                      <li key={note._id} style={styles.noteCard}>
                        <div style={styles.noteHeader}>
                          <span style={styles.noteCategory}>
                            {CategoryIcons[note.category]}
                            {note.category}
                          </span>
                          <span style={{ ...styles.statusPill, background: statusColors[note.status] }}>{note.status}</span>
                        </div>
                        <div style={styles.noteContent}>
                          {note.content}
                          {note.draft && <span style={styles.draftMark}>(Draft)</span>}
                          {/* Show edit button if note is not approved and belongs to current user */}
                          {note.staffId === user.id && note.status !== "Approved" && note._id && (
                            <button
                              style={styles.editBtn}
                              aria-label="Edit note"
                              onClick={() => {
                                setShowPrevNotes(false);
                                if (note._id) {
                                  navigate(`/staff/clients/${clientId}/review-note/${note._id}`);
                                } else {
                                  console.warn('Attempted to edit a note with undefined _id:', note);
                                }
                              }}
                            >
                              <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 1 1 2.828 2.828L11.828 15.828a2 2 0 0 1-2.828 0L9 13z"/></svg> Edit
                            </button>
                          )}
                        </div>
                        <div style={styles.noteMeta}>
                          {new Date(note.createdAt).toLocaleString()} | Note ID: {note._id}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
          {/* Voice Note Modal */}
          {showVoiceModal && (
            <div style={styles.modalOverlay}>
              <div style={styles.modalContent}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, color: '#805AD5', fontSize: 18 }}>Voice Note</div>
                  <button onClick={() => setShowVoiceModal(false)} style={styles.closeModalBtn} aria-label="Close">
                    &times;
                  </button>
                </div>
                {/* Voice Note Controls and Live Transcription */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ color: '#6B6B6B', fontSize: 15, marginBottom: 8 }}>Live Transcription:</div>
                  <div style={{ minHeight: 48, background: '#F8F9ED', borderRadius: 8, padding: '10px 12px', fontSize: 16, color: '#2E2E2E', marginBottom: 12 }}>
                    {recording ? transcript || 'Start speaking...' : 'Click Start to begin.'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                  {!recording && (
                    <button style={{ background: '#805AD5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }} onClick={handleStartRecording}>Start</button>
                  )}
                  {recording && (
                    <button style={{ background: '#D53F8C', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }} onClick={handleStopRecording}>Stop</button>
                  )}
                  {!recording && transcript && (
                    <button style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }} onClick={handleStartRecording}>Resume</button>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Write Note Modal */}
          <WriteNoteModal
            open={showWriteModal}
            onClose={() => setShowWriteModal(false)}
            onSaved={() => {
              // Refresh notes after saving
              const fetchNotes = async () => {
                try {
                  const res = await api.get(`/api/staff/clients/${clientId}/notes?period=${noteFilter}`);
                  setNotes(res.data);
                } catch (err) {
                  setError("Failed to load notes");
                }
              };
              fetchNotes();
            }}
            clientId={clientId}
            category={category}
            api={api}
            styles={styles}
          />
        </div>
      </div>
    );
}

// --- Write Note Modal Component (top-level) ---
function WriteNoteModal({ open, onClose, onSaved, clientId, category, api, styles }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await api.post(`/api/staff/clients/${clientId}/notes`, {
        clientId,
        category: category || "General Observation",
        content: note,
        noteType: "text",
        status: "Pending"
      });
      setNote("");
      setSaving(false);
      onSaved && onSaved();
      onClose();
    } catch (err) {
      setError("Failed to save note");
      setSaving(false);
    }
  };
  if (!open) return null;
  return (
    <div style={{
      ...styles.modalOverlay,
      background: 'rgba(80, 60, 140, 0.13)',
      zIndex: 2000
    }}>
      <div style={{
        ...styles.modalContent,
        maxWidth: 520,
        minWidth: 340,
        borderRadius: 22,
        boxShadow: '0 8px 32px #B8A6D9',
        padding: 40,
        border: '1.5px solid #805AD5',
        background: 'linear-gradient(120deg, #fff 80%, #f8f9ed 100%)',
        position: 'relative',
        margin: 0
      }}>
        {/* Close (X) icon at top right */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 6,
            borderRadius: 8,
            color: '#805AD5',
            fontSize: 22,
            display: 'flex',
            alignItems: 'center',
            transition: 'background 0.15s',
          }}
        >
          <svg width="28" height="28" fill="none" stroke="#805AD5" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ marginBottom: 18, marginTop: 8 }}>
          <h2 style={{ fontWeight: 700, fontSize: 28, color: "#2E2E2E", margin: 0, letterSpacing: 0.2 }}>Write Note</h2>
        </div>
        <div style={{ fontWeight: 500, color: '#805AD5', fontSize: 16, marginBottom: 10 }}>
          Category: <span style={{ color: '#2E2E2E', fontWeight: 600 }}>{category || "General Observation"}</span>
        </div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={`Type your observation for ${category || "General Observation"}...`}
          style={{
            width: '100%',
            minHeight: 120,
            maxHeight: 220,
            borderRadius: 14,
            border: '1.5px solid #B8A6D9',
            padding: '16px 14px',
            fontSize: 17,
            background: '#F8F9ED',
            color: '#2E2E2E',
            marginBottom: 18,
            outline: 'none',
            resize: 'vertical',
            boxShadow: '0 1px 4px #E0E7EF',
            transition: 'border 0.2s, box-shadow 0.2s',
          }}
        />
        {error && <div style={{ color: '#C53030', textAlign: 'left', marginBottom: 12, fontSize: 16 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 18, marginTop: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: '#fff',
              color: '#805AD5',
              border: '1.5px solid #805AD5',
              borderRadius: 8,
              padding: '10px 28px',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 1px 4px #E0E7EF',
              transition: 'background 0.15s, color 0.15s, border 0.15s',
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = '#F8F9ED';
              e.currentTarget.style.color = '#6B6B6B';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.color = '#805AD5';
            }}
          >Cancel</button>
          <button
            onClick={handleSave}
            style={{
              background: saving || !note.trim() ? '#B8A6D9' : '#805AD5',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 32px',
              fontWeight: 700,
              fontSize: 17,
              cursor: saving || !note.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 8px #E0E7EF',
              opacity: saving || !note.trim() ? 0.7 : 1,
              transition: 'background 0.15s, opacity 0.15s',
            }}
            disabled={saving || !note.trim()}
          >
            <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Styles ---
const styles = {
    // ...existing styles...
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(128,90,213,0.10)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 4px 24px #B8A6D9',
      padding: 32,
      minWidth: 340,
      maxWidth: 540,
      width: '90vw',
      maxHeight: '80vh',
      overflowY: 'auto',
      position: 'relative'
    },
    closeModalBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 4,
      borderRadius: 8,
      color: '#805AD5',
      fontSize: 18,
      display: 'flex',
      alignItems: 'center',
      transition: 'background 0.15s',
    },
  page: {
    background: "#F8F9ED", // linen
    minHeight: "100vh",
    fontFamily: "Inter, system-ui, Arial, sans-serif"
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
    paddingTop: 18,
    paddingLeft: 8
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
  card: {
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 2px 8px #E0E7EF",
      padding: 24,
      marginBottom: 18,
      border: '1.5px solid #805AD5',
      width: '100%',
      maxWidth: 900,
      marginLeft: 'auto',
      marginRight: 'auto'
    },
  clientInfoRow: {
    display: "flex",
    alignItems: "center",
    gap: 18
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "#F8F9ED",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  clientName: {
        fontWeight: 700,
        fontSize: 28,
        color: "#805AD5",
        margin: 0
      },
  careLevel: {
    color: "#6B6B6B",
    fontSize: 14,
    marginTop: 4
  },
  carePlan: {
    color: "#6B6B6B",
    fontSize: 14,
    marginTop: 2
  },
  careLabel: {
    color: "#B8A6D9",
    fontWeight: 500,
    marginRight: 4
  },
  sectionTitle: {
      fontWeight: 600,
      color: "#805AD5",
      fontSize: 18,
      marginBottom: 6
    },
  sectionDesc: {
    color: "#6B6B6B",
    fontSize: 15,
    marginBottom: 16
  },
  categoryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 18
  },
  categoryCard: {
    borderRadius: 12,
    padding: 18,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    transition: "all 0.15s"
  },
  categoryIcon: {
    fontSize: 22,
    marginBottom: 8,
    color: "#B8A6D9"
  },
  categoryLabel: {
    fontWeight: 500,
    color: "#2E2E2E",
    fontSize: 16
  },
  categoryDesc: {
    color: "#6B6B6B",
    fontSize: 14,
    marginTop: 2
  },
  selectedMark: {
    marginTop: 10,
    color: "#B8A6D9",
    fontWeight: 500,
    fontSize: 14
  },
  actionRow: {
    display: "flex",
    gap: 18,
    marginTop: 10
  },
  actionBtn: {
    flex: 1,
    background: "#B8A6D9",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "18px 0",
    fontWeight: 500,
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: "0 2px 8px #E0E7EF"
  },
  noteCard: {
    background: "#fff",
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
    boxShadow: "0 1px 4px #E0E7EF"
  },
  noteHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6
  },
  noteCategory: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "#B8A6D9",
    fontWeight: 500,
    fontSize: 15
  },
  statusPill: {
    color: "#fff",
    borderRadius: 8,
    padding: "2px 10px",
    fontWeight: 500,
    fontSize: 13
  },
  noteContent: {
    color: "#2E2E2E",
    fontSize: 15,
    marginBottom: 6
  },
  noteMeta: {
    fontSize: 12,
    color: "#6B6B6B"
  },
  editBtn: {
    marginLeft: 12,
    padding: "4px 10px",
    borderRadius: 8,
    background: "#B8A6D9",
    color: "#fff",
    fontWeight: 500,
    fontSize: 13,
    border: "none",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 4
  },
  draftMark: {
    color: '#B8A6D9',
    marginLeft: 8
  },
  editTextarea: {
    width: "100%",
    borderRadius: 8,
    border: "1.5px solid #B8A6D9",
    padding: 10,
    fontSize: 15,
    marginTop: 8,
    background: "#F8F9ED"
  },
  editActions: {
    display: "flex",
    gap: 10,
    marginTop: 8
  },
  saveBtn: {
      background: "#805AD5",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "6px 16px",
      fontWeight: 500,
      fontSize: 14,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 4
    },
  cancelBtn: {
      background: "#fff",
      color: "#805AD5",
      border: "1.5px solid #805AD5",
      borderRadius: 8,
      padding: "6px 16px",
      fontWeight: 500,
      fontSize: 14,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 4
    },
  loading: {
    color: "#B8A6D9",
    textAlign: "center",
    marginTop: 40,
    fontSize: 18
  },
  filterRow: {
    display: "flex",
    gap: 10,
    marginBottom: 18
  },
  filterBtn: {
      border: "1.5px solid #805AD5",
      borderRadius: 8,
      padding: "6px 18px",
      fontWeight: 500,
      fontSize: 14,
      background: "#fff",
      color: "#805AD5",
      cursor: "pointer",
      transition: "all 0.15s"
    },
  error: {
    color: "#C53030",
    textAlign: "center",
    marginTop: 40,
    fontSize: 18
  }
};
export default ClientNotes;
