"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type AssetBalance,
  getKnownTokenBalances,
  getNativeBalance,
  getOtherTokenBalances,
} from "@/lib/assets";

type Status = "idle" | "loading" | "success" | "error";

export interface UseAssetBalancesResult {
  status: Status;
  official: AssetBalance[];
  others: AssetBalance[];
  /** set when the explorer lookup failed but RPC balances loaded */
  othersError: boolean;
  refresh: () => void;
}

interface FetchResult {
  /** `${address}:${nonce}` the result belongs to */
  requestKey: string;
  ok: boolean;
  official: AssetBalance[];
  others: AssetBalance[];
  othersError: boolean;
}

export function useAssetBalances(
  address: `0x${string}` | null,
): UseAssetBalancesResult {
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<FetchResult | null>(null);
  const requestKey = address ? `${address}:${nonce}` : null;

  useEffect(() => {
    if (!address || !requestKey) return;
    let cancelled = false;

    (async () => {
      const [rpcResult, explorerResult] = await Promise.allSettled([
        Promise.all([getNativeBalance(address), getKnownTokenBalances(address)]),
        getOtherTokenBalances(address),
      ]);
      if (cancelled) return;

      if (rpcResult.status === "rejected") {
        setResult({ requestKey, ok: false, official: [], others: [], othersError: false });
        return;
      }
      const [native, known] = rpcResult.value;
      setResult({
        requestKey,
        ok: true,
        official: [native, ...known],
        others: explorerResult.status === "fulfilled" ? explorerResult.value : [],
        othersError: explorerResult.status === "rejected",
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [address, requestKey]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  // Status is derived: a result only counts if it matches the current request.
  const current = result && result.requestKey === requestKey ? result : null;
  const status: Status = !address
    ? "idle"
    : !current
      ? "loading"
      : current.ok
        ? "success"
        : "error";

  return {
    status,
    official: current?.official ?? [],
    others: current?.others ?? [],
    othersError: current?.othersError ?? false,
    refresh,
  };
}
