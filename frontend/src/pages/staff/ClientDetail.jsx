import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";

// Back button icon (chevron)
const BackIcon = () => (
	<svg width="28" height="28" fill="none" stroke="#805AD5" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const ClientDetail = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [client, setClient] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchClient = async () => {
			setLoading(true);
			try {
				const res = await api.get(`/api/staff/${id}/clients`);
				const found = res.data.find((c) => c._id === id) || res.data[0];
				setClient(found || null);
			} catch (err) {
				setError(err.response?.data?.message || err.message || "Error fetching client");
			}
			setLoading(false);
		};
		fetchClient();
	}, [id]);

	if (loading) return <div style={styles.loading}>Loading client...</div>;
	if (error) return <div style={styles.error}>{error}</div>;
	if (!client) return <div style={styles.error}>No client found.</div>;

	return (
		<div style={styles.page}>
			<div style={styles.container}>
				<div style={styles.backRow} onClick={() => navigate(-1)}>
					<BackIcon />
					<span style={{ color: "#805AD5", fontWeight: 500, fontSize: 16 }}>Back</span>
				</div>
				<div style={styles.card}>
					<div style={styles.headerRow}>
						<div style={styles.avatarBox}>
							<svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="24" fill="#E9E4DF"/><path d="M24 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm0 3c-4.418 0-13 2.239-13 6.667V39h26v-4.333C37 30.239 28.418 28 24 28z" fill="#805AD5"/></svg>
						</div>
						<div style={{ flex: 1 }}>
							<div style={styles.clientName}>{client.name}</div>
							<div style={styles.clientId}>ID: {client.code || client._id}</div>
						</div>
					</div>
					<div style={styles.section}>
						<div style={styles.sectionTitle}>Client Details</div>
						<div style={styles.sectionContent}>{client.details || <span style={{ color: '#B0B0B0' }}>No details available.</span>}</div>
					</div>
					<div style={styles.section}>
						<div style={styles.sectionTitle}>Care Plan</div>
						<div style={styles.sectionContent}>{client.carePlan || <span style={{ color: '#B0B0B0' }}>No care plan info.</span>}</div>
					</div>
					<div style={styles.section}>
						<div style={styles.sectionTitle}>Medical Notes</div>
						<div style={styles.sectionContent}>{client.medicalNotes ? client.medicalNotes : <span style={{ color: '#B0B0B0' }}>No medical notes.</span>}</div>
					</div>
					<div style={styles.section}>
						<div style={styles.sectionTitle}>Priority</div>
						<span style={{ ...styles.priorityPill, background: getPriorityColor(client.priority).bg, color: getPriorityColor(client.priority).color }}>
							{client.priority || "Normal"}
						</span>
					</div>
				</div>
				<div style={styles.voiceCard}>
					<div style={styles.voiceHeader}>
						<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="8" fill="#E9E4DF"/><path d="M14 7a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0v-5a3 3 0 0 1 3-3zm-5 8a1 1 0 1 1 2 0 5 5 0 0 0 10 0 1 1 0 1 1 2 0 7 7 0 0 1-14 0z" fill="#805AD5"/></svg>
						<span style={styles.voiceTitle}>Voice Notepad</span>
					</div>
					<div style={styles.voiceDesc}>Record and review care notes for this client using voice input.</div>
					<button style={styles.voiceBtn} onClick={() => window.location.href = `/staff/clients/${client._id}/notes`}>
						Go to Notes
					</button>
				</div>
			</div>
		</div>
	);
};

// Helper for priority color
function getPriorityColor(priority) {
	if (priority === "High") return { bg: "#F3D6D6", color: "#C53030" };
	if (priority === "Medium") return { bg: "#FDF6D6", color: "#B7791F" };
	return { bg: "#E6F4EA", color: "#2F7A4E" };
}

// Styles
const styles = {
	page: {
		background: "#F8F9ED", // linen
		minHeight: "100vh",
		padding: 0,
		fontFamily: "Inter, system-ui, Arial, sans-serif"
	},
	container: {
		maxWidth: 480,
		margin: "0 auto",
		padding: "18px 8px 32px 8px",
		display: "flex",
		flexDirection: "column",
		gap: 24
	},
	backRow: {
		display: "flex",
		alignItems: "center",
		gap: 8,
		marginBottom: 10,
		cursor: "pointer",
		width: "fit-content"
	},
	card: {
		background: "#fff",
		borderRadius: 18,
		boxShadow: "0 2px 12px #E0E7EF",
		padding: 24,
		marginBottom: 12
	},
	headerRow: {
		display: "flex",
		alignItems: "center",
		gap: 18,
		marginBottom: 12
	},
	avatarBox: {
		width: 56,
		height: 56,
		borderRadius: 16,
		background: "#F3F0FF",
		display: "flex",
		alignItems: "center",
		justifyContent: "center"
	},
	clientName: {
		fontWeight: 700,
		fontSize: 22,
		color: "#805AD5"
	},
	clientId: {
		color: "#B8A6D9",
		fontSize: 14,
		marginTop: 2
	},
	section: {
		marginTop: 14
	},
	sectionTitle: {
		fontWeight: 600,
		color: "#805AD5",
		fontSize: 15,
		marginBottom: 2
	},
	sectionContent: {
		color: "#444",
		fontSize: 15
	},
	priorityPill: {
		display: "inline-block",
		borderRadius: 8,
		padding: "2px 12px",
		fontWeight: 700,
		fontSize: 14,
		marginTop: 4
	},
	voiceCard: {
		background: "#F3F0FF",
		borderRadius: 16,
		padding: 22,
		marginTop: 10,
		boxShadow: "0 2px 8px #E0E7EF"
	},
	voiceHeader: {
		display: "flex",
		alignItems: "center",
		gap: 10,
		marginBottom: 6
	},
	voiceTitle: {
		fontWeight: 700,
		color: "#805AD5",
		fontSize: 18
	},
	voiceDesc: {
		color: "#6B7280",
		fontSize: 15,
		marginBottom: 12
	},
	voiceBtn: {
		background: "#805AD5",
		color: "#fff",
		border: "none",
		borderRadius: 8,
		padding: "10px 24px",
		fontWeight: 700,
		fontSize: 16,
		cursor: "pointer",
		width: "100%"
	},
	loading: {
		color: "#805AD5",
		textAlign: "center",
		marginTop: 40,
		fontSize: 18
	},
	error: {
		color: "#D53F8C",
		textAlign: "center",
		marginTop: 40,
		fontSize: 18
	}
};

export default ClientDetail;
