import { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Clock, Calendar, FileText, CheckCircle, Activity,
  ArrowRight, Mic
} from 'lucide-react';
import api from '../../api/api';
import { AuthContext } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { formatAssignmentDisplay, getAssignmentDateStatus } from '../../utils/shiftStatus';
import styles from './Staffdashboard.module.css';

export default function Staffdashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentNotes, setRecentNotes] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [activeTab, setActiveTab] = useState('schedule');
  const [stats, setStats] = useState({
    totalAssignments: 0,
    todayShifts: 0,
    totalNotes: 0,
    pendingNotes: 0,
    approvedNotes: 0,
    clientCount: 0
  });
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fetch dashboard data with memoized callback
  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch dashboard summary
      const dashRes = await api.get('/api/staff/dashboard');
      const dashboardData = dashRes.data?.data || dashRes.data;
      setDashboard(dashboardData);

      // Fetch shifts overview for assignments
      const shiftsRes = await api.get(`/api/staff/${user.id}/shifts/overview`);
      const shiftsData = shiftsRes.data?.data || {};
      const assignments = shiftsData.assignments || [];

      // Filter for today's schedule
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);

      const todayAssignments = assignments.filter(assignment => {
        if (!assignment.isActive) return false;
        const startDate = new Date(assignment.startDate);
        startDate.setHours(0, 0, 0, 0);

        // Check if assignment includes today
        let endDate = assignment.endDate ? new Date(assignment.endDate) : new Date(startDate);
        if (!assignment.endDate) {
          endDate.setMonth(endDate.getMonth() + 1);
        }
        endDate.setHours(23, 59, 59, 999);

        return startDate <= endOfToday && endDate >= today;
      });

      // Create schedule items from today's assignments using shared utility
      const scheduleItems = todayAssignments.map((assignment) => {
        // Use backend computedStatus if available, otherwise calculate
        const statusInfo = assignment.computedStatus
          ? {
              status: assignment.computedStatus,
              badge: assignment.statusBadge,
              shiftPhase: assignment.shiftPhase
            }
          : getAssignmentDateStatus(assignment.startDate, assignment.shift);

        const displayInfo = formatAssignmentDisplay(assignment);

        return {
          id: assignment._id,
          clientId: assignment.clientId?._id,
          clientName: assignment.clientId?.name || 'Unknown Client',
          careLevel: assignment.clientId?.careLevel || 'Medium',
          room: assignment.clientId?.room || '',
          shift: assignment.shift,
          startDate: assignment.startDate,
          status: statusInfo.status?.toLowerCase() === 'current' ? 'current' :
                  statusInfo.status?.toLowerCase() === 'previous' ? 'completed' : 'upcoming',
          statusBadge: statusInfo.badge,
          statusColor: displayInfo?.statusColor,
          dateDisplay: displayInfo?.date || 'Today',
          shiftPhase: statusInfo.shiftPhase || assignment.shiftPhase
        };
      });

      setTodaySchedule(scheduleItems);

      // Update stats
      setStats({
        totalAssignments: shiftsData.totalAssignments || assignments.length,
        todayShifts: todayAssignments.length,
        totalNotes: dashboardData.totalNotes || 0,
        pendingNotes: dashboardData.pendingNotes || 0,
        approvedNotes: dashboardData.verifiedNotes || 0,
        clientCount: dashboardData.clientCount || 0
      });

      // Get recent notes
      setRecentNotes(dashboardData.recentNotes || []);

    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.response?.data?.message || err.message || "Error loading dashboard");
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Periodic refresh every 5 minutes and on window focus
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000); // 5 minutes

    const handleFocus = () => {
      fetchDashboardData();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchDashboardData]);


  const getCurrentShiftDisplay = () => {
    // Only show shift if it's currently active (running right now)
    // Backend now only returns active shifts, null otherwise
    if (!dashboard?.shift || dashboard.shiftType !== 'active') {
      return {
        time: null,
        date: '',
        status: null,
        statusColor: '',
        label: 'Current Shift',
        isEmpty: true
      };
    }

    // Format the date for display
    const shiftDate = new Date(dashboard.shift.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dateDisplay = 'Today';
    if (shiftDate.setHours(0, 0, 0, 0) !== today.getTime()) {
      dateDisplay = shiftDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }

    // Shift is currently active
    return {
      time: `${dashboard.shift.startTime} - ${dashboard.shift.endTime}`,
      date: dateDisplay,
      status: 'Active Now',
      statusColor: 'active',
      label: 'Current Shift',
      isEmpty: false
    };
  };

  const shiftDisplay = getCurrentShiftDisplay();

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const noteDate = new Date(date);
    const diffMs = now - noteDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return noteDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const tabs = [
    { id: 'schedule', label: "Today's Schedule", icon: Calendar },
    { id: 'activity', label: 'Recent Activity', icon: Activity }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const getCareLeveColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return styles.careLevelHigh;
      case 'medium': return styles.careLevelMedium;
      case 'low': return styles.careLevelLow;
      default: return styles.careLevelMedium;
    }
  };

  return (
    <DashboardLayout
      title={`Welcome back, ${user?.name || dashboard?.staffName || 'User'}`}
      subtitle="Here's an overview of your work today"
      loading={loading}
      error={error}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Statistics Cards - Similar to Supervisor Dashboard */}
        <motion.div className={styles.statsGrid} variants={itemVariants}>
          <motion.div className={styles.statCard} whileHover={{ y: -4 }}>
            <p className={styles.statLabel}>Assigned Clients</p>
            <div className={styles.statContent}>
              <div className={`${styles.statValue} ${styles.blue}`}>{stats.clientCount}</div>
              <div className={`${styles.statIcon} ${styles.blue}`}>
                <Users size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div className={styles.statCard} whileHover={{ y: -4 }}>
            <p className={styles.statLabel}>Today's Shifts</p>
            <div className={styles.statContent}>
              <div className={`${styles.statValue} ${styles.green}`}>{stats.todayShifts}</div>
              <div className={`${styles.statIcon} ${styles.green}`}>
                <Calendar size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div className={styles.statCard} whileHover={{ y: -4 }}>
            <p className={styles.statLabel}>Pending Notes</p>
            <div className={styles.statContent}>
              <div className={`${styles.statValue} ${styles.yellow}`}>{stats.pendingNotes}</div>
              <div className={`${styles.statIcon} ${styles.yellow}`}>
                <Clock size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div className={styles.statCard} whileHover={{ y: -4 }}>
            <p className={styles.statLabel}>Approved Notes</p>
            <div className={styles.statContent}>
              <div className={`${styles.statValue} ${styles.purple}`}>{stats.approvedNotes}</div>
              <div className={`${styles.statIcon} ${styles.purple}`}>
                <CheckCircle size={24} />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Current Shift Card */}
        <motion.div className={styles.shiftCard} variants={itemVariants}>
          <div className={styles.shiftCardContent}>
            <div className={styles.shiftInfo}>
              <div className={styles.shiftLabel}>Current Shift</div>
              {shiftDisplay.isEmpty ? (
                <>
                  <div className={styles.shiftTime} style={{ color: '#6b7280', fontSize: '1.25rem' }}>
                    No active shift
                  </div>
                  <div className={styles.shiftDate} style={{ color: '#9ca3af' }}>
                    You are not currently on shift
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.shiftTime}>{shiftDisplay.time}</div>
                  {shiftDisplay.date && (
                    <div className={styles.shiftDate}>{shiftDisplay.date}</div>
                  )}
                  {shiftDisplay.status && (
                    <div className={`${styles.shiftStatus} ${styles[shiftDisplay.statusColor]}`}>
                      <span className={styles.statusDot}></span>
                      {shiftDisplay.status}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className={styles.shiftActions}>
              <motion.button
                className={styles.shiftActionBtn}
                onClick={() => navigate('/staff/clients')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Users size={18} />
                View Clients
              </motion.button>
              <motion.button
                className={`${styles.shiftActionBtn} ${styles.secondary}`}
                onClick={() => navigate('/staff/shifts')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Clock size={18} />
                My Shifts
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <motion.div
          className={styles.tabContent}
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'schedule' && (
            <div className={styles.scheduleSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                  <Calendar size={20} />
                  Today's Schedule
                </h3>
                <span className={styles.dateLabel}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>

              {todaySchedule.length === 0 ? (
                <div className={styles.emptyState}>
                  <Calendar size={48} strokeWidth={1} />
                  <p>No scheduled shifts for today</p>
                  <span>Check your shifts page for upcoming assignments</span>
                  <motion.button
                    className={styles.emptyStateBtn}
                    onClick={() => navigate('/staff/shifts')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View All Shifts
                    <ArrowRight size={16} />
                  </motion.button>
                </div>
              ) : (
                <div className={styles.scheduleList}>
                  {todaySchedule.map((item, index) => (
                    <motion.div
                      key={item.id || index}
                      className={`${styles.scheduleCard} ${item.status === 'current' ? styles.currentSchedule : ''}`}
                      whileHover={{ y: -2 }}
                      onClick={() => item.clientId && navigate(`/staff/clients/${item.clientId}/notes`)}
                    >
                      <div className={styles.scheduleLeft}>
                        <div className={styles.scheduleAvatar}>
                          {item.clientName?.charAt(0) || 'C'}
                        </div>
                        <div className={styles.scheduleDetails}>
                          <div className={styles.scheduleClientName}>{item.clientName}</div>
                          <div className={styles.scheduleDateTime}>
                            <span className={styles.scheduleDateBadge}>
                              <Calendar size={12} />
                              {item.dateDisplay}
                            </span>
                            <span className={styles.scheduleTimeBadge}>
                              <Clock size={12} />
                              {item.shift}
                            </span>
                          </div>
                          {item.room && (
                            <div className={styles.scheduleRoom}>Room: {item.room}</div>
                          )}
                        </div>
                      </div>
                      <div className={styles.scheduleRight}>
                        <span className={`${styles.careLevel} ${getCareLeveColor(item.careLevel)}`}>
                          {item.careLevel}
                        </span>
                        <span
                          className={`${styles.scheduleStatus} ${styles[item.status]}`}
                          style={item.statusColor ? {
                            backgroundColor: item.statusColor.bg,
                            color: item.statusColor.text,
                            borderColor: item.statusColor.border
                          } : {}}
                        >
                          {item.statusBadge || (item.status === 'current' ? '● IN PROGRESS' : item.status === 'completed' ? '✓ COMPLETED' : '⏳ UPCOMING')}
                        </span>
                        <ArrowRight size={16} className={styles.scheduleArrow} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className={styles.activitySection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                  <Activity size={20} />
                  Recent Activity
                </h3>
                <span className={styles.dateLabel}>Last 7 days</span>
              </div>

              {recentNotes.length === 0 ? (
                <div className={styles.emptyState}>
                  <FileText size={48} strokeWidth={1} />
                  <p>No recent activity</p>
                  <span>Your notes and updates will appear here</span>
                  <motion.button
                    className={styles.emptyStateBtn}
                    onClick={() => navigate('/staff/clients')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View Clients
                    <ArrowRight size={16} />
                  </motion.button>
                </div>
              ) : (
                <div className={styles.activityList}>
                  {recentNotes.map((note, index) => (
                    <motion.div
                      key={note._id || index}
                      className={styles.activityItem}
                      whileHover={{ x: 4 }}
                      onClick={() => note.clientId?._id && navigate(`/staff/clients/${note.clientId._id}/notes`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={`${styles.activityIcon} ${note.noteType === 'voice' ? styles.voice : note.noteType === 'file' ? styles.file : styles.text}`}>
                        {note.noteType === 'voice' ? <Mic size={16} /> : <FileText size={16} />}
                      </div>
                      <div className={styles.activityContent}>
                        <div className={styles.activityTitle}>
                          {note.noteType === 'voice' ? 'Voice Note' : note.noteType === 'consolidated' ? 'Consolidated Note' : note.noteType === 'file' ? 'File Upload' : 'Text Note'}
                        </div>
                        <div className={styles.activityClient}>
                          {note.clientId?.name || 'Client'}
                        </div>
                        <div className={styles.activityPreview}>
                          {note.content?.substring(0, 80)}{note.content?.length > 80 ? '...' : ''}
                        </div>
                        <div className={styles.activityMeta}>
                          <span className={`${styles.activityStatus} ${styles[note.status?.toLowerCase()]}`}>
                            {note.status}
                          </span>
                          <span className={styles.activityTime}>{formatTimeAgo(note.createdAt)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <motion.button
                className={styles.viewAllBtn}
                onClick={() => navigate('/staff/shift-history')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                View All Notes
                <ArrowRight size={16} />
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
