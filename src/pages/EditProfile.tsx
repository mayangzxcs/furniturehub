import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { showToast } from '../lib/toast'

export default function EditProfile() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB', 'error'); return }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${profile?.id}.${ext}`
    const { error: uploadError } = await supabase.storage.from('furniture').upload(path, file, { upsert: true })
    if (uploadError) { showToast('Upload failed', 'error'); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('furniture').getPublicUrl(path)
    setAvatarUrl(publicUrl)
    setUploading(false)
    showToast('Avatar uploaded', 'success')
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName, bio, avatar_url: avatarUrl })
      .eq('id', profile?.id)
    setSaving(false)
    if (error) { showToast('Failed to save', 'error'); return }
    await refreshProfile()
    showToast('Profile updated!', 'success')
    navigate('/profile')
  }

  return (
    <div className="fh-page-container" style={{ maxWidth: '600px' }}>
      <h1 className="fh-section-title">Edit Profile</h1>
      <div className="fh-card p-4">
        <div className="text-center mb-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="rounded-circle" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
          ) : (
            <div className="rounded-circle d-flex align-items-center justify-content-center text-white mx-auto" style={{ width: '100px', height: '100px', background: 'var(--fh-primary)', fontSize: '2.5rem' }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="mt-2">
            <label className="btn btn-sm btn-fh-outline cursor-pointer">
              <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
              {uploading ? <span className="spinner-border spinner-border-sm" /> : 'Change Avatar'}
            </label>
          </div>
        </div>

        <div className="mb-3">
          <label className="fh-form-label">Display Name</label>
          <input type="text" className="fh-form-control" value={displayName} onChange={e => setDisplayName(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="fh-form-label">Bio</label>
          <textarea className="fh-form-control" rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." />
        </div>
        <button className="btn-fh-primary btn w-100" onClick={handleSave} disabled={saving}>
          {saving ? <span className="spinner-border spinner-border-sm" /> : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
