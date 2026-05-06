import { motion } from 'framer-motion';

export const AVATARS = [
  'avatar_cat', 'avatar_dog', 'avatar_fox', 'avatar_owl',
  'avatar_robot', 'avatar_unicorn', 'avatar_dragon', 'avatar_dino',
  'avatar_panda', 'avatar_lion', 'avatar_bear', 'avatar_frog',
] as const;

export type AvatarId = typeof AVATARS[number];

export const AVATAR_EMOJI: Record<AvatarId, string> = {
  avatar_cat: '🐱', avatar_dog: '🐶', avatar_fox: '🦊', avatar_owl: '🦉',
  avatar_robot: '🤖', avatar_unicorn: '🦄', avatar_dragon: '🐲', avatar_dino: '🦖',
  avatar_panda: '🐼', avatar_lion: '🦁', avatar_bear: '🐻', avatar_frog: '🐸',
};

export function avatarEmoji(id: string | null | undefined): string {
  if (!id) return '👤';
  return (AVATAR_EMOJI as Record<string, string>)[id] ?? '👤';
}

interface Props {
  onPick: (a: AvatarId) => void;
  selected?: AvatarId;
}

export function AvatarPicker({ onPick, selected }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      {AVATARS.map(a => (
        <motion.button
          key={a}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => onPick(a)}
          className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 text-3xl sm:text-4xl md:text-5xl lg:text-6xl rounded-xl bg-white shadow-md border-2 border-transparent ${selected === a ? 'ring-4 ring-primary border-primary' : ''}`}
        >
          {AVATAR_EMOJI[a]}
        </motion.button>
      ))}
    </div>
  );
}
