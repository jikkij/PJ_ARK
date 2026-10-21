# チップジャー — USDC Tip Jar

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

---

## What This App Does

A USDC tip jar on Arc Testnet. Users connect their browser wallet, approve USDC, and send a tip with an optional message. The immutable recipient can withdraw the full balance at any time. The UI shows the jar balance, totalTipped, recent tips (newest first), and the user's own USDC balance. Japanese UI text.

## Deployed Contracts

| Contract | Network | Address | Tx Hash |
|---|---|---|---|
| TipJar | Arc Testnet | `0xecabddeb22f9f2e1851bc59fb5f5648dbba37517` | `0x8d8dc4e2b814d73b2fd52ba2623ee10ff2698ca0e38d0ed3b8c91befc7a47896` |

- Explorer: https://explorer.testnet.arc.io/address/0xecabddeb22f9f2e1851bc59fb5f5648dbba37517
- Token: USDC `0x3600000000000000000000000000000000000000` (6 decimals)
- Recipient: `0x77b335b764Fb49DC15e971AA2994493F518C305E`

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, unit tests in `contracts/test/*.t.sol`. Build with `bun run contracts:build` (`forge build`), test with `bun run contracts:test` (`forge test`).
- Wallet: injected (MetaMask, etc.)
- Chain: Arc Testnet (Chain ID: 5042002, imported from `viem/chains`)
- Token: USDC (6 decimals) (Address: 0x3600000000000000000000000000000000000000, Chain: Arc Testnet)
- Toasts: Sonner

## Key Files

- `src/App.tsx` - Main application logic
- `src/components/` - UI components
- `src/config.ts` - wagmi config (chains, connectors, transports)

## To Run

```bash
bun install
bun run dev
```
