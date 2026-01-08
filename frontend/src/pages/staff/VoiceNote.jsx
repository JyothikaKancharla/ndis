import React, { useState, useRef, useContext } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const isSpeechRecognitionSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

const VoiceNote = () => {
  const { id: clientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { category } = location.state || {};
  const { user } = useContext(AuthContext);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [editText, setEditText] = useState("");
  const recognitionRef = useRef(null);

  // Start voice recording
  const handleStartRecording = () => {
    if (!isSpeechRecognitionSupported) return;
    setTranscript("");
    setEditText("");
    setRecording(true);
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
    recognition.onend = () => {
      setRecording(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  // Stop voice recording
  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setRecording(false);
  };


  // --- Handlers ---
  const handleSaveAndReview = () => {
    // Stop recording if still running
    if (recording) handleStopRecording();
    // Navigate to review page, do not allow edit
    navigate(`/staff/clients/${clientId}/review-note`, {
      state: {
        transcript: editText,
        category,
        client: location.state?.client,
        user,
        noteType: "voice",
        allowEdit: false // custom flag to disable edit
      }
    });
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 32 }}>
      <h2 style={{ color: "#805AD5", marginBottom: 24 }}>Voice Note for {category}</h2>
      {!isSpeechRecognitionSupported && (
        <div style={{ color: "#D53F8C", marginBottom: 16 }}>
          Voice recognition is not supported in this browser. Please use Chrome or Edge.
        </div>
      )}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        {!recording && (
          <button onClick={handleStartRecording} style={{ background: "#805AD5", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Start Record</button>
        )}
        {recording && (
          <button onClick={handleStopRecording} style={{ background: "#D53F8C", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Stop</button>
        )}
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontWeight: 500, color: "#805AD5" }}>Live Transcript:</label>
        <div style={{ minHeight: 48, background: "#fff", borderRadius: 8, border: "1px solid #E6E6FA", padding: "10px 12px", marginTop: 8, fontSize: 16 }}>
          {recording ? transcript : null}
        </div>
      </div>
      {!recording && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 500, color: "#805AD5" }}>Edit Transcript:</label>
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={5}
            style={{ width: "100%", borderRadius: 8, border: "1px solid #E6E6FA", padding: "10px 12px", fontSize: 15, resize: "vertical" }}
          />
        </div>
      )}
      <div style={{ display: "flex", gap: 16 }}>
        <button onClick={() => navigate(-1)} style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Cancel</button>
        <button onClick={handleSaveAndReview} style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, fontSize: 16, cursor: "pointer" }} disabled={!editText.trim()}>Save Note</button>
      </div>
    </div>
  );
};

export default VoiceNote;
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, cursor: "pointer", width: "fit-content" }} onClick={() => navigate(-1)}>
            <svg width="28" height="28" fill="none" stroke="#805AD5" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ color: "#805AD5", fontWeight: 500, fontSize: 16 }}>Back</span>
          </div>
