// ERC-8004 quickstart on Arc Testnet (Viem flow)
// Source: https://docs.arc.io/arc/tutorials/register-your-first-ai-agent
//
//   Step 4  Register agent identity        (owner  -> IdentityRegistry.register)
//   Step 5  Retrieve agent ID              (Transfer event + ownerOf/tokenURI)
//   Step 6  Record agent reputation        (validator -> ReputationRegistry.giveFeedback)
//   Step 7  Request and verify validation  (owner -> validationRequest,
//                                           validator -> validationResponse,
//                                           anyone -> getValidationStatus)
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  getContract,
  http,
  keccak256,
  parseAbiItem,
  toHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "viem/chains";

// ERC-8004 contracts on Arc Testnet
const IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
const REPUTATION_REGISTRY = "0x8004B663056A597Dffe9eCcC1965A193B7388713";
const VALIDATION_REGISTRY = "0x8004Cb1BF31DAf7788923b405b754f57acEB4272";

// Step 3 - metadata URI (defaults to the docs example; override via .env)
const METADATA_URI =
  process.env.METADATA_URI ||
  "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei";

const EXPLORER = arcTestnet.blockExplorers.default.url;

function requireKey(name: string): `0x${string}` {
  const value = process.env[name];
  if (!value || !/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error(
      `${name} is missing or malformed in .env (run: npm run wallets)`,
    );
  }
  return value as `0x${string}`;
}

const ownerAccount = privateKeyToAccount(requireKey("OWNER_PRIVATE_KEY"));
const validatorAccount = privateKeyToAccount(
  requireKey("VALIDATOR_PRIVATE_KEY"),
);

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

const ownerWalletClient = createWalletClient({
  account: ownerAccount,
  chain: arcTestnet,
  transport: http(),
});

const validatorWalletClient = createWalletClient({
  account: validatorAccount,
  chain: arcTestnet,
  transport: http(),
});

const identityAbi = [
  {
    name: "register",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "metadataURI", type: "string" }],
    outputs: [],
  },
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "tokenURI",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

const reputationAbi = [
  {
    name: "giveFeedback",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "score", type: "int128" },
      { name: "feedbackType", type: "uint8" },
      { name: "tag", type: "string" },
      { name: "metadataURI", type: "string" },
      { name: "evidenceURI", type: "string" },
      { name: "comment", type: "string" },
      { name: "feedbackHash", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;

const validationAbi = [
  {
    name: "validationRequest",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "validator", type: "address" },
      { name: "agentId", type: "uint256" },
      { name: "requestURI", type: "string" },
      { name: "requestHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "validationResponse",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "requestHash", type: "bytes32" },
      { name: "response", type: "uint8" },
      { name: "responseURI", type: "string" },
      { name: "responseHash", type: "bytes32" },
      { name: "tag", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "getValidationStatus",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "requestHash", type: "bytes32" }],
    outputs: [
      { name: "validatorAddress", type: "address" },
      { name: "agentId", type: "uint256" },
      { name: "response", type: "uint8" },
      { name: "responseHash", type: "bytes32" },
      { name: "tag", type: "string" },
      { name: "lastUpdate", type: "uint256" },
    ],
  },
] as const;

type ValidationStatus = readonly [
  `0x${string}`,
  bigint,
  number,
  `0x${string}`,
  string,
  bigint,
];

async function waitForReceipt(hash: `0x${string}`, label: string) {
  console.log(`  Waiting for ${label}: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`${label} reverted onchain: ${EXPLORER}/tx/${hash}`);
  }
  console.log(`  ${label} confirmed in block ${receipt.blockNumber}`);
  console.log(`  Explorer: ${EXPLORER}/tx/${hash}`);
  return receipt;
}

async function assertFunded(label: string, address: `0x${string}`) {
  const balance = await publicClient.getBalance({ address });
  console.log(`  ${label.padEnd(10)} ${address}  ${formatEther(balance)} USDC`);
  if (balance === 0n) {
    throw new Error(
      `${label} wallet has no Arc Testnet USDC for gas. Fund it at https://faucet.circle.com`,
    );
  }
}

