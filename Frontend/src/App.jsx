"use client"
import { useEffect, useState } from "react"
import { Routes, Route, Navigate, Outlet } from "react-router-dom"
import { useAuth } from "./context/AuthContext"
import { setupInterceptors } from "./api/axiosConfig"

// --- Component imports ---
import AppLayout from "./components/AppLayout"
import Spinner from "./components/Spinner"
import SmartAssistantModal from "./components/SmartAssistantModal"
import SmartAssistantButton from "./components/SmartAssistantButton"

// --- Page imports ---
import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import DashboardPage from "./pages/DashboardPage"
import ProfilePage from "./pages/ProfilePage"
import AdminPanelPage from "./pages/AdminPanelPage"
import IssueDetailPage from "./pages/IssueDetailPage"
import DocumentDetailPage from "./pages/DocumentDetailPage"
import LegalHelpPage from "./pages/legal-help/LegalHelpPage"
import NotFoundPage from "./pages/NotFoundPage"

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading)
    return <div className="h-screen w-full flex items-center justify-center"><Spinner /></div>
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

const AdminRoute = () => {
  const { user } = useAuth()
  return user?.role === "admin" ? <Outlet /> : <Navigate to="/dashboard" replace />
}

function App() {
  const { logout, isAuthenticated } = useAuth()
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [assistantInitialMode, setAssistantInitialMode] = useState("legal-help")

  const openAssistant = (mode = "legal-help") => {
    setAssistantInitialMode(mode)
    setIsAssistantOpen(true)
  }

  useEffect(() => {
    setupInterceptors(logout)
  }, [logout])

  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage openAssistant={openAssistant} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/legal-help" element={<LegalHelpPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage openAssistant={openAssistant} />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/issues/:id" element={<IssueDetailPage />} />
            <Route path="/documents/:id" element={<DocumentDetailPage />} />

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPanelPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>

      {isAuthenticated && (
        <SmartAssistantButton onClick={() => openAssistant("legal-help")} />
      )}
      <SmartAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        initialMode={assistantInitialMode}
      />
    </>
  )
}

export default App
