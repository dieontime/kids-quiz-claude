import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes.tsx';
import { useProfileStore } from './stores/profileStore.ts';

export default function App() {
  const rehydrate = useProfileStore(s => s.rehydrateFromStorage);
  useEffect(() => { rehydrate(); }, [rehydrate]);
  return <RouterProvider router={router} />;
}
