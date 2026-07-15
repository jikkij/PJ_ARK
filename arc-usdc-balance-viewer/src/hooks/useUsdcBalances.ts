"use client";

import { useCallback, useState } from "react";
import { getUsdcBalances, isValidArcAddress } from "@/lib/balances";

type Status = "idle" | "loading" | "success" | "error";

export interface UseUsdcBalancesResult {
  status: Status;
  gasUsdc: string | null;
  tokenUsdc: string | null;
  errorMessage: string | null;
  fetchBalances: (address: string) => Promise<void>;
}

export function useUsdcBalances(): UseUsdcBalancesResult {
  const [status, setStatus] = useState<Status>("idle");
  const [gasUsdc, setGasUsdc] = useState<string | null>(null);
  const [tokenUsdc, setTokenUsdc] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchBalances = useCallback(async (address: string) => {
    if (!isValidArcAddress(address)) {
      setStatus("error");
      setErrorMessage("有効なアドレスを入力してください。");
      setGasUsdc(null);
      setTokenUsdc(null);
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const balances = await getUsdcBalances(address);
      setGasUsdc(balances.gasUsdc);
      setTokenUsdc(balances.tokenUsdc);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage(
        "残高の取得に失敗しました。RPCが利用可能か確認してください。",
      );
      setGasUsdc(null);
      setTokenUsdc(null);
    }
  }, []);

  return { status, gasUsdc, tokenUsdc, errorMessage, fetchBalances };
}
