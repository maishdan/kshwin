import {createFileRoute,Link} from '@tanstack/react-router';
import {useEffect,useState} from 'react';
import {supabase} from '@/integrations/supabase/client';
import {Button} from '@/components/ui/button';
import {Brand} from '@/components/brand';
import {pageHead} from '@/lib/site';
export const Route=createFileRoute('/reset-password')({head:()=>pageHead('Reset password','Set a new password for your Verve account.'),component:Reset});
function Reset(){const [ready,setReady]=useState(false);const [message,setMessage]=useState('');useEffect(()=>{setReady(window.location.hash.includes('type=recovery')||new URLSearchParams(window.location.search).get('type')==='recovery');},[]);return <main className="auth-left min-h-screen"><Brand/><div className="auth-form"><h1>New password.</h1>{ready?<form onSubmit={async e=>{e.preventDefault();const password=String(new FormData(e.currentTarget).get('password'));if(password.length<8||password.length>128){setMessage('Use 8–128 characters.');return;}const {error}=await supabase.auth.updateUser({password});setMessage(error?error.message:'Password updated. You can sign in now.');}}><label className="field">New password<input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128}/></label><Button className="auth-submit">Update password</Button></form>:<p className="intro">Open the reset link from your email to set a new password.</p>}<p role="status" className="success-text mt-4">{message}</p><Button asChild variant="link"><Link to="/auth">Back to sign in</Link></Button></div></main>;}
