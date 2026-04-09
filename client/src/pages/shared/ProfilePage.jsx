import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Save, User, Building2, Lock, Bell, Award, FileText, Sparkles, ArrowRight, Phone, Link as LinkIcon, Target, ShieldCheck, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import authService from '../../services/authService';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const themedSurface = 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 97%, var(--text-primary) 3%) 0%, color-mix(in srgb, var(--surface-2) 94%, var(--text-primary) 6%) 100%)';
const themedWash = 'color-mix(in srgb, var(--surface-2) 84%, var(--text-primary) 16%)';

const BRANCHES = [
  'Computer Science', 'Information Technology', 'Electronics & Communication',
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'Chemical Engineering', 'Other',
];

const InputField = ({ label, value, onChange, placeholder, type = 'text', disabled }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{label}</label>
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm outline-none focus:border-[var(--accent)] focus:shadow-[var(--input-focus-ring)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
);

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser, logoutUser } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name:       user?.name       || '',
    college:    user?.college    || '',
    branch:     user?.branch     || '',
    batch:      user?.batch      || '',
    profilePic: user?.profilePic || '',
    placementProfile: {
      phoneNumber: user?.placementProfile?.phoneNumber || '',
      resumeUrl: user?.placementProfile?.resumeUrl || '',
      linkedin: user?.placementProfile?.linkedin || '',
      skills: (user?.placementProfile?.skills || []).join(', '),
      preferredRoles: (user?.placementProfile?.preferredRoles || []).join(', '),
      preferredLocations: (user?.placementProfile?.preferredLocations || []).join(', '),
      placementGoals: user?.placementProfile?.placementGoals || '',
      hideFromCommunity: Boolean(user?.placementProfile?.hideFromCommunity),
    },
    alumniProfile: {
      currentCompany: user?.alumniProfile?.currentCompany || '',
      currentRole: user?.alumniProfile?.currentRole || '',
      graduationYear: user?.alumniProfile?.graduationYear || '',
      linkedin: user?.alumniProfile?.linkedin || '',
      bio: user?.alumniProfile?.bio || '',
      expertiseTags: (user?.alumniProfile?.expertiseTags || []).join(', '),
      availability: {
        referralRequests: Boolean(user?.alumniProfile?.availability?.referralRequests),
        mentorship: Boolean(user?.alumniProfile?.availability?.mentorship),
        resumeReview: Boolean(user?.alumniProfile?.availability?.resumeReview),
      },
    },
  });

  const [saving, setSaving] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [redirectingToReset, setRedirectingToReset] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleAvatarPick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      set('profilePic', reader.result);
      updateUser({ profilePic: reader.result });
      toast.success('Profile photo selected. Save changes to keep it.');
    };
    reader.onerror = () => {
      toast.error('Could not read the selected image');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveProfile = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        placementProfile: {
          ...form.placementProfile,
          skills: form.placementProfile.skills
            ? form.placementProfile.skills.split(',').map((tag) => tag.trim()).filter(Boolean)
            : [],
          preferredRoles: form.placementProfile.preferredRoles
            ? form.placementProfile.preferredRoles.split(',').map((tag) => tag.trim()).filter(Boolean)
            : [],
          preferredLocations: form.placementProfile.preferredLocations
            ? form.placementProfile.preferredLocations.split(',').map((tag) => tag.trim()).filter(Boolean)
            : [],
        },
        alumniProfile: {
          ...form.alumniProfile,
          graduationYear: form.alumniProfile.graduationYear ? Number(form.alumniProfile.graduationYear) : null,
          expertiseTags: form.alumniProfile.expertiseTags
            ? form.alumniProfile.expertiseTags.split(',').map((tag) => tag.trim()).filter(Boolean)
            : [],
        },
      };
      const res = await authService.updateProfile(payload);
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setRedirectingToReset(true);
    try {
      await logoutUser();
      toast.success('Signed out. Continue with OTP verification to reset your password.');
      const params = new URLSearchParams();
      if (user?.email) params.set('email', user.email);
      navigate(`/forgot-password${params.toString() ? `?${params.toString()}` : ''}`);
    } finally {
      setRedirectingToReset(false);
      setConfirmResetOpen(false);
    }
  };

  const roleColors = {
    student: 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_28%,transparent)]',
    coordinator: 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_28%,transparent)]',
    alumni: 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_28%,transparent)]',
  };
  const studentCompletionChecks = [
    Boolean(form.name.trim()),
    Boolean(user?.email),
    Boolean(form.college.trim()),
    Boolean(form.branch),
    Boolean(form.batch),
    Boolean(form.profilePic),
    Boolean(form.placementProfile.phoneNumber.trim()),
    Boolean(form.placementProfile.resumeUrl.trim()),
    Boolean(form.placementProfile.linkedin.trim()),
  ];
  const studentProfileCompletion = Math.round(
    (studentCompletionChecks.filter(Boolean).length / studentCompletionChecks.length) * 100
  );
  const placementGaps = [
    { label: 'Add phone number', done: Boolean(form.placementProfile.phoneNumber.trim()) },
    { label: 'Add resume link', done: Boolean(form.placementProfile.resumeUrl.trim()) },
    { label: 'Add LinkedIn', done: Boolean(form.placementProfile.linkedin.trim()) },
    { label: 'List skills', done: Boolean(form.placementProfile.skills.trim()) },
    { label: 'List preferred roles', done: Boolean(form.placementProfile.preferredRoles.trim()) },
  ];
  const studentShortcuts = [
    {
      label: 'My Applications',
      to: '/student/applications',
      icon: FileText,
      iconClass: 'text-[var(--accent)]',
      hoverClass: 'hover:border-[var(--accent)] hover:shadow-[var(--shadow-hover)]',
    },
    {
      label: 'Referrals',
      to: '/student/referrals',
      icon: Award,
      iconClass: 'text-[var(--accent)]',
      hoverClass: 'hover:border-[var(--accent)] hover:shadow-[var(--shadow-hover)]',
    },
    {
      label: 'Notifications',
      to: '/student/notifications',
      icon: Bell,
      iconClass: 'text-[var(--accent)]',
      hoverClass: 'hover:border-[var(--accent)] hover:shadow-[var(--shadow-hover)]',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-4 md:p-6 page-enter space-y-4 sm:space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">My Profile</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage your personal information</p>
      </div>

      {/* Avatar + role */}
      <div className="card p-4 sm:p-6 flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-5 border-[var(--border)]" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
        <div className="relative">
          <Avatar name={user?.name} src={form.profilePic} size="2xl" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarFileChange}
          />
          <button
            type="button"
            onClick={handleAvatarPick}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center border-2 border-[var(--surface)] cursor-pointer hover:bg-[var(--accent-hover)] transition-colors shadow-md"
            aria-label="Upload profile picture"
          >
            <Camera size={13} className="text-[var(--text-reverse)]" />
          </button>
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">{user?.name}</h2>
          <p className="text-sm text-[var(--text-muted)] break-all">{user?.email}</p>
          <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-lg mt-2 capitalize border ${roleColors[user?.role]}`}>
            {user?.role}
          </span>
        </div>
      </div>

      {user?.role === 'student' && (
        <div className="card p-4 sm:p-6 space-y-4 sm:space-y-5 border-[var(--border)]" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
          <div className="flex items-start justify-between gap-3 sm:gap-4 flex-wrap">
            <div>
              <h2 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--accent)]" /> Student Profile Overview
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Keep these details updated so coordinators and student workflows stay accurate.
              </p>
            </div>
            <div className="px-3 py-2 rounded-xl border text-[var(--accent)] text-xs sm:text-sm font-bold" style={{ background: themedWash, borderColor: 'color-mix(in srgb, var(--accent) 24%, transparent)' }}>
              {studentProfileCompletion}% complete
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex-wrap gap-2">
              <span>Profile completion</span>
              <span>{studentCompletionChecks.filter(Boolean).length}/{studentCompletionChecks.length} fields ready</span>
            </div>
            <div className="h-2.5 rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--gradient-hero-start),var(--gradient-hero-end))] transition-all duration-300"
                style={{ width: `${studentProfileCompletion}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {studentShortcuts.map(({ label, to, icon: Icon, iconClass, hoverClass }) => (
              <Link
                key={to}
                to={to}
                className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-all h-full flex flex-col justify-between gap-2 ${hoverClass}`}
              >
                <span className="flex items-center gap-2">
                  <Icon size={15} className={iconClass} />
                  {label}
                </span>
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  Open <ArrowRight size={12} />
                </span>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {placementGaps.filter((item) => !item.done).slice(0, 3).map((item) => (
              <div key={item.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 h-full">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Missing</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)] leading-snug">{item.label}</p>
              </div>
            ))}
            {placementGaps.filter((item) => !item.done).length === 0 && (
              <div className="rounded-2xl border border-[var(--success-border)] bg-[var(--success-bg)] px-4 py-3 text-sm font-semibold text-[var(--success)]">
                Placement profile looks complete.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile form */}
      <div className="card p-4 sm:p-6 space-y-4 border-[var(--border)]" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
        <h2 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
          <User size={16} className="text-[var(--accent)]" /> Personal Information
        </h2>

        <InputField label="Full Name" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your full name" />
        <InputField label="Email" value={user?.email || ''} disabled placeholder="Email" />

        <div className="border-t border-[var(--border)] pt-4 space-y-4">
          <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
            <Target size={13} /> Placement Readiness
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Phone Number" value={form.placementProfile.phoneNumber} onChange={e => set('placementProfile', { ...form.placementProfile, phoneNumber: e.target.value })} placeholder="Your contact number" type="tel" />
            <InputField label="Resume Link" value={form.placementProfile.resumeUrl} onChange={e => set('placementProfile', { ...form.placementProfile, resumeUrl: e.target.value })} placeholder="https://.../resume.pdf" />
            <InputField label="LinkedIn" value={form.placementProfile.linkedin} onChange={e => set('placementProfile', { ...form.placementProfile, linkedin: e.target.value })} placeholder="https://linkedin.com/in/yourname" />
            <InputField label="Preferred Roles" value={form.placementProfile.preferredRoles} onChange={e => set('placementProfile', { ...form.placementProfile, preferredRoles: e.target.value })} placeholder="SDE, Data Analyst, Product" />
            <div className="md:col-span-2">
              <InputField label="Skills" value={form.placementProfile.skills} onChange={e => set('placementProfile', { ...form.placementProfile, skills: e.target.value })} placeholder="JavaScript, React, SQL" />
            </div>
            <div className="md:col-span-2">
              <InputField label="Preferred Locations" value={form.placementProfile.preferredLocations} onChange={e => set('placementProfile', { ...form.placementProfile, preferredLocations: e.target.value })} placeholder="Remote, Bangalore, Hyderabad" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Placement Goals</label>
              <textarea
                value={form.placementProfile.placementGoals}
                onChange={e => set('placementProfile', { ...form.placementProfile, placementGoals: e.target.value })}
                rows={3}
                className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)] focus:shadow-[var(--input-focus-ring)]"
                placeholder="Tell coordinators what kind of placement support you need"
              />
            </div>
            <label className="md:col-span-2 flex items-center gap-2 text-sm text-[var(--text-secondary)] rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
              <input
                type="checkbox"
                checked={form.placementProfile.hideFromCommunity}
                onChange={e => set('placementProfile', { ...form.placementProfile, hideFromCommunity: e.target.checked })}
              />
              Hide my profile from community-style placement features
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Profile Picture URL</label>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <input
              value={form.profilePic} onChange={e => set('profilePic', e.target.value)}
              placeholder="https://avatars.githubusercontent.com/..."
              className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm outline-none focus:border-[var(--accent)] focus:shadow-[var(--input-focus-ring)] transition-all"
            />
            {form.profilePic && (
              <img src={form.profilePic} alt="" onError={e => e.target.style.display='none'}
                className="w-10 h-10 rounded-xl object-cover border border-[var(--border)]" />
            )}
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-4">
          <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Building2 size={13} /> College Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <InputField label="College" value={form.college} onChange={e => set('college', e.target.value)} placeholder="e.g. Thapar Institute of Engineering" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Branch</label>
              <select value={form.branch} onChange={e => set('branch', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)] focus:shadow-[var(--input-focus-ring)]">
                <option value="">Select branch</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <InputField label="Batch / Year" value={form.batch} onChange={e => set('batch', e.target.value)} placeholder="e.g. 2025" />
          </div>
        </div>

        {user?.role === 'alumni' && (
          <div className="border-t border-[var(--color-border)] pt-4 space-y-3">
            <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Alumni Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InputField label="Current Company" value={form.alumniProfile.currentCompany} onChange={e => set('alumniProfile', { ...form.alumniProfile, currentCompany: e.target.value })} placeholder="e.g. Google" />
              <InputField label="Current Role" value={form.alumniProfile.currentRole} onChange={e => set('alumniProfile', { ...form.alumniProfile, currentRole: e.target.value })} placeholder="e.g. Software Engineer" />
              <InputField label="Graduation Year" value={form.alumniProfile.graduationYear} onChange={e => set('alumniProfile', { ...form.alumniProfile, graduationYear: e.target.value })} placeholder="e.g. 2021" />
              <InputField label="LinkedIn" value={form.alumniProfile.linkedin} onChange={e => set('alumniProfile', { ...form.alumniProfile, linkedin: e.target.value })} placeholder="https://linkedin.com/in/yourname" />
              <div className="md:col-span-2">
                <InputField label="Expertise Tags" value={form.alumniProfile.expertiseTags} onChange={e => set('alumniProfile', { ...form.alumniProfile, expertiseTags: e.target.value })} placeholder="DSA, Backend, Data Engineering" />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Short Bio</label>
                <textarea
                  value={form.alumniProfile.bio}
                  onChange={e => set('alumniProfile', { ...form.alumniProfile, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--input-bg)] text-[var(--color-text-primary)] text-sm outline-none focus:border-[var(--accent)] focus:shadow-[var(--input-focus-ring)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
              {[
                ['referralRequests', 'Open to referral requests'],
                ['mentorship', 'Open to mentorship'],
                ['resumeReview', 'Open to resume review'],
              ].map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => set('alumniProfile', {
                    ...form.alumniProfile,
                    availability: {
                      ...form.alumniProfile.availability,
                      [key]: !form.alumniProfile.availability[key],
                    },
                  })}
                  className={`text-sm font-semibold rounded-xl px-3 py-2 border transition-colors ${form.alumniProfile.availability[key] ? 'bg-[var(--surface-2)] text-[var(--accent)] border-[var(--color-border)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleSaveProfile} loading={saving} leftIcon={<Save size={14} />} fullWidth>
          Save Changes
        </Button>
      </div>

      {/* Change password */}
      <div className="card p-4 sm:p-6 space-y-4 border-[var(--border)]" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
        <h2 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
          <Lock size={16} className="text-[var(--accent)]" /> Change Password
        </h2>
        <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
          Reset your password securely with email OTP verification. We will sign you out first and take you to the password reset page.
        </div>
        <Button
          onClick={() => setConfirmResetOpen(true)}
          leftIcon={<Lock size={14} />}
          variant="secondary"
          fullWidth
        >
          Change Password
        </Button>
      </div>

      <Modal
        isOpen={confirmResetOpen}
        onClose={() => !redirectingToReset && setConfirmResetOpen(false)}
        title="Reset Password"
        footer={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
            <Button
              onClick={() => setConfirmResetOpen(false)}
              disabled={redirectingToReset}
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={redirectingToReset}
              variant="accent"
              size="sm"
              className="shadow-[var(--shadow-soft)] w-full sm:w-auto"
            >
              {redirectingToReset ? 'Redirecting...' : 'Yes, continue'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Confirm you want to reset your password. You will be logged out and taken to the forgot password page, where you can verify with OTP and set a new password.
        </p>
      </Modal>
    </div>
  );
};

export default ProfilePage;
