// `npm test`: runs every check in turn and stops at the first one that fails.
//   1. translations  every t("…") text has a Norwegian version
//   2. database      supabase/schema.sql in a real (in-memory) Postgres
//   3. app           the real app in a headless browser, with a fake backend
import { spawnSync } from "node:child_process";

const checks = [
  ["Translations", "tests/i18n.test.mjs"],
  ["Database", "tests/db.test.mjs"],
  ["App", "tests/app.test.mjs"],
];
const root = new URL("..", import.meta.url).pathname;
for (const [name, file] of checks) {
  console.log(`\n=== ${name} ===`);
  const { status } = spawnSync(process.execPath, [file], { cwd: root, stdio: "inherit" });
  if (status !== 0) {
    console.log(`\n${name} check failed.`);
    process.exit(1);
  }
}
console.log("\nAll checks passed.");
