import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmojiPinKeypad, type PinIcon } from './EmojiPinKeypad.tsx';
import { AvatarPicker, type AvatarId } from './AvatarPicker.tsx';
import { containsProfanity } from '../../lib/profanity.ts';
import { suggestUsernames } from '../../lib/usernameSuggestor.ts';
import { signup, checkUsernameAvailable } from '../../lib/auth.ts';
import { BigButton } from '../../components/BigButton.tsx';

type Step = 'username' | 'pin' | 'avatar' | 'band' | 'recovery';

export function SignupWizard() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>('username');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pin, setPin] = useState<PinIcon[]>([]);
  const [avatar, setAvatar] = useState<AvatarId | null>(null);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);

  const goUsername = async () => {
    if (username.length < 3) {
      setUsernameError('Pick at least 3 letters');
      return;
    }
    if (containsProfanity(username)) {
      setUsernameError('Try another name');
      setSuggestions(suggestUsernames(username, 3));
      return;
    }
    const ok = await checkUsernameAvailable(username);
    if (!ok) {
      setUsernameError('That name is already taken');
      setSuggestions(suggestUsernames(username, 3));
      return;
    }
    setUsernameError(null);
    setSuggestions([]);
    setStep('pin');
  };

  const goPinDone = (icons: PinIcon[]) => {
    setPin(icons);
    setStep('avatar');
  };

  const goAvatar = () => {
    if (avatar) setStep('band');
  };

  const goBand = async (band: '5-6' | '7-9') => {
    if (!avatar) return;
    const result = await signup({ username, pin, avatar, age_band: band });
    setRecoveryCode(result.recoveryCode);
    setStep('recovery');
  };

  const wrap = 'min-h-screen flex flex-col items-center justify-center gap-5 sm:gap-6 md:gap-8 p-4 sm:p-6 md:p-8';

  if (step === 'recovery' && recoveryCode) {
    return (
      <div className={`${wrap} text-center`}>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Save this code!</h2>
        <p className="text-lg sm:text-xl md:text-2xl max-w-2xl">
          Show it to a parent. If you forget your PIN, this gets you back in.
        </p>
        <div className="text-2xl sm:text-3xl md:text-4xl font-mono bg-yellow-100 px-6 py-4 rounded-2xl border-4 border-yellow-400">
          {recoveryCode}
        </div>
        <BigButton onClick={() => nav('/dashboard')}>OK, got it</BigButton>
      </div>
    );
  }

  return (
    <div className={wrap}>
      {step === 'username' && (
        <>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center">Pick a silly name!</h2>
          <input
            placeholder="Your silly name"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full max-w-md text-xl sm:text-2xl md:text-3xl px-4 py-3 sm:py-4 rounded-xl border-4 border-primary text-center"
          />
          {usernameError && <p className="text-red-600 text-lg sm:text-xl">{usernameError}</p>}
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => { setUsername(s); setSuggestions([]); setUsernameError(null); }}
                  className="px-4 py-2 text-base sm:text-lg bg-yellow-100 rounded-lg border-2 border-yellow-300"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <BigButton onClick={goUsername}>Next</BigButton>
        </>
      )}
      {step === 'pin' && (
        <>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center">Pick 4 icons for your PIN</h2>
          <EmojiPinKeypad onComplete={goPinDone} />
        </>
      )}
      {step === 'avatar' && (
        <>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center">Pick your face!</h2>
          <AvatarPicker onPick={setAvatar} selected={avatar ?? undefined} />
          <BigButton onClick={goAvatar} disabled={!avatar}>Next</BigButton>
        </>
      )}
      {step === 'band' && (
        <>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center">How old are you?</h2>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <BigButton onClick={() => goBand('5-6')}>5-6</BigButton>
            <BigButton onClick={() => goBand('7-9')}>7-9</BigButton>
          </div>
        </>
      )}
    </div>
  );
}
