#!/usr/bin/env node
const { execSync } = require('child_process');

const envVars = {
  DATABASE_URL: 'postgresql://postgres:jchoupNLNDWvq4t2@db.rtwufzlnouetpihctwmh.supabase.co:5432/postgres?sslmode=no-verify',
  JWT_SECRET: 'RestaurantMS_JWT_Secret_2026!',
  EMAIL_USER: 'ukwitegetsev9@gmail.com',
  EMAIL_PASS: 'omig kruq lsng gfie',
  FRONTEND_URL: 'https://frontend-rouge-omega-41.vercel.app'
};

try {
  for (const [key, value] of Object.entries(envVars)) {
    console.log(`Setting ${key}...`);
    execSync(`vercel env add ${key} production --yes`, {
      input: value,
      stdio: 'inherit'
    });
  }
  console.log('All environment variables set!');
} catch (error) {
  console.error('Error setting environment variables:', error.message);
}
