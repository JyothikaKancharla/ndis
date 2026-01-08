import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import { Link } from 'react-router-dom';

const Supervisordashboard = () => {
	const [dashboard, setDashboard] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchDashboard = async () => {
			setLoading(true);
			try {
				const res = await api.get('/api/supervisor/dashboard');
				setDashboard(res.data);
			} catch (err) {
				setError(err.response?.data?.message || err.message || "Error loading dashboard");
			}
			setLoading(false);
		};
		fetchDashboard();
	}, []);

	if (loading) return <div style={{ color: '#805AD5', textAlign: 'center', marginTop: 40, fontSize: 18 }}>Loading dashboard...</div>;
	if (error) return <div style={{ color: '#C53030', textAlign: 'center', marginTop: 40, fontSize: 18 }}>{error}</div>;
	if (!dashboard) return null;

	return (
		<div style={styles.page}>
			{/* Top summary cards */}
			<div style={styles.summaryRow}>
				<div style={styles.summaryCard}>
					<div style={styles.summaryLabel}>Total Clients</div>
					<div style={styles.summaryValue}>{dashboard.totalClients}</div>
					<div style={styles.summarySub}>Active clients in system</div>
				</div>
				<div style={styles.summaryCard}>
					<div style={styles.summaryLabel}>Staff Members</div>
					<div style={styles.summaryValue}>{dashboard.staffMembers}</div>
					<div style={styles.summarySub}>Currently on roster</div>
				</div>
				<div style={styles.summaryCard}>
					<div style={styles.summaryLabel}>Pending Verifications</div>
					<div style={styles.summaryValue}>{dashboard.pendingVerifications}</div>
					<div style={styles.summarySub}>Awaiting review</div>
				</div>
				<div style={styles.summaryCard}>
					<div style={styles.summaryLabel}>Completed Today</div>
					<div style={styles.summaryValue}>{dashboard.completedToday}</div>
					<div style={styles.summarySub}>Notes verified</div>
				</div>
			</div>

			{/* Main cards row */}
			<div style={styles.cardsRow}>
				<div style={styles.bigCard}>
					<div style={styles.bigCardTitle}>Client Notes</div>
					<div style={styles.bigCardDesc}>Review and verify client care notes</div>
					<Link to="/supervisor/notes-verification">
						<button style={styles.actionBtn}>View Notes &rarr;</button>
					</Link>
				</div>
				<div style={{ ...styles.bigCard, background: '#F1F8FF', border: '1.5px solid #B8A6D9' }}>
					<div style={styles.bigCardTitle}>Staff & Clients</div>
					<div style={styles.bigCardDesc}>Manage staff-client assignments</div>
					<Link to="/supervisor/assignments">
						<button style={styles.actionBtnBlue}>View Assignments &rarr;</button>
					</Link>
				</div>
				<div style={styles.bigCard}>
					<div style={styles.bigCardTitle}>Client Management</div>
					<div style={styles.bigCardDesc}>Add or edit client records</div>
					<Link to="/supervisor/clients">
						<button style={styles.actionBtnBlue}>Manage Clients &rarr;</button>
					</Link>
				</div>
			</div>

			{/* Activity and Alerts */}
			<div style={styles.bottomRow}>
				<div style={{ ...styles.activityBox, flex: 1 }}>
					<div style={styles.sectionTitle}>Recent Activity</div>
					<div style={styles.activityList}>
						{dashboard.recentNotes.map((note, i) => (
							<div key={note._id || i} style={styles.activityItem}>
								<div style={styles.activityIcon}><svg width="20" height="20" fill="none" stroke="#B8A6D9" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 9h18"/></svg></div>
								<div style={{ flex: 1 }}>
									<div style={styles.activityTitle}>{note.clientId?.name || 'Client'}<span style={{ color: '#6B6B6B', fontWeight: 400, marginLeft: 8 }}>{note.category ? `${note.category} note` : 'Note'} recorded</span></div>
									<div style={styles.activityMeta}>
										<span style={{ color: '#6B6B6B' }}>{note.staffId?.name || 'Staff'}</span>
										<span style={{ color: '#B8A6D9', marginLeft: 12 }}>{timeAgo(note.createdAt)}</span>
									</div>
								</div>
								<div style={note.status === 'Pending' ? styles.statusPending : styles.statusVerified}>{note.status === 'Pending' ? 'Pending' : 'Verified'}</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

function timeAgo(date) {
	if (!date) return '';
	const now = new Date();
	const d = new Date(date);
	const diff = Math.floor((now - d) / 1000);
	if (diff < 60) return `${diff} seconds ago`;
	if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
	if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
	return d.toLocaleDateString();
}

// alerts removed from UI

const styles = {
	page: { background: '#F8F9ED', minHeight: '100vh', fontFamily: 'Inter, Poppins, Roboto, Arial, sans-serif', padding: 0 },
	summaryRow: { display: 'flex', gap: 24, margin: '32px 0 18px 32px' },
	summaryCard: { background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px #E0E7EF', padding: 24, minWidth: 180, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
	summaryLabel: { color: '#6B6B6B', fontSize: 15, marginBottom: 8 },
	summaryValue: { fontWeight: 700, fontSize: 24, color: '#2E2E2E' },
	summarySub: { color: '#B8A6D9', fontSize: 13, marginTop: 2 },
	cardsRow: { display: 'flex', gap: 24, margin: '0 0 32px 32px' },
	bigCard: { background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px #E0E7EF', padding: 28, minWidth: 260, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
	bigCardTitle: { fontWeight: 700, fontSize: 18, color: '#2E2E2E', marginBottom: 6 },
	bigCardDesc: { color: '#6B6B6B', fontSize: 15, marginBottom: 18 },
	actionBtn: { background: '#5cb85c', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' },
	actionBtnBlue: { background: '#2563EB', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' },
	actionBtnDisabled: { background: '#E0E7EF', color: '#6B6B6B', padding: '8px 16px', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'not-allowed' },
	bottomRow: { display: 'flex', gap: 24, margin: '0 0 0 32px' },
	activityBox: { background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px #E0E7EF', padding: 24, flex: 2, minWidth: 340 },
	sectionTitle: { fontWeight: 700, fontSize: 17, color: '#2E2E2E', marginBottom: 12 },
	activityList: {},
	activityItem: { display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: '1px solid #F1F1F1' },
	activityIcon: { background: '#F1F8FF', borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
	activityTitle: { fontWeight: 600, color: '#2E2E2E', fontSize: 15 },
	activityMeta: { fontSize: 13, color: '#6B6B6B', marginTop: 2 },
	statusPending: { background: '#E0E7EF', color: '#6B6B6B', borderRadius: 8, padding: '2px 10px', fontWeight: 500, fontSize: 13, marginLeft: 8 },
	statusVerified: { background: '#E6F4EA', color: '#2F7A4E', borderRadius: 8, padding: '2px 10px', fontWeight: 500, fontSize: 13, marginLeft: 8 },
	alertsBox: { background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px #E0E7EF', padding: 24, flex: 1, minWidth: 260 },
	alertsList: {},
	alertItem: { borderRadius: 10, padding: 16, marginBottom: 16 },
	alertTitle: { fontWeight: 600, fontSize: 15, marginBottom: 4 },
	alertMsg: { color: '#2E2E2E', fontSize: 14, marginBottom: 6 },
	alertTime: { color: '#6B6B6B', fontSize: 12 },
	urgentBadge: { background: '#F56565', color: '#fff', borderRadius: 6, padding: '2px 8px', fontWeight: 600, fontSize: 12, marginLeft: 8 },
	warningBadge: { background: '#F6E05E', color: '#2E2E2E', borderRadius: 6, padding: '2px 8px', fontWeight: 600, fontSize: 12, marginLeft: 8 },
	infoBadge: { background: '#63B3ED', color: '#fff', borderRadius: 6, padding: '2px 8px', fontWeight: 600, fontSize: 12, marginLeft: 8 }
};

export default Supervisordashboard;
