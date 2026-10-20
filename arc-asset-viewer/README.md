# Arc Asset Viewer

ブラウザ拡張のウォレット(MetaMask、Rabbyなど)を接続して、Arc Testnet上の保有アセットを一覧表示する読み取り専用のWebアプリです。[arc-usdc-balance-viewer](../arc-usdc-balance-viewer) を拡張したものです。

## 表示するアセット

- **公式アセット**: RPCから直接読み取り
  - USDC (native, 18 decimals · ガス用)
  - USDC (ERC-20), EURC, USYC, cirBTC, WETH — アドレスは [Arc docs](https://docs.arc.io/arc/references/contract-addresses) を参照 (`src/config/arcTestnet.ts`)
- **その他のトークン**: Arc Testnet Explorer (Blockscout) の `/api/v2/addresses/{address}/token-balances` から取得。残高0、ERC-20以外、スパム判定(reputation ≠ ok)は除外

接続時にウォレットがArc Testnet (chainId 5042002) 以外なら切り替え、未登録ならチェーン追加をリクエストします。署名や送金は行いません。

## 起動

```bash
npm install
npm run dev
```

http://localhost:3000 を、ウォレット拡張が入ったブラウザで開いてください。

## テスト

```bash
npm test
```

## デプロイ

https://arc-asset-viewer.vercel.app で公開しています。Vercelプロジェクト `arc-asset-viewer` はGitHubリポジトリと連携していて、Root Directoryは `arc-asset-viewer` です。

- `main` へのpushで本番に自動デプロイされます
- PRごとにプレビューデプロイが作られます
- このフォルダに変更がないコミットではビルドをスキップします(Ignored Build Step: `git diff --quiet HEAD^ HEAD -- .`)
