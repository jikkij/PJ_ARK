import { erc20Abi, formatUnits, isAddress } from "viem";
import { publicClient } from "@/lib/client";
import {
  ERC20_USDC_DECIMALS,
  NATIVE_USDC_DECIMALS,
  USDC_ERC20_ADDRESS,
} from "@/config/arcTestnet";

export interface UsdcBalances {
  gasUsdc: string;
  tokenUsdc: string;
}

export function isValidArcAddress(address: string): address is `0x${string}` {
  return isAddress(address);
}

export async function getNativeGasBalance(
  address: `0x${string}`,
): Promise<string> {
  const rawBalance = await publicClient.getBalance({ address });
  return formatUnits(rawBalance, NATIVE_USDC_DECIMALS);
}

export async function getErc20UsdcBalance(
  address: `0x${string}`,
): Promise<string> {
  const rawBalance = await publicClient.readContract({
    address: USDC_ERC20_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  });
  return formatUnits(rawBalance, ERC20_USDC_DECIMALS);
}

export async function getUsdcBalances(
  address: `0x${string}`,
): Promise<UsdcBalances> {
  const [gasUsdc, tokenUsdc] = await Promise.all([
    getNativeGasBalance(address),
    getErc20UsdcBalance(address),
  ]);
  return { gasUsdc, tokenUsdc };
}
