# チップジャー — USDC Tip Jar on Arc Testnet

A simple USDC tip jar: send USDC tips with a message, newest tips feed, and recipient-only withdrawal. Built on Arc Testnet with OpenZeppelin SafeERC20 + ReentrancyGuard.

## Deployed Contract

| | |
|---|---|
| **Network** | Arc Testnet (chainId 5042002) |
| **TipJar address** | `0xecabddeb22f9f2e1851bc59fb5f5648dbba37517` |
| **Deploy tx** | `0x8d8dc4e2b814d73b2fd52ba2623ee10ff2698ca0e38d0ed3b8c91befc7a47896` |
| **Explorer** | https://explorer.testnet.arc.io/address/0xecabddeb22f9f2e1851bc59fb5f5648dbba37517 |
| **USDC token** | `0x3600000000000000000000000000000000000000` (6 decimals) |
| **Recipient** | `0x77b335b764Fb49DC15e971AA2994493F518C305E` |

## Contract: TipJar.sol

Key design points:

- `tip(uint256 amount, string calldata message)` — pulls USDC from the caller via `safeTransferFrom`. Reverts on zero amount, messages over 280 chars, and amounts exceeding `uint96.max`. Protected by `ReentrancyGuard`.
- `withdraw()` — recipient-only; transfers the entire USDC balance to the immutable recipient. Reverts if balance is zero.
- `getRecentTips(uint256 limit)` — returns the newest tips first, capped at 50.
- `totalTipped` — cumulative sum of all tips ever received (in USDC base units).
- No upgradeability, no admin rescue, no owner-changeable parameters.

## Running the UI

```bash
npm install
npm run dev
```

The app runs at http://localhost:5173.

All network constants and the deployed address live in `src/tipjar-config.ts`. Update `TIPJAR_ADDRESS` there after redeploying.

## Building for production

```bash
npm run build
```

## Deployment

Live at https://arc-tip-jar.vercel.app. The Vercel project `arc-tip-jar` is connected to this GitHub repository with Root Directory `arc-tip-jar`.

- Pushes to `main` deploy to production automatically
- Each PR gets a preview deployment
- Commits that don't touch this folder skip the build (Ignored Build Step: `git diff --quiet HEAD^ HEAD -- .`)

## Tech stack

- Solidity 0.8.28, Foundry, OpenZeppelin 5.1.0
- Vite + React + TypeScript
- viem (direct EIP-1193 wallet)
- Tailwind CSS, Arc Light design tokens
- Japanese UI

## Foundry tests

```bash
forge test
```

Requires Foundry and `forge install foundry-rs/forge-std` (`lib/` is not committed). Arc Studio reported all 17 unit tests passing, including fuzz runs on the tip function.
