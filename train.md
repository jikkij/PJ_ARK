# Arc Builder AI Guide

Last verified: 2026-06-01

This file is designed to be given to an AI coding agent so it can operate as an "Arc Builder": an assistant that can plan, build, test, and deploy projects on Arc.

> Important: Arc is a fast-moving testnet ecosystem. Treat this guide as a working map and a safe starting snapshot. The AI agent must re-check official documentation before every real project.

## How To Use This File

1. Open your project folder in VS Code, Codex, Claude Code, Cursor, Windsurf, Gemini CLI, or another AI coding tool.
2. Place this file in the project root.
3. Give the AI this instruction:

```text
Read this file and switch into Arc Builder mode. Plan the project for Arc Testnet, verify the official documentation, design the architecture, then implement step by step. Do not use mainnet or real funds. Re-check every critical Arc detail on docs.arc.io.
```

4. Describe your project idea in one sentence.
5. Ask the AI for a plan first, then the file structure, then code, then tests, then deployment.

## AI System Instruction

Give this section directly to the AI assistant.

```text
You are operating in Arc Builder mode as a senior blockchain/full-stack engineer.

Your goal:
- Build working, testable, deployable applications on Arc Testnet.
- Turn the user's idea into a technical plan before writing code.
- Verify Arc, Circle, App Kit, USDC, CCTP, wallet, and contract-address details from official documentation before treating them as true.

Hard rules:
1. Treat Arc as testnet unless official docs and the user explicitly say otherwise. Do not use mainnet or real funds.
2. Arc uses USDC as the native gas token. Do not assume ETH is used for gas.
3. Correctly separate native USDC from ERC-20 USDC.
4. Re-check chain ID, RPC URL, explorer URL, and contract addresses at the start of the project.
5. You may use EVM-compatible tools: Foundry, Hardhat, Viem, Ethers, Wagmi.
6. For bridge, swap, send, and unified balance flows, consider Circle App Kit first.
7. If CCTP, Gateway, App Kit, or Circle Wallets are used, check the related Circle documentation too.
8. Never place private keys, API keys, wallet secrets, mnemonics, or tokens in source code.
9. Before coding, produce a clear plan, assumptions, risks, and file structure.
10. Before deployment, run tests, lint/typecheck, build, and network checks.
11. Never guess contract addresses, token decimals, gas behavior, or supported chains. Verify them.
12. If the user is not technical, provide terminal commands one by one in copyable form.

Project workflow:
1. Summarize the user's idea.
2. Evaluate whether Arc is a good fit.
3. Read the required official documentation.
4. Choose the architecture: frontend only, smart contracts, App Kit, CCTP, Circle Wallets, AI agent, node/indexer, etc.
5. Define the minimal working product.
6. Create the file structure.
7. Implement.
8. Test.
9. Deploy to Arc Testnet.
10. Report explorer links, run commands, and next steps.
```

## Critical Arc Summary

Arc is a Layer-1 blockchain from Circle, designed for programmable money and EVM-compatible applications. Its key difference from many EVM chains is that USDC is used as the native gas token, and Arc is directly integrated with Circle's developer platform.

Core points for builders:

- Arc is EVM compatible.
- Solidity contracts can be deployed with standard EVM tooling.
- Gas is paid in USDC, not ETH.
- Arc should currently be treated as testnet.
- Arc is designed around sub-second deterministic finality.
- Circle App Kit can be used for bridge, swap, send, and unified balance flows.
- Always check official Contract Addresses before using USDC, EURC, CCTP, Gateway, or system contract addresses.

## Official Sources To Check First

The AI agent should check these sources at the beginning of every Arc project:

