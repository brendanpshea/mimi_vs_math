/**
 * Explanations.js
 *
 * getExplanation(question) → string
 *
 * Returns a 2–4 line kid-friendly "here's why" explanation shown after
 * a wrong answer or timeout in BattleScene.
 *
 * Tries to parse operands from the question text so the explanation
 * is specific to the actual numbers used.  Falls back to a generic
 * hint when parsing fails.
 */

// ── helpers ──────────────────────────────────────────────────────────────────

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

function simplify(n, d) {
  const g = gcd(Math.abs(n), Math.abs(d));
  const sn = n / g, sd = d / g;
  return sd === 1 ? String(sn) : `${sn}/${sd}`;
}

/** Tiny regex scanner: return all numbers that appear in a string. */
function allNums(s) {
  return [...s.matchAll(/([\d]+(?:\.[\d]+)?)/g)].map(m => parseFloat(m[1]));
}

// ── main export ───────────────────────────────────────────────────────────────

export function getExplanation(question) {
  const { topic, text, answer, answerDisplay } = question;
  const ans = answerDisplay !== undefined ? String(answerDisplay) : String(answer);

  switch (topic) {

    // ── Addition & Subtraction ──────────────────────────────────────────────
    case 'addSub':
    case 'addition': {
      const add = text.match(/^(\d+)\s*\+\s*(\d+)/);
      if (add) {
        const [, a, b] = add.map(Number);
        if (a <= 10 && b <= 10) {
          return `Start at ${a} and count up ${b} more.\n${a} + ${b} = ${ans}\nCheck: ${ans} − ${b} = ${a} ✓`;
        }
        // Bridging through the nearest ten for larger numbers
        const nextTen = Math.ceil(a / 10) * 10;
        const stepToTen = nextTen - a;
        const remaining = b - stepToTen;
        if (stepToTen > 0 && remaining > 0) {
          return `Bridge to the next ten:\n${a} + ${stepToTen} = ${nextTen},  then + ${remaining} more\n${nextTen} + ${remaining} = ${ans} ✓`;
        }
        return `${a} + ${b} = ${ans}\nCheck: ${ans} − ${b} = ${a} ✓`;
      }
      const sub = text.match(/^(\d+)\s*[−\-]\s*(\d+)/);
      if (sub) {
        const [, a, b] = sub.map(Number);
        return `Start at ${a} and take away ${b}.\n${a} − ${b} = ${ans}\nCheck: ${ans} + ${b} = ${a} ✓`;
      }
      break;
    }

    case 'subtraction': {
      const m = text.match(/^(\d+)\s*[−\-]\s*(\d+)/);
      if (m) {
        const [, a, b] = m.map(Number);
        return `Start at ${a} and take away ${b}.\n${a} − ${b} = ${ans}\nCheck: ${ans} + ${b} = ${a} ✓`;
      }
      break;
    }

    // ── Multiplication ──────────────────────────────────────────────────────
    case 'multiplication':
    case 'multTables': {
      const m = text.match(/^(\d+)\s*[×xX\*]\s*(\d+)/);
      if (m) {
        const [, a, b] = m.map(Number);
        if (a <= 6 && b <= 10) {
          // Show the repeated-addition model
          const groups = Array.from({ length: a }, () => b).join(' + ');
          return `${a} groups of ${b}:\n${groups} = ${ans} ✓`;
        }
        // Area model for bigger numbers
        const tens = Math.floor(a / 10) * 10;
        const ones = a % 10;
        if (tens > 0 && ones > 0) {
          return `Break ${a} apart:\n${tens} × ${b} = ${tens * b},  ${ones} × ${b} = ${ones * b}\n${tens * b} + ${ones * b} = ${ans} ✓`;
        }
        return `${a} × ${b} = ${ans}\nCheck: ${ans} ÷ ${b} = ${a} ✓`;
      }
      break;
    }

    // ── Division ────────────────────────────────────────────────────────────
    case 'division': {
      const m = text.match(/^(\d+)\s*÷\s*(\d+)/);
      if (m) {
        const [, a, b] = m.map(Number);
        return `${a} ÷ ${b} = ${ans}\nbecause ${b} × ${ans} = ${a} ✓\n(Division is the reverse of multiplication.)`;
      }
      break;
    }

    case 'divisionWord': {
      const nums = allNums(text);
      if (nums.length >= 2) {
        const [total, groups] = nums;
        return `Share ${total} equally among ${groups}.\n${total} ÷ ${groups} = ${ans} ✓\nCheck: ${groups} × ${ans} = ${total}`;
      }
      break;
    }

    // ── Skip Counting ────────────────────────────────────────────────────────
    case 'skipCounting': {
      const nums = allNums(text);
      if (nums.length >= 3) {
        const step = nums[1] - nums[0];
        // find the blank position (answer not in the list)
        return `The pattern goes up by ${step} each time.\nFind the missing step:\ncount by ${step}s until you reach ${ans} ✓`;
      }
      break;
    }

    // ── Comparison ───────────────────────────────────────────────────────────
    case 'comparison':
    case 'numberOrder': {
      // D1 — pick the largest from a set of 4
      if (text.includes('LARGEST')) {
        return `Look at all the numbers and find the biggest one.\n${ans} is larger than every other choice.\n💡 Tip: on a number line, bigger numbers are further to the right.`;
      }

      // D3 subtraction variant — "How many MORE does…" / "How many FEWER…"
      if (text.includes('MORE does') || text.includes('FEWER')) {
        const nums = [...text.matchAll(/(\d+)/g)].map(m => Number(m[0]));
        if (nums.length >= 2) {
          const hi = Math.max(...nums), lo = Math.min(...nums);
          return `"How many more/fewer?" means find the difference.\nSubtract the smaller from the larger:\n${hi} − ${lo} = ${ans} ✓`;
        }
      }

      // D3 — concrete word problems with a starting amount and a "more" amount
      if (text.includes('more') || text.includes('adds')) {
        const nums = [...text.matchAll(/(\d+)/g)].map(m => Number(m[0]));
        if (nums.length >= 2) {
          const [x, y] = nums.slice(0, 2);
          const [lo, hi] = x < y ? [x, y] : [y, x];
          return `The question describes adding ${lo} to ${hi}.\n${hi} + ${lo} = ${ans} ✓\n(When someone gets “more,” the total goes up.)`;
        }
      }

      // D2 — "How much bigger is A than B?"
      const d2 = text.match(/(\d+)\s+than\s+(\d+)/);
      if (d2) {
        const [, a, b] = d2.map(Number);
        return `"How much bigger?" means find the difference.\nCount up from ${b} to ${a}:\n${a} − ${b} = ${ans} ✓`;
      }
      break;
    }

    // ── Fractions (fracD1 pick-largest, fracD2 add, fracD3 mixed) ────────────
    case 'fractions': {
      if (text.includes('LARGEST')) {
        return `Divide each top number by its bottom to compare.\n${ans} gives the highest value.\n(Bigger value = larger fraction.)`;
      }
      // fraction × whole:  n/d × w
      const mulM = text.match(/(\d+)\/(\d+)\s*[×xX\*]\s*(\d+)/);
      if (mulM) {
        const [, n, d, w] = mulM.map(Number);
        return `Multiply the top by the whole number:\n${n} × ${w} = ${n * w},  keep the bottom /${d}\n${n * w}/${d} = ${ans} ✓`;
      }
      // fraction + fraction (like or unlike denom)
      const addM = text.match(/(\d+)\/(\d+)\s*\+\s*(\d+)\/(\d+)/);
      if (addM) {
        const [, n1, d1, n2, d2] = addM.map(Number);
        if (d1 === d2) {
          return `Same bottom number — just add the tops:\n${n1} + ${n2} = ${n1 + n2},  keep /${d1}\n= ${ans} ✓`;
        }
        const lcd = d1 * d2 / gcd(d1, d2);
        const nn1 = n1 * (lcd / d1), nn2 = n2 * (lcd / d2);
        return `Common denominator for ${d1} and ${d2} is ${lcd}.\n${n1}/${d1} = ${nn1}/${lcd},  ${n2}/${d2} = ${nn2}/${lcd}\n${nn1} + ${nn2} = ${simplify(nn1 + nn2, lcd)} ✓`;
      }
      // fraction − fraction
      const subM = text.match(/(\d+)\/(\d+)\s*[−\-]\s*(\d+)\/(\d+)/);
      if (subM) {
        const [, n1, d1, n2, d2] = subM.map(Number);
        if (d1 === d2) {
          return `Same bottom number — just subtract the tops:\n${n1} − ${n2} = ${n1 - n2},  keep /${d1}\n= ${ans} ✓`;
        }
        return `Find a common denominator for ${d1} and ${d2},\nthen subtract the tops.\n= ${ans} ✓`;
      }
      // fraction as decimal
      const decM = text.match(/(\d+)\/(\d+)\s+as a decimal/);
      if (decM) {
        const [, n, d] = decM.map(Number);
        return `Divide the top by the bottom:\n${n} ÷ ${d} = ${ans} ✓\n(top ÷ bottom always converts a fraction to a decimal)`;
      }
      break;
    }

    // ── Fraction comparison ─────────────────────────────────────────────────
    case 'fractionCompare': {
      if (text.includes('LARGEST')) {
        return `Divide top by bottom for each fraction to compare.\n${ans} gives the highest value.\n(Larger value = larger fraction.)`;
      }
      if (text.includes('SMALLEST')) {
        return `Divide top by bottom for each fraction to compare.\n${ans} gives the lowest value.\n(Smaller value = smaller fraction.)`;
      }
      // D3 word problem: "She uses n/d of them. How many is that?"
      if (text.includes('of them')) {
        const fracM = text.match(/(\d+)\/(\d+)/);
        const nums  = [...text.matchAll(/(\d+)/g)].map(m => Number(m[0]));
        const whole = nums[0]; // first number in text is the total count
        if (fracM && whole) {
          const [, n, d] = fracM.map(Number);
          return `Find ${n}/${d} of ${whole}:\nMultiply: ${whole} × ${n} = ${whole * n}\nDivide by ${d}: ${whole * n} ÷ ${d} = ${ans} ✓`;
        }
      }
      break;
    }

    // ── Fraction Addition ───────────────────────────────────────────────────
    case 'fractionAdd': {
      const m = text.match(/(\d+)\/(\d+)\s*\+\s*(\d+)\/(\d+)/);
      if (m) {
        const [, n1, d1, n2, d2] = m.map(Number);
        if (d1 === d2) {
          return `Same bottom number — just add the tops:\n${n1} + ${n2} = ${n1 + n2},  keep /${d1}\n= ${ans} ✓`;
        }
        const lcd = d1 * d2 / gcd(d1, d2);
        const nn1 = n1 * (lcd / d1), nn2 = n2 * (lcd / d2);
        return `Common denominator for ${d1} and ${d2} is ${lcd}.\n${n1}/${d1} = ${nn1}/${lcd},  ${n2}/${d2} = ${nn2}/${lcd}\n${nn1} + ${nn2} = ${simplify(nn1 + nn2, lcd)} ✓`;
      }
      break;
    }

    // ── Decimals ────────────────────────────────────────────────────────────
    case 'decimals': {
      const addM = text.match(/([\d.]+)\s*\+\s*([\d.]+)/);
      if (addM) {
        return `Line up the decimal points, then add:\n${addM[1]}\n+ ${addM[2]}\n= ${ans} ✓`;
      }
      const subM = text.match(/([\d.]+)\s*[−\-]\s*([\d.]+)/);
      if (subM) {
        return `Line up the decimal points, then subtract:\n${subM[1]}\n− ${subM[2]}\n= ${ans} ✓`;
      }
      const mulM = text.match(/([\d.]+)\s*[×xX\*]\s*(\d+)/);
      if (mulM) {
        return `Multiply as whole numbers, then place the decimal.\n${mulM[1]} × ${mulM[2]} = ${ans} ✓`;
      }
      break;
    }

    // ── Order of Operations ──────────────────────────────────────────────────
    case 'orderOfOps': {
      // a + b × c
      const m1 = text.match(/^(\d+)\s*\+\s*(\d+)\s*[×xX\*]\s*(\d+)/);
      if (m1) {
        const [, a, b, c] = m1.map(Number);
        return `Multiply BEFORE adding (BEDMAS rule):\nStep 1: ${b} × ${c} = ${b * c}\nStep 2: ${a} + ${b * c} = ${ans} ✓`;
      }
      // a × b + c × d
      const m2 = text.match(/^(\d+)\s*[×xX\*]\s*(\d+)\s*\+\s*(\d+)\s*[×xX\*]\s*(\d+)/);
      if (m2) {
        const [, a, b, c, d] = m2.map(Number);
        return `Do both multiplications first:\n${a}×${b} = ${a * b}   and   ${c}×${d} = ${c * d}\nThen add: ${a * b} + ${c * d} = ${ans} ✓`;
      }
      // a × b − c  (new D2 variant)
      const m5 = text.match(/^(\d+)\s*[×xX\*]\s*(\d+)\s*[−\-]\s*(\d+)/);
      if (m5) {
        const [, a, b, c] = m5.map(Number);
        return `Multiply BEFORE subtracting (BEDMAS rule):\nStep 1: ${a} × ${b} = ${a * b}\nStep 2: ${a * b} − ${c} = ${ans} ✓`;
      }
      // (a + b) × c
      const m3 = text.match(/\((\d+)\s*\+\s*(\d+)\)\s*[×xX\*]\s*(\d+)/);
      if (m3) {
        const [, a, b, c] = m3.map(Number);
        return `Brackets first:\nStep 1: (${a} + ${b}) = ${a + b}\nStep 2: ${a + b} × ${c} = ${ans} ✓`;
      }
      // (a − b) × c  (new D3 variant)
      const m4 = text.match(/\((\d+)\s*[−\-]\s*(\d+)\)\s*[×xX\*]\s*(\d+)/);
      if (m4) {
        const [, a, b, c] = m4.map(Number);
        return `Brackets first:\nStep 1: (${a} − ${b}) = ${a - b}\nStep 2: ${a - b} × ${c} = ${ans} ✓`;
      }
      break;
    }

    // ── Percentages ─────────────────────────────────────────────────────────
    case 'percentages': {
      const m = text.match(/(\d+)%\s+of\s+(\d+)/);
      if (m) {
        const [, pct, whole] = m.map(Number);
        if (pct === 50)  return `50% means half.\nHalf of ${whole} = ${whole} ÷ 2 = ${ans} ✓`;
        if (pct === 25)  return `25% means one quarter.\n${whole} ÷ 4 = ${ans} ✓`;
        if (pct === 10)  return `10% means divide by 10.\n${whole} ÷ 10 = ${ans} ✓`;
        if (pct === 100) return `100% of any number is the number itself.\n100% of ${whole} = ${ans} ✓`;
        if (pct === 20)  return `20% = 2 × 10%.\n10% of ${whole} = ${whole / 10},  × 2 = ${ans} ✓`;
        return `${pct}% means ${pct} per 100.\n${whole} × ${pct} ÷ 100 = ${ans} ✓`;
      }
      break;
    }

    // ── Ratios & Proportions ─────────────────────────────────────────────────
    case 'ratiosProp': {
      const m = text.match(/(\d+)\s*:\s*(\d+)\s*=\s*(\d+)\s*:\s*\?/);
      if (m) {
        const [, a, b, c] = m.map(Number);
        if (c % a === 0) {
          const k = c / a;
          return `Both sides must stay equal.\nMultiply both by ${k}:\n${a}×${k} = ${c},  ${b}×${k} = ${ans} ✓`;
        }
        return `Cross-multiply to solve:\n${a} × ? = ${b} × ${c} = ${b * c}\n? = ${b * c} ÷ ${a} = ${ans} ✓`;
      }
      break;
    }

    // ── Mixed (percentages, order of ops, ratios) ────────────────────────────
    case 'mixed': {
      if (text.includes('%')) {
        const m = text.match(/(\d+)%\s+of\s+(\d+)/);
        if (m) {
          const [, pct, whole] = m.map(Number);
          if (pct === 50)  return `50% means half.\nHalf of ${whole} = ${ans} ✓`;
          if (pct === 25)  return `25% = one quarter.\n${whole} ÷ 4 = ${ans} ✓`;
          if (pct === 10)  return `10% = divide by 10.\n${whole} ÷ 10 = ${ans} ✓`;
          return `${pct}% of ${whole}:\n${whole} × ${pct} ÷ 100 = ${ans} ✓`;
        }
      }
      const m1 = text.match(/^(\d+)\s*\+\s*(\d+)\s*[×xX\*]\s*(\d+)/);
      if (m1) {
        const [, a, b, c] = m1.map(Number);
        return `Multiply BEFORE adding (BEDMAS):\nStep 1: ${b} × ${c} = ${b * c}\nStep 2: ${a} + ${b * c} = ${ans} ✓`;
      }
      const m2 = text.match(/(\d+)\s*:\s*(\d+)\s*=\s*(\d+)\s*:\s*\?/);
      if (m2) {
        const [, a, b, c] = m2.map(Number);
        if (c % a === 0) {
          const k = c / a;
          return `Multiply both sides by ${k}:\n${a}×${k} = ${c},  ${b}×${k} = ${ans} ✓`;
        }
        return `Cross-multiply: ? = ${b} × ${c} ÷ ${a} = ${ans} ✓`;
      }
      break;
    }
  }

  // ── Generic fallback ─────────────────────────────────────────────────────
  return `The correct answer is ${ans}.\nTry working through it step by step.\nPractice makes perfect! 💪`;
}
