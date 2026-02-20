/**
 * QuestionBank — generates math questions for all five regions.
 *
 * Each generator returns an object:
 * {
 *   text:          string   – display text (may contain '\n')
 *   answer:        number|string – the correct answer
 *   answerDisplay: string   – formatted for display in an answer button
 *   topic:         string   – which topic generated this
 * }
 */

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

/** Format a fraction, simplifying if possible. Returns a string like "3/4" or "2". */
function frac(num, den) {
  if (num === 0) return '0';
  const g = gcd(Math.abs(num), Math.abs(den));
  const n = num / g;
  const d = den / g;
  return d === 1 ? String(n) : `${n}/${d}`;
}

// ── Addition & Subtraction (Grades 1–3) ──────────────────────────────────────

function addSubD1() {
  // Simple addition within 10
  const a = rand(1, 8);
  const b = rand(1, 9 - a);
  return { text: `${a} + ${b} = ?`, answer: a + b, answerDisplay: String(a + b), topic: 'addSub' };
}

function addSubD2() {
  // Addition or subtraction within 20
  if (Math.random() < 0.5) {
    const a = rand(5, 15);
    const b = rand(1, 20 - a);
    return { text: `${a} + ${b} = ?`, answer: a + b, answerDisplay: String(a + b), topic: 'addSub' };
  } else {
    const a = rand(10, 20);
    const b = rand(1, a - 1);
    return { text: `${a} − ${b} = ?`, answer: a - b, answerDisplay: String(a - b), topic: 'addSub' };
  }
}

function addSubD3() {
  // Mixed within 99
  if (Math.random() < 0.5) {
    const a = rand(11, 89);
    const b = rand(5, 99 - a);
    return { text: `${a} + ${b} = ?`, answer: a + b, answerDisplay: String(a + b), topic: 'addSub' };
  } else {
    const a = rand(20, 99);
    const b = rand(5, a - 5);
    return { text: `${a} − ${b} = ?`, answer: a - b, answerDisplay: String(a - b), topic: 'addSub' };
  }
}

// ── Multiplication (Grades 4–5) ───────────────────────────────────────────────

function multD1() {
  const a = rand(2, 5);
  const b = rand(2, 5);
  return { text: `${a} × ${b} = ?`, answer: a * b, answerDisplay: String(a * b), topic: 'multiplication' };
}

function multD2() {
  const a = rand(2, 9);
  const b = rand(2, 9);
  return { text: `${a} × ${b} = ?`, answer: a * b, answerDisplay: String(a * b), topic: 'multiplication' };
}

function multD3() {
  if (Math.random() < 0.4) {
    // Multi-digit × single-digit
    const a = rand(11, 25);
    const b = rand(2, 9);
    return { text: `${a} × ${b} = ?`, answer: a * b, answerDisplay: String(a * b), topic: 'multiplication' };
  }
  const a = rand(3, 12);
  const b = rand(3, 12);
  return { text: `${a} × ${b} = ?`, answer: a * b, answerDisplay: String(a * b), topic: 'multiplication' };
}

// ── Division (Grades 4–5) ─────────────────────────────────────────────────────

function divD1() {
  const divisor  = rand(2, 5);
  const quotient = rand(2, 8);
  return { text: `${divisor * quotient} ÷ ${divisor} = ?`, answer: quotient, answerDisplay: String(quotient), topic: 'division' };
}

function divD2() {
  const divisor  = rand(2, 9);
  const quotient = rand(2, 10);
  return { text: `${divisor * quotient} ÷ ${divisor} = ?`, answer: quotient, answerDisplay: String(quotient), topic: 'division' };
}

function divD3() {
  if (Math.random() < 0.4) {
    // Division with remainder
    const divisor   = rand(3, 9);
    const quotient  = rand(2, 9);
    const remainder = rand(1, divisor - 1);
    const dividend  = divisor * quotient + remainder;
    return {
      text:          `${dividend} ÷ ${divisor} = ? (whole number)`,
      answer:        quotient,
      answerDisplay: String(quotient),
      topic:         'division',
    };
  }
  const divisor  = rand(3, 12);
  const quotient = rand(3, 12);
  return { text: `${divisor * quotient} ÷ ${divisor} = ?`, answer: quotient, answerDisplay: String(quotient), topic: 'division' };
}

// ── Fractions & Decimals (Grades 5–6) ────────────────────────────────────────

const SIMPLE_FRACS = [
  [1, 2], [1, 3], [2, 3], [1, 4], [3, 4],
  [1, 6], [5, 6], [1, 5], [2, 5], [3, 5], [4, 5],
  [1, 8], [3, 8], [5, 8], [7, 8],
];

function fracD1() {
  // Compare two simple fractions — which is larger?
  let idx1 = rand(0, SIMPLE_FRACS.length - 1);
  let idx2 = rand(0, SIMPLE_FRACS.length - 1);
  while (idx2 === idx1) idx2 = rand(0, SIMPLE_FRACS.length - 1);
  const [n1, d1] = SIMPLE_FRACS[idx1];
  const [n2, d2] = SIMPLE_FRACS[idx2];
  const v1 = n1 / d1;
  const v2 = n2 / d2;
  if (Math.abs(v1 - v2) < 0.01) return fracD1(); // too close — retry
  const larger = v1 > v2 ? `${n1}/${d1}` : `${n2}/${d2}`;
  return {
    text:          `Which is larger?\n${n1}/${d1}   or   ${n2}/${d2}`,
    answer:        larger,
    answerDisplay: larger,
    altAnswer:     v1 > v2 ? `${n2}/${d2}` : `${n1}/${d1}`,
    topic:         'fractions',
  };
}

