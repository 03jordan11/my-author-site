import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const outputPath = path.resolve('src/data/build-meta.json');

function getLocalDateParts() {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const parts = formatter.formatToParts(new Date());
  const lookup = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)])
  );

  return {
    year: lookup.year,
    month: lookup.month,
    day: lookup.day,
  };
}

function getDailyBuildNumber({ year, month, day }) {
  const since = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 00:00:00`;

  try {
    const count = execFileSync(
      'git',
      ['rev-list', '--count', `--since=${since}`, 'HEAD'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();

    const parsedCount = Number.parseInt(count, 10);
    return Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 1;
  } catch {
    return 1;
  }
}

const dateParts = getLocalDateParts();
const dailyBuildNumber = getDailyBuildNumber(dateParts);
const version = `1.${dailyBuildNumber}.${dateParts.month}.${dateParts.day}`;

const payload = {
  version,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`Wrote build metadata: ${version}`);
