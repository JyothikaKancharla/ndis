import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, CheckCircle, Clock, Users, User,
  AlertTriangle, Activity, ChevronRight, UserCheck, UserX, Briefcase
} from 'lucide-react';
import api from '../../api/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ViewNotesTab from '../../components/supervisor/ViewNotesTab';
import VerifyNotesTab from '../../components/supervisor/VerifyNotesTab';
import AssignStaffTab from '../../components/supervisor/AssignStaffTab';
import UnlockNotesTab from '../../components/supervisor/UnlockNotesTab';
import TravelLogTab from '../../components/supervisor/TravelLogTab';
import ShiftHistoryTab from '../../components/supervisor/ShiftHistoryTab';
import ClientsPage from './ClientsPage';
import ClientDetailPage from './ClientDetailPage';
import styles from './Supervisordashboard.module.css';

const pageConfig = {
  '/supervisor/clients': { title: 'View Clients', subtitle: 'All clients', component: 'clients' },
  '/supervisor/notes': { title: 'View Notes', subtitle: 'All staff notes', component: 'view-notes' },
  '/supervisor/verify-notes': { title: 'Verify Notes', subtitle: 'Approve pending notes', component: 'verify-notes' },
  '/supervisor/assign-staff': { title: 'Assign Staff', subtitle: 'Staff assignments', component: 'assign-staff' },
  '/supervisor/unlock-notes': { title: 'Unlock Notes', subtitle: 'Edit locked notes', component: 'unlock-notes' },
  '/supervisor/travel': { title: 'Travel Logs', subtitle: 'Travel records', component: 'travel-log' },
  '/supervisor/shift-history': { title: 'Shift History', subtitle: 'Completed shift records', component: 'shift-history' },
};

