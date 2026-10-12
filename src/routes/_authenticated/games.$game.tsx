import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { useServerFn } from '@tanstack/react-start';
import {
  ArrowLeft, Plane, Dices, Coins, Cherry, CircleDot, Flame,
  Sparkles, ShieldCheck, RefreshCw, CheckCircle2, Minus, Plus, Users, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { games } from '@/lib/games';
import { play, type PlayResult } from '@/lib/play.functions';
import { useAccount } from '@/components/app-shell';
import { pageHead, formatCredits } from '@/lib/site';
import { toast } from 'sonner';
import world from '@/assets/play-world.jpg';

interface SimulatedPlayer {
  id: string;
  name: string;
  avatar: string;
  stake: number;
  cashedMult?: number;
  winAmt?: number;
}

export const Route = createFileRoute('/_authenticated/games/$game')({
  head: ({ params }) => pageHead(games.find(g => g.slug === params.game)?.name || 'Game', 'Play Spribe Aviator and Casino games on KSH WIN.'),
  component: GamePage,
});

function GamePage() {
  const { game: slug } = Route.useParams();
  const game = games.find(g => g.slug === slug);
  const account = useAccount();

  const [stake1, setStake1] = useState<number>(100);
  const [stake2, setStake2] = useState<number>(200);
  const [choice, setChoice] = useState<string>('Red');
  const [busy, setBusy] = useState<boolean>(false);
  const [result, setResult] = useState<PlayResult | null>(null);
  const [multiplierHistory, setMultiplierHistory] = useState<number[]>([1.14, 1.03, 1.97, 1.31, 1.24, 1.02, 1.41, 3.19, 1.87, 2.25, 1.85, 1.66, 3.14, 2.34, 1.65, 1.19]);

  const playFn = useServerFn(play);
  const polling = useRef<boolean>(false);

  const crash = game?.category === 'Crash';
  const flying = result?.status === 'flying';

  // Plane animation coordinates
  const [planeX, setPlaneX] = useState<number>(10);
  const [planeY, setPlaneY] = useState<number>(80);

  // Slots Reel state
  const slotSymbols = ['🍒', '💎', '🔔', '7️⃣', '🎰', '🍋'];
  const [reels, setReels] = useState<string[]>(['🍒', '💎', '7️⃣']);

  // Simulated Online Players Table Feed
  const [players, setPlayers] = useState<SimulatedPlayer[]>([]);
  const [betsTab, setBetsTab] = useState<'all' | 'previous' | 'top'>('all');

  useEffect(() => {
    const names = ['Aleksey', 'Kipchoge', 'NairobiFlyer', 'TraderKen', 'VIP_Win', 'AviatorPro', 'Wanjiku', 'SammyK', 'Bettor99', 'GamerX'];
    const initialPlayers: SimulatedPlayer[] = names.map((name, i) => ({
      id: String(i),
      name,
      avatar: `https://i.pravatar.cc/100?img=${i + 10}`,
      stake: Math.floor(Math.random() * 500) + 50,
    }));
    setPlayers(initialPlayers);
  }, []);

  // Poll crash status while flying
  useEffect(() => {
    setResult(null);
    if (!game || game.category !== 'Crash') return;
    void playFn({ data: { game: game.name, stake: 1, action: 'status', choice: '' } })
      .then(setResult)
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (!flying || !game) return;

    // Animate plane along curve during flight
    const animInterval = setInterval(() => {
      const mult = result?.multiplier || 1;
      const progress = Math.min(100, (mult - 1) * 20);
      setPlaneX(Math.min(85, 10 + progress * 0.75));
      setPlaneY(Math.max(15, 80 - Math.pow(progress / 100, 0.7) * 65));

      // Random player cashout simulation
      setPlayers(prev => prev.map(p => {
        if (!p.cashedMult && Math.random() < 0.08 && mult > 1.2) {
          return { ...p, cashedMult: mult, winAmt: Math.round(p.stake * mult) };
        }
        return p;
      }));
    }, 100);

    const timer = setInterval(async () => {
      if (polling.current) return;
      polling.current = true;
      try {
        const r = await playFn({ data: { game: game.name, stake: 1, action: 'status', choice: '' } });
        setResult(r);
        if (r.status !== 'flying') {
          if (r.status === 'crashed' && r.multiplier) {
            setMultiplierHistory(prev => [r.multiplier!, ...prev.slice(0, 15)]);
          }
          await account.refresh();
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not update flight');
      } finally {
        polling.current = false;
      }
    }, 250);

    return () => {
      clearInterval(timer);
      clearInterval(animInterval);
    };
  }, [flying, game, playFn, result?.multiplier]);

  async function act(panelStake: number) {
    if (!game) return;
    setBusy(true);

    if (game.name === 'Slots' && !flying) {
      let spins = 8;
      const t = setInterval(() => {
        setReels([
          slotSymbols[Math.floor(Math.random() * slotSymbols.length)],
          slotSymbols[Math.floor(Math.random() * slotSymbols.length)],
          slotSymbols[Math.floor(Math.random() * slotSymbols.length)],
        ]);
        spins--;
        if (spins <= 0) clearInterval(t);
      }, 80);
    }

    try {
      const r = await playFn({
        data: {
          game: game.name,
          stake: panelStake,
          choice,
          action: flying ? 'cashout' : 'play'
        }
      });

      setResult(r);
      if (r.status === 'cashed' && r.multiplier) {
        setMultiplierHistory(prev => [r.multiplier!, ...prev.slice(0, 15)]);
        toast.success(`Cashed out KSh ${formatCredits(r.payout || 0)}!`);
      }
      await account.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to complete move');
    } finally {
      setBusy(false);
    }
  }

  if (!game) return <div className="empty p-8 text-center">Game not found. <Link to="/lobby" className="text-primary font-bold">Back to lobby</Link></div>;

  const options = game.name === 'Roulette' ? ['Red', 'Black'] : game.name === 'Dice' ? ['Under 50', 'Over 50'] : game.name === 'Coin Flip' ? ['Heads', 'Tails'] : [];

  return (
    <div className="aviator-spribe-container w-full bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl max-w-6xl mx-auto">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <Link to="/lobby"><ArrowLeft className="w-4 h-4 mr-1" /> Lobby</Link>
          </Button>
          <div className="flex items-center gap-1.5 font-black italic text-xl text-red-500 tracking-wider border-l border-slate-800 pl-3">
            <Plane className="w-5 h-5 text-red-500 transform -rotate-12 fill-current" /> {game.name}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">Real Balance:</span>
            <strong className="text-emerald-400 font-bold">{formatCredits(account.balance)} KSh</strong>
          </div>
        </div>
      </header>

      {/* Multiplier History Bar */}
      {crash && (
        <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
          {multiplierHistory.map((mult, idx) => (
            <span
              key={idx}
              className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold shrink-0 ${
                mult >= 10 ? 'bg-purple-900/80 text-purple-300 border border-purple-500/50' :
                mult >= 2 ? 'bg-indigo-900/80 text-indigo-300 border border-indigo-500/50' :
                'bg-slate-800 text-cyan-300 border border-slate-700'
              }`}
            >
              {mult.toFixed(2)}x
            </span>
          ))}
          <span className="text-slate-500 text-xs px-2 font-bold">...</span>
        </div>
      )}

      {/* Main Game Interface */}
      <div className="p-3 md:p-4">
        {crash ? (
          <div className="grid lg:grid-cols-12 gap-3">
            {/* Left Bets & Players Panel */}
            <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between min-h-[420px]">
              <div>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-bold text-slate-400">
                  <button onClick={() => setBetsTab('all')} className={`flex-1 py-1 rounded ${betsTab === 'all' ? 'bg-slate-800 text-white' : ''}`}>All Bets</button>
                  <button onClick={() => setBetsTab('previous')} className={`flex-1 py-1 rounded ${betsTab === 'previous' ? 'bg-slate-800 text-white' : ''}`}>Previous</button>
                  <button onClick={() => setBetsTab('top')} className={`flex-1 py-1 rounded ${betsTab === 'top' ? 'bg-slate-800 text-white' : ''}`}>Top</button>
                </div>

                <div className="flex justify-between items-center my-3 text-[11px] text-slate-400 px-1 font-mono">
                  <span>287/335 Bets</span>
                  <span>Total win KSh</span>
                </div>

                <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                  {players.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 text-xs">
                      <div className="flex items-center gap-2">
                        <img src={p.avatar} alt={p.name} className="w-5 h-5 rounded-full object-cover" />
                        <span className="font-semibold text-slate-300 text-[11px] truncate max-w-[80px]">{p.name}</span>
                      </div>
                      <span className="font-mono text-slate-400 text-[11px]">{p.stake}</span>
                      {p.cashedMult ? (
                        <span className="font-mono text-emerald-400 font-bold text-[11px] bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                          {p.cashedMult.toFixed(2)}x
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">in air</span>
                      )}
                      <span className="font-mono text-slate-200 font-bold text-[11px]">{p.winAmt ? formatCredits(p.winAmt) : '-'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-400" /> Provably Fair Game</span>
                <span>Powered by SPRIBE</span>
              </div>
            </div>

            {/* Center Flight Stage & Dual Bet Control Panels */}
            <div className="lg:col-span-8 space-y-3 flex flex-col">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[300px] md:min-h-[340px] shadow-2xl">
                <div className="flex justify-between items-center z-10">
                  <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                    SPRIBE REAL GAME
                  </span>
                  <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded text-xs text-slate-400 font-mono">
                    <Users className="w-3.5 h-3.5 text-emerald-400" /> 172
                  </div>
                </div>

                <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/40 via-slate-950 to-slate-950" />
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 500 300" preserveAspectRatio="none">
                  <path d="M 10 280 Q 250 270 480 30" stroke="#ef4444" strokeWidth="4" fill="none" />
                </svg>

                <div
                  className="absolute transition-all duration-100 z-10 pointer-events-none"
                  style={{
                    left: `${planeX}%`,
                    top: `${planeY}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <img
                    src={world}
                    alt="Official Aviator Red Aircraft"
                    className={`w-16 h-16 md:w-20 md:h-20 object-cover rounded-full border-2 border-red-500 shadow-2xl ${
                      flying ? 'animate-pulse scale-110 shadow-red-500/80' : ''
                    }`}
                  />
                </div>

                <div className="my-auto text-center z-10">
                  {result?.status === 'crashed' ? (
                    <div className="space-y-1">
                      <span className="text-xl md:text-2xl font-black text-slate-200 uppercase tracking-widest block">
                        FLEW AWAY!
                      </span>
                      <div className="text-6xl md:text-7xl font-black font-mono text-red-600 tracking-tight">
                        {(result?.multiplier || 1).toFixed(2)}x
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-6xl md:text-7xl font-black font-mono text-slate-100 tracking-tight">
                        {(result?.multiplier || 1).toFixed(2)}<span className="text-4xl">x</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        {flying ? '🚀 In flight! Cash out before crash.' : 'Ready for Take Off'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500 z-10 border-t border-slate-900 pt-2 font-mono">
                  <span>PROBABLY FAIR ● SPRIBE ENGINE</span>
                  <span>100% SECURE</span>
                </div>
              </div>

              {/* DUAL BET PANELS */}
              <div className="grid md:grid-cols-2 gap-3">
                {/* Panel 1 */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-300">Bet Panel 1</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-center">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg p-1.5">
                        <button onClick={() => setStake1(prev => Math.max(10, prev - 50))} className="p-1 hover:bg-slate-800 rounded">
                          <Minus className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <span className="font-mono text-xs font-bold text-white">{stake1}.00</span>
                        <button onClick={() => setStake1(prev => prev + 50)} className="p-1 hover:bg-slate-800 rounded">
                          <Plus className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                        {[10, 20, 50, 100].map(val => (
                          <button key={val} onClick={() => setStake1(val)} className="bg-slate-950 hover:bg-slate-800 text-slate-300 py-1 rounded border border-slate-800">
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={() => act(stake1)}
                      disabled={busy || (!flying && (stake1 < 1 || stake1 > account.balance))}
                      className={`w-full h-full min-h-[64px] font-black text-sm rounded-xl shadow-lg flex flex-col items-center justify-center ${
                        flying ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      <span>{flying ? 'CASH OUT' : 'BET'}</span>
                      <span className="text-xs font-mono font-normal opacity-90">{flying ? `${formatCredits(stake1 * (result?.multiplier || 1))} KSh` : `${stake1}.00 KSh`}</span>
                    </Button>
                  </div>
                </div>

                {/* Panel 2 */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-300">Bet Panel 2</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-center">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg p-1.5">
                        <button onClick={() => setStake2(prev => Math.max(10, prev - 50))} className="p-1 hover:bg-slate-800 rounded">
                          <Minus className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <span className="font-mono text-xs font-bold text-white">{stake2}.00</span>
                        <button onClick={() => setStake2(prev => prev + 50)} className="p-1 hover:bg-slate-800 rounded">
                          <Plus className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                        {[10, 20, 50, 100].map(val => (
                          <button key={val} onClick={() => setStake2(val)} className="bg-slate-950 hover:bg-slate-800 text-slate-300 py-1 rounded border border-slate-800">
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={() => act(stake2)}
                      disabled={busy || (!flying && (stake2 < 1 || stake2 > account.balance))}
                      className={`w-full h-full min-h-[64px] font-black text-sm rounded-xl shadow-lg flex flex-col items-center justify-center ${
                        flying ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      <span>{flying ? 'CASH OUT' : 'BET'}</span>
                      <span className="text-xs font-mono font-normal opacity-90">{flying ? `${formatCredits(stake2 * (result?.multiplier || 1))} KSh` : `${stake2}.00 KSh`}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Casino Games Component */
          <div className="space-y-4">
            <div className="grid lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[320px]">
                {game.name === 'Slots' && (
                  <div className="flex justify-center gap-3 bg-slate-950 p-5 rounded-2xl border-4 border-amber-500/50 shadow-2xl">
                    {reels.map((symbol, i) => (
                      <div key={i} className="w-20 h-24 bg-slate-900 border-2 border-slate-700 rounded-xl flex items-center justify-center text-4xl shadow-inner">
                        {symbol}
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-2xl font-black text-white mt-4">{result?.result || game.name}</div>
                <p className="text-xs text-slate-400 mt-1">{result ? (result.payout ? `Won KSh ${formatCredits(result.payout)}` : 'No win this round') : 'Ready'}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">Stake KSh</label>
                  <input
                    type="number"
                    value={stake1}
                    onChange={e => setStake1(Number(e.target.value))}
                    min={10}
                    max={account.balance}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white"
                  />
                  {options.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {options.map(o => (
                        <Button key={o} variant={choice === o ? 'default' : 'outline'} onClick={() => setChoice(o)}>
                          {o}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                <Button onClick={() => act(stake1)} disabled={busy} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 mt-4">
                  {busy ? 'Playing...' : 'Play Round'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
