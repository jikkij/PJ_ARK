import { describe, expect, it } from "vitest";
import {
  type ExplorerTokenBalance,
  formatDisplay,
  parseExplorerBalances,
} from "@/lib/assets";
import { KNOWN_TOKENS } from "@/config/arcTestnet";

function entry(
  overrides: Partial<ExplorerTokenBalance["token"]> & { value?: string },
): ExplorerTokenBalance {
  const { value = "1000000000000000000", ...token } = overrides;
  return {
    token: {
      address_hash: "0x1111111111111111111111111111111111111111",
      name: "Test Token",
      symbol: "TST",
      decimals: "18",
      type: "ERC-20",
      reputation: "ok",
      ...token,
    },
    value,
  };
}

describe("parseExplorerBalances", () => {
  it("formats a normal ERC-20 balance with its own decimals", () => {
    const [asset] = parseExplorerBalances([entry({ decimals: "8", value: "150000000" })]);
    expect(asset.formatted).toBe("1.5");
    expect(asset.official).toBe(false);
  });

  it("drops official tokens regardless of address casing", () => {
    const eurc = KNOWN_TOKENS.find((t) => t.symbol === "EURC")!;
    expect(
      parseExplorerBalances([entry({ address_hash: eurc.address.toLowerCase() })]),
    ).toEqual([]);
  });

  it("drops zero balances, NFTs and spam-flagged tokens", () => {
    expect(
      parseExplorerBalances([
        entry({ value: "0" }),
        entry({ type: "ERC-721" }),
        entry({ reputation: "scam" }),
      ]),
    ).toEqual([]);
  });
});

describe("formatDisplay", () => {
  it("groups thousands and trims trailing zeros", () => {
    expect(formatDisplay("1234567.500000")).toBe("1,234,567.5");
    expect(formatDisplay("0")).toBe("0");
  });

  it("caps fraction digits", () => {
    expect(formatDisplay("0.123456789")).toBe("0.123456");
    expect(formatDisplay("0.000000001")).toBe("0");
  });
});
