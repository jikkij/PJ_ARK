// One-time setup: generate a Circle entity secret, register its ciphertext
// with Circle, save the recovery file, and write the secret into .env.
//
// Registration is NOT idempotent — Circle accepts one entity secret per
// developer account. If CIRCLE_ENTITY_SECRET is already set in .env this
// script refuses to run. The recovery file is the only way to reset a lost
// entity secret, so keep it somewhere safe (it is gitignored here).
//
// Reads CIRCLE_API_KEY from .env. Nothing secret is printed to the console.
import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { registerEntitySecretCiphertext } from "@circle-fin/developer-controlled-wallets";

const ENV_PATH = ".env";
const RECOVERY_DIR = "recovery";

const apiKey = process.env.CIRCLE_API_KEY;
if (!apiKey || apiKey === "YOUR_API_KEY") {
  console.error("CIRCLE_API_KEY is not set in .env. Paste your Circle API key there first.");
  process.exitCode = 1;
} else if (process.env.CIRCLE_ENTITY_SECRET) {
  console.error(
    "CIRCLE_ENTITY_SECRET is already set in .env. Registration is one-time only; nothing to do.",
  );
  process.exitCode = 1;
} else {
  const entitySecret = randomBytes(32).toString("hex");

  console.log("Registering entity secret ciphertext with Circle...");
  const response = await registerEntitySecretCiphertext({ apiKey, entitySecret });

  const recoveryFile = response.data?.recoveryFile;
  if (!recoveryFile) {
    throw new Error("Circle did not return a recovery file; entity secret NOT written to .env");
  }

  mkdirSync(RECOVERY_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const recoveryPath = `${RECOVERY_DIR}/recovery_file_${stamp}.dat`;
  writeFileSync(recoveryPath, recoveryFile, { encoding: "utf8" });

  // Replace the (empty) CIRCLE_ENTITY_SECRET line in .env, or append one.
  const env = readFileSync(ENV_PATH, "utf8");
  const line = `CIRCLE_ENTITY_SECRET=${entitySecret}`;
  const updated = /^CIRCLE_ENTITY_SECRET=.*$/m.test(env)
    ? env.replace(/^CIRCLE_ENTITY_SECRET=.*$/m, line)
    : `${env.trimEnd()}\n${line}\n`;
  writeFileSync(ENV_PATH, updated, { encoding: "utf8" });

  console.log(`Entity secret registered and saved to ${ENV_PATH}.`);
  console.log(`Recovery file saved to ${recoveryPath} — back it up outside this repo.`);
  console.log("Next: npm run start");
}
