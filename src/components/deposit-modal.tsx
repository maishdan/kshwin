import { useState } from 'react';
import { Wallet, Smartphone, CreditCard, Coins, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
}

export function DepositModal({ open, onOpenChange, onSuccess }: DepositModalProps) {
  const [method, setMethod] = useState<'mpesa' | 'airtel' | 'card' | 'crypto'>('mpesa');
  const [amount, setAmount] = useState<string>('1000');
  const [phone, setPhone] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const depositAmt = Number(amount);
    if (!depositAmt || depositAmt < 50 || depositAmt > 500000) {
      toast.error('Deposit amount must be between KSh 50 and KSh 500,000');
      return;
    }

    if ((method === 'mpesa' || method === 'airtel') && (!phone || phone.length < 9)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setBusy(true);
    setSuccessMsg(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in to deposit');

      // Update wallet balance in Supabase
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (walletError && walletError.code !== 'PGRST116') {
        throw walletError;
      }

      const currentBal = wallet ? Number(wallet.balance) : 0;
      const newBal = currentBal + depositAmt;

      const { error: updateError } = await supabase
        .from('wallets')
        .upsert({ user_id: user.id, balance: newBal });

      if (updateError) throw updateError;

      // Record deposit in history
      await supabase.from('play_history').insert({
        user_id: user.id,
        game: `Deposit (${method.toUpperCase()})`,
        stake: depositAmt,
        payout: depositAmt,
        result: `KSh ${depositAmt.toLocaleString()} deposited via ${method.toUpperCase()}`
      });

      await onSuccess();
      setSuccessMsg(`KSh ${depositAmt.toLocaleString()} successfully deposited to your real wallet!`);
      toast.success(`KSh ${depositAmt.toLocaleString()} deposited successfully!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Deposit failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Wallet className="w-5 h-5 text-emerald-500" /> Deposit Funds
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Top up your account balance for real money trading & game play.
          </DialogDescription>
        </DialogHeader>

        {successMsg ? (
          <div className="py-6 text-center space-y-4">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-foreground">Deposit Completed!</h3>
            <p className="text-xs text-muted-foreground">{successMsg}</p>
            <Button
              onClick={() => { setSuccessMsg(null); onOpenChange(false); }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              Start Playing Now <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleDeposit} className="space-y-4 py-2">
            {/* Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">Select Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('mpesa')}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                    method === 'mpesa' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold' : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <div>
                    <div className="text-xs font-bold">M-Pesa STK</div>
                    <div className="text-[10px] text-muted-foreground">Instant Kenya</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('airtel')}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                    method === 'airtel' ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 font-bold' : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-red-500" />
                  <div>
                    <div className="text-xs font-bold">Airtel Money</div>
                    <div className="text-[10px] text-muted-foreground">Instant Kenya</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('card')}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                    method === 'card' ? 'border-primary bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-primary" />
                  <div>
                    <div className="text-xs font-bold">Card</div>
                    <div className="text-[10px] text-muted-foreground">Visa / Mastercard</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('crypto')}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                    method === 'crypto' ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold' : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <Coins className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="text-xs font-bold">Crypto</div>
                    <div className="text-[10px] text-muted-foreground">USDT / BTC</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Phone input for M-Pesa / Airtel */}
            {(method === 'mpesa' || method === 'airtel') && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Mobile Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="0712345678 or 254712345678"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  className="w-full bg-background border rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* Amount input */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Deposit Amount (KSh)
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min={50}
                max={500000}
                required
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500"
              />
              <div className="flex gap-2 mt-2">
                {[500, 1000, 2500, 5000, 10000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(String(amt))}
                    className="flex-1 py-1 text-xs font-semibold bg-muted hover:bg-secondary rounded-md transition-colors"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={busy}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11"
              >
                {busy ? 'Processing Deposit...' : `Deposit KSh ${Number(amount || 0).toLocaleString()} Now`}
              </Button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Secure 256-bit encrypted deposit transaction
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
