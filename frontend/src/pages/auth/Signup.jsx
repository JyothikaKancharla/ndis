import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Lock, UserPlus, Heart } from "lucide-react";
import api from "../../api/api";
import styles from "./Signup.module.css";

const Signup = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    rePassword: "",
    role: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.rePassword) {
      setError("Passwords do not match!");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/api/auth/signup", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });

      if (response.status === 201 || response.status === 200) {
        navigate("/login");
      } else {
        setError(response.data?.message || "Signup failed. Please try again.");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Unable to connect to server. Please try again.";
      setError(errorMessage);
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Logo Section */}
        <motion.div
          className={styles.logoSection}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className={styles.logoIcon}>
            <Heart />
          </div>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join NexCare to manage care services</p>
        </motion.div>

        {/* Form */}
        <motion.form
          className={styles.form}
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {error && (
            <motion.div
              className={styles.error}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              {error}
            </motion.div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="name">Full Name</label>
            <div className={styles.inputWrapper}>
              <input
                id="name"
                className={styles.input}
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
              <User className={styles.inputIcon} size={20} />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">Email Address</label>
            <div className={styles.inputWrapper}>
              <input
                id="email"
                className={styles.input}
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
              <Mail className={styles.inputIcon} size={20} />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="password">Password</label>
            <div className={styles.inputWrapper}>
              <input
                id="password"
                className={styles.input}
                type="password"
                name="password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
              <Lock className={styles.inputIcon} size={20} />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="rePassword">Confirm Password</label>
            <div className={styles.inputWrapper}>
              <input
                id="rePassword"
                className={styles.input}
                type="password"
                name="rePassword"
                placeholder="Confirm your password"
                value={form.rePassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
              <Lock className={styles.inputIcon} size={20} />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="role">Role</label>
            <div className={styles.inputWrapper}>
              <select
                id="role"
                className={styles.select}
                name="role"
                value={form.role}
                onChange={handleChange}
                required
              >
                <option value="">Select your role</option>
                <option value="staff">Staff</option>
                <option value="supervisor">Supervisor</option>
              </select>
              <UserPlus className={styles.inputIcon} size={20} />
            </div>
          </div>

          <motion.button
            className={styles.submitBtn}
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </motion.button>
        </motion.form>

        {/* Footer */}
        <motion.div
          className={styles.footer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <p className={styles.footerText}>
            Already have an account?{" "}
            <Link to="/login" className={styles.link}>
              Sign in
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Signup;
