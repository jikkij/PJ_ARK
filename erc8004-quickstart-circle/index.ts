// ERC-8004 quickstart on Arc Testnet (Circle developer-controlled wallets)
// Source: https://docs.arc.io/arc/tutorials/register-your-first-ai-agent
//
//   Step 2  Create developer-controlled wallets  (owner + validator, SCA)
//   Step 4  Register agent identity              (owner  -> IdentityRegistry.register)
//   Step 5  Retrieve agent ID                    (Transfer event + ownerOf/tokenURI)
//   Step 6  Record agent reputation              (validator -> ReputationRegistry.giveFeedback)
//   Step 7  Request and verify validation        (owner -> validationRequest,
//                                                 validator -> validationResponse,
//                                                 anyone -> getValidationStatus)
//
// Gas is sponsored by Circle Gas Station, so the wallets do not need funding.
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import {
  createPublicClient,
  getContract,
  http,
  keccak256,
  parseAbiItem,
  toHex,
} from "viem";
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

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.startsWith("YOUR_")) {
    throw new Error(`${name} is not set in .env`);
  }
  return value;
}

// Initialised in main() so a missing credential surfaces as a clean error.
let circleClient!: ReturnType<typeof initiateDeveloperControlledWalletsClient>;

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

const identityAbi = [
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

const validationAbi = [
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

// Poll Circle until the transaction is COMPLETE, then return its onchain hash.
async function waitForTransaction(txId: string, label: string) {
  process.stdout.write(`  Waiting for ${label}`);
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const { data } = await circleClient.getTransaction({ id: txId });
    const state = data?.transaction?.state;
    if (state === "COMPLETE") {
      const txHash = data?.transaction?.txHash as `0x${string}`;
      console.log(` ok\n  Tx: ${EXPLORER}/tx/${txHash}`);
      return txHash;
    }
    if (state === "FAILED" || state === "DENIED" || state === "CANCELLED") {
      const reason = data?.transaction?.errorReason ?? state;
      throw new Error(`${label} ${state.toLowerCase()}: ${reason}`);
    }
    process.stdout.write(".");
  }
  throw new Error(`${label} timed out`);
}

// Step 2 - reuse wallets from .env, or create a fresh wallet set with two SCA wallets.
async function getOrCreateWallets() {
  const ownerAddress = process.env.OWNER_WALLET_ADDRESS;
  const validatorAddress = process.env.VALIDATOR_WALLET_ADDRESS;

  if (ownerAddress && validatorAddress) {
    console.log("  Reusing wallets from .env");
    return {
      owner: { address: ownerAddress, id: "(from .env)" },
      validator: { address: validatorAddress, id: "(from .env)" },
    };
  }

  const walletSet = await circleClient.createWalletSet({
    name: "ERC8004 Agent Wallets",
  });

  const walletsResponse = await circleClient.createWallets({
    blockchains: ["ARC-TESTNET"],
    count: 2,
    walletSetId: walletSet.data?.walletSet?.id ?? "",
    accountType: "SCA",
  });

  const wallets = walletsResponse.data?.wallets ?? [];
  if (wallets.length < 2 || !wallets[0].address || !wallets[1].address) {
    throw new Error("Circle did not return two wallets");
  }

  console.log(`  Wallet set: ${walletSet.data?.walletSet?.id}`);
  console.log("  Tip: add OWNER_WALLET_ADDRESS / VALIDATOR_WALLET_ADDRESS to .env to reuse these.");
  return {
    owner: { address: wallets[0].address, id: wallets[0].id },
    validator: { address: wallets[1].address, id: wallets[1].id },
  };
}

async function main() {
  circleClient = initiateDeveloperControlledWalletsClient({
    apiKey: requireEnv("CIRCLE_API_KEY"),
    entitySecret: requireEnv("CIRCLE_ENTITY_SECRET"),
  });

  console.log("\n-- Step 2: Create developer-controlled wallets --");
  const { owner: ownerWallet, validator: validatorWallet } =
    await getOrCreateWallets();
  console.log(`  Owner:     ${ownerWallet.address} (${ownerWallet.id})`);
  console.log(`  Validator: ${validatorWallet.address} (${validatorWallet.id})`);

  console.log("\n-- Step 4: Register agent identity --");
  console.log(`  Metadata URI: ${METADATA_URI}`);

  const registerTx = await circleClient.createContractExecutionTransaction({
    walletAddress: ownerWallet.address,
    blockchain: "ARC-TESTNET",
    contractAddress: IDENTITY_REGISTRY,
    abiFunctionSignature: "register(string)",
    abiParameters: [METADATA_URI],
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
  });

  const registerHash = await waitForTransaction(
    registerTx.data?.id!,
    "registration",
  );

  console.log("\n-- Step 5: Retrieve agent ID --");

  // Look up the Transfer event in the exact block the registration landed in.
  const registerReceipt = await publicClient.getTransactionReceipt({
    hash: registerHash,
  });

  const transferLogs = await publicClient.getLogs({
    address: IDENTITY_REGISTRY,
    event: parseAbiItem(
      "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    ),
    args: { to: ownerWallet.address as `0x${string}` },
    fromBlock: registerReceipt.blockNumber,
    toBlock: registerReceipt.blockNumber,
  });

  if (transferLogs.length === 0) {
    throw new Error("No Transfer events found - registration may have failed");
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

  console.log(`  Agent ID:     ${agentId}`);
  console.log(`  Owner:        ${owner}`);
  console.log(`  Metadata URI: ${tokenURI}`);
  console.log(
    `  NFT: ${EXPLORER}/token/${IDENTITY_REGISTRY}/instance/${agentId}`,
  );

  console.log("\n-- Step 6: Record reputation (validator wallet) --");

  // Production scoring: replace the hardcoded 95 with a score derived from
  // observed agent behaviour (e.g. slippagePct < 1 ? 95 : 60).
  const tag = "successful_trade";
  const feedbackHash = keccak256(toHex(tag));

  const reputationTx = await circleClient.createContractExecutionTransaction({
    walletAddress: validatorWallet.address,
    blockchain: "ARC-TESTNET",
    contractAddress: REPUTATION_REGISTRY,
    abiFunctionSignature:
      "giveFeedback(uint256,int128,uint8,string,string,string,string,bytes32)",
    abiParameters: [agentId.toString(), "95", "0", tag, "", "", "", feedbackHash],
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
  });

  const reputationHash = await waitForTransaction(
    reputationTx.data?.id!,
    "reputation",
  );

  const reputationReceipt = await publicClient.getTransactionReceipt({
    hash: reputationHash,
  });
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
  const validationReqTx = await circleClient.createContractExecutionTransaction({
    walletAddress: ownerWallet.address,
    blockchain: "ARC-TESTNET",
    contractAddress: VALIDATION_REGISTRY,
    abiFunctionSignature: "validationRequest(address,uint256,string,bytes32)",
    abiParameters: [
      validatorWallet.address,
      agentId.toString(),
      requestURI,
      requestHash,
    ],
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
  });

  await waitForTransaction(validationReqTx.data?.id!, "validation request");

  // 7b. Validator responds (100 = passed, 0 = failed)
  const validationResTx = await circleClient.createContractExecutionTransaction({
    walletAddress: validatorWallet.address,
    blockchain: "ARC-TESTNET",
    contractAddress: VALIDATION_REGISTRY,
    abiFunctionSignature:
      "validationResponse(bytes32,uint8,string,bytes32,string)",
    abiParameters: [
      requestHash,
      "100",
      "",
      "0x" + "0".repeat(64),
      "kyc_verified",
    ],
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
  });

  await waitForTransaction(validationResTx.data?.id!, "validation response");

  // 7c. Anyone can read the validation status
  const validationContract = getContract({
    address: VALIDATION_REGISTRY,
    abi: validationAbi,
    client: publicClient,
  });

  const [valAddr, valAgentId, response, , valTag, lastUpdate] =
    (await validationContract.read.getValidationStatus([
      requestHash,
    ])) as ValidationStatus;

  console.log(`  Validator: ${valAddr}`);
  console.log(`  Agent ID:  ${valAgentId}`);
  console.log(`  Response:  ${response} (100 = passed)`);
  console.log(`  Tag:       ${valTag}`);
  console.log(
    `  Updated:   ${new Date(Number(lastUpdate) * 1000).toISOString()}`,
  );

  console.log("\n-- Complete --");
  console.log("  [x] Identity registered");
  console.log("  [x] Reputation recorded");
  console.log("  [x] Validation requested and verified");
  console.log(
    `\n  Owner on explorer: ${EXPLORER}/address/${ownerWallet.address}\n`,
  );
}

main().catch((error) => {
  console.error("\nError:", error.message ?? error);
  if (error.response?.data) {
    console.error(JSON.stringify(error.response.data, null, 2));
  }
  process.exitCode = 1;
});
