// Fictional design languages, shared by the garage and marketplace illustrations.
const brands={
 M1:{grille:'smile',lamps:'round',spokes:4,seat:'#68766b',trim:'#42625c',accent:'#eab969',dash:'analog'},
 V4:{grille:'split',lamps:'blade',spokes:7,seat:'#536575',trim:'#283d54',accent:'#ccdde9',dash:'wide'},
 H2:{grille:'bars',lamps:'square',spokes:6,seat:'#b7a184',trim:'#484e42',accent:'#e2b566',dash:'utility'},
 S8:{grille:'mesh',lamps:'quad',spokes:5,seat:'#714944',trim:'#303c48',accent:'#f5ce8d',dash:'sport'},
 O3:{grille:'vertical',lamps:'jewel',spokes:10,seat:'#9b836b',trim:'#725545',accent:'#edd4a2',dash:'wide'},
 L3:{grille:'trapezoid',lamps:'sweep',spokes:8,seat:'#50646b',trim:'#345a67',accent:'#d6e5e3',dash:'minimal'}
};
export function designFor(m){const seed=[...m.id].reduce((a,c)=>a+c.charCodeAt(0),0),b=brands[m.family]||brands.M1;return {...b,seed,spokes:b.spokes+seed%2,roofOffset:((seed%5)-2)*.023,roofFront:-.30+(seed%4)*.055,roofBack:((seed%3)-1)*.07,grilleWidth:.64+(seed%5)*.065,lampHeight:.12+(seed%3)*.03,rimDark:seed%3===0,twoTone:['Compact','Hatchback','SUV'].includes(m.type)&&seed%2===0};}
