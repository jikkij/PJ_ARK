// Step 2.1 (verification) — Confirm both wallets hold Arc Testnet USDC for gas.
// On Arc, USDC is the native gas token (18 decimals), so this is the native balance.
import { createPublicClient, formatEther, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "viem/chains";

const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });

const wallets = [
  ["Owner", process.env.OWNER_PRIVATE_KEY],
  ["Validator", process.env.VALIDATOR_PRIVATE_KEY],
] as const;

let allFunded = true;
for (const [label, key] of wallets) {
  if (!key || !key.startsWith("0x")) {
    console.error(`${label}: private key missing in .env (run: npm run wallets)`);
    process.exitCode = 1;
    break;
  }
  const account = privateKeyToAccount(key as `0x${string}`);
  const balance = await publicClient.getBalance({ address: account.address });
  const funded = balance > 0n;
  allFunded &&= funded;
  console.log(
    `${label.padEnd(10)} ${account.address}  ${formatEther(balance)} USDC ${funded ? "✓" : "✗ (unfunded)"}`,
  );
  console.log(`           https://testnet.arcscan.app/address/${account.address}`);
}

if (allFunded) {
  console.log("\nBoth wallets are funded. Ready for: npm run start");
} else {
  console.log("\nFund the unfunded wallet(s) at https://faucet.circle.com (select Arc Testnet).");
  process.exitCode = 1;
}
