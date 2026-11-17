export const SAVE_KEY='second-chance-motor-co-v1';
export const FAMILY_NAMES={M1:'Marlow Meadow',V4:'Vektor Vista',H2:'Hearth Range',S8:'Solace Solstice',O3:'Orison Meridian',L3:'Luma Garden'};
export const familyName=key=>FAMILY_NAMES[key]||key;
export const MODELS=[
 {id:'pico',name:'Marlow Pico',type:'Compact',family:'M1',years:'2008–2016',year:2011,value:3900,tier:0,color:'#54b8ae'},
 {id:'cove',name:'Marlow Cove',type:'Hatchback',family:'M1',years:'2008–2016',year:2014,value:5700,tier:0,color:'#efa83d'},
 {id:'s4',name:'Vektor Vale',type:'Sedan',family:'V4',years:'2012–2019',year:2014,value:9400,tier:1,color:'#6aaee7'},
 {id:'regent',name:'Vektor Regent',type:'Luxury',family:'V4',years:'2012–2019',year:2018,value:24000,tier:3,color:'#687fbd'},
 {id:'trail',name:'Hearth Trail',type:'SUV',family:'H2',years:'2010–2020',year:2015,value:13300,tier:2,color:'#9cb95a'},
 {id:'ranger',name:'Hearth Hauler',type:'Pickup',family:'H2',years:'2010–2020',year:2012,value:11700,tier:2,color:'#d37e56'},
 {id:'v8',name:'Solace Rumble',type:'Muscle',family:'S8',years:'2013–2021',year:2016,value:19800,tier:3,color:'#f08061'},
 {id:'gt',name:'Solace Aurora',type:'Sports',family:'S8',years:'2013–2021',year:2019,value:34500,tier:4,color:'#dc84b7'},
 {id:'finch',name:'Marlow Finch',type:'Compact',family:'M1',years:'2008–2016',year:2010,value:3300,tier:0,color:'#efb95a',bodyLength:.94,bodyWidth:.98,roofColor:'#fff0d5'},
 {id:'pebble',name:'Marlow Pebble',type:'Hatchback',family:'M1',years:'2008–2016',year:2013,value:5200,tier:0,color:'#eb8c98',bodyLength:.95,bodyWidth:.98,roofColor:'#345c6b'},
 {id:'courier',name:'Marlow Courier',type:'Sedan',family:'M1',years:'2008–2016',year:2015,value:6800,tier:1,color:'#7fbb79',bodyLength:1.02,bodyWidth:.98},
 {id:'juniper',name:'Marlow Juniper',type:'SUV',family:'M1',years:'2008–2016',year:2016,value:9900,tier:1,color:'#f0a94b',bodyLength:.94,bodyWidth:.97,roofColor:'#fff0d5'},
 {id:'comet',name:'Vektor Comet',type:'Hatchback',family:'V4',years:'2012–2019',year:2014,value:8200,tier:1,color:'#5dc4bf',bodyLength:1.05,bodyWidth:1.03,roofColor:'#315c73'},
 {id:'avenue',name:'Vektor Avenue',type:'Sedan',family:'V4',years:'2012–2019',year:2016,value:11800,tier:2,color:'#d889ac',bodyLength:1.08,bodyWidth:1.02},
 {id:'summit',name:'Vektor Summit',type:'SUV',family:'V4',years:'2012–2019',year:2017,value:17400,tier:2,color:'#77b9d8',bodyLength:1.07,bodyWidth:1.02,roofColor:'#e8edf0'},
 {id:'seren',name:'Vektor Seren',type:'Sports',family:'V4',years:'2012–2019',year:2019,value:27900,tier:3,color:'#8c92d6',bodyLength:1.05,bodyWidth:1.02},
 {id:'ridge',name:'Hearth Ridge',type:'SUV',family:'H2',years:'2010–2020',year:2014,value:10400,tier:1,color:'#d6b16d',bodyLength:.96,bodyWidth:1.03,roofColor:'#3b5b66'},
 {id:'canyon',name:'Hearth Canyon',type:'Pickup',family:'H2',years:'2010–2020',year:2016,value:15600,tier:2,color:'#5baba1',bodyLength:1.10,bodyWidth:1.04},
 {id:'timber',name:'Hearth Timber',type:'Pickup',family:'H2',years:'2010–2020',year:2018,value:21700,tier:3,color:'#d88958',bodyLength:1.15,bodyWidth:1.02,roofColor:'#f3e9d6'},
 {id:'roam',name:'Hearth Roam',type:'Hatchback',family:'H2',years:'2010–2020',year:2012,value:7100,tier:1,color:'#a7c272',bodyLength:1.08,bodyWidth:1.03,roofColor:'#355365'},
 {id:'ember',name:'Solace Ember',type:'Muscle',family:'S8',years:'2013–2021',year:2014,value:14200,tier:2,color:'#e9b849',bodyLength:.96,bodyWidth:1.05},
 {id:'drift',name:'Solace Drift',type:'Sports',family:'S8',years:'2013–2021',year:2017,value:22600,tier:3,color:'#4ebfbb',bodyLength:.96,bodyWidth:.98,roofColor:'#35566d'},
 {id:'monarch',name:'Solace Monarch',type:'Luxury',family:'S8',years:'2013–2021',year:2020,value:31600,tier:4,color:'#ba98c8',bodyLength:1.06,bodyWidth:1.04},
 {id:'coast',name:'Solace Coast',type:'Sports',family:'S8',years:'2013–2021',year:2021,value:28900,tier:3,color:'#eee4bb',bodyLength:1.08,bodyWidth:1.05,roofColor:'#476376'},
 {id:'aster',name:'Orison Aster',type:'Sedan',family:'O3',years:'2011–2020',year:2013,value:8900,tier:1,color:'#879dcf',bodyLength:1.05,bodyWidth:1.01},
 {id:'beacon',name:'Orison Beacon',type:'Luxury',family:'O3',years:'2011–2020',year:2016,value:18800,tier:2,color:'#d7ad91',bodyLength:1.04,bodyWidth:1.02},
 {id:'harbor',name:'Orison Harbor',type:'SUV',family:'O3',years:'2011–2020',year:2017,value:21500,tier:3,color:'#649cb7',bodyLength:1.06,bodyWidth:1.04},
 {id:'crest',name:'Orison Crest',type:'Sports',family:'O3',years:'2011–2020',year:2018,value:27200,tier:3,color:'#db8995',bodyLength:1.01,bodyWidth:1.03,roofColor:'#3b5366'},
 {id:'strand',name:'Orison Strand',type:'Hatchback',family:'O3',years:'2011–2020',year:2014,value:10300,tier:1,color:'#74b8c6',bodyLength:1.06,bodyWidth:1.01},
 {id:'vesper',name:'Orison Vesper',type:'Luxury',family:'O3',years:'2011–2020',year:2020,value:33000,tier:4,color:'#a08fc4',bodyLength:1.10,bodyWidth:1.04},
 {id:'sprout',name:'Luma Sprout',type:'Compact',family:'L3',years:'2009–2018',year:2010,value:3500,tier:0,color:'#a9cf75',bodyLength:.93,bodyWidth:.97,roofColor:'#f7efd9'},
 {id:'brook',name:'Luma Brook',type:'Sedan',family:'L3',years:'2009–2018',year:2012,value:5900,tier:0,color:'#72bdbb',bodyLength:.95,bodyWidth:.96},
 {id:'wisp',name:'Luma Wisp',type:'Hatchback',family:'L3',years:'2009–2018',year:2014,value:6700,tier:1,color:'#edb06d',bodyLength:.97,bodyWidth:.97,roofColor:'#5f8d9c'},
 {id:'rise',name:'Luma Rise',type:'SUV',family:'L3',years:'2009–2018',year:2016,value:11700,tier:2,color:'#a699c8',bodyLength:.95,bodyWidth:.98},
 {id:'dune',name:'Luma Dune',type:'Pickup',family:'L3',years:'2009–2018',year:2015,value:12600,tier:2,color:'#daa16c',bodyLength:.96,bodyWidth:.98},
 {id:'eclipse',name:'Luma Eclipse',type:'Sports',family:'L3',years:'2009–2018',year:2018,value:23900,tier:3,color:'#76a9d4',bodyLength:.97,bodyWidth:1.01,roofColor:'#e5ebec'}
];
// Every salvageable component has its own mesh, condition, procedure, and saved removal state.
export const PARTS={
 battery:{name:'Battery',cat:'ELECTRICAL',price:320,used:65,loc:[-.62,1.13,-1.5],shape:'battery',route:'battery'},
 alternator:{name:'Alternator',cat:'ENGINE',price:340,used:85,loc:[.45,1.05,-1.1],shape:'motor',route:'belt'},
 starter:{name:'Starter motor',cat:'ENGINE',price:290,used:65,loc:[.48,.71,-.68],shape:'motor',route:'engine'},
 radiator:{name:'Radiator',cat:'COOLING',price:360,used:80,loc:[0,1.03,-1.97],shape:'radiator',route:'cooling'},
 fan:{name:'Cooling fan',cat:'COOLING',price:210,used:45,loc:[.03,1.05,-1.72],shape:'fan',route:'cooling'},
 brakePads:{name:'Front brake pads',cat:'BRAKES',price:150,used:30,loc:[-1.03,.57,-1.36],shape:'pads',route:'brakes'},
 rotor:{name:'Front brake rotor',cat:'BRAKES',price:190,used:40,loc:[1.03,.58,-1.36],shape:'rotor',route:'brakes'},
 caliper:{name:'Rear brake caliper',cat:'BRAKES',price:220,used:55,loc:[-1.03,.65,1.35],shape:'caliper',route:'brakesRear'},
 wheelFL:{name:'Front left wheel & tire',cat:'WHEELS',price:210,used:40,loc:[-1.05,.59,-1.36],shape:'wheel',route:'wheel'},
 wheelFR:{name:'Front right wheel & tire',cat:'WHEELS',price:210,used:40,loc:[1.05,.59,-1.36],shape:'wheel',route:'wheel'},
 wheelRL:{name:'Rear left wheel & tire',cat:'WHEELS',price:210,used:40,loc:[-1.05,.59,1.35],shape:'wheel',route:'wheel'},
 wheelRR:{name:'Rear right wheel & tire',cat:'WHEELS',price:210,used:40,loc:[1.05,.59,1.35],shape:'wheel',route:'wheel'},
 headlightL:{name:'Left headlight',cat:'ELECTRICAL',price:180,used:35,loc:[-.67,1.03,-2.14],shape:'light',route:'light'},
 headlightR:{name:'Right headlight',cat:'ELECTRICAL',price:180,used:35,loc:[.67,1.03,-2.14],shape:'light',route:'light'},
 taillight:{name:'Left taillight',cat:'ELECTRICAL',price:140,used:25,loc:[-.73,1.05,2.08],shape:'tail',route:'tail'},
 mirror:{name:'Left mirror',cat:'BODY',price:100,used:20,loc:[-1.16,1.6,-.4],shape:'mirror',route:'trim'},
 doorL:{name:'Left front door',cat:'BODY',price:440,used:90,loc:[-1.02,1.17,0],shape:'door',route:'panel',large:true},
 doorR:{name:'Right front door',cat:'BODY',price:440,used:90,loc:[1.02,1.17,0],shape:'door',route:'panel',large:true},
 hood:{name:'Hood',cat:'BODY',price:360,used:75,loc:[0,1.31,-1.25],shape:'hood',route:'panel',large:true},
 fender:{name:'Front left fender',cat:'BODY',price:260,used:50,loc:[-.95,1.02,-1.55],shape:'fender',route:'panel'},
 bumper:{name:'Front bumper',cat:'BODY',price:250,used:50,loc:[0,.65,-2.19],shape:'bumper',route:'panel',large:true},
 seat:{name:'Driver seat',cat:'INTERIOR',price:280,used:50,loc:[-.48,1.25,.32],shape:'seat',route:'interior'},
 steering:{name:'Steering wheel',cat:'INTERIOR',price:170,used:30,loc:[-.48,1.53,-.38],shape:'steering',route:'interior'},
 strut:{name:'Front suspension strut',cat:'SUSPENSION',price:320,used:70,loc:[-.81,.82,-1.28],shape:'strut',route:'suspension'},
 exhaust:{name:'Exhaust muffler',cat:'ENGINE',price:270,used:60,loc:[.52,.32,1.58],shape:'exhaust',route:'underbody'},
 airFilter:{name:'Air filter housing',cat:'ENGINE',price:95,used:20,loc:[-.25,1.17,-.95],shape:'filter',route:'filter'},
 fuelPump:{name:'Fuel pump',cat:'ENGINE',price:310,used:60,loc:[.37,.38,.85],shape:'motor',route:'underbody'},
 clutch:{name:'Clutch assembly',cat:'TRANSMISSION',price:620,used:140,loc:[0,.49,-.28],shape:'rotor',route:'transmission'}
};
const s=(label,tool='wrench',kind='bolt',count=1)=>({label,tool,kind,count});
const fit=s('Fit the compatible replacement','hands','install');
const out=s('Pull the old component free','hands','remove');
const torque=s('Torque the fasteners','torque','bolt',2);
const routes={
 battery:[s('Open the hood','hands','hood'),s('Disconnect the battery lead','wrench'),s('Loosen the battery clamp','socket','bolt',2),out,fit,s('Secure the battery clamp','socket','bolt',2),s('Reconnect & test the battery','hands','test')],
 belt:[s('Open the hood','hands','hood'),s('Disconnect battery ground','wrench'),s('Release belt tensioner','socket'),s('Unplug electrical connector','hands','unplug'),s('Remove mounting bolts','socket','bolt',3),out,fit,s('Tighten mounting bolts','socket','bolt',3),s('Reconnect harness & belt','hands','attach'),s('Reconnect ground & test charging','wrench','test')],
 engine:[s('Open the hood','hands','hood'),s('Disconnect battery ground','wrench'),s('Unplug starter harness','hands','unplug'),s('Undo starter mount bolts','socket','bolt',2),out,fit,s('Torque mount bolts','torque','bolt',2),s('Reconnect harness & ground','hands','test')],
 cooling:[s('Open the hood','hands','hood'),s('Drain coolant into catch pan','hands','drain'),s('Release hose clamps','screwdriver','bolt',2),s('Disconnect fan plug','hands','unplug'),s('Remove support bolts','socket','bolt',2),out,fit,s('Secure support bolts','socket','bolt',2),s('Refit hoses & plug','screwdriver','bolt',2),s('Refill coolant & pressure test','hands','test')],
 brakes:[s('Position car on the lift','hands','position'),s('Raise car safely','hands','raise'),s('Loosen wheel lug nuts','socket','bolt',4),s('Remove front wheel','hands','wheelOff'),s('Remove caliper bolts','socket','bolt',2),s('Hang caliper clear','hands','caliperOff'),out,fit,s('Refit brake caliper','hands','attach'),s('Torque caliper bolts','torque','bolt',2),s('Refit front wheel','hands','wheelOn'),s('Torque wheel lug nuts','torque','bolt',4),s('Lower the lift','hands','lower'),s('Pump pedal & check brakes','hands','test')],
 brakesRear:[s('Position car on the lift','hands','position'),s('Raise car safely','hands','raise'),s('Loosen rear lug nuts','socket','bolt',4),s('Remove rear wheel','hands','wheelOff'),s('Release brake line','wrench'),s('Remove caliper bolts','socket','bolt',2),out,fit,s('Reconnect brake line','wrench'),s('Torque mounting bolts','torque','bolt',2),s('Refit rear wheel','hands','wheelOn'),s('Torque rear lug nuts','torque','bolt',4),s('Bleed brakes & lower car','hands','lower')],
 wheel:[s('Position car on the lift','hands','position'),s('Raise car safely','hands','raise'),s('Loosen wheel lug nuts','socket','bolt',4),out,fit,s('Torque wheel lug nuts','torque','bolt',4),s('Lower the lift','hands','lower')],
 light:[s('Open the hood','hands','hood'),s('Release lamp fasteners','screwdriver','bolt',2),s('Unplug lamp connector','hands','unplug'),out,fit,s('Plug in lamp connector','hands','attach'),s('Secure lamp fasteners','screwdriver','bolt',2),s('Test the headlight','hands','test')],
 tail:[s('Open the trunk','hands','trunk'),s('Release lamp fasteners','screwdriver','bolt',2),s('Unplug lamp connector','hands','unplug'),out,fit,s('Plug in lamp connector','hands','attach'),s('Secure lamp fasteners','screwdriver','bolt',2),s('Test the taillight','hands','test')],
 trim:[s('Open the door','hands','door'),s('Remove trim screws','screwdriver','bolt',2),out,fit,s('Refit trim screws','screwdriver','bolt',2)],
 panel:[s('Support the panel on a trolley','hands','support'),s('Unfasten mounting bolts','socket','bolt',3),out,fit,s('Align the panel gaps','hands','align'),s('Torque panel bolts','torque','bolt',3),s('Sand the replacement panel','body','sand'),s('Spray color-matched paint','paint','paint')],
 interior:[s('Open the door','hands','door'),s('Disconnect interior wiring','hands','unplug'),s('Remove mounting fasteners','socket','bolt',3),out,fit,s('Torque mounting fasteners','torque','bolt',3),s('Reconnect interior wiring','hands','test')],
 suspension:[s('Position car on the lift','hands','position'),s('Raise car safely','hands','raise'),s('Loosen wheel lug nuts','socket','bolt',4),s('Remove front wheel','hands','wheelOff'),s('Support the control arm','hands','support'),s('Release strut mount bolts','socket','bolt',3),out,fit,s('Torque strut mount bolts','torque','bolt',3),s('Refit front wheel','hands','wheelOn'),s('Torque wheel lug nuts','torque','bolt',4),s('Lower & check suspension','hands','lower')],
 underbody:[s('Position car on the lift','hands','position'),s('Raise car safely','hands','raise'),s('Release mounting clamps','socket','bolt',3),out,fit,s('Torque mounting clamps','torque','bolt',3),s('Lower & check for leaks','hands','lower')],
 filter:[s('Open the hood','hands','hood'),s('Release housing screws','screwdriver','bolt',2),out,fit,s('Secure housing screws','screwdriver','bolt',2)],
 transmission:[s('Position car on the lift','hands','position'),s('Raise car safely','hands','raise'),s('Support gearbox on transmission jack','hands','support'),s('Release driveshaft bolts','socket','bolt',4),s('Release bellhousing bolts','socket','bolt',4),s('Slide gearbox back','hands','gearboxOff'),out,fit,s('Align clutch & refit gearbox','hands','attach'),s('Torque bellhousing bolts','torque','bolt',4),s('Torque driveshaft bolts','torque','bolt',4),s('Lower & check clutch engagement','hands','lower')]
};
export const TOOLS=[{id:'hands',name:'Hands',icon:'✋'},{id:'wrench',name:'Wrench',icon:'⌁'},{id:'socket',name:'Ratchet',icon:'⚒'},{id:'screwdriver',name:'Driver',icon:'⊹'},{id:'body',name:'Body kit',icon:'⚑'},{id:'paint',name:'Paint',icon:'▥'},{id:'wash',name:'Washer',icon:'≈'},{id:'torque',name:'Torque',icon:'⊢'},{id:'impact',name:'Impact',icon:'↯',upgrade:'impact'}];
export const UPGRADES=[{id:'impact',name:'Impact wrench',cost:750,desc:'Spin fasteners 65% faster. Select with 9.',icon:'↯'}, {id:'proTools',name:'Pro mechanic tools',cost:1200,desc:'A breaker bar, precision sockets & better bench. All wrench actions 35% faster.',icon:'⚒'}, {id:'lift',name:'Hydraulic lift',cost:1700,desc:'Replace the basic jack with a powered lift. Raise cars 60% faster.',icon:'↟'}, {id:'bay2',name:'Second repair bay',cost:2400,desc:'Work on two flips or customer cars at once.',icon:'II'}, {id:'bay3',name:'Third repair bay',cost:4200,requires:'bay2',desc:'Work on three flips or customer cars at once.',icon:'III'}, {id:'storage2',name:'Parts storage · 25',cost:500,desc:'More shelves for future flips.',icon:'▦'}, {id:'storage3',name:'Parts storage · 50',cost:1100,requires:'storage2',desc:'A full-height salvage rack.',icon:'▦'}, {id:'storage4',name:'Parts storage · 100',cost:2100,requires:'storage3',desc:'A warehouse worth of parts.',icon:'▦'}, {id:'bodyStation',name:'Body & paint station',cost:1400,desc:'Better body tooling and a spray booth. Body work 45% faster.',icon:'◈'}, {id:'lighting',name:'Workshop lighting',cost:650,desc:'Warm ceiling lights & illuminated bay signs.',icon:'☀'}, {id:'office',name:'Office & forecourt',cost:950,desc:'New desktop, landscaping, and parking awning.',icon:'▤'}, {id:'yard',name:'Back-lot access',cost:1900,desc:'Unlock eight more donor cars behind the original yard.',icon:'↗'}, {id:'hoist',name:'Engine hoist',cost:1600,desc:'Professional support for engine and gearbox work; 40% faster.',icon:'⊓'}];
export const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
export const grade=n=>n>=90?'EXCELLENT':n>=75?'GOOD':n>=60?'FAIR':'POOR';
export const model=id=>MODELS.find(m=>m.id===id);
export function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function blankState(){
 const st={version:1,revision:5,serviceWaiting:null,nextCustomerAt:35,customerSerial:0,serviceHistory:[],money:3500,cars:[],donors:[],inventory:[],carry:null,orders:[],upgrades:[],market:[],marketRound:0,clock:0,nextId:1,tutorial:0,player:{x:-4,z:-14,yaw:Math.PI-.18,pitch:-.05},stats:{purchased:0,sold:0,jobsCompleted:0,serviceRevenue:0,serviceProfit:0,revenue:0,profit:0,biggestProfit:0,biggestLoss:0,partsSpent:0,junkUsed:0,newPurchased:0},history:[],settings:{volume:.35,bob:true,quality:'high'},started:false};
 const rand=rng(78042); const ids=Object.keys(PARTS);
 for(let i=0;i<52;i++){const fam=i<40?i%4:4+(i-40)%2,row=i<40?Math.floor(i/4):Math.floor((i-40)/2);const pool=MODELS.filter(m=>m.family===Object.keys(FAMILY_NAMES)[fam]);const m=pool[row%pool.length];let parts={};ids.forEach((k,j)=>{let c=i<4?76+Math.floor(rand()*20):Math.floor(25+rand()*73);parts[k]={condition:c,removed:i>=4&&rand()<.17,step:0,bolt:0};});st.donors.push({id:'d'+i,model:m.id,family:m.family,parts,hoodOpen:false,doorOpen:false,trunkOpen:false,angle:(rand()-.5)*.18,color:i<40?['#8faaa3','#ab8062','#c1b287','#879baa','#aaa4a1','#afbd92'][i%6]:m.color,row,column:fam,dent:22+i%37,dirt:35+i%50});}
 st.market=createMarket(st); return st;
}
export function createMarket(st){const r=rng(5187+st.marketRound*431);let maxTier=Math.min(4,Math.floor(st.stats.sold/2));const pool=MODELS.filter(m=>m.tier<=maxTier);let arr=[];
 for(let i=0;i<6;i++){const brand=Object.keys(FAMILY_NAMES)[(i+st.marketRound)%6],brandPool=pool.filter(m=>m.family===brand),available=brandPool.length?brandPool:pool;const newest=available.filter(m=>m.tier===Math.max(...available.map(m=>m.tier)));const choices=i===0&&st.stats.sold>=2?newest:available;const m=st.stats.purchased===0&&i===0?model('pico'):choices[(Math.floor(st.marketRound/6)+Object.keys(FAMILY_NAMES).indexOf(brand))%choices.length];let defects={},all=Object.keys(PARTS);const factor=[.29,.48,.62,.32,.94,.41][i];let n=Math.max(1,Math.round(6-factor*6))+Math.floor(r()*2);if(m.tier>=2)n+=1;
 while(Object.keys(defects).length<n){const k=all[Math.floor(r()*all.length)];defects[k]=Math.floor(r()*44);}
 if(st.stats.purchased===0&&i===0){defects={battery:0,brakePads:12,headlightL:0};}
 let known=Object.keys(defects).slice(0,Math.max(1,Object.keys(defects).length-1));let price=Math.round(m.value*factor/25)*25; if(st.stats.purchased===0&&i===0)price=1100;
 const dirt=45+Math.floor(r()*40),dent=12+Math.floor(r()*48);
 arr.push({id:'l'+st.marketRound+'-'+i,model:m.id,year:m.year-Math.floor(r()*3),miles:67000+Math.floor(r()*118000),price,known,defects,dirt,dent,description:["Sat for a winter. Needs battery and front brakes. Selling as-is — bring a trailer.","Daily driver until last month. A few little jobs for someone handy.","Project I never finished. Priced for a quick sale. No guarantees.","Estate clear-out. Starts, but I wouldn't drive it home.","Clean title. Selling because I bought something newer.","Mechanic special. Good bones, needs someone with a workshop."][i],color:m.color});
 }return arr;
}
export const bayCount=st=>1+Number(st.upgrades.includes('bay2'))+Number(st.upgrades.includes('bay3'));
export const storageCap=st=>st.upgrades.includes('storage4')?100:st.upgrades.includes('storage3')?50:st.upgrades.includes('storage2')?25:10;
export function condition(c){let vals=Object.values(c.parts);return Math.round(vals.reduce((a,v)=>a+v,0)/vals.length*.75+(100-c.dent)*.15+(100-c.dirt)*.1);}
export function valuation(c){return Math.round(model(c.model).value*(.22+.78*Math.pow(condition(c)/100,1.55))/25)*25;}
export function buyCar(st,id){const l=st.market.find(l=>l.id===id);if(!l)throw Error('This listing is no longer available.');if(st.cars.length>=bayCount(st))throw Error('All repair bays are occupied. Sell a car or add another bay.');if(st.money<l.price)throw Error('Not enough cash for this purchase.');
 st.money-=l.price;st.stats.purchased++;const usedBays=st.cars.map(c=>c.bay);let bay=0;while(usedBays.includes(bay))bay++;
 let parts={};Object.keys(PARTS).forEach((k,i)=>parts[k]=l.defects[k]??(78+(i*7%18)));
 const car={id:'c'+st.nextId++,model:l.model,year:l.year,miles:l.miles,color:l.color,bay,parts,jobs:{},dirt:l.dirt,dent:l.dent,cleanZones:{body:0,glass:0,wheels:0,interior:0},bodyStep:0,purchase:l.price,costs:{junk:0,new:0,body:0},hoodOpen:false,doorOpen:false,trunkOpen:false,onLift:false,raised:false,listing:null,deliveryAt:st.clock+3};
 st.cars.push(car);st.market=st.market.filter(x=>x.id!==id);return car;
}
export function donorSteps(key){const p=PARTS[key];const a=[];if(['battery','belt','engine','cooling','light','filter'].includes(p.route))a.push(s('Open donor hood','hands','hood'));if(p.route==='interior'||p.route==='trim')a.push(s('Open donor door','hands','door'));if(p.route==='tail')a.push(s('Open donor trunk','hands','trunk'));if(p.route==='brakes'||p.route==='brakesRear'||p.route==='suspension')a.push(s('Unfasten donor wheel nuts','socket','bolt',4),s('Lift donor wheel away','hands','wheelOff'));if(p.shape==='wheel')a.push(s('Remove donor wheel nuts','socket','bolt',4));else a.push(s('Release component fasteners',p.route==='light'||p.route==='filter'||p.route==='trim'?'screwdriver':'socket','bolt',p.route==='panel'?3:2));if(['battery','belt','cooling','light','tail','interior'].includes(p.route))a.push(s('Disconnect cables / hoses','hands','unplug'));a.push(s(p.large?'Load onto the parts trolley':'Pull free & carry to your shop','hands','salvage'));return a;}
export function procedure(key){return routes[PARTS[key].route];}
export function currentStep(st,kind,id,key){let seq,j;if(kind==='donor'){let d=st.donors.find(d=>d.id===id),p=d.parts[key];seq=donorSteps(key);j=p;}else{let c=st.cars.find(c=>c.id===id);j=c.jobs[key]||{step:0,bolt:0};seq=procedure(key);}const index=Math.max(0,Math.min(Number(j.step)||0,seq.length-1));return {...seq[index],index,total:seq.length,key,bolt:j.bolt||0};}
export const BODY_STEPS=[s('Pull & gently hammer the dent','body','dent',3),s('Sand and prepare the damaged panel','body','sand',2),s('Spray the matching base coat','paint','paint',3)];
export function compatible(part,car,key){return part.key===key&&part.family===model(car.model).family&&part.condition>=60;}
export function toolMatches(required,selected,st){return required===selected||required==='torque'&&selected==='wrench'||(['socket','wrench','torque'].includes(required)&&selected==='impact'&&st.upgrades.includes('impact'));}
export function workDuration(st,step,selected){let d=step.kind==='bolt'?.6:step.kind==='salvage'?1.4:step.kind==='paint'||step.kind==='wash'?1.35:step.kind==='dent'?1.2:step.kind==='raise'?2.3:step.kind==='install'||step.kind==='remove'?1.1:.9;if(selected==='impact'&&step.kind==='bolt')d*=.35;if(st.upgrades.includes('proTools')&&['socket','wrench','torque'].includes(selected))d*=.65;if(st.upgrades.includes('bodyStation')&&['body','paint'].includes(selected))d*=.55;if(st.upgrades.includes('lift')&&['raise','lower'].includes(step.kind))d*=.4;if(st.upgrades.includes('hoist')&&['ENGINE','TRANSMISSION'].includes(PARTS[step.key]?.cat)&&['support','gearboxOff','remove','install'].includes(step.kind))d*=.6;return d;}
export function doWork(st,kind,id,key,selected){const obj=kind==='donor'?st.donors.find(d=>d.id===id):st.cars.find(c=>c.id===id);if(!obj)throw Error('Vehicle unavailable.');if(kind==='donor'&&obj.row>=8&&!st.upgrades.includes('yard'))throw Error('Back-lot access is locked.');
 if(kind==='car'&&obj.parts[key]>=60&&!obj.jobs[key])throw Error('This component is already serviceable.');
 if(kind==='donor'&&obj.parts[key].removed)throw Error('This donor component has already been removed.');
 if(kind==='car'&&obj.listing)throw Error('Take the listing offline before further repairs.');
 let step=currentStep(st,kind,id,key);if(!toolMatches(step.tool,selected,st))throw Error('Select '+TOOLS.find(t=>t.id===step.tool).name+' for this step.');
 if(step.kind==='install'&&!compatible(st.carry||{},obj,key))throw Error(st.carry?'You need a matching '+PARTS[key].name+' from '+familyName(model(obj.model).family)+' at 60% or better.':'Carry the compatible replacement to this component.');
 if(step.kind==='salvage'&&st.carry)throw Error('Your hands are full. Store your carried part at the rack first.');
 if(step.kind==='salvage'&&st.money<usedCost(obj,key))throw Error('Not enough cash for the yard release fee.');
 if(kind==='car'&&!obj.jobs[key])obj.jobs[key]={step:0,bolt:0,replacement:null};
 const job=kind==='donor'?obj.parts[key]:obj.jobs[key];let event=step.kind;
 if(step.kind==='bolt'){job.bolt=(job.bolt||0)+1;if(job.bolt<step.count)return {event:'bolt',step,complete:false,obj};job.bolt=0;}
 if(step.kind==='hood')obj.hoodOpen=true;if(step.kind==='door')obj.doorOpen=true;if(step.kind==='trunk')obj.trunkOpen=true;
 if(step.kind==='position')obj.onLift=true;if(step.kind==='raise'){obj.onLift=true;obj.raised=true;if(['underbody','transmission'].includes(PARTS[key].route))obj.liftHeight=Math.max(obj.liftHeight||0,liftLevels(st)[2]);}if(step.kind==='lower')obj.raised=false;
 if(step.kind==='wheelOff'){obj.wheelOff=wheelFor(key);if(kind==='donor'){if(!obj.parts[obj.wheelOff].removed){obj.looseWheels=obj.looseWheels||[];obj.looseWheels.push(obj.wheelOff);}obj.parts[obj.wheelOff].removed=true;}}
 if(step.kind==='wheelOn')obj.wheelOff=null;
 if(step.kind==='remove'){obj.parts[key]=0;job.removed=true;}
 if(step.kind==='install'){job.replacement=st.carry;st.carry=null;job.installed=true;if(PARTS[key].route==='panel'){obj.panelColors||={};obj.panelColors[key]=job.replacement.color||'#b9c2c9';}}
 if(step.kind==='paint'&&!job.paintPaid){if(st.money<25)throw Error('Panel paint materials cost $25.');st.money-=25;obj.costs.body+=25;job.paintPaid=true;obj.panelColors||={};obj.panelColors[key]=obj.color;}
 if(step.kind==='salvage'){const cost=usedCost(obj,key);st.money-=cost;st.stats.partsSpent+=cost;obj.parts[key].removed=true;st.carry={id:'p'+st.nextId++,key,family:obj.family,condition:obj.parts[key].condition,source:'junk',cost,donor:obj.id,color:obj.color};}
 job.step++;
 const seq=kind==='donor'?donorSteps(key):procedure(key);let done=job.step>=seq.length;
 if(done&&kind==='car'){const p=job.replacement;obj.parts[key]=p.condition;obj.costs[p.source==='junk'?'junk':'new']+=p.cost;if(p.source==='junk')st.stats.junkUsed++;delete obj.jobs[key];obj.wheelOff=null;if(PARTS[key].route==='panel'){obj.dent=Math.max(0,obj.dent-18);} }
 return {event,step,complete:done,obj};
}
export function wheelFor(key){return key==='caliper'?'wheelRL':key==='rotor'?'wheelFR':key.startsWith('wheel')?key:'wheelFL';}
export function liftLevels(st){return st.upgrades.includes('lift')?[.95,1.65,2.35]:[.72,1.35,1.90];}
export function vehicleLiftHeight(st,obj){return obj.raised?Math.min(liftLevels(st)[2],Math.max(.45,Number(obj.liftHeight)|| (st.upgrades.includes('lift')?1.42:.72))):0;}
export function setLiftHeight(st,id,donor,height){const obj=(donor?st.donors:st.cars).find(c=>c.id===id);if(!obj)throw Error('Vehicle unavailable.');if(obj.listing)throw Error('Take the listing offline first.');if(obj.deliveryAt>st.clock)throw Error('Wait for delivery before using the lift.');if(donor&&obj.row>=8&&!st.upgrades.includes('yard'))throw Error('Back-lot access is locked.');height=Number(height);if(!Number.isFinite(height)||height<0||height>liftLevels(st)[2])throw Error('Choose an available lift height.');obj.onLift=true;obj.raised=height>0;if(height>0)obj.liftHeight=height;return obj;}
export function usedCost(d,k){return Math.round(PARTS[k].used*(.55+d.parts[k].condition/100*.55));}
export function buyUpgrade(st,id){const u=UPGRADES.find(u=>u.id===id);if(!u||st.upgrades.includes(id))throw Error('Already owned.');if(u.requires&&!st.upgrades.includes(u.requires))throw Error('Buy '+UPGRADES.find(x=>x.id===u.requires).name+' first.');if(st.money<u.cost)throw Error('Not enough cash.');st.money-=u.cost;st.upgrades.push(id);return u;}
export function orderPart(st,key,family){const p=PARTS[key];const cost=Math.round(p.price*(family==='S8'?1.6:family==='V4'?1.2:1));if(st.money<cost)throw Error('Not enough cash.');st.money-=cost;st.stats.partsSpent+=cost;st.stats.newPurchased++;const item={id:'p'+st.nextId++,key,family,condition:100,source:'new',cost,arriveAt:st.clock+4};st.orders.push(item);return item;}
export function takeOrder(st,id){if(st.carry)throw Error('Store your carried part first.');const i=st.orders.findIndex(p=>p.id===id&&p.arriveAt<=st.clock);if(i<0)throw Error('Still in transit.');st.carry=st.orders.splice(i,1)[0];return st.carry;}
export function storePart(st){if(!st.carry)throw Error('Carry a component to store it here.');if(st.inventory.length>=storageCap(st))throw Error('Storage is full. Upgrade shelving on the computer.');st.inventory.push(st.carry);st.carry=null;}
export function takeStored(st,id){if(st.carry)throw Error('Store your carried part first.');const i=st.inventory.findIndex(p=>p.id===id);if(i<0)throw Error('This part is unavailable.');st.carry=st.inventory.splice(i,1)[0];}
export function bodyWork(st,id,selected){const c=st.cars.find(c=>c.id===id);if(c.listing)throw Error('Take your listing offline first.');if(c.dent===0)throw Error('The body is already straight and painted.');const seq=BODY_STEPS;let step=seq[c.bodyStep||0];if(!toolMatches(step.tool,selected,st))throw Error('Select '+TOOLS.find(t=>t.id===step.tool).name+'.');if(!c.bodyPaid){if(st.money<60)throw Error('Body materials cost $60.');st.money-=60;c.costs.body+=60;c.bodyPaid=true;}
 c.bodyPass=(c.bodyPass||0)+1;c.dent=Math.max(1,c.dent-Math.ceil(c.initialDent?c.initialDent/8:8));if(c.bodyPass>=step.count){c.bodyPass=0;c.bodyStep=(c.bodyStep||0)+1;}if(c.bodyStep>=seq.length){c.dent=0;c.bodyStep=0;return true;}return false;
}
export function cleanCar(st,id,zone,selected){const c=st.cars.find(c=>c.id===id);if(c.listing)throw Error('Take your listing offline first.');if(selected!=='wash')throw Error('Select the washer / interior vacuum (7).');if(c.cleanZones[zone]>=2)throw Error('This area is already clean.');if(!c.initialDirt)c.initialDirt=c.dirt;c.cleanZones[zone]++;c.dirt=Math.round(c.initialDirt*(1-Object.values(c.cleanZones).reduce((a,v)=>a+v,0)/8));}
export function listCar(st,id,asking){const c=st.cars.find(c=>c.id===id);if(c?.customer)throw Error('Customer cars belong to their owners. Return them through Customer jobs.');asking=Math.round(Number(asking));if(!Number.isFinite(asking)||asking<100||asking>200000)throw Error('Enter an asking price from $100 to $200,000.');if(Object.keys(c.jobs).length)throw Error('Finish the active repair procedures first.');if(c.deliveryAt>st.clock)throw Error('Wait for delivery.');c.raised=false;c.listing={asking,created:st.clock,nextOffer:st.clock+offerDelay(c,asking),offers:[],serial:0};return c.listing;}
export function offerDelay(c,asking){let ratio=asking/Math.max(1,valuation(c));return ratio<=1.05?9:ratio<=1.2?20:ratio<=1.5?48:95;}
export function tick(st,dt){st.clock+=dt;let events=[];if(!st.serviceWaiting&&st.clock>=st.nextCustomerAt){st.serviceWaiting=createCustomer(st);events.push({type:'customer',customer:st.serviceWaiting});}for(const c of st.cars){const l=c.listing;if(l&&st.clock>=l.nextOffer){let r=rng(c.id.charCodeAt(1)*724+l.serial*985+Math.floor(l.asking));let v=valuation(c);let offered=Math.round(Math.min(l.asking,v*(.87+r()*.2))/25)*25;const names=['Robin','Jamie','Alex','Morgan','Casey','Taylor','Drew','Sam'];let offer={id:'o'+l.serial,amount:offered,name:names[l.serial%8],at:st.clock};l.offers.push(offer);if(l.offers.length>5)l.offers.shift();l.serial++;l.nextOffer=st.clock+offerDelay(c,l.asking)*(1+r()*.7);events.push({type:'offer',car:c,offer});}}return events;}
export function sellCar(st,id,offerId){const c=st.cars.find(c=>c.id===id),o=c?.listing?.offers.find(o=>o.id===offerId);if(!o)throw Error('Offer unavailable.');const invested=c.purchase+c.costs.junk+c.costs.new+c.costs.body;const profit=o.amount-invested;st.money+=o.amount;st.stats.sold++;st.stats.revenue+=o.amount;st.stats.profit+=profit;st.stats.biggestProfit=Math.max(st.stats.biggestProfit,profit);st.stats.biggestLoss=Math.min(st.stats.biggestLoss,profit);const result={model:c.model,year:c.year,purchase:c.purchase,...c.costs,invested,sale:o.amount,profit,condition:condition(c),at:st.clock};st.history.unshift(result);st.cars=st.cars.filter(x=>x.id!==id);st.marketRound++;st.market=createMarket(st);return result;}
export function serialize(st){return JSON.stringify(st);}
export function loadState(storage){try{const s=JSON.parse(storage.getItem(SAVE_KEY));if(s?.version===1&&Array.isArray(s.cars)&&Array.isArray(s.donors)&&s.stats&&Number.isFinite(s.money)){if((s.revision||0)<2){for(const c of s.cars){const j=c.jobs?.battery;if(j){const oldStep=Math.max(0,Math.min(9,Number(j.step)||0));j.step=[0,1,1,2,3,4,5,6,6,6][oldStep];j.bolt=0;}for(const job of Object.values(c.jobs||{}))job.bolt=0;}for(const d of s.donors)for(const part of Object.values(d.parts||{}))part.bolt=0;s.revision=2;}if((s.revision||0)<3){for(const d of s.donors){if(d.row>=2){const pool=MODELS.filter(m=>m.family===d.family);d.model=pool[d.row%pool.length].id;}}s.market=createMarket(s);s.revision=3;}if((s.revision||0)<4){const existing=new Set(s.donors.map(d=>d.id));s.donors.push(...blankState().donors.filter(d=>!existing.has(d.id)));s.market=createMarket(s);s.revision=4;}s.serviceWaiting??=null;s.nextCustomerAt??=s.clock+15;s.customerSerial??=0;s.serviceHistory??=[];s.stats.jobsCompleted??=0;s.stats.serviceRevenue??=0;s.stats.serviceProfit??=0;s.revision=5;s.donors.forEach((d,i)=>{d.dent??=22+i%37;d.dirt??=35+i%50;});return s;}}catch{}return blankState();}

