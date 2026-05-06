import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmojiPinKeypad, type PinIcon } from './EmojiPinKeypad.tsx';
import { login } from '../../lib/auth.ts';
import { PlayfulBackground } from '../../components/PlayfulBackground.tsx';

export function LoginScreen() {
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onPinDone = async (pin: PinIcon[]) => {
    try {
      await login(username, pin);
      nav('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 sm:gap-6 md:gap-8 p-4 sm:p-6 md:p-8 relative">
      <PlayfulBackground />
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Welcome back!</h1>
      <input
        placeholder="Your silly name"
        value={username}
        onChange={e => setUsername(e.target.value)}
        className="w-full max-w-md text-xl sm:text-2xl md:text-3xl px-4 py-3 sm:py-4 rounded-xl border-4 border-primary text-center"
      />
      {username.length >= 3 && <EmojiPinKeypad onComplete={onPinDone} />}
      {error && <p className="text-red-600 text-lg sm:text-xl">{error}</p>}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-primary text-lg sm:text-xl underline mt-2">
        <Link to="/signup">Make a new player</Link>
        <Link to="/recovery">Forgot PIN?</Link>
      </div>
    </div>
  );
}