async function main() {
  console.log("\n-- Step 2: Prepare wallets --");
  await assertFunded("Owner", ownerAccount.address);
  await assertFunded("Validator", validatorAccount.address);

  console.log("\n-- Step 4: Register agent identity --");
  console.log(`  Metadata URI: ${METADATA_URI}`);

  const registerTx = await ownerWalletClient.writeContract({
    address: IDENTITY_REGISTRY,
    abi: identityAbi,
    functionName: "register",
    args: [METADATA_URI],
    account: ownerAccount,
  });

  const receipt = await waitForReceipt(registerTx, "Registration");

  console.log("\n-- Step 5: Retrieve agent ID --");

  const transferLogs = await publicClient.getLogs({
    address: IDENTITY_REGISTRY,
    event: parseAbiItem(
      "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    ),
    args: { to: ownerAccount.address },
    fromBlock: receipt.blockNumber,
    toBlock: receipt.blockNumber,
  });

  if (transferLogs.length === 0) {
    throw new Error("No Transfer events found in the registration block");
  }

  const agentId = transferLogs[transferLogs.length - 1].args.tokenId;
  if (agentId == null) {
    throw new Error("Registration event did not include a tokenId");
  }

  const identityContract = getContract({
    address: IDENTITY_REGISTRY,
    abi: identityAbi,
    client: publicClient,
  });

  const owner = await identityContract.read.ownerOf([agentId]);
  const tokenURI = await identityContract.read.tokenURI([agentId]);

  console.log(`  Agent ID: ${agentId}`);
  console.log(`  Owner: ${owner}`);
  console.log(`  Metadata URI: ${tokenURI}`);
  console.log(
    `  NFT: ${EXPLORER}/token/${IDENTITY_REGISTRY}/instance/${agentId}`,
  );

  console.log("\n-- Step 6: Record reputation (validator wallet) --");

  // Production scoring: replace the hardcoded 95 with a score derived from
  // observed agent behaviour (e.g. slippagePct < 1 ? 95 : 60).
  const tag = "successful_trade";
  const feedbackHash = keccak256(toHex(tag));

  const reputationContract = getContract({
    address: REPUTATION_REGISTRY,
    abi: reputationAbi,
    client: { public: publicClient, wallet: validatorWalletClient },
  });

  const reputationTx = await reputationContract.write.giveFeedback(
    [agentId, 95n, 0, tag, "", "", "", feedbackHash],
    { account: validatorAccount },
  );

  const reputationReceipt = await waitForReceipt(reputationTx, "Reputation");

  const fromBlock =
    reputationReceipt.blockNumber > 1000n
      ? reputationReceipt.blockNumber - 1000n
      : 0n;

  const reputationLogs = await publicClient.getLogs({
    address: REPUTATION_REGISTRY,
    fromBlock,
    toBlock: "latest",
  });

  console.log(
    `  Found ${reputationLogs.length} feedback event(s) in the last ~1000 blocks`,
  );

  console.log("\n-- Step 7: Request and verify validation --");
  const requestURI = "ipfs://bafkreiexamplevalidationrequest";
  const requestHash = keccak256(
    toHex(`kyc_verification_request_agent_${agentId}`),
  );
  console.log(`  Request hash: ${requestHash}`);

  // 7a. Owner requests validation from the validator
  const validationRequestContract = getContract({
    address: VALIDATION_REGISTRY,
    abi: validationAbi,
    client: { public: publicClient, wallet: ownerWalletClient },
  });

  const validationRequestTx =
    await validationRequestContract.write.validationRequest(
      [validatorAccount.address, agentId, requestURI, requestHash],
      { account: ownerAccount },
    );

  await waitForReceipt(validationRequestTx, "Validation request");

  // 7b. Validator responds (100 = passed, 0 = failed)
  const validationResponseContract = getContract({
    address: VALIDATION_REGISTRY,
    abi: validationAbi,
    client: { public: publicClient, wallet: validatorWalletClient },
  });

  const validationResponseTx =
    await validationResponseContract.write.validationResponse(
      [
        requestHash,
        100,
        "",
        `0x${"0".repeat(64)}` as `0x${string}`,
        "kyc_verified",
      ],
      { account: validatorAccount },
    );

  await waitForReceipt(validationResponseTx, "Validation response");

  // 7c. Anyone can read the validation status
  const validationReadContract = getContract({
    address: VALIDATION_REGISTRY,
    abi: validationAbi,
    client: publicClient,
  });

  const [valAddr, valAgentId, response, , validationTag, lastUpdate] =
    (await validationReadContract.read.getValidationStatus([
      requestHash,
    ])) as ValidationStatus;

  console.log(`  Validator: ${valAddr}`);
  console.log(`  Agent ID:  ${valAgentId}`);
  console.log(`  Response:  ${response} (100 = passed)`);
  console.log(`  Tag:       ${validationTag}`);
  console.log(
    `  Updated:   ${new Date(Number(lastUpdate) * 1000).toISOString()}`,
  );

  console.log("\n-- Complete --");
  console.log("  [x] Identity registered");
  console.log("  [x] Reputation recorded");
  console.log("  [x] Validation requested and verified");
  console.log(
    `\n  Owner on explorer: ${EXPLORER}/address/${ownerAccount.address}\n`,
  );
}

main().catch((error) => {
  console.error("\nError:", error.shortMessage ?? error.message ?? error);
  process.exitCode = 1;
});
