import { describe, expect, it } from "vitest";
import { formatUnits } from "viem";
import { isValidArcAddress } from "@/lib/balances";
import { ERC20_USDC_DECIMALS, NATIVE_USDC_DECIMALS } from "@/config/arcTestnet";

describe("isValidArcAddress", () => {
  it("accepts a well-formed lowercase address", () => {
    expect(
      isValidArcAddress("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"),
    ).toBe(true);
  });

  it("rejects an obviously malformed address", () => {
    expect(isValidArcAddress("not-an-address")).toBe(false);
    expect(isValidArcAddress("0x123")).toBe(false);
    expect(isValidArcAddress("")).toBe(false);
  });
});

describe("decimals conversion", () => {
  it("formats native gas USDC with 18 decimals", () => {
    expect(NATIVE_USDC_DECIMALS).toBe(18);
    expect(formatUnits(BigInt("1000000000000000000"), NATIVE_USDC_DECIMALS)).toBe("1");
    expect(formatUnits(BigInt("500000000000000000"), NATIVE_USDC_DECIMALS)).toBe("0.5");
  });

  it("formats ERC-20 USDC with 6 decimals", () => {
    expect(ERC20_USDC_DECIMALS).toBe(6);
    expect(formatUnits(BigInt("1000000"), ERC20_USDC_DECIMALS)).toBe("1");
    expect(formatUnits(BigInt("500000"), ERC20_USDC_DECIMALS)).toBe("0.5");
  });

  it("never mixes native and ERC-20 raw values without converting", () => {
    const rawAmount = BigInt("1000000000000000000"); // 1 native USDC
    const nativeFormatted = formatUnits(rawAmount, NATIVE_USDC_DECIMALS);
    const misreadAsErc20 = formatUnits(rawAmount, ERC20_USDC_DECIMALS);
    expect(nativeFormatted).toBe("1");
    expect(misreadAsErc20).not.toBe(nativeFormatted);
  });
});
