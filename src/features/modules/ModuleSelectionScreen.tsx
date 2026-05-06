import { useNavigate, Navigate } from 'react-router-dom';
import { useProfileStore } from '../../stores/profileStore.ts';
import { BigButton } from '../../components/BigButton.tsx';

interface ModuleEntry {
  id: 'math' | 'vehicles' | 'grammar' | 'animals' | 'science';
  label: string;
  bands: Array<'5-6' | '7-9'>;
}

const ALL_MODULES: ModuleEntry[] = [
  { id: 'math',     label: 'Math 🔢',     bands: ['5-6', '7-9'] },
  { id: 'vehicles', label: 'Vehicles 🚗', bands: ['5-6'] },
  { id: 'grammar',  label: 'Grammar 🔤',  bands: ['5-6'] },
  { id: 'animals',  label: 'Animals 🐾',  bands: ['7-9'] },
  { id: 'science',  label: 'Science 🧪',  bands: ['7-9'] },
];

export function ModuleSelectionScreen() {
  const nav = useNavigate();
  const profile = useProfileStore(s => s.profile);
  if (!profile) return <Navigate to="/login" replace />;

  const visible = ALL_MODULES.filter(m => m.bands.includes(profile.age_band));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 sm:gap-8 md:gap-10 p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center">Pick a topic</h1>
      <div className="flex flex-col gap-4 sm:gap-5 w-full max-w-md md:max-w-lg">
        {visible.map(m => (
          <BigButton key={m.id} onClick={() => nav(`/quiz/${m.id}`)}>{m.label}</BigButton>
        ))}
      </div>
      <button
        onClick={() => nav('/dashboard')}
        className="text-lg sm:text-xl text-primary underline mt-4"
      >
        ← Back to home
      </button>
    </div>
  );
}
