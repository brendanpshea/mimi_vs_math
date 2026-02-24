/**
 * test_questions.mjs
 * Automated validator for all QuestionBank topics and the enemy→topic mapping.
 *
 * Run with:  node test_questions.mjs
 *
 * What is checked
 * ───────────────
 * 1. Shape contract — every (topic × difficulty) combination, 100 samples each:
 *      • Returns { text, answer, answerDisplay, topic }
 *      • text is a non-empty string
 *      • answer is a finite number OR a non-empty string
 *      • answerDisplay is a non-empty string that matches answer
 *      • topic matches the key requested
 *
 * 2. Range / sanity contract — topic-specific bounds checked over 200 samples:
 *      • Numeric answers stay within expected bounds
 *      • No division-by-zero, no NaN, no Infinity
 *      • Fraction / decimal strings are parseable
 *
 *  3. Distractor contract — 50 samples per (topic × difficulty):
 *      • getChoices() returns exactly 4 choices
 *      • Exactly 1 is marked correct
 *      • No two choices share the same .text
 *      • The correct choice's text equals question.answerDisplay
 *
 * 4. Enemy→topic coverage:
 *      • Every enemy's mathTopic key resolves in QuestionBank
 *      • Every boss's mathTopics[] entries all resolve in QuestionBank
 *      • Bosses' mathTopics arrays contain every non-boss enemy topic in their region
 *
 * 5. Sample display — prints 2 random questions per topic for human spot-check
 */

import { generateQuestion, TOPICS as ALL_TOPICS } from './src/math/QuestionBank.js';
import { getChoices }           from './src/math/Distractors.js';
import ENEMIES_DEFAULT          from './src/data/enemies.js';

const ENEMIES = ENEMIES_DEFAULT;

// ── Colour helpers (ANSI) ─────────────────────────────────────────────────
const G  = s => `\x1b[32m${s}\x1b[0m`;   // green
const R  = s => `\x1b[31m${s}\x1b[0m`;   // red
const Y  = s => `\x1b[33m${s}\x1b[0m`;   // yellow
const DIM = s => `\x1b[2m${s}\x1b[0m`;
const B  = s => `\x1b[1m${s}\x1b[0m`;    // bold

// ALL_TOPICS is now imported directly from QuestionBank.js — no manual list to maintain.

// Topic-specific numeric bounds [ minAnswer, maxAnswer ] — null = string type
const TOPIC_BOUNDS = {
  addSub:         [0,  200],
  addition:       [0,  99],
  subtraction:    [0,  99],
  comparison:     [0,  100],
  multiplication: [0,  300],
  multTables:     [0,  100],
  division:       [0,  144],
  divisionWord:   [0,  72],
  missingNumber:  [0,  108],
  orderOfOps:     [0,  500],
  percentages:    [0,  1000],
  ratiosProp:     [0,  200],
  placeValue:     [0,  90],
  addCarry:       [0,  99],
  subBorrow:      [0,  99],
  skipCounting:   [0,  1000],
  doubling:       [0,  100],
  fractions:      null,        // string
  fractionCompare:null,        // string
  fractionAdd:    null,        // string
  decimals:       null,        // string
};

// ── Harness ───────────────────────────────────────────────────────────────
let totalPassed = 0, totalFailed = 0;
const failDetails = [];

function record(pass, label, detail = '') {
  if (pass) {
    totalPassed++;
  } else {
    totalFailed++;
    failDetails.push(`   ${R('FAIL')} ${label}${detail ? `\n        ${DIM(detail)}` : ''}`);
  }
  return pass;
}

// Small assert that does not throw — records the failure and returns false
function check(condition, label, detail = '') {
  return record(condition, label, detail);
}

// ── Section 1: Shape contract ─────────────────────────────────────────────
console.log(`\n${B('═══ 1. Shape Contract')} ${DIM('(100 samples × 3 difficulties × all topics)')}`);

const SAMPLE_N = 100;

