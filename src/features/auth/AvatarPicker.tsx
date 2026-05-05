import { motion } from 'framer-motion';

export const AVATARS = [
  'avatar_cat', 'avatar_dog', 'avatar_fox', 'avatar_owl',
  'avatar_robot', 'avatar_unicorn', 'avatar_dragon', 'avatar_dino',
  'avatar_panda', 'avatar_lion', 'avatar_bear', 'avatar_frog',
] as const;

export type AvatarId = typeof AVATARS[number];

const EMOJI: Record<AvatarId, string> = {
  avatar_cat: '🐱', avatar_dog: '🐶', avatar_fox: '🦊', avatar_owl: '🦉',
  avatar_robot: '🤖', avatar_unicorn: '🦄', avatar_dragon: '🐲', avatar_dino: '🦖',
  avatar_panda: '🐼', avatar_lion: '🦁', avatar_bear: '🐻', avatar_frog: '🐸',
};

interface Props {
  onPick: (a: AvatarId) => void;
  selected?: AvatarId;
}

export function AvatarPicker({ onPick, selected }: Props) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {AVATARS.map(a => (
        <motion.button
          key={a}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => onPick(a)}
          className={`w-16 h-16 text-4xl rounded-xl bg-white shadow ${selected === a ? 'ring-4 ring-primary' : ''}`}
        >
          {EMOJI[a]}
        </motion.button>
      ))}
    </div>
  );
}
