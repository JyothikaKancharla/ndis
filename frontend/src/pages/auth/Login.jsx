import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "", role: "" });
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Send login data to backend
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          role: form.role,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        // Save token + user
        const token = data.token;
        const user = data.user;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        if (setUser) setUser(user);
        // Redirect based on role
        if (user.role === "staff") {
          navigate("/staff/dashboard");
        } else if (user.role === "supervisor") {
          navigate("/supervisor");
        } else if (user.role === "government") {
          navigate("/government");
        } else {
          navigate("/");
        }
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      alert("Error connecting to server");
    }
  };

  return (
    <div style={styles.bg}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <div style={styles.iconBox}>
          <span role="img" aria-label="clipboard" style={styles.icon}>📝</span>
        </div>
        <h2 style={styles.title}>CareNote</h2>
        <p style={styles.subtitle}>Care Management System for Disability Centers</p>
        <input
          style={styles.input}
          type="email"
          name="email"
          placeholder="your.email@care.com"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          style={styles.input}
          type="password"
          name="password"
          placeholder="Enter your password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <select
          style={styles.input}
          name="role"
          value={form.role}
          onChange={handleChange}
          required
        >
          <option value="">Login As</option>
          <option value="staff">Staff</option>
          <option value="supervisor">Supervisor</option>
          <option value="government">Government</option>
        </select>
        <button style={styles.button} type="submit">Login</button>
        <div style={styles.switchText}>
          Don&apos;t have an account? <a href="/signup" style={styles.link}>Sign up</a>
        </div>
      </form>
    </div>
  );
};

const styles = {
  bg: {
    minHeight: "100vh",
    background: "#FAF0E6", // linen
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2vw",
  },
  card: {
    background: "#F8F9ED", // cloud
    borderRadius: 16,
    boxShadow: "0 4px 24px rgba(128, 90, 213, 0.10)", // light purple shadow
    padding: "2.5rem 2rem",
    width: "100%",
    maxWidth: 370,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxSizing: "border-box",
  },
  iconBox: {
    background: "#E6E6FA", // light purple
    borderRadius: "50%",
    width: 56,
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    fontSize: 32,
  },
  icon: {
    fontSize: 32,
    color: "#805AD5", // purple accent
  },
  title: {
    margin: "0 0 4px 0",
    fontWeight: 700,
    color: "#3a3a3a",
    fontSize: 28,
    textAlign: "center",
  },
  subtitle: {
    margin: "0 0 18px 0",
    color: "#805AD5",
    fontSize: 14,
    textAlign: "center",
    fontWeight: 500,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    margin: "8px 0",
    border: "1px solid #E6E6FA",
    borderRadius: 8,
    background: "#fff",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "10px 0",
    margin: "16px 0 8px 0",
    background: "#805AD5", // purple
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 16,
    cursor: "pointer",
    transition: "background 0.2s",
    boxShadow: "0 2px 8px #E6E6FA",
  },
  switchText: {
    fontSize: 13,
    color: "#888",
    marginTop: 8,
    textAlign: "center",
  },
  link: {
    color: "#805AD5",
    textDecoration: "none",
    fontWeight: 500,
  },
};

export default Login;