for (const topic of ALL_TOPICS) {
  let topicOk = true;
  for (const diff of [1, 2, 3]) {
    for (let i = 0; i < SAMPLE_N; i++) {
      let q;
      const label = `${topic} D${diff} sample ${i}`;
      try {
        q = generateQuestion(topic, diff);
      } catch (e) {
        record(false, label, `generateQuestion threw: ${e.message}`);
        topicOk = false;
        continue;
      }

      const hasText       = typeof q.text === 'string' && q.text.trim().length > 0;
      const hasAnswer     = (typeof q.answer === 'number' && isFinite(q.answer))
                            || (typeof q.answer === 'string' && q.answer.length > 0);
      const hasDispStr    = typeof q.answerDisplay === 'string' && q.answerDisplay.length > 0;
      const topicMatches  = q.topic === topic;
      const dispMatchAns  = q.answerDisplay === String(q.answer);

      if (!check(hasText,      `${label}: text is non-empty string`)) topicOk = false;
      if (!check(hasAnswer,    `${label}: answer is finite number or non-empty string`)) topicOk = false;
      if (!check(hasDispStr,   `${label}: answerDisplay is non-empty string`)) topicOk = false;
      if (!check(topicMatches, `${label}: q.topic === '${topic}'`, `got '${q.topic}'`)) topicOk = false;
      if (!check(dispMatchAns, `${label}: answerDisplay matches answer`, `answerDisplay='${q.answerDisplay}' answer='${q.answer}'`)) topicOk = false;
    }
  }
  if (topicOk) {
    totalPassed++;   // count topic as one "green" line
    console.log(`  ${G('✓')} ${topic.padEnd(18)} ${DIM(`(${3 * SAMPLE_N} samples)`)}`);
  } else {
    console.log(`  ${R('✗')} ${topic.padEnd(18)} ${R('— failures above')}`);
  }
}

// ── Section 2: Range / sanity contract ───────────────────────────────────
console.log(`\n${B('═══ 2. Range & Sanity Contract')} ${DIM('(200 samples per topic/difficulty)')}`);

const RANGE_N = 200;

for (const topic of ALL_TOPICS) {
  const bounds = TOPIC_BOUNDS[topic];
  let topicOk = true;
  for (const diff of [1, 2, 3]) {
    for (let i = 0; i < RANGE_N; i++) {
      let q;
      try { q = generateQuestion(topic, diff); } catch { continue; }

      if (bounds !== null) {
        // Numeric
        if (typeof q.answer === 'number') {
          const [lo, hi] = bounds;
          const inRange = q.answer >= lo && q.answer <= hi;
          if (!check(inRange, `${topic} D${diff}: answer in [${lo}, ${hi}]`, `got ${q.answer} — text: "${q.text}"`)) topicOk = false;
          if (!check(!isNaN(q.answer), `${topic} D${diff}: answer is not NaN`)) topicOk = false;
        }
      } else {
        // String — either "N/D" fraction or decimal — must be parseable as a positive number
        if (typeof q.answer === 'string') {
          let parsedOk = false;
          if (q.answer.includes('/')) {
            const [n, d] = q.answer.split('/').map(Number);
            parsedOk = !isNaN(n) && !isNaN(d) && d > 0 && n >= 0;
          } else {
            const v = parseFloat(q.answer);
            parsedOk = !isNaN(v);
          }
          if (!check(parsedOk, `${topic} D${diff}: string answer is parseable`, `got '${q.answer}'`)) topicOk = false;
        }
      }

      // Universal: answer must never be 0 for division/multTables
      if ((topic === 'division' || topic === 'multTables' || topic === 'divisionWord') && typeof q.answer === 'number') {
        if (!check(q.answer > 0, `${topic} D${diff}: quotient must be > 0`, `got ${q.answer}`)) topicOk = false;
      }
    }
  }
  const icon = topicOk ? G('✓') : R('✗');
  console.log(`  ${icon} ${topic}`);
}

// ── Section 3: Distractor contract ───────────────────────────────────────
console.log(`\n${B('═══ 3. Distractor / getChoices Contract')} ${DIM('(50 samples per topic/difficulty)')}`);

const DISTRACTOR_N = 50;

