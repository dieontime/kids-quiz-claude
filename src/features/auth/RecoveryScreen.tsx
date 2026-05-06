import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  if (stage === 'creds') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-2xl font-bold">Forgot your PIN?</h1>
        <input
          placeholder="Your silly name"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="text-xl px-4 py-3 rounded-xl border-2 border-primary"
        />
        <input
          placeholder="Recovery code (e.g. PURPLE-FROG-1234)"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          className="text-xl px-4 py-3 rounded-xl border-2 border-primary"
        />
        {error && <p className="text-red-600">{error}</p>}
        <BigButton onClick={() => setStage('newpin')} disabled={!username || !code}>Next</BigButton>
      </div>
    );
  }
  if (stage === 'newpin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <h2 className="text-2xl font-bold">Pick a new PIN</h2>
        <EmojiPinKeypad onComplete={submitNewPin} />
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-2xl font-bold">All set!</h2>
      <p>Your new recovery code:</p>
      <div className="text-3xl font-mono bg-yellow-100 px-6 py-4 rounded-2xl">{newRecovery}</div>
      <p className="text-sm">Show this to a parent. Old code no longer works.</p>
      <BigButton onClick={() => nav('/login')}>OK, log in</BigButton>
    </div>
  );
}
