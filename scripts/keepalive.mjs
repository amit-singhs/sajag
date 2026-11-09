#!/usr/bin/env node
/**
 * Keep-alive pinger for the free Render instance (free web services sleep after ~15 min idle).
 * Default path /health only wakes the API — it deliberately does NOT touch Azure SQL, so the free
 * Azure SQL database can still auto-pause and stay within its monthly free allowance.
 * Set KEEPALIVE_PATH=/api/health to also exercise both databases (only on paid / provisioned SQL).
 *
 * Usage: API_URL=https://<your-api>.onrender.com node scripts/keepalive.mjs
 */
const apiUrl = (process.env.API_URL ?? '').replace(/\/$/, '');
if (!apiUrl) {
  console.error('API_URL is not set (e.g. https://sajag-api.onrender.com)');
  process.exit(1);
}

const path = process.env.KEEPALIVE_PATH ?? '/health';
const ATTEMPTS = 4;
const TIMEOUT_MS = 90_000; // a cold Render start can take ~1 minute
const RETRY_DELAY_MS = 20_000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
  const started = Date.now();
  try {
    const response = await fetch(`${apiUrl}${path}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    const body = await response.text();
    console.log(`[keepalive] attempt ${attempt}: HTTP ${response.status} in ${Date.now() - started} ms — ${body}`);
    if (response.ok) process.exit(0);
  } catch (error) {
    console.log(`[keepalive] attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (attempt < ATTEMPTS) await sleep(RETRY_DELAY_MS);
}

console.error('[keepalive] services did not report healthy');
process.exit(1);
