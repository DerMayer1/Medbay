#!/usr/bin/env node
/**
 * Fails when the shipped dependency tree carries a high or critical advisory.
 *
 * `npm audit --omit=dev --audit-level=high` cannot be used directly: npm filters
 * the *report* by --omit but derives its *exit code* from the full tree, so a
 * dev-only advisory fails the build even when production is clean. This reads
 * the filtered JSON and decides for itself.
 *
 * Dev-only advisories are still printed, so they stay visible rather than
 * silently accumulating. They do not fail the build; see
 * docs/security-hardening.md for the accepted exceptions.
 */
import { spawnSync } from "node:child_process";

function audit(args) {
  const env = { ...process.env };

  // Running under `npm run` exports the outer invocation's configuration as
  // npm_config_*. A nested npm inherits it and can behave unpredictably, so the
  // child starts from a clean npm configuration.
  for (const key of Object.keys(env)) {
    if (key.toLowerCase().startsWith("npm_config_")) delete env[key];
  }

  // Windows shells launched without ComSpec cannot spawn anything: npm's own
  // installer hits the same failure. Supply it rather than inheriting nothing.
  if (process.platform === "win32" && !env.ComSpec) {
    env.ComSpec = "C:\\Windows\\System32\\cmd.exe";
  }

  const result = spawnSync("npm", ["audit", "--json", ...args], {
    encoding: "utf8",
    shell: process.platform === "win32",
    env,
    maxBuffer: 32 * 1024 * 1024,
  });

  if (result.error) {
    console.error(`Could not run npm audit: ${result.error.message}`);
    process.exit(2);
  }
  if (!result.stdout?.trim()) {
    console.error("npm audit produced no output.");
    console.error(result.stderr?.trim() || "(no stderr)");
    process.exit(2);
  }

  try {
    return JSON.parse(result.stdout);
  } catch {
    console.error("npm audit returned output that is not JSON:");
    console.error(result.stdout.slice(0, 400));
    process.exit(2);
  }
}

const production = audit(["--omit=dev"]);
const full = audit([]);

const counts = production.metadata.vulnerabilities;
const blocking = counts.high + counts.critical;

const devOnly = Object.keys(full.vulnerabilities ?? {}).filter(
  (name) => !(name in (production.vulnerabilities ?? {})),
);

console.log(
  `production tree: ${counts.critical} critical, ${counts.high} high, ` +
  `${counts.moderate} moderate, ${counts.low} low`,
);
if (devOnly.length) console.log(`dev-only advisories (not blocking): ${devOnly.join(", ")}`);

if (blocking > 0) {
  console.error(`\nBlocking: ${blocking} high or critical advisory in the shipped tree.`);
  for (const [name, detail] of Object.entries(production.vulnerabilities ?? {})) {
    if (detail.severity === "high" || detail.severity === "critical") {
      console.error(`  ${name} (${detail.severity}) range ${detail.range}`);
    }
  }
  process.exit(1);
}

console.log("\nNo high or critical advisory in the shipped dependency tree.");
