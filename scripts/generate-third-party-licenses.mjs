import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDirectory = path.join(projectRoot, 'dist');

function packageNameFromSource(source) {
  const normalized = source.replaceAll('\\', '/');
  const pathParts = normalized.split('/');
  const modulesIndex = pathParts.lastIndexOf('node_modules');
  if (modulesIndex < 0) return undefined;
  const pathFromModules = pathParts.slice(modulesIndex + 1);
  if (pathFromModules[0]?.startsWith('@')) {
    return pathFromModules.length > 1 ? `${pathFromModules[0]}/${pathFromModules[1]}` : undefined;
  }
  return pathFromModules[0];
}

function findPackageDirectory(source, sourceRoot, packageName) {
  const nodeModulesDirectory = path.join(projectRoot, 'node_modules');
  let directory = path.dirname(path.resolve(distDirectory, sourceRoot ?? '', source));
  while (directory.startsWith(nodeModulesDirectory)) {
    const packageJsonPath = path.join(directory, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const metadata = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (metadata.name === packageName) return { directory, metadata };
    }
    directory = path.dirname(directory);
  }
  throw new Error(`Cannot resolve the bundled package location for ${packageName} from ${source}.`);
}

function readPackage(packageName, packageDirectory, metadata) {
  const files = fs.readdirSync(packageDirectory);
  const noticeFiles = files.filter((file) =>
    /^(?:license|notice)(?:[.-].*)?$/i.test(file) && !/\.(?:c|m)?js$/i.test(file),
  );
  let licenseTexts = noticeFiles.map((file) => ({
    file,
    text: fs.readFileSync(path.join(packageDirectory, file), 'utf8').replace(/[ \t]+$/gm, '').trim(),
  }));

  if (licenseTexts.length === 0 && fs.existsSync(path.join(packageDirectory, 'README.md'))) {
    const readme = fs.readFileSync(path.join(packageDirectory, 'README.md'), 'utf8');
    const licenseSection = readme.split(/^## License\s*$/m)[1]?.trim();
    if (licenseSection) {
      licenseTexts = [{ file: 'README.md (License section)', text: licenseSection.replace(/[ \t]+$/gm, '').trim() }];
    }
  }
  if (licenseTexts.length === 0) {
    throw new Error(`Cannot find a license or notice file for bundled dependency ${packageName}.`);
  }

  return {
    name: packageName,
    version: metadata.version,
    license: typeof metadata.license === 'string' ? metadata.license : 'See included license text',
    licenseTexts,
  };
}

function collectBundledPackages() {
  const packagesByIdentity = new Map();
  for (const file of fs.readdirSync(distDirectory)) {
    if (!file.endsWith('.map')) continue;
    const map = JSON.parse(fs.readFileSync(path.join(distDirectory, file), 'utf8'));
    for (const source of map.sources ?? []) {
      const packageName = packageNameFromSource(source);
      if (!packageName) continue;
      const { directory, metadata } = findPackageDirectory(source, map.sourceRoot, packageName);
      packagesByIdentity.set(`${packageName}@${metadata.version}`, {
        name: packageName,
        directory,
        metadata,
      });
    }
  }
  if (packagesByIdentity.size === 0) {
    throw new Error('No bundled package sources were found in dist source maps.');
  }
  return [...packagesByIdentity.values()]
    .sort((a, b) => a.name.localeCompare(b.name) || a.metadata.version.localeCompare(b.metadata.version))
    .map(({ name, directory, metadata }) => readPackage(name, directory, metadata));
}

const packages = collectBundledPackages();
const output = [
  'Third-party software notices',
  '============================',
  '',
  'Generated from the JavaScript source maps in the current dist build. Each listed package version has its license and notice text included below.',
  '',
  'Bundled package inventory',
  '--------------------------',
  '',
  '| Package | Version | Declared license |',
  '|---|---:|---|',
  ...packages.map(({ name, version, license }) => `| ${name} | ${version} | ${license.replaceAll('|', '\\|')} |`),
  '',
  'License and notice texts',
  '------------------------',
];

for (const dependency of packages) {
  for (const licenseText of dependency.licenseTexts) {
    output.push('', `### ${dependency.name} ${dependency.version} — ${licenseText.file}`, '', '```text', licenseText.text, '```');
  }
}

fs.writeFileSync(path.join(projectRoot, 'THIRD-PARTY-LICENSES'), `${output.join('\n')}\n`);
if (globalThis.process.env.KEEP_DIST_SOURCEMAPS !== '1') {
  for (const file of fs.readdirSync(distDirectory).filter((entry) => entry.endsWith('.map'))) {
    fs.rmSync(path.join(distDirectory, file));
  }
}
