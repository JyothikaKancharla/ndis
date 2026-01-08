import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function NoteReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { client, note, shift, onSave } = location.state || {};

  if (!client || !note) {
    return <div>Missing note or client data.</div>;
  }

  const handleSave = async () => {
    // Finalize note (set status to Pending Review)
    await onSave();
    navigate("/staff/clients"); // Redirect to My Clients after save
  };

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", background: "#F8F9ED", padding: 32, borderRadius: 16, fontFamily: "Inter, Poppins, Roboto, Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, cursor: "pointer", width: "fit-content" }} onClick={() => navigate(-1)}>
        <svg width="28" height="28" fill="none" stroke="#805AD5" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span style={{ color: "#805AD5", fontWeight: 500, fontSize: 16 }}>Back</span>
      </div>
      <h2 style={{ color: "#805AD5", fontWeight: 700, fontSize: 28, marginBottom: 18 }}>Review Note</h2>
      <div style={{ marginBottom: 18 }}>
        <strong style={{ color: "#805AD5" }}>Client:</strong> {client.name} <br />
        <strong style={{ color: "#805AD5" }}>Client ID:</strong> {client._id} <br />
        {shift && <><strong style={{ color: "#805AD5" }}>Shift:</strong> {shift.date} {shift.startTime} - {shift.endTime} <br /></>}
      </div>
      <div style={{ marginBottom: 18 }}>
        <strong style={{ color: "#805AD5" }}>Observation:</strong>
        <div style={{ background: '#fff', borderRadius: 8, padding: 16, marginTop: 8, color: "#2E2E2E" }}>{note.content}</div>
      </div>
      <div>
        <button onClick={handleSave} style={{ padding: "8px 18px", borderRadius: 8, background: "#805AD5", color: "#fff", fontWeight: 600, marginRight: 8 }}>Save Note</button>
        <button onClick={() => navigate(-1)} style={{ padding: "8px 18px", borderRadius: 8, background: "#B8A6D9", color: "#fff", fontWeight: 600 }}>Return to Edit</button>
      </div>
    </div>
  );
}
