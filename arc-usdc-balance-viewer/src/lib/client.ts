import { createPublicClient, http } from "viem";
import { arcTestnet } from "@/config/arcTestnet";

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});
