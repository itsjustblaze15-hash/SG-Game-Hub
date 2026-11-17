(function () {
  "use strict";
  const key="sg-game-hub:president-simulator:v1";
  let inMemory;
  let healthy=true;
  const make=()=>({version:1,active:null,careers:{},settings:{difficulty:"Easy",motion:true,hub:""}});
  function read(){
    if(inMemory)return inMemory;
    inMemory=make();
    try{
      const raw=localStorage.getItem(key);
      if(raw){
        const value=JSON.parse(raw);
        if(value.version===1&&value.careers&&value.settings)inMemory=value;
      }
    }catch{healthy=false;}
    return inMemory;
  }
  function write(){
    try{localStorage.setItem(key,JSON.stringify(read()));healthy=true;}
    catch{healthy=false;}
    return healthy;
  }
  function save(g){
    const book=read();
    book.careers[g.id]=JSON.parse(JSON.stringify(g));
    book.active=g.id;
    return write();
  }
  function valid(g){
    const D=window.Scenario;
    const finite=Number.isFinite,integer=Number.isInteger;
    const record=value=>value!==null&&typeof value==="object"&&!Array.isArray(value);
    const numeric=(value,keys)=>record(value)&&keys.every(key=>finite(value[key]));
    const keysAre=(value,keys)=>record(value)&&Object.keys(value).every(key=>keys.includes(key));
    const hasSeats=value=>numeric(value,["D","R","I"])&&Object.values(value).every(n=>integer(n)&&n>=0&&n<=435);
    if(g?.version!==1||typeof g.id!=="string"||!/^career-[a-z0-9-]+$/i.test(g.id)||
       !integer(g.turn)||g.turn<2028*12||!integer(g.rng)||!numeric(g,["elected","served","actions","official","funds","recognition","reputation","trust","monthsInOffice"])||
       !["Candidate","Political Organizer","Former President","President","Completed"].includes(g.office))return false;
    const p=g.person;
    if(!p||typeof p.first!=="string"||typeof p.last!=="string"||!D.byId[p.home]||!D.parties[p.party]||
       !Array.isArray(p.priorities)||!p.priorities.every(topic=>D.issues.includes(topic))||
       ![0,1,2,3].includes(p.avatar)||!Object.hasOwn(D.difficulties,g.difficulty))return false;
    if(!Array.isArray(g.terms)||!Array.isArray(g.elections)||!Array.isArray(g.log)||!Array.isArray(g.achievements)||
       !Array.isArray(g.officePriorities)||!g.stats||!g.campaign||!Array.isArray(g.campaign.rivals)||
       !g.gov||!g.congress||!Array.isArray(g.congress.senate)||!Array.isArray(g.congress.results)||
       !["approvalHistory","bills","orders","courts","events","cases","effects","agreements","record","conflictHistory","eventHistory"].every(k=>Array.isArray(g.gov[k])))return false;
    if(!g.terms.every(t=>numeric(t,["from","until","startGrowth","startDebt"]))||
       (["President","Completed"].includes(g.office)&&!g.terms.length)||
       !numeric(g.stats,["campaigns","nominations","primaryLosses","wins","losses","states","ev","speeches","raised","signed","vetoes","orders","conflicts","agreements","events"]))return false;
    if(!numeric(g.campaign,["year","delegates","total","petition","fundraisers","climate"])||
       !["primary","ballot","general","closed","eliminated"].includes(g.campaign.stage)||!Array.isArray(g.campaign.debates)||
       !Array.isArray(g.campaign.contests)||!g.campaign.contests.every(c=>D.byId[c?.id]&&numeric(c,["delegates","share","total"]))||
       (g.campaign.stage==="primary"&&!g.campaign.primary)||g.campaign.rivals.length!==2||
       !["D","R"].every(id=>g.campaign.rivals.some(r=>r?.id===id&&D.byId[r.home]&&Array.isArray(r.priorities)&&record(r.activity))))return false;
    if(!hasSeats(g.congress.house)||g.congress.senate.length!==3||!g.congress.senate.every(hasSeats)||
       !g.congress.results.every(r=>numeric(r,["year","slot","total"])&&[0,1,2].includes(r.slot)&&hasSeats(r.house)&&Array.isArray(r.senate)&&r.senate.length===3&&r.senate.every(hasSeats)))return false;
    if(!g.elections.every(e=>integer(e?.year)&&Array.isArray(e.tickets)&&e.tickets.every(t=>t&&["player","D","R"].includes(t.id)&&typeof t.name==="string"&&D.parties[t.party])&&
       e.tickets.some(t=>t.id===e.winner)&&Array.isArray(e.rows)&&e.rows.length===51&&e.rows.every(r=>D.byId[r?.id]&&e.tickets.some(t=>t.id===r.winner)&&
       keysAre(r.shares,e.tickets.map(t=>t.id))&&keysAre(r.ev,e.tickets.map(t=>t.id))&&Array.isArray(r.districts)&&
       r.districts.every(d=>d&&/^(ME|NE)-[1-3]$/.test(d.label)&&e.tickets.some(t=>t.id===d.winner)))))return false;
    if(g.screen&&(!["nomination","election","midterm","inauguration","legacy"].includes(g.screen.type)||
       (g.screen.type==="inauguration"&&(!g.terms.length||!g.elections.length))||
       (g.screen.type==="legacy"&&g.terms.length!==2)||
       (g.screen.type==="election"&&!g.elections.some(e=>e.year===g.screen.year))||
       (g.screen.type==="midterm"&&!g.congress.results.some(r=>r.year===g.screen.year))))return false;
    return D.states.every(s=>numeric(g.states?.[s.id],["support","visits","activity","enthusiasm"])&&record(g.states[s.id].opponents))&&
      numeric(g.gov.conflict,["level","tension","opinion","cost","casualties","displaced","allies","funding"])&&
      record(g.gov.relations)&&record(g.gov.groups)&&record(g.gov.regional)&&record(g.other)&&record(g.promises)&&record(g.repeats);
  }
  function load(id=read().active){
    const snapshot=read().careers[id];
    return valid(snapshot)?JSON.parse(JSON.stringify(snapshot)):null;
  }
  function select(id){read().active=id;write();}
  function remove(id){
    const book=read();
    delete book.careers[id];
    if(book.active===id)book.active=Object.keys(book.careers).at(-1)||null;
    write();
  }
  function upload(raw){
    const imported=JSON.parse(raw);
    if(!valid(imported))throw Error("Select a valid President Simulator v1 career backup.");
    imported.id="career-"+Date.now().toString(36)+"-import-"+Math.random().toString(36).slice(2,7);
    save(imported);
    return imported;
  }
  function hub(){
    const value=new URLSearchParams(window.location.search).get("hub")||read().settings.hub||window.PresidentSimulatorConfig.hubUrl;
    if(!value)return "";
    try{
      const url=new URL(value,location.href);
      return ["file:","https:","http:"].includes(url.protocol)?url.href:"";
    }catch{return "";}
  }
  window.Careers={read,write,save,load,select,remove,upload,hub,healthy:()=>healthy};
}());
