import { defineChain } from "viem";

// Verified against https://docs.arc.io/arc/references/connect-to-arc on 2026-07-15.
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

// Verified against https://docs.arc.io/arc/references/contract-addresses on 2026-07-15.
export const USDC_ERC20_ADDRESS =
  "0x3600000000000000000000000000000000000000" as const;

export const NATIVE_USDC_DECIMALS = 18;
export const ERC20_USDC_DECIMALS = 6;
