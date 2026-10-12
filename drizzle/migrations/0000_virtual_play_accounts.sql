CREATE TABLE public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, display_name text NOT NULL DEFAULT 'Player' CHECK (char_length(display_name) BETWEEN 1 AND 60));
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_profile_read ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY own_profile_update ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TABLE public.wallets (user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE, balance numeric NOT NULL DEFAULT 10000 CHECK (balance >= 0));
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_wallet ON public.wallets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TABLE public.play_history (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, game text NOT NULL, stake numeric NOT NULL, payout numeric NOT NULL, result text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.play_history TO authenticated;
GRANT ALL ON public.play_history TO service_role;
ALTER TABLE public.play_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_history ON public.play_history FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TABLE public.crash_rounds (user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE, game text NOT NULL, stake numeric NOT NULL, started_at timestamptz NOT NULL DEFAULT clock_timestamp(), crash_at numeric NOT NULL, settled boolean NOT NULL DEFAULT false);
GRANT ALL ON public.crash_rounds TO service_role;
ALTER TABLE public.crash_rounds ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.positions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, symbol text NOT NULL, stake numeric NOT NULL, entry numeric NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.positions TO authenticated;
GRANT ALL ON public.positions TO service_role;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_positions ON public.positions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE FUNCTION public.create_player() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.profiles(id,display_name) VALUES(NEW.id,left(coalesce(nullif(NEW.raw_user_meta_data->>'display_name',''),nullif(NEW.raw_user_meta_data->>'full_name',''),'Player'),60)); INSERT INTO public.wallets(user_id) VALUES(NEW.id); RETURN NEW; END; $$;
CREATE TRIGGER create_player_after_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_player();
CREATE FUNCTION public.play_action(p_game text, p_stake numeric DEFAULT 0, p_choice text DEFAULT '', p_action text DEFAULT 'play') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); bal numeric; pay numeric := 0; outcome text; r public.crash_rounds%ROWTYPE; mult numeric; elapsed numeric; n integer; pos public.positions%ROWTYPE; price numeric;
BEGIN
IF uid IS NULL THEN RAISE EXCEPTION 'Sign in to play'; END IF;
SELECT balance INTO bal FROM public.wallets WHERE user_id=uid FOR UPDATE;
IF bal IS NULL THEN RAISE EXCEPTION 'Account not ready'; END IF;
IF p_action IN ('status','cashout') THEN
 SELECT * INTO r FROM public.crash_rounds WHERE user_id=uid;
 IF r.user_id IS NULL OR r.settled THEN RETURN jsonb_build_object('status','idle','balance',bal); END IF;
 elapsed := extract(epoch FROM (clock_timestamp()-r.started_at)); mult:=round(exp(elapsed*0.12)::numeric,2);
 IF mult>=r.crash_at THEN
 UPDATE public.crash_rounds SET settled=true WHERE user_id=uid;
 INSERT INTO public.play_history(user_id,game,stake,payout,result) VALUES(uid,r.game,r.stake,0,'Crashed at '||r.crash_at||'x');
 RETURN jsonb_build_object('status','crashed','multiplier',r.crash_at,'balance',bal);
 END IF;
 IF p_action='cashout' THEN
 pay:=round(r.stake*mult,2); UPDATE public.wallets SET balance=balance+pay WHERE user_id=uid; UPDATE public.crash_rounds SET settled=true WHERE user_id=uid;
 INSERT INTO public.play_history(user_id,game,stake,payout,result) VALUES(uid,r.game,r.stake,pay,'Cash out at '||mult||'x');
 RETURN jsonb_build_object('status','cashed','multiplier',mult,'payout',pay,'balance',bal+pay);
 END IF;
 RETURN jsonb_build_object('status','flying','multiplier',mult,'balance',bal);
END IF;
IF p_action='sell' THEN
 SELECT * INTO pos FROM public.positions WHERE id::text=p_choice AND user_id=uid;
 IF pos.id IS NULL THEN RAISE EXCEPTION 'Position not found'; END IF;
 price:= CASE pos.symbol WHEN 'BTC' THEN 67432 WHEN 'ETH' THEN 3521 WHEN 'SOL' THEN 148.72 WHEN 'AAPL' THEN 227.18 ELSE 1.0942 END * (1+sin(extract(epoch FROM clock_timestamp())/60)*0.003);
 pay:=round(pos.stake*price/pos.entry,2); DELETE FROM public.positions WHERE id=pos.id;
 UPDATE public.wallets SET balance=balance+pay WHERE user_id=uid;
 INSERT INTO public.play_history(user_id,game,stake,payout,result) VALUES(uid,'Trade '||pos.symbol,pos.stake,pay,'Position closed');
 RETURN jsonb_build_object('balance',bal+pay,'payout',pay,'result','Position closed');