- Arc docs home: https://docs.arc.io/
- Arc docs LLM index: https://docs.arc.io/llms.txt
- Arc MCP server: https://docs.arc.io/ai/mcp
- Arc skills: https://docs.arc.io/ai/skills
- Circle Skills use-arc: https://github.com/circlefin/skills/blob/master/plugins/circle/skills/use-arc/SKILL.md
- Arc network overview: https://docs.arc.io/arc-chain
- Build overview: https://docs.arc.io/build
- Connect to Arc: https://docs.arc.io/arc/references/connect-to-arc
- Contract addresses: https://docs.arc.io/arc/references/contract-addresses
- EVM compatibility: https://docs.arc.io/arc/references/evm-compatibility
- Gas and fees: https://docs.arc.io/arc/references/gas-and-fees
- Deploy on Arc: https://docs.arc.io/arc/tutorials/deploy-on-arc
- Sample applications: https://docs.arc.io/arc/references/sample-applications
- App Kit overview: https://docs.arc.io/app-kit
- App Kit SDK reference: https://docs.arc.io/app-kit/references/sdk-reference
- Supported blockchains: https://docs.arc.io/app-kit/references/supported-blockchains
- Faucet: https://faucet.circle.com
- Arc Testnet explorer: https://testnet.arcscan.app
- Circle developer docs LLM index: https://developers.circle.com/llms.txt

## Arc Testnet Network Details

These values were checked against official Arc documentation on 2026-06-01. Re-verify them before each project.

| Field | Value |
|---|---|
| Network name | Arc Testnet |
| Chain ID | `5042002` |
| Chain ID hex | `0x4CEF52` |
| RPC endpoint | `https://rpc.testnet.arc.network` |
| WebSocket endpoint | `wss://rpc.testnet.arc.network` |
| Explorer | `https://testnet.arcscan.app` |
| Faucet | `https://faucet.circle.com` |
| Native gas token | USDC |
| Native gas decimals | `18` |
| ERC-20 USDC decimals | `6` |
| CCTP domain | `36` |

### Add Arc Testnet To A Wallet Manually

Use these fields when adding Arc Testnet to a wallet:

```text
Network Name: Arc Testnet
RPC URL: https://rpc.testnet.arc.network
Chain ID: 5042002
Currency Symbol: USDC
Block Explorer URL: https://testnet.arcscan.app
```

## Gas Model

Arc uses USDC for gas. This breaks the common EVM assumption that gas is paid with ETH. AI agents and applications must avoid these mistakes:

- Do not check `ETH balance` to determine gas readiness.
- Do not ask for ETH from a faucet.
- Do not display "native token ETH" in UI copy.
- Do not assume an ERC-20 USDC balance is the same thing as native gas USDC.

Important details:

- Native USDC is used for gas.
- Native USDC uses 18 decimals.
- ERC-20 USDC uses 6 decimals.
- Native transfers may not appear as standard ERC-20 `Transfer` events.
- Apps must handle token decimals clearly in UI, balance display, and transfer math.
- Gas parameters can change, so check the Gas and Fees page before deployment.

## Native USDC vs ERC-20 USDC

Arc can expose USDC through two surfaces:

1. Native gas USDC
2. ERC-20 USDC contract

Design rules:

- Native USDC is needed to pay gas.
- ERC-20 USDC may be needed for token transfers, approvals, allowances, App Kit flows, and contract integrations.
- The UI may need to distinguish "Gas USDC" from "Token USDC".
- Decimal differences must be explicit in code.

Wrong assumption:

```text
1 USDC = parseEther("1") everywhere
```

Safer approach:

```text
Use 18 decimals for native gas USDC and 6 decimals for ERC-20 USDC.
```

## Critical Contract Addresses

These addresses are provided as a snapshot. Re-check the official Contract Addresses page before using them:

https://docs.arc.io/arc/references/contract-addresses

| Contract | Arc Testnet address |
|---|---|
| USDC | `0x3600000000000000000000000000000000000000` |
| EURC | `0x3600000000000000000000000000000000000001` |
| USYC | `0x3600000000000000000000000000000000000002` |
| Entitlements | `0x3600000000000000000000000000000000000003` |
| Teller | `0x3600000000000000000000000000000000000004` |
| CCTP v2 TokenMessengerV2 | `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` |
| CCTP v2 MessageTransmitterV2 | `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275` |
| Gateway Wallet | `0x0077777d7EBA4688BDeF3E311b846F25870A19B9` |
| Gateway Minter | `0x0022222ABE238Cc2C7Bb1f21003F0a260052475B` |
| Gateway Well | `0x003333D59e2d1e9C7dd13BACFfeF05F045C4B20C` |
| Stargate FxEscrow | `0x65BEEb00ec9c9d22a8bbb7f48e333A9e0D5bFb2A` |
| CREATE2 deployer | `0x4e59b44847b379578588920cA78FbF26c0B4956C` |
| Multicall3 | `0xcA11bde05977b3631167028862bE2a173976CA11` |
| Uniswap Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |

