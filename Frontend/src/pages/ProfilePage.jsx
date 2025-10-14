"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import apiClient from "../api/axiosConfig"
import Spinner from "../components/Spinner"
import { User, Mail, ShieldCheck, KeySquare, Calendar, Phone, Edit, Save, X, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"

const ProfilePage = () => {
  const { user, setUser } = useAuth() // Assuming setUser is exposed from context to update globally
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // State for password change
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "" })
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)

  useEffect(() => {
    setProfile(user) // Use user from context
    setLoading(false)
  }, [user])

  const handleInputChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value })
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    const toastId = toast.loading("Saving profile...")
    try {
      const response = await apiClient.put("/users/update-profile", {
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
      })
      if (response.data.success) {
        toast.success("Profile updated!", { id: toastId })
        setUser(response.data.data) // Update context
        setIsEditing(false)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.", { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 6) {
        return toast.error("New password must be at least 6 characters.");
    }
    setIsPasswordSaving(true);
    const toastId = toast.loading("Changing password...");
    try {
        await apiClient.post("/users/change-password", passwords);
        toast.success("Password changed successfully!", { id: toastId });
        setPasswords({ oldPassword: "", newPassword: "" });
    } catch (err) {
        toast.error(err.response?.data?.message || "Failed to change password.", { id: toastId });
    } finally {
        setIsPasswordSaving(false);
    }
  }

  if (loading) return <Spinner />
  if (!profile) return <div>Profile data not found.</div>

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl space-y-8">
      {/* Profile Details Card */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center">
              <User size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{profile.fullName}</h1>
              <p className="text-slate-600 capitalize">{profile.role} Account</p>
            </div>
          </div>
          <button onClick={() => setIsEditing(!isEditing)} className={isEditing ? 'btn-secondary' : 'btn-primary'}>
            {isEditing ? <X size={16} /> : <Edit size={16} />}
            <span>{isEditing ? "Cancel" : "Edit Profile"}</span>
          </button>
        </div>
        
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <ProfileField label="Full Name" icon={<User />} name="fullName" value={profile.fullName} onChange={handleInputChange} isEditing={isEditing} />
          <ProfileField label="Email Address" icon={<Mail />} value={profile.email} isEditing={false} />
          <ProfileField label="Phone Number" icon={<Phone />} name="phoneNumber" value={profile.phoneNumber} onChange={handleInputChange} isEditing={isEditing} placeholder="Add your phone number" />
          <ProfileField label="Aadhaar Number" icon={<ShieldCheck />} value={profile.aadhaarNumber} isEditing={false} note="Aadhaar number cannot be changed." />
          
          {isEditing && (
            <div className="flex justify-end pt-4">
              <button type="submit" className="btn-primary" disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <PasswordField label="Old Password" name="oldPassword" value={passwords.oldPassword} onChange={handlePasswordChange} />
            <PasswordField label="New Password" name="newPassword" value={passwords.newPassword} onChange={handlePasswordChange} />
            <div className="flex justify-end pt-2">
                <button type="submit" className="btn-secondary" disabled={isPasswordSaving}>
                    {isPasswordSaving ? <Loader2 className="animate-spin" /> : null}
                    <span>{isPasswordSaving ? "Saving..." : "Update Password"}</span>
                </button>
            </div>
        </form>
      </div>
    </motion.div>
  )
}

const ProfileField = ({ icon, label, note, isEditing, ...props }) => (
    <div className="flex items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-4 w-1/3 text-slate-600">
            <div className="text-cyan-600">{icon}</div>
            <span className="font-semibold">{label}</span>
        </div>
        {isEditing ? (
            <input {...props} className="input-style flex-1 bg-white" />
        ) : (
            <span className="text-slate-900 font-medium">{props.value || "Not set"}</span>
        )}
        {note && !isEditing && <p className="text-xs text-slate-500 ml-auto">{note}</p>}
    </div>
);

const PasswordField = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
        <input type="password" {...props} className="input-style" required />
    </div>
);

export default ProfilePage