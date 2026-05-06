export interface GeneratedQuestion {
  module_id: 'math';
  age_band: '5-6' | '7-9';
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string;
  source: 'procedural:math';
  external_id: string;
}

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export function generateMathQuestions(band: '5-6' | '7-9', count: number): GeneratedQuestion[] {
  const out: GeneratedQuestion[] = [];
  for (let i = 0; i < count; i++) {
    out.push(band === '5-6' ? makeYounger() : makeOlder());
  }
  return out;
}

function makeYounger(): GeneratedQuestion {
  const op = Math.random() < 0.5 ? '+' : '-';
  let a: number;
  let b: number;
  let answer: number;
  let explanation: string;
  if (op === '+') {
    // Both operands >= 1, sum capped at 10. Excludes n+0 and 0+n.
    a = randInt(1, 9);
    b = randInt(1, 10 - a);
    answer = a + b;
    explanation = `${a} plus ${b} is ${answer}`;
  } else {
    // a in [2, 10], b in [1, a-1]. Excludes n-0 and n-n.
    a = randInt(2, 10);
    b = randInt(1, a - 1);
    answer = a - b;
    explanation = `${a} take away ${b} is ${answer}`;
  }
  return shape('5-6', `${a} ${op} ${b}`, answer, explanation);
}

function makeOlder(): GeneratedQuestion {
  const r = Math.random();
  if (r < 0.4) {
    const a = randInt(2, 12);
    const b = randInt(2, 12);
    return shape('7-9', `${a} × ${b}`, a * b, `${a} times ${b} is ${a * b}`);
  } else if (r < 0.7) {
    // 2-digit + at-least-2 to avoid trivial "47 + 1".
    const a = randInt(10, 99);
    const b = randInt(2, 99);
    return shape('7-9', `${a} + ${b}`, a + b, `${a} plus ${b} is ${a + b}`);
  } else {
    // 2-digit minus at-least-2; result strictly positive.
    const a = randInt(20, 99);
    const b = randInt(2, a - 1);
    return shape('7-9', `${a} − ${b}`, a - b, `${a} minus ${b} is ${a - b}`);
  }
}

function shape(band: '5-6' | '7-9', expr: string, answer: number, explanation: string): GeneratedQuestion {
  const distractors = uniqueDistractors(answer, 3);
  const options = [...distractors, answer];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  const correct_index = options.indexOf(answer);
  return {
    module_id: 'math',
    age_band: band,
    question_text: `What is ${expr}?`,
    options: options.map(String),
    correct_index,
    explanation,
    source: 'procedural:math',
    external_id: `math:${band}:${expr.replace(/\s/g, '')}`,
  };
}

function uniqueDistractors(answer: number, n: number): number[] {
  const set = new Set<number>();
  while (set.size < n) {
    const delta = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? -1 : 1);
    const candidate = answer + delta;
    if (candidate >= 0 && candidate !== answer) set.add(candidate);
  }
  return [...set];
}