## EVM Compatibility

Arc is intended to work with standard EVM tooling. Still, the AI agent must not assume chain-specific behavior without checking docs.

General guidance:

- Hardhat, Foundry, Viem, Ethers, and Wagmi can be used.
- Standard Solidity deployment flows usually apply.
- Check the EVM Compatibility page for Arc-specific differences.
- Fields such as `block.prevrandao`, block timestamp, `selfdestruct`, and blob-related behavior may matter depending on the app.
- Deterministic finality means old Ethereum habits such as waiting for many confirmations may be unnecessary or incorrect.

Reference:

https://docs.arc.io/arc/references/evm-compatibility

## When To Use App Kit

Circle App Kit should be considered when the app needs:

- Bridge: move USDC across chains.
- Swap: swap tokens on the same chain or across chains.
- Send: wallet-to-wallet token sending.
- Unified Balance: combine USDC from multiple chains into a single spendable balance.

Use App Kit when:

- The user should spend USDC on Arc even if their USDC is on another chain.
- You want a faster MVP instead of manually integrating CCTP.
- Swap and bridge should happen in one user flow.
- A unified balance experience is required.
- Circle Wallets or multiple wallet adapters are part of the project.

App Kit documentation:

- Overview: https://docs.arc.io/app-kit
- Installation: https://docs.arc.io/app-kit/tutorials/installation
- Adapter setups: https://docs.arc.io/app-kit/tutorials/adapter-setups
- Bridge: https://docs.arc.io/app-kit/bridge
- Swap: https://docs.arc.io/app-kit/swap
- Send: https://docs.arc.io/app-kit/send
- Unified Balance: https://docs.arc.io/app-kit/unified-balance
- SDK reference: https://docs.arc.io/app-kit/references/sdk-reference
- Supported blockchains: https://docs.arc.io/app-kit/references/supported-blockchains

## CCTP, Gateway, And Circle Integrations

Arc projects often involve USDC movement through Circle infrastructure. The AI agent must clarify:

- Is the project only operating on Arc Testnet?
- Does USDC need to come from another chain?
- Is App Kit enough for the bridge flow?
- Is manual CCTP integration required?
- Are Circle Wallets required?
- Will Gateway or Unified Balance be used?

Circle resources:

- Circle docs LLM index: https://developers.circle.com/llms.txt
- Circle Skills repo: https://github.com/circlefin/skills
- Circle App Kit: https://docs.arc.io/app-kit
- Faucet: https://faucet.circle.com

## Documentation Reading Strategy For AI Agents

The AI should not read every page randomly. It should use the project type to choose the right docs.

### Read For Every Arc Project

- https://docs.arc.io/llms.txt
- https://docs.arc.io/arc/references/connect-to-arc
- https://docs.arc.io/arc/references/contract-addresses
- https://docs.arc.io/arc/references/gas-and-fees
- https://docs.arc.io/arc/references/evm-compatibility

### Read If Deploying Solidity Contracts

- https://docs.arc.io/arc/tutorials/deploy-on-arc
- https://docs.arc.io/arc/tutorials/interact-with-contracts
- https://docs.arc.io/arc/tutorials/monitor-contract-events
- https://docs.arc.io/arc/references/sample-applications

### Read If Bridging Or Crosschain Transfers Are Needed

- https://docs.arc.io/app-kit/bridge
- https://docs.arc.io/app-kit/quickstarts/bridge-tokens-across-blockchains
- https://docs.arc.io/app-kit/concepts/bridge-fees
- https://docs.arc.io/app-kit/references/bridge-error-recovery
- https://docs.arc.io/app-kit/references/supported-blockchains

### Read If Swaps Are Needed

- https://docs.arc.io/app-kit/swap
- https://docs.arc.io/app-kit/quickstarts/swap-tokens-same-chain
- https://docs.arc.io/app-kit/quickstarts/swap-tokens-crosschain
- https://docs.arc.io/app-kit/concepts/swap-fees

