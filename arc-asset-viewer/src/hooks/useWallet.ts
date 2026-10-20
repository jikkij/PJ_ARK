"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  ARC_CHAIN_ID_HEX,
  getInjectedProvider,
  switchToArcTestnet,
} from "@/lib/wallet";

const noopSubscribe = () => () => {};

export interface UseWalletResult {
  hasProvider: boolean;
  address: `0x${string}` | null;
  isArcTestnet: boolean;
  connecting: boolean;
  errorMessage: string | null;
  connect: () => Promise<void>;
  switchNetwork: () => Promise<void>;
  disconnect: () => void;
}

export function useWallet(): UseWalletResult {
  // false on the server, real value after hydration
  const hasProvider = useSyncExternalStore(
    noopSubscribe,
    () => getInjectedProvider() !== null,
    () => false,
  );
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const provider = getInjectedProvider();
    if (!provider) return;

    // Restore an existing connection silently (no popup).
    provider
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        const [first] = accounts as string[];
        if (first) setAddress(first as `0x${string}`);
      })
      .catch(() => {});
    provider
      .request({ method: "eth_chainId" })
      .then((id) => setChainId(id as string))
      .catch(() => {});

    const onAccountsChanged = (...args: unknown[]) => {
      const [first] = args[0] as string[];
      setAddress(first ? (first as `0x${string}`) : null);
    };
    const onChainChanged = (...args: unknown[]) => setChainId(args[0] as string);

    provider.on?.("accountsChanged", onAccountsChanged);
    provider.on?.("chainChanged", onChainChanged);
    return () => {
      provider.removeListener?.("accountsChanged", onAccountsChanged);
      provider.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  const switchNetwork = useCallback(async () => {
    const provider = getInjectedProvider();
    if (!provider) return;
    setErrorMessage(null);
    try {
      await switchToArcTestnet(provider);
    } catch {
      setErrorMessage("Arc Testnetへの切り替えに失敗しました。");
    }
  }, []);

  const connect = useCallback(async () => {
    const provider = getInjectedProvider();
    if (!provider) return;
    setConnecting(true);
    setErrorMessage(null);
    try {
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];
      setAddress((accounts[0] as `0x${string}`) ?? null);
      const id = (await provider.request({ method: "eth_chainId" })) as string;
      setChainId(id);
      if (id.toLowerCase() !== ARC_CHAIN_ID_HEX) {
        await switchToArcTestnet(provider);
      }
    } catch (error) {
      // 4001 = user rejected the request
      setErrorMessage(
        (error as { code?: number }).code === 4001
          ? "接続がキャンセルされました。"
          : "ウォレットの接続に失敗しました。",
      );
    } finally {
      setConnecting(false);
    }
  }, []);

  // Injected wallets have no programmatic disconnect; just forget locally.
  const disconnect = useCallback(() => setAddress(null), []);

  return {
    hasProvider,
    address,
    isArcTestnet: chainId?.toLowerCase() === ARC_CHAIN_ID_HEX,
    connecting,
    errorMessage,
    connect,
    switchNetwork,
    disconnect,
  };
}
