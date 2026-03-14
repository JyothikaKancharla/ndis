import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

/**
 * AssignmentModal - Modal for managing assignments
 * Modes: 'create' | 'edit' | 'reassign' | 'new_shift'
 *
 * - create: New assignment from scratch
 * - edit: Modify existing assignment (time, date)
 * - reassign: Assign client to different staff (creates new assignment)
 * - new_shift: Create new shift for same staff-client pair
 */
const AssignmentModal = ({
  isOpen,
  onClose,
  mode = 'create',
  assignment = null,
  staff = [],
  clients = [],
  onSubmit,
  onFetchClients
}) => {
  const [formData, setFormData] = useState({
    staffId: '',
    clientId: '',
    shift: '',
    startDate: '',
    confirmAssignment: false
  });
  const [shiftStartTime, setShiftStartTime] = useState('');
  const [shiftEndTime, setShiftEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form based on mode and assignment
  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'create') {
      // Fresh form
      setFormData({
        staffId: '',
        clientId: '',
        shift: '',
        startDate: '',
        confirmAssignment: false
      });
      setShiftStartTime('');
      setShiftEndTime('');
    } else if (assignment) {
      // Parse existing shift time
      const shiftMatch = assignment.shift?.match(/(\d+):(\d+)\s*(AM|PM)\s*-\s*(\d+):(\d+)\s*(AM|PM)/i);
      let startTime = '';
      let endTime = '';

      if (shiftMatch) {
        // Convert to 24h format for time input
        let startHour = parseInt(shiftMatch[1]);
        const startMin = shiftMatch[2];
        const startPeriod = shiftMatch[3].toUpperCase();
        if (startPeriod === 'PM' && startHour !== 12) startHour += 12;
        if (startPeriod === 'AM' && startHour === 12) startHour = 0;
        startTime = `${String(startHour).padStart(2, '0')}:${startMin}`;

        let endHour = parseInt(shiftMatch[4]);
        const endMin = shiftMatch[5];
        const endPeriod = shiftMatch[6].toUpperCase();
        if (endPeriod === 'PM' && endHour !== 12) endHour += 12;
        if (endPeriod === 'AM' && endHour === 12) endHour = 0;
        endTime = `${String(endHour).padStart(2, '0')}:${endMin}`;
      }

      setShiftStartTime(startTime);
      setShiftEndTime(endTime);

      if (mode === 'edit') {
        // Edit mode: Pre-fill all fields
        setFormData({
          staffId: assignment.staffId?._id || assignment.staffId || '',
          clientId: assignment.clientId?._id || assignment.clientId || '',
          shift: assignment.shift || '',
          startDate: assignment.startDate ? new Date(assignment.startDate).toISOString().split('T')[0] : '',
          confirmAssignment: false
        });
      } else if (mode === 'reassign') {
        // Reassign mode: Keep client, allow staff change, require new date
        setFormData({
          staffId: '', // Staff needs to be selected
          clientId: assignment.clientId?._id || assignment.clientId || '',
          shift: assignment.shift || '',
          startDate: '', // New date required
          isRecurring: false,
          recurringDays: []
        });
      } else if (mode === 'new_shift') {
        // New shift mode: Keep staff and client, require new date/time
        setFormData({
          staffId: assignment.staffId?._id || assignment.staffId || '',
          clientId: assignment.clientId?._id || assignment.clientId || '',
          shift: '',
          startDate: '',
          isRecurring: false,
          recurringDays: []
        });
        setShiftStartTime('');
        setShiftEndTime('');
      }
    }

    setError('');
  }, [isOpen, mode, assignment]);

  // Fetch clients when staff changes (for reassign mode)
  useEffect(() => {
    if (mode === 'reassign' && formData.staffId && onFetchClients) {
      onFetchClients(formData.staffId);
    }
  }, [formData.staffId, mode, onFetchClients]);

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleTimeChange = (type, value) => {
    if (type === 'start') {
      setShiftStartTime(value);
      if (value && shiftEndTime) {
        const shiftDisplay = `${formatTime(value)} - ${formatTime(shiftEndTime)}`;
        setFormData(prev => ({ ...prev, shift: shiftDisplay }));
      }
    } else {
      setShiftEndTime(value);
      if (shiftStartTime && value) {
        const shiftDisplay = `${formatTime(shiftStartTime)} - ${formatTime(value)}`;
        setFormData(prev => ({ ...prev, shift: shiftDisplay }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate
      if (!formData.staffId) {
        throw new Error('Please select a staff member');
      }
      if (!formData.clientId) {
        throw new Error('Please select a client');
      }
      if (!formData.shift) {
        throw new Error('Please set shift times');
      }
      if (!formData.startDate) {
        throw new Error('Please select a start date');
      }

      // For create/reassign/new_shift modes, require confirmation
      if ((mode === 'create' || mode === 'reassign' || mode === 'new_shift') && !formData.confirmAssignment) {
        throw new Error('Please confirm the assignment before creating');
      }

      // Prepare submission data
      const submitData = {
        ...formData,
        // For reassign and new_shift modes, we always create a new assignment
        isNewAssignment: mode === 'reassign' || mode === 'new_shift' || mode === 'create'
      };

      await onSubmit(submitData, mode, assignment?._id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save assignment');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'edit':
        return 'Edit Assignment';
      case 'reassign':
        return 'Reassign Client to Different Staff';
      case 'new_shift':
        return 'Assign New Shift';
      default:
        return 'Create New Assignment';
    }
  };

  const getSubmitLabel = () => {
    switch (mode) {
      case 'edit':
        return 'Update Assignment';
      case 'reassign':
        return 'Reassign Staff';
      case 'new_shift':
        return 'Create New Shift';
      default:
        return 'Create Assignment';
    }
  };

  const getClientName = () => {
    if (!assignment?.clientId) return '';
    return assignment.clientId.name || '';
  };

  const getStaffName = () => {
    if (!assignment?.staffId) return '';
    return assignment.staffId.name || '';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      size="medium"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="assignment-form"
            disabled={loading || ((mode === 'create' || mode === 'reassign' || mode === 'new_shift') && !formData.confirmAssignment)}
            style={{
              padding: '10px 20px',
              backgroundColor: (loading || ((mode === 'create' || mode === 'reassign' || mode === 'new_shift') && !formData.confirmAssignment)) ? '#9ca3af' : '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: (loading || ((mode === 'create' || mode === 'reassign' || mode === 'new_shift') && !formData.confirmAssignment)) ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              opacity: (loading || ((mode === 'create' || mode === 'reassign' || mode === 'new_shift') && !formData.confirmAssignment)) ? 0.6 : 1
            }}
          >
            {loading ? 'Saving...' : getSubmitLabel()}
          </button>
        </>
      }
    >
      {/* Info banner for reassign/new_shift modes */}
      {(mode === 'reassign' || mode === 'new_shift') && assignment && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: mode === 'reassign' ? '#fef3c7' : '#dbeafe',
          borderRadius: '8px',
          marginBottom: '20px',
          border: `1px solid ${mode === 'reassign' ? '#fcd34d' : '#93c5fd'}`
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: mode === 'reassign' ? '#92400e' : '#1e40af' }}>
            {mode === 'reassign' ? (
              <>
                <strong>Reassigning:</strong> {getClientName()} (currently assigned to {getStaffName()})
                <br />
                <span style={{ fontSize: '13px' }}>Select a new staff member. The old assignment will be removed.</span>
              </>
            ) : (
              <>
                <strong>New shift for:</strong> {getStaffName()} → {getClientName()}
                <br />
                <span style={{ fontSize: '13px' }}>Creating an additional shift assignment for this staff-client pair.</span>
              </>
            )}
          </p>
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fee2e2',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #fecaca',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}

      <form id="assignment-form" onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Staff Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Staff Member *
            </label>
            <select
              value={formData.staffId}
              onChange={(e) => setFormData(prev => ({ ...prev, staffId: e.target.value }))}
              disabled={mode === 'edit' || mode === 'new_shift'}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                backgroundColor: (mode === 'edit' || mode === 'new_shift') ? '#f3f4f6' : 'white',
                cursor: (mode === 'edit' || mode === 'new_shift') ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="">Select Staff Member</option>
              {staff.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            {(mode === 'edit' || mode === 'new_shift') && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
                Staff cannot be changed in {mode === 'edit' ? 'edit' : 'new shift'} mode. Use "Reassign Staff" instead.
              </p>
            )}
          </div>

          {/* Client Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Client *
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
              disabled={mode === 'edit' || mode === 'new_shift' || mode === 'reassign'}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                backgroundColor: (mode !== 'create') ? '#f3f4f6' : 'white',
                cursor: (mode !== 'create') ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="">Select Client</option>
              {clients.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Shift Times */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Shift Time *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  Start Time
                </label>
                <input
                  type="time"
                  value={shiftStartTime}
                  onChange={(e) => handleTimeChange('start', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  End Time
                </label>
                <input
                  type="time"
                  value={shiftEndTime}
                  onChange={(e) => handleTimeChange('end', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
            {formData.shift && (
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#059669', fontWeight: '500' }}>
                Shift: {formData.shift}
              </p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Start Date *
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              min={mode !== 'edit' ? new Date().toISOString().split('T')[0] : undefined}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            {(mode === 'reassign' || mode === 'new_shift') && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
                Select the date for the new assignment. Future dates only.
              </p>
            )}
          </div>

          {/* Confirm Assignment */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.confirmAssignment}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmAssignment: e.target.checked }))}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Confirm Assignment
              </span>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AssignmentModal;
