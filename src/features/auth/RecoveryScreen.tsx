import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmojiPinKeypad, type PinIcon } from './EmojiPinKeypad.tsx';
import { recoverPin } from '../../lib/auth.ts';
import { BigButton } from '../../components/BigButton.tsx';

type Stage = 'creds' | 'newpin' | 'done';

export function RecoveryScreen() {
  const nav = useNavigate();
  const [stage, setStage] = useState<Stage>('creds');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [newRecovery, setNewRecovery] = useState<string | null>(null);

  const submitNewPin = async (pin: PinIcon[]) => {
    try {
      const result = await recoverPin(username, code, pin);
      setNewRecovery(result.recoveryCode);
      setStage('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Recovery failed');
      setStage('creds');
    }
  };

  const wrap = 'min-h-screen flex flex-col items-center justify-center gap-4 sm:gap-6 md:gap-8 p-4 sm:p-6 md:p-8';

  if (stage === 'creds') {
    return (
      <div className={wrap}>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center">Forgot your PIN?</h1>
        <input
          placeholder="Your silly name"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full max-w-md text-xl sm:text-2xl px-4 py-3 sm:py-4 rounded-xl border-4 border-primary text-center"
        />
        <input
          placeholder="Recovery code (PURPLE-FROG-1234)"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          className="w-full max-w-md text-xl sm:text-2xl px-4 py-3 sm:py-4 rounded-xl border-4 border-primary text-center font-mono"
        />
        {error && <p className="text-red-600 text-lg sm:text-xl">{error}</p>}
        <BigButton onClick={() => setStage('newpin')} disabled={!username || !code}>Next</BigButton>
        <Link to="/login" className="text-lg sm:text-xl text-primary underline">← Back to login</Link>
      </div>
    );
  }
  if (stage === 'newpin') {
    return (
      <div className={wrap}>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center">Pick a new PIN</h2>
        <EmojiPinKeypad onComplete={submitNewPin} />
        <button
          onClick={() => setStage('creds')}
          className="text-lg sm:text-xl text-primary underline"
        >
          ← Back
        </button>
      </div>
    );
  }
  return (
    <div className={`${wrap} text-center`}>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">All set!</h2>
      <p className="text-lg sm:text-xl">Your new recovery code:</p>
      <div className="text-2xl sm:text-3xl md:text-4xl font-mono bg-yellow-100 px-6 py-4 rounded-2xl border-4 border-yellow-400">
        {newRecovery}
      </div>
      <p className="text-base sm:text-lg max-w-md">Show this to a parent. The old code no longer works.</p>
      <BigButton onClick={() => nav('/login')}>OK, log in</BigButton>
    </div>
  );
}
