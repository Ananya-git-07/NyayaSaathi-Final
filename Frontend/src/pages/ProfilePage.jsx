// PASTE THIS ENTIRE FILE INTO src/pages/ProfilePage.jsx

"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import apiClient from "../api/axiosConfig"
import Spinner from "../components/Spinner"
import { User, Mail, ShieldCheck, Phone, Edit, Save, X, Loader2, Upload, Trash2, Award, Clock, CheckCircle, XCircle } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"
import { useTranslation } from "react-i18next"
import ConfirmDialog from "../components/ConfirmDialog"
import { useConfirm } from "../hooks/useConfirm"

const ProfilePage = () => {
  const { user, setUser, updateAvatar, deleteAvatar } = useAuth()
  const { confirmState, confirm, closeDialog } = useConfirm()
  const { t } = useTranslation()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [paralegalRequest, setParalegalRequest] = useState(null)
  const [isRequestLoading, setIsRequestLoading] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestForm, setRequestForm] = useState({
    phoneNumber: '',
    areasOfExpertise: [],
    requestMessage: ''
  })
  
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "" })
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)

  useEffect(() => {
    setProfile(user)
    setLoading(false)
    if (user?.role === 'citizen') {
      fetchParalegalRequest()
    }
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

  const handleAvatarDelete = async () => {
    const confirmed = await confirm({
      title: "Remove Profile Picture?",
      message: "Are you sure you want to remove your profile picture? You can always upload a new one later.",
      type: "warning"
    });

    if (!confirmed) return;

    const promise = new Promise(async (resolve, reject) => {
      try {
        await deleteAvatar();
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(
      promise,
      {
        loading: 'Removing profile picture...',
        success: 'Profile picture removed successfully',
        error: 'Failed to remove profile picture',
      }
    );
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value })
  }

  const fetchParalegalRequest = async () => {
    try {
      const response = await apiClient.get("/paralegal-requests/my-request")
      if (response.data.success && response.data.data) {
        setParalegalRequest(response.data.data)
      }
    } catch (err) {
      console.error("Error fetching paralegal request:", err)
    }
  }

  const handleRequestFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setRequestForm(prev => {
        const expertise = prev.areasOfExpertise || [];
        if (checked) {
          return { ...prev, areasOfExpertise: [...expertise, value] };
        } else {
          return { ...prev, areasOfExpertise: expertise.filter(area => area !== value) };
        }
      });
    } else {
      setRequestForm(prev => ({ ...prev, [name]: value }));
    }
  }

  const handleSubmitParalegalRequest = async (e) => {
    e.preventDefault()
    if (!requestForm.phoneNumber || requestForm.areasOfExpertise.length === 0) {
      return toast.error("Phone number and at least one area of expertise are required")
    }
    setIsRequestLoading(true)
    const toastId = toast.loading("Submitting request...")
    try {
      const response = await apiClient.post("/paralegal-requests/request", requestForm)
      if (response.data.success) {
        toast.success("Paralegal request submitted successfully!", { id: toastId })
        setParalegalRequest(response.data.data)
        setShowRequestModal(false)
        setRequestForm({ phoneNumber: '', areasOfExpertise: [], requestMessage: '' })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request.", { id: toastId })
    } finally {
      setIsRequestLoading(false)
    }
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
    <>
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

      {/* Paralegal Request Section - Only for Citizens */}
      {profile.role === 'citizen' && (
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-xl shadow-lg border border-cyan-200 dark:border-slate-600 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-cyan-600 rounded-full flex items-center justify-center">
              <Award className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Become a Paralegal</h2>
              <p className="text-slate-600 dark:text-slate-400">Help others by providing legal assistance</p>
            </div>
          </div>

          {!paralegalRequest ? (
            <div className="space-y-4">
              <p className="text-slate-700 dark:text-slate-300">
                Are you knowledgeable in legal matters? Apply to become a registered paralegal and help citizens navigate their legal issues.
              </p>
              <button
                onClick={() => setShowRequestModal(true)}
                className="btn-primary"
              >
                <Award size={16} />
                <span>Apply to Become Paralegal</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`flex items-center gap-3 p-4 rounded-lg ${
                paralegalRequest.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
                paralegalRequest.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
              }`}>
                {paralegalRequest.status === 'pending' && <Clock size={20} />}
                {paralegalRequest.status === 'approved' && <CheckCircle size={20} />}
                {paralegalRequest.status === 'rejected' && <XCircle size={20} />}
                <div className="flex-1">
                  <p className="font-semibold">
                    {paralegalRequest.status === 'pending' && 'Request Pending'}
                    {paralegalRequest.status === 'approved' && 'Request Approved!'}
                    {paralegalRequest.status === 'rejected' && 'Request Rejected'}
                  </p>
                  <p className="text-sm">
                    {paralegalRequest.status === 'pending' && 'Your request is being reviewed by an admin'}
                    {paralegalRequest.status === 'approved' && 'You are now registered as a paralegal! Please log out and log back in.'}
                    {paralegalRequest.status === 'rejected' && paralegalRequest.adminResponse}
                  </p>
                </div>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <p><strong>Phone:</strong> {paralegalRequest.phoneNumber}</p>
                <p><strong>Areas of Expertise:</strong> {paralegalRequest.areasOfExpertise.join(', ')}</p>
                <p><strong>Submitted:</strong> {new Date(paralegalRequest.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>
      )}

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

    {/* Paralegal Request Modal */}
    {showRequestModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Apply to Become Paralegal</h3>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitParalegalRequest} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    name="phoneNumber"
                    placeholder="Enter your 10-digit phone number"
                    value={requestForm.phoneNumber}
                    onChange={handleRequestFormChange}
                    required
                    pattern="\d{10}"
                    className="input-style pl-12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Areas of Expertise * (Select at least one)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Aadhaar', 'Pension', 'Land', 'Certificates', 'Fraud', 'Court', 'Welfare'].map((area) => (
                    <label
                      key={area}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        requestForm.areasOfExpertise.includes(area)
                          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/50'
                          : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="areasOfExpertise"
                        value={area}
                        checked={requestForm.areasOfExpertise.includes(area)}
                        onChange={handleRequestFormChange}
                        className="form-checkbox text-cyan-600 focus:ring-cyan-500"
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200">{area}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Additional Message (Optional)
                </label>
                <textarea
                  name="requestMessage"
                  placeholder="Tell us why you want to become a paralegal..."
                  value={requestForm.requestMessage}
                  onChange={handleRequestFormChange}
                  rows={4}
                  className="input-style"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="btn-secondary"
                  disabled={isRequestLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isRequestLoading}
                >
                  {isRequestLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Award size={16} />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    )}

    <ConfirmDialog
      isOpen={confirmState.isOpen}
      onClose={closeDialog}
      onConfirm={confirmState.onConfirm}
      title={confirmState.title}
      message={confirmState.message}
      type={confirmState.type}
    />
    </>
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