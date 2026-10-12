import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { useServerFn } from '@tanstack/react-start';
import {
  ArrowLeft, Plane, Dices, Coins, Cherry, CircleDot, Flame,
  Sparkles, ShieldCheck, RefreshCw, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { games } from '@/lib/games';
import { play, type PlayResult } from '@/lib/play.functions';
import { useAccount } from '@/components/app-shell';
import { pageHead, formatCredits } from '@/lib/site';
import { toast } from 'sonner';
import world from '@/assets/play-world.jpg';

export const Route = createFileRoute('/_authenticated/games/$game')({
  head: ({ params }) => pageHead(games.find(g => g.slug === params.game)?.name || 'Game', 'Play with real or virtual credits on KSH WIN.'),
  component: GamePage,
});

function GamePage() {
  const { game: slug } = Route.useParams();
  const game = games.find(g => g.slug === slug);
  const account = useAccount();

  const [stake, setStake] = useState<string>('100');
  const [choice, setChoice] = useState<string>('Red');
  const [busy, setBusy] = useState<boolean>(false);
  const [result, setResult] = useState<PlayResult | null>(null);
  const [multiplierHistory, setMultiplierHistory] = useState<number[]>([1.45, 2.18, 1.05, 5.40, 1.82, 12.30, 2.04]);

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
    }, 100);

    const timer = setInterval(async () => {
      if (polling.current) return;
      polling.current = true;
      try {
        const r = await playFn({ data: { game: game.name, stake: 1, action: 'status', choice: '' } });
        setResult(r);
        if (r.status !== 'flying') {
          if (r.status === 'crashed' && r.multiplier) {
            setMultiplierHistory(prev => [r.multiplier!, ...prev.slice(0, 8)]);
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

  async function act() {
    if (!game) return;
    setBusy(true);

    // If slots, spin reels first
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
          stake: Number(stake),
          choice,
          action: flying ? 'cashout' : 'play'
        }
      });

      setResult(r);
      if (r.status === 'cashed' && r.multiplier) {
        setMultiplierHistory(prev => [r.multiplier!, ...prev.slice(0, 8)]);
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to="/lobby"><ArrowLeft className="w-4 h-4" /> Back to Lobby</Link>
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-mono font-bold">
            PROBABLY FAIR ● REAL GAME ENGINE
          </span>
        </div>
      </div>

      <div className="page-heading">
        <div>
          <div className="eyebrow mb-1">{game.category} · KSH WIN REAL PLAY</div>
          <h1 className="text-2xl md:text-3xl font-extrabold">{game.name}</h1>
        </div>
      </div>

      {/* Multiplier History Bar for Crash Games */}
      {crash && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase shrink-0">Recent Multipliers:</span>
          {multiplierHistory.map((mult, idx) => (
            <span
              key={idx}
              className={`px-2.5 py-1 rounded-md font-mono text-xs font-bold shrink-0 ${
                mult >= 10 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' :
                mult >= 2 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                'bg-slate-800 text-slate-300'
              }`}
            >
              {mult.toFixed(2)}x
            </span>
          ))}
        </div>
      )}

      {/* Main Game Stage Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Game Visual Stage */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-between min-h-[340px] md:min-h-[420px] shadow-2xl text-slate-100">

          {crash ? (
            <>
              {/* Flight Path SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 500 300" preserveAspectRatio="none">
                <path d="M 20 280 Q 250 270 480 30" stroke="#10b981" strokeWidth="4" fill="none" strokeDasharray="6 6" />
              </svg>

              {/* Real Aviator Plane Graphic Moving along Curve */}
              <div
                className="absolute transition-all duration-150 z-10 pointer-events-none"
                style={{
                  left: `${planeX}%`,
                  top: `${planeY}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="relative">
                  <img
                    src={world}
                    alt="Real Aviator Aircraft"
                    className={`w-16 h-16 md:w-20 md:h-20 object-cover rounded-full border-2 border-emerald-400 shadow-2xl ${
                      flying ? 'animate-pulse scale-110 shadow-emerald-500/80' : ''
                    }`}
                  />
                  {flying && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded shadow">
                      IN FLIGHT
                    </div>
                  )}
                </div>
              </div>

              {/* Multiplier Display */}
              <div className="my-auto text-center z-10">
                <div className={`text-6xl md:text-7xl font-black font-mono tracking-tight ${
                  result?.status === 'crashed' ? 'text-red-500' : result?.status === 'cashed' ? 'text-emerald-400' : 'text-slate-100'
                }`}>
                  {(result?.multiplier || 1).toFixed(2)}<span className="text-3xl md:text-4xl font-bold">x</span>
                </div>
                <p className="text-xs md:text-sm font-semibold text-slate-400 mt-3">
                  {flying ? '🚀 Flight soaring! Tap Cash Out before plane flees.' : result?.status === 'crashed' ? '💥 Plane Flew Away! Next round ready.' : result?.status === 'cashed' ? `🎉 Cashed out! Won KSh ${formatCredits(result.payout || 0)}` : 'Tap Take Off to launch next flight'}
                </p>
              </div>

              <div className="w-full flex justify-between items-center text-[11px] text-slate-500 z-10 border-t border-slate-900 pt-3">
                <span>REAL AVIATOR FLIGHT ENGINE</span>
                <span>CERTIFIED PROBABLY FAIR</span>
              </div>
            </>
          ) : (
            <>
              {/* Casino Game Visuals */}
              <div className="my-auto text-center space-y-4">
                {game.name === 'Slots' && (
                  <div className="flex justify-center gap-3 bg-slate-900 p-5 rounded-2xl border-4 border-amber-500/50 shadow-2xl">
                    {reels.map((s, idx) => (
                      <div key={idx} className="w-20 h-24 md:w-24 md:h-28 bg-slate-950 border-2 border-slate-700 rounded-xl flex items-center justify-center text-4xl md:text-5xl shadow-inner">
                        {s}
                      </div>
                    ))}
                  </div>
                )}

                {game.name === 'Roulette' && (
                  <div className="w-36 h-36 md:w-44 md:h-44 rounded-full border-8 border-amber-500/80 bg-gradient-to-tr from-slate-900 to-slate-950 mx-auto flex items-center justify-center shadow-2xl relative">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center font-black text-xs text-emerald-300">
                      ROULETTE
                    </div>
                  </div>
                )}

                {(game.name === 'Dice' || game.name === 'Coin Flip') && (
                  <div className="w-28 h-28 rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center text-3xl font-black text-emerald-400 mx-auto">
                    {game.name === 'Dice' ? '🎲' : '🪙'}
                  </div>
                )}

                <div className="text-2xl md:text-3xl font-black font-mono text-emerald-400">
                  {result?.result || game.name}
                </div>

                <p className="text-xs text-slate-400">
                  {result ? (result.payout ? `🎉 Won KSh ${formatCredits(result.payout)} credits!` : 'No win this round. Try again!') : 'Select your bet and start play'}
                </p>
              </div>

              <div className="w-full flex justify-between items-center text-[11px] text-slate-500 border-t border-slate-900 pt-3">
                <span>CASINO ENGINE</span>
                <span>AUTHENTIC ODDS</span>
              </div>
            </>
          )}
        </div>

        {/* Stake & Bet Controls */}
        <div className="bg-card border rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="border-b pb-3">
              <h3 className="text-sm font-bold">Your Play Options</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Enter stake & select target outcome.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Stake Amount (KSh)
              </label>
              <input
                type="number"
                aria-label="Stake"
                value={stake}
                disabled={flying || busy}
                onChange={e => setStake(e.target.value)}
                min={1}
                max={1000}
                step="1"
                className="w-full bg-background border rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none focus:border-emerald-500"
              />
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                {[50, 100, 250].map(n => (
                  <button
                    key={n}
                    type="button"
                    disabled={flying || busy}
                    onClick={() => setStake(String(n))}
                    className="py-1.5 text-xs font-bold bg-muted hover:bg-secondary rounded-lg transition-colors"
                  >
                    KSh {n}
                  </button>
                ))}
              </div>
            </div>

            {options.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Select Outcome
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {options.map(o => (
                    <Button
                      key={o}
                      type="button"
                      variant={choice === o ? 'default' : 'outline'}
                      onClick={() => setChoice(o)}
                      disabled={busy}
                      className={choice === o ? 'bg-emerald-600 text-white font-bold' : ''}
                    >
                      {o}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t mt-4">
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-sm shadow-md"
              onClick={act}
              disabled={busy || (!flying && (!Number(stake) || Number(stake) > account.balance || Number(stake) > 1000 || Number(stake) < 1 || (!!options.length && !choice)))}
            >
              {busy ? 'Processing...' : flying ? `Cash Out KSh ${formatCredits(Number(stake) * (result?.multiplier || 1))}` : crash ? 'Take Off' : 'Play Round'}
            </Button>
            <p className="text-[11px] text-muted-foreground mt-3 text-center leading-relaxed">
              {crash ? 'Cash out before flight ends. Crash loses the stake.' : game.name === 'Roulette' ? 'Red/Black pays 2x.' : game.name === 'Dice' ? 'Under/Over 50 pays 1.96x.' : 'Matching side pays 1.96x.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
