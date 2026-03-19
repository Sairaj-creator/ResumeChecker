import type { ParsedFeedback } from '../types';

export function parseFeedback(raw: string): ParsedFeedback {
  const payload = raw || '';
  const parts = payload.split(/\[ADVICE\]|ADVICE:/i);

  let roast = 'Feedback generated.';
  let advice: string[] = [];

  if (parts.length > 1) {
    roast = parts[0].replace(/\[ROAST\]|ROAST:/i, '').trim() || roast;
    advice = parts[1]
      .split(/\n|>|-|\*|\d+\./g)
      .map((item) => item.trim())
      .filter((item) => item.length > 8)
      .slice(0, 6);
  } else {
    const lines = payload.split('\n').map((line) => line.trim()).filter(Boolean);
    roast = lines[0] || roast;
    advice = lines.slice(1, 6);
  }

  if (advice.length === 0) {
    advice = [
      'Quantify outcomes in each experience bullet.',
      'Align your skills with the target job description.',
      'Highlight ownership, architecture choices, and impact.',
    ];
  }

  return { roast, advice };
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}
