import { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip, XAxis } from 'recharts';
import {
  Plane, Dices, TrendingUp, Wallet, ArrowRight, Sparkles, RefreshCw,
  ArrowUpRight, ShieldCheck, Flame, CircleDot, Coins, Cherry, ShieldAlert,
  Play, StopCircle, Award, CheckCircle2, AlertCircle, Timer, Minus, Plus, Users, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCredits } from '@/lib/site';
import world from '@/assets/play-world.jpg';

interface DemoPlaygroundProps {
  onGoToAuth: (mode?: 'login' | 'signup') => void;
}

type FlightState = 'WAITING' | 'FLYING' | 'CRASHED';

interface SimulatedPlayer {
  id: string;
  name: string;
  avatar: string;
  stake: number;
  cashedMult?: number;
  winAmt?: number;
}

export function DemoPlayground({ onGoToAuth }: DemoPlaygroundProps) {
  // Demo Wallet State
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
  const [flightState, setFlightState] = useState<FlightState>('WAITING');
  const [countdown, setCountdown] = useState<number>(5);
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [multiplierHistory, setMultiplierHistory] = useState<number[]>([1.14, 1.03, 1.97, 1.31, 1.24, 1.02, 1.41, 3.19, 1.87, 2.25, 1.85, 1.66, 3.14, 2.34, 1.65, 1.19]);

  // Dual Bet Panel State (Bet Panel 1 & Bet Panel 2)
  const [stake1, setStake1] = useState<number>(100);
  const [stake2, setStake2] = useState<number>(200);
  const [autoCashout1, setAutoCashout1] = useState<string>('');
  const [autoCashout2, setAutoCashout2] = useState<string>('');

  const [hasBet1, setHasBet1] = useState<boolean>(false);
  const [cashedOut1, setCashedOut1] = useState<boolean>(false);
  const [lastWin1, setLastWin1] = useState<number | null>(null);

  const [hasBet2, setHasBet2] = useState<boolean>(false);
  const [cashedOut2, setCashedOut2] = useState<boolean>(false);
  const [lastWin2, setLastWin2] = useState<number | null>(null);

  const [betsTab, setBetsTab] = useState<'all' | 'previous' | 'top'>('all');

  // Simulated Online Players Table Feed
  const [players, setPlayers] = useState<SimulatedPlayer[]>([]);

  const crashPoint = useRef<number>(2.01);
  const flightStartTime = useRef<number>(0);
  const flightTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Plane animation trajectory coordinates
  const [planeX, setPlaneX] = useState<number>(5);
  const [planeY, setPlaneY] = useState<number>(85);

  // Initialize simulated player list
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

  // Continuous Auto-Loop Effect for Aviator
  useEffect(() => {
    if (activeTab !== 'aviator') {
      if (flightTimer.current) clearInterval(flightTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      return;
    }

    startWaitingPhase();

    return () => {
      if (flightTimer.current) clearInterval(flightTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, [activeTab]);

  const startWaitingPhase = () => {
    if (flightTimer.current) clearInterval(flightTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);

    setFlightState('WAITING');
    setCountdown(5);
    setMultiplier(1.00);
    setPlaneX(5);
    setPlaneY(85);
    setCashedOut1(false);
    setCashedOut2(false);
    setLastWin1(null);
    setLastWin2(null);

    // Reset player win statuses
    setPlayers(prev => prev.map(p => ({
      ...p,
      stake: Math.floor(Math.random() * 500) + 50,
      cashedMult: undefined,
      winAmt: undefined,
    })));

    let cd = 5;
    countdownTimer.current = setInterval(() => {
      cd--;
      setCountdown(cd);
      if (cd <= 0) {
        if (countdownTimer.current) clearInterval(countdownTimer.current);
        startFlightPhase();
      }
    }, 1000);
  };

  const startFlightPhase = () => {
    setFlightState('FLYING');

    const rand = Math.random();
    const generatedCrash = rand < 0.2 ? 1.05 + Math.random() * 0.2 : rand < 0.75 ? 1.25 + Math.random() * 2.2 : 3.5 + Math.random() * 8;
    crashPoint.current = Number(generatedCrash.toFixed(2));
    flightStartTime.current = Date.now();

    flightTimer.current = setInterval(() => {
      const elapsed = (Date.now() - flightStartTime.current) / 1000;
      const currentMult = Number((Math.exp(elapsed * 0.14)).toFixed(2));

      // Trajectory curve calculation
      const progress = Math.min(100, (elapsed / 7) * 100);
      setPlaneX(Math.min(85, 5 + progress * 0.8));
      setPlaneY(Math.max(15, 85 - Math.pow(progress / 100, 0.7) * 70));

      // Simulate random player cashouts
      setPlayers(prev => prev.map(p => {
        if (!p.cashedMult && Math.random() < 0.08 && currentMult > 1.2) {
          const mult = currentMult;
          return { ...p, cashedMult: mult, winAmt: Math.round(p.stake * mult) };
        }
        return p;
      }));

      // Check auto cashout 1
      const autoNum1 = Number(autoCashout1);
      if (hasBet1 && !cashedOut1 && autoNum1 > 1 && currentMult >= autoNum1) {
        handleCashOut(1, currentMult);
      }

      // Check auto cashout 2
      const autoNum2 = Number(autoCashout2);
      if (hasBet2 && !cashedOut2 && autoNum2 > 1 && currentMult >= autoNum2) {
        handleCashOut(2, currentMult);
      }

      if (currentMult >= crashPoint.current) {
        if (flightTimer.current) clearInterval(flightTimer.current);
        handleCrash(crashPoint.current);
      } else {
        setMultiplier(currentMult);
      }
    }, 80);
  };

  const handleCrash = (finalCrash: number) => {
    setFlightState('CRASHED');
    setMultiplier(finalCrash);
    setHasBet1(false);
    setHasBet2(false);
    setMultiplierHistory(prev => [finalCrash, ...prev.slice(0, 15)]);

    setTimeout(() => {
      startWaitingPhase();
    }, 3500);
  };

  const placeDemoBet = (panel: 1 | 2) => {
    const amt = panel === 1 ? stake1 : stake2;
    if (!amt || amt < 1 || amt > demoBalance) return;

    setDemoBalance(prev => prev - amt);
    if (panel === 1) { setHasBet1(true); setCashedOut1(false); }
    else { setHasBet2(true); setCashedOut2(false); }
  };

  const handleCashOut = (panel: 1 | 2, forcedMult?: number) => {
    const isPanel1 = panel === 1;
    const activeBet = isPanel1 ? hasBet1 : hasBet2;
    const isCashed = isPanel1 ? cashedOut1 : cashedOut2;

    if (!activeBet || isCashed || flightState !== 'FLYING') return;

    const finalMult = forcedMult || multiplier;
    const amt = isPanel1 ? stake1 : stake2;
    const winAmount = Math.round(amt * finalMult);

    if (isPanel1) {
      setCashedOut1(true);
      setHasBet1(false);
      setLastWin1(winAmount);
    } else {
      setCashedOut2(true);
      setHasBet2(false);
      setLastWin2(winAmount);
    }

    setDemoBalance(prev => prev + winAmount);
  };

  // --- CASINO SUITE STATE ---
  const [casinoSubTab, setCasinoSubTab] = useState<'roulette' | 'slots' | 'dice' | 'coin'>('roulette');
  const [casinoChoice, setCasinoChoice] = useState<string>('Red');
  const [casinoSpinning, setCasinoSpinning] = useState<boolean>(false);
  const [casinoResult, setCasinoResult] = useState<string | null>(null);
  const [casinoPayout, setCasinoPayout] = useState<number | null>(null);

  const slotSymbols = ['🍒', '💎', '🔔', '7️⃣', '🎰', '🍋'];
  const [reels, setReels] = useState<string[]>(['🍒', '💎', '7️⃣']);
  const [diceTarget, setDiceTarget] = useState<number>(50);

  const playCasinoGame = () => {
    const stakeNum = stake1;
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
            setCasinoResult(`JACKPOT! Won ${winMult}x`);
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

  useEffect(() => {
    const base = marketPrices[tradeSymbol];
    setCurrentPrice(base);
    const initial = Array.from({ length: 25 }, (_, i) => ({
      time: `${i + 1}s`,
      price: base + (Math.sin(i / 3) * (base * 0.004)) + ((Math.random() - 0.5) * (base * 0.002))
    }));
    setTradeChartData(initial);
  }, [tradeSymbol]);

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
    const stakeNum = stake1;
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

  return (
    <div className="aviator-spribe-container w-full bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* 1. OFFICIAL AVIATOR RED HEADER BAR */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-black italic text-xl text-red-500 tracking-wider">
            <Plane className="w-5 h-5 text-red-500 transform -rotate-12 fill-current" /> Aviator
          </div>
          <span className="hidden sm:inline text-xs text-slate-400 border-l border-slate-700 pl-3">
            SPRIBE OFFICIAL UI
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">Balance:</span>
            <strong className="text-emerald-400 font-bold">{formatCredits(demoBalance)} KSh</strong>
          </div>

          <Button
            onClick={() => onGoToAuth('signup')}
            className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2 shadow-lg"
          >
            SIGN IN / DEPOSIT REAL CASH
          </Button>
        </div>
      </header>

      {/* 2. GAME CATEGORY TAB SWITCHER */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex gap-2">
        <button
          onClick={() => setActiveTab('aviator')}
          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'aviator' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Plane className="w-3.5 h-3.5" /> Aviator Crash
        </button>
        <button
          onClick={() => setActiveTab('casino')}
          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'casino' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Dices className="w-3.5 h-3.5" /> Casino Classics
        </button>
        <button
          onClick={() => setActiveTab('trading')}
          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'trading' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Trading Markets
        </button>
      </div>

      {/* --- TAB 1: SPRIBE AVIATOR OFFICIAL INTERFACE --- */}
      {activeTab === 'aviator' && (
        <div className="p-3 md:p-4 space-y-3">
          {/* Top Multiplier History Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
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

          {/* Main Grid: Left Bets Table + Center Flight Arena */}
          <div className="grid lg:grid-cols-12 gap-3">
            {/* Left Bets & Players Panel (4 columns) */}
            <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between min-h-[420px]">
              <div>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-bold text-slate-400">
                  <button
                    onClick={() => setBetsTab('all')}
                    className={`flex-1 py-1 rounded ${betsTab === 'all' ? 'bg-slate-800 text-white' : ''}`}
                  >
                    All Bets
                  </button>
                  <button
                    onClick={() => setBetsTab('previous')}
                    className={`flex-1 py-1 rounded ${betsTab === 'previous' ? 'bg-slate-800 text-white' : ''}`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setBetsTab('top')}
                    className={`flex-1 py-1 rounded ${betsTab === 'top' ? 'bg-slate-800 text-white' : ''}`}
                  >
                    Top
                  </button>
                </div>

                <div className="flex justify-between items-center my-3 text-[11px] text-slate-400 px-1 font-mono">
                  <span>287/335 Bets</span>
                  <span>Total win KSh</span>
                </div>

                {/* Table Feed */}
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

            {/* Center Flight Arena (8 columns) */}
            <div className="lg:col-span-8 space-y-3 flex flex-col">
              {/* Flight Stage Arena */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[300px] md:min-h-[340px] shadow-2xl">
                {/* Top FUN MODE badge */}
                <div className="flex justify-between items-center z-10">
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                    FUN MODE · DEMO CREDITS
                  </span>
                  <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded text-xs text-slate-400 font-mono">
                    <Users className="w-3.5 h-3.5 text-emerald-400" /> 172
                  </div>
                </div>

                {/* Sunburst Background & Flight Path SVG */}
                <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/40 via-slate-950 to-slate-950" />
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 500 300" preserveAspectRatio="none">
                  <path d="M 10 280 Q 250 270 480 30" stroke="#ef4444" strokeWidth="4" fill="none" />
                </svg>

                {/* Real Moving Airplane Graphic */}
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
                      flightState === 'FLYING' ? 'animate-pulse scale-110 shadow-red-500/80' : ''
                    }`}
                  />
                </div>

                {/* Center Display: Flew Away / Waiting / Multiplier */}
                <div className="my-auto text-center z-10">
                  {flightState === 'WAITING' ? (
                    <div className="space-y-2">
                      <span className="text-sm font-bold text-amber-400 uppercase tracking-widest block font-mono">
                        WAITING FOR NEXT ROUND
                      </span>
                      <div className="text-3xl font-black font-mono text-slate-100">
                        00:0{countdown}
                      </div>
                    </div>
                  ) : flightState === 'CRASHED' ? (
                    <div className="space-y-1">
                      <span className="text-xl md:text-2xl font-black text-slate-200 uppercase tracking-widest block">
                        FLEW AWAY!
                      </span>
                      <div className="text-6xl md:text-7xl font-black font-mono text-red-600 tracking-tight">
                        {multiplier.toFixed(2)}x
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-6xl md:text-7xl font-black font-mono text-slate-100 tracking-tight">
                        {multiplier.toFixed(2)}<span className="text-4xl">x</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500 z-10 border-t border-slate-900 pt-2 font-mono">
                  <span>PROBABLY FAIR ● SPRIBE ENGINE</span>
                  <span>100% SECURE</span>
                </div>
              </div>

              {/* DUAL BET CONTROLS (Two Side-by-Side Bet Panels!) */}
              <div className="grid md:grid-cols-2 gap-3">
                {/* BET PANEL 1 */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-300">Bet Panel 1</span>
                    <div className="flex bg-slate-950 rounded p-0.5 text-[10px] font-bold">
                      <button className="px-2 py-0.5 rounded bg-slate-800 text-white">Bet</button>
                      <button className="px-2 py-0.5 text-slate-500">Auto</button>
                    </div>
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
                          <button
                            key={val}
                            onClick={() => setStake1(val)}
                            className="bg-slate-950 hover:bg-slate-800 text-slate-300 py-1 rounded border border-slate-800"
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Big Action Button 1 */}
                    {flightState === 'WAITING' ? (
                      <Button
                        onClick={() => placeDemoBet(1)}
                        disabled={hasBet1 || stake1 > demoBalance}
                        className="w-full h-full min-h-[64px] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl shadow-lg flex flex-col items-center justify-center leading-tight"
                      >
                        <span>{hasBet1 ? 'BET PLACED' : 'BET'}</span>
                        <span className="text-xs font-mono font-normal opacity-90">{stake1}.00 KSh</span>
                      </Button>
                    ) : flightState === 'FLYING' && hasBet1 && !cashedOut1 ? (
                      <Button
                        onClick={() => handleCashOut(1)}
                        className="w-full h-full min-h-[64px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs md:text-sm rounded-xl shadow-xl animate-pulse flex flex-col items-center justify-center leading-tight"
                      >
                        <span>CASH OUT</span>
                        <span className="font-mono font-bold text-xs">{formatCredits(Math.round(stake1 * multiplier))} KSh</span>
                      </Button>
                    ) : (
                      <Button
                        disabled
                        className="w-full h-full min-h-[64px] bg-slate-800 text-slate-500 font-bold text-xs rounded-xl flex flex-col items-center justify-center"
                      >
                        <span>{cashedOut1 ? `CASHED OUT!` : 'WAITING'}</span>
                        <span className="text-[10px] font-mono">{lastWin1 ? `+${formatCredits(lastWin1)} KSh` : ''}</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* BET PANEL 2 */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-300">Bet Panel 2</span>
                    <div className="flex bg-slate-950 rounded p-0.5 text-[10px] font-bold">
                      <button className="px-2 py-0.5 rounded bg-slate-800 text-white">Bet</button>
                      <button className="px-2 py-0.5 text-slate-500">Auto</button>
                    </div>
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
                          <button
                            key={val}
                            onClick={() => setStake2(val)}
                            className="bg-slate-950 hover:bg-slate-800 text-slate-300 py-1 rounded border border-slate-800"
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Big Action Button 2 */}
                    {flightState === 'WAITING' ? (
                      <Button
                        onClick={() => placeDemoBet(2)}
                        disabled={hasBet2 || stake2 > demoBalance}
                        className="w-full h-full min-h-[64px] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl shadow-lg flex flex-col items-center justify-center leading-tight"
                      >
                        <span>{hasBet2 ? 'BET PLACED' : 'BET'}</span>
                        <span className="text-xs font-mono font-normal opacity-90">{stake2}.00 KSh</span>
                      </Button>
                    ) : flightState === 'FLYING' && hasBet2 && !cashedOut2 ? (
                      <Button
                        onClick={() => handleCashOut(2)}
                        className="w-full h-full min-h-[64px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs md:text-sm rounded-xl shadow-xl animate-pulse flex flex-col items-center justify-center leading-tight"
                      >
                        <span>CASH OUT</span>
                        <span className="font-mono font-bold text-xs">{formatCredits(Math.round(stake2 * multiplier))} KSh</span>
                      </Button>
                    ) : (
                      <Button
                        disabled
                        className="w-full h-full min-h-[64px] bg-slate-800 text-slate-500 font-bold text-xs rounded-xl flex flex-col items-center justify-center"
                      >
                        <span>{cashedOut2 ? `CASHED OUT!` : 'WAITING'}</span>
                        <span className="text-[10px] font-mono">{lastWin2 ? `+${formatCredits(lastWin2)} KSh` : ''}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: CASINO CLASSICS --- */}
      {activeTab === 'casino' && (
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
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
                    casinoSubTab === tab.id ? 'bg-red-600 text-white' : 'border-slate-700 text-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {tab.label}
                </Button>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[320px]">
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
                  <p className="text-xs text-slate-400 font-semibold">
                    3 Matching symbols = 10x Win | 2 Matching symbols = 2.5x Win
                  </p>
                </div>
              )}

              {casinoSubTab === 'roulette' && (
                <div className="text-center space-y-4">
                  <div className={`w-36 h-36 md:w-44 md:h-44 rounded-full border-8 border-amber-500/80 bg-gradient-to-tr from-slate-900 to-slate-950 mx-auto flex items-center justify-center shadow-2xl relative ${
                    casinoSpinning ? 'animate-spin' : ''
                  }`}>
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center font-black text-xs text-emerald-300">
                      37 N
                    </div>
                  </div>
                  <div className="flex justify-center gap-2 text-xs font-bold">
                    <span className="px-3 py-1 bg-red-600 text-white rounded-md">Red (18)</span>
                    <span className="px-3 py-1 bg-slate-950 text-white rounded-md border border-slate-800">Black (18)</span>
                    <span className="px-3 py-1 bg-emerald-600 text-white rounded-md">Green (0)</span>
                  </div>
                </div>
              )}

              {casinoSubTab === 'dice' && (
                <div className="w-full max-w-md text-center space-y-5">
                  <div className="text-5xl font-black font-mono text-emerald-500 my-2">
                    {casinoResult || 'Roll < Target'}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-400">
                      <span>Target: Roll Under {diceTarget}</span>
                      <span>Win Chance: {diceTarget}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      value={diceTarget}
                      onChange={e => setDiceTarget(Number(e.target.value))}
                      className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                  </div>
                </div>
              )}

              {casinoSubTab === 'coin' && (
                <div className="text-center space-y-4">
                  <div className={`w-32 h-32 rounded-full bg-amber-400 border-4 border-amber-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-2xl mx-auto ${
                    casinoSpinning ? 'animate-spin' : ''
                  }`}>
                    {casinoResult ? casinoResult.split(' ')[1] || 'COIN' : '🪙 50/50'}
                  </div>
                </div>
              )}

              {casinoResult && (
                <div className="mt-5 text-center">
                  <div className="text-lg font-bold text-white">{casinoResult}</div>
                  {casinoPayout && (
                    <div className="text-sm font-extrabold text-emerald-400 mt-1">
                      🎉 Won KSh {formatCredits(casinoPayout)}!
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold">Select Prediction</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Place your wager.</p>
                </div>

                {casinoSubTab === 'roulette' && (
                  <div className="grid grid-cols-3 gap-1.5">
                    <Button
                      type="button"
                      variant={casinoChoice === 'Red' ? 'default' : 'outline'}
                      onClick={() => setCasinoChoice('Red')}
                      className={casinoChoice === 'Red' ? 'bg-red-600 text-white font-bold' : 'border-slate-800'}
                    >
                      Red (2x)
                    </Button>
                    <Button
                      type="button"
                      variant={casinoChoice === 'Black' ? 'default' : 'outline'}
                      onClick={() => setCasinoChoice('Black')}
                      className={casinoChoice === 'Black' ? 'bg-slate-950 text-white font-bold' : 'border-slate-800'}
                    >
                      Black (2x)
                    </Button>
                    <Button
                      type="button"
                      variant={casinoChoice === 'Green 0' ? 'default' : 'outline'}
                      onClick={() => setCasinoChoice('Green 0')}
                      className={casinoChoice === 'Green 0' ? 'bg-emerald-600 text-white font-bold' : 'border-slate-800'}
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
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Wager Amount (KSh Demo)
                  </label>
                  <input
                    type="number"
                    value={stake1}
                    onChange={e => setStake1(Number(e.target.value))}
                    min={10}
                    max={demoBalance}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <Button
                onClick={playCasinoGame}
                disabled={casinoSpinning || !stake1 || stake1 < 1 || stake1 > demoBalance}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-sm mt-4 shadow-md"
              >
                {casinoSpinning ? 'Spinning...' : 'Play Round'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: CRYPTO & ASSET TRADING --- */}
      {activeTab === 'trading' && (
        <div className="p-4 space-y-4">
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-1.5">
                  {(['BTC', 'ETH', 'SOL', 'AAPL'] as const).map(sym => (
                    <Button
                      key={sym}
                      variant={tradeSymbol === sym ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTradeSymbol(sym)}
                      className={`text-xs font-bold ${tradeSymbol === sym ? 'bg-red-600 text-white' : 'border-slate-800 text-slate-400'}`}
                    >
                      {sym}/USD
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-xs text-slate-400">LIVE PRICE:</span>
                  <strong className="text-base text-emerald-400">
                    ${currentPrice.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tradeChartData}>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                    <Tooltip
                      formatter={(val: number) => `$${val.toFixed(2)}`}
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="price" stroke="#ef4444" fill="#ef444420" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {openTrade && (
                <div className="bg-slate-950 p-4 rounded-xl flex items-center justify-between border border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-bold">{openTrade.type} {openTrade.symbol}</span>
                    <div className="text-sm font-bold mt-0.5 text-white">
                      Entry: ${openTrade.entry.toFixed(2)} | Stake: KSh {openTrade.stake}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-base font-black font-mono block ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pnl >= 0 ? '+' : ''}KSh {pnl.toFixed(2)}
                    </span>
                    <Button size="sm" onClick={closeTrade} className="mt-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold">
                      Close Position
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold">Execute Order</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Spot market orders.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Trade Amount (KSh Demo)
                  </label>
                  <input
                    type="number"
                    value={stake1}
                    onChange={e => setStake1(Number(e.target.value))}
                    min={10}
                    max={demoBalance}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-4">
                <Button
                  onClick={() => executeTrade('BUY')}
                  disabled={!!openTrade || !stake1 || stake1 < 1 || stake1 > demoBalance}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-sm"
                >
                  Buy / Long
                </Button>
                <Button
                  onClick={() => executeTrade('SELL')}
                  disabled={!!openTrade || !stake1 || stake1 < 1 || stake1 > demoBalance}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold h-12 text-sm"
                >
                  Sell / Short
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
