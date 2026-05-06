import { Link, Navigate } from 'react-router-dom';
import { useProfileStore } from '../../stores/profileStore.ts';

export function MinimalDashboard() {
  const profile = useProfileStore(s => s.profile);
  const logout = useProfileStore(s => s.logout);
  if (!profile) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold">Hi, {profile.username}!</h1>
      <Link to="/quick-start" className="px-8 py-4 bg-primary text-white text-2xl rounded-2xl shadow-md">
        Quick Start
      </Link>
      <Link to="/modules" className="px-8 py-4 border-2 border-primary text-primary text-2xl rounded-2xl">
        Choose Module
      </Link>
      <button onClick={logout} className="text-sm text-gray-500 underline mt-8">Log out</button>
    </div>
  );
}
