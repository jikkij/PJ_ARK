"use client";

import { useState } from "react";
import { AddressInput } from "@/components/AddressInput";
import { BalanceCard } from "@/components/BalanceCard";
import { ExplorerLink } from "@/components/ExplorerLink";
import { RefreshButton } from "@/components/RefreshButton";
import { useUsdcBalances } from "@/hooks/useUsdcBalances";

export default function Home() {
  const [address, setAddress] = useState<string | null>(null);
  const { status, gasUsdc, tokenUsdc, errorMessage, fetchBalances } =
    useUsdcBalances();

  const handleSubmit = (input: string) => {
    setAddress(input);
    fetchBalances(input);
  };

  const handleRefresh = () => {
    if (address) fetchBalances(address);
  };

  return (
    <main style={{ maxWidth: "640px", margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "1.5rem" }}>Arc USDC Balance Viewer</h1>
      <p style={{ opacity: 0.75, fontSize: "0.9rem" }}>
        Arc Testnet上のアドレスのUSDC残高を、Gas用(native, 18 decimals)と
        Token用(ERC-20, 6 decimals)に分けて表示します。読み取り専用で、
        秘密鍵やウォレット接続は必要ありません。
      </p>

      <div style={{ margin: "1.5rem 0" }}>
        <AddressInput onSubmit={handleSubmit} disabled={status === "loading"} />
      </div>

      {status === "error" && (
        <p role="alert" style={{ color: "#e05555" }}>
          {errorMessage}
        </p>
      )}

      {(status === "success" || status === "loading") && (
        <>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <BalanceCard
              label="Gas USDC (native)"
              sublabel="18 decimals · ガス支払い用残高"
              value={gasUsdc}
            />
            <BalanceCard
              label="Token USDC (ERC-20)"
              sublabel="6 decimals · アプリ送金用残高"
              value={tokenUsdc}
            />
          </div>

          {tokenUsdc === "0.0" || tokenUsdc === "0" ? (
            <p style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: "0.5rem" }}>
              注: Token USDC(ERC-20)が0と表示されていても、
              10⁻⁶未満のNative USDCが存在する場合があります。
            </p>
          ) : null}

          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              gap: "1rem",
              alignItems: "center",
            }}
          >
            <RefreshButton onClick={handleRefresh} disabled={status === "loading"} />
            {address && <ExplorerLink address={address} />}
          </div>
        </>
      )}
    </main>
  );
}
