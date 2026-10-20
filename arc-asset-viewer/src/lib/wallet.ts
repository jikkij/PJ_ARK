import { numberToHex } from "viem";
import { arcTestnet } from "@/config/arcTestnet";

/** Minimal EIP-1193 provider injected by browser wallets (MetaMask, Rabby, …). */
export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export const ARC_CHAIN_ID_HEX = numberToHex(arcTestnet.id);

export function getInjectedProvider(): Eip1193Provider | null {
  if (typeof window === "undefined") return null;
  return window.ethereum ?? null;
}

/** Asks the wallet to switch to Arc Testnet, adding it first if unknown. */
export async function switchToArcTestnet(provider: Eip1193Provider) {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_CHAIN_ID_HEX }],
    });
  } catch (error) {
    // 4902 = chain not added to the wallet yet
    if ((error as { code?: number }).code !== 4902) throw error;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: ARC_CHAIN_ID_HEX,
          chainName: arcTestnet.name,
          nativeCurrency: arcTestnet.nativeCurrency,
          rpcUrls: arcTestnet.rpcUrls.default.http,
          blockExplorerUrls: [arcTestnet.blockExplorers.default.url],
        },
      ],
    });
  }
}
