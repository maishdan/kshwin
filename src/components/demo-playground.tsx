import { useState, useEffect, useRef } from 'react';
import { Plane, Dices, TrendingUp, Wallet, ArrowRight, Sparkles, RefreshCw, ArrowUpRight, ShieldCheck, Flame, CircleDot, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCredits } from '@/lib/site';

interface DemoPlaygroundProps {
  onGoToAuth: (mode?: 'login' | 'signup') => void;
}

export function DemoPlayground({ onGoToAuth }: DemoPlaygroundProps) {
  const [demoBalance, setDemoBalance] = useState<number>(10000);
  const [activeTab, setActiveTab] = useState<'aviator' | 'casino' | 'trading'>('aviator');

  // Aviator state
  const [stake, setStake] = useState<string>('100');
  const [flying, setFlying] = useState<boolean>(false);
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [crashed, setCrashed] = useState<boolean>(false);
  const [cashedOut, setCashedOut] = useState<boolean>(false);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const flightTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const crashPoint = useRef<number>(2.00);

  // Casino state
  const [casinoGame, setCasinoGame] = useState<'roulette' | 'dice' | 'coin'>('roulette');
  const [choice, setChoice] = useState<string>('Red');
  const [casinoResult, setCasinoResult] = useState<string | null>(null);
  const [casinoWin, setCasinoWin] = useState<number | null>(null);

  // Trading state
  const [tradeSymbol, setTradeSymbol] = useState<'BTC' | 'ETH' | 'SOL'>('BTC');
  const [tradePrice, setTradePrice] = useState<number>(67432);
  const [openPosition, setOpenPosition] = useState<{ symbol: string; stake: number; entry: number } | null>(null);
  const [pnl, setPnl] = useState<number>(0);

  // Price fluctuation effect for trading
  useEffect(() => {
    const timer = setInterval(() => {
      const basePrices = { BTC: 67432, ETH: 3521, SOL: 148.72 };
      const change = (Math.random() - 0.48) * (basePrices[tradeSymbol] * 0.005);
      const newPrice = Math.max(1, basePrices[tradeSymbol] + change);
      setTradePrice(newPrice);

      if (openPosition && openPosition.symbol === tradeSymbol) {
        const pnlValue = ((newPrice - openPosition.entry) / openPosition.entry) * openPosition.stake;
        setPnl(pnlValue);
      }
    }, 1500);
    return () => clearInterval(timer);
  }, [tradeSymbol, openPosition]);

  // Handle Aviator Start Flight
  const startDemoFlight = () => {
    const stakeNum = Number(stake);
    if (!stakeNum || stakeNum < 1 || stakeNum > demoBalance) return;

    setDemoBalance(prev => prev - stakeNum);
    setFlying(true);
    setCrashed(false);
    setCashedOut(false);
    setLastWin(null);
    setMultiplier(1.00);

    // Random crash point between 1.1x and 15x
    const randomCrash = Number((1.05 + Math.pow(Math.random(), 2) * 8).toFixed(2));
    crashPoint.current = randomCrash;

    let currentMult = 1.00;
    flightTimer.current = setInterval(() => {
      currentMult = Number((currentMult + 0.05 + Math.random() * 0.03).toFixed(2));

      if (currentMult >= crashPoint.current) {
        if (flightTimer.current) clearInterval(flightTimer.current);
        setFlying(false);
        setCrashed(true);
        setMultiplier(crashPoint.current);
      } else {
        setMultiplier(currentMult);
      }
    }, 150);
  };

  // Handle Aviator Cashout
  const cashOutDemo = () => {
    if (!flying || cashedOut) return;
    if (flightTimer.current) clearInterval(flightTimer.current);

    const stakeNum = Number(stake);
    const winAmount = Math.round(stakeNum * multiplier);

    setFlying(false);
    setCashedOut(true);
    setLastWin(winAmount);
    setDemoBalance(prev => prev + winAmount);
  };

  // Handle Casino Play
  const playCasinoDemo = () => {
    const stakeNum = Number(stake);
    if (!stakeNum || stakeNum < 1 || stakeNum > demoBalance) return;

    setDemoBalance(prev => prev - stakeNum);
    setCasinoResult(null);
    setCasinoWin(null);

    setTimeout(() => {
      let win = false;
      let payout = 0;
      let resText = '';

      if (casinoGame === 'roulette') {
        const num = Math.floor(Math.random() * 37);
        const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num);
        const isGreen = num === 0;
        resText = isGreen ? 'Green 0' : isRed ? `Red ${num}` : `Black ${num}`;
        if ((choice === 'Red' && isRed) || (choice === 'Black' && !isRed && !isGreen)) {
          win = true;
          payout = Math.round(stakeNum * 2);
        }
      } else if (casinoGame === 'dice') {
        const roll = Math.floor(Math.random() * 100) + 1;
        resText = `Rolled ${roll}`;
        if ((choice === 'Under 50' && roll < 50) || (choice === 'Over 50' && roll > 50)) {
          win = true;
          payout = Math.round(stakeNum * 1.96);
        }
      } else {
        const flip = Math.random() < 0.5 ? 'Heads' : 'Tails';
        resText = flip;
        if (choice === flip) {
          win = true;
          payout = Math.round(stakeNum * 1.96);
        }
      }

      setCasinoResult(resText);
      if (win) {
        setCasinoWin(payout);
        setDemoBalance(prev => prev + payout);
      }
    }, 400);
  };

  // Handle Trading Buy & Sell
  const openDemoPosition = () => {
    const stakeNum = Number(stake);
    if (!stakeNum || stakeNum < 1 || stakeNum > demoBalance) return;

    setDemoBalance(prev => prev - stakeNum);
    setOpenPosition({ symbol: tradeSymbol, stake: stakeNum, entry: tradePrice });
    setPnl(0);
  };

  const closeDemoPosition = () => {
    if (!openPosition) return;
    const returnAmount = Math.round(openPosition.stake + pnl);
    setDemoBalance(prev => prev + returnAmount);
    setOpenPosition(null);
    setPnl(0);
  };

  const resetDemoBalance = () => {
    setDemoBalance(10000);
  };

  return (
    <div className="demo-playground space-y-5">
      {/* Real Money Callout Header */}
      <div className="bg-emerald-950/90 border border-emerald-500/40 text-emerald-100 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">DEMO MODE ACTIVE</span>
              <span className="text-[10px] bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded-full font-mono">Virtual Credits</span>
            </div>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              Practice betting & trading risk-free. Ready for real cash payouts?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => onGoToAuth('signup')}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-900/50 transition-all hover:scale-105"
          >
            Deposit & Win Real Money <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* Demo Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-secondary/80 px-3 py-1.5 rounded-lg border font-mono">
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-muted-foreground">Demo Balance:</span>
            <strong className="text-sm text-emerald-600 dark:text-emerald-400">KSh {formatCredits(demoBalance)}</strong>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetDemoBalance}
            title="Reset Demo Balance to 10,000"
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </Button>
        </div>

        {/* Demo Navigation Tabs */}
        <div className="flex gap-1.5 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('aviator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'aviator' ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Plane className="w-3.5 h-3.5" /> Aviator Crash
          </button>
          <button
            onClick={() => setActiveTab('casino')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'casino' ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Dices className="w-3.5 h-3.5" /> Casino
          </button>
          <button
            onClick={() => setActiveTab('trading')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'trading' ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Demo Trading
          </button>
        </div>
      </div>

      {/* Tab 1: Aviator Crash Demo */}
      {activeTab === 'aviator' && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-slate-950 text-slate-100 rounded-xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[260px] border border-slate-800">
            {/* Background Path */}
            <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 500 250">
              <path d="M 20 230 Q 250 220 480 30" stroke="#34d399" strokeWidth="3" fill="none" />
            </svg>

            <Plane className={`w-12 h-12 text-emerald-400 mb-3 transition-transform ${flying ? 'animate-bounce text-emerald-400 scale-125' : ''}`} />

            <div className={`text-5xl font-black tracking-tight font-mono ${crashed ? 'text-red-500' : cashedOut ? 'text-emerald-400' : 'text-slate-100'}`}>
              {multiplier.toFixed(2)}<span className="text-2xl font-bold">x</span>
            </div>

            <p className="text-xs text-slate-400 mt-2 font-medium">
              {flying ? '🚀 Flight in progress...' : crashed ? '💥 Plane crashed! Next flight ready.' : cashedOut ? `🎉 Cashed out! Won KSh ${formatCredits(lastWin || 0)}` : 'Tap Take Off to start demo flight'}
            </p>
          </div>

          <div className="bg-card border rounded-xl p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Flame className="w-4 h-4 text-emerald-500" /> Demo Bet
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Cash out before the plane flies away.</p>

              <div className="mt-4 space-y-3">
                <label className="block text-xs font-semibold text-muted-foreground">
                  Bet Amount (Demo KSh)
                  <input
                    type="number"
                    value={stake}
                    disabled={flying}
                    onChange={e => setStake(e.target.value)}
                    min={10}
                    max={demoBalance}
                    className="mt-1 w-full bg-background border rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500"
                  />
                </label>

                <div className="flex gap-1.5">
                  {[50, 100, 250, 500].map(amt => (
                    <button
                      key={amt}
                      disabled={flying}
                      onClick={() => setStake(String(amt))}
                      className="flex-1 py-1 text-xs font-bold bg-muted hover:bg-secondary rounded-md transition-colors"
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5">
              {!flying ? (
                <Button
                  onClick={startDemoFlight}
                  disabled={!Number(stake) || Number(stake) < 1 || Number(stake) > demoBalance}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11"
                >
                  Take Off (Demo)
                </Button>
              ) : (
                <Button
                  onClick={cashOutDemo}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm h-11 shadow-lg animate-pulse"
                >
                  Cash Out KSh {formatCredits(Math.round(Number(stake) * multiplier))}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Casino Demo */}
      {activeTab === 'casino' && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-card border rounded-xl p-6 flex flex-col items-center justify-center min-h-[260px]">
            <div className="flex gap-2 mb-6">
              <Button
                variant={casinoGame === 'roulette' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => { setCasinoGame('roulette'); setChoice('Red'); }}
                className="text-xs"
              >
                <CircleDot className="w-3.5 h-3.5 mr-1" /> Roulette
              </Button>
              <Button
                variant={casinoGame === 'dice' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => { setCasinoGame('dice'); setChoice('Under 50'); }}
                className="text-xs"
              >
                <Dices className="w-3.5 h-3.5 mr-1" /> Dice Roll
              </Button>
              <Button
                variant={casinoGame === 'coin' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => { setCasinoGame('coin'); setChoice('Heads'); }}
                className="text-xs"
              >
                <Coins className="w-3.5 h-3.5 mr-1" /> Coin Flip
              </Button>
            </div>

            <div className="text-3xl font-extrabold text-center font-mono my-2 text-emerald-600 dark:text-emerald-400">
              {casinoResult ? casinoResult : 'Pick your side and spin!'}
            </div>

            {casinoWin !== null && (
              <p className="text-sm font-bold text-emerald-500 mt-2">
                🎉 Won KSh {formatCredits(casinoWin)}!
              </p>
            )}
          </div>

          <div className="bg-card border rounded-xl p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold">Pick Outcome</h3>

              <div className="mt-4 space-y-3">
                {casinoGame === 'roulette' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={choice === 'Red' ? 'default' : 'outline'}
                      onClick={() => setChoice('Red')}
                      className={choice === 'Red' ? 'bg-red-600 hover:bg-red-500 text-white font-bold' : ''}
                    >
                      Red (2x)
                    </Button>
                    <Button
                      variant={choice === 'Black' ? 'default' : 'outline'}
                      onClick={() => setChoice('Black')}
                      className={choice === 'Black' ? 'bg-slate-900 hover:bg-slate-800 text-white font-bold' : ''}
                    >
                      Black (2x)
                    </Button>
                  </div>
                )}

                {casinoGame === 'dice' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={choice === 'Under 50' ? 'default' : 'outline'}
                      onClick={() => setChoice('Under 50')}
                    >
                      Under 50 (1.96x)
                    </Button>
                    <Button
                      variant={choice === 'Over 50' ? 'default' : 'outline'}
                      onClick={() => setChoice('Over 50')}
                    >
                      Over 50 (1.96x)
                    </Button>
                  </div>
                )}

                {casinoGame === 'coin' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={choice === 'Heads' ? 'default' : 'outline'}
                      onClick={() => setChoice('Heads')}
                    >
                      Heads (1.96x)
                    </Button>
                    <Button
                      variant={choice === 'Tails' ? 'default' : 'outline'}
                      onClick={() => setChoice('Tails')}
                    >
                      Tails (1.96x)
                    </Button>
                  </div>
                )}

                <label className="block text-xs font-semibold text-muted-foreground mt-3">
                  Bet Amount (Demo KSh)
                  <input
                    type="number"
                    value={stake}
                    onChange={e => setStake(e.target.value)}
                    min={10}
                    max={demoBalance}
                    className="mt-1 w-full bg-background border rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500"
                  />
                </label>
              </div>
            </div>

            <Button
              onClick={playCasinoDemo}
              disabled={!Number(stake) || Number(stake) < 1 || Number(stake) > demoBalance}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 mt-4"
            >
              Play Round
            </Button>
          </div>
        </div>
      )}

      {/* Tab 3: Trading Demo */}
      {activeTab === 'trading' && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-card border rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                {(['BTC', 'ETH', 'SOL'] as const).map(sym => (
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
              <span className="text-xs text-emerald-500 font-semibold animate-pulse">● LIVE DEMO FEED</span>
            </div>

            <div className="my-6 text-center">
              <span className="text-xs text-muted-foreground uppercase font-bold">{tradeSymbol} Price</span>
              <div className="text-4xl font-extrabold font-mono text-foreground mt-1">
                ${tradePrice.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {openPosition ? (
              <div className="bg-muted p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Open Position ({openPosition.symbol})</span>
                  <div className="text-sm font-bold mt-0.5">
                    Entry: ${openPosition.entry.toFixed(2)} | Stake: KSh {openPosition.stake}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-extrabold font-mono block ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {pnl >= 0 ? '+' : ''}KSh {pnl.toFixed(2)}
                  </span>
                  <Button size="sm" onClick={closeDemoPosition} className="mt-1 bg-slate-900 text-white hover:bg-slate-800 text-xs">
                    Close Trade
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-center text-xs text-muted-foreground italic">No position open currently.</p>
            )}
          </div>

          <div className="bg-card border rounded-xl p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold">Open Demo Trade</h3>
              <p className="text-xs text-muted-foreground mt-1">Simulated crypto markets.</p>

              <label className="block text-xs font-semibold text-muted-foreground mt-4">
                Trade Amount (Demo KSh)
                <input
                  type="number"
                  value={stake}
                  onChange={e => setStake(e.target.value)}
                  min={10}
                  max={demoBalance}
                  className="mt-1 w-full bg-background border rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500"
                />
              </label>
            </div>

            <Button
              onClick={openDemoPosition}
              disabled={!!openPosition || !Number(stake) || Number(stake) < 1 || Number(stake) > demoBalance}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 mt-4"
            >
              Buy {tradeSymbol} (Demo)
            </Button>
          </div>
        </div>
      )}

      {/* Real Money Callout Footer Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 border border-emerald-600/30 shadow-xl">
        <div className="max-w-md">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">KSH WIN REAL TRADING & GAMBLING</span>
          </div>
          <h4 className="text-lg font-bold mt-1 text-white">Switch to Real Account to Deposit & Cash Out Real Money</h4>
          <p className="text-xs text-emerald-200/80 mt-1">
            Sign in or create an account to deposit funds via M-Pesa, Card or Crypto and start winning real rewards today!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => onGoToAuth('login')}
            variant="outline"
            className="border-emerald-400 text-emerald-100 hover:bg-emerald-800/50 text-xs font-semibold"
          >
            Sign In
          </Button>
          <Button
            onClick={() => onGoToAuth('signup')}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg"
          >
            Create Account & Deposit <ArrowUpRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
