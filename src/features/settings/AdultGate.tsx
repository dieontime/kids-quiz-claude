import { useEffect, useState } from 'react';

const LOCK_KEY = 'kq_adult_gate_lock';
const LOCK_MS = 30_000;

interface Props {
  onPass: () => void;
  onCancel: () => void;
}

function lockExpiryMs(): number | null {
  const raw = sessionStorage.getItem(LOCK_KEY);
  if (!raw) return null;
  const t = Number(raw);
  if (!Number.isFinite(t) || t <= Date.now()) {
    sessionStorage.removeItem(LOCK_KEY);
    return null;
  }
  return t;
}

export function AdultGate({ onPass, onCancel }: Props) {
  const [value, setValue] = useState('');
  const [tries, setTries] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lockUntil, setLockUntil] = useState<number | null>(lockExpiryMs());
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (lockUntil === null) return;
    const interval = setInterval(() => {
      const remaining = lockUntil - Date.now();
      if (remaining <= 0) {
        sessionStorage.removeItem(LOCK_KEY);
        setLockUntil(null);
      } else {
        forceTick(t => t + 1);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [lockUntil]);

  if (lockUntil !== null) {
    const seconds = Math.max(1, Math.ceil((lockUntil - Date.now()) / 1000));
    return (
      <div role="dialog" className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-2xl">
        <div className="text-2xl font-bold mb-2">🔒 Locked</div>
        <p className="text-lg">Try again in {seconds}s</p>
      </div>
    );
  }

  const submit = () => {
    if (value.trim() === '63') {
      sessionStorage.removeItem(LOCK_KEY);
      onPass();
      return;
    }
    const next = tries + 1;
    setTries(next);
    setError('Not quite — give it another try.');
    setValue('');
    if (next >= 3) {
      sessionStorage.setItem(LOCK_KEY, String(Date.now() + LOCK_MS));
      setLockUntil(Date.now() + LOCK_MS);
      onCancel();
    }
  };

  return (
    <div role="dialog" className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
      <div className="text-2xl font-bold mb-3">Hey grown-up!</div>
      <label htmlFor="adult-gate-input" className="block text-lg mb-2">9 × 7 = ?</label>
      <input
        id="adult-gate-input"
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        className="w-full text-2xl px-4 py-3 rounded-xl border-4 border-primary text-center focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none"
        autoFocus
      />
      {error && <p className="text-red-600 mt-3">{error}</p>}
      <div className="flex gap-3 mt-5">
        <button onClick={submit} className="flex-1 bg-primary text-white text-xl font-bold py-3 rounded-xl shadow focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none">Submit</button>
        <button onClick={onCancel} className="flex-1 bg-white text-primary border-2 border-primary text-xl font-bold py-3 rounded-xl focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none">Cancel</button>
      </div>
    </div>
  );
}
