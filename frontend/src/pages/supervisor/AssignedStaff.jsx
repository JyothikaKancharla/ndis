import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";

export default function AssignedStaff() {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [editIdx, setEditIdx] = useState(null);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [client, setClient] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch client and assigned staff
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([
      api.get(`/api/supervisor/clients/${clientId}`),
      api.get(`/api/supervisor/clients/${clientId}/assigned-staff`)
    ])
      .then(([clientRes, staffRes]) => {
        if (!isMounted) return;
        setClient(clientRes.data);
        setStaff(staffRes.data);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Failed to fetch assigned staff");
        setLoading(false);
      });
    return () => { isMounted = false; };
  }, [clientId]); // ✅ Removed client?.assignedStaff to prevent infinite loop

  // Fetch all staff for adding new staff after client is loaded
  useEffect(() => {
    if (!client) return;
    api.get("/api/supervisor/staff")
      .then(res => {
        const assignedIds = new Set((client.assignedStaff || []).map(s => s._id || s));
        const filtered = res.data.filter(staff => !assignedIds.has(staff._id));
        setStaffList(filtered);
      })
      .catch(() => setStaffList([]));
  }, [client]);

  const handleShiftSave = async (e, staffId) => {
    e.preventDefault();
    const form = e.target;
    const startTime = form.startTime.value;
    const endTime = form.endTime.value;
    const assignmentStart = form.assignmentStart.value;
    const daysPerWeek = form.daysPerWeek.value;
    try {
      await api.put(`/api/supervisor/clients/${clientId}/assigned-staff/${staffId}`, {
        startTime,
        endTime,
        assignmentStart,
        daysPerWeek: Number(daysPerWeek)
      });
      setEditIdx(null);
      // Refresh staff list
      const staffRes = await api.get(`/api/supervisor/clients/${clientId}/assigned-staff`);
      setStaff(staffRes.data);
    } catch {
      alert("Failed to update shift. Try again.");
    }
  };

  const handleAddStaff = async () => {
    if (!selectedStaff) return;
    // Prevent assigning staff who already have a shift assigned to this client
    if (staff.some(s => s._id === selectedStaff)) {
      alert("This staff member is already assigned to this client.");
      return;
    }
    try {
      await api.put(`/api/supervisor/clients/${clientId}`, {
        ...client,
        assignedStaff: [...(client.assignedStaff || []), selectedStaff]
      });
      setShowAddStaff(false);
      setSelectedStaff("");
      // Refresh staff list
      const staffRes = await api.get(`/api/supervisor/clients/${clientId}/assigned-staff`);
      setStaff(staffRes.data);
    } catch {
      alert("Failed to assign staff. Try again.");
    }
  };

  if (loading) return <div style={{ color: '#805AD5', textAlign: 'center', marginTop: 40, fontSize: 18 }}>Loading...</div>;
  if (error) return <div style={{ color: '#d9534f', textAlign: 'center', marginTop: 40, fontSize: 18 }}>{error}</div>;
  if (!client) return <div>Client not found.</div>;

  return (
    <div style={{ background: '#F8F9FD', minHeight: '100vh', fontFamily: 'Inter, Poppins, Roboto, Arial, sans-serif', padding: 0 }}>
      <div style={{ maxWidth: 1100, margin: '32px auto 0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#805AD5', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginRight: 16 }}>&lt; Back</button>
          <div style={{ fontWeight: 700, fontSize: 28, color: '#2E2E2E' }}>Assigned Staff</div>
        </div>
        <div style={{ color: '#6B6B6B', fontSize: 17, marginBottom: 18 }}>Managing staff assignments for <b>{client.name}</b></div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ color: '#22C55E', fontWeight: 600, fontSize: 18, display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 22, marginRight: 8 }}>✔</span> Active Assignments ({staff.length})
          </div>
          <button style={{ marginLeft: 'auto', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }} onClick={() => setShowAddStaff(true)}>+ Add Staff</button>
        </div>
        {showAddStaff && (
          <div style={{ background: '#F8F9FD', padding: 18, borderRadius: 10, marginBottom: 24 }}>
            <select value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)} style={{ padding: '8px', borderRadius: 6, marginRight: 12 }}>
              <option value="">Select staff member</option>
              {staffList.map(staff => (
                <option key={staff._id} value={staff._id}>{staff.name}</option>
              ))}
            </select>
            <button
              style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}
              onClick={handleAddStaff}
            >Assign</button>
            <button
              style={{ background: '#f0f0f0', color: '#333', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 500, fontSize: 15, marginLeft: 8, cursor: 'pointer' }}
              onClick={() => setShowAddStaff(false)}
            >Cancel</button>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {staff.length === 0 ? (
            <div style={{ color: '#B8A6D9', fontSize: 18, textAlign: 'center', marginTop: 40 }}>No staff assigned to this client.</div>
          ) : staff.map((s, idx) => (
            <div key={s._id || idx} style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px #E0E7EF', padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 20, color: '#2563EB' }}>{s.name} <span style={{ fontSize: 15, color: '#2F7A4E', fontWeight: 600, marginLeft: 8 }}>{s.role && <span style={{ background: '#E6F4EA', color: '#2F7A4E', borderRadius: 6, padding: '2px 10px' }}>{s.role}</span>} {s.status === 'Active' && <span style={{ background: '#E6F4EA', color: '#2F7A4E', borderRadius: 6, padding: '2px 10px', marginLeft: 8 }}>Active</span>}</span></div>
                  <div style={{ color: '#6B6B6B', fontSize: 15, marginTop: 2 }}>ID: {s.staffCode || s._id?.slice(-4).toUpperCase()}</div>
                </div>
                <button style={{ background: '#fff', color: '#805AD5', border: '1.5px solid #E0E7EF', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginRight: 8 }} onClick={() => setEditIdx(idx)}>Edit Shift</button>
                <button style={{ background: '#fff', color: '#d9534f', border: '1.5px solid #E0E7EF', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Remove</button>
              </div>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginTop: 8 }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ color: '#6B6B6B', fontSize: 15 }}>Start Time</div>
                  <div style={{ fontWeight: 500, fontSize: 16 }}>{s.startTime || '-'}</div>
                  <div style={{ color: '#6B6B6B', fontSize: 15, marginTop: 10 }}>End Time</div>
                  <div style={{ fontWeight: 500, fontSize: 16 }}>{s.endTime || '-'}</div>
                  <div style={{ color: '#6B6B6B', fontSize: 15, marginTop: 10 }}>Assignment Start</div>
                  <div style={{ fontWeight: 500, fontSize: 16 }}>{s.assignmentStart ? s.assignmentStart.split('T')[0] : '-'}</div>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ color: '#6B6B6B', fontSize: 15 }}>Days Per Week</div>
                  <div style={{ fontWeight: 500, fontSize: 16 }}>{s.daysPerWeek ? `${s.daysPerWeek} days` : '-'}</div>
                  <div style={{ color: '#6B6B6B', fontSize: 15, marginTop: 10 }}>Status</div>
                  <div style={{ fontWeight: 500, fontSize: 16 }}>{s.status || '-'}</div>
                </div>
                <div style={{ flex: 2, minWidth: 220 }}>
                  <div style={{ color: '#6B6B6B', fontSize: 15 }}>Specializations</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                    {(s.specializations || []).length === 0 ? <span style={{ color: '#B8A6D9' }}>None</span> : s.specializations.map((spec, i) => (
                      <span key={i} style={{ background: '#E6F0FF', color: '#2563EB', borderRadius: 8, padding: '6px 14px', fontWeight: 500, fontSize: 15 }}>{spec}</span>
                    ))}
                  </div>
                  <div style={{ color: '#6B6B6B', fontSize: 15, marginTop: 10 }}>Contact</div>
                  <div style={{ fontWeight: 500, fontSize: 16 }}>{s.phone || '-'}</div>
                </div>
              </div>
              {editIdx === idx && (
                <form style={{ marginTop: 18, background: '#F8F9FD', padding: 16, borderRadius: 10, display: 'flex', gap: 16, flexWrap: 'wrap' }} onSubmit={e => handleShiftSave(e, s._id)}>
                  <input type="time" placeholder="Start Time" defaultValue={s.startTime || ''} name="startTime" style={{ padding: '8px', borderRadius: 6, minWidth: 120 }} />
                  <input type="time" placeholder="End Time" defaultValue={s.endTime || ''} name="endTime" style={{ padding: '8px', borderRadius: 6, minWidth: 120 }} />
                  <input type="date" defaultValue={s.assignmentStart ? s.assignmentStart.split('T')[0] : ''} name="assignmentStart" style={{ padding: '8px', borderRadius: 6, minWidth: 120 }} />
                  <input type="number" min="1" max="7" placeholder="Days/Week" defaultValue={s.daysPerWeek} name="daysPerWeek" style={{ padding: '8px', borderRadius: 6, minWidth: 100 }} />
                  <button type="submit" style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}>Save</button>
                  <button type="button" style={{ background: '#f0f0f0', color: '#333', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 500, fontSize: 15 }} onClick={() => setEditIdx(null)}>Cancel</button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
