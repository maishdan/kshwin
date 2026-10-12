import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip, XAxis } from 'recharts';
import { TrendingUp, ArrowUpRight, ShieldCheck, Wallet, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccount } from '@/components/app-shell';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { play } from '@/lib/play.functions';
import { pageHead, formatCredits } from '@/lib/site';
import { toast } from 'sonner';

const markets = [
  { symbol: 'BTC', name: 'Bitcoin', price: 67432 },
  { symbol: 'ETH', name: 'Ethereum', price: 3521 },
  { symbol: 'SOL', name: 'Solana', price: 148.72 },
  { symbol: 'AAPL', name: 'Apple', price: 227.18 },
  { symbol: 'EURUSD', name: 'Euro / USD', price: 1.0942 },
] as const;

export const Route = createFileRoute('/_authenticated/trading')({
  head: () => pageHead('Trading', 'Simulated asset trading and graphs on KSH WIN.'),
  component: TradingPage,
});

function TradingPage() {
  const [market, setMarket] = useState<typeof markets[number]>(markets[0]);
  const [stake, setStake] = useState<string>('100');
  const [time, setTime] = useState<number>(Date.now() / 1000);
  const [busy, setBusy] = useState<boolean>(false);
  const [positions, setPositions] = useState<Database['public']['Tables']['positions']['Row'][]>([]);

  const account = useAccount();
  const action = useServerFn(play);

  async function load() {
    const { data, error } = await supabase.from('positions').select('*').order('created_at', { ascending: false });
    if (error) toast.error('Could not load positions');
    else setPositions(data || []);
  }

  useEffect(() => {
    void load();
    const timer = setInterval(() => setTime(Date.now() / 1000), 2000);
    return () => clearInterval(timer);
  }, []);

  const price = market.price * (1 + Math.sin(time / 40) * 0.003 + (Math.random() - 0.5) * 0.001);
  const points = Array.from({ length: 30 }, (_, i) => ({
    time: `${i + 1}s`,
    price: market.price * (1 + Math.sin((time - (29 - i) * 3) / 40) * 0.003)
  }));

  async function trade(kind: 'buy' | 'sell', id = '') {
    setBusy(true);
    try {
      await action({ data: { game: market.symbol, stake: Number(stake), choice: id, action: kind } });
      await Promise.all([account.refresh(), load()]);
      toast.success(kind === 'buy' ? 'Position opened' : 'Position closed');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not place trade');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="page-heading">
        <div>
          <div className="eyebrow mb-1">REAL TRADING & ASSET MARKETS</div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Simulated Asset Trading</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Live graphs, simulated execution, zero leverage risk.</p>
        </div>
      </div>

      {/* Asset Market Selectors */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {markets.map(m => (
          <Button
            key={m.symbol}
            variant={m.symbol === market.symbol ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMarket(m)}
            className={`text-xs font-bold shrink-0 ${m.symbol === market.symbol ? 'bg-emerald-600 text-white' : ''}`}
          >
            {m.symbol}/USD
          </Button>
        ))}
      </div>

      {/* Trading Layout Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Graph Panel */}
        <div className="lg:col-span-2 bg-card border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">{market.name} / USD</p>
              <h2 className="text-2xl md:text-3xl font-extrabold font-mono text-foreground mt-1">
                ${price.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: market.symbol === 'EURUSD' ? 4 : 2 })}
              </h2>
            </div>
            <span className="text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
              ● LIVE SIMULATED FEED
            </span>
          </div>

          {/* Recharts AreaChart */}
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points}>
                <XAxis dataKey="time" hide />
                <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                <Tooltip
                  formatter={(val: number) => `$${val.toFixed(2)}`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="price" stroke="#10b981" fill="#10b98120" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order execution panel */}
        <div className="bg-card border rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="border-b pb-3">
              <h3 className="text-sm font-bold">Open Position</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{market.name} · Spot Order</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Order Amount (KSh)
              </label>
              <input
                type="number"
                aria-label="Trade amount"
                value={stake}
                onChange={e => setStake(e.target.value)}
                min={1}
                max={1000}
                step="0.01"
                className="w-full bg-background border rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t mt-4">
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-sm shadow-md"
              onClick={() => trade('buy')}
              disabled={busy || Number(stake) < 1 || Number(stake) > 1000 || Number(stake) > account.balance || !Number(stake)}
            >
              {busy ? 'Executing...' : `Buy ${market.symbol}`}
            </Button>
            <p className="text-[11px] text-muted-foreground mt-3 text-center leading-relaxed">
              No leverage risk. Close position anytime to return value to balance.
            </p>
          </div>
        </div>
      </div>

      {/* Open Positions Table */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold">Your Open Trading Positions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b bg-muted/50 text-muted-foreground">
                <th className="p-3">MARKET</th>
                <th className="p-3">AMOUNT</th>
                <th className="p-3">ENTRY PRICE</th>
                <th className="p-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {positions.map(p => (
                <tr key={p.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-bold">{p.symbol}</td>
                  <td className="p-3">KSh {formatCredits(Number(p.stake))}</td>
                  <td className="p-3 font-mono">${formatCredits(Number(p.entry))}</td>
                  <td className="p-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => trade('sell', p.id)}
                      className="text-xs font-bold hover:bg-red-500 hover:text-white"
                    >
                      Close Position
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!positions.length && <p className="text-center text-xs text-muted-foreground py-6">No open positions currently.</p>}
        </div>
      </div>
    </div>
  );
}
