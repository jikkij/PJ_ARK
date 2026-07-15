import { arcTestnet } from "@/config/arcTestnet";

interface ExplorerLinkProps {
  address: string;
}

export function ExplorerLink({ address }: ExplorerLinkProps) {
  const explorerUrl = arcTestnet.blockExplorers?.default.url;
  if (!explorerUrl) return null;

  return (
    <a
      href={`${explorerUrl}/address/${address}`}
      target="_blank"
      rel="noreferrer"
    >
      Arcscan Testnetで見る ↗
    </a>
  );
}
