#!/usr/bin/env node

/**
 * Cloudflare Workers Secrets Upload Script
 *
 * This script reads secrets from .env files and uploads them to Cloudflare Workers
 *
 * Usage:
 *   node scripts/set-secrets.js staging
 *   node scripts/set-secrets.js production
 *
 * Or via npm:
 *   pnpm secrets:staging
 *   pnpm secrets:production
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ENVIRONMENTS = {
  staging: {
    envFile: '.env.staging',
    wranglerEnv: 'staging',
    workerName: 'geino-saas-staging',
  },
  production: {
    envFile: '.env.production',
    wranglerEnv: 'production',
    workerName: 'geino-saas-prod',
  },
};

// Secrets that should be uploaded to Cloudflare (sensitive values)
const SECRETS_TO_UPLOAD = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'FROM_EMAIL',
  'FROM_NAME',
  'RESEND_API_KEY',
];

// Non-sensitive variables (already in wrangler config)
const NON_SECRET_VARS = [
  'APP_URL',
  'WORKER_NAME',
];

function parseEnvFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const env = {};

  content.split('\n').forEach((line) => {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) {
      return;
    }

    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });

  return env;
}

function setSecret(secretName, secretValue, environment) {
  const config = ENVIRONMENTS[environment];

  console.log(`\n📝 Setting secret: ${secretName}`);

  try {
    // Use wrangler secret put with environment flag
    const cmd = `echo "${secretValue}" | wrangler secret put ${secretName} --config wrangler.${environment}.jsonc`;

    execSync(cmd, {
      stdio: ['pipe', 'inherit', 'inherit'],
      shell: '/bin/bash',
    });

    console.log(`✅ Successfully set ${secretName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to set ${secretName}:`, error.message);
    return false;
  }
}

function main() {
  const environment = process.argv[2];

  if (!environment || !ENVIRONMENTS[environment]) {
    console.error('❌ Invalid environment specified');
    console.error('\nUsage: node scripts/set-secrets.js <environment>');
    console.error('Environments:', Object.keys(ENVIRONMENTS).join(', '));
    process.exit(1);
  }

  const config = ENVIRONMENTS[environment];
  const envFilePath = join(__dirname, '..', config.envFile);

  if (!existsSync(envFilePath)) {
    console.error(`❌ Environment file not found: ${config.envFile}`);
    console.error('Please create this file first with your environment secrets');
    process.exit(1);
  }

  console.log(`\n🚀 Uploading secrets for ${environment.toUpperCase()} environment`);
  console.log(`📄 Reading from: ${config.envFile}`);
  console.log(`🔧 Worker: ${config.workerName}\n`);

  // Parse environment file
  const env = parseEnvFile(envFilePath);

  // Check if all required secrets are present
  const missingSecrets = SECRETS_TO_UPLOAD.filter((key) => !env[key]);
  if (missingSecrets.length > 0) {
    console.error('❌ Missing required secrets in .env file:');
    missingSecrets.forEach((key) => console.error(`   - ${key}`));
    process.exit(1);
  }

  // Confirm before uploading
  console.log('📋 Secrets to upload:');
  SECRETS_TO_UPLOAD.forEach((key) => {
    const value = env[key];
    const preview = value.length > 20 ? `${value.substring(0, 20)}...` : value;
    console.log(`   - ${key}: ${preview}`);
  });

  console.log('\n⚠️  WARNING: This will upload secrets to Cloudflare Workers');
  console.log(`   Environment: ${environment}`);
  console.log(`   Worker: ${config.workerName}\n`);

  // Upload secrets
  let successCount = 0;
  let failCount = 0;

  SECRETS_TO_UPLOAD.forEach((secretName) => {
    if (setSecret(secretName, env[secretName], environment)) {
      successCount++;
    } else {
      failCount++;
    }
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successfully uploaded: ${successCount} secrets`);
  if (failCount > 0) {
    console.log(`❌ Failed to upload: ${failCount} secrets`);
  }
  console.log('='.repeat(50));

  if (failCount > 0) {
    process.exit(1);
  }

  console.log('\n🎉 All secrets uploaded successfully!');
  console.log(`\n💡 Next step: Deploy your worker with:`);
  console.log(`   pnpm deploy:${environment}\n`);
}

main();
