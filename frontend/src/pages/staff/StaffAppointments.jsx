import { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../api/api';
import styles from './StaffAppointments.module.css';

const StaffAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = filter === 'upcoming' ? { upcoming: 'true' } : {};
      const res = await api.get('/api/staff/appointments', { params });
      setAppointments(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (appointmentId) => {
    try {
      await api.put(`/api/staff/appointments/${appointmentId}/complete`);
      fetchAppointments();
    } catch (err) {
      console.error('Failed to complete appointment:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return { bg: '#dbeafe', color: '#1e40af' };
      case 'Completed': return { bg: '#dcfce7', color: '#166534' };
      case 'Cancelled': return { bg: '#fee2e2', color: '#991b1b' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const filterTabs = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'all', label: 'All Appointments' }
  ];

  if (loading) {
    return (
      <DashboardLayout title="My Appointments" subtitle="Scheduled by supervisor">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', color: '#666' }}>Loading appointments...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Appointments" subtitle="Scheduled by supervisor">
      <div style={{ padding: '20px' }}>
        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '2px solid #f3f4f6',
          paddingBottom: '8px'
        }}>
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '10px 20px',
                background: filter === tab.key ? '#7e3285' : 'transparent',
                color: filter === tab.key ? '#fff' : '#666',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Appointments List */}
        {appointments.length === 0 ? (
          <div style={{
            background: '#f9fafb',
            padding: '60px 20px',
            textAlign: 'center',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <Calendar size={48} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#6b7280', fontSize: '16px' }}>
              {filter === 'upcoming' ? 'No upcoming appointments' : 'No appointments found'}
            </p>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '8px' }}>
              Your supervisor will schedule appointments for you
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {appointments.map(appointment => {
              const statusStyle = getStatusColor(appointment.status);
              const isUpcoming = appointment.status === 'Scheduled' && new Date(appointment.appointmentDate) >= new Date();

              return (
                <div
                  key={appointment._id}
                  style={{
                    background: '#fff',
                    padding: '20px',
                    borderRadius: '12px',
                    border: isUpcoming ? '2px solid #7e3285' : '1px solid #e5e7eb',
                    boxShadow: isUpcoming ? '0 4px 12px rgba(126,50,133,0.1)' : 'none'
                  }}
                >
                  {/* Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#333'
                      }}>
                        {appointment.title}
                      </h3>
                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        fontSize: '14px',
                        color: '#666',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} />
                          {new Date(appointment.appointmentDate).toLocaleDateString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} />
                          {appointment.startTime}
                          {appointment.endTime && ` - ${appointment.endTime}`}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={14} />
                          {appointment.clientId?.name || 'Unknown Client'}
                        </span>
                      </div>
                    </div>
                    <span style={{
                      padding: '6px 12px',
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {appointment.status}
                    </span>
                  </div>

                  {/* Details */}
                  {appointment.description && (
                    <div style={{
                      padding: '12px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: '#666',
                        lineHeight: '1.6'
                      }}>
                        {appointment.description}
                      </p>
                    </div>
                  )}

                  {appointment.location && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      color: '#666',
                      marginBottom: '12px'
                    }}>
                      <MapPin size={14} />
                      {appointment.location}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {isUpcoming && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                      <button
                        onClick={() => handleMarkComplete(appointment._id)}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          background: '#22c55e',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <CheckCircle size={16} />
                        Mark as Complete
                      </button>
                    </div>
                  )}

                  {/* Created by info */}
                  <div style={{
                    marginTop: '12px',
                    fontSize: '12px',
                    color: '#999',
                    fontStyle: 'italic'
                  }}>
                    Scheduled by: {appointment.supervisorId?.name || 'Supervisor'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffAppointments;
