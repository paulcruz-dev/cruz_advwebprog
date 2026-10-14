import { useState } from 'react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

const inputClasses =
  'mt-2 w-full rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-zinc-50';

const cardClasses = 'rounded-3xl border-2 border-zinc-900 bg-zinc-50 p-6';

const formatMemberSince = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString('en-PH', { year: 'numeric', month: 'long' });
};

const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();

  const [profileForm, setProfileForm] = useState({ name: user.name, email: user.email });
  const [profileStatus, setProfileStatus] = useState({ error: '', success: '', submitting: false });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordStatus, setPasswordStatus] = useState({ error: '', success: '', submitting: false });

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileStatus({ error: '', success: '', submitting: true });

    try {
      await updateProfile(profileForm);
      setProfileStatus({ error: '', success: 'Profile updated successfully.', submitting: false });
    } catch (err) {
      setProfileStatus({
        error: err.response?.data?.message || 'Could not update profile. Please try again.',
        success: '',
        submitting: false,
      });
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ error: 'New password and confirmation do not match.', success: '', submitting: false });
      return;
    }

    setPasswordStatus({ error: '', success: '', submitting: true });

    try {
      await changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordStatus({ error: '', success: 'Password changed successfully.', submitting: false });
    } catch (err) {
      setPasswordStatus({
        error: err.response?.data?.message || 'Could not change password. Please try again.',
        success: '',
        submitting: false,
      });
    }
  };

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const memberSince = formatMemberSince(user.createdAt);

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="border-y-2 border-zinc-900 bg-zinc-900 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-zinc-50 bg-zinc-700 text-2xl font-bold text-zinc-50">
            {initials}
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-300">
              My Account
            </p>
            <h1 className="mt-1 text-2xl font-bold text-zinc-50 sm:text-3xl">{user.name}</h1>
            <p className="mt-1 text-sm text-zinc-300">
              {user.email} · <span className="capitalize">{user.role}</span>
              {memberSince ? ` · Member since ${memberSince}` : ''}
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
          <div className={cardClasses}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
              Account Details
            </p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-900">Edit Profile</h2>

            {profileStatus.error && (
              <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {profileStatus.error}
              </div>
            )}
            {profileStatus.success && (
              <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {profileStatus.success}
              </div>
            )}

            <form className="mt-5 space-y-4" onSubmit={handleProfileSubmit}>
              <div>
                <label htmlFor="profile-name" className="text-sm font-medium text-zinc-700">
                  Full Name
                </label>
                <input
                  id="profile-name"
                  name="name"
                  type="text"
                  className={inputClasses}
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="profile-email" className="text-sm font-medium text-zinc-700">
                  Email Address
                </label>
                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  className={inputClasses}
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  required
                />
              </div>

              <Button type="submit" variant="primary" className="w-full rounded-xl py-3 text-[11px] tracking-[0.2em]" disabled={profileStatus.submitting}>
                {profileStatus.submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </div>

          <div className={cardClasses}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
              Security
            </p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-900">Change Password</h2>

            {passwordStatus.error && (
              <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {passwordStatus.error}
              </div>
            )}
            {passwordStatus.success && (
              <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {passwordStatus.success}
              </div>
            )}

            <form className="mt-5 space-y-4" onSubmit={handlePasswordSubmit}>
              <div>
                <label htmlFor="current-password" className="text-sm font-medium text-zinc-700">
                  Current Password
                </label>
                <input
                  id="current-password"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  className={inputClasses}
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="new-password" className="text-sm font-medium text-zinc-700">
                  New Password
                </label>
                <input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  className={inputClasses}
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="text-sm font-medium text-zinc-700">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  className={inputClasses}
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <Button type="submit" variant="primary" className="w-full rounded-xl py-3 text-[11px] tracking-[0.2em]" disabled={passwordStatus.submitting}>
                {passwordStatus.submitting ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;