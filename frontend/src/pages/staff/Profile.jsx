import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";

// --- Styles ---
const styles = {
	page: {
		background: "#F8F9ED",
		minHeight: "100vh",
		fontFamily: "Inter, Poppins, Roboto, Arial, sans-serif"
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
		borderRadius: 16,
		boxShadow: "0 2px 8px #E0E7EF",
		padding: 32,
		maxWidth: 480,
		width: "100%",
		margin: "32px auto"
	},
	headerRow: {
		display: "flex",
		alignItems: "center",
		gap: 10,
		marginBottom: 18
	},
	pageTitle: {
		fontWeight: 700,
		fontSize: 22,
		color: "#805AD5",
		margin: 0
	},
	form: {
		display: "flex",
		flexDirection: "column",
		gap: 14,
		marginTop: 10
	},
	label: {
		color: "#805AD5",
		fontWeight: 500,
		fontSize: 15
	},
	input: {
		borderRadius: 8,
		border: "1.5px solid #B8A6D9",
		padding: 12,
		fontSize: 16,
		background: "#F8F9ED",
		color: "#2E2E2E"
	},
	saveBtn: {
		background: "#805AD5",
		color: "#fff",
		border: "none",
		borderRadius: 8,
		padding: "10px 24px",
		fontWeight: 700,
		fontSize: 16,
		cursor: "pointer",
		marginTop: 10
	},
	message: {
		color: "#805AD5",
		marginTop: 12,
		fontWeight: 500
	},
	loading: {
		color: "#805AD5",
		textAlign: "center",
		marginTop: 40,
		fontSize: 18
	}
};

// --- Back Button Icon ---
const BackIcon = () => (
	<svg width="28" height="28" fill="none" stroke="#805AD5" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const Profile = () => {
	const [form, setForm] = useState({ name: "", profilePic: "" });
	const [loading, setLoading] = useState(true);
	const [message, setMessage] = useState("");
	const navigate = useNavigate();

	useEffect(() => {
		const user = JSON.parse(localStorage.getItem("user") || "null");
		if (user) setForm({ name: user.name || "", profilePic: user.profilePic || "" });
		setLoading(false);
	}, []);

	const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	const handleSave = async (e) => {
		e.preventDefault();
		try {
			const user = JSON.parse(localStorage.getItem("user") || "null");
			if (!user) throw new Error("Not authenticated");
			const res = await api.put(`/api/staff/${user.id}/profile`, { name: form.name, profilePic: form.profilePic });
			const updated = { ...user, name: res.data.name, profilePic: res.data.profilePic };
			localStorage.setItem("user", JSON.stringify(updated));
			setMessage("Profile updated");
		} catch (err) {
			setMessage(err.response?.data?.message || err.message || "Error updating profile");
		}
	};

	if (loading) return <div style={styles.loading}>Loading profile...</div>;

	return (
		<div style={styles.page}>
			<div style={styles.backRow} onClick={() => navigate(-1)}>
				<BackIcon />
				<span style={{ color: "#805AD5", fontWeight: 500, fontSize: 16 }}>Back</span>
			</div>
			<div style={styles.card}>
				<div style={styles.headerRow}>
					<svg width="28" height="28" fill="none" stroke="#B8A6D9" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-2.5 3.5-4.5 8-4.5s8 2 8 4.5"/></svg>
					<h2 style={styles.pageTitle}>Edit Profile</h2>
				</div>
				<form onSubmit={handleSave} style={styles.form}>
					<label style={styles.label}>Name</label>
					<input name="name" value={form.name} onChange={handleChange} style={styles.input} />
					<label style={styles.label}>Profile picture URL</label>
					<input name="profilePic" value={form.profilePic} onChange={handleChange} style={styles.input} />
					<button type="submit" style={styles.saveBtn}>
						<svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg> Save
					</button>
				</form>
				{message && <div style={styles.message}>{message}</div>}
			</div>
		</div>
	);
};

export default Profile;
