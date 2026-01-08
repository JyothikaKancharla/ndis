import ClientNotesHistory from "./pages/supervisor/ClientNotesHistory";
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import StaffHome from "./pages/staff/Staffdashboard";
import SupervisorHome from "./pages/supervisor/Supervisordashboard";
import SupervisorNotesVerification from "./pages/supervisor/NotesVerification";
import GovernmentHome from "./pages/government/Governmentdashboard";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Clients from "./pages/staff/Clients";
import ClientNotes from "./pages/staff/ClientNotes";
import WriteNote from "./pages/staff/WriteNote";
import VoiceNote from "./pages/staff/VoiceNote";
import Shifts from "./pages/staff/Shifts";
import Profile from "./pages/staff/Profile";
import ReviewNote from "./pages/staff/ReviewNote";
// import NoteReview from "./pages/staff/NoteReview";
import SupervisorClientDashboard from "./pages/supervisor/SupervisorClientDashboard";
import SupervisorClientProfile from "./pages/supervisor/SupervisorClientProfile";
import SupervisorNoteReview from "./pages/supervisor/SupervisorNoteReview";
import StaffClientAssignments from "./pages/supervisor/StaffClientAssignments";
import AssignedStaff from "./pages/supervisor/AssignedStaff";
import AddClient from "./pages/supervisor/AddClient";
import EditClient from "./pages/supervisor/EditClient";
import ClientRecords from "./pages/supervisor/ClientRecords";
import ClientProfileView from "./pages/supervisor/ClientProfileView";
import ClientDetail from "./pages/staff/ClientDetail";

function App() {
  return (
    <AuthProvider>
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
            path="/staff/clients/:id/notes"
            element={
              <ProtectedRoute>
                <ClientNotes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/clients/:id/write-note"
            element={
              <ProtectedRoute>
                <WriteNote />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/clients/:id/voice-note"
            element={
              <ProtectedRoute>
                <VoiceNote />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/clients/:id/review-note"
            element={
              <ProtectedRoute>
                <ReviewNote />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/clients/:clientId/review-note/:noteId"
            element={
              <ProtectedRoute>
                <ReviewNote />
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
            path="/staff/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/supervisor/notes-verification" element={<ProtectedRoute><SupervisorNotesVerification /></ProtectedRoute>} />
          <Route path="/supervisor/clients/:clientId" element={<ProtectedRoute><SupervisorClientProfile /></ProtectedRoute>} />
          <Route path="/supervisor/note-review" element={<ProtectedRoute><SupervisorNoteReview /></ProtectedRoute>} />
          <Route path="/supervisor/assignments" element={<ProtectedRoute><StaffClientAssignments /></ProtectedRoute>} />
          <Route path="/supervisor/clients" element={<ProtectedRoute><SupervisorClientDashboard /></ProtectedRoute>} />
          <Route path="/supervisor/clients/add" element={<ProtectedRoute><AddClient /></ProtectedRoute>} />
          <Route path="/supervisor/clients/records" element={<ClientRecords />} />
          <Route path="/supervisor/clients/:clientId/profile" element={<ClientProfileView />} />
          <Route path="/supervisor/clients/:clientId/edit" element={<ProtectedRoute><EditClient /></ProtectedRoute>} />
          <Route path="/supervisor/clients/:clientId/notes" element={<ProtectedRoute><ClientNotesHistory /></ProtectedRoute>} />
          <Route path="/supervisor/clients/:clientId/staff" element={<ProtectedRoute><AssignedStaff /></ProtectedRoute>} />
          <Route
            path="/staff/clients/:id"
            element={
              <ProtectedRoute>
                <ClientDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/supervisor/*" element={<SupervisorHome />} />
          <Route path="/government/*" element={<GovernmentHome />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;