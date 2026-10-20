import { defineChain } from "viem";

// Verified against https://docs.arc.io/arc/references/connect-to-arc on 2026-10-20.
// testnet.arcscan.app now 301-redirects to explorer.testnet.arc.io (checked 2026-10-20).
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

export const EXPLORER_API_URL = "https://explorer.testnet.arc.io/api/v2";

export interface KnownToken {
  symbol: string;
  name: string;
  address: `0x${string}`;
  decimals: number;
}

// Verified against https://docs.arc.io/arc/references/contract-addresses on 2026-10-20.
// Re-check before relying on this in a new project.
export const KNOWN_TOKENS: readonly KnownToken[] = [
  {
    symbol: "USDC",
    name: "USD Coin (ERC-20)",
    address: "0x3600000000000000000000000000000000000000",
    decimals: 6,
  },
  {
    symbol: "EURC",
    name: "Euro Coin",
    address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    decimals: 6,
  },
  {
    symbol: "USYC",
    name: "US Yield Coin",
    address: "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C",
    decimals: 6,
  },
  {
    symbol: "cirBTC",
    name: "Circle Bitcoin",
    address: "0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF",
    decimals: 8,
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether (bridged)",
    address: "0x2c4047028a72803939b6fb674D01bC059B5C4961",
    decimals: 18,
  },
];

export const NATIVE_USDC_DECIMALS = 18;
