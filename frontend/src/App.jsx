import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import StaffHome from "./pages/staff/Staffdashboard";
import Clients from "./pages/staff/Clients";
import ClientNotes from "./pages/staff/ClientNotes";

import VoiceNote from "./pages/staff/VoiceNote";
import WriteNote from "./pages/staff/WriteNote";
import EditNote from "./pages/staff/EditNote";
import ViewNote from "./pages/staff/ViewNote";
import DailyConsolidationTimeline from "./pages/staff/DailyConsolidationTimeline";
import Appointment from "./pages/staff/Appointment";
import Incident from "./pages/staff/Incident";
import Shifts from "./pages/staff/Shifts";
import ShiftHistory from "./pages/staff/ShiftHistory";
import StaffAppointments from "./pages/staff/StaffAppointments";
import ClientAppointmentsView from "./pages/staff/ClientAppointmentsView";
import SupervisorHome from "./pages/supervisor/Supervisordashboard";
import { AuthProvider } from "./context/AuthContext";
import { RecordingProvider } from "./context/RecordingContext";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <RecordingProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/staff/dashboard"
              element={
                <ProtectedRoute>
                  <StaffHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/clients"
              element={
                <ProtectedRoute>
                  <Clients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/clients/:clientId/notes"
              element={
                <ProtectedRoute>
                  <ClientNotes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/clients/:clientId/notes/:noteId"
              element={
                <ProtectedRoute>
                  <ViewNote />
                </ProtectedRoute>
              }
            />
            {/* ReviewNote route removed - notes now save directly to API */}
            <Route
              path="/staff/clients/:clientId/edit-note/:noteId"
              element={
                <ProtectedRoute>
                  <EditNote />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/clients/:clientId/voice-note"
              element={
                <ProtectedRoute>
                  <VoiceNote />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/clients/:clientId/write-note"
              element={
                <ProtectedRoute>
                  <WriteNote />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/clients/:clientId/appointment"
              element={
                <ProtectedRoute>
                  <Appointment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/clients/:clientId/incident"
              element={
                <ProtectedRoute>
                  <Incident />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/clients/:clientId/daily-consolidation"
              element={
                <ProtectedRoute>
                  <DailyConsolidationTimeline />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/shifts"
              element={
                <ProtectedRoute>
                  <Shifts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/shift-history"
              element={
                <ProtectedRoute>
                  <ShiftHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/appointments"
              element={
                <ProtectedRoute>
                  <StaffAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/clients/:clientId/view-appointments"
              element={
                <ProtectedRoute>
                  <ClientAppointmentsView />
                </ProtectedRoute>
              }
            />
            <Route path="/supervisor" element={<Navigate to="/supervisor/dashboard" replace />} />
            <Route
              path="/supervisor/view-note/:clientId/:noteId"
              element={<ViewNote />}
            />
            <Route path="/supervisor/*" element={<SupervisorHome />} />
          </Routes>
        </Router>
      </RecordingProvider>
    </AuthProvider>
  );
}

export default App;