

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/api";

export default function SupervisorNoteReview() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { client, note } = state || {};
  const [discrepancies, setDiscrepancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checklist, setChecklist] = useState([false, false, false, false, false, false]);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchDiscrepancies() {
      if (!note || !note._id) return setLoading(false);
      try {
        // Example: GET /api/supervisor/notes/:noteId/discrepancies
        const res = await api.get(`/api/supervisor/notes/${note._id}/discrepancies`);
        setDiscrepancies(res.data.discrepancies || []);
      } catch (err) {
        setError("Failed to fetch discrepancies");
      }
      setLoading(false);
    }
    fetchDiscrepancies();
  }, [note]);


  if (!client || !note) {
    return <div style={{ color: '#C53030', textAlign: 'center', marginTop: 40 }}>Missing note or client data.</div>;
  }
  if (loading) return <div style={{ color: '#805AD5', textAlign: 'center', marginTop: 40 }}>Loading...</div>;

  const checklistItems = [
    "Note content is clear and legible",
    "All required fields are completed",
    "Timestamps are accurate and consistent",
    "Observations match client care plan",
    "Staff member is authorized for this client",
    "No discrepancies or flags identified"
  ];

  const requiredCount = 5;
  const completedCount = checklist.slice(0, requiredCount).filter(Boolean).length;

  function handleChecklistChange(idx) {
    setChecklist(prev => prev.map((v, i) => i === idx ? !v : v));
  }

  async function handleConfirmVerification() {
    if (!note || !note._id) return;
    setVerifying(true);
    setError("");
    setSuccess("");
    try {
      await api.put(`/api/supervisor/notes/${note._id}/verify`, { status: "Approved" });
      setSuccess("Note verified successfully.");
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      setError("Failed to verify note.");
    }
    setVerifying(false);
  }

  return (
    <div style={{ background: '#F8F9ED', minHeight: '100vh', fontFamily: 'Inter, Poppins, Roboto, Arial, sans-serif', padding: 0 }}>
      <div style={{ maxWidth: 800, margin: '32px auto 0 auto' }}>
        <h1 style={{ fontWeight: 700, fontSize: 32, color: '#1A202C', marginBottom: 8 }}>Note Verification</h1>
        <div style={{ color: '#6B6B6B', fontSize: 18, marginBottom: 24 }}>Review and verify care note for {client.name}</div>
        <button onClick={() => navigate(-1)} style={{ background: '#fff', border: '1.5px solid #E0E7EF', color: '#2E2E2E', borderRadius: 8, padding: '8px 22px', fontWeight: 600, fontSize: 16, marginBottom: 18, cursor: 'pointer' }}>&larr; Back</button>
        {/* Info Card */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px #E0E7EF', padding: 28, display: 'flex', alignItems: 'center', marginBottom: 24, gap: 32 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#2E2E2E' }}>{client.name}</div>
            <div style={{ color: '#6B6B6B', fontSize: 15 }}>Client ID: {client.code || client._id?.slice(-4).toUpperCase()}</div>
            <div style={{ color: '#6B6B6B', fontSize: 15, marginTop: 8 }}>Staff Member: <span style={{ color: '#2563EB', fontWeight: 600 }}>{note.staffId?.name || 'Unknown'}</span></div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#6B6B6B', fontSize: 15 }}>Recorded:</div>
            <div style={{ fontWeight: 600, color: '#2E2E2E', fontSize: 16 }}>{note.createdAt ? new Date(note.createdAt).toLocaleString() : ''}</div>
            <div style={{ marginTop: 8 }}>
              <span style={{ background: '#E6F0FF', color: '#2563EB', borderRadius: 8, padding: '4px 14px', fontWeight: 600, fontSize: 15 }}>{note.category || 'Other'}</span>
            </div>
          </div>
        </div>
        {/* Discrepancies Card */}
        {discrepancies.length > 0 && (
          <div style={{ background: '#FFF5F5', border: '1.5px solid #F56565', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ color: '#C53030', fontWeight: 700, fontSize: 17, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>⚠️</span> Discrepancies Detected
            </div>
            <ul style={{ color: '#C53030', fontSize: 15, margin: 0, paddingLeft: 24 }}>
              {discrepancies.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </div>
        )}
        {/* Note Content Card */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #E0E7EF', padding: 24, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#2E2E2E', marginBottom: 8 }}>Note Content</div>
          <div style={{ background: '#F8F9ED', borderRadius: 8, padding: 16, color: '#2E2E2E', fontSize: 15 }}>{note.content}</div>
        </div>
        {/* Verification Checklist */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #E0E7EF', padding: 24, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#2E2E2E', marginBottom: 8 }}>Verification Checklist</div>
          <div style={{ color: '#6B6B6B', fontSize: 15, marginBottom: 12 }}>Complete all required items before verification</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {checklistItems.map((item, idx) => (
              <li key={item} style={{ marginBottom: 6 }}>
                <input
                  type="checkbox"
                  style={checkboxStyle}
                  checked={checklist[idx]}
                  onChange={() => handleChecklistChange(idx)}
                  id={`checklist-${idx}`}
                />
                <label htmlFor={`checklist-${idx}`} style={{ cursor: 'pointer' }}>
                  {item} {idx < requiredCount && <span style={{ color: '#F56565' }}>*</span>}
                </label>
              </li>
            ))}
          </ul>
        </div>
        {/* Verification Notes */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #E0E7EF', padding: 24, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#2E2E2E', marginBottom: 8 }}>Verification Notes</div>
          <div style={{ color: '#6B6B6B', fontSize: 15, marginBottom: 8 }}>Add any additional comments or follow-up items</div>
          <textarea
            value={verificationNotes}
            onChange={e => setVerificationNotes(e.target.value)}
            placeholder="Enter any additional notes, concerns, or follow-up actions required..."
            style={{ width: '100%', minHeight: 60, borderRadius: 8, border: '1.5px solid #E0E7EF', padding: 12, fontSize: 15, resize: 'vertical', outline: 'none' }}
          />
        </div>
        {/* Verification Status */}
        <div style={{ background: '#F7FAFC', borderRadius: 12, border: '1.5px solid #E0E7EF', padding: 24, marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#1A202C' }}>Verification Status</div>
          <div style={{ color: '#6B6B6B', fontSize: 15 }}>{completedCount} of {requiredCount} required items completed</div>
          <div style={{ marginLeft: 16, fontSize: 22, color: '#F6AD55' }}>⚠️</div>
        </div>
        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginBottom: 40 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: '#fff', border: '1.5px solid #E0E7EF', color: '#2E2E2E', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            disabled={completedCount < requiredCount || verifying}
            onClick={handleConfirmVerification}
            style={{ background: completedCount < requiredCount ? '#E0E7EF' : '#2563EB', color: completedCount < requiredCount ? '#A0AEC0' : '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: completedCount < requiredCount ? 'not-allowed' : verifying ? 'wait' : 'pointer', transition: 'background 0.2s', opacity: verifying ? 0.7 : 1 }}
          >
            {verifying ? 'Verifying...' : 'Confirm Verification'}
          </button>
        </div>
        {error && <div style={{ color: '#C53030', textAlign: 'center', marginTop: 20 }}>{error}</div>}
        {success && <div style={{ color: '#2F7A4E', textAlign: 'center', marginTop: 20 }}>{success}</div>}
      </div>
    </div>
  );
}

const checkboxStyle = {
  marginRight: 10,
  width: 18,
  height: 18,
  accentColor: '#2563EB',
  verticalAlign: 'middle',
  cursor: 'pointer'
};
