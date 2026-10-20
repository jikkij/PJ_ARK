"use client";

import { AssetList } from "@/components/AssetList";
import { WalletBar } from "@/components/WalletBar";
import { useAssetBalances } from "@/hooks/useAssetBalances";
import { useWallet } from "@/hooks/useWallet";

export default function Home() {
  const wallet = useWallet();
  const { status, official, others, othersError, refresh } = useAssetBalances(
    wallet.address,
  );

  return (
    <main style={{ maxWidth: "640px", width: "100%", margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "1.5rem" }}>Arc Asset Viewer</h1>
      <p style={{ opacity: 0.75, fontSize: "0.9rem", margin: "0.25rem 0 1.5rem" }}>
        ブラウザ拡張のウォレットを接続すると、Arc Testnet上の保有アセット
        (USDC・EURC・USYCなど)を一覧表示します。残高の読み取りのみで、
        署名や送金は行いません。
      </p>

      <WalletBar wallet={wallet} />

      {wallet.errorMessage && (
        <p role="alert" style={{ color: "#e05555", marginTop: "0.75rem" }}>
          {wallet.errorMessage}
        </p>
      )}

      {status === "error" && (
        <p role="alert" style={{ color: "#e05555", marginTop: "1rem" }}>
          残高の取得に失敗しました。RPCが利用可能か確認してください。
        </p>
      )}

      {(status === "loading" || status === "success") && (
        <>
          <div style={{ marginTop: "1rem" }}>
            <button onClick={refresh} disabled={status === "loading"}>
              {status === "loading" ? "更新中…" : "更新"}
            </button>
          </div>

          {status === "success" && (
            <>
              <AssetList
                title="公式アセット"
                assets={official}
                emptyText="—"
              />
              <AssetList
                title="その他のトークン"
                assets={others}
                emptyText={
                  othersError
                    ? "エクスプローラーAPIから取得できませんでした。"
                    : "保有しているその他のERC-20トークンはありません。"
                }
              />
              <p style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "1rem" }}>
                公式アセットはRPCから直接読み取ります。その他のトークンは
                Arc Testnet Explorerの情報で、スパム判定されたトークンは除外しています。
              </p>
            </>
          )}
        </>
      )}
    </main>
  );
}
