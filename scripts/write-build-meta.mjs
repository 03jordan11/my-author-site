import fs from 'node:fs/promises';
import path from 'node:path';

const outputPath = path.resolve('src/data/build-meta.json');

const runNumber = process.env.GITHUB_RUN_NUMBER;
const sha = process.env.GITHUB_SHA?.slice(0, 7);
const version = runNumber
  ? `v${runNumber}${sha ? ` (${sha})` : ''}`
  : `local-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 12)}`;

const payload = {
  version,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`Wrote build metadata: ${version}`);
