import {Plane,Rocket,Orbit,CircleDot,Dices,Coins,Cherry} from 'lucide-react';
import world from '@/assets/play-world.jpg';
export function GameArt({icon}:{icon:string}) { if(icon==='plane') return <img src={world} alt="Red propeller plane" loading="lazy" width={1024} height={1280}/>; const Icon = icon==='rocket'?Rocket:icon==='orbit'?Orbit:icon==='circle'?CircleDot:icon==='dice'?Dices:icon==='coin'?Coins:Cherry; return <Icon aria-hidden/>; }
export {Plane};
