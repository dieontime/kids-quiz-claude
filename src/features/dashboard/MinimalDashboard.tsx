import { Link, Navigate } from 'react-router-dom';
import { useProfileStore } from '../../stores/profileStore.ts';

export function MinimalDashboard() {
  const profile = useProfileStore(s => s.profile);
  const logout = useProfileStore(s => s.logout);
  if (!profile) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 sm:gap-8 md:gap-10 p-6">
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center">
        Hi, {profile.username}!
      </h1>
      <Link
        to="/quick-start"
        className="px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 bg-primary text-white text-2xl sm:text-3xl md:text-4xl font-bold rounded-2xl shadow-md text-center"
      >
        Quick Start
      </Link>
      <Link
        to="/modules"
        className="px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 border-4 border-primary text-primary text-2xl sm:text-3xl md:text-4xl font-bold rounded-2xl text-center"
      >
        Choose Module
      </Link>
      <button
        onClick={logout}
        className="text-base sm:text-lg text-gray-500 underline mt-6 sm:mt-8"
      >
        Log out
      </button>
    </div>
  );
}
