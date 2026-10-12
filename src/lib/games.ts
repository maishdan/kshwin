export const games = [
 {name:'Aviator',slug:'aviator',category:'Crash',icon:'plane',label:'The original flight experience'},
 {name:'JetX',slug:'jetx',category:'Crash',icon:'rocket',label:'Take your next flight'},
 {name:'Spaceman',slug:'spaceman',category:'Crash',icon:'orbit',label:'Beyond the atmosphere'},
 {name:'Rocket X',slug:'rocket-x',category:'Crash',icon:'rocket',label:'A new kind of lift-off'},
 {name:'Lucky Jet',slug:'lucky-jet',category:'Crash',icon:'plane',label:'Find your moment'},
 {name:'Roulette',slug:'roulette',category:'Casino',icon:'circle',label:'A classic. A new spin.'},
 {name:'Dice',slug:'dice',category:'Casino',icon:'dice',label:'Let the numbers roll'},
 {name:'Coin Flip',slug:'coin-flip',category:'Casino',icon:'coin',label:'Two sides. One choice.'},
 {name:'Slots',slug:'slots',category:'Casino',icon:'cherry',label:'Spin into something good'},
] as const;
export type GameName = typeof games[number]['name'];
