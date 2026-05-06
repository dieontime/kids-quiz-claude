import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmojiPinKeypad, type PinIcon } from './EmojiPinKeypad.tsx';
import { login } from '../../lib/auth.ts';

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
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold">Welcome back!</h1>
      <input
        placeholder="Your silly name"
        value={username}
        onChange={e => setUsername(e.target.value)}
        className="text-2xl px-4 py-3 rounded-xl border-2 border-primary"
      />
      {username.length >= 3 && <EmojiPinKeypad onComplete={onPinDone} />}
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex gap-4 text-primary underline">
        <Link to="/signup">Make a new player</Link>
        <Link to="/recovery">Forgot PIN?</Link>
      </div>
    </div>
  );
}
