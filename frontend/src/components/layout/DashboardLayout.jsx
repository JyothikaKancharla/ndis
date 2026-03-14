import { motion } from 'framer-motion';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import Sidebar from './Sidebar';
import styles from './DashboardLayout.module.css';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const getBreadcrumbs = (pathname) => {
  const segments = pathname.split('/').filter(Boolean);
  const role = segments[0];
  if (!role) return [];

  // Dashboard pages (root) get no breadcrumbs
  const isDashboard = segments.length <= 1 ||
    segments[1] === 'dashboard' ||
    (role === 'supervisor' && segments.length === 1);
  if (isDashboard) return [];

  const dashboardPath = `/${role}/dashboard`;
  const crumbs = [{ label: 'Dashboard', path: dashboardPath }];

  if (role === 'staff') {
    if (segments[1] === 'clients') {
      crumbs.push({ label: 'My Clients', path: '/staff/clients' });

      if (segments.length >= 4) {
        const clientId = segments[2];
        const subPage = segments[3];

        if (subPage === 'notes') {
          crumbs.push({ label: 'Client Notes', path: `/staff/clients/${clientId}/notes` });
          if (segments[4]) {
            crumbs.push({ label: 'View Note' });
          }
        } else if (subPage === 'write-note') {
          crumbs.push({ label: 'Client Notes', path: `/staff/clients/${clientId}/notes` });
          crumbs.push({ label: 'Write Note' });
        } else if (subPage === 'voice-note') {
          crumbs.push({ label: 'Client Notes', path: `/staff/clients/${clientId}/notes` });
          crumbs.push({ label: 'Voice Note' });
        } else if (subPage === 'edit-note') {
          crumbs.push({ label: 'Client Notes', path: `/staff/clients/${clientId}/notes` });
          crumbs.push({ label: 'Edit Note' });
        } else if (subPage === 'review-note') {
          crumbs.push({ label: 'Client Notes', path: `/staff/clients/${clientId}/notes` });
          crumbs.push({ label: 'Review Note' });
        } else if (subPage === 'daily-consolidation') {
          crumbs.push({ label: 'Client Notes', path: `/staff/clients/${clientId}/notes` });
          crumbs.push({ label: 'Daily Consolidation' });
        } else if (subPage === 'appointment') {
          crumbs.push({ label: 'Client Notes', path: `/staff/clients/${clientId}/notes` });
          crumbs.push({ label: 'Appointment' });
        } else if (subPage === 'incident') {
          crumbs.push({ label: 'Client Notes', path: `/staff/clients/${clientId}/notes` });
          crumbs.push({ label: 'Incident Report' });
        }
      }
    } else if (segments[1] === 'shifts') {
      crumbs.push({ label: 'My Shifts' });
    } else if (segments[1] === 'shift-history') {
      crumbs.push({ label: 'Shift History' });
    }
  }

  if (role === 'supervisor') {
    const page = segments[1];
    const dash = { label: 'Dashboard', path: '/supervisor/dashboard' };
    if (page === 'notes') return [dash, { label: 'View Notes' }];
    if (page === 'verify-notes') return [dash, { label: 'Verify Notes' }];
    if (page === 'assign-staff') return [dash, { label: 'Assign Staff' }];
    if (page === 'unlock-notes') return [dash, { label: 'Unlock Notes' }];
    if (page === 'travel') return [dash, { label: 'Travel Logs' }];
    if (page === 'shift-history') return [dash, { label: 'Shift History' }];
  }

  return crumbs.length >= 2 ? crumbs : [];
};

const DashboardLayout = ({
  children,
  title,
  subtitle,
  headerRight,
  loading = false,
  error = null
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const breadcrumbs = getBreadcrumbs(location.pathname);
  const parentCrumb = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null;

  if (loading) {
    return (
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.mainContent}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner} />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.mainContent}>
          <div className={styles.errorContainer}>
            <svg
              className={styles.errorIcon}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className={styles.errorMessage}>{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.mainContent}>
        {(title || headerRight || breadcrumbs.length >= 1) && (
          <header className={styles.header}>
            {breadcrumbs.length >= 1 && (
              <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
                {breadcrumbs.map((crumb, index) => (
                  <span key={index} className={styles.breadcrumbItem}>
                    {(index > 0 || breadcrumbs.length === 1) && <ChevronRight size={14} className={styles.breadcrumbSeparator} />}
                    {crumb.path && index < breadcrumbs.length - 1 ? (
                      <Link to={crumb.path} className={styles.breadcrumbLink}>
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={styles.breadcrumbCurrent}>{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
            <div className={styles.headerContent}>
              <div className={styles.headerLeft}>
                <div className={styles.titleRow}>
                  {parentCrumb?.path && (
                    <button
                      className={styles.backArrow}
                      onClick={() => navigate(parentCrumb.path)}
                      aria-label={`Back to ${parentCrumb.label}`}
                    >
                      <ArrowLeft size={20} />
                    </button>
                  )}
                  {title && <h1 className={styles.pageTitle}>{title}</h1>}
                </div>
                {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
              </div>
              {headerRight && (
                <div className={styles.headerRight}>
                  {headerRight}
                </div>
              )}
            </div>
          </header>
        )}
        <motion.div
          className={styles.content}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardLayout;
