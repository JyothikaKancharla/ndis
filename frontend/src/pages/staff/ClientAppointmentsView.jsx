import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, MapPin, FileText, CheckCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../api/api';

const ClientAppointmentsView = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientAppointments();
    fetchClientInfo();
  }, [clientId]);

  const fetchClientInfo = async () => {
    try {
      const res = await api.get(`/api/staff/clients/${clientId}/assignment`);
      const assignmentData = res.data?.data || res.data;
      setClient(assignmentData?.clientId || { name: 'Client' });
    } catch (err) {
      console.error('Failed to fetch client info:', err);
    }
  };

  const fetchClientAppointments = async () => {
    try {
      setLoading(true);
      // Fetch all staff appointments and filter by this client
      const res = await api.get('/api/staff/appointments');
      const allAppointments = res.data.data || [];

      // Filter appointments for this specific client
      const clientAppointments = allAppointments.filter(
        apt => apt.clientId?._id === clientId || apt.clientId === clientId
      );

      setAppointments(clientAppointments);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (appointmentId) => {
    try {
      await api.put(`/api/staff/appointments/${appointmentId}/complete`);
      fetchClientAppointments();
    } catch (err) {
      console.error('Failed to complete appointment:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return { bg: '#dbeafe', color: '#1e40af', border: '#3b82f6' };
      case 'Completed': return { bg: '#dcfce7', color: '#166534', border: '#22c55e' };
      case 'Cancelled': return { bg: '#fee2e2', color: '#991b1b', border: '#ef4444' };
      default: return { bg: '#f3f4f6', color: '#6b7280', border: '#9ca3af' };
    }
  };

  const upcomingAppointments = appointments.filter(
    apt => apt.status === 'Scheduled' && new Date(apt.appointmentDate) >= new Date()
  );

  const pastAppointments = appointments.filter(
    apt => apt.status !== 'Scheduled' || new Date(apt.appointmentDate) < new Date()
  );

  return (
    <DashboardLayout
      title={`Appointments - ${client?.name || 'Client'}`}
      subtitle="View appointments scheduled by supervisor"
    >
      <div style={{ padding: '20px' }}>
        {/* Back Button */}
        <button
          onClick={() => navigate(`/staff/clients/${clientId}/notes`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'transparent',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#7e3285',
            marginBottom: '20px'
          }}
        >
          <ArrowLeft size={16} />
          Back to Notes
        </button>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            Loading appointments...
          </div>
        ) : (
          <>
            {/* Upcoming Appointments */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#7e3285',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Calendar size={20} />
                Upcoming Appointments ({upcomingAppointments.length})
              </h3>

              {upcomingAppointments.length === 0 ? (
                <div style={{
                  background: '#f9fafb',
                  padding: '40px',
                  textAlign: 'center',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <Calendar size={32} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>
                    No upcoming appointments for this client
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {upcomingAppointments.map(appointment => {
                    const statusStyle = getStatusColor(appointment.status);

                    return (
                      <div
                        key={appointment._id}
                        style={{
                          background: '#fff',
                          padding: '20px',
                          borderRadius: '12px',
                          border: `2px solid ${statusStyle.border}`,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}
                      >
                        {/* Header */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '16px'
                        }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#333' }}>
                              {appointment.title}
                            </h4>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#666', flexWrap: 'wrap' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={14} />
                                {new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Clock size={14} />
                                {appointment.startTime}
                                {appointment.endTime && ` - ${appointment.endTime}`}
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

                        {/* Description */}
                        {appointment.description && (
                          <div style={{
                            padding: '12px',
                            background: '#f8f4f9',
                            borderRadius: '8px',
                            marginBottom: '12px',
                            border: '1px solid #e9d5f0'
                          }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#7e3285',
                              marginBottom: '6px'
                            }}>
                              Description
                            </div>
                            <p style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
                              {appointment.description}
                            </p>
                          </div>
                        )}

                        {/* Location */}
                        {appointment.location && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            color: '#666',
                            marginBottom: '12px'
                          }}>
                            <MapPin size={14} color="#7e3285" />
                            <span>{appointment.location}</span>
                          </div>
                        )}

                        {/* Supervisor Notes */}
                        {appointment.notes && (
                          <div style={{
                            padding: '12px',
                            background: '#eff6ff',
                            borderRadius: '8px',
                            marginBottom: '12px',
                            border: '1px solid #bfdbfe'
                          }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#1e40af',
                              marginBottom: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <FileText size={12} />
                              Supervisor Instructions
                            </div>
                            <p style={{ margin: 0, fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                              {appointment.notes}
                            </p>
                          </div>
                        )}

                        {/* Created By */}
                        <div style={{
                          fontSize: '12px',
                          color: '#999',
                          fontStyle: 'italic',
                          marginBottom: appointment.status === 'Scheduled' ? '12px' : '0'
                        }}>
                          Scheduled by: {appointment.supervisorId?.name || 'Supervisor'}
                        </div>

                        {/* Mark Complete Button */}
                        {appointment.status === 'Scheduled' && (
                          <button
                            onClick={() => handleMarkComplete(appointment._id)}
                            style={{
                              width: '100%',
                              padding: '12px',
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
                              gap: '8px',
                              marginTop: '12px'
                            }}
                          >
                            <CheckCircle size={16} />
                            Mark as Complete
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Past Appointments */}
            {pastAppointments.length > 0 && (
              <div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#666',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Clock size={20} />
                  Past Appointments ({pastAppointments.length})
                </h3>

                <div style={{ display: 'grid', gap: '12px' }}>
                  {pastAppointments.map(appointment => {
                    const statusStyle = getStatusColor(appointment.status);

                    return (
                      <div
                        key={appointment._id}
                        style={{
                          background: '#fff',
                          padding: '16px',
                          borderRadius: '12px',
                          border: '1px solid #e5e7eb',
                          opacity: 0.8
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#333' }}>
                              {appointment.title}
                            </h4>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#666' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={12} />
                                {new Date(appointment.appointmentDate).toLocaleDateString()}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Clock size={12} />
                                {appointment.startTime}
                              </span>
                            </div>
                          </div>
                          <span style={{
                            padding: '4px 10px',
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientAppointmentsView;
