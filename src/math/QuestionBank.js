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
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
  // Grade 3 — 2-digit arithmetic capped at ~60; no 88−24 territory
  if (Math.random() < 0.5) {
    const a = rand(11, 45);
    const b = rand(5, Math.min(25, 99 - a));
    return { text: `${a} + ${b} = ?`, answer: a + b, answerDisplay: String(a + b), topic: 'addSub' };
  } else {
    const a = rand(15, 59);
    const b = rand(3, Math.min(20, a - 1));
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
    // Multi-digit × single-digit — capped so mental maths stays Grade-3-feasible
    const a = rand(11, 19);
    const b = rand(2, 5);
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
  // 4 random fractions from the pool; player picks the largest.
  const fracs = shuffle([...SIMPLE_FRACS]).slice(0, 4);
  const best  = fracs.reduce((a, b) => a[0] / a[1] >= b[0] / b[1] ? a : b);
  const ans   = `${best[0]}/${best[1]}`;
  return {
    text:          'Which is the LARGEST fraction?',
    answer:        ans,
    answerDisplay: ans,
    choices:       fracs.map(([n, d]) => { const s = `${n}/${d}`; return { text: s, correct: s === ans }; }),
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
  // Order of operations with subtraction — keep answer positive
  const c   = rand(2, 6);
  const b   = rand(2, 6);
  const a   = rand(b + 2, 14); // a > b so a − b + c×2 is always positive
  const ans = a - b + c * 2;
  return { text: `${a} − ${b} + ${c} × 2 = ?`, answer: ans, answerDisplay: String(ans), topic: 'mixed' };
}

// ── Addition only (Region 0 enemy 1) ─────────────────────────────────────────

function additionD1() {
  const a = rand(1, 8); const b = rand(1, 9 - a);
  return { text: `${a} + ${b} = ?`, answer: a + b, answerDisplay: String(a + b), topic: 'addition' };
}
function additionD2() {
  const a = rand(5, 15); const b = rand(1, 20 - a);
  return { text: `${a} + ${b} = ?`, answer: a + b, answerDisplay: String(a + b), topic: 'addition' };
}
function additionD3() {
  // Grade 3 cap: sums stay under ~65
  const a = rand(11, 39); const b = rand(5, Math.min(25, 99 - a));
  return { text: `${a} + ${b} = ?`, answer: a + b, answerDisplay: String(a + b), topic: 'addition' };
}

// ── Subtraction only (Region 0 enemy 2) ──────────────────────────────────────

function subtractionD1() {
  const a = rand(3, 10); const b = rand(1, a - 1);
  return { text: `${a} − ${b} = ?`, answer: a - b, answerDisplay: String(a - b), topic: 'subtraction' };
}
function subtractionD2() {
  const a = rand(10, 20); const b = rand(1, a - 1);
  return { text: `${a} − ${b} = ?`, answer: a - b, answerDisplay: String(a - b), topic: 'subtraction' };
}
function subtractionD3() {
  // Grade 3 cap: minuend ≤59, subtrahend ≤20
  const a = rand(15, 59); const b = rand(3, Math.min(20, a - 1));
  return { text: `${a} − ${b} = ?`, answer: a - b, answerDisplay: String(a - b), topic: 'subtraction' };
}

// ── Number comparison (Region 0 — NEW additional type) ───────────────────────

function comparisonD1() {
  // 4 distinct numbers; player picks the largest.
  const seen = new Set();
  while (seen.size < 4) seen.add(rand(1, 20));
  const nums    = [...seen];
  const largest = Math.max(...nums);
  return {
    text:          'Which is the LARGEST number?',
    answer:        largest,
    answerDisplay: String(largest),
    choices:       nums.map(n => ({ text: String(n), correct: n === largest })),
    topic:         'comparison',
  };
}
function comparisonD2() {
  const b = rand(5, 20); const diff = rand(2, 10); const a = b + diff;
  return { text: `How much bigger is ${a} than ${b}?`, answer: diff, answerDisplay: String(diff), topic: 'comparison' };
}
function comparisonD3() {
  const b = rand(10, 40); const diff = rand(3, 20); const a = b + diff;
  return { text: `A is ${diff} more than B.\nB = ${b}. What is A?`, answer: a, answerDisplay: String(a), topic: 'comparison' };
}

// ── Times-table focus (Region 1 enemy 1) ─────────────────────────────────────

function multTablesD1() {
  const tables = [2, 5, 10]; const a = tables[rand(0, 2)]; const b = rand(1, 10);
  return { text: `${a} × ${b} = ?`, answer: a * b, answerDisplay: String(a * b), topic: 'multTables' };
}
function multTablesD2() {
  const tables = [3, 4, 6]; const a = tables[rand(0, 2)]; const b = rand(1, 10);
  return { text: `${a} × ${b} = ?`, answer: a * b, answerDisplay: String(a * b), topic: 'multTables' };
}
function multTablesD3() {
  const tables = [7, 8, 9]; const a = tables[rand(0, 2)]; const b = rand(2, 10);
  return { text: `${a} × ${b} = ?`, answer: a * b, answerDisplay: String(a * b), topic: 'multTables' };
}

// ── Skip counting / sequences (Region 1 — NEW additional type) ───────────────

function skipCountingD1() {
  const step = rand(2, 5); const start = rand(1, 4) * step;
  const pos   = rand(1, 3);
  const seq   = Array.from({ length: 5 }, (_, i) => start + i * step);
  const ans   = seq[pos];
  const disp  = seq.map((v, i) => (i === pos ? '?' : v)).join(', ');
  return { text: `Fill the blank:\n${disp}`, answer: ans, answerDisplay: String(ans), topic: 'skipCounting' };
}
function skipCountingD2() {
  const step = rand(5, 10); const start = rand(1, 4) * step;
  const pos   = rand(1, 3);
  const seq   = Array.from({ length: 5 }, (_, i) => start + i * step);
  const ans   = seq[pos];
  const disp  = seq.map((v, i) => (i === pos ? '?' : v)).join(', ');
  return { text: `Fill the blank:\n${disp}`, answer: ans, answerDisplay: String(ans), topic: 'skipCounting' };
}
function skipCountingD3() {
  // Count down
  const step = rand(3, 9); const start = 60 + rand(0, 4) * step;
  const pos   = rand(1, 3);
  const seq   = Array.from({ length: 5 }, (_, i) => start - i * step);
  const ans   = seq[pos];
  const disp  = seq.map((v, i) => (i === pos ? '?' : v)).join(', ');
  return { text: `Fill the blank (going down):\n${disp}`, answer: ans, answerDisplay: String(ans), topic: 'skipCounting' };
}

// ── Division word problems (Region 2 — NEW additional type) ──────────────────

const WORD_ITEMS = ['apples', 'cookies', 'stickers', 'coins', 'pencils', 'candies'];
const WORD_WHO   = ['children', 'friends', 'students', 'groups', 'boxes'];

function divisionWordD1() {
  const d = rand(2, 4); const q = rand(2, 5);
  const item = WORD_ITEMS[rand(0, WORD_ITEMS.length - 1)];
  const who  = WORD_WHO[rand(0, WORD_WHO.length - 1)];
  return { text: `${d * q} ${item} shared\namong ${d} ${who}.\nHow many each?`, answer: q, answerDisplay: String(q), topic: 'divisionWord' };
}
function divisionWordD2() {
  const d = rand(3, 7); const q = rand(3, 8);
  const item = WORD_ITEMS[rand(0, WORD_ITEMS.length - 1)];
  const who  = WORD_WHO[rand(0, WORD_WHO.length - 1)];
  return { text: `${d * q} ${item} shared\namong ${d} ${who}.\nHow many each?`, answer: q, answerDisplay: String(q), topic: 'divisionWord' };
}
function divisionWordD3() {
  const d = rand(3, 8); const q = rand(4, 9); const r = rand(1, d - 1);
  const item = WORD_ITEMS[rand(0, WORD_ITEMS.length - 1)];
  const who  = WORD_WHO[rand(0, WORD_WHO.length - 1)];
  return { text: `${d * q + r} ${item} shared\namong ${d} ${who}.\nHow many each? (Ignore leftover)`, answer: q, answerDisplay: String(q), topic: 'divisionWord' };
}

// ── Fraction comparison only (Region 3 enemy 1) ───────────────────────────────

function fractionCompareD1() {
  // Small friendly pool; player picks the largest of 4.
  const pool  = [[1,2],[1,4],[3,4],[1,3],[2,3],[1,6],[5,6],[3,8],[5,8]];
  const fracs = shuffle([...pool]).slice(0, 4);
  const best  = fracs.reduce((a, b) => a[0] / a[1] >= b[0] / b[1] ? a : b);
  const ans   = `${best[0]}/${best[1]}`;
  return {
    text:          'Which is the LARGEST fraction?',
    answer:        ans,
    answerDisplay: ans,
    choices:       fracs.map(([n, d]) => { const s = `${n}/${d}`; return { text: s, correct: s === ans }; }),
    topic:         'fractionCompare',
  };
}
function fractionCompareD2() {
  // Full SIMPLE_FRACS pool; player picks the largest of 4.
  const fracs = shuffle([...SIMPLE_FRACS]).slice(0, 4);
  const best  = fracs.reduce((a, b) => a[0] / a[1] >= b[0] / b[1] ? a : b);
  const ans   = `${best[0]}/${best[1]}`;
  return {
    text:          'Which is the LARGEST fraction?',
    answer:        ans,
    answerDisplay: ans,
    choices:       fracs.map(([n, d]) => { const s = `${n}/${d}`; return { text: s, correct: s === ans }; }),
    topic:         'fractionCompare',
  };
}
function fractionCompareD3() {
  // Full SIMPLE_FRACS pool; player picks the SMALLEST of 4.
  const fracs = shuffle([...SIMPLE_FRACS]).slice(0, 4);
  const best  = fracs.reduce((a, b) => a[0] / a[1] <= b[0] / b[1] ? a : b);
  const ans   = `${best[0]}/${best[1]}`;
  return {
    text:          'Which is the SMALLEST fraction?',
    answer:        ans,
    answerDisplay: ans,
    choices:       fracs.map(([n, d]) => { const s = `${n}/${d}`; return { text: s, correct: s === ans }; }),
    topic:         'fractionCompare',
  };
}

// ── Fraction addition only (Region 3 enemy 2) ────────────────────────────────

function fractionAddD1() {
  const d = rand(3, 6); const n1 = rand(1, d-2); const n2 = rand(1, d-n1-1);
  const s = frac(n1+n2, d);
  return { text: `${n1}/${d} + ${n2}/${d} = ?`, answer: s, answerDisplay: s, topic: 'fractionAdd' };
}
function fractionAddD2() {
  const pairs = [[1,2,1,4],[1,2,1,6],[1,3,1,6],[1,4,1,8],[1,3,2,3],[1,4,3,4]];
  const [n1,d1,n2,d2] = pairs[rand(0, pairs.length-1)];
  const lcd = (d1*d2) / gcd(d1,d2);
  const s   = frac(n1*(lcd/d1) + n2*(lcd/d2), lcd);
  return { text: `${n1}/${d1} + ${n2}/${d2} = ?`, answer: s, answerDisplay: s, topic: 'fractionAdd' };
}
function fractionAddD3() {
  // Fraction subtract with like denominators
  const d  = rand(4, 8); const n1 = rand(3, d-1); const n2 = rand(1, n1-1);
  const s  = frac(n1-n2, d);
  return { text: `${n1}/${d} − ${n2}/${d} = ?`, answer: s, answerDisplay: s, topic: 'fractionAdd' };
}

// ── Decimals standalone (Region 3 — NEW additional type) ─────────────────────

const DECIMAL_SUMS_D1 = [
  ['0.2','0.3','0.5'], ['0.4','0.3','0.7'], ['0.5','0.4','0.9'],
  ['0.1','0.6','0.7'], ['0.3','0.3','0.6'], ['0.2','0.6','0.8'],
  ['0.1','0.8','0.9'], ['0.4','0.4','0.8'], ['0.3','0.5','0.8'],
];

function decimalsD1() {
  const row = DECIMAL_SUMS_D1[rand(0, DECIMAL_SUMS_D1.length-1)];
  return { text: `${row[0]} + ${row[1]} = ?`, answer: row[2], answerDisplay: row[2], topic: 'decimals' };
}
function decimalsD2() {
  if (Math.random() < 0.5) {
    // Add one-decimal numbers
    const a = rand(1,5); const af = rand(1,8); const b = rand(1,3); const bf = rand(0,8);
    const sum = Math.round((a + af/10 + b + bf/10) * 10) / 10;
    return { text: `${a}.${af} + ${b}.${bf} = ?`, answer: String(sum), answerDisplay: String(sum), topic: 'decimals' };
  } else {
    // Subtract one-decimal numbers
    const b = rand(1,4); const bf = rand(0,8); const a = b + rand(1,4); const af = rand(0,9);
    const diff = Math.round((a + af/10 - b - bf/10) * 10) / 10;
    return { text: `${a}.${af} − ${b}.${bf} = ?`, answer: String(diff), answerDisplay: String(diff), topic: 'decimals' };
  }
}
function decimalsD3() {
  const dec = rand(1,9); const whole = rand(2,6);
  const ans = Math.round(dec * whole) / 10;
  return { text: `0.${dec} × ${whole} = ?`, answer: String(ans), answerDisplay: String(ans), topic: 'decimals' };
}

// ── Order of operations (Region 4 enemy 1) ───────────────────────────────────

function orderOfOpsD1() {
  const a = rand(2,6); const b = rand(2,4); const c = rand(2,4);
  return { text: `${a} + ${b} × ${c} = ?`, answer: a + b*c, answerDisplay: String(a + b*c), topic: 'orderOfOps' };
}
function orderOfOpsD2() {
  const a = rand(2,5); const b = rand(2,5); const c = rand(2,5); const d2 = rand(2,5);
  return { text: `${a} × ${b} + ${c} × ${d2} = ?`, answer: a*b + c*d2, answerDisplay: String(a*b + c*d2), topic: 'orderOfOps' };
}
function orderOfOpsD3() {
  const a = rand(2,7); const b = rand(2,7); const c = rand(2,5);
  return { text: `(${a} + ${b}) × ${c} = ?`, answer: (a+b)*c, answerDisplay: String((a+b)*c), topic: 'orderOfOps' };
}

// ── Percentages standalone (Region 4 enemy 2) ────────────────────────────────

function percentagesD1() {
  const pct = [10, 25, 50][rand(0, 2)];
  const mult = { 10: 10, 25: 4, 50: 2 }[pct];
  const whole = rand(1, 8) * mult;
  const ans = (pct / 100) * whole;
  return { text: `${pct}% of ${whole} = ?`, answer: ans, answerDisplay: String(ans), topic: 'percentages' };
}
function percentagesD2() {
  const pct = [10, 20, 25, 50][rand(0, 3)];
  const mult = { 10: 10, 20: 5, 25: 4, 50: 2 }[pct];
  const whole = rand(2, 10) * mult;
  const ans = (pct / 100) * whole;
  return { text: `${pct}% of ${whole} = ?`, answer: ans, answerDisplay: String(ans), topic: 'percentages' };
}
function percentagesD3() {
  const pct  = [10, 20, 25, 50, 75][rand(0, 4)];
  const mult = { 10: 10, 20: 5, 25: 4, 50: 2, 75: 4 }[pct];
  const whole = rand(2, 8) * mult;
  const part  = (pct / 100) * whole;
  return { text: `${part} out of ${whole}\nis what percent?`, answer: pct, answerDisplay: String(pct), topic: 'percentages' };
}

// ── Ratios & proportions (Region 4 — NEW additional type) ────────────────────

function ratiosPropD1() {
  const a = rand(2, 5); const k = rand(2, 5);
  return { text: `1 : ${a} = ${k} : ?`, answer: a*k, answerDisplay: String(a*k), topic: 'ratiosProp' };
}
function ratiosPropD2() {
  const p = rand(2, 5); const q = rand(2, 5); const k = rand(2, 4);
  return { text: `${p} : ${q} = ${p*k} : ?`, answer: q*k, answerDisplay: String(q*k), topic: 'ratiosProp' };
}
function ratiosPropD3() {
  const p = rand(2, 5); const q = rand(2, 6); const k = rand(2, 4);
  return { text: `For every ${p} red, ${q} blue.\nIf there are ${p*k} red,\nhow many blue?`, answer: q*k, answerDisplay: String(q*k), topic: 'ratiosProp' };
}

// ── Public API ────────────────────────────────────────────────────────────────

const generators = {
  // Original compound topics (used by bosses / legacy)
  addSub:         [addSubD1,         addSubD2,         addSubD3],
  multiplication: [multD1,           multD2,           multD3],
  division:       [divD1,            divD2,            divD3],
  fractions:      [fracD1,           fracD2,           fracD3],
  mixed:          [mixedD1,          mixedD2,          mixedD3],
  // Region 0 — Sunny Village
  addition:       [additionD1,       additionD2,       additionD3],
  subtraction:    [subtractionD1,    subtractionD2,    subtractionD3],
  comparison:     [comparisonD1,     comparisonD2,     comparisonD3],
  // Region 1 — Meadow Maze
  multTables:     [multTablesD1,     multTablesD2,     multTablesD3],
  skipCounting:   [skipCountingD1,   skipCountingD2,   skipCountingD3],
  // Region 2 — Desert Dunes
  divisionWord:   [divisionWordD1,   divisionWordD2,   divisionWordD3],
  // Region 3 — Frostbite Cavern
  fractionCompare:[fractionCompareD1,fractionCompareD2,fractionCompareD3],
  fractionAdd:    [fractionAddD1,    fractionAddD2,    fractionAddD3],
  decimals:       [decimalsD1,       decimalsD2,       decimalsD3],
  // Region 4 — Shadow Castle
  orderOfOps:     [orderOfOpsD1,     orderOfOpsD2,     orderOfOpsD3],
  percentages:    [percentagesD1,    percentagesD2,    percentagesD3],
  ratiosProp:     [ratiosPropD1,     ratiosPropD2,     ratiosPropD3],
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
