import {createFileRoute} from '@tanstack/react-router';
import {useState} from 'react';
import {supabase} from '@/integrations/supabase/client';
import {useAccount} from '@/components/app-shell';
import {Button} from '@/components/ui/button';
import {pageHead} from '@/lib/site';
import {toast} from 'sonner';
export const Route=createFileRoute('/_authenticated/profile')({head:()=>pageHead('My profile','Manage your personal Verve profile.'),component:Profile});
function Profile(){const {name,refresh}=useAccount();const [busy,setBusy]=useState(false);return <><div className="page-heading"><div><h1>Make it yours.</h1><p>Your Verve profile.</p></div></div><form className="max-w-md" onSubmit={async e=>{e.preventDefault();const display_name=String(new FormData(e.currentTarget).get('name')).trim();if(!display_name||display_name.length>60){toast.error('Use 1–60 characters.');return;}setBusy(true);const {data:{user}}=await supabase.auth.getUser();if(user){const {error}=await supabase.from('profiles').update({display_name}).eq('id',user.id);if(error)toast.error(error.message);else{await refresh();toast.success('Profile saved');}}setBusy(false);}}><label className="field">Display name<input key={name} name="name" defaultValue={name} required maxLength={60}/></label><Button disabled={busy} type="submit">{busy?'Saving…':'Save profile'}</Button><p className="text-xs text-muted-foreground mt-8">Your virtual credits have no monetary value.</p></form></>;}
