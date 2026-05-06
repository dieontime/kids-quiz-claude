import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes.tsx';
import { useProfileStore } from './stores/profileStore.ts';
import { useSettings } from './stores/settingsStore.ts';
import { audio } from './services/audio.ts';

export default function App() {
  const rehydrate = useProfileStore(s => s.rehydrateFromStorage);
  const largeText = useSettings(s => s.largeText);
  const dyslexiaFont = useSettings(s => s.dyslexiaFont);
  const soundOn = useSettings(s => s.soundOn);
  const volume = useSettings(s => s.volume);
  const [audioReady, setAudioReady] = useState(false);

  useEffect(() => { rehydrate(); }, [rehydrate]);

  useEffect(() => {
    document.documentElement.classList.toggle('kq-large-text', largeText);
  }, [largeText]);
  useEffect(() => {
    document.documentElement.classList.toggle('kq-dyslexia-font', dyslexiaFont);
  }, [dyslexiaFont]);

  useEffect(() => {
    if (audioReady) return;
    const onFirst = () => {
      audio.preload();
      audio.setMuted(!soundOn);
      audio.setVolume(volume);
      setAudioReady(true);
    };
    document.addEventListener('pointerdown', onFirst, { once: true });
    return () => document.removeEventListener('pointerdown', onFirst);
  }, [audioReady, soundOn, volume]);

  return <RouterProvider router={router} />;
}
