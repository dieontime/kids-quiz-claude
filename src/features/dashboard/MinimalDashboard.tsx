import { Link, Navigate } from 'react-router-dom';
import { useProfileStore } from '../../stores/profileStore.ts';

export function MinimalDashboard() {
  const profile = useProfileStore(s => s.profile);
  const logout = useProfileStore(s => s.logout);
  if (!profile) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 md:p-8">
      <header className="w-full flex justify-end">
        <button
          onClick={logout}
          className="px-3 py-2 text-sm sm:text-base font-bold text-primary border-2 border-primary rounded-lg hover:bg-primary/5"
        >
          Log out
        </button>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center gap-6 sm:gap-8 md:gap-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center">
          Hi, {profile.username}!
        </h1>
        <Link
          to="/quick-start"
          className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-primary text-white text-xl sm:text-2xl md:text-3xl font-bold rounded-2xl shadow-md text-center"
        >
          Quick Start
        </Link>
        <Link
          to="/modules"
          className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 border-4 border-primary text-primary text-xl sm:text-2xl md:text-3xl font-bold rounded-2xl text-center"
        >
          Choose Module
        </Link>
      </div>
    </div>
  );
}