export function takeLooseWheel(st,id,key){const d=st.donors.find(x=>x.id===id);if(!d?.looseWheels?.includes(key))throw Error('This wheel is no longer here.');if(st.carry)throw Error('Your hands are full. Store your part first.');const cost=usedCost(d,key);if(st.money<cost)throw Error('Not enough cash for the release fee.');st.money-=cost;st.stats.partsSpent+=cost;st.carry={id:'p'+st.nextId++,key,family:d.family,condition:d.parts[key].condition,source:'junk',cost,donor:id,color:d.color};d.looseWheels=d.looseWheels.filter(k=>k!==key);return st.carry;}

export function discardPart(st){if(!st.carry)throw Error('Carry a component here to recycle it.');const part=st.carry;st.carry=null;return part;}

// Customer vehicles use the very same physical repair procedures as owned cars.
export function createCustomer(st){
 const serial=st.customerSerial++,r=rng(9127+serial*571),tier=Math.min(4,Math.floor(st.stats.jobsCompleted/3));
 const pool=MODELS.filter(m=>m.tier<=tier),m=serial===0?model('cove'):pool[(serial*7+3)%pool.length];
 const candidates=['battery','headlightL','alternator','brakePads','radiator','wheelFR','starter','doorL','strut','fuelPump','clutch'];
 const keys=serial===0?['battery','headlightL']:Array.from({length:Math.min(4,2+Math.floor(serial/4))},(_,i)=>candidates[(serial*3+i*4)%candidates.length]);
 const parts=Object.fromEntries(Object.keys(PARTS).map(k=>[k,88+Math.floor(r()*11)]));keys.forEach(k=>parts[k]=Math.floor(r()*40));
 const multiplier=m.family==='S8'?1.6:m.family==='V4'?1.2:1;
 const deposit=keys.reduce((sum,k)=>sum+Math.round(PARTS[k].price*multiplier)+(PARTS[k].route==='panel'?25:0),0);
 const labor=keys.reduce((sum,k)=>sum+(['underbody','transmission'].includes(PARTS[k].route)?350:PARTS[k].route==='panel'?230:170),0);
 return {id:'c'+st.nextId++,model:m.id,year:m.year,miles:48000+Math.floor(r()*110000),color:m.color,bay:0,parts,jobs:{},dirt:38,dent:0,cleanZones:{body:0,glass:0,wheels:0,interior:0},bodyStep:0,purchase:0,costs:{junk:0,new:0,body:0},hoodOpen:false,doorOpen:false,trunkOpen:false,onLift:false,raised:false,listing:null,customer:{name:['Jordan','Priya','Miles','Nina','Elliot','Ada','Theo','Riley'][serial%8],required:keys,deposit,labor,accepted:false},waiting:true,arrivalAt:st.clock+3,deliveryAt:0};
}
export function acceptCustomer(st,id){const c=st.serviceWaiting;if(!c||c.id!==id)throw Error('This customer has already left.');if(st.cars.length>=bayCount(st))throw Error('All bays are busy. Sell or return a car, or add a repair bay.');let bay=0;while(st.cars.some(c=>c.bay===bay))bay++;c.bay=bay;c.waiting=false;c.customer.accepted=true;c.deliveryAt=st.clock+3;st.money+=c.customer.deposit;st.cars.push(c);st.serviceWaiting=null;st.nextCustomerAt=st.clock+55;return c;}
export function declineCustomer(st,id){if(st.serviceWaiting?.id!==id)throw Error('Customer unavailable.');st.serviceWaiting=null;st.nextCustomerAt=st.clock+20;}
export function customerReady(c){return !!c.customer&&c.customer.required.every(k=>c.parts[k]>=60)&&!Object.keys(c.jobs).length&&!c.raised;}
export function returnCustomer(st,id){const c=st.cars.find(c=>c.id===id);if(!c?.customer)throw Error('Customer vehicle unavailable.');if(c.deliveryAt>st.clock||!customerReady(c))throw Error('Finish the work order, reassemble everything, and lower the car first.');const parts=c.costs.junk+c.costs.new+c.costs.body,tip=c.dirt===0?100:0,total=parts+c.customer.labor+tip,balance=total-c.customer.deposit;if(st.money+balance<0)throw Error('Keep the unused parts deposit available for the customer refund.');st.money+=balance;const receipt={name:c.customer.name,model:c.model,year:c.year,parts,labor:c.customer.labor,deposit:c.customer.deposit,tip,total,balance,profit:c.customer.labor+tip,at:st.clock};st.stats.jobsCompleted++;st.stats.serviceRevenue+=total;st.stats.serviceProfit+=receipt.profit;st.serviceHistory.unshift(receipt);st.cars=st.cars.filter(x=>x.id!==id);return receipt;}
