"use client";

import { useState } from "react";

interface AddressInputProps {
  onSubmit: (address: string) => void;
  disabled?: boolean;
}

export function AddressInput({ onSubmit, disabled }: AddressInputProps) {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value.trim());
      }}
      style={{ display: "flex", gap: "0.5rem" }}
    >
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="0x..."
        disabled={disabled}
        style={{ flex: 1, padding: "0.5rem", fontFamily: "monospace" }}
      />
      <button type="submit" disabled={disabled || value.trim().length === 0}>
        残高を確認
      </button>
    </form>
  );
}
