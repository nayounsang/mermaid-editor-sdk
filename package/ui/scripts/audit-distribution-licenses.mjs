import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDirectory = path.join(projectRoot, 'dist');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed:\n${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function bundledPackageIdentity(source, sourceRoot) {
  const normalized = source.replaceAll('\\', '/');
  const parts = normalized.split('/');
  const modulesIndex = parts.lastIndexOf('node_modules');
  if (modulesIndex < 0) return undefined;

  const packageParts = parts.slice(modulesIndex + 1);
  const name = packageParts[0]?.startsWith('@')
    ? `${packageParts[0]}/${packageParts[1]}`
    : packageParts[0];
  if (!name) throw new Error(`Cannot identify package name from source map entry ${source}.`);

  let directory = path.dirname(path.resolve(distDirectory, sourceRoot ?? '', source));
  const nodeModulesDirectory = path.resolve(projectRoot, '../../node_modules');
  while (directory.startsWith(nodeModulesDirectory)) {
    const packageJsonPath = path.join(directory, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const metadata = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (metadata.name === name) return `${name}@${metadata.version}`;
    }
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  throw new Error(`Cannot resolve bundled package metadata for ${name} from ${source}.`);
}

function assertEqualSets(label, expected, actual) {
  const missing = [...expected].filter((entry) => !actual.has(entry)).sort();
  const unexpected = [...actual].filter((entry) => !expected.has(entry)).sort();
  if (missing.length || unexpected.length) {
    throw new Error(`${label} mismatch. Missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}.`);
  }
}

const build = spawnSync('pnpm', ['run', 'build'], {
  cwd: projectRoot,
  encoding: 'utf8',
  stdio: ['ignore', 'inherit', 'inherit'],
  env: { ...globalThis.process.env, KEEP_DIST_SOURCEMAPS: '1' },
});
if (build.error) throw build.error;
  if (build.status !== 0) throw new Error(`pnpm run build failed with status ${build.status}.`);

const mapFiles = fs.readdirSync(distDirectory).filter((file) => file.endsWith('.map'));
if (mapFiles.length === 0) throw new Error('Build produced no source maps to audit.');

const packageVersions = new Set();
const vendorSources = new Set();
const localSources = new Set();
for (const file of mapFiles) {
  const map = JSON.parse(fs.readFileSync(path.join(distDirectory, file), 'utf8'));
  for (const source of map.sources ?? []) {
    const identity = bundledPackageIdentity(source, map.sourceRoot);
    if (identity) {
      packageVersions.add(identity);
      vendorSources.add(source);
    } else {
      localSources.add(source);
    }
  }
}

const notice = fs.readFileSync(path.join(projectRoot, 'THIRD-PARTY-LICENSES'), 'utf8');
const noticeLines = notice.split('\n').filter((line) => /^\| [^|]+ \| [^|]+ \|/.test(line) && !line.startsWith('| Package'));
const noticePackageVersions = new Set(noticeLines.map((line) => {
  const [, name, version] = line.split('|').map((part) => part.trim());
  return `${name}@${version}`;
}));
assertEqualSets('Source-map package inventory and notice inventory', packageVersions, noticePackageVersions);
for (const identity of packageVersions) {
  const [name, version] = identity.split(/@(?=\d)/);
  if (!notice.includes(`### ${name} ${version} — `)) {
    throw new Error(`License and notice text is missing for ${identity}.`);
  }
}

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'mermaid-sdk-license-audit-'));
try {
  for (const file of mapFiles) fs.rmSync(path.join(distDirectory, file));

  run('pnpm', ['pack', '--pack-destination', temporaryDirectory]);
  const tarball = fs.readdirSync(temporaryDirectory).find((file) => file.endsWith('.tgz'));
  if (!tarball) throw new Error('pnpm pack did not produce an npm-compatible tarball.');
  const archivePath = path.join(temporaryDirectory, tarball);
  const archiveEntries = run('tar', ['-tzf', archivePath]).trim().split('\n').filter(Boolean);
  const archiveEntrySet = new Set(archiveEntries);
  for (const required of ['package/LICENSE', 'package/THIRD-PARTY-LICENSES', 'package/package.json']) {
    if (!archiveEntrySet.has(required)) throw new Error(`npm tarball is missing ${required}.`);
  }
  if (archiveEntries.some((entry) => entry.endsWith('.map'))) {
    throw new Error('npm tarball unexpectedly includes JavaScript source maps.');
  }
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  const exportTargets = new Set();
  const collectExportTargets = (entry) => {
    if (typeof entry === 'string' && entry.startsWith('./')) exportTargets.add(entry);
    else if (entry && typeof entry === 'object') Object.values(entry).forEach(collectExportTargets);
  };
  collectExportTargets(packageJson.exports);
  for (const target of exportTargets) {
    const archiveTarget = `package/${target.replace(/^\.\//, '')}`;
    if (!archiveEntrySet.has(archiveTarget)) {
      throw new Error(`npm tarball is missing export target ${target}.`);
    }
  }
  const archivedPackageJson = JSON.parse(run('tar', ['-xOf', archivePath, 'package/package.json']));
  const headlessPackageJson = JSON.parse(fs.readFileSync(path.resolve(projectRoot, '../headless/package.json'), 'utf8'));
  if (archivedPackageJson.dependencies?.['@mermaid-editor-sdk/headless'] !== headlessPackageJson.version) {
    throw new Error('npm tarball did not rewrite @mermaid-editor-sdk/headless workspace dependency to its published version.');
  }
  const unexpectedTopLevel = [...new Set(archiveEntries.map((entry) => entry.split('/')[1]).filter(Boolean))]
    .filter((entry) => !['LICENSE', 'README.md', 'THIRD-PARTY-LICENSES', 'dist', 'package.json', 'src'].includes(entry));
  if (unexpectedTopLevel.length) {
    throw new Error(`npm tarball contains files outside package.json files boundary: ${unexpectedTopLevel.join(', ')}.`);
  }

  const archivedNotice = run('tar', ['-xOf', archivePath, 'package/THIRD-PARTY-LICENSES']);
  const archivedLicense = run('tar', ['-xOf', archivePath, 'package/LICENSE']);
  if (archivedNotice !== notice) throw new Error('THIRD-PARTY-LICENSES differs between worktree and npm tarball.');
  if (archivedLicense !== fs.readFileSync(path.join(projectRoot, 'LICENSE'), 'utf8')) {
    throw new Error('LICENSE differs between worktree and npm tarball.');
  }

  const archiveBytes = fs.readFileSync(archivePath);
  const digest = crypto.createHash('sha256').update(archiveBytes).digest('hex');
  globalThis.console.log(JSON.stringify({
    sourceMaps: mapFiles.length,
    bundledModuleSources: vendorSources.size,
    sdkModuleSources: localSources.size,
    bundledPackageVersions: packageVersions.size,
    noticeEntries: noticePackageVersions.size,
    tarball,
    tarballFiles: archiveEntries.length,
    tarballBytes: archiveBytes.length,
    tarballSha256: digest,
    includedSourceMaps: archiveEntries.filter((entry) => entry.endsWith('.map')).length,
    exportTargets: exportTargets.size,
    internalWorkspaceDependencyRewritten: true,
    licenseNoticeFilesPresentAndExact: true,
    result: 'PASS',
  }, null, 2));
} finally {
  for (const file of fs.readdirSync(distDirectory).filter((entry) => entry.endsWith('.map'))) {
    fs.rmSync(path.join(distDirectory, file));
  }
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
