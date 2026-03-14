import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { SHIFT_COLORS } from '../../constants/shifts';

const MyScheduleTab = () => {
  const [schedule, setSchedule] = useState({});
  const [todayShifts, setTodayShifts] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, [currentWeek]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const startOfWeek = getStartOfWeek(currentWeek);
      const params = new URLSearchParams();
      params.append('week', startOfWeek.toISOString().split('T')[0]);

      const res = await api.get(`/staff/schedule?${params.toString()}`);
      if (res.data.success) {
        setSchedule(res.data.data);
        
        // Extract today's shifts
        const today = new Date().toISOString().split('T')[0];
        setTodayShifts(res.data.data[today]?.shifts || []);
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const prevWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const formatWeekRange = (date) => {
    const start = getStartOfWeek(new Date(date));
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const getDayName = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', { weekday: 'short' });
  };

  const isToday = (dateString) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  const getShiftColor = (shiftTime) => {
    if (shiftTime.includes('7:00 AM') || shiftTime.includes('6:00 AM')) {
      return SHIFT_COLORS['morning'];
    } else if (shiftTime.includes('3:00 PM') || shiftTime.includes('2:00 PM')) {
      return SHIFT_COLORS['afternoon'];
    } else if (shiftTime.includes('11:00 PM') || shiftTime.includes('10:00 PM')) {
      return SHIFT_COLORS['night'];
    } else if (shiftTime.includes('Sleepover')) {
      return SHIFT_COLORS['sleepover'];
    }
    return SHIFT_COLORS['default'];
  };

  const getShiftIcon = (shiftTime) => {
    if (shiftTime.includes('7:00 AM') || shiftTime.includes('6:00 AM')) {
      return '🌅';
    } else if (shiftTime.includes('3:00 PM') || shiftTime.includes('2:00 PM')) {
      return '🌆';
    } else if (shiftTime.includes('11:00 PM') || shiftTime.includes('10:00 PM')) {
      return shiftTime.includes('Sleepover') ? '😴' : '🌙';
    }
    return '⏰';
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeek);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    return {
      date: dateStr,
      name: getDayName(dateStr),
      shifts: schedule[dateStr]?.shifts || []
    };
  });

  return (
    <div style={{ padding: '32px' }}>
      <h3 style={{ margin: '0 0 8px 0', color: '#1a1a2e' }}>📅 My Schedule</h3>
      <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px' }}>
        View your upcoming shift assignments and work schedule.
      </p>

      {/* Week Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px'
      }}>
        <button
          onClick={prevWeek}
          style={{
            padding: '8px 16px',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          ← Previous Week
        </button>
        <h4 style={{ margin: 0, color: '#1a1a2e', fontSize: '16px', fontWeight: '600' }}>
          {formatWeekRange(currentWeek)}
        </h4>
        <button
          onClick={nextWeek}
          style={{
            padding: '8px 16px',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          Next Week →
        </button>
      </div>

      {/* Schedule Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '12px',
        marginBottom: '32px'
      }}>
        {weekDays.map(day => (
          <div
            key={day.date}
            style={{
              backgroundColor: isToday(day.date) ? '#f3e8ff' : 'white',
              border: isToday(day.date) ? '2px solid #7c3aed' : '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
              minHeight: '300px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Day Header */}
            <div style={{
              paddingBottom: '12px',
              borderBottom: '1px solid #e5e7eb',
              marginBottom: '12px'
            }}>
              <div style={{
                fontWeight: '700',
                color: '#1a1a2e',
                fontSize: '14px'
              }}>
                {day.name}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '4px'
              }}>
                {formatDate(day.date)}
              </div>
            </div>

            {/* Shifts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              {day.shifts.length === 0 ? (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  color: '#9ca3af',
                  fontSize: '13px',
                  textAlign: 'center',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  No shifts
                </div>
              ) : (
                day.shifts.map((shift, idx) => {
                  const colors = getShiftColor(shift.shift);
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '10px',
                        backgroundColor: colors.bg,
                        borderLeft: `4px solid ${colors.text}`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: colors.text,
                        fontWeight: '600'
                      }}
                    >
                      <div>{getShiftIcon(shift.shift)} {shift.shift}</div>
                      <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
                        👤 {shift.clientId?.name}
                      </div>
                      <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.8 }}>
                        Room {shift.clientId?.room}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Today's Assignments (if viewing current week) */}
      {todayShifts.length > 0 && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f3e8ff',
          borderRadius: '8px',
          border: '2px solid #7c3aed'
        }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#1a1a2e' }}>📋 Today's Assignments</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
            {todayShifts.map((shift, idx) => (
              <div key={idx} style={{
                padding: '16px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: getShiftColor(shift.shift).bg,
                  color: getShiftColor(shift.shift).text,
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '13px',
                  marginBottom: '12px',
                  display: 'inline-block'
                }}>
                  {getShiftIcon(shift.shift)} {shift.shift}
                </div>
                <h5 style={{ margin: '0 0 8px 0', color: '#1a1a2e' }}>
                  {shift.clientId?.name}
                </h5>
                <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
                  Room {shift.clientId?.room}
                </p>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  backgroundColor: shift.clientId?.careLevel === 'High' ? '#fef2f2' : shift.clientId?.careLevel === 'Medium' ? '#fff7ed' : '#f0fdf4',
                  color: shift.clientId?.careLevel === 'High' ? '#dc2626' : shift.clientId?.careLevel === 'Medium' ? '#ea580c' : '#16a34a',
                  fontSize: '11px',
                  fontWeight: '600',
                  borderRadius: '4px',
                  marginBottom: '12px'
                }}>
                  {shift.clientId?.careLevel} Care
                </span>
                <button
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  ✏️ Write Note
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyScheduleTab;