END IF;
IF p_stake IS NULL OR p_stake<1 OR p_stake>1000 OR p_stake<>round(p_stake,2) OR p_stake>bal THEN RAISE EXCEPTION 'Enter a stake from 1 to 1,000 within your balance'; END IF;
IF p_action='buy' THEN
 IF p_game NOT IN ('BTC','ETH','SOL','AAPL','EURUSD') THEN RAISE EXCEPTION 'Invalid market'; END IF;
 price:= CASE p_game WHEN 'BTC' THEN 67432 WHEN 'ETH' THEN 3521 WHEN 'SOL' THEN 148.72 WHEN 'AAPL' THEN 227.18 ELSE 1.0942 END * (1+sin(extract(epoch FROM clock_timestamp())/60)*0.003);
 INSERT INTO public.positions(user_id,symbol,stake,entry) VALUES(uid,p_game,p_stake,price);
 UPDATE public.wallets SET balance=balance-p_stake WHERE user_id=uid;
 RETURN jsonb_build_object('balance',bal-p_stake,'result','Position opened');
END IF;
IF p_game IN ('Aviator','JetX','Spaceman','Rocket X','Lucky Jet') THEN
 SELECT * INTO r FROM public.crash_rounds WHERE user_id=uid;
 IF r.user_id IS NOT NULL AND NOT r.settled THEN
 IF exp(extract(epoch FROM (clock_timestamp()-r.started_at))*0.12)<r.crash_at THEN RAISE EXCEPTION 'Finish your current flight first'; END IF;
 INSERT INTO public.play_history(user_id,game,stake,payout,result) VALUES(uid,r.game,r.stake,0,'Crashed at '||r.crash_at||'x');
 END IF;
 INSERT INTO public.crash_rounds(user_id,game,stake,started_at,crash_at,settled) VALUES(uid,p_game,p_stake,clock_timestamp(),greatest(1.01,least(20,round((0.97/greatest(random(),0.001))::numeric,2))),false) ON CONFLICT(user_id) DO UPDATE SET game=excluded.game,stake=excluded.stake,started_at=excluded.started_at,crash_at=excluded.crash_at,settled=false;
 UPDATE public.wallets SET balance=balance-p_stake WHERE user_id=uid;
 RETURN jsonb_build_object('status','flying','multiplier',1,'balance',bal-p_stake);
ELSIF p_game='Roulette' THEN
 IF p_choice NOT IN ('Red','Black') THEN RAISE EXCEPTION 'Select red or black'; END IF;
 n:=floor(random()*37); outcome:=CASE WHEN n=0 THEN 'Green 0' WHEN n IN (1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36) THEN 'Red '||n ELSE 'Black '||n END;
 IF outcome LIKE p_choice||' %' THEN pay:=p_stake*2; END IF;
ELSIF p_game='Dice' THEN
 IF p_choice NOT IN ('Under 50','Over 50') THEN RAISE EXCEPTION 'Select a side'; END IF;
 n:=floor(random()*100)+1; outcome:='Rolled '||n;
 IF (p_choice='Under 50' AND n<50) OR (p_choice='Over 50' AND n>50) THEN pay:=p_stake*1.96; END IF;
ELSIF p_game='Coin Flip' THEN
 IF p_choice NOT IN ('Heads','Tails') THEN RAISE EXCEPTION 'Select a side'; END IF;
 outcome:=CASE WHEN random()<0.5 THEN 'Heads' ELSE 'Tails' END; IF outcome=p_choice THEN pay:=p_stake*1.96; END IF;
ELSIF p_game='Slots' THEN
 n:=floor(random()*100); outcome:=CASE WHEN n<10 THEN 'Three cherries' WHEN n<30 THEN 'Two cherries' ELSE 'No match' END; pay:=CASE WHEN n<10 THEN p_stake*5 WHEN n<30 THEN p_stake*2 ELSE 0 END;
ELSE RAISE EXCEPTION 'Invalid game'; END IF;
UPDATE public.wallets SET balance=balance-p_stake+pay WHERE user_id=uid;
INSERT INTO public.play_history(user_id,game,stake,payout,result) VALUES(uid,p_game,p_stake,pay,outcome);
RETURN jsonb_build_object('balance',bal-p_stake+pay,'payout',pay,'result',outcome);
END; $$;
REVOKE ALL ON FUNCTION public.play_action(text,numeric,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.play_action(text,numeric,text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.create_player() FROM PUBLIC, anon, authenticated;