### Read If Unified Balance Is Needed

- https://docs.arc.io/app-kit/unified-balance
- https://docs.arc.io/app-kit/quickstarts/unified-balance-deposit-and-spend
- https://docs.arc.io/app-kit/concepts/unified-balance-fees

### Read If Building AI Agent Projects

- https://docs.arc.io/ai/mcp
- https://docs.arc.io/build/agentic-economy
- https://docs.arc.io/arc/tutorials/register-your-first-ai-agent
- https://docs.arc.io/arc/tutorials/create-your-first-erc-8183-job

### Read If Building Node Or Infrastructure Projects

- https://docs.arc.io/integrate
- https://docs.arc.io/integrate/connect-to-arc
- https://docs.arc.io/arc/concepts/running-a-node
- https://docs.arc.io/arc/tutorials/run-an-arc-node
- https://docs.arc.io/arc/tools/node-providers
- https://docs.arc.io/arc/tools/data-indexers
- https://docs.arc.io/arc/tools/oracles

## Arc MCP Server

If the AI tool supports MCP, prefer connecting it to Arc documentation through the Arc MCP server.

Reference:

https://docs.arc.io/ai/mcp

General approach:

- The AI tool runs as an MCP client.
- The Arc MCP server is used for documentation search and retrieval.
- The AI checks relevant Arc docs through MCP before writing code.
- If MCP is unavailable, use `llms.txt` and the docs.arc.io links directly.

Instruction for the AI:

```text
If Arc MCP is available, search Arc documentation through MCP first. If MCP is unavailable, read the relevant docs from docs.arc.io/llms.txt. Then produce the plan and code.
```

## Circle Skills

If the tool supports Claude Code plugins or skills, Circle Skills can be installed.

Official skill:

https://github.com/circlefin/skills/blob/master/plugins/circle/skills/use-arc/SKILL.md

Claude Code:

```text
/plugin marketplace add circlefin/skills
/plugin install circle-skills@circle
```

Vercel Skills CLI:

```bash
npx skills add circlefin/skills
```

If Circle Skills are installed, the AI agent should use the `use-arc` skill at the start of the project.

## Project Planning Flow

Before writing code, the AI agent must answer these questions.

### 1. Project Type

Classify the project as one or more of:

- Simple dApp
- Payment app
- Token transfer app
- Smart contract app
- NFT or digital asset app
- Bridge app
- Swap app
- Unified Balance app
- AI agent marketplace
- Escrow/job settlement app
- Wallet/infrastructure integration
- Analytics/indexer app
- Node/operator tooling

### 2. User Flow

Every project needs at least this flow:

- User opens the site.
- User connects a wallet or uses Circle Wallets.
- App verifies Arc Testnet.
- App handles faucet or bridge steps if needed.
- User performs the main action.
- App shows the transaction result with an explorer link.

### 3. Technical Components

Choose the required components:

- Frontend: Next.js, Vite, React, plain HTML, etc.
- Wallet: injected wallet, WalletConnect, Circle Wallets, developer-controlled wallet, user-controlled wallet.
- Chain client: Viem or Ethers.
- Contract tooling: Foundry or Hardhat.
- Arc integration: native RPC, App Kit, CCTP, Gateway.
- Backend: only if API keys, webhooks, indexers, or databases are needed.
- Deployment: Vercel, Netlify, Cloudflare, Railway, Docker, or static hosting.

### 4. Risks

The AI agent should list relevant risks:

- Arc testnet values may change.
- Contract addresses may change.
- USDC decimal mistakes.
- Confusing native gas USDC with ERC-20 USDC.
- Wallet may not support Arc Testnet.
- Bridge or App Kit supported-chain lists may change.
- Private keys or API keys may accidentally leak to the client.
- Faucet balance may be insufficient.

### 5. MVP Scope

Start with the smallest working product.

Example:

```text
MVP: User connects wallet, switches to Arc Testnet, sees ERC-20 USDC balance, sends testnet USDC to a recipient, and receives a transaction hash plus explorer link.
```

## Recommended Stacks

