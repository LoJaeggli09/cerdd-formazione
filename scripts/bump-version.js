const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const packageJsonPath = path.join(root, 'package.json');
const appVersionPath = path.join(root, 'src', 'appVersion.js');
const readmePath = path.join(root, 'README.md');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const parseVersion = (version) => {
  const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Versione non valida: ${version}`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
};

const formatVersion = ({ major, minor, patch }) => `${major}.${minor}.${patch}`;

const nextVersion = (version) => {
  const v = parseVersion(version);
  v.patch += 1;

  if (v.patch >= 100) {
    v.minor += 1;
    v.patch = 0;
  }

  return formatVersion(v);
};

const currentVersion = packageJson.version;
const newVersion = nextVersion(currentVersion);

packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');

const appVersionContent = `const APP_VERSION = '${newVersion}';\n\nexport default APP_VERSION;\n`;
fs.writeFileSync(appVersionPath, appVersionContent, 'utf8');

let readme = fs.readFileSync(readmePath, 'utf8');
readme = readme.replace(/Ultime Migliorie \(v\d+\.\d+\.\d+\)/, `Ultime Migliorie (v${newVersion})`);
fs.writeFileSync(readmePath, readme, 'utf8');

console.log(`Versione aggiornata: ${currentVersion} -> ${newVersion}`);