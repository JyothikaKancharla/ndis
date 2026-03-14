import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { TRIP_PURPOSES, TRIP_STATUSES } from '../../constants/shifts';

const LogTravelTab = ({ onStatsUpdate }) => {
  const [assignedClients, setAssignedClients] = useState([]);
  const [myTrips, setMyTrips] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({ totalTrips: 0, totalKm: 0, approved: 0 });
  const [formData, setFormData] = useState({
    clientId: '',
    tripDate: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    relatedShift: '',
    purpose: '',
    startOdometer: '',
    endOdometer: '',
    staffNotes: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedPurpose, setSelectedPurpose] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clientsRes, tripsRes, statsRes] = await Promise.all([
        api.get('/staff/clients'),
        api.get('/staff/trips'),
        api.get('/staff/trips/stats')
      ]);

      if (clientsRes.data.success) {
        setAssignedClients(clientsRes.data.data);
      }
      if (tripsRes.data.success) {
        setMyTrips(tripsRes.data.data);
      }
      if (statsRes.data.success) {
        setMonthlyStats(statsRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePurposeSelect = (purposeId) => {
    setSelectedPurpose(purposeId);
    const purpose = TRIP_PURPOSES.find(p => p.id === purposeId);
    setFormData({ ...formData, purpose: purpose.label });
  };

  const submitTrip = async (e) => {
    e?.preventDefault();

    if (!formData.clientId) {
      setMessage({ type: 'error', text: 'Please select a client' });
      return;
    }
    if (!formData.purpose) {
      setMessage({ type: 'error', text: 'Please select a purpose' });
      return;
    }
    if (!formData.startOdometer || !formData.endOdometer) {
      setMessage({ type: 'error', text: 'Odometer readings are required' });
      return;
    }
    if (parseInt(formData.endOdometer) <= parseInt(formData.startOdometer)) {
      setMessage({ type: 'error', text: 'End odometer must be greater than start odometer' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/staff/trips', formData);

      if (res.data.success) {
        setMessage({ type: 'success', text: 'Trip submitted successfully!' });
        setFormData({
          clientId: '',
          tripDate: new Date().toISOString().split('T')[0],
          startTime: '',
          endTime: '',
          relatedShift: '',
          purpose: '',
          startOdometer: '',
          endOdometer: '',
          staffNotes: ''
        });
        setSelectedPurpose('');
        fetchData();
        onStatsUpdate?.();

        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to submit trip';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const totalDistance = formData.startOdometer && formData.endOdometer
    ? parseInt(formData.endOdometer) - parseInt(formData.startOdometer)
    : 0;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
      {message.text && (
        <div style={{
          gridColumn: '1 / -1',
          padding: '16px',
          borderRadius: '8px',
          backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: message.type === 'success' ? '#166534' : '#991b1b',
          marginBottom: '16px'
        }}>
          {message.type === 'success' ? '✓' : '⚠️'} {message.text}
        </div>
      )}

      {/* Form */}
      <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} onSubmit={submitTrip}>
        <h3 style={{ margin: '0 0 8px 0', color: '#1a1a2e' }}>🚗 Log Travel</h3>
        <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '14px' }}>
          Record odometer readings for client transport. Requires supervisor approval for NDIS billing.
        </p>

        {/* Client */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
            Client *
          </label>
          <select
            name="clientId"
            value={formData.clientId}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            <option value="">Select a client</option>
            {assignedClients.map(client => (
              <option key={client._id} value={client._id}>
                {client.name} - Room {client.room}
              </option>
            ))}
          </select>
        </div>

        {/* Date & Time */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
            Trip Date *
          </label>
          <input
            type="date"
            name="tripDate"
            value={formData.tripDate}
            onChange={handleInputChange}
            max={new Date().toISOString().split('T')[0]}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Start Time *
            </label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              End Time *
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Purpose */}
        <div>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#374151' }}>
            Purpose *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {TRIP_PURPOSES.map(purpose => (
              <button
                key={purpose.id}
                type="button"
                onClick={() => handlePurposeSelect(purpose.id)}
                style={{
                  padding: '10px',
                  border: selectedPurpose === purpose.id ? '2px solid #7c3aed' : '1px solid #e5e7eb',
                  borderRadius: '6px',
                  backgroundColor: selectedPurpose === purpose.id ? '#f3e8ff' : 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  color: selectedPurpose === purpose.id ? '#7c3aed' : '#374151'
                }}
              >
                {purpose.icon} {purpose.label}
              </button>
            ))}
          </div>
        </div>

        {/* Odometer */}
        <div>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#374151' }}>
            🚗 Odometer Readings
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280' }}>Start (km) *</label>
              <input
                type="number"
                name="startOdometer"
                value={formData.startOdometer}
                onChange={handleInputChange}
                min="0"
                placeholder="45230"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ fontSize: '18px', color: '#6b7280' }}>→</div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280' }}>End (km) *</label>
              <input
                type="number"
                name="endOdometer"
                value={formData.endOdometer}
                onChange={handleInputChange}
                min="0"
                placeholder="45258"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {totalDistance > 0 && parseInt(formData.endOdometer) > parseInt(formData.startOdometer) && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: '#f0fdf4',
              borderRadius: '6px',
              color: '#16a34a',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              Total Distance: {totalDistance} km
            </div>
          )}

          {formData.endOdometer && parseInt(formData.endOdometer) <= parseInt(formData.startOdometer) && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: '#fef2f2',
              borderRadius: '6px',
              color: '#dc2626',
              textAlign: 'center'
            }}>
              ⚠️ End must be greater than start
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
            Notes (Optional)
          </label>
          <textarea
            name="staffNotes"
            value={formData.staffNotes}
            onChange={handleInputChange}
            rows="3"
            placeholder="Any additional details about the trip..."
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !formData.clientId || !formData.purpose || !formData.startOdometer || !formData.endOdometer || totalDistance <= 0}
          style={{
            padding: '12px',
            backgroundColor: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            opacity: submitting || !formData.clientId || !formData.purpose ? 0.6 : 1
          }}
        >
          📤 Submit Trip
        </button>
      </form>

      {/* Right Column - Trips */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Recent Trips */}
        <div>
          <h4 style={{ margin: '0 0 16px 0', color: '#1a1a2e' }}>🚗 My Recent Trips</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflow: 'auto' }}>
            {myTrips.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '13px' }}>No trips logged yet</p>
            ) : (
              myTrips.map(trip => (
                <div key={trip._id} style={{
                  padding: '12px',
                  backgroundColor: 'white',
                  borderLeft: `3px solid ${TRIP_STATUSES.find(s => s.label === trip.status)?.color || '#6b7280'}`,
                  borderRadius: '6px',
                  border: `1px solid #e5e7eb`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#1a1a2e' }}>{trip.clientId?.name}</span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '2px 6px',
                      backgroundColor: `${TRIP_STATUSES.find(s => s.label === trip.status)?.color || '#6b7280'}15`,
                      color: TRIP_STATUSES.find(s => s.label === trip.status)?.color,
                      borderRadius: '3px'
                    }}>
                      {trip.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', gap: '12px' }}>
                    <span>📅 {formatDate(trip.tripDate)}</span>
                    <span>🎯 {trip.purpose}</span>
                    <span>📍 {trip.totalDistance} km</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Monthly Summary */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#1a1a2e' }}>📊 This Month</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#7c3aed' }}>
                {monthlyStats.totalTrips}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Trips</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                {monthlyStats.totalKm || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>km</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e' }}>
                {monthlyStats.approved}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Approved</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogTravelTab;
