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
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 sm:gap-8 p-4 sm:p-6 md:p-8 text-center">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold">Quick Quiz!</h1>
      <p className="text-xl sm:text-2xl md:text-3xl">10 random questions. Ready?</p>
      <label className="flex items-center gap-3 text-base sm:text-lg md:text-xl">
        <input
          type="checkbox"
          className="w-5 h-5 sm:w-6 sm:h-6"
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