### If No Smart Contract Is Needed

Use cases:

- Payment UI
- Balance viewer
- Send/bridge/swap app

Recommended:

- Vite or Next.js
- Viem
- Wagmi
- App Kit
- Hosted frontend

### If Smart Contracts Are Needed

Use cases:

- Escrow
- Marketplace
- Subscription
- Agent job settlement
- Onchain registry

Recommended:

- Foundry or Hardhat
- Solidity
- OpenZeppelin
- Viem or Ethers
- Explorer verification checks

### If A Full-Stack App Is Needed

Use cases:

- Circle integrations that require API keys
- Webhooks
- Indexers
- Database-backed workflows

Recommended:

- Next.js
- Server actions/API routes
- PostgreSQL or SQLite
- Environment variables
- App Kit or Circle SDKs

## Viem Arc Testnet Config

If your Viem version already includes Arc Testnet, prefer the built-in chain definition. Otherwise, use this fallback:

```ts
import { defineChain } from "viem";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
      webSocket: ["wss://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arcscan Testnet",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
});
```

Public client example:

```ts
import { createPublicClient, http } from "viem";
import { arcTestnet } from "./chains/arcTestnet";

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http("https://rpc.testnet.arc.network"),
});
```

## Ethers Provider Example

```ts
import { JsonRpcProvider } from "ethers";

export const arcProvider = new JsonRpcProvider(
  "https://rpc.testnet.arc.network",
  {
    name: "arc-testnet",
    chainId: 5042002,
  }
);
```

## Hardhat Network Example

```ts
import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const privateKey = process.env.PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    arcTestnet: {
      url: process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network",
      chainId: 5042002,
      accounts: privateKey ? [privateKey] : [],
    },
  },
};

export default config;
```

Deploy:

```bash
npx hardhat run scripts/deploy.ts --network arcTestnet
```

## Foundry Network Example

`.env`:

```env
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
PRIVATE_KEY=your_testnet_private_key_without_0x
```

`foundry.toml`:

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]

[rpc_endpoints]
arc_testnet = "${ARC_TESTNET_RPC_URL}"
```

Deploy:

```bash
forge script script/Deploy.s.sol --rpc-url arc_testnet --broadcast
```

## ERC-20 USDC Balance Example

ERC-20 USDC should be treated as 6 decimals.

```ts
import { createPublicClient, erc20Abi, formatUnits, http } from "viem";
import { arcTestnet } from "./chains/arcTestnet";

const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

const client = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

export async function readUsdcBalance(address: `0x${string}`) {
  const rawBalance = await client.readContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  });

  return formatUnits(rawBalance, 6);
}
```

## Native USDC Balance Example

Native gas balance should be formatted with 18 decimals.

```ts
import { formatUnits } from "viem";
import { publicClient } from "./client";

export async function readNativeGasBalance(address: `0x${string}`) {
  const rawBalance = await publicClient.getBalance({ address });
  return formatUnits(rawBalance, 18);
}
```

## App Kit Installation Notes

Package names and adapter details may change. Check the official installation page first:

https://docs.arc.io/app-kit/tutorials/installation

General approach:

```bash
npm install @circle-fin/app-kit
```

If an adapter is needed, choose it from the adapter documentation:

- Viem adapter
- Ethers adapter
- Solana adapter
- Circle Wallets adapter

Adapter documentation:

https://docs.arc.io/app-kit/tutorials/adapter-setups

## Deployment Process

The AI agent should use this checklist before deployment.

### Preparation

- Is the project using testnet?
- Does `.env` exist locally?
- Is `.env.example` present without secrets?
- Are private keys absent from source code?
- Is the chain ID `5042002`?
- Is the RPC endpoint official or from a trusted provider?
- Does the wallet have native gas USDC?
- Were contract addresses checked against official documentation?

### Testing

- Did unit tests pass?
- Did typecheck pass?
- Did lint pass?
- Did the local build pass?
- Was wallet connection tested?
- Is the wrong-chain state handled?
- Is the empty-balance state handled?
- Are transaction failures shown in the UI?

### Deploy

- Were smart contracts deployed?
- Was the contract address saved?
- Is the contract visible in the explorer?
- Were frontend environment variables updated?
- Was the frontend deployed?
- Was the README updated with run commands?

### Report

The final AI report should include:

- Local run commands
- Test results
- Deployed contract addresses
- Explorer links
- Frontend URL
- Known limitations
- Next steps

## AI Prompt Flow

This flow helps non-technical users get better results from AI coding agents.

### Prompt 1: Idea To Technical Plan

```text
Read ARC_BUILDER_AI_GUIDE.md and switch into Arc Builder mode.

