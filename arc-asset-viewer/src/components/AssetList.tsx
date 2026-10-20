import { arcTestnet } from "@/config/arcTestnet";
import { type AssetBalance, formatDisplay } from "@/lib/assets";

interface AssetListProps {
  title: string;
  assets: AssetBalance[];
  emptyText: string;
}

export function AssetList({ title, assets, emptyText }: AssetListProps) {
  const explorerUrl = arcTestnet.blockExplorers.default.url;

  return (
    <section style={{ marginTop: "1.5rem" }}>
      <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>{title}</h2>
      {assets.length === 0 ? (
        <p style={{ fontSize: "0.85rem", opacity: 0.6 }}>{emptyText}</p>
      ) : (
        <ul style={{ listStyle: "none", border: "1px solid #444", borderRadius: "8px" }}>
          {assets.map((asset, i) => (
            <li
              key={asset.key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                padding: "0.75rem 1rem",
                borderTop: i === 0 ? "none" : "1px solid #333",
                opacity: asset.raw === BigInt(0) ? 0.5 : 1,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{asset.symbol}</div>
                <div style={{ fontSize: "0.75rem", opacity: 0.65 }}>
                  {asset.address ? (
                    <a
                      href={`${explorerUrl}/token/${asset.address}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: "underline" }}
                    >
                      {asset.name}
                    </a>
                  ) : (
                    asset.name
                  )}{" "}
                  · {asset.decimals} decimals
                </div>
              </div>
              <div
                title={asset.formatted}
                style={{ fontFamily: "monospace", fontSize: "1.1rem", textAlign: "right" }}
              >
                {formatDisplay(asset.formatted)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
