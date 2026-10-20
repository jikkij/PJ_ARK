import { defineChain } from "viem";

// Verified against https://docs.arc.io/arc/references/connect-to-arc on 2026-10-20.
// Re-check before relying on this in a new project.
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
      http: ["https://rpc.testnet.arc.io"],
      webSocket: ["wss://rpc.testnet.arc.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arc Testnet Explorer",
      url: "https://explorer.testnet.arc.io",
    },
  },
  testnet: true,
});

// Verified against https://docs.arc.io/arc/references/contract-addresses on 2026-07-15.
export const USDC_ERC20_ADDRESS =
  "0x3600000000000000000000000000000000000000" as const;

export const NATIVE_USDC_DECIMALS = 18;
export const ERC20_USDC_DECIMALS = 6;
