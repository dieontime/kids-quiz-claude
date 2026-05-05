const BLOCKED = [
  'ass', 'damn', 'hell', 'crap', 'shit', 'fuck', 'bitch', 'piss',
  'butt', 'sex', 'porn', 'kill', 'nazi', 'dick', 'cock', 'tit',
];

export function containsProfanity(input: string): boolean {
  if (!input) return false;
  const lower = input.toLowerCase();
  return BLOCKED.some(word => lower.includes(word));
}
