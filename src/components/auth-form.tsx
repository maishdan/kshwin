import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, ArrowUpRight, Sparkles, Wallet } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Brand } from './brand';
import { DemoPlayground } from './demo-playground';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import world from '@/assets/play-world.jpg';

const credentials = z.object({ email: z.string().trim().email('Enter a valid email address').max(255), password: z.string().min(8,'Use a password with at least 8 characters').max(128), name:z.string().trim().max(60) });

export function AuthForm() {
 const [mode,setMode]=useState<'login'|'signup'|'forgot'|'demo'>('login');
 const [show,setShow]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=setErrorState('');
 const [notice,setNotice]=setNoticeState('');
 const [adult,setAdult]=useState(false);
 const navigate=useNavigate();

 function setErrorState(val: string) { return useState(val); }
 function setNoticeState(val: string) { return useState(val); }

 async function submit(event:React.FormEvent<HTMLFormElement>) {
   event.preventDefault();setError('');setNotice('');
   const form=new FormData(event.currentTarget); setBusy(true);
   try {
     const email=z.string().trim().email().max(255).parse(form.get('email'));
     if(mode==='forgot') {
       const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/reset-password'});
       if(error)throw error;
       setNotice('If an account exists, a password reset link is on its way.');
       return;
     }
     const values=credentials.parse({email,password:form.get('password'),name:form.get('name')||''});
     if(mode==='signup') {
       if(!adult)throw new Error('Please confirm you are 18 or older.');
       if(!values.name)throw new Error('Enter your display name.');
       const {error}=await supabase.auth.signUp({email,password:values.password,options:{data:{display_name:values.name},emailRedirectTo:window.location.origin}});
       if(error)throw error;
       setNotice('Check your email to confirm your account, then sign in.');
     } else {
       const {error}=await supabase.auth.signInWithPassword({email,password:values.password});
       if(error)throw error;
       await navigate({to:'/lobby'});
     }
   } catch(e){
     setError(e instanceof z.ZodError?e.issues[0]?.message||'Check your details':e instanceof Error?e.message:'Unable to continue. Try again.');
   } finally{setBusy(false);}
 }

 async function google(){
   setBusy(true);setError('');
   try{
     const result=await lovable.auth.signInWithOAuth('google',{redirect_uri:window.location.origin});
     if(result.error)throw result.error;
     if(!result.redirected)await navigate({to:'/lobby'});
   }catch(e){
     setError(e instanceof Error?e.message:'Google sign-in could not start.');
   }finally{setBusy(false);}
 }

 const change=(next:typeof mode)=>{setMode(next);setError('');setNotice('');};

 return (
   <main className="auth-page">
     <section className="auth-left">
       <Brand/>
       <div className={`auth-form ${mode === 'demo' ? 'max-w-4xl w-full' : ''}`}>
         <div className="eyebrow">KSH WIN · HYBRID PLAY & TRADING</div>
         <h1 className="text-3xl font-extrabold tracking-tight">
           {mode==='signup'?'Make it your world.':mode==='forgot'?'A fresh start.':mode==='demo'?'Try Demo Account.':'Welcome back.'}
         </h1>
         <p className="intro">
           {mode==='demo'?'Practice games & trading with $10,000 demo credits. Sign in to deposit real money!':mode==='forgot'?'Let’s get you back into your account.':'Sign in or play in demo mode before depositing real funds.'}
         </p>

         <div className="segment mb-6">
           <Button variant="ghost" className={mode==='login'?'selected':''} onClick={()=>change('login')}>Sign in</Button>
           <Button variant="ghost" className={mode==='signup'?'selected':''} onClick={()=>change('signup')}>Create account</Button>
           <Button variant="ghost" className={mode==='demo'?'selected text-emerald-600 dark:text-emerald-400 font-bold':''} onClick={()=>change('demo')}>🎮 Try Demo</Button>
         </div>

         {mode === 'demo' ? (
           <DemoPlayground onGoToAuth={(target) => change(target || 'signup')} />
         ) : (
           <>
             <form onSubmit={submit}>
               {mode==='signup'&&(
                 <label className="field">Display name
                   <input name="name" autoComplete="nickname" placeholder="What should we call you?" required maxLength={60}/>
                 </label>
               )}
               <label className="field">Email address
                 <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={255}/>
               </label>
               {mode!=='forgot'&&(
                 <label className="field">Password
                   <div className="password-field">
                     <input name="password" type={show?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} placeholder="Enter your password" minLength={8} maxLength={128} required/>
                     <Button type="button" size="icon" variant="ghost" aria-label={show?'Hide password':'Show password'} onClick={()=>setShow(!show)}>
                       {show?<EyeOff/>:<Eye/>}
                     </Button>
                   </div>
                 </label>
               )}
               {mode==='login'&&(
                 <div className="flex items-center justify-between text-xs">
                   <span className="flex items-center gap-2 text-muted-foreground"><LockKeyhole size={12}/> Private & secure</span>
                   <Button variant="link" size="sm" type="button" onClick={()=>change('forgot')}>Forgot password?</Button>
                 </div>
               )}
               {mode==='signup'&&(
                 <label className="flex items-start gap-2 text-xs text-muted-foreground">
                   <input type="checkbox" required checked={adult} onChange={e=>setAdult(e.target.checked)}/>
                   I’m 18 or older. I understand real money gambling requires a deposited balance.
                 </label>
               )}
               {error&&<p role="alert" className="error-text mt-4">{error}</p>}
               {notice&&<p role="status" className="success-text mt-4">{notice}</p>}
               <Button className="auth-submit bg-emerald-600 hover:bg-emerald-500 text-white font-bold" type="submit" disabled={busy}>
                 {busy?'Please wait…':mode==='signup'?'Create Real Account':mode==='forgot'?'Send reset link':'Sign in & Deposit'}
                 <ArrowRight/>
               </Button>
             </form>

             {mode==='forgot'?(
               <Button variant="link" className="w-full mt-4" onClick={()=>change('login')}>Back to sign in</Button>
             ):(
               <>
                 <div className="divider">OR CONTINUE WITH</div>
                 <Button variant="outline" className="google-button" disabled={busy} onClick={google}>
                   <span className="text-base font-bold">G</span> Google
                 </Button>
               </>
             )}

             <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-lg mt-6 text-xs text-emerald-300 flex items-center gap-2">
               <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
               <span>Instant M-Pesa, Airtel Money, Card & Crypto deposits available upon sign in.</span>
             </div>

             <div className="auth-note"><ShieldCheck size={13}/> Certified random outcomes · 18+ strictly</div>
           </>
         )}
       </div>

       <footer className="auth-bottom">
         <span>© 2026 KSH WIN. All rights reserved.</span>
         <span className="flex items-center gap-2">18+ <span>•</span> Play responsibly</span>
       </footer>
     </section>

     <section className="auth-art" aria-label="KSH WIN play and trade">
       <img src={world} alt="KSH WIN Aviator aircraft and casino dice" width={1024} height={1280}/>
       <div className="art-content">
         <div className="art-badge"><span>✦</span> HYBRID TRADING & CASINO</div>
         <h2>KSH WIN.<br/>Play Demo or<br/><span>Gamble Real Money.</span></h2>
         <p>Try out Aviator, Casino games, and simulated Crypto trading with demo credits, or sign in to deposit real money!</p>

         <div className="mt-6 flex flex-wrap gap-2">
           <Button onClick={() => change('demo')} variant="secondary" className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
             🎮 Play Demo Mode ($10k)
           </Button>
           <Button onClick={() => change('signup')} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs">
             Deposit & Win Real Money
           </Button>
         </div>
       </div>
       <div className="art-footer">
         <span>PLAY DEMO · DEPOSIT REAL FUND · WIN CASH</span>
         <ArrowUpRight size={20}/>
       </div>
     </section>
   </main>
 );
}
