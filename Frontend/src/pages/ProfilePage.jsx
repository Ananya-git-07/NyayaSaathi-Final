// PASTE THIS ENTIRE FILE INTO src/pages/ProfilePage.jsx

"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import apiClient from "../api/axiosConfig"
import Spinner from "../components/Spinner"
import { User, Mail, ShieldCheck, Phone, Edit, Save, X, Loader2, Upload, Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"
import { useTranslation } from "react-i18next"

const ProfilePage = () => {
  const { user, setUser, updateAvatar, deleteAvatar } = useAuth()
  const { t } = useTranslation()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "" })
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)

  useEffect(() => {
    setProfile(user)
    setLoading(false)
  }, [user])

  const handleInputChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        return toast.error("File size must be under 5MB.");
      }
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        return toast.error("Only JPG, JPEG, & PNG are allowed.");
      }
      updateAvatar(file);
    }
  };

  const handleAvatarDelete = () => {
    if (window.confirm("Are you sure you want to remove your profile picture?")) {
        deleteAvatar();
    }
  };

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
        setUser(response.data.data)
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="relative group">
                <img
                    src={profile.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=0D8ABC&color=fff&bold=true`}
                    alt="Profile Avatar"
                    className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-md"
                />
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-4">
                        <label htmlFor="avatar-upload" className="cursor-pointer p-2 rounded-full hover:bg-white/20 transition-colors" title="Upload new picture">
                            <Upload size={24} />
                        </label>
                        {profile.profilePictureUrl && (
                            <button onClick={handleAvatarDelete} className="p-2 rounded-full hover:bg-white/20 transition-colors" title="Remove picture">
                                <Trash2 size={24} />
                            </button>
                        )}
                    </div>
                </div>
                <input
                    id="avatar-upload"
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    className="hidden"
                    onChange={handleAvatarChange}
                />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{profile.fullName}</h1>
              <p className="text-slate-600 dark:text-slate-400 capitalize">{t('profile.accountType', { role: t(`roles.${profile.role}`) })}</p>
            </div>
          </div>
          <button onClick={() => setIsEditing(!isEditing)} className={isEditing ? 'btn-secondary' : 'btn-primary'}>
            {isEditing ? <X size={16} /> : <Edit size={16} />}
            <span>{isEditing ? t('profile.cancel') : t('profile.edit')}</span>
          </button>
        </div>
        
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <ProfileField label={t('profile.fullName')} icon={<User />} name="fullName" value={profile.fullName} onChange={handleInputChange} isEditing={isEditing} />
          <ProfileField label={t('profile.email')} icon={<Mail />} value={profile.email} isEditing={false} />
          <ProfileField label={t('profile.phone')} icon={<Phone />} name="phoneNumber" value={profile.phoneNumber} onChange={handleInputChange} isEditing={isEditing} placeholder={t('profile.phonePlaceholder')} />
          <ProfileField label={t('profile.aadhaar')} icon={<ShieldCheck />} value={profile.aadhaarNumber} isEditing={false} note={t('profile.aadhaarNote')} />
          
          {isEditing && (
            <div className="flex justify-end pt-4">
              <button type="submit" className="btn-primary" disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                <span>{isSaving ? t('profile.saving') : t('profile.save')}</span>
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('profile.changePasswordTitle')}</h2>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <PasswordField label={t('profile.oldPassword')} name="oldPassword" value={passwords.oldPassword} onChange={handlePasswordChange} />
            <PasswordField label={t('profile.newPassword')} name="newPassword" value={passwords.newPassword} onChange={handlePasswordChange} />
            <div className="flex justify-end pt-2">
                <button type="submit" className="btn-secondary" disabled={isPasswordSaving}>
                    {isPasswordSaving ? <Loader2 className="animate-spin" /> : null}
                    <span>{isPasswordSaving ? t('profile.updatingPassword') : t('profile.updatePassword')}</span>
                </button>
            </div>
        </form>
      </div>
    </motion.div>
  )
}

const ProfileField = ({ icon, label, note, isEditing, ...props }) => (
    <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4 w-1/3 text-slate-600 dark:text-slate-400">
            <div className="text-cyan-600 dark:text-cyan-400">{icon}</div>
            <span className="font-semibold">{label}</span>
        </div>
        {isEditing ? (
            <input {...props} className="input-style flex-1 bg-white dark:bg-slate-700" />
        ) : (
            <span className="text-slate-900 dark:text-slate-200 font-medium">{props.value || "Not set"}</span>
        )}
        {note && !isEditing && <p className="text-xs text-slate-500 dark:text-slate-400 ml-auto">{note}</p>}
    </div>
);

const PasswordField = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
        <input type="password" {...props} className="input-style" required />
    </div>
);

export default ProfilePage