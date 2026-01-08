// Placeholder for ProtectedRoute component
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";


import { useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Restrict staff from supervisor routes and vice versa
  if (user.role === "staff" && location.pathname.startsWith("/supervisor")) {
    return <Navigate to="/staff/dashboard" replace />;
  }
  if (user.role === "supervisor" && location.pathname.startsWith("/staff")) {
    return <Navigate to="/supervisor" replace />;
  }

  return children;
};

export default ProtectedRoute;