My project idea:
[Write the idea here]

Do not write code yet. First give me:
1. Whether this idea fits Arc,
2. Which Arc/Circle docs you will check,
3. The MVP scope,
4. The technical architecture,
5. The risks,
6. The file structure.
```

### Prompt 2: Set Up The Project

```text
I approve the plan. Now create the project files.

Rules:
- Use Arc Testnet.
- Treat USDC as the gas token.
- Keep secrets out of source code.
- Give me terminal commands in copyable form.
- Build the smallest working version first.
```

### Prompt 3: If Smart Contracts Are Needed

```text
Before writing Solidity contracts, check Arc EVM compatibility and gas documentation.

For contracts:
- Add tests.
- Add a deploy script.
- Add Arc Testnet network config.
- Verify USDC addresses from the Contract Addresses docs before using them.
```

### Prompt 4: If Frontend Is Needed

```text
Build the frontend around a complete user flow.

Handle these states:
- Wallet not connected
- Wrong network
- Switch to Arc Testnet
- Balance loading
- Insufficient USDC
- Transaction pending
- Transaction success
- Transaction failed
- Explorer link
```

### Prompt 5: Test And Fix Errors

```text
Now run the tests. If there is an error, explain it first, then fix it.

Check:
- npm build or the relevant build command
- typecheck
- lint
- contract tests
- Arc config
- decimals
- explorer URL
```

### Prompt 6: Deploy

```text
Now prepare the Arc Testnet deployment.

Before deployment, show me:
- Wallet address to be used
- Chain ID
- RPC URL
- Native gas USDC balance
- Contracts to deploy

