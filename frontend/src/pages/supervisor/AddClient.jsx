import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

export default function AddClient() {
  const [form, setForm] = useState({
    name: "",
    dob: "",
    gender: "",
    address: "",
    phone: "",
    carePlan: "",
    careLevel: "",
    medicalNotes: "",
    status: "Active",
    assignedStaff: "",
    startTime: "",
    endTime: "",
    assignmentStart: "",
    daysPerWeek: ""
  });

  const [staffList, setStaffList] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/api/supervisor/staff")
      .then(res => setStaffList(res.data))
      .catch(() => setStaffList([]));
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
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

      const res = await api.post("/api/supervisor/clients", payload);

      // If staff assigned, set shift info
      if (form.assignedStaff) {
        try {
          await api.put(
            `/api/supervisor/clients/${res.data._id}/assigned-staff/${form.assignedStaff}`,
            {
              startTime: form.startTime,
              endTime: form.endTime,
              assignmentStart: form.assignmentStart,
              daysPerWeek: form.daysPerWeek ? Number(form.daysPerWeek) : undefined
            }
          );
        } catch (err) {
          console.warn(
            "Failed to set staff shift on create",
            err?.response?.data || err.message
          );
        }
      }

      setSuccess(true);
      setTimeout(
        () => navigate(`/supervisor/clients/${res.data._id}`),
        1200
      );
    } catch (err) {
      setError(err.response?.data?.message || "Error creating client");
    }
  };

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "2rem auto",
        background: "#fff",
        padding: 32,
        borderRadius: 16
      }}
    >
      <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 8 }}>
        Add New Client
      </h1>

      <div style={{ color: "#6B6B6B", marginBottom: 24 }}>
        Create a new client record in the system. Fill in all required
        information to get started.
      </div>

      {success && (
        <div
          style={{
            background: "#e6f9e6",
            color: "#228B22",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16
          }}
        >
          Client created successfully.
        </div>
      )}

      {error && (
        <div style={{ color: "#d9534f", marginBottom: 12 }}>{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <Section title="Personal Information" desc="Enter the client's basic personal details">
          <Input label="Name *" name="name" value={form.name} onChange={handleChange} required />
          <div style={{ display: "flex", gap: 16 }}>
            <Input label="Date of Birth *" name="dob" value={form.dob} onChange={handleChange} type="date" required />
            <Select label="Gender" name="gender" value={form.gender} onChange={handleChange}
              options={["Male", "Female", "Other", "Prefer not to say"]} />
          </div>
          <Input label="Contact Number *" name="phone" value={form.phone} onChange={handleChange} required />
          <Input label="Address" name="address" value={form.address} onChange={handleChange} />
        </Section>

        <Section title="Care Plan & Medical Notes" desc="Document care plan and medical notes">
          <Select
            label="Care Level *"
            name="careLevel"
            value={form.careLevel}
            onChange={handleChange}
            options={["Low", "Medium", "High"]}
            required
          />
          <Input label="Care Plan" name="carePlan" value={form.carePlan} onChange={handleChange} required />
          <Input label="Medical Notes" name="medicalNotes" value={form.medicalNotes} onChange={handleChange} multiline />
        </Section>

        <Section title="Staff Assignment" desc="Assign a primary staff member to this client">
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
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <Input label="Start Time" name="startTime" value={form.startTime} onChange={handleChange} type="time" />
            <Input label="End Time" name="endTime" value={form.endTime} onChange={handleChange} type="time" />
            <Input label="Assignment Start" name="assignmentStart" value={form.assignmentStart} onChange={handleChange} type="date" />
            <Input label="Days/Week" name="daysPerWeek" value={form.daysPerWeek} onChange={handleChange} type="number" />
          </div>
        </Section>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 16 }}>
          <button type="button" onClick={() => navigate("/supervisor/clients")} style={cancelBtnStyle}>
            Cancel
          </button>
          <button type="submit" style={submitBtnStyle}>
            + Create Client
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Reusable Components ---------- */

function Section({ title, desc, children }) {
  return (
    <div style={{ background: "#F8F9FD", borderRadius: 12, padding: 24, marginBottom: 24, border: "1px solid #E6E6FA" }}>
      <div style={{ fontWeight: 600, fontSize: 18 }}>{title}</div>
      <div style={{ color: "#6B6B6B", marginBottom: 16 }}>{desc}</div>
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
        <input name={name} value={value} onChange={onChange} type={type} required={required} style={inputStyle} />
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
          typeof opt === "string" ? (
            <option key={opt} value={opt}>{opt}</option>
          ) : (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          )
        )}
      </select>
    </div>
  );
}

/* ---------- Styles ---------- */

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
  borderRadius: 8
};

const cancelBtnStyle = {
  background: "#f0f0f0",
  padding: "10px 24px",
  border: "none",
  borderRadius: 8
};