function fracD2() {
  // Add fractions with like or unlike denominators
  if (Math.random() < 0.5) {
    // Like denominators
    const d  = rand(3, 8);
    const n1 = rand(1, d - 2);
    const n2 = rand(1, d - n1 - 1);
    const sumStr = frac(n1 + n2, d);
    return { text: `${n1}/${d} + ${n2}/${d} = ?`, answer: sumStr, answerDisplay: sumStr, topic: 'fractions' };
  } else {
    // Unlike denominators (halves, thirds, sixths, fourths)
    const pairs = [[1,2,1,3],[1,2,1,4],[1,3,1,6],[1,4,1,8],[1,3,2,3],[1,4,3,4]];
    const [n1, d1, n2, d2] = pairs[rand(0, pairs.length - 1)];
    const lcd = (d1 * d2) / gcd(d1, d2);
    const sumStr = frac(n1 * (lcd / d1) + n2 * (lcd / d2), lcd);
    return { text: `${n1}/${d1} + ${n2}/${d2} = ?`, answer: sumStr, answerDisplay: sumStr, topic: 'fractions' };
  }
}

function fracD3() {
  const type = rand(1, 3);
  if (type === 1) {
    // Fraction × whole number
    const d = rand(2, 6);
    const n = rand(1, d - 1);
    const w = rand(2, 8);
    const product = frac(n * w, d);
    return { text: `${n}/${d} × ${w} = ?`, answer: product, answerDisplay: product, topic: 'fractions' };
  }
  if (type === 2) {
    // Fraction to decimal
    const opts = [
      { frac: '1/2',  dec: '0.5' },  { frac: '1/4',  dec: '0.25' },
      { frac: '3/4',  dec: '0.75' }, { frac: '1/5',  dec: '0.2' },
      { frac: '2/5',  dec: '0.4' },  { frac: '3/5',  dec: '0.6' },
      { frac: '4/5',  dec: '0.8' },  { frac: '1/10', dec: '0.1' },
    ];
    const o = opts[rand(0, opts.length - 1)];
    return { text: `${o.frac} as a decimal = ?`, answer: o.dec, answerDisplay: o.dec, topic: 'fractions' };
  }
  // Subtract fractions with like denominators
  const d  = rand(4, 10);
  const n1 = rand(3, d - 1);
  const n2 = rand(1, n1 - 1);
  const diffStr = frac(n1 - n2, d);
  return { text: `${n1}/${d} − ${n2}/${d} = ?`, answer: diffStr, answerDisplay: diffStr, topic: 'fractions' };
}

// ── Mixed / Challenge (Grades 6–7) ───────────────────────────────────────────

function mixedD1() {
  // Basic percentages
  const pcts  = [10, 20, 25, 50];
  const pct   = pcts[rand(0, pcts.length - 1)];
  const whole = rand(2, 20) * (pct <= 20 ? 5 : 4);
  const ans   = (pct / 100) * whole;
  return { text: `${pct}% of ${whole} = ?`, answer: ans, answerDisplay: String(ans), topic: 'mixed' };
}

function mixedD2() {
  // Order of operations (no exponents)
  const a   = rand(2, 8);
  const b   = rand(2, 6);
  const c   = rand(2, 6);
  const ans = a + b * c;
  return { text: `${a} + ${b} × ${c} = ?`, answer: ans, answerDisplay: String(ans), topic: 'mixed' };
}

function mixedD3() {
  const type = rand(1, 3);
  if (type === 1) {
    // Ratio / proportion
    const a = rand(2, 8);
    const b = rand(2, 8);
    const k = rand(2, 5);
    return { text: `If ${a}:${b} = ?:${b * k}, what is ?`, answer: a * k, answerDisplay: String(a * k), topic: 'mixed' };
  }
  if (type === 2) {
    // Harder percentages
    const pct   = [10, 15, 20, 25, 30, 40, 50, 75][rand(0, 7)];
    const whole = rand(2, 20) * 4;
    const ans   = (pct / 100) * whole;
    return { text: `${pct}% of ${whole} = ?`, answer: ans, answerDisplay: String(ans), topic: 'mixed' };
  }
  // Order of operations with subtraction
  const a   = rand(3, 12);
  const b   = rand(2, 8);
  const c   = rand(2, 6);
  const ans = a - b + c * 2;
  return { text: `${a} − ${b} + ${c} × 2 = ?`, answer: ans, answerDisplay: String(ans), topic: 'mixed' };
}

// ── Public API ────────────────────────────────────────────────────────────────

const generators = {
  addSub:         [addSubD1, addSubD2, addSubD3],
  multiplication: [multD1,   multD2,   multD3],
  division:       [divD1,    divD2,    divD3],
  fractions:      [fracD1,   fracD2,   fracD3],
  mixed:          [mixedD1,  mixedD2,  mixedD3],
};

/**
 * Generate a single question.
 * @param {string} topic      One of: addSub | multiplication | division | fractions | mixed
 * @param {number} difficulty 1 (easy) | 2 (medium) | 3 (hard)
 * @returns {object} Question object
 */
export function generateQuestion(topic, difficulty = 1) {
  const gen = generators[topic] ?? generators.addSub;
  const d   = Math.min(Math.max(difficulty, 1), 3) - 1;
  return gen[d]();
}

export default { generateQuestion };
