import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BigButton } from '../../components/BigButton.tsx';

const SKIP_KEY = 'kq_skip_intro';

export function QuickStartIntro() {
  const nav = useNavigate();
  const [skip] = useState(() => localStorage.getItem(SKIP_KEY) === '1');

  useEffect(() => {
    if (skip) nav('/quiz/random', { replace: true });
  }, [skip, nav]);

  if (skip) return null;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-bold">Quick Quiz!</h1>
      <p className="text-xl">10 random questions. Ready?</p>
      <label className="flex items-center gap-2 text-lg">
        <input
          type="checkbox"
          onChange={e => {
            if (e.target.checked) localStorage.setItem(SKIP_KEY, '1');
            else localStorage.removeItem(SKIP_KEY);
          }}
        />
        Skip this next time
      </label>
      <BigButton onClick={() => nav('/quiz/random')}>Start!</BigButton>
    </div>
  );
}
