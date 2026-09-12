# ERC-8004 Quickstart on Arc Testnet (Circle Wallets)

Register an AI agent with onchain identity, record reputation, and verify
validation using the ERC-8004 registries on Arc Testnet — with Circle
developer-controlled wallets and Gas Station (no wallet funding needed).

Source tutorial: https://docs.arc.io/arc/tutorials/register-your-first-ai-agent (Circle Wallets tab)

For the self-managed-wallet variant see `../erc8004-quickstart/` (Viem tab).

## Contracts (Arc Testnet, chain ID 5042002)

| Contract           | Address                                      |
| ------------------ | -------------------------------------------- |
| IdentityRegistry   | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ReputationRegistry | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| ValidationRegistry | `0x8004Cb1BF31DAf7788923b405b754f57acEB4272` |

## Files

| File                     | Tutorial step | Purpose                                                              |
| ------------------------ | ------------- | -------------------------------------------------------------------- |
| `package.json`           | 1.1           | `@circle-fin/developer-controlled-wallets` + `viem`, npm scripts     |
| `tsconfig.json`          | 1.2           | ESNext / bundler resolution                                          |
| `.env.example`           | 1.3           | Template for `CIRCLE_API_KEY`, `CIRCLE_ENTITY_SECRET`                |
| `setup-entity-secret.ts` | prerequisite  | One-time: generate + register entity secret, save recovery file      |
| `agent-metadata.json`    | 3             | Example agent metadata (upload to IPFS or use the docs example URI)  |
| `index.ts`               | 2, 4–7        | Create wallets → register → retrieve ID → give feedback → validation |

## Prerequisites

- A [Circle Developer Console](https://console.circle.com) account
- An API key: Keys → Create a key → API key → Standard Key
- An entity secret (generated below, or in the Console)

## Run

```bash
npm install
cp .env.example .env
```

1. Paste your Circle API key into `.env` as `CIRCLE_API_KEY` (edit the file in
   your editor so the key does not end up in shell history).

2. If you have **not** registered an entity secret yet, generate and register one
   (one-time only; writes `CIRCLE_ENTITY_SECRET` into `.env` and saves the
   recovery file under `recovery/`):

```bash
npm run entity-secret
```

   If you already registered one in the Console, paste it into `.env` instead.

3. Run Steps 2–7 end to end:

```bash
npm run start
```

Each run creates a new wallet set with two SCA wallets. To reuse wallets across
runs, copy the printed addresses into `.env` as `OWNER_WALLET_ADDRESS` and
`VALIDATOR_WALLET_ADDRESS`.

## Wallet roles (ERC-8004)

- **Owner** registers the agent identity (Step 4) and requests validation (Step 7a).
- **Validator** records reputation (Step 6) and submits the validation response (Step 7b).

Agent owners cannot record reputation for their own agents — that is why two
wallets are required.

## Notes

- Transactions are submitted through Circle's API and polled until `COMPLETE`;
  the onchain hash is then used with viem to read events and contract state.
- Gas (~0.006 USDC per tx) is sponsored by Circle Gas Station on testnet.
- `METADATA_URI` in `.env` overrides the default docs example URI once you have
  uploaded `agent-metadata.json` to IPFS.
- The hardcoded reputation score (`95`) is for demonstration; production systems
  should compute scores from observed agent behaviour.
- `.env` and `recovery/` are gitignored. Back up the recovery file outside the
  repo — it is the only way to reset a lost entity secret.
