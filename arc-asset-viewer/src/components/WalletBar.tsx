import { arcTestnet } from "@/config/arcTestnet";
import type { UseWalletResult } from "@/hooks/useWallet";

function shorten(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletBar({ wallet }: { wallet: UseWalletResult }) {
  if (!wallet.hasProvider) {
    return (
      <p role="alert">
        ブラウザ拡張のウォレット(MetaMask、Rabbyなど)が見つかりません。
        インストールしてからページを再読み込みしてください。
      </p>
    );
  }

  if (!wallet.address) {
    return (
      <button onClick={wallet.connect} disabled={wallet.connecting}>
        {wallet.connecting ? "接続中…" : "ウォレットを接続"}
      </button>
    );
  }

  return (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
      <a
        href={`${arcTestnet.blockExplorers.default.url}/address/${wallet.address}`}
        target="_blank"
        rel="noreferrer"
        title={wallet.address}
        style={{ fontFamily: "monospace", textDecoration: "underline" }}
      >
        {shorten(wallet.address)} ↗
      </a>
      {wallet.isArcTestnet ? (
        <span style={{ fontSize: "0.8rem", color: "#3fb950" }}>● Arc Testnet</span>
      ) : (
        <button onClick={wallet.switchNetwork}>Arc Testnetに切り替え</button>
      )}
      <button onClick={wallet.disconnect}>切断</button>
    </div>
  );
}
