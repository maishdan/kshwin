import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { playSchema } from './play-schema';
export type PlayResult = { status?: 'idle'|'flying'|'crashed'|'cashed'; multiplier?: number; balance: number; payout?: number; result?: string };
export const play = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => playSchema.parse(input)).handler(async ({data,context}) => {
 const {data: result,error} = await context.supabase.rpc('play_action',{p_game:data.game,p_stake:data.stake,p_choice:data.choice,p_action:data.action});
 if(error) throw new Error(error.message); return result as unknown as PlayResult;
});
