import { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  Heart,
  Menu,
  X,
  CheckSquare,
  Unlock,
  UserPlus,
  Car,
  ClipboardList,
  Clock,
  ChevronRight,
  History,
  Calendar
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const getNavItems = () => {
    const role = user?.role || 'staff';

    if (role === 'staff') {
      return [
        { path: '/staff/dashboard', icon: LayoutDashboard, label: 'Dashboard', description: 'Overview & stats' },
        { path: '/staff/clients', icon: Users, label: 'My Clients', description: 'Manage clients' },
        { path: '/staff/shifts', icon: Clock, label: 'My Shifts', description: 'View schedule' },
        { path: '/staff/shift-history', icon: History, label: 'Shift History', description: 'Completed shifts' },
      ];
    }

    if (role === 'supervisor') {
      return [
        { path: '/supervisor/dashboard', icon: LayoutDashboard, label: 'Dashboard', description: 'Overview & stats' },
        { path: '/supervisor/clients', icon: Users, label: 'View Clients', description: 'All clients' },
        { path: '/supervisor/notes', icon: FileText, label: 'View Notes', description: 'All staff notes' },
        { path: '/supervisor/verify-notes', icon: CheckSquare, label: 'Verify Notes', description: 'Approve pending' },
        { path: '/supervisor/assign-staff', icon: UserPlus, label: 'Assign Staff', description: 'Staff assignments' },
        { path: '/supervisor/unlock-notes', icon: Unlock, label: 'Unlock Notes', description: 'Edit locked notes' },
        { path: '/supervisor/travel', icon: Car, label: 'Travel Logs', description: 'Travel records' },
        { path: '/supervisor/shift-history', icon: History, label: 'Shift History', description: 'Completed shifts' },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      <motion.button
        className={styles.mobileToggle}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
        whileTap={{ scale: 0.95 }}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </motion.button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className={`${styles.overlay} ${mobileOpen ? styles.visible : ''}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ''}`}
        initial={false}
      >
        {/* Logo */}
        <div className={styles.logoSection}>
          <motion.div
            className={styles.logoIcon}
            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Heart size={26} />
          </motion.div>
          <div className={styles.logoTextWrapper}>
            <span className={styles.logoText}>NexCare</span>
            <span className={styles.logoSubtext}>Care Management</span>
          </div>
        </div>

        {/* Navigation Label */}
        <div className={styles.navSection}>
          <span className={styles.sectionLabel}>Navigation</span>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={closeMobile}
              data-tooltip={item.label}
            >
              <span className={styles.navIconWrapper}>
                <item.icon size={20} className={styles.navIcon} />
              </span>
              <div className={styles.navContent}>
                <span className={styles.navLabel}>{item.label}</span>
                <span className={styles.navDescription}>{item.description}</span>
              </div>
              <ChevronRight size={16} className={styles.navArrow} />
            </NavLink>
          ))}
        </nav>

        {/* Divider */}
        <div className={styles.divider}></div>

        {/* User Section */}
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <motion.div
              className={styles.userAvatar}
              whileHover={{ scale: 1.05 }}
            >
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </motion.div>
            <div className={styles.userDetails}>
              <div className={styles.userName}>{user?.name || 'User'}</div>
              <div className={styles.userRole}>
                <span className={styles.roleBadge}>{user?.role || 'Staff'}</span>
              </div>
            </div>
          </div>

          <motion.button
            className={styles.logoutBtn}
            onClick={handleLogout}
            data-tooltip="Logout"
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className={styles.logoutIconWrapper}>
              <LogOut size={18} />
            </span>
            <span className={styles.navLabel}>Sign Out</span>
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
