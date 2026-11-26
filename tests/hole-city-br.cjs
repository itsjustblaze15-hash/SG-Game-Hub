const fs=require('fs'),vm=require('vm'),assert=require('assert');
let game,config,lastEnd,api;
const noop=()=>{};const brush=new Proxy({createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]||noop});
const context={console,Math,Set,Map,document:{createElement:()=>({getContext:()=>brush})},window:{SGCityArt:{},SGCityDistrict:{create:()=>({w:2000,h:1500,spawn:{x:1000,y:750},plots:[],roads:[],isLand:()=>true,ground:{}})}},SGArcade:{mount:(c,f)=>{config=c;api={state:{...c.defaults},mode:c.modes[0],w:1200,h:800,hud:noop,save:noop,notice:noop,tone:noop,buzz:noop,controls:noop,end:(...a)=>lastEnd=a};game=f(api)},clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),lerp:(a,b,t)=>a+(b-a)*t,tau:Math.PI*2,particleKit:()=>({clear:noop,burst:noop,update:noop}),ellipse:noop,box:noop,polygon:noop,gradient:noop,label:noop}};
let source=fs.readFileSync(require('path').join(__dirname,'../games/hole-city/game.js'),'utf8').replace('return {start,update,draw,unlocks,key,menu,','return {debug:()=>({player,rivals,zone,round,done,props}),setRound:v=>round=v,clash,updateZone,ranking,finishBattle,start,update,draw,unlocks,key,menu,');
vm.runInNewContext(source,context);
assert.equal(config.modes[0],'Battle Royale');game.start(api.mode);let d=game.debug();const center1={x:d.zone.x,y:d.zone.y};
// The 12 second opening protects spawning holes; swallowing then removes a rival permanently.
d.player.r=d.player.size=100;d.rivals[0].x=d.player.x;d.rivals[0].y=d.player.y;game.clash();assert(d.rivals[0].alive);game.setRound(15);game.clash();assert(!d.rivals[0].alive);assert.equal(d.rivals.filter(x=>x.alive).length,4);
// A larger AI hole can swallow another AI hole.
d.rivals[1].r=100;d.rivals[1].x=100;d.rivals[1].y=100;d.rivals[2].x=100;d.rivals[2].y=100;game.clash();assert(!d.rivals[2].alive);
// Outside exposure eliminates the player, while the match continues with spectators.
d.player.x=0;d.player.y=0;game.setRound(145);game.updateZone(8);assert(!d.player.alive);assert(!game.debug().done);
// Timeout chooses the largest survivor even when another hole has a higher score.
for(const r of d.rivals){r.alive=true;r.size=20;r.points=999;};d.rivals[4].size=90;d.rivals[4].points=0;game.finishBattle();assert.equal(lastEnd[1],'Atlas wins!');
// Full simulation terminates, yields a winner and never respawns dead rivals.
for(let run=0;run<20;run++){lastEnd=null;game.start(api.mode);for(let frame=0;frame<10000&&!game.debug().done;frame++)game.update(.02);assert(game.debug().done);assert(lastEnd[1].includes('wins')||lastEnd[1]==='You win!');}
// Existing modes retain their timer and manual finish behavior.
api.mode='Timed';game.start(api.mode);game.update(136);assert.equal(lastEnd[1],'Time is up');api.mode='Endless';game.start(api.mode);game.update(200);assert(!game.debug().done);
console.log('Passed: spawn grace, permanent elimination, AI combat, storm/spectating, size-based timeout, 20 full BR matches, Timed and Endless.');