const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const Supervisordashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Check for client detail page (dynamic route)
  const pathParts = location.pathname.split('/');
  const isClientDetailPage = pathParts[2] === 'clients' && pathParts.length === 4;
  const clientIdFromPath = isClientDetailPage ? pathParts[3] : null;

  const currentPage = pageConfig[location.pathname] || null;
  const isDashboard = !currentPage && !isClientDetailPage;

  const [stats, setStats] = useState({
    totalNotes: 0,
    pendingNotes: 0,
    verifiedNotes: 0,
    totalStaff: 0,
    totalClients: 0
  });
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(isDashboard);

  useEffect(() => {
    if (isDashboard) {
      setLoading(true);
      fetchDashboardStats();
      fetchOverview();
    }
  }, [isDashboard]);

  const fetchDashboardStats = async () => {
    try {
      const res = await api.get('/api/supervisor/dashboard');
      if (res.data.success && res.data.data) {
        const data = res.data.data;
        setStats({
          totalNotes: parseInt(data.totalNotes) || 0,
          pendingNotes: parseInt(data.pendingNotes) || 0,
          verifiedNotes: parseInt(data.verifiedNotes) || 0,
          totalStaff: parseInt(data.totalStaff) || 0,
          totalClients: parseInt(data.totalClients) || 0
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
    setLoading(false);
  };

  const fetchOverview = async () => {
    try {
      const res = await api.get('/api/supervisor/dashboard/overview');
      if (res.data.success) {
        setOverview(res.data.data);
      }
    } catch (err) {
      console.error('Overview error:', err);
    }
  };

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

  const getActivityDescription = (activity) => {
    const typeLabel = activity.noteType === 'voice' ? 'voice note' : 'text note';
    if (activity.type === 'submission') {
      return `${activity.staffName} submitted a ${typeLabel} for ${activity.clientName}`;
    }
    if (activity.type === 'verification') {
      return `${typeLabel} for ${activity.clientName} by ${activity.staffName} was approved`;
    }
    if (activity.type === 'rejection') {
      return `${typeLabel} for ${activity.clientName} by ${activity.staffName} was rejected`;
    }
    return `${activity.staffName} created a ${typeLabel} for ${activity.clientName}`;
  };

  const getActivityIcon = (type) => {
    if (type === 'submission') return <Clock size={16} />;
    if (type === 'verification') return <CheckCircle size={16} />;
    if (type === 'rejection') return <AlertTriangle size={16} />;
    return <FileText size={16} />;
  };

  const getActivityColor = (type) => {
    if (type === 'submission') return styles.activitySubmission;
    if (type === 'verification') return styles.activityVerification;
    if (type === 'rejection') return styles.activityRejection;
    return '';
  };

  // Client detail page (dynamic route)
  if (isClientDetailPage && clientIdFromPath) {
    return (
      <DashboardLayout title="" subtitle="">
        <ClientDetailPage clientId={clientIdFromPath} />
      </DashboardLayout>
    );
  }

  // Sub-pages: render only the page component with its own title
  if (currentPage) {
    return (
      <DashboardLayout
        title={currentPage.title}
        subtitle={currentPage.subtitle}
      >
        <motion.div
          key={currentPage.component}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {currentPage.component === 'clients' && <ClientsPage />}
          {currentPage.component === 'view-notes' && <ViewNotesTab />}
          {currentPage.component === 'verify-notes' && <VerifyNotesTab />}
          {currentPage.component === 'assign-staff' && <AssignStaffTab />}
          {currentPage.component === 'unlock-notes' && <UnlockNotesTab />}
          {currentPage.component === 'travel-log' && <TravelLogTab />}
          {currentPage.component === 'shift-history' && <ShiftHistoryTab />}
        </motion.div>
      </DashboardLayout>
    );
  }

  // Dashboard home: stats cards + overview sections
  return (
    <DashboardLayout
      title="Supervisor Dashboard"
      subtitle="Manage staff and client care notes efficiently"
      loading={loading}
    >
      {/* Statistics Cards */}
      <motion.div
        className={styles.statsGrid}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className={styles.statCard} variants={itemVariants} whileHover={{ y: -4 }}>
          <p className={styles.statLabel}>Total Notes</p>
          <div className={styles.statContent}>
            <div className={`${styles.statValue} ${styles.blue}`}>{stats.totalNotes}</div>
            <div className={`${styles.statIcon} ${styles.blue}`}>
              <FileText size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div className={styles.statCard} variants={itemVariants} whileHover={{ y: -4 }}>
          <p className={styles.statLabel}>Verified Notes</p>
          <div className={styles.statContent}>
            <div className={`${styles.statValue} ${styles.green}`}>{stats.verifiedNotes}</div>
            <div className={`${styles.statIcon} ${styles.green}`}>
              <CheckCircle size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div className={styles.statCard} variants={itemVariants} whileHover={{ y: -4 }}>
          <p className={styles.statLabel}>Pending Notes</p>
          <div className={styles.statContent}>
            <div className={`${styles.statValue} ${styles.yellow}`}>{stats.pendingNotes}</div>
            <div className={`${styles.statIcon} ${styles.yellow}`}>
              <Clock size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div className={styles.statCard} variants={itemVariants} whileHover={{ y: -4 }}>
          <p className={styles.statLabel}>Total Staff</p>
          <div className={styles.statContent}>
            <div className={`${styles.statValue} ${styles.purple}`}>{stats.totalStaff}</div>
            <div className={`${styles.statIcon} ${styles.purple}`}>
              <Users size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div className={styles.statCard} variants={itemVariants} whileHover={{ y: -4 }}>
          <p className={styles.statLabel}>Total Clients</p>
          <div className={styles.statContent}>
            <div className={`${styles.statValue} ${styles.cyan}`}>{stats.totalClients}</div>
            <div className={`${styles.statIcon} ${styles.cyan}`}>
              <User size={24} />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Dashboard Overview - 4 sections */}
      <motion.div
        className={styles.overviewGrid}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Section 1: Today's Active Shifts */}
        <div className={styles.overviewCard}>
          <div className={styles.overviewHeader}>
            <div className={styles.overviewHeaderLeft}>
              <div className={`${styles.overviewIconWrap} ${styles.blue}`}>
                <Clock size={18} />
              </div>
              <h3 className={styles.overviewTitle}>Today's Active Shifts</h3>
            </div>
            <span className={styles.overviewBadge}>
              {overview?.activeShifts?.length || 0}
            </span>
          </div>
          <div className={styles.overviewBody}>
            {overview?.activeShifts?.length > 0 ? (
              <div className={styles.shiftList}>
                {overview.activeShifts.map((shift, idx) => (
                  <div key={idx} className={styles.shiftRow}>
                    <div className={styles.shiftInfo}>
                      <span className={styles.shiftClient}>
                        {shift.clientId?.name || 'Unknown Client'}
                      </span>
                      <span className={styles.shiftStaff}>
                        {shift.staffId?.name || 'Unassigned'}
                      </span>
                    </div>
                    <div className={styles.shiftMeta}>
                      <span className={styles.shiftTime}>{shift.shift}</span>
                      <span className={`${styles.shiftStatus} ${
                        shift.computedStatus === 'Current' ? styles.statusCurrent : styles.statusPending
                      }`}>
                        {shift.computedStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Clock size={32} strokeWidth={1} />
                <p>No active shifts today</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Pending Actions */}
        <div className={styles.overviewCard}>
          <div className={styles.overviewHeader}>
            <div className={styles.overviewHeaderLeft}>
              <div className={`${styles.overviewIconWrap} ${styles.yellow}`}>
                <AlertTriangle size={18} />
              </div>
              <h3 className={styles.overviewTitle}>Pending Actions</h3>
            </div>
          </div>
          <div className={styles.overviewBody}>
            <div className={styles.actionList}>
              <button
                className={styles.actionItem}
                onClick={() => navigate('/supervisor/verify-notes')}
              >
                <div className={styles.actionLeft}>
                  <CheckCircle size={18} />
                  <span>Notes pending verification</span>
                </div>
                <div className={styles.actionRight}>
                  <span className={styles.actionCount}>
                    {overview?.pendingActions?.pendingNotes || 0}
                  </span>
                  <ChevronRight size={16} />
                </div>
              </button>
              <button
                className={styles.actionItem}
                onClick={() => navigate('/supervisor/assign-staff')}
              >
                <div className={styles.actionLeft}>
                  <Users size={18} />
                  <span>Unassigned clients</span>
                </div>
                <div className={styles.actionRight}>
                  <span className={styles.actionCount}>
                    {overview?.pendingActions?.unassignedClients || 0}
                  </span>
                  <ChevronRight size={16} />
                </div>
              </button>
              <div className={styles.actionItem} style={{ cursor: 'default' }}>
                <div className={styles.actionLeft}>
                  <Briefcase size={18} />
                  <span>Active shifts right now</span>
                </div>
                <div className={styles.actionRight}>
                  <span className={styles.actionCount}>
                    {overview?.pendingActions?.shiftsActive || 0}
                  </span>
                </div>
              </div>
              <button
                className={styles.actionItem}
                onClick={() => navigate('/supervisor/notes')}
              >
                <div className={styles.actionLeft}>
                  <FileText size={18} />
                  <span>Draft notes</span>
                </div>
                <div className={styles.actionRight}>
                  <span className={styles.actionCount}>
                    {overview?.pendingActions?.draftNotes || 0}
                  </span>
                  <ChevronRight size={16} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Recent Activity Feed */}
        <div className={styles.overviewCard}>
          <div className={styles.overviewHeader}>
            <div className={styles.overviewHeaderLeft}>
              <div className={`${styles.overviewIconWrap} ${styles.purple}`}>
                <Activity size={18} />
              </div>
              <h3 className={styles.overviewTitle}>Recent Activity</h3>
            </div>
          </div>
          <div className={`${styles.overviewBody} ${styles.activityBody}`}>
            {overview?.recentActivity?.length > 0 ? (
              <div className={styles.activityList}>
                {overview.recentActivity.map((activity, idx) => (
                  <div key={idx} className={styles.activityItem}>
                    <div className={`${styles.activityIconWrap} ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className={styles.activityContent}>
                      <p className={styles.activityText}>
                        {getActivityDescription(activity)}
                      </p>
                      <span className={styles.activityTime}>
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Activity size={32} strokeWidth={1} />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Staff Availability */}
        <div className={styles.overviewCard}>
          <div className={styles.overviewHeader}>
            <div className={styles.overviewHeaderLeft}>
              <div className={`${styles.overviewIconWrap} ${styles.green}`}>
                <Users size={18} />
              </div>
              <h3 className={styles.overviewTitle}>Staff Availability</h3>
            </div>
          </div>
          <div className={styles.overviewBody}>
            <div className={styles.availabilityStats}>
              <div className={styles.availabilityStat}>
                <div className={`${styles.availabilityIcon} ${styles.availabilityTotal}`}>
                  <Users size={20} />
                </div>
                <div className={styles.availabilityInfo}>
                  <span className={styles.availabilityValue}>
                    {overview?.staffAvailability?.total || 0}
                  </span>
                  <span className={styles.availabilityLabel}>Total Staff</span>
                </div>
              </div>
              <div className={styles.availabilityStat}>
                <div className={`${styles.availabilityIcon} ${styles.availabilityOnShift}`}>
                  <UserCheck size={20} />
                </div>
                <div className={styles.availabilityInfo}>
                  <span className={styles.availabilityValue}>
                    {overview?.staffAvailability?.onShift || 0}
                  </span>
                  <span className={styles.availabilityLabel}>On Shift</span>
                </div>
              </div>
              <div className={styles.availabilityStat}>
                <div className={`${styles.availabilityIcon} ${styles.availabilityFree}`}>
                  <UserX size={20} />
                </div>
                <div className={styles.availabilityInfo}>
                  <span className={styles.availabilityValue}>
                    {overview?.staffAvailability?.available || 0}
                  </span>
                  <span className={styles.availabilityLabel}>Available</span>
                </div>
              </div>
            </div>
            {overview?.staffAvailability?.total > 0 && (
              <div className={styles.availabilityBarWrap}>
                <div className={styles.availabilityBar}>
                  <div
                    className={styles.availabilityBarFill}
                    style={{
                      width: `${(overview.staffAvailability.onShift / overview.staffAvailability.total) * 100}%`
                    }}
                  />
                </div>
                <div className={styles.availabilityBarLabels}>
                  <span>On Shift ({overview.staffAvailability.onShift})</span>
                  <span>Available ({overview.staffAvailability.available})</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Supervisordashboard;
