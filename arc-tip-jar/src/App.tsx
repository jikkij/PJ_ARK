import { useState, useEffect, useCallback } from 'react'
import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { ExternalLink, Loader2, Gift, ArrowDownToLine, RefreshCw } from 'lucide-react'
import {
  CHAIN_ID,
  CHAIN_NAME,
  RPC_URL,
  EXPLORER_BASE,
  USDC_ADDRESS,
  TIPJAR_ADDRESS,
  TIPJAR_ABI,
  ERC20_ABI,
  shortAddress,
  explorerAddressUrl,
  explorerTxUrl,
  formatUsdc,
  parseUsdc,
  relativeTime,
  RECIPIENT_ADDRESS,
} from './tipjar-config'

// ---------- types ----------
interface TipRecord {
  from: string
  amount: bigint
  timestamp: number
  message: string
}

interface ContractState {
  jarBalance: bigint
  totalTipped: bigint
  userBalance: bigint
  tips: TipRecord[]
}

type TxStep = 'idle' | 'approve-pending' | 'approve-confirming' | 'tip-pending' | 'tip-confirming' | 'success' | 'error'
type WithdrawStep = 'idle' | 'pending' | 'confirming' | 'success' | 'error'

// ---------- viem clients ----------
const arcChain = {
  id: CHAIN_ID,
  name: CHAIN_NAME,
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: { default: { name: 'ArcScan', url: EXPLORER_BASE } },
} as const

const publicClient = createPublicClient({ chain: arcChain, transport: http(RPC_URL) })

// ---------- glass style tokens ----------
const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.64)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.68)',
  boxShadow: '0 8px 32px rgba(18,45,69,0.08), inset 0 1px 0 rgba(255,255,255,0.55)',
}

const glassInner: React.CSSProperties = {
  background: 'rgba(255,255,255,0.46)',
  border: '1px solid rgba(255,255,255,0.56)',
}

const spectral = 'linear-gradient(90deg, #5fbeff, #af8ff4, #f05c6b, #ffcd83, #7ef1b3)'

// ---------- helpers ----------
function getEip1193Provider(): { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } | null {
  const w = window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }
  return w.ethereum ?? null
}

