import { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip, XAxis } from 'recharts';
import {
  Plane, Dices, TrendingUp, Wallet, ArrowRight, Sparkles, RefreshCw,
  ArrowUpRight, ShieldCheck, Flame, CircleDot, Coins, Cherry, ShieldAlert,
  Play, StopCircle, Award, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCredits } from '@/lib/site';
import world from '@/assets/play-world.jpg';

interface DemoPlaygroundProps {
  onGoToAuth: (mode?: 'login' | 'signup') => void;
}

export function DemoPlayground({ onGoToAuth }: DemoPlaygroundProps) {
  // Demo Wallet State (stored in localStorage)
  const [demoBalance, setDemoBalance] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kshwin_demo_balance');
      if (saved) {
        const parsed = Number(saved);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return 10000;
  });

  useEffect(() => {
    localStorage.setItem('kshwin_demo_balance', String(demoBalance));
  }, [demoBalance]);

  // Main Tab Navigation
  const [activeTab, setActiveTab] = useState<'aviator' | 'casino' | 'trading'>('aviator');

  // --- AVIATOR GAME ENGINE STATE ---
  const [stake, setStake] = useState<string>('100');
  const [autoCashout, setAutoCashout] = useState<string>('');
  const [flying, setFlying] = useState<boolean>(false);
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [crashed, setCrashed] = useState<boolean>(false);
  const [cashedOut, setCashedOut] = useState<boolean>(false);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [multiplierHistory, setMultiplierHistory] = useState<number[]>([1.45, 2.18, 1.05, 5.40, 1.82, 12.30, 2.04]);

  const flightTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const crashPoint = useRef<number>(2.00);
  const flightStartTime = useRef<number>(0);

  // Flight trajectory coordinates (0% to 100%)
  const [planeX, setPlaneX] = useState<number>(5);
  const [planeY, setPlaneY] = useState<number>(85);

  const startDemoFlight = () => {
    const stakeNum = Number(stake);
    if (!stakeNum || stakeNum < 1 || stakeNum > demoBalance) return;

    setDemoBalance(prev => prev - stakeNum);
    setFlying(true);
    setCrashed(false);
    setCashedOut(false);
    setLastWin(null);
    setMultiplier(1.00);
    setPlaneX(5);
    setPlaneY(85);

    // Generate crash point (Weighted algorithm)
    const rand = Math.random();
    const generatedCrash = rand < 0.15 ? 1.05 + Math.random() * 0.2 : rand < 0.7 ? 1.3 + Math.random() * 2.5 : 3.5 + Math.random() * 12;
    crashPoint.current = Number(generatedCrash.toFixed(2));
    flightStartTime.current = Date.now();

    flightTimer.current = setInterval(() => {
      const elapsed = (Date.now() - flightStartTime.current) / 1000;
      // Multiplier exponential curve
      const currentMult = Number((Math.exp(elapsed * 0.14)).toFixed(2));

      // Calculate plane position along parabola
      const progress = Math.min(100, (elapsed / 8) * 100);
      setPlaneX(Math.min(85, 5 + progress * 0.8));
      setPlaneY(Math.max(15, 85 - Math.pow(progress / 100, 0.7) * 70));

      // Check auto cashout
      const autoNum = Number(autoCashout);
      if (autoNum > 1 && currentMult >= autoNum && !cashedOut) {
        cashOutDemo(currentMult);
        return;
      }

      if (currentMult >= crashPoint.current) {
        if (flightTimer.current) clearInterval(flightTimer.current);
        setFlying(false);
        setCrashed(true);
        setMultiplier(crashPoint.current);
        setMultiplierHistory(prev => [crashPoint.current, ...prev.slice(0, 9)]);
      } else {
        setMultiplier(currentMult);
      }
    }, 80);
  };

  const cashOutDemo = (forcedMult?: number) => {
    if (!flying || cashedOut) return;
    if (flightTimer.current) clearInterval(flightTimer.current);

    const finalMult = forcedMult || multiplier;
    const stakeNum = Number(stake);
    const winAmount = Math.round(stakeNum * finalMult);

    setFlying(false);
    setCashedOut(true);
    setLastWin(winAmount);
    setDemoBalance(prev => prev + winAmount);
    setMultiplierHistory(prev => [finalMult, ...prev.slice(0, 9)]);
  };

  // --- CASINO SUITE STATE ---
  const [casinoSubTab, setCasinoSubTab] = useState<'roulette' | 'slots' | 'dice' | 'coin'>('roulette');
  const [casinoChoice, setCasinoChoice] = useState<string>('Red');
  const [casinoSpinning, setCasinoSpinning] = useState<boolean>(false);
  const [casinoResult, setCasinoResult] = useState<string | null>(null);
  const [casinoPayout, setCasinoPayout] = useState<number | null>(null);

  // Slots Reels
  const slotSymbols = ['🍒', '💎', '🔔', '7️⃣', '🎰', '🍋'];
  const [reels, setReels] = useState<string[]>(['🍒', '💎', '7️⃣']);

  // Dice Slider
  const [diceTarget, setDiceTarget] = useState<number>(50);

  const playCasinoGame = () => {
    const stakeNum = Number(stake);
    if (!stakeNum || stakeNum < 1 || stakeNum > demoBalance || casinoSpinning) return;

    setDemoBalance(prev => prev - stakeNum);
    setCasinoSpinning(true);
    setCasinoResult(null);
    setCasinoPayout(null);

    if (casinoSubTab === 'slots') {
      let spinsLeft = 10;
      const slotTimer = setInterval(() => {
        setReels([
          slotSymbols[Math.floor(Math.random() * slotSymbols.length)],
          slotSymbols[Math.floor(Math.random() * slotSymbols.length)],
          slotSymbols[Math.floor(Math.random() * slotSymbols.length)],
        ]);
        spinsLeft--;
        if (spinsLeft <= 0) {
          clearInterval(slotTimer);
          const finalR1 = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
          const finalR2 = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
          const finalR3 = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
          setReels([finalR1, finalR2, finalR3]);
          setCasinoSpinning(false);

          let winMult = 0;
          if (finalR1 === finalR2 && finalR2 === finalR3) winMult = 10;
          else if (finalR1 === finalR2 || finalR2 === finalR3 || finalR1 === finalR3) winMult = 2.5;

          if (winMult > 0) {
            const winAmt = Math.round(stakeNum * winMult);
            setCasinoPayout(winAmt);
            setCasinoResult(`JACKPOT! 3x Matching symbols! Won ${winMult}x`);
            setDemoBalance(prev => prev + winAmt);
          } else {
            setCasinoResult('No match. Try another spin!');
          }
        }
      }, 100);
    } else if (casinoSubTab === 'roulette') {
      setTimeout(() => {
        const num = Math.floor(Math.random() * 37);
        const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num);
        const isGreen = num === 0;
        const resLabel = isGreen ? 'Green 0' : isRed ? `Red ${num}` : `Black ${num}`;

        let won = false;
        let mult = 2;
        if (casinoChoice === 'Red' && isRed) won = true;
        if (casinoChoice === 'Black' && !isRed && !isGreen) won = true;
        if (casinoChoice === 'Green 0' && isGreen) { won = true; mult = 36; }

        setCasinoSpinning(false);
        setCasinoResult(`Landed on ${resLabel}`);
        if (won) {
          const winAmt = Math.round(stakeNum * mult);
          setCasinoPayout(winAmt);
          setDemoBalance(prev => prev + winAmt);
        }
      }, 1000);
    } else if (casinoSubTab === 'dice') {
      setTimeout(() => {
        const roll = Math.floor(Math.random() * 100) + 1;
        setCasinoSpinning(false);
        setCasinoResult(`Rolled ${roll}`);

        if (roll < diceTarget) {
          const winMult = Number((98 / diceTarget).toFixed(2));
          const winAmt = Math.round(stakeNum * winMult);
          setCasinoPayout(winAmt);
          setDemoBalance(prev => prev + winAmt);
        }
      }, 600);
    } else {
      // Coin Flip
      setTimeout(() => {
        const flip = Math.random() < 0.5 ? 'Heads' : 'Tails';
        setCasinoSpinning(false);
        setCasinoResult(`Flipped ${flip}`);
        if (casinoChoice === flip) {
          const winAmt = Math.round(stakeNum * 1.96);
          setCasinoPayout(winAmt);
          setDemoBalance(prev => prev + winAmt);
        }
      }, 600);
    }
  };

  // --- TRADING MARKET STATE ---
  const [tradeSymbol, setTradeSymbol] = useState<'BTC' | 'ETH' | 'SOL' | 'AAPL'>('BTC');
  const marketPrices = { BTC: 67432, ETH: 3521, SOL: 148.72, AAPL: 227.18 };
  const [currentPrice, setCurrentPrice] = useState<number>(marketPrices.BTC);
  const [tradeChartData, setTradeChartData] = useState<{ time: string; price: number }[]>([]);
  const [openTrade, setOpenTrade] = useState<{ symbol: string; type: 'BUY' | 'SELL'; stake: number; entry: number } | null>(null);
  const [pnl, setPnl] = useState<number>(0);

  // Initialize trade chart data
  useEffect(() => {
    const base = marketPrices[tradeSymbol];
    setCurrentPrice(base);
    const initial = Array.from({ length: 25 }, (_, i) => ({
      time: `${i + 1}s`,
      price: base + (Math.sin(i / 3) * (base * 0.004)) + ((Math.random() - 0.5) * (base * 0.002))
    }));
    setTradeChartData(initial);
  }, [tradeSymbol]);

  // Live chart ticks
  useEffect(() => {
    const timer = setInterval(() => {
      setTradeChartData(prev => {
        const lastPrice = prev.length ? prev[prev.length - 1].price : marketPrices[tradeSymbol];
        const delta = (Math.random() - 0.49) * (lastPrice * 0.003);
        const newPrice = Number((lastPrice + delta).toFixed(2));
        setCurrentPrice(newPrice);

        if (openTrade) {
          const diff = openTrade.type === 'BUY' ? newPrice - openTrade.entry : openTrade.entry - newPrice;
          const pnlVal = (diff / openTrade.entry) * openTrade.stake;
          setPnl(pnlVal);
        }

        const newPoint = { time: `${prev.length + 1}s`, price: newPrice };
        return [...prev.slice(1), newPoint];
      });
    }, 1200);
    return () => clearInterval(timer);
  }, [openTrade, tradeSymbol]);

  const executeTrade = (type: 'BUY' | 'SELL') => {
    const stakeNum = Number(stake);
    if (!stakeNum || stakeNum < 1 || stakeNum > demoBalance || openTrade) return;

    setDemoBalance(prev => prev - stakeNum);
    setOpenTrade({ symbol: tradeSymbol, type, stake: stakeNum, entry: currentPrice });
    setPnl(0);
  };

  const closeTrade = () => {
    if (!openTrade) return;
    const finalReturn = Math.max(0, Math.round(openTrade.stake + pnl));
    setDemoBalance(prev => prev + finalReturn);
    setOpenTrade(null);
    setPnl(0);
  };

  const resetDemoBalance = () => {
    setDemoBalance(10000);
  };

  return (
    <div className="demo-playground w-full space-y-6">
      {/* 1. TOP REAL CASH DEPOSIT PROMO BANNER */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 border border-emerald-500/40 rounded-2xl p-4 md:p-5 shadow-xl text-emerald-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400">DEMO PLAYGROUND</span>
              <span className="text-[10px] bg-emerald-800/80 text-emerald-200 border border-emerald-600 px-2 py-0.5 rounded-full font-mono font-bold">Risk-Free</span>
            </div>
            <p className="text-xs md:text-sm text-emerald-200/90 font-medium mt-0.5">
              Testing KSH WIN with $10,000 virtual credits. Ready to win & withdraw real cash?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end">
          <Button
            onClick={() => onGoToAuth('login')}
            variant="outline"
            className="border-emerald-500/50 text-emerald-200 hover:bg-emerald-900/60 text-xs font-semibold"
          >
            Sign In
          </Button>
          <Button
            onClick={() => onGoToAuth('signup')}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 shadow-lg shadow-emerald-950/80 transition-all hover:scale-105"
          >
            Deposit Real Cash <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* 2. DEMO WALLET & TAB NAVIGATION BAR */}
      <div className="bg-card border rounded-2xl p-3.5 md:p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className="flex items-center gap-2.5 bg-secondary/80 px-3.5 py-2 rounded-xl border font-mono">
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-muted-foreground">Demo Balance:</span>
            <strong className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              KSh {formatCredits(demoBalance)}
            </strong>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetDemoBalance}
            title="Reset Demo Balance to KSh 10,000"
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-9"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset $10k
          </Button>
        </div>

        {/* Main Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-muted p-1.5 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('aviator')}
            className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'aviator' ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Plane className="w-4 h-4" /> Aviator
          </button>
          <button
            onClick={() => setActiveTab('casino')}
            className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'casino' ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Dices className="w-4 h-4" /> Casino
          </button>
          <button
            onClick={() => setActiveTab('trading')}
            className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'trading' ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Trading
          </button>
        </div>
      </div>

      {/* --- TAB 1: REAL AVIATOR GAME --- */}
      {activeTab === 'aviator' && (
        <div className="space-y-4">
          {/* History Pills */}
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

          <div className="grid lg:grid-cols-3 gap-5">
            {/* Real Flight Stage */}
            <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[340px] md:min-h-[400px] shadow-2xl">
              {/* Top Bar inside flight stage */}
              <div className="flex justify-between items-center z-10">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800/60">
                  <Flame className="w-3.5 h-3.5 text-emerald-400" /> LIVE AVIATOR FLIGHT
                </span>
                <span className="text-xs font-mono text-slate-400">RTP: 97.0%</span>
              </div>

              {/* Curved Flight Path SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 500 300" preserveAspectRatio="none">
                <path d="M 10 280 Q 250 270 480 30" stroke="#10b981" strokeWidth="4" fill="none" strokeDasharray="6 6" />
              </svg>

              {/* Real Plane Moving along trajectory */}
              <div
                className="absolute transition-all duration-100 z-10 pointer-events-none"
                style={{
                  left: `${planeX}%`,
                  top: `${planeY}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="relative group">
                  <img
                    src={world}
                    alt="Real Aviator Aircraft"
                    className={`w-16 h-16 md:w-20 md:h-20 object-cover rounded-full border-2 border-emerald-400 shadow-2xl ${
                      flying ? 'animate-pulse scale-110 shadow-emerald-500/50' : ''
                    }`}
                  />
                  {flying && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded shadow">
                      SOARING
                    </div>
                  )}
                </div>
              </div>

              {/* Multiplier Display Center */}
              <div className="my-auto text-center z-10">
                <div className={`text-6xl md:text-7xl font-black font-mono tracking-tight ${
                  crashed ? 'text-red-500' : cashedOut ? 'text-emerald-400' : 'text-slate-100'
                }`}>
                  {multiplier.toFixed(2)}<span className="text-3xl md:text-4xl font-bold">x</span>
                </div>
                <p className="text-xs md:text-sm font-semibold text-slate-400 mt-2">
                  {flying ? '🚀 Flight soaring! Tap Cash Out before crash.' : crashed ? '💥 Plane Flew Away! Next round ready.' : cashedOut ? `🎉 Cashed out at ${multiplier.toFixed(2)}x! Won KSh ${formatCredits(lastWin || 0)}` : 'Ready for Take Off'}
                </p>
              </div>

              {/* Flight Stage Footer */}
              <div className="flex justify-between items-center text-xs text-slate-500 z-10 border-t border-slate-900 pt-3">
                <span>VIRTUAL AVIATOR DEMO</span>
                <span>PROBABLY FAIR ALGORITHM</span>
              </div>
            </div>

            {/* Betting Controls Panel */}
            <div className="bg-card border rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Plane className="w-4 h-4 text-emerald-500" /> Place Demo Stake
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Win up to 100x your stake on long flights.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Stake Amount (KSh Demo)
                  </label>
                  <input
                    type="number"
                    value={stake}
                    disabled={flying}
                    onChange={e => setStake(e.target.value)}
                    min={10}
                    max={demoBalance}
                    className="w-full bg-background border rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none focus:border-emerald-500"
                  />
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {[50, 100, 250, 500].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        disabled={flying}
                        onClick={() => setStake(String(amt))}
                        className="py-1.5 text-xs font-bold bg-muted hover:bg-secondary rounded-lg transition-colors"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Auto Cash Out Multiplier (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 2.00"
                    step="0.1"
                    value={autoCashout}
                    disabled={flying}
                    onChange={e => setAutoCashout(e.target.value)}
                    className="w-full bg-background border rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-5 border-t mt-4">
                {!flying ? (
                  <Button
                    onClick={startDemoFlight}
                    disabled={!Number(stake) || Number(stake) < 1 || Number(stake) > demoBalance}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-sm shadow-md"
                  >
                    Take Off (Bet KSh {stake})
                  </Button>
                ) : (
                  <Button
                    onClick={() => cashOutDemo()}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black h-12 text-sm shadow-xl animate-pulse"
                  >
                    CASH OUT KSh {formatCredits(Math.round(Number(stake) * multiplier))} ({multiplier.toFixed(2)}x)
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: CASINO CLASSICS --- */}
      {activeTab === 'casino' && (
        <div className="space-y-4">
          {/* Casino Game Subtabs */}
          <div className="flex flex-wrap gap-2 border-b pb-3">
            {[
              { id: 'roulette', label: 'Roulette Wheel', icon: CircleDot },
              { id: 'slots', label: 'Slot Machine', icon: Cherry },
              { id: 'dice', label: 'Dice Roll', icon: Dices },
              { id: 'coin', label: 'Coin Flip', icon: Coins },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={casinoSubTab === tab.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setCasinoSubTab(tab.id as any);
                    setCasinoResult(null);
                    setCasinoPayout(null);
                  }}
                  className={`text-xs font-bold gap-1.5 ${
                    casinoSubTab === tab.id ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : ''
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {tab.label}
                </Button>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {/* Casino Interactive Stage */}
            <div className="lg:col-span-2 bg-card border rounded-2xl p-6 flex flex-col items-center justify-center min-h-[320px] shadow-sm">
              {/* Slots Reel Visual */}
              {casinoSubTab === 'slots' && (
                <div className="text-center space-y-4">
                  <div className="flex justify-center gap-3 bg-slate-950 p-5 rounded-2xl border-4 border-amber-500/50 shadow-2xl">
                    {reels.map((symbol, i) => (
                      <div
                        key={i}
                        className={`w-20 h-24 md:w-24 md:h-28 bg-slate-900 border-2 border-slate-700 rounded-xl flex items-center justify-center text-4xl md:text-5xl shadow-inner ${
                          casinoSpinning ? 'animate-bounce' : ''
                        }`}
                      >
                        {symbol}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    3 Matching symbols = 10x Win | 2 Matching symbols = 2.5x Win
                  </p>
                </div>
              )}

              {/* Roulette Visual */}
              {casinoSubTab === 'roulette' && (
                <div className="text-center space-y-4">
                  <div className={`w-36 h-36 md:w-44 md:h-44 rounded-full border-8 border-amber-500/80 bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-900 mx-auto flex items-center justify-center shadow-2xl relative ${
                    casinoSpinning ? 'animate-spin' : ''
                  }`}>
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center font-black text-xs text-emerald-300">
                      37 N
                    </div>
                  </div>
                  <div className="flex justify-center gap-2 text-xs font-bold">
                    <span className="px-3 py-1 bg-red-600 text-white rounded-md">Red (18)</span>
                    <span className="px-3 py-1 bg-slate-900 text-white rounded-md">Black (18)</span>
                    <span className="px-3 py-1 bg-emerald-600 text-white rounded-md">Green (0)</span>
                  </div>
                </div>
              )}

              {/* Dice Visual */}
              {casinoSubTab === 'dice' && (
                <div className="w-full max-w-md text-center space-y-5">
                  <div className="text-5xl font-black font-mono text-emerald-500 my-2">
                    {casinoResult || 'Roll < Target'}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-muted-foreground">
                      <span>Target: Roll Under {diceTarget}</span>
                      <span>Win Chance: {diceTarget}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      value={diceTarget}
                      onChange={e => setDiceTarget(Number(e.target.value))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Coin Visual */}
              {casinoSubTab === 'coin' && (
                <div className="text-center space-y-4">
                  <div className={`w-32 h-32 rounded-full bg-amber-400 border-4 border-amber-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-2xl mx-auto ${
                    casinoSpinning ? 'animate-spin' : ''
                  }`}>
                    {casinoResult ? casinoResult.split(' ')[1] || 'COIN' : '🪙 50/50'}
                  </div>
                </div>
              )}

              {/* Outcome Feedback */}
              {casinoResult && (
                <div className="mt-5 text-center">
                  <div className="text-lg font-bold text-foreground">{casinoResult}</div>
                  {casinoPayout && (
                    <div className="text-sm font-extrabold text-emerald-500 mt-1">
                      🎉 Won KSh {formatCredits(casinoPayout)}!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Betting Panel */}
            <div className="bg-card border rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <h3 className="text-sm font-bold">Select Prediction</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Place your demo wager.</p>
                </div>

                {casinoSubTab === 'roulette' && (
                  <div className="grid grid-cols-3 gap-1.5">
                    <Button
                      type="button"
                      variant={casinoChoice === 'Red' ? 'default' : 'outline'}
                      onClick={() => setCasinoChoice('Red')}
                      className={casinoChoice === 'Red' ? 'bg-red-600 text-white font-bold' : ''}
                    >
                      Red (2x)
                    </Button>
                    <Button
                      type="button"
                      variant={casinoChoice === 'Black' ? 'default' : 'outline'}
                      onClick={() => setCasinoChoice('Black')}
                      className={casinoChoice === 'Black' ? 'bg-slate-900 text-white font-bold' : ''}
                    >
                      Black (2x)
                    </Button>
                    <Button
                      type="button"
                      variant={casinoChoice === 'Green 0' ? 'default' : 'outline'}
                      onClick={() => setCasinoChoice('Green 0')}
                      className={casinoChoice === 'Green 0' ? 'bg-emerald-600 text-white font-bold' : ''}
                    >
                      0 (36x)
                    </Button>
                  </div>
                )}

                {casinoSubTab === 'coin' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={casinoChoice === 'Heads' ? 'default' : 'outline'}
                      onClick={() => setCasinoChoice('Heads')}
                    >
                      Heads (1.96x)
                    </Button>
                    <Button
                      type="button"
                      variant={casinoChoice === 'Tails' ? 'default' : 'outline'}
                      onClick={() => setCasinoChoice('Tails')}
                    >
                      Tails (1.96x)
                    </Button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Wager Amount (KSh Demo)
                  </label>
                  <input
                    type="number"
                    value={stake}
                    onChange={e => setStake(e.target.value)}
                    min={10}
                    max={demoBalance}
                    className="w-full bg-background border rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <Button
                onClick={playCasinoGame}
                disabled={casinoSpinning || !Number(stake) || Number(stake) < 1 || Number(stake) > demoBalance}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-sm mt-4 shadow-md"
              >
                {casinoSpinning ? 'Spinning / Rolling...' : 'Play Round'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: CRYPTO & ASSET TRADING --- */}
      {activeTab === 'trading' && (
        <div className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Real Interactive Price Chart */}
            <div className="lg:col-span-2 bg-card border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <div className="flex items-center gap-1.5">
                  {(['BTC', 'ETH', 'SOL', 'AAPL'] as const).map(sym => (
                    <Button
                      key={sym}
                      variant={tradeSymbol === sym ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setTradeSymbol(sym)}
                      className="text-xs font-bold"
                    >
                      {sym}/USD
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-xs text-muted-foreground">LIVE PRICE:</span>
                  <strong className="text-base text-emerald-500">
                    ${currentPrice.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              {/* Recharts AreaChart */}
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tradeChartData}>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                    <Tooltip
                      formatter={(val: number) => `$${val.toFixed(2)}`}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="price" stroke="#10b981" fill="#10b98120" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Active Position Info */}
              {openTrade && (
                <div className="bg-muted p-4 rounded-xl flex items-center justify-between border">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-bold">{openTrade.type} {openTrade.symbol}</span>
                    <div className="text-sm font-bold mt-0.5">
                      Entry: ${openTrade.entry.toFixed(2)} | Stake: KSh {openTrade.stake}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-base font-black font-mono block ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {pnl >= 0 ? '+' : ''}KSh {pnl.toFixed(2)}
                    </span>
                    <Button size="sm" onClick={closeTrade} className="mt-1 bg-slate-900 text-white hover:bg-slate-800 text-xs">
                      Close Position
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Trading Order Panel */}
            <div className="bg-card border rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <h3 className="text-sm font-bold">Execute Trade</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Simulated market orders.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Trade Margin (KSh Demo)
                  </label>
                  <input
                    type="number"
                    value={stake}
                    onChange={e => setStake(e.target.value)}
                    min={10}
                    max={demoBalance}
                    className="w-full bg-background border rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-4">
                <Button
                  onClick={() => executeTrade('BUY')}
                  disabled={!!openTrade || !Number(stake) || Number(stake) < 1 || Number(stake) > demoBalance}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-sm"
                >
                  Buy / Long
                </Button>
                <Button
                  onClick={() => executeTrade('SELL')}
                  disabled={!!openTrade || !Number(stake) || Number(stake) < 1 || Number(stake) > demoBalance}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold h-12 text-sm"
                >
                  Sell / Short
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. FOOTER PROMO CALLOUT */}
      <div className="bg-card border rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm text-center md:text-left">
        <div>
          <h4 className="text-sm font-extrabold text-foreground">Ready to switch from Demo to Real Funds?</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create a real account to deposit M-Pesa or Card funds and start earning real cash rewards.
          </p>
        </div>
        <Button
          onClick={() => onGoToAuth('signup')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 shrink-0 shadow-md"
        >
          Create Real Account & Deposit <ArrowUpRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
