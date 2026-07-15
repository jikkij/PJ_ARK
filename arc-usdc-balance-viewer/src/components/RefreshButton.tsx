interface RefreshButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function RefreshButton({ onClick, disabled }: RefreshButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {disabled ? "更新中…" : "更新"}
    </button>
  );
}
