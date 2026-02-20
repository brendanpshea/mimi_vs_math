/**
 * Distractors — generates plausible wrong answers for a question.
 *
 * Numeric answers: uses off-by-one errors, common-mistake values, nearby numbers.
 * Fraction/string answers: uses a curated pool of nearby fractions/decimals.
 */

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Numeric distractors ───────────────────────────────────────────────────────

function numericDistractors(correct) {
  const seen = new Set([String(correct)]);
  const candidates = [];

  const offsets = shuffle([1, -1, 2, -2, 5, -5, 10, -10, 3, -3]);
  for (const offset of offsets) {
    const v = correct + offset;
    const s = String(v);
    if (v > 0 && !seen.has(s)) {
      seen.add(s);
      candidates.push(s);
    }
  }

  // Common multiplication/division mistakes: multiply by wrong factor
  if (correct > 10) {
    const nearby = [
      Math.round(correct * 1.1),
      Math.round(correct * 0.9),
      correct - (correct % 10),   // round down to nearest 10
      correct + (10 - (correct % 10)), // round up to nearest 10
    ];
    for (const v of nearby) {
      const s = String(v);
      if (v > 0 && !seen.has(s)) {
        seen.add(s);
        candidates.push(s);
      }
    }
  }

  // Fill remaining slots with sequential values if needed
  let fill = 4;
  while (candidates.length < 3) {
    const v = correct + fill;
    const s = String(v);
    if (v > 0 && !seen.has(s)) {
      seen.add(s);
      candidates.push(s);
    }
    fill++;
  }

  return candidates.slice(0, 3);
}

// ── Fraction / string distractors ────────────────────────────────────────────

const FRACTION_POOL = [
  '1/2', '1/3', '2/3', '1/4', '3/4', '1/6', '5/6',
  '1/5', '2/5', '3/5', '4/5', '3/8', '5/8', '7/8',
  '1',   '2',   '3',   '0',   '1/8', '1/10',
];

const DECIMAL_POOL = ['0.1', '0.2', '0.25', '0.3', '0.4', '0.5', '0.6', '0.75', '0.8', '0.9', '1.0'];

function fractionDistractors(correct) {
  const pool = correct.includes('.') ? DECIMAL_POOL : FRACTION_POOL;
  return shuffle(pool.filter(v => v !== correct)).slice(0, 3);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate 3 wrong-answer strings for the given question.
 * @param {object} question – from QuestionBank.generateQuestion()
 * @returns {string[]} Three distractor strings
 */
export function generateDistractors(question) {
  const { answer } = question;
  if (typeof answer === 'number') {
    return numericDistractors(answer);
  }
  return fractionDistractors(String(answer));
}

/**
 * Return all 4 answer choices (1 correct + 3 wrong) in random order.
 * Each element: { text: string, correct: boolean }
 * @param {object} question
 * @returns {Array<{text: string, correct: boolean}>}
 */
export function getChoices(question) {
  const distractors = generateDistractors(question);
  const choices = [
    { text: String(question.answerDisplay ?? question.answer), correct: true },
    ...distractors.map(d => ({ text: d, correct: false })),
  ];
  return shuffle(choices);
}

export default { generateDistractors, getChoices };
