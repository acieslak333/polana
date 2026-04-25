#!/usr/bin/env node
// Polana — project setup script
// Run: npm run setup

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ── Helpers ───────────────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(msg) { console.log(msg); }
function ok(msg) { log(`  ${c.green}✓${c.reset} ${msg}`); }
function warn(msg) { log(`  ${c.yellow}⚠${c.reset}  ${msg}`); }
function fail(msg) { log(`  ${c.red}✗${c.reset} ${msg}`); }
function info(msg) { log(`  ${c.cyan}→${c.reset} ${msg}`); }
function step(msg) { log(`\n${c.bold}${msg}${c.reset}`); }
function dim(msg) { log(`${c.dim}${msg}${c.reset}`); }

function run(cmd, opts = {}) {
  try {
    execSync(cmd, { stdio: opts.silent ? 'pipe' : 'inherit', cwd: ROOT });
    return true;
  } catch (e) {
    return false;
  }
}

function getVersion(cmd) {
  try {
    return execSync(cmd, { stdio: 'pipe' }).toString().trim();
  } catch {
    return null;
  }
}

// ── Banner ────────────────────────────────────────────────────────────

log('');
log(`${c.bold}${c.green}🌿 Polana — Setup${c.reset}`);
log(`${c.dim}────────────────────────────────────────${c.reset}`);

// ── 1. Check prerequisites ────────────────────────────────────────────

step('1. Checking prerequisites');

const nodeVersion = getVersion('node --version');
if (!nodeVersion) {
  fail('Node.js not found. Install from https://nodejs.org (v20+ recommended).');
  process.exit(1);
}
const nodeMajor = parseInt(nodeVersion.replace('v', '').split('.')[0], 10);
if (nodeMajor < 18) {
  fail(`Node.js ${nodeVersion} is too old. Upgrade to v20+.`);
  process.exit(1);
}
ok(`Node.js ${nodeVersion}`);

const npmVersion = getVersion('npm --version');
ok(`npm ${npmVersion}`);

const gitVersion = getVersion('git --version');
if (gitVersion) {
  ok(`git (${gitVersion.replace('git version ', '')})`);
} else {
  warn('git not found — version control will not be available.');
}

// ── 2. Install dependencies ───────────────────────────────────────────

step('2. Installing dependencies');

const nodeModulesExists = fs.existsSync(path.join(ROOT, 'node_modules'));
if (nodeModulesExists) {
  info('node_modules exists — running npm install to sync...');
} else {
  info('Installing packages (this may take a minute)...');
}

const installed = run('npm install');
if (!installed) {
  fail('npm install failed. Check the error above.');
  process.exit(1);
}
ok('Dependencies installed');

// ── 3. Environment file ───────────────────────────────────────────────

step('3. Environment configuration');

const envExample = path.join(ROOT, '.env.example');
const envLocal = path.join(ROOT, '.env.local');

if (!fs.existsSync(envLocal)) {
  if (fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envLocal);
    ok('.env.local created from .env.example');
    warn('.env.local is empty — fill in your Supabase credentials before starting.');
  } else {
    fail('.env.example not found — cannot create .env.local.');
  }
} else {
  ok('.env.local already exists');

  // Check if values are still placeholders
  const envContent = fs.readFileSync(envLocal, 'utf-8');
  const hasPlaceholders =
    envContent.includes('your-project') || envContent.includes('your-anon-key');
  if (hasPlaceholders) {
    warn('.env.local still has placeholder values. Update them before running the app.');
  }
}

// ── 4. Supabase migrations reminder ──────────────────────────────────

step('4. Database setup');

const migrationsDir = path.join(ROOT, 'supabase', 'migrations');
const migrations = fs.existsSync(migrationsDir)
  ? fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()
  : [];

if (migrations.length > 0) {
  info('Run these SQL files in your Supabase SQL Editor (in order):');
  migrations.forEach((m) => log(`       supabase/migrations/${m}`));
  log('');
  info('Supabase SQL Editor: https://app.supabase.com → your project → SQL Editor');
} else {
  warn('No migration files found.');
}

// ── 5. Summary ────────────────────────────────────────────────────────

log('');
log(`${c.dim}────────────────────────────────────────${c.reset}`);
log(`${c.bold}${c.green}Setup complete!${c.reset}`);
log('');
log('Next steps:');
log(`  1. Create a project at ${c.cyan}https://app.supabase.com${c.reset}`);
log(`  2. Fill in ${c.cyan}.env.local${c.reset} with your Supabase URL + anon key`);
log(`  3. Run migrations in Supabase SQL Editor (listed above)`);
log(`  4. Start the app:`);
log('');
log(`     ${c.bold}npm start${c.reset}           — Expo dev server (scan QR with Expo Go)`);
log(`     ${c.bold}npm run android${c.reset}     — Android emulator`);
log(`     ${c.bold}npm run ios${c.reset}         — iOS simulator (macOS only)`);
log('');
log(`${c.dim}Docs: .claude/CLAUDE.md | Sprints: .claude/SPRINTS.md${c.reset}`);
log('');
