interface BalanceCardProps {
  label: string;
  sublabel: string;
  value: string | null;
}

export function BalanceCard({ label, sublabel, value }: BalanceCardProps) {
  return (
    <div
      style={{
        border: "1px solid #444",
        borderRadius: "8px",
        padding: "1rem",
        minWidth: "200px",
      }}
    >
      <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontFamily: "monospace" }}>
        {value ?? "—"}
      </div>
      <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>{sublabel}</div>
    </div>
  );
}
