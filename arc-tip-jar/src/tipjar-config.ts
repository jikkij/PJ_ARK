/**
 * TipJar configuration — single source of truth.
 * Update TIPJAR_ADDRESS after redeploying.
 */

export const CHAIN_ID = 5042002;
export const CHAIN_NAME = 'Arc Testnet';
export const RPC_URL = 'https://rpc.testnet.arc.io';
export const EXPLORER_BASE = 'https://explorer.testnet.arc.io';

/** Arc Testnet USDC ERC-20 (6 decimals) */
export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as const;
export const USDC_DECIMALS = 6;

/** Deployed TipJar contract */
export const TIPJAR_ADDRESS = '0xecabddeb22f9f2e1851bc59fb5f5648dbba37517' as const;

/** Pre-specified recipient */
export const RECIPIENT_ADDRESS = '0x77b335b764Fb49DC15e971AA2994493F518C305E' as const;

export const TIPJAR_ABI = [
  {
    type: 'constructor',
    inputs: [
      { name: 'token_', type: 'address' },
      { name: 'recipient_', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'tip',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'message', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdraw',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'tipCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalTipped',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'recipient',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'token',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getRecentTips',
    inputs: [{ name: 'limit', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'from', type: 'address' },
          { name: 'amount', type: 'uint96' },
          { name: 'timestamp', type: 'uint40' },
          { name: 'message', type: 'string' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'Tipped',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'message', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Withdrawn',
    inputs: [{ name: 'amount', type: 'uint256', indexed: false }],
  },
  { type: 'error', name: 'ZeroAddress', inputs: [] },
  { type: 'error', name: 'ZeroAmount', inputs: [] },
  { type: 'error', name: 'MessageTooLong', inputs: [] },
  { type: 'error', name: 'AmountTooLarge', inputs: [] },
  { type: 'error', name: 'NotRecipient', inputs: [] },
  { type: 'error', name: 'ZeroBalance', inputs: [] },
] as const;

export const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const;

export function shortAddress(addr: string): string {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export function explorerAddressUrl(addr: string): string {
  return `${EXPLORER_BASE}/address/${addr}`;
}

export function explorerTxUrl(hash: string): string {
  return `${EXPLORER_BASE}/tx/${hash}`;
}

export function formatUsdc(raw: bigint): string {
  const divisor = 10n ** BigInt(USDC_DECIMALS);
  const whole = raw / divisor;
  const frac = raw % divisor;
  const fracStr = frac.toString().padStart(USDC_DECIMALS, '0').replace(/0+$/, '');
  return fracStr.length > 0 ? `${whole}.${fracStr}` : `${whole}`;
}

export function parseUsdc(value: string): bigint {
  const [whole = '0', frac = ''] = value.split('.');
  const fracPadded = frac.slice(0, USDC_DECIMALS).padEnd(USDC_DECIMALS, '0');
  return BigInt(whole) * 10n ** BigInt(USDC_DECIMALS) + BigInt(fracPadded);
}

export function relativeTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  if (diff < 60) return `${Math.floor(diff)}秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  return `${Math.floor(diff / 86400)}日前`;
}