After my approval, run the deployment command.
```

## What The AI Must Not Do

- Say Arc uses ETH as the gas token.
- Deploy to mainnet.
- Invent a chain ID.
- Guess contract addresses.
- Ignore decimal differences.
- Ask the user to place a private key in frontend code.
- Build bridge/swap code without checking App Kit supported chains.
- Send the user to unofficial faucet or wallet sites.
- Say "it works" without running build/tests.
- Say deployment is complete without an explorer link.

## Security Checklist

- `.env` must not be committed.
- `.env.example` must not contain secrets.
- Private keys must only be used with testnet wallets.
- Private keys must never be placed in production frontend code.
- API keys should be server-side only.
- Contract ownership and admin roles must be clear.
- If upgradeable contracts are used, proxy admin risk must be documented.
- External calls, reentrancy, allowances, and approvals must be tested.
- Bridge/swap flows should show error recovery states.

## UI/UX Checklist

Most Arc user errors will come from network and gas confusion. The UI should show:

- Wallet not connected
- Wrong chain
- Switch to Arc Testnet button
- Insufficient native gas USDC
- Insufficient ERC-20 USDC
- Faucet link
- Transaction pending
- Transaction final
- Transaction failed
- Explorer link
- Bridge/swap pending
- Bridge/swap recovery

## Troubleshooting

### Transaction Does Not Send

Check:

- Is the wallet on Arc Testnet?
- Is the chain ID `5042002`?
- Does the wallet have native gas USDC?
- Is the RPC endpoint correct?
- Are gas parameters too low?

### Balance Exists But Gas Is Insufficient

Likely causes:

- The wallet has ERC-20 USDC but no native gas USDC.
- Balance type or decimals are mixed up.

### USDC Amount Displays Incorrectly

Check:

- Is ERC-20 USDC using 6 decimals?
- Is native gas using 18 decimals?
- Was `parseEther` used in the wrong place?

### Wallet Shows ETH

Check:

- Is wallet network metadata correct?
- Is native currency symbol set to `USDC`?
- Is chain ID correct?

### Bridge Is Stuck

Check:

- App Kit error recovery docs.
- Supported blockchains page.
- CCTP domain and contract addresses.
- Whether source and destination chains are supported.

### Contract Deployment Fails

Check:

- Does the private key belong to a testnet wallet?
- Does the wallet have native gas USDC?
- Is Hardhat/Foundry network config correct?
- Is the Solidity version supported?
- Are constructor arguments correct?

## Example MVP Ideas

### 1. Arc USDC Send App

Features:

- Wallet connect
- Arc Testnet switch
- ERC-20 USDC balance
- Recipient address and amount
- USDC transfer
- Explorer link

Docs to use:

- Connect to Arc
- Contract Addresses
- Gas and Fees
- EVM Compatibility

### 2. Arc Escrow Contract

Features:

- Create escrow with USDC
- Release funds when work is complete
- Owner/admin dispute flow
- Event monitoring
- Explorer links

Docs to use:

- Deploy on Arc
- Interact with Contracts
- Monitor Contract Events
- Contract Addresses

### 3. Crosschain USDC Deposit App

Features:

- User brings USDC from another chain to Arc
- App Kit bridge
- Arc balance display
- Explorer link after completion

Docs to use:

- App Kit Bridge
- Supported Blockchains
- Bridge Fees
- Bridge Error Recovery

### 4. Unified Balance Checkout

Features:

- User sees USDC from multiple chains as one balance
- User pays on Arc
- App Kit Unified Balance powers the flow

Docs to use:

- Unified Balance
- Deposit and Spend quickstart
- Unified Balance Fees

### 5. AI Agent Job Marketplace

Features:

- Agent registration
- Job creation
- Escrow
- Deliverable submission
- Settlement
- Reputation

Docs to use:

- Agentic Economy
- Register an AI Agent
- Create ERC-8183 Job
- Deploy on Arc

## Official Link Library

### Arc Core

- Docs home: https://docs.arc.io/
- LLM index: https://docs.arc.io/llms.txt
- Arc network overview: https://docs.arc.io/arc-chain
- System overview: https://docs.arc.io/arc/concepts/system-overview
- Stable fee design: https://docs.arc.io/arc/concepts/stable-fee-design
- Deterministic finality: https://docs.arc.io/arc/concepts/deterministic-finality
- Opt-in privacy: https://docs.arc.io/arc/concepts/opt-in-privacy
- Post-quantum security: https://docs.arc.io/arc/concepts/post-quantum-security
- Connect to Arc: https://docs.arc.io/arc/references/connect-to-arc
- Contract addresses: https://docs.arc.io/arc/references/contract-addresses
- EVM compatibility: https://docs.arc.io/arc/references/evm-compatibility
- Gas and fees: https://docs.arc.io/arc/references/gas-and-fees
- Explorer: https://testnet.arcscan.app
- Faucet: https://faucet.circle.com

### Build

- Build overview: https://docs.arc.io/build
- Sample applications: https://docs.arc.io/arc/references/sample-applications
- Deploy on Arc: https://docs.arc.io/arc/tutorials/deploy-on-arc
- Deploy contracts: https://docs.arc.io/arc/tutorials/deploy-contracts
- Interact with contracts: https://docs.arc.io/arc/tutorials/interact-with-contracts
- Monitor contract events: https://docs.arc.io/arc/tutorials/monitor-contract-events

### AI And Agents

- Arc MCP server: https://docs.arc.io/ai/mcp
- Arc Skills: https://docs.arc.io/ai/skills
- Agentic economy: https://docs.arc.io/build/agentic-economy
- Register first AI agent: https://docs.arc.io/arc/tutorials/register-your-first-ai-agent
- Create first ERC-8183 job: https://docs.arc.io/arc/tutorials/create-your-first-erc-8183-job

### App Kit

- Overview: https://docs.arc.io/app-kit
- Installation: https://docs.arc.io/app-kit/tutorials/installation
- Adapter setups: https://docs.arc.io/app-kit/tutorials/adapter-setups
- Bridge: https://docs.arc.io/app-kit/bridge
- Bridge quickstart: https://docs.arc.io/app-kit/quickstarts/bridge-tokens-across-blockchains
- Bridge fees: https://docs.arc.io/app-kit/concepts/bridge-fees
- Bridge error recovery: https://docs.arc.io/app-kit/references/bridge-error-recovery
- Swap: https://docs.arc.io/app-kit/swap
- Same-chain swap quickstart: https://docs.arc.io/app-kit/quickstarts/swap-tokens-same-chain
- Crosschain swap quickstart: https://docs.arc.io/app-kit/quickstarts/swap-tokens-crosschain
- Swap fees: https://docs.arc.io/app-kit/concepts/swap-fees
- Send: https://docs.arc.io/app-kit/send
- Send quickstart: https://docs.arc.io/app-kit/quickstarts/send-tokens-same-chain
- Unified Balance: https://docs.arc.io/app-kit/unified-balance
- Unified Balance quickstart: https://docs.arc.io/app-kit/quickstarts/unified-balance-deposit-and-spend
- Unified Balance fees: https://docs.arc.io/app-kit/concepts/unified-balance-fees
- SDK reference: https://docs.arc.io/app-kit/references/sdk-reference
- Supported blockchains: https://docs.arc.io/app-kit/references/supported-blockchains

### Integrate And Infrastructure

- Integrate overview: https://docs.arc.io/integrate
- Integrator connect guide: https://docs.arc.io/integrate/connect-to-arc
- Integrator deploy guide: https://docs.arc.io/integrate/deploy-on-arc
- Running a node concept: https://docs.arc.io/arc/concepts/running-a-node
- Run an Arc node: https://docs.arc.io/arc/tutorials/run-an-arc-node
- Node providers: https://docs.arc.io/arc/tools/node-providers
- Data indexers: https://docs.arc.io/arc/tools/data-indexers
- Oracles: https://docs.arc.io/arc/tools/oracles
- Account abstraction: https://docs.arc.io/arc/tools/account-abstraction
- Compliance vendors: https://docs.arc.io/arc/tools/compliance-vendors

### Circle Skills

- use-arc: https://github.com/circlefin/skills/blob/master/plugins/circle/skills/use-arc/SKILL.md
- use-usdc: https://github.com/circlefin/skills/blob/master/plugins/circle/skills/use-usdc/SKILL.md
- use-circle-wallets: https://github.com/circlefin/skills/blob/master/plugins/circle/skills/use-circle-wallets/SKILL.md
- use-developer-controlled-wallets: https://github.com/circlefin/skills/blob/master/plugins/circle/skills/use-developer-controlled-wallets/SKILL.md
- use-user-controlled-wallets: https://github.com/circlefin/skills/blob/master/plugins/circle/skills/use-user-controlled-wallets/SKILL.md
- use-modular-wallets: https://github.com/circlefin/skills/blob/master/plugins/circle/skills/use-modular-wallets/SKILL.md
- use-gateway: https://github.com/circlefin/skills/blob/master/plugins/circle/skills/use-gateway/SKILL.md
- use-smart-contract-platform: https://github.com/circlefin/skills/blob/master/plugins/circle/skills/use-smart-contract-platform/SKILL.md

## Optional Offline Documentation Cache

If live docs access is unavailable, download the index files into the project:

```powershell
Invoke-WebRequest -Uri "https://docs.arc.io/llms.txt" -OutFile "arc-llms.txt"
Invoke-WebRequest -Uri "https://developers.circle.com/llms.txt" -OutFile "circle-llms.txt"
```

Notes:

- These commands only download index files.
- The relevant pages should still be checked one by one before building.
- Do not rely on old cached docs for contract addresses or chain data.

## Definition Of Done

An Arc project is not complete until:

- Arc Testnet config is correct.
- USDC is treated as the gas token.
- USDC decimal handling is correct.
- Contract addresses were verified from official docs.
- Build/test commands pass.
- UI handles important error states.
- Deployment includes explorer links.
- README or final report includes run commands.
- Secrets are not inside the repo.
- If the user is non-technical, terminal commands are ordered and clear.

## Short Builder Prompt

First list the official Arc documentation sources you will check, then produce the MVP plan. Do not start coding until I approve. Stay on Arc Testnet and remember that the gas token is USDC.
```