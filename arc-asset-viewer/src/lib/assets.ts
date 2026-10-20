import { erc20Abi, formatUnits } from "viem";
import { publicClient } from "@/lib/client";
import {
  EXPLORER_API_URL,
  KNOWN_TOKENS,
  NATIVE_USDC_DECIMALS,
} from "@/config/arcTestnet";

export interface AssetBalance {
  key: string;
  symbol: string;
  name: string;
  /** null for the native gas token */
  address: `0x${string}` | null;
  decimals: number;
  raw: bigint;
  formatted: string;
  /** true for native USDC and the tokens listed in the Arc docs */
  official: boolean;
}

/** Shape of one entry from Blockscout's /addresses/{hash}/token-balances. */
export interface ExplorerTokenBalance {
  token: {
    address_hash: string;
    name: string | null;
    symbol: string | null;
    decimals: string | null;
    type: string;
    reputation?: string | null;
  };
  value: string;
}

export async function getNativeBalance(
  address: `0x${string}`,
): Promise<AssetBalance> {
  const raw = await publicClient.getBalance({ address });
  return {
    key: "native",
    symbol: "USDC",
    name: "USDC (native · ガス用)",
    address: null,
    decimals: NATIVE_USDC_DECIMALS,
    raw,
    formatted: formatUnits(raw, NATIVE_USDC_DECIMALS),
    official: true,
  };
}

export async function getKnownTokenBalances(
  address: `0x${string}`,
): Promise<AssetBalance[]> {
  return Promise.all(
    KNOWN_TOKENS.map(async (token) => {
      const raw = await publicClient.readContract({
        address: token.address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      });
      return {
        key: token.address.toLowerCase(),
        symbol: token.symbol,
        name: token.name,
        address: token.address,
        decimals: token.decimals,
        raw,
        formatted: formatUnits(raw, token.decimals),
        official: true,
      };
    }),
  );
}

/**
 * Converts explorer entries into balances, dropping official tokens (already
 * read over RPC), non-ERC-20 entries, zero balances, and tokens the explorer
 * does not flag as reputation "ok" (spam filter).
 */
export function parseExplorerBalances(
  entries: ExplorerTokenBalance[],
): AssetBalance[] {
  const knownAddresses = new Set(
    KNOWN_TOKENS.map((t) => t.address.toLowerCase()),
  );

  return entries.flatMap((entry) => {
    const { token } = entry;
    const key = token.address_hash.toLowerCase();
    if (token.type !== "ERC-20") return [];
    if (knownAddresses.has(key)) return [];
    if (token.reputation && token.reputation !== "ok") return [];

    const raw = BigInt(entry.value);
    if (raw === BigInt(0)) return [];

    const decimals = Number(token.decimals ?? "0");
    return [
      {
        key,
        symbol: token.symbol ?? "???",
        name: token.name ?? "Unknown token",
        address: token.address_hash as `0x${string}`,
        decimals,
        raw,
        formatted: formatUnits(raw, decimals),
        official: false,
      },
    ];
  });
}

export async function getOtherTokenBalances(
  address: `0x${string}`,
): Promise<AssetBalance[]> {
  const res = await fetch(
    `${EXPLORER_API_URL}/addresses/${address}/token-balances`,
  );
  // An address the explorer has never seen returns 404: treat as no tokens.
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Explorer API error: ${res.status}`);
  const entries = (await res.json()) as ExplorerTokenBalance[];
  return parseExplorerBalances(entries);
}

/** Formats a decimal string with grouping and at most `maxFraction` digits. */
export function formatDisplay(formatted: string, maxFraction = 6): string {
  const [whole, fraction = ""] = formatted.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const trimmed = fraction.slice(0, maxFraction).replace(/0+$/, "");
  return trimmed ? `${grouped}.${trimmed}` : grouped;
}
