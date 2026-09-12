# ERC-8004 Quickstart on Arc Testnet (Viem)

Register an AI agent with onchain identity, record reputation, and verify
validation using the ERC-8004 registries on Arc Testnet.

Source tutorial: https://docs.arc.io/arc/tutorials/register-your-first-ai-agent (Viem tab)

## Contracts (Arc Testnet, chain ID 5042002)

| Contract           | Address                                      |
| ------------------ | -------------------------------------------- |
| IdentityRegistry   | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ReputationRegistry | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| ValidationRegistry | `0x8004Cb1BF31DAf7788923b405b754f57acEB4272` |

## Files

| File                  | Tutorial step | Purpose                                                             |
| --------------------- | ------------- | ------------------------------------------------------------------- |
| `package.json`        | 1.1           | `viem` + `tsx`/`typescript` dev deps, npm scripts                   |
| `tsconfig.json`       | 1.2           | ESNext / bundler resolution                                         |
| `.env.example`        | 1.3           | Template for `OWNER_PRIVATE_KEY`, `VALIDATOR_PRIVATE_KEY`           |
| `generate-wallets.ts` | 2.1           | Generates two throwaway wallets into `.env` (replaces `cast wallet new`) |
| `check-balances.ts`   | 2.1           | Confirms both wallets hold Arc Testnet USDC for gas                 |
| `agent-metadata.json` | 3             | Example agent metadata (upload to IPFS or use the docs example URI) |
| `index.ts`            | 4–7           | Register → retrieve ID → give feedback → validation request/response/status |

## Run

```bash
npm install
```

Generate the owner and validator wallets (writes `.env`; prints addresses only):

```bash
npm run wallets
```

Fund **both** printed addresses with Arc Testnet USDC at https://faucet.circle.com
(select Arc Testnet), then confirm:

```bash
npm run balances
```

Run Steps 4–7 end to end:

```bash
npm run start
```

## Wallet roles (ERC-8004)

- **Owner** registers the agent identity (Step 4) and requests validation (Step 7a).
- **Validator** records reputation (Step 6) and submits the validation response (Step 7b).

Agent owners cannot record reputation for their own agents — that is why two
wallets are required.

## Notes

- Gas on Arc is paid in native USDC (18 decimals); each tx costs roughly 0.006 USDC.
- `METADATA_URI` in `.env` overrides the default docs example URI once you have
  uploaded `agent-metadata.json` to IPFS.
- The hardcoded reputation score (`95`) is for demonstration; production systems
  should compute scores from observed agent behaviour.
- `.env` is gitignored. The generated keys are testnet-only throwaways.
