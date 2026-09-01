#!/usr/bin/env node

import { performance } from "node:perf_hooks";

const baseUrl = process.argv[2] ?? process.env.LOAD_BASE_URL ?? "http://127.0.0.1:3000";
const concurrency = parsePositiveInteger(process.env.LOAD_CONCURRENCY, 50);
const durationSeconds = parsePositiveInteger(process.env.LOAD_DURATION_SECONDS, 15);
const requestTimeoutMs = parsePositiveInteger(process.env.LOAD_REQUEST_TIMEOUT_MS, 10000);
const maxErrorRate = parseNumber(process.env.LOAD_MAX_ERROR_RATE, 0.01);
const maxP95Ms = parsePositiveInteger(process.env.LOAD_MAX_P95_MS, 1500);
const paths = (process.env.LOAD_PATHS ?? "/,/services,/offline,/manifest.json,/sw.js")
  .split(",")
  .map((path) => path.trim())
  .filter(Boolean);

const endAt = performance.now() + durationSeconds * 1000;
const latencies = [];
const statusCounts = new Map();
let total = 0;
let failed = 0;

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNumber(value, fallback) {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveUrl(path, index) {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(suffix, baseUrl);
  url.searchParams.set("loadSmoke", String(index));
  return url;
}

function describeError(error) {
  if (error && typeof error === "object") {
    if ("code" in error && typeof error.code === "string") {
      return `error:${error.code}`;
    }
    const cause = "cause" in error ? error.cause : undefined;
    if (cause && typeof cause === "object" && "code" in cause) {
      return `error:${cause.code}`;
    }
    if ("name" in error && typeof error.name === "string") {
      return `error:${error.name}`;
    }
  }

  return "error:unknown";
}

function percentile(values, p) {
  if (values.length === 0) {
    return 0;
  }

  const index = Math.min(values.length - 1, Math.ceil((p / 100) * values.length) - 1);
  return values[index];
}

async function hit(path, index) {
  const url = resolveUrl(path, index);
  const controller = new AbortController();
  const startedAt = performance.now();
  let timeout;

  try {
    const request = fetch(url, {
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
    }).then(async (response) => {
      await response.arrayBuffer();
      return response;
    });

    request.catch(() => undefined);

    const response = await Promise.race([
      request,
      new Promise((_, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          const error = new Error("Request timed out");
          error.code = "REQUEST_TIMEOUT";
          reject(error);
        }, requestTimeoutMs);
      }),
    ]);

    const latency = performance.now() - startedAt;
    total += 1;
    latencies.push(latency);
    statusCounts.set(response.status, (statusCounts.get(response.status) ?? 0) + 1);

    if (response.status >= 500) {
      failed += 1;
    }
  } catch (error) {
    total += 1;
    failed += 1;
    const errorName = describeError(error);
    statusCounts.set(errorName, (statusCounts.get(errorName) ?? 0) + 1);
  } finally {
    clearTimeout(timeout);
  }
}

async function worker(workerIndex) {
  let requestIndex = workerIndex;

  while (performance.now() < endAt) {
    const path = paths[requestIndex % paths.length];
    await hit(path, requestIndex);
    requestIndex += concurrency;
  }
}

async function main() {
  console.log(
    `Running load smoke: baseUrl=${baseUrl}, concurrency=${concurrency}, duration=${durationSeconds}s, paths=${paths.join(" ")}`,
  );

  const keepAlive = setInterval(() => undefined, 1000);

  try {
    await Promise.all(Array.from({ length: concurrency }, (_, index) => worker(index)));
  } finally {
    clearInterval(keepAlive);
  }

  latencies.sort((a, b) => a - b);

  const ok = total - failed;
  const errorRate = total === 0 ? 1 : failed / total;
  const summary = {
    total,
    ok,
    failed,
    errorRate: Number(errorRate.toFixed(4)),
    requestsPerSecond: Number((total / durationSeconds).toFixed(2)),
    p50Ms: Math.round(percentile(latencies, 50)),
    p95Ms: Math.round(percentile(latencies, 95)),
    p99Ms: Math.round(percentile(latencies, 99)),
    statuses: Object.fromEntries(statusCounts),
  };

  console.log(JSON.stringify(summary, null, 2));

  if (errorRate > maxErrorRate || summary.p95Ms > maxP95Ms) {
    console.error(
      `Load smoke failed thresholds: maxErrorRate=${maxErrorRate}, maxP95Ms=${maxP95Ms}.`,
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