for (const topic of ALL_TOPICS) {
  let topicOk = true;
  for (const diff of [1, 2, 3]) {
    for (let i = 0; i < DISTRACTOR_N; i++) {
      let q, choices;
      try {
        q       = generateQuestion(topic, diff);
        choices = getChoices(q);
      } catch (e) {
        record(false, `${topic} D${diff}: getChoices threw`, e.message);
        topicOk = false;
        continue;
      }

      const has4      = choices.length === 4;
      const correct   = choices.filter(c => c.correct);
      const texts     = choices.map(c => c.text);
      const uniq      = new Set(texts).size === 4;
      const oneRight  = correct.length === 1;
      const rightText = correct.length > 0 && correct[0].text === q.answerDisplay;

      if (!check(has4,      `${topic} D${diff} distractor: 4 choices`, `got ${choices.length}`)) topicOk = false;
      if (!check(oneRight,  `${topic} D${diff} distractor: exactly 1 correct`, `got ${correct.length}`)) topicOk = false;
      if (!check(uniq,      `${topic} D${diff} distractor: no duplicate texts`, `${JSON.stringify(texts)}`)) topicOk = false;
      if (!check(rightText, `${topic} D${diff} distractor: correct choice text = answerDisplay`, `choice='${correct[0]?.text}' display='${q.answerDisplay}'`)) topicOk = false;
    }
  }
  const icon = topicOk ? G('✓') : R('✗');
  console.log(`  ${icon} ${topic}`);
}

// ── Section 4: Enemy → topic coverage ────────────────────────────────────
console.log(`\n${B('═══ 4. Enemy → Topic Coverage')}`);

const VALID_TOPICS = new Set(ALL_TOPICS);
const regionTopicMap = {};   // regionId → Set of non-boss topics

for (const [key, enemy] of Object.entries(ENEMIES)) {
  const topic  = enemy.mathTopic;
  const topics = enemy.mathTopics ?? [];

  // mathTopic must be valid
  check(
    VALID_TOPICS.has(topic),
    `${key}: mathTopic '${topic}' exists in QuestionBank`,
    `Unknown topic key`
  );
  console.log(`  ${VALID_TOPICS.has(topic) ? G('✓') : R('✗')} ${key.padEnd(30)} mathTopic = ${topic}`);

  // Build region map
  if (!enemy.isBoss) {
    if (!regionTopicMap[enemy.region]) regionTopicMap[enemy.region] = new Set();
    regionTopicMap[enemy.region].add(topic);
  }

  // Boss: every entry in mathTopics[] must be valid
  if (enemy.isBoss && topics.length > 0) {
    for (const t of topics) {
      const ok = VALID_TOPICS.has(t);
      check(ok, `  Boss ${key}: mathTopics entry '${t}' exists in QuestionBank`);
      console.log(`     ${ok ? G('✓') : R('✗')} mathTopics[] '${t}'`);
    }

    // Boss mathTopics must cover all non-boss enemy topics for this region
    const regionTopics = regionTopicMap[enemy.region] ?? new Set();
    for (const t of regionTopics) {
      const covered = topics.includes(t);
      check(covered, `  Boss ${key}: mathTopics covers enemy topic '${t}'`);
      if (!covered) {
        console.log(`     ${R('✗')} mathTopics missing enemy topic '${t}'`);
      }
    }
  }
}

// ── Section 5: Sample display ─────────────────────────────────────────────
console.log(`\n${B('═══ 5. Sample Questions')} ${DIM('(2 per topic, difficulty 1 & 2)')}`);

for (const topic of ALL_TOPICS) {
  console.log(`\n  ${Y(topic)}`);
  for (const diff of [1, 2]) {
    const q = generateQuestion(topic, diff);
    const choices = getChoices(q);
    const correct = choices.find(c => c.correct);
    const wrong   = choices.filter(c => !c.correct).map(c => c.text);
    console.log(`    D${diff}  ${DIM(q.text.replace(/\n/g, ' / '))}  →  ${G(String(q.answerDisplay))}   ${DIM(`(wrong: ${wrong.join(' | ')})`)}`);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
if (failDetails.length) {
  console.log(`\n${B('Failures')}`);
  for (const d of failDetails) console.log(d);
}

const total = totalPassed + totalFailed;
const emoji = totalFailed === 0 ? '🎉' : '💥';
console.log(`\n${emoji}  ${B(`${totalPassed} / ${total}`)} checks passed  ${totalFailed > 0 ? R(`(${totalFailed} failed)`) : G('— all clear')}\n`);
process.exit(totalFailed > 0 ? 1 : 0);
