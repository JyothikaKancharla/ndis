import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";

export default function ClientProfileView() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [assignedStaff, setAssignedStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([
      api.get(`/api/supervisor/clients/${clientId}`),
      api.get(`/api/supervisor/clients/${clientId}/notes`),
      api.get(`/api/supervisor/clients/${clientId}/assigned-staff`)
    ])
      .then(([clientRes, notesRes, staffRes]) => {
        if (!isMounted) return;
        setClient(clientRes.data);
        setNotes(notesRes.data);
        setAssignedStaff(staffRes.data || []);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Failed to fetch client details");
        setLoading(false);
      });
    return () => { isMounted = false; };
  }, [clientId]);

  // Calculate total notes and last note date
  const totalNotes = notes.length;
  const lastNoteDate = notes.length > 0 ? new Date(Math.max(...notes.map(n => new Date(n.createdAt)))).toISOString().split("T")[0] : null;

  const primaryShift = assignedStaff && assignedStaff.length > 0 ? assignedStaff[0] : null;

  if (loading) return <div style={{ color: '#805AD5', textAlign: 'center', marginTop: 40, fontSize: 18 }}>Loading...</div>;
  if (error) return <div style={{ color: '#d9534f', textAlign: 'center', marginTop: 40, fontSize: 18 }}>{error}</div>;
  if (!client) return <div>Client not found.</div>;

  return (
    <div style={{ background: '#F8F9FD', minHeight: '100vh', fontFamily: 'Inter, Poppins, Roboto, Arial, sans-serif', padding: 0 }}>
      <div style={{ maxWidth: 1100, margin: '32px auto 0 auto' }}>
        {/* Header */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px #E0E7EF', padding: 28, display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 26, color: '#2E2E2E' }}>{client.name} <span style={{ fontSize: 16, color: '#2F7A4E', fontWeight: 600, marginLeft: 8 }}>{client.status === 'Active' && <span style={{ background: '#E6F4EA', color: '#2F7A4E', borderRadius: 6, padding: '2px 10px' }}>Active</span>}</span></div>
            <div style={{ color: '#6B6B6B', fontSize: 15, marginTop: 2 }}>Client ID: {client.code || client._id?.slice(-4).toUpperCase()}</div>
          </div>
          <button style={{ background: '#805AD5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }} onClick={() => navigate(`/supervisor/clients/${clientId}/edit`)}>Edit Details</button>
        </div>
        {/* Top Stats */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          <div style={{ flex: 1, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #E0E7EF', padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#2563EB' }}>{primaryShift ? primaryShift.name : 'N/A'}</div>
            <div style={{ color: '#6B6B6B', fontSize: 13, marginTop: 6 }}>{primaryShift ? `${primaryShift.startTime || '-'} → ${primaryShift.endTime || '-'}` : 'No shift'}</div>
            <div style={{ color: '#6B6B6B', fontSize: 13, marginTop: 6 }}>{primaryShift && primaryShift.daysPerWeek ? `${primaryShift.daysPerWeek} days/week` : ''}</div>
          </div>
          <div style={{ flex: 1, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #E0E7EF', padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#2F7A4E' }}>{client.assignedStaff?.length || 0}</div>
            <div style={{ color: '#6B6B6B', fontSize: 15, marginTop: 6 }}>Active staff members</div>
          </div>
          <div style={{ flex: 1, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #E0E7EF', padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#805AD5' }}>{totalNotes}</div>
            <div style={{ color: '#6B6B6B', fontSize: 15, marginTop: 6 }}>Care observations recorded</div>
          </div>
          <div style={{ flex: 1, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #E0E7EF', padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#2563EB' }}>{lastNoteDate || 'N/A'}</div>
            <div style={{ color: '#6B6B6B', fontSize: 15, marginTop: 6 }}>Last Note</div>
          </div>
        </div>
        {/* Personal Info (only backend-supported fields) */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #E0E7EF', padding: 28, marginBottom: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12, color: '#805AD5' }}>Personal Information</div>
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ color: '#6B6B6B', fontSize: 15 }}>Date of Birth</div>
              <div style={{ fontWeight: 500, fontSize: 16 }}>{client.dob} {client.dob && <span style={{ color: '#B8A6D9', fontWeight: 400, fontSize: 14 }}>({getAge(client.dob)} years old)</span>}</div>
              <div style={{ color: '#6B6B6B', fontSize: 15, marginTop: 12 }}>Contact Number</div>
              <div style={{ fontWeight: 500, fontSize: 16 }}>{client.phone || '-'}</div>
              <div style={{ color: '#6B6B6B', fontSize: 15, marginTop: 12 }}>Address</div>
              <div style={{ fontWeight: 500, fontSize: 16 }}>{client.address || '-'}</div>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ color: '#6B6B6B', fontSize: 15 }}>Gender</div>
              <div style={{ fontWeight: 500, fontSize: 16 }}>{client.gender || '-'}</div>
              <div style={{ color: '#6B6B6B', fontSize: 15, marginTop: 12 }}>Status</div>
              <div style={{ fontWeight: 500, fontSize: 16 }}>{client.status || '-'}</div>
              <div style={{ color: '#6B6B6B', fontSize: 15, marginTop: 12 }}>Care Level</div>
              <div style={{ fontWeight: 500, fontSize: 16 }}>
  {client.careLevel || "Low"}
</div>

            </div>
          </div>
        </div>
        {/* Care Plan & Medical Notes */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #E0E7EF', padding: 28, marginBottom: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12, color: '#805AD5' }}>Care Plan & Medical Notes</div>
          <div style={{ color: '#6B6B6B', fontSize: 15 }}>Current Care Plan</div>
          <div style={{ fontWeight: 500, fontSize: 16, background: '#F8F9FD', borderRadius: 8, padding: '8px 16px', margin: '8px 0 16px 0' }}>{client.carePlan || '-'}</div>
          <div style={{ color: '#6B6B6B', fontSize: 15 }}>Medical Notes</div>
          <div style={{ fontWeight: 500, fontSize: 16, background: '#F8F9FD', borderRadius: 8, padding: '8px 16px', margin: '8px 0 0 0' }}>{client.medicalNotes || '-'}</div>
        </div>
        {/* Bottom Action Buttons */}
        <div style={{ display: 'flex', gap: 16, marginTop: 24, marginBottom: 16 }}>
          <button
            style={{ background: '#fff', color: '#805AD5', border: '1.5px solid #E0E7EF', borderRadius: 8, padding: '12px 32px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
            onClick={() => navigate(`/supervisor/clients/${clientId}/staff`)}
          >
            View Assigned Staff
          </button>
          <button
            style={{ background: '#fff', color: '#805AD5', border: '1.5px solid #E0E7EF', borderRadius: 8, padding: '12px 32px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
            onClick={() => navigate(`/supervisor/clients/${clientId}/notes`)}
          >
            View Historical Notes
          </button>
        </div>
      </div>
    </div>
  );
}

function getAge(dob) {
  if (!dob) return "-";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}
