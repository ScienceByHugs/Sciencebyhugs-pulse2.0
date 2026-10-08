// Expo's PNG decoder does not reliably handle indexed/palette PNG app icons.
// macOS sips is available on EAS iOS builders and on developer Macs.
// Re-encode the existing artwork as truecolor PNG before Expo's native prebuild.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const icon = path.join(__dirname, '..', 'assets', 'icon.png');
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function pngColorType(file) {
  const data = fs.readFileSync(file);
  if (data.length < 26 || !data.subarray(0, 8).equals(pngSignature) || data.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error(`Not a valid PNG header: ${file}`);
  }
  return data[25];
}

const colorType = pngColorType(icon);
if (colorType === 2 || colorType === 6) {
  console.log(`Pulse icon already uses a compatible PNG color type (${colorType}).`);
  process.exit(0);
}

if (process.platform !== 'darwin') {
  throw new Error('Pulse icon conversion requires macOS sips; run on an EAS iOS builder or a Mac.');
}

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-icon-'));
try {
  const reencoded = path.join(temp, 'icon.png');
  execFileSync('sips', ['-s', 'format', 'png', '--out', reencoded, icon], { stdio: 'pipe' });
  let convertedType = pngColorType(reencoded);

  // Some sips versions preserve indexed color even when re-encoding PNG.
  // JPEG is truecolor and the original Pulse icon has an opaque background.
  if (convertedType !== 2 && convertedType !== 6) {
    const jpg = path.join(temp, 'icon.jpg');
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', 'best', '--out', jpg, icon], { stdio: 'pipe' });
    execFileSync('sips', ['-s', 'format', 'png', '--out', reencoded, jpg], { stdio: 'pipe' });
    convertedType = pngColorType(reencoded);
  }
  if (convertedType !== 2 && convertedType !== 6) {
    throw new Error(`Icon is still not truecolor PNG (color type ${convertedType})`);
  }
  fs.copyFileSync(reencoded, icon);
  console.log(`Pulse icon normalized: PNG color type ${colorType} → ${convertedType}.`);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
