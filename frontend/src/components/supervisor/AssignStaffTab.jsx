import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/api';
import { getAssignmentDateStatus, sortAssignmentsByDateStatus, formatAssignmentDisplay } from '../../utils/shiftStatus';
import AssignmentModal from './AssignmentModal';

const AssignStaffTab = () => {
  const [staff, setStaff] = useState([]);
  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]); // All clients for modal
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shiftStartTime, setShiftStartTime] = useState('');
  const [shiftEndTime, setShiftEndTime] = useState('');
  const [formData, setFormData] = useState({
    staffId: '',
    clientId: '',
    shift: '',
    startDate: '',
    confirmAssignment: false
  });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchClients = useCallback(async (staffId = null) => {
    try {
      // Fetch eligible clients for the selected staff
      const url = staffId
        ? `/api/supervisor/clients?staffId=${staffId}`
        : '/api/supervisor/clients';
      const clientsResponse = await api.get(url);
      setClients(clientsResponse.data.data || []);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      setClients([]);
    }
  }, []);

  const fetchAllClients = useCallback(async () => {
    try {
      // Fetch all clients (for modal - no staff filter)
      const clientsResponse = await api.get('/api/supervisor/clients');
      setAllClients(clientsResponse.data.data || []);
    } catch (error) {
      console.error('Failed to fetch all clients:', error);
      setAllClients([]);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch staff and assignments
      const staffResponse = await api.get('/api/supervisor/staff');
      const assignmentsResponse = await api.get('/api/supervisor/assignments');
      setStaff(staffResponse.data.data || []);
      setAssignments(assignmentsResponse.data.data || []);
      // Fetch clients without staff filter initially
      await fetchClients();
      await fetchAllClients();
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchClients, fetchAllClients]);

  useEffect(() => {
    // Refetch eligible clients when staff changes
    if (formData.staffId) {
      fetchClients(formData.staffId);
    } else {
      fetchClients();
    }
  }, [formData.staffId, fetchClients]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate confirmation
    if (!formData.confirmAssignment) {
      alert('⚠️ Please confirm the assignment before creating');
      return;
    }
    
    console.log('📝 Submitting assignment with data:', formData);
    try {
      const response = await api.post('/api/supervisor/assignments', formData);
      console.log('✅ Assignment created:', response.data);
      alert('Assignment created successfully');
      setFormData({
        staffId: '',
        clientId: '',
        shift: '',
        startDate: '',
        confirmAssignment: false
      });
      setShiftStartTime('');
      setShiftEndTime('');
      // Refresh assignments list
      fetchData();
    } catch (error) {
      console.error('❌ Failed to create assignment:', error);
      console.error('Response data:', error.response?.data);
      alert(`Failed to create assignment: ${error.response?.data?.error || error.message}`);
    }
  };

  // Modal handlers
  const handleEditAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleReassignStaff = (assignment) => {
    setSelectedAssignment(assignment);
    setModalMode('reassign');
    setModalOpen(true);
  };

  const handleNewShift = (assignment) => {
    setSelectedAssignment(assignment);
    setModalMode('new_shift');
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedAssignment(null);
    setModalMode('create');
  };

  const handleDeleteAssignment = async (assignment) => {
    const confirmed = window.confirm(
      `Remove assignment of "${assignment.clientId?.name}" from "${assignment.staffId?.name}"?\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/api/supervisor/assignments/${assignment._id}`);
      alert('Assignment removed successfully');
      fetchData();
    } catch (error) {
      console.error('❌ Failed to delete assignment:', error);
      alert(`Failed to remove assignment: ${error.response?.data?.error || error.response?.data?.message || error.message}`);
    }
  };

  const handleModalSubmit = async (data, mode, assignmentId) => {
    console.log('📝 Modal submit:', { data, mode, assignmentId });

    try {
      if (mode === 'edit' && assignmentId) {
        // Update existing assignment
        const response = await api.put(`/api/supervisor/assignments/${assignmentId}`, {
          shift: data.shift,
          startDate: data.startDate
        });
        console.log('✅ Assignment updated:', response.data);
        alert('Assignment updated successfully');
      } else {
        // Create new assignment (for create, reassign, new_shift modes)
        const response = await api.post('/api/supervisor/assignments', {
          staffId: data.staffId,
          clientId: data.clientId,
          shift: data.shift,
          startDate: data.startDate
        });
        console.log('✅ Assignment created:', response.data);

        if (mode === 'reassign') {
          // Delete the old assignment so it no longer appears in the list
          if (assignmentId) {
            await api.delete(`/api/supervisor/assignments/${assignmentId}`);
          }
          alert('Client reassigned successfully.');
        } else if (mode === 'new_shift') {
          alert('New shift created successfully.');
        } else {
          alert('Assignment created successfully');
        }
      }

      // Refresh data
      fetchData();
      handleModalClose();
    } catch (error) {
      console.error('❌ Failed to save assignment:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      throw new Error(errorMessage);
    }
  };

  const isAssignmentCompleted = (assignment) => {
    const dateStatus = getAssignmentDateStatus(assignment.startDate, assignment.shift);
    return dateStatus.status === 'Previous';
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Assign Staff to Clients</h2>

      <form onSubmit={handleSubmit} style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        maxWidth: '600px',
        marginBottom: '24px'
      }}>
        <select
          value={formData.staffId}
          onChange={(e) => setFormData({...formData, staffId: e.target.value})}
          required
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
        >
          <option value="">Select Staff Member</option>
          {staff.map(s => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>

        <select
          value={formData.clientId}
          onChange={(e) => setFormData({...formData, clientId: e.target.value})}
          required
          disabled={!formData.staffId || clients.length === 0}
          style={{ 
            padding: '8px', 
            borderRadius: '6px', 
            border: '1px solid #ddd',
            backgroundColor: (!formData.staffId || clients.length === 0) ? '#f3f4f6' : 'white',
            cursor: (!formData.staffId || clients.length === 0) ? 'not-allowed' : 'pointer'
          }}
        >
          <option value="">
            {!formData.staffId 
              ? 'Select Staff First' 
              : clients.length === 0 
                ? 'No available clients for this staff member'
                : 'Select Client'}
          </option>
          {clients.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        {/* Shift Time Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '600' }}>
              Start Time *
            </label>
            <input
              type="time"
              value={shiftStartTime}
              onChange={(e) => {
                setShiftStartTime(e.target.value);
                // Auto-set shift when both times are available
                if (e.target.value && shiftEndTime) {
                  const formatTime = (time) => {
                    const [hours, minutes] = time.split(':');
                    const hour = parseInt(hours);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const displayHour = hour % 12 || 12;
                    return `${displayHour}:${minutes} ${ampm}`;
                  };
                  const shiftDisplay = `${formatTime(e.target.value)} - ${formatTime(shiftEndTime)}`;
                  setFormData({ ...formData, shift: shiftDisplay });
                }
              }}
              required
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '600' }}>
              End Time *
            </label>
            <input
              type="time"
              value={shiftEndTime}
              onChange={(e) => {
                setShiftEndTime(e.target.value);
                // Auto-set shift when both times are available
                if (shiftStartTime && e.target.value) {
                  const formatTime = (time) => {
                    const [hours, minutes] = time.split(':');
                    const hour = parseInt(hours);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const displayHour = hour % 12 || 12;
                    return `${displayHour}:${minutes} ${ampm}`;
                  };
                  const shiftDisplay = `${formatTime(shiftStartTime)} - ${formatTime(e.target.value)}`;
                  setFormData({ ...formData, shift: shiftDisplay });
                }
              }}
              required
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <input
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({...formData, startDate: e.target.value})}
          required
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
        />

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={formData.confirmAssignment}
            onChange={(e) => setFormData({...formData, confirmAssignment: e.target.checked})}
          />
          Confirm Assignment
        </label>

        <button
          type="submit"
          disabled={!formData.confirmAssignment}
          style={{
            gridColumn: '1 / -1',
            padding: '10px 20px',
            backgroundColor: formData.confirmAssignment ? '#7c3aed' : '#d1d5db',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: formData.confirmAssignment ? 'pointer' : 'not-allowed',
            fontWeight: '600',
            fontSize: '16px',
            opacity: formData.confirmAssignment ? 1 : 0.6
          }}
        >
          Create Assignment
        </button>
      </form>

      <div>
        <h3>Current Assignments</h3>
        {assignments.length === 0 ? (
          <p style={{ color: '#999' }}>No assignments yet</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {sortAssignmentsByDateStatus(assignments).map(assignment => {
              const dateStatus = getAssignmentDateStatus(assignment.startDate, assignment.shift);
              const displayInfo = formatAssignmentDisplay(assignment);

              return (
                <div
                  key={assignment._id}
                  style={{
                    padding: '16px',
                    border: `2px solid ${dateStatus.color.border}`,
                    borderRadius: '8px',
                    backgroundColor: dateStatus.color.bg,
                    position: 'relative'
                  }}
                >
                  <div style={{ 
                    position: 'absolute', 
                    top: '12px', 
                    right: '12px',
                    backgroundColor: dateStatus.color.border,
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '700',
                    letterSpacing: '0.5px'
                  }}>
                    {dateStatus.badge}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', paddingRight: '100px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 8px 0', fontWeight: '600', fontSize: '16px', color: dateStatus.color.text }}>
                        {assignment.staffId?.name} → {assignment.clientId?.name}
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px', color: '#666' }}>
                        <p style={{ margin: '0' }}>
                          <strong>Shift:</strong> {assignment.shift}
                        </p>
                        <p style={{ margin: '0' }}>
                          <strong>Date:</strong> {displayInfo?.fullDate || new Date(assignment.startDate).toLocaleDateString('en-IN')}
                        </p>
                        <p style={{ margin: '0' }}>
                          <strong>Status:</strong> {dateStatus.status}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                        {/* Edit Button - disabled for completed assignments */}
                        <button
                          onClick={() => handleEditAssignment(assignment)}
                          disabled={isAssignmentCompleted(assignment)}
                          title={isAssignmentCompleted(assignment) ? 'Cannot edit completed assignments' : 'Edit assignment'}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: isAssignmentCompleted(assignment) ? '#e5e7eb' : '#f3f4f6',
                            color: isAssignmentCompleted(assignment) ? '#9ca3af' : '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            cursor: isAssignmentCompleted(assignment) ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>✏️</span> Edit
                        </button>

                        {/* Reassign Button - always available */}
                        <button
                          onClick={() => handleReassignStaff(assignment)}
                          title="Reassign to different staff member"
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            border: '1px solid #fcd34d',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>🔄</span> Reassign Staff
                        </button>

                        {/* New Shift Button - always available */}
                        <button
                          onClick={() => handleNewShift(assignment)}
                          title="Create new shift for this staff-client pair"
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#dbeafe',
                            color: '#1e40af',
                            border: '1px solid #93c5fd',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>➕</span> New Shift
                        </button>

                        {/* Remove Button - always available */}
                        <button
                          onClick={() => handleDeleteAssignment(assignment)}
                          title="Remove this assignment"
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fca5a5',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>🗑️</span> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        mode={modalMode}
        assignment={selectedAssignment}
        staff={staff}
        clients={modalMode === 'create' ? clients : allClients}
        onSubmit={handleModalSubmit}
        onFetchClients={fetchClients}
      />
    </div>
  );
};

export default AssignStaffTab;
