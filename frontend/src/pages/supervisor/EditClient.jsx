import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";

export default function EditClient() {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    dob: "",
    gender: "",
    address: "",
    phone: "",
    carePlan: "",
    careLevel: "",            // ✅ ADDED
    medicalNotes: "",
    status: "Active",
    assignedStaff: ""
  });

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchClient();
    api.get("/api/supervisor/staff")
      .then(res => setStaffList(res.data))
      .catch(() => setStaffList([]));
    // eslint-disable-next-line
  }, [clientId]);

  const fetchClient = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/supervisor/clients/${clientId}`);
      const c = res.data;

      setForm({
        name: c.name || "",
        dob: c.dob ? c.dob.substring(0, 10) : "",
        gender: c.gender || "",
        address: c.address || "",
        phone: c.phone || "",
        carePlan: c.carePlan || "",
        careLevel: c.careLevel || "",     // ✅ ADDED
        medicalNotes: c.medicalNotes || "",
        status: c.status || "Active",
        assignedStaff:
          (c.assignedStaff && c.assignedStaff[0]?._id) ||
          c.assignedStaff?.[0] ||
          ""
      });
    } catch {
      setError("Failed to load client details");
    }
    setLoading(false);
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess(false);

  try {
    const payload = {
      ...form,
      assignedStaff: form.assignedStaff ? [form.assignedStaff] : []
    };

    // Make sure careLevel is always included
    if (!payload.careLevel) payload.careLevel = "Low";

    await api.put(`/api/supervisor/clients/${clientId}`, payload);
    setSuccess(true);

    setTimeout(
      () => navigate(`/supervisor/clients/${clientId}/profile`),
      1200
    );
  } catch (err) {
    setError(err.response?.data?.message || "Error updating client");
  }
};


  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", background: "#fff", padding: 32, borderRadius: 16 }}>
      <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 8 }}>
        Edit Client Details
      </h1>

      <div style={{ color: "#6B6B6B", marginBottom: 24 }}>
        Update client information and care plan.
      </div>

      {success && (
        <div style={{ background: "#e6f9e6", color: "#228B22", padding: 12, borderRadius: 8, marginBottom: 16 }}>
          Client updated successfully!
        </div>
      )}

      {error && <div style={{ color: "#d9534f", marginBottom: 12 }}>{error}</div>}

      <form onSubmit={handleSubmit}>

        <Section title="Personal Information" desc="Edit the client's basic personal details">
          <Input label="Name *" name="name" value={form.name} onChange={handleChange} required />

          <div style={{ display: "flex", gap: 16 }}>
            <Input label="Date of Birth *" name="dob" type="date" value={form.dob} onChange={handleChange} required />
            <Select label="Gender" name="gender" value={form.gender} onChange={handleChange}
              options={["Male", "Female", "Other", "Prefer not to say"]}
            />
          </div>

          <Input label="Contact Number *" name="phone" value={form.phone} onChange={handleChange} required />
          <Input label="Address" name="address" value={form.address} onChange={handleChange} />
        </Section>

        <Section title="Care Plan & Medical Notes" desc="Edit care plan and medical notes">
          {/* ✅ CARE LEVEL ADDED */}
          <Select
            label="Care Level"
            name="careLevel"
            value={form.careLevel}
            onChange={handleChange}
            required
            options={["Low", "Medium", "High"]}
          />

          <Input label="Care Plan" name="carePlan" value={form.carePlan} onChange={handleChange} required />
          <Input label="Medical Notes" name="medicalNotes" value={form.medicalNotes} onChange={handleChange} multiline />
        </Section>

        <Section title="Staff Assignment" desc="Assign staff to this client">
          <Select
            label="Assign Staff Member"
            name="assignedStaff"
            value={form.assignedStaff}
            onChange={handleChange}
            options={[
              "",
              ...staffList.map(s => ({ label: s.name, value: s._id }))
            ]}
          />
        </Section>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 24 }}>
          <button
            type="button"
            onClick={() => navigate(`/supervisor/clients/${clientId}/profile`)}
            style={cancelBtnStyle}
          >
            Cancel
          </button>

          <button type="submit" style={submitBtnStyle}>
            Save Changes
          </button>
        </div>

      </form>
    </div>
  );
}

/* ----------------------- Reusable Components ----------------------- */

function Section({ title, desc, children }) {
  return (
    <div style={{ background: "#F8F9FD", borderRadius: 12, padding: 24, marginBottom: 24, border: "1px solid #E6E6FA" }}>
      <div style={{ fontWeight: 600, fontSize: 18 }}>{title}</div>
      <div style={{ color: "#6B6B6B", fontSize: 14, marginBottom: 16 }}>{desc}</div>
      {children}
    </div>
  );
}

function Input({ label, name, value, onChange, type = "text", required, multiline }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", marginBottom: 12 }}>
      <label>{label}{required && <span style={{ color: "#C53030" }}> *</span>}</label>
      {multiline ? (
        <textarea name={name} value={value} onChange={onChange} required={required} style={inputStyle} />
      ) : (
        <input name={name} type={type} value={value} onChange={onChange} required={required} style={inputStyle} />
      )}
    </div>
  );
}

function Select({ label, name, value, onChange, options, required }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", marginBottom: 12 }}>
      <label>{label}{required && <span style={{ color: "#C53030" }}> *</span>}</label>
      <select name={name} value={value} onChange={onChange} required={required} style={inputStyle}>
        {options.map(opt =>
          typeof opt === "string"
            ? <option key={opt} value={opt}>{opt}</option>
            : <option key={opt.value} value={opt.value}>{opt.label}</option>
        )}
      </select>
    </div>
  );
}

/* ----------------------- Styles ----------------------- */

const inputStyle = {
  padding: "10px 12px",
  border: "1px solid #E6E6FA",
  borderRadius: 8,
  fontSize: 15
};

const submitBtnStyle = {
  background: "#2563eb",
  color: "#fff",
  fontWeight: 600,
  padding: "10px 28px",
  border: "none",
  borderRadius: 8,
  fontSize: 16
};

const cancelBtnStyle = {
  background: "#f0f0f0",
  color: "#333",
  fontWeight: 500,
  padding: "10px 24px",
  border: "none",
  borderRadius: 8,
  fontSize: 15
};