// ---------- component ----------
export default function App() {
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [connecting, setConnecting] = useState(false)

  const [state, setState] = useState<ContractState>({
    jarBalance: 0n,
    totalTipped: 0n,
    userBalance: 0n,
    tips: [],
  })
  const [loading, setLoading] = useState(false)

  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [txStep, setTxStep] = useState<TxStep>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txError, setTxError] = useState<string | null>(null)

  const [withdrawStep, setWithdrawStep] = useState<WithdrawStep>('idle')
  const [withdrawHash, setWithdrawHash] = useState<string | null>(null)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)

  const isRecipient = account?.toLowerCase() === RECIPIENT_ADDRESS.toLowerCase()
  const wrongChain = chainId !== null && chainId !== CHAIN_ID

  // ---------- read contract state ----------
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [jarBalance, totalTipped, rawTips] = await Promise.all([
        publicClient.readContract({ address: USDC_ADDRESS, abi: ERC20_ABI, functionName: 'balanceOf', args: [TIPJAR_ADDRESS] }),
        publicClient.readContract({ address: TIPJAR_ADDRESS, abi: TIPJAR_ABI, functionName: 'totalTipped' }),
        publicClient.readContract({ address: TIPJAR_ADDRESS, abi: TIPJAR_ABI, functionName: 'getRecentTips', args: [20n] }),
      ])

      let userBalance = 0n
      if (account) {
        userBalance = await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [account as `0x${string}`],
        })
      }

      const rawTipsArr = rawTips as unknown as ReadonlyArray<{ from: string; amount: bigint; timestamp: bigint; message: string }>
      const tips: TipRecord[] = rawTipsArr.map((t) => ({
        from: t.from,
        amount: BigInt(t.amount),
        timestamp: Number(t.timestamp),
        message: t.message,
      }))

      setState({ jarBalance: jarBalance, totalTipped: totalTipped, userBalance, tips })
    } catch (e) {
      console.error('refresh error', e)
    } finally {
      setLoading(false)
    }
  }, [account])

  // eslint-disable-next-line react/set-state-in-effect -- data-fetch on mount/account-change is intentional
  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!cancelled) await refresh()
    })()
    return () => { cancelled = true }
  }, [refresh])

  // ---------- wallet connect ----------
  async function connect() {
    const provider = getEip1193Provider()
    if (!provider) {
      alert('ウォレットが見つかりません。MetaMaskなどのブラウザウォレットをインストールしてください。')
      return
    }
    setConnecting(true)
    try {
      const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[]
      const rawChainId = (await provider.request({ method: 'eth_chainId' })) as string
      setAccount(accounts[0])
      setChainId(parseInt(rawChainId, 16))

      provider.request = provider.request // keep ref
      // listen for changes
      const eth = provider as unknown as {
        on: (event: string, handler: (...args: unknown[]) => void) => void
      }
      eth.on('accountsChanged', (accs: unknown) => {
        const newAccs = accs as string[]
        setAccount(newAccs[0] ?? null)
      })
      eth.on('chainChanged', (cid: unknown) => {
        setChainId(parseInt(cid as string, 16))
      })
    } catch (e) {
      console.error('connect error', e)
    } finally {
      setConnecting(false)
    }
  }

  // ---------- switch chain ----------
  async function switchToArc() {
    const provider = getEip1193Provider()
    if (!provider) return
    const hexChainId = '0x' + CHAIN_ID.toString(16)
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexChainId }] })
      setChainId(CHAIN_ID)
    } catch (err: unknown) {
      const e = err as { code?: number }
      if (e?.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: hexChainId,
              chainName: CHAIN_NAME,
              nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
              rpcUrls: [RPC_URL],
              blockExplorerUrls: [EXPLORER_BASE],
            }],
          })
          setChainId(CHAIN_ID)
        } catch (addErr) {
          console.error('addChain error', addErr)
        }
      }
    }
  }

  // ---------- tip flow ----------
  async function handleTip() {
    if (!account || !amount || parseFloat(amount) <= 0) return
    const provider = getEip1193Provider()
    if (!provider) return

    setTxError(null)
    setTxHash(null)

    const amountBigint = parseUsdc(amount)

    try {
      const walletClient = createWalletClient({ account: account as `0x${string}`, chain: arcChain, transport: custom(provider) })

      // check allowance
      setTxStep('approve-pending')
      const allowance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [account as `0x${string}`, TIPJAR_ADDRESS],
      })

      if (allowance < amountBigint) {
        setTxStep('approve-pending')
        const approveTx = await walletClient.writeContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [TIPJAR_ADDRESS, amountBigint],
        })
        setTxStep('approve-confirming')
        await publicClient.waitForTransactionReceipt({ hash: approveTx })
      }

      setTxStep('tip-pending')
      const tipTx = await walletClient.writeContract({
        address: TIPJAR_ADDRESS,
        abi: TIPJAR_ABI,
        functionName: 'tip',
        args: [amountBigint, message],
      })
      setTxStep('tip-confirming')
      await publicClient.waitForTransactionReceipt({ hash: tipTx })

      setTxHash(tipTx)
      setTxStep('success')
      setAmount('')
      setMessage('')
      await refresh()
    } catch (e: unknown) {
      console.error('tip error', e)
      const err = e as { shortMessage?: string; message?: string }
      setTxError(err.shortMessage ?? err.message ?? '不明なエラーが発生しました')
      setTxStep('error')
    }
  }

  // ---------- withdraw flow ----------
  async function handleWithdraw() {
    if (!account) return
    const provider = getEip1193Provider()
    if (!provider) return

    setWithdrawError(null)
    setWithdrawHash(null)
    setWithdrawStep('pending')

    try {
      const walletClient = createWalletClient({ account: account as `0x${string}`, chain: arcChain, transport: custom(provider) })
      const withdrawTx = await walletClient.writeContract({
        address: TIPJAR_ADDRESS,
        abi: TIPJAR_ABI,
        functionName: 'withdraw',
      })
      setWithdrawStep('confirming')
      await publicClient.waitForTransactionReceipt({ hash: withdrawTx })
      setWithdrawHash(withdrawTx)
      setWithdrawStep('success')
      await refresh()
    } catch (e: unknown) {
      console.error('withdraw error', e)
      const err = e as { shortMessage?: string; message?: string }
      setWithdrawError(err.shortMessage ?? err.message ?? '不明なエラーが発生しました')
      setWithdrawStep('error')
    }
  }

  // ---------- tip button label ----------
  function tipButtonLabel() {
    if (!account) return 'ウォレットを接続'
    if (wrongChain) return 'Arc Testnetに切り替え'
    if (txStep === 'approve-pending') return (
      <span className="flex items-center justify-center gap-2">
        <Loader2 className="size-4 animate-spin" />
        承認を確認中...
      </span>
    )
    if (txStep === 'approve-confirming') return (
      <span className="flex items-center justify-center gap-2">
        <Loader2 className="size-4 animate-spin" />
        承認を待っています...
      </span>
    )
    if (txStep === 'tip-pending') return (
      <span className="flex items-center justify-center gap-2">
        <Loader2 className="size-4 animate-spin" />
        ウォレットで確認してください...
      </span>
    )
    if (txStep === 'tip-confirming') return (
      <span className="flex items-center justify-center gap-2">
        <Loader2 className="size-4 animate-spin" />
        確認中...
      </span>
    )
    return 'チップを送る'
  }

  const tipBusy = ['approve-pending', 'approve-confirming', 'tip-pending', 'tip-confirming'].includes(txStep)
  const canTip = !tipBusy && !!account && !wrongChain && parseFloat(amount || '0') > 0

  // ---------- render ----------
  return (
    <div
      className="relative min-h-dvh overflow-hidden"
      style={{ background: 'var(--bg-gradient)' }}
    >
      {/* ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '6%', left: '4%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(133,177,237,0.20) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '6%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,205,131,0.18) 0%, transparent 70%)', filter: 'blur(56px)' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-md px-4 pb-12 pt-6">

        {/* header */}
        <header className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="size-5" style={{ color: 'var(--accent)' }} />
            <span className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>チップジャー</span>
          </div>
          {account ? (
            <span className="mono rounded-full px-3 py-1 text-xs font-medium" style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}>
              {shortAddress(account)}
            </span>
          ) : (
            <button
              onClick={() => { void connect() }}
              disabled={connecting}
              className="rounded-full px-4 py-2 text-xs font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {connecting ? '接続中...' : 'ウォレット接続'}
            </button>
          )}
        </header>

        {/* wrong chain banner */}
        {wrongChain && (
          <div className="mb-4 rounded-2xl p-3 text-center text-sm font-medium" style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)' }}>
            Arc Testnetに接続してください。
            <button onClick={() => { void switchToArc() }} className="ml-2 underline font-semibold">切り替える</button>
          </div>
        )}

        {/* hero balance card */}
        <section className="mb-3 rounded-3xl p-5" style={glassCard}>
          <div style={{ height: 3, borderRadius: 2, background: spectral, marginBottom: 16 }} />
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide" style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ジャーの残高
            </span>
            <button onClick={() => { void refresh() }} disabled={loading} className="p-1 rounded-full transition-opacity hover:opacity-70 disabled:opacity-40">
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} style={{ color: 'var(--subtle)' }} />
            </button>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="display text-4xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
              {loading ? '...' : formatUsdc(state.jarBalance)}
            </span>
            <span className="text-base font-medium" style={{ color: 'var(--subtle)' }}>USDC</span>
          </div>
          <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
            累計チップ: {loading ? '...' : formatUsdc(state.totalTipped)} USDC
          </p>

          {/* recipient row */}
          <div className="mt-3 flex items-center gap-1.5 rounded-xl px-3 py-2" style={glassInner}>
            <span className="text-xs" style={{ color: 'var(--subtle)' }}>受取先:</span>
            <a
              href={explorerAddressUrl(RECIPIENT_ADDRESS)}
              target="_blank"
              rel="noreferrer"
              className="mono text-xs font-medium flex items-center gap-0.5 hover:underline"
              style={{ color: 'var(--accent-hover)' }}
            >
              {shortAddress(RECIPIENT_ADDRESS)}
              <ExternalLink className="size-3" />
            </a>
          </div>

          {account && (
            <div className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
              あなたの残高: <span className="tabular-nums font-semibold" style={{ color: 'var(--ink-2)' }}>
                {loading ? '...' : formatUsdc(state.userBalance)} USDC
              </span>
            </div>
          )}
        </section>

        {/* tip form */}
        <section className="mb-3 rounded-3xl p-5" style={glassCard}>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--ink)' }}>チップを送る</h2>

          {/* amount input */}
          <div className="mb-3 rounded-2xl p-4" style={glassInner}>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, '')
                if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v)
              }}
              placeholder="0.00"
              className="display w-full bg-transparent text-4xl font-bold tabular-nums outline-none placeholder:opacity-25"
              style={{ color: 'var(--ink)' }}
              aria-label="チップ金額 (USDC)"
            />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: 'var(--subtle)' }}>USDC</span>
              {account && !loading && state.userBalance > 0n && (
                <button
                  onClick={() => setAmount(formatUsdc(state.userBalance))}
                  className="text-xs font-semibold transition-opacity hover:opacity-70"
                  style={{ color: 'var(--accent-hover)' }}
                >
                  残高: {formatUsdc(state.userBalance)} · 全額
                </button>
              )}
            </div>
          </div>

          {/* message input */}
          <div className="mb-4 rounded-2xl p-3" style={glassInner}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 280))}
              placeholder="メッセージを添えて（任意、最大280文字）"
              rows={2}
              className="w-full bg-transparent text-sm outline-none resize-none placeholder:opacity-40"
              style={{ color: 'var(--ink-2)' }}
              aria-label="チップメッセージ"
            />
            <div className="text-right text-xs tabular-nums" style={{ color: message.length > 260 ? 'var(--danger)' : 'var(--subtle)' }}>
              {message.length} / 280
            </div>
          </div>

          {/* tx status */}
          {txStep === 'success' && txHash && (
            <div className="mb-3 rounded-2xl p-3 text-sm font-medium" style={{ background: 'rgba(26,128,71,0.08)', color: 'var(--success)' }}>
              チップが送られました！
              <a
                href={explorerTxUrl(txHash)}
                target="_blank"
                rel="noreferrer"
                className="ml-2 inline-flex items-center gap-0.5 text-xs underline"
                style={{ color: 'var(--accent-hover)' }}
              >
                トランザクションを見る <ExternalLink className="size-3" />
              </a>
            </div>
          )}
          {txStep === 'error' && txError && (
            <div className="mb-3 rounded-2xl p-3 text-xs" style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)' }}>
              {txError}
            </div>
          )}
          {(txStep === 'approve-pending' || txStep === 'approve-confirming') && (
            <div className="mb-3 rounded-2xl p-3 text-xs font-medium flex items-center gap-2" style={{ background: 'rgba(18,45,69,0.06)', color: 'var(--muted)' }}>
              <Loader2 className="size-3.5 animate-spin" />
              ステップ 1/2: USDC承認
            </div>
          )}
          {(txStep === 'tip-pending' || txStep === 'tip-confirming') && (
            <div className="mb-3 rounded-2xl p-3 text-xs font-medium flex items-center gap-2" style={{ background: 'rgba(18,45,69,0.06)', color: 'var(--muted)' }}>
              <Loader2 className="size-3.5 animate-spin" />
              ステップ 2/2: チップ送信
            </div>
          )}

          <button
            onClick={() => { void (!account ? connect() : wrongChain ? switchToArc() : handleTip()) }}
            disabled={!(!account || wrongChain) && !canTip}
            className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: 'var(--accent)' }}
          >
            {tipButtonLabel()}
          </button>
        </section>

        {/* withdraw (recipient only) */}
        {isRecipient && (
          <section className="mb-3 rounded-3xl p-5" style={glassCard}>
            <h2 className="mb-3 text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--ink)' }}>
              <ArrowDownToLine className="size-4" />
              残高を引き出す（受取人のみ）
            </h2>

            {withdrawStep === 'success' && withdrawHash && (
              <div className="mb-3 rounded-2xl p-3 text-sm font-medium" style={{ background: 'rgba(26,128,71,0.08)', color: 'var(--success)' }}>
                引き出し完了！
                <a
                  href={explorerTxUrl(withdrawHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 inline-flex items-center gap-0.5 text-xs underline"
                  style={{ color: 'var(--accent-hover)' }}
                >
                  確認する <ExternalLink className="size-3" />
                </a>
              </div>
            )}
            {withdrawStep === 'error' && withdrawError && (
              <div className="mb-3 rounded-2xl p-3 text-xs" style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)' }}>
                {withdrawError}
              </div>
            )}

            <button
              onClick={() => { void handleWithdraw() }}
              disabled={withdrawStep === 'pending' || withdrawStep === 'confirming' || state.jarBalance === 0n}
              className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: 'var(--accent)' }}
            >
              {withdrawStep === 'pending' || withdrawStep === 'confirming' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  {withdrawStep === 'pending' ? '確認してください...' : '確認中...'}
                </span>
              ) : state.jarBalance === 0n ? '残高なし' : `${formatUsdc(state.jarBalance)} USDC を引き出す`}
            </button>
          </section>
        )}

        {/* recent tips */}
        <section className="rounded-3xl p-5" style={glassCard}>
          <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            最近のチップ
          </h2>
          {loading && state.tips.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--subtle)' }}>読み込み中...</p>
          ) : state.tips.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--subtle)' }}>まだチップはありません。最初のチップを送ってみましょう！</p>
          ) : (
            <ul className="space-y-2">
              {state.tips.map((tip, i) => (
                <li key={i} className="rounded-2xl px-3 py-2.5" style={glassInner}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <a
                        href={explorerAddressUrl(tip.from)}
                        target="_blank"
                        rel="noreferrer"
                        className="mono text-xs font-medium hover:underline flex items-center gap-0.5"
                        style={{ color: 'var(--accent-hover)' }}
                      >
                        {shortAddress(tip.from)}
                        <ExternalLink className="size-2.5" />
                      </a>
                      {tip.message && (
                        <p className="mt-0.5 text-xs text-pretty leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                          {tip.message}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="display text-sm font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                        {formatUsdc(tip.amount)}
                      </span>
                      <span className="ml-0.5 text-xs" style={{ color: 'var(--subtle)' }}>USDC</span>
                      <div className="mt-0.5 text-xs" style={{ color: 'var(--subtle)' }}>
                        {relativeTime(tip.timestamp)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>
    </div>
  )
}
