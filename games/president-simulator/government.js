(function () {
  "use strict";
  const G=window.Game, D=window.Scenario;
  const {clamp,noise,random,logged,award,fail,done,avg,signed}=G;
  const senateTotals = (classes) => Object.fromEntries(["D","R","I"].map(p=>[p,classes.reduce((n,seats)=>n+seats[p],0)]));
  const control = (seats,tiebreaker) => seats.D>=(seats.D+seats.R+seats.I)/2+.25?"D":seats.R>=(seats.D+seats.R+seats.I)/2+.25?"R":
    tiebreaker && seats[tiebreaker]===50?tiebreaker:null;
  const classIndex = year => ((year-2030)%6+6)%6/2;
  const senatePasses = (g,yes) => yes>=51 || (yes===50&&(g.viceParty||g.person.party)===g.person.party);
  const politicalParty = g => G.president(g)?g.person.party:g.other.party;
  const use = g => {
    if(g.screen||!G.president(g)||g.official<1)return fail("You need to be in office with a presidential action available.");
    g.official--;
    return null;
  };
  const groups = ["Party base","Cross-party voters","Working households","Small businesses","Civic organizations"];
  function initialize(g){
    g.gov={
      approval:51,approvalHistory:[],growth:2.16,inflation:2.75,unemployment:4.35,revenue:5.23,spending:6.36,debt:34.7,confidence:55,
      stability:72,readiness:68,defense:.93,relations:{...D.countries},regional:Object.fromEntries(D.states.map(s=>[s.id,0])),
      groups:Object.fromEntries(groups.map((key,index)=>[key,56-index*2])),
      bills:[],orders:[],courts:["Marin","Park","Caldwell","Rivers","Shah","Foster","Lawson","Chen","Ortiz"],cases:[],
      officials:{Treasury:null,State:null,Defense:null},events:[],eventHistory:[],agreements:[],effects:[],nextId:1,
      conflict:{level:0,authorized:false,funding:0,operation:"None",name:"Meridian Strait",tension:31,opinion:57,cost:0,casualties:0,displaced:0,allies:0,incidents:0},
      conflictHistory:[],record:[]
    };
  }
  function congressElection(g,year){
    const house={D:0,R:0,I:0},delegations={};
    const party=politicalParty(g);
    const approval=G.president(g)?g.gov.approval:g.other.approval;
    const cycle=year%4===0?0:-1.3;
    const base=(approval-50)*.16+cycle;
    const trend=(party==="D"?base:party==="R"?-base:0)+(g.person.party==="D"?1:g.person.party==="R"?-1:0)*g.congress.momentum*.3+noise(g,2.2);
    for(const s of D.states){
      if(s.id==="DC")continue;
      const local={D:0,R:0,I:0};
      for(let i=0;i<s.ev-2;i++){
        const lean=s.lean+trend+noise(g,15)+g.gov.regional[s.id]*.07;
        const party=random(g)<.006+Number(g.person.party==="I")*.006?"I":lean>=0?"D":"R";
        local[party]++;house[party]++;
      }
      delegations[s.id]=control(local)||"split";
    }
    const slot=classIndex(year);
    const total=[33,33,34][slot];
    const senate=g.congress.senate.map(seats=>({...seats}));
    const active=D.senateStates[slot].map(id=>D.byId[id]);
    const seats={D:0,R:0,I:0};
    for(const s of active){
      const party=random(g)<.028?"I":s.lean*.65+trend+noise(g,12)>0?"D":"R";
      seats[party]++;
    }
    senate[slot]=seats;
    const result={year,house,senate,slot,total,delegations};
    g.congress.pending=result;
    g.congress.results.push(result);
    logged(g,(year%4===0?"Congressional election":"Midterm election")+" · "+year,
      "House: "+house.D+" D / "+house.R+" R / "+house.I+" I. Senate Class "+(slot+1)+": "+total+" seats elected.","Congress");
    return result;
  }
  function seatCongress(g){
    const c=g.congress;
    const newCongress=c.pending;
    c.house=newCongress.house;c.senate=newCongress.senate;c.pending=null;
    c.momentum*=.28;
    // A new Congress ends bills that have not cleared both chambers.
    for(const bill of g.gov.bills){
      if(["House vote","Senate vote","Amended","Vetoed"].includes(bill.status))bill.status="Expired";
    }
    logged(g,"New Congress seated","The newly elected chambers took office on January 3, "+G.currentYear(g)+".","Congress");
  }
  function voteCount(g,seats,appeal,chamber){
    const ruling=g.person.party;
    return Object.fromEntries(Object.keys(seats).map(party=>{
      const aligned=party===ruling;
      const rate=clamp((aligned?79:party==="I"||ruling==="I"?49:27)+appeal+noise(g,chamber==="House"?7:5),4,97);
      return [party,Math.round(seats[party]*rate/100)];
    }));
  }
  const sum = votes=>Object.values(votes).reduce((a,b)=>a+b,0);
  const govNotice=(g,title,detail,category="White House")=>{logged(g,title,detail,category);return done(detail);};
  const topicOf=category=>category==="Economic Policy"?"Economy":category;
  function propose(g,category,scope){
    const p=D.policies[category];
    if(!p||!["Targeted","Standard","Ambitious"].includes(scope))return fail("Choose a policy and scope.");
    if(g.gov.bills.some(b=>b.category===category&&["House vote","Senate vote","Amended","Ready to sign","Vetoed"].includes(b.status)))return fail("A proposal on this subject is already active.");
    const blocked=use(g);if(blocked)return blocked;
    const bill={id:g.gov.nextId++,category,title:p[0],scope,status:"House vote",support:0,amended:false,votes:[],turn:g.turn};
    g.gov.bills.unshift(bill);
    return govNotice(g,bill.title,"You proposed the "+scope.toLowerCase()+" bill. It is ready for a House vote.","Congress");
  }
  function effect(g,item,mult,label){
    const p=D.policies[item];
    g.gov.effects.push({label,months:16,cost:p[1]*mult,growth:p[2]*mult,jobs:p[3]*mult,revenue:p[5]*mult});
    const topic=topicOf(item), reception=p[4]*mult;
    g.gov.approval=clamp(g.gov.approval+reception,12,88);
    for(const s of D.states)g.gov.regional[s.id]=clamp(g.gov.regional[s.id]+(s.issues.includes(topic)?reception*1.35:-reception*.24),-20,20);
    g.gov.groups["Party base"]=clamp(g.gov.groups["Party base"]+reception);
    g.gov.groups["Working households"]=clamp(g.gov.groups["Working households"]+reception*(["Housing","Healthcare","Taxes"].includes(item)?1.9:.4));
    g.gov.groups["Small businesses"]=clamp(g.gov.groups["Small businesses"]+reception*(["Economic Policy","Taxes","Infrastructure"].includes(item)?1.6:-.35));
    g.gov.groups["Civic organizations"]=clamp(g.gov.groups["Civic organizations"]+reception*(item==="Environment"?1.8:.28));
    if(g.promises[topic]&&!g.promises[topic].fulfilled){g.promises[topic].fulfilled=true;g.trust=clamp(g.trust+2);}
    if(item==="National Security"){g.gov.defense+=p[1]*mult*.43;g.gov.readiness=clamp(g.gov.readiness+5*mult);}
  }
  function enact(g,b,overridden){
    const mult={Targeted:.64,Standard:1,Ambitious:1.5}[b.scope]*(b.amended?.72:1);
    b.status=overridden?"Override enacted":"Signed";
    if(!overridden)g.stats.signed++;
    effect(g,b.category,mult,b.title);
    if(b.amended||b.support>=7)award(g,"Bipartisan Deal");
    if(b.scope==="Ambitious")g.gov.cases.push({type:"law",id:b.id,turn:g.turn+2,
      risk:b.amended?.20:.36,reviewed:false});
    return govNotice(g,b.title,overridden?"Congress overrode the veto. The law is in effect.":"The bill became law. Its budget and economic effects will phase in.","Congress");
  }
  function legislation(g,id,action){
    const b=g.gov.bills.find(b=>b.id===id);
    if(!b)return fail("That bill could not be found.");
    const debate=["House vote","Senate vote","Amended"].includes(b.status);
    const options=debate?["support","oppose","negotiate","vote"]:b.status==="Ready to sign"?["sign","veto"]:b.status==="Vetoed"?["override"]:[];
    if(!options.includes(action))return fail("That action is unavailable at this stage.");
    if(action==="negotiate"&&b.support>=18)return fail("The proposed compromise is already on the table.");
    const blocked=use(g);if(blocked)return blocked;
    if(action==="negotiate"){
      b.support+=7;
      if(b.support>=14&&b.scope==="Ambitious"&&!b.amended){
        b.amended=true;
        b.needsHouseApproval=b.status==="Senate vote";
      }
      return govNotice(g,b.title,"Negotiations raised support."+(b.amended?" A narrower funding package is on the table.":""),"Congress");
    }
    if(action==="support"||action==="oppose"){
      const favor=action==="support";
      b.support=clamp(b.support+(favor?4:-8),-24,21);
      g.gov.groups["Party base"]=clamp(g.gov.groups["Party base"]+(favor?.6:-.6));
      return govNotice(g,b.title,favor?"You publicly supported the bill.":"You withdrew support from the bill.","Congress");
    }
    if(action==="sign")return enact(g,b,false);
    if(action==="veto"){
      b.status="Vetoed";g.stats.vetoes++;g.gov.approval=clamp(g.gov.approval-.35);
      return govNotice(g,b.title,"You vetoed the bill. Both chambers can vote on an override.","Congress");
    }
    const senate=senateTotals(g.congress.senate);
    const appeal=(g.gov.approval-50)*.38+b.support+G.diff(g).compromise+(g.officePriorities.includes(topicOf(b.category))?2:0)+
      ({Targeted:11,Standard:1,Ambitious:-11}[b.scope])+(b.amended?6:0);
    if(action==="override"){
      const houseYes=sum(voteCount(g,g.congress.house,appeal-5,"House"));
      const senateYes=sum(voteCount(g,senate,appeal-5,"Senate"));
      b.votes.push("Override · House "+houseYes+"/290 · Senate "+senateYes+"/67");
      if(houseYes>=290&&senateYes>=67)return enact(g,b,true);
      b.status="Veto sustained";
      return govNotice(g,b.title,"The veto stands. The override needed 290 House votes and 67 Senate votes.","Congress");
    }
    const house=b.status!=="Senate vote";
    const threshold=house?218:51;
    const chamber=house?"House":"Senate";
    const tally=voteCount(g,house?g.congress.house:senate,appeal,chamber);
    const yes=sum(tally);
    const passed=house?yes>=threshold:senatePasses(g,yes);
    const detail=chamber+" voted "+yes+"–"+((house?435:100)-yes)+
      (yes===50&&!house?(passed?" with a vice-presidential tie-break.":"; the vice president did not break the tie in favor.") :". "+threshold+" votes needed with full attendance.");
    b.votes.push(detail);
    if(!passed)b.status="Rejected";
    else if(b.status==="House vote")b.status="Senate vote";
    else if(b.status==="Amended")b.status="Ready to sign";
    else if(b.needsHouseApproval||!b.amended&&b.scope!=="Targeted"&&yes<=55){b.amended=true;b.status="Amended";}
    else b.status="Ready to sign";
    return govNotice(g,b.title,detail+" "+(b.status==="Rejected"?"The measure failed.":b.status==="Amended"?"The Senate amended the bill. The House must approve that version.":b.status==="Ready to sign"?"The bill reached your desk.":"The proposal advanced to the Senate."),"Congress");
  }
  const orders={
    "Agency service standards":{risk:.13,approval:.9,stability:2,cost:.015,detail:"Direct agencies to publish processing times and streamline services."},
    "Federal procurement review":{risk:.20,approval:.45,stability:2.5,cost:-.024,detail:"Review purchasing rules and improve oversight."},
    "Emergency agency coordination":{risk:.27,approval:1.15,stability:3,cost:.032,detail:"Coordinate existing grants and emergency resources."},
    "Redirect appropriated funds":{risk:1,approval:-1.3,stability:-2,cost:0,detail:"Attempt to divert congressionally appropriated funds and face judicial review."}
  };
  function executive(g,title){
    const o=orders[title];
    if(!o||g.gov.orders.some(order=>order.title===title&&order.active))return fail("Choose an order that is not already in effect.");
    const blocked=use(g);if(blocked)return blocked;
    const order={title,id:g.gov.nextId++,active:true,turn:g.turn,risk:o.risk,cost:o.cost};
    g.gov.orders.unshift(order);g.stats.orders++;
    g.gov.stability=clamp(g.gov.stability+o.stability);
    g.gov.approval=clamp(g.gov.approval+o.approval,12,88);
    g.gov.cases.push({type:"order",id:order.id,turn:g.turn+1,risk:o.risk,reviewed:false});
    return govNotice(g,title,"The order was issued. Courts can review its statutory authority.");
  }
  function appointments(g,position,nominee){
    const gov=g.gov, judicial=position==="Supreme Court";
    if(!["Consensus nominee","Reform advocate","Experienced administrator"].includes(nominee))return fail("Choose a nomination profile.");
    if(judicial?!gov.courts.includes(null):!Object.hasOwn(gov.officials,position))return fail("There is no available appointment for that position.");
    const blocked=use(g);if(blocked)return blocked;
    const appeal={"Consensus nominee":23,"Reform advocate":4,"Experienced administrator":16}[nominee]+G.diff(g).compromise+(gov.approval-50)*.27;
    const votes=sum(voteCount(g,senateTotals(g.congress.senate),appeal,"Senate"));
    if(!senatePasses(g,votes))return govNotice(g,position+" nomination","The Senate returned "+votes+" yes votes. The nominee was rejected.","Congress");
    if(judicial)gov.courts[gov.courts.indexOf(null)]={"Consensus nominee":"Ramos","Reform advocate":"Sullivan","Experienced administrator":"Okafor"}[nominee];
    else gov.officials[position]=nominee;
    gov.stability=clamp(gov.stability+(nominee==="Consensus nominee"?1.75:1));
    return govNotice(g,position+" confirmation","The Senate confirmed your "+nominee.toLowerCase()+" with "+votes+" yes votes"+(votes===50?" and the vice president's tie-break.":"."),"Congress");
  }
  function changePriorities(g,priorities){
    if(priorities.length!==3||new Set(priorities).size!==3||priorities.some(p=>!D.issues.includes(p)))return fail("Choose exactly three priorities.");
    const blocked=use(g);if(blocked)return blocked;
    g.officePriorities=[...priorities];g.trust=clamp(g.trust-.7);
    return govNotice(g,"Administration priorities","New priorities: "+priorities.join(", ")+".");
  }
  const eventList=[
    {id:"slowdown",title:"Growth stalls",detail:"Hiring is cooling as businesses defer investment.",choices:[["Offer temporary business relief",{growth:.36,cost:.20,approval:1.4}],["Coordinate with governors",{growth:.18,stability:2,cost:.07}],["Wait for the next report",{approval:-1.4,confidence:-4}]]},
    {id:"inflation",title:"Prices rise across the country",detail:"Families are reporting higher grocery and energy bills.",choices:[["Target logistics bottlenecks",{cost:.09,inflation:-.32,approval:1.5}],["Prioritize fiscal restraint",{cost:-.08,inflation:-.21,confidence:2}],["Announce a consumer relief proposal",{approval:1.1,confidence:3,inflation:.08}]]},
    {id:"housing",title:"Rental costs strain families",detail:"A jump in rents is putting pressure on workers in fast-growing cities.",choices:[["Release existing housing grants",{cost:.12,approval:1.5,jobs:-.05}],["Convene governors and mayors",{confidence:3,stability:2}],["Give states discretion",{approval:-.55,cost:-.025}]]},
    {id:"storm",title:"A severe storm hits the coast",detail:"Local governments request federal assistance to restore critical services.",choices:[["Mobilize disaster assistance",{cost:.17,stability:5,approval:2}],["Release targeted aid",{cost:.07,stability:3,approval:1}],["Leave the response to states",{stability:-5,approval:-2}]]},
    {id:"shutdown",title:"Government funding deadline",detail:"Negotiators warn that agencies may have to suspend some services.",choices:[["Back a bipartisan stopgap",{cost:.06,stability:5,approval:.8,congress:3}],["Hold out for spending cuts",{cost:-.08,stability:-2,approval:-1}],["Support a clean extension",{cost:.015,stability:3,approval:.45}]]},
    {id:"health",title:"Rural hospitals under strain",detail:"Health officials warn of staffing and access problems.",choices:[["Deploy emergency health teams",{cost:.10,approval:1.7,stability:3}],["Coordinate telehealth support",{cost:.055,approval:.85,confidence:2}],["Request a congressional inquiry",{approval:-.25,congress:2}]]},
    {id:"ethics",title:"Ethics inquiry reaches the White House",detail:"A report raises concerns about an official's contact with contractors.",choices:[["Cooperate and release records",{approval:1.4,trust:3,stability:1}],["Start an internal investigation",{approval:.15,trust:.8}],["Defend the official publicly",{approval:-2.3,trust:-3}]]},
    {id:"bridge",title:"A key transport corridor closes",detail:"A structural failure disrupts freight and commuting.",choices:[["Release emergency repair funds",{cost:.15,growth:.2,stability:3}],["Coordinate alternate routes",{cost:.05,stability:2}],["Request a state-led response",{growth:-.13,confidence:-3}]]},
    {id:"strait",title:"Meridian Strait crisis",detail:"Fictional regional vessels have threatened civilian shipping in an international passage.",choices:[["Open talks with neutral mediators",{tension:-10,allies:1,approval:.7}],["Escort commercial vessels",{tension:5,cost:.10,readiness:4}],["Call an emergency allies summit",{tension:-5,allies:2,confidence:1}]]},
    {id:"attack",title:"A patrol comes under attack",detail:"A fictional regional force has attacked a patrol near the Meridian Strait.",choices:[["Defend the patrol and evacuate",{readiness:3,tension:4,approval:1}],["Ask allies to mediate",{allies:2,tension:-8,approval:.4}],["Call Congress into consultation",{congress:4,stability:2,tension:1}]]},
    {id:"trade",title:"A trade opening with allies",detail:"Trading partners invite the administration to resolve a long-running market access dispute.",choices:[["Send a trade delegation",{growth:.17,confidence:3,allies:1}],["Offer a narrow compromise",{growth:.09,stability:1}],["Suspend negotiations",{growth:-.09,confidence:-2}]]}
  ];
  function event(g,id,choice){
    const entry=g.gov.events.find(e=>e.id===id);
    const template=eventList.find(e=>e.id===id);
    const spec=template?.choices[choice];
    if(!entry||!spec)return fail("That event is no longer pending.");
    const blocked=use(g);if(blocked)return blocked;
    const [title,values]=spec;
    const v=g.gov,c=v.conflict;
    for(const key of ["approval","stability","confidence","readiness"])if(values[key])v[key]=clamp(v[key]+values[key],key==="approval"?12:0,key==="approval"?88:100);
    if(values.trust)g.trust=clamp(g.trust+values.trust);
    if(values.tension)c.tension=clamp(c.tension+values.tension);
    if(values.allies)c.allies=clamp(c.allies+values.allies,0,8);
    if(values.congress)g.congress.momentum=clamp(g.congress.momentum+values.congress*.5,-5,8);
    if(values.inflation)v.inflation=clamp(v.inflation+values.inflation,.2,15);
    if(values.cost||values.growth||values.jobs)v.effects.push({label:title,months:7,cost:values.cost||0,growth:values.growth||0,jobs:values.jobs||0,revenue:0});
    v.events=v.events.filter(e=>e!==entry);
    g.stats.events++;
    const impact=Object.entries(values).map(([key,value])=>key+" "+signed(value,Math.abs(value)<1?2:1)+(key==="cost"?"T annual rate":"")).join(" · ");
    v.eventHistory.unshift({turn:g.turn,title:template.title,decision:title,impact});
    return govNotice(g,template.title,title+". "+impact+".","National Event");
  }
  const foreign={
    "State visit":[6,1,.027,"improves political ties"],
    "Diplomatic meeting":[4,.8,.01,"keeps a negotiating channel open"],
    "Trade negotiations":[7,1.2,.018,"can expand market access"],
    "Economic sanctions":[-12,-.45,.014,"adds pressure at the cost of relations"],
    "Foreign aid proposal":[5,.9,.046,"asks Congress to approve a limited aid package"],
    "International agreement":[8,1.3,.023,"builds cooperation if the other government agrees"],
    "Alliance cooperation":[7,1.35,.025,"builds support for crisis coordination"]
  };
  function diplomacy(g,country,type){
    const spec=foreign[type];
    if(!spec||!Object.hasOwn(g.gov.relations,country))return fail("Choose a country and a diplomatic action.");
    const blocked=use(g);if(blocked)return blocked;
    const v=g.gov,c=v.conflict;
    const [boost,approval,cost,description]=spec;
    const start=v.relations[country];
    const repeat=v.agreements.filter(a=>a.country===country&&a.type===type&&g.turn-a.turn<9).length;
    const signedDeal=["International agreement","Trade negotiations"].includes(type);
    const aidApproved=type!=="Foreign aid proposal"||sum(voteCount(g,g.congress.house,12+G.diff(g).compromise,"House"))>=218&&senatePasses(g,sum(voteCount(g,senateTotals(g.congress.senate),12+G.diff(g).compromise,"Senate")));
    if(!aidApproved)return govNotice(g,"Aid package stalled","Congress declined to fund the proposal for "+country+".","Diplomacy");
    const success=!signedDeal||random(g)<clamp(.39+start*.005-repeat*.21,.13,.96);
    const step=(success?boost:1)/(1+repeat)+noise(g,1.3);
    v.relations[country]=clamp(start+step);
    v.approval=clamp(v.approval+(success?approval:-.45)/(1+repeat),12,88);
    if(type==="Economic sanctions")c.tension=clamp(c.tension+4);
    if(type==="Alliance cooperation"&&start>=55){c.allies=clamp(c.allies+2,0,8);c.tension=clamp(c.tension-5);}
    v.effects.push({label:type+" · "+country,months:6,cost, growth:success&&type==="Trade negotiations"?.11:0,jobs:0,revenue:0});
    v.agreements.unshift({country,type,turn:g.turn,success});
    if(success&&signedDeal)g.stats.agreements++;
    return govNotice(g,type+" · "+country,(success?"The move "+description+".":"Negotiators paused the talks.")+" Relationship "+signed(step)+".","Diplomacy");
  }
  const military={
    readiness:["Raise readiness","Accelerate drills and maintenance."],
    defense:["Reinforce defenses","Redirect existing defense resources to defensive systems."],
    respond:["Respond to attack","Protect forces and recover personnel after a hostile incident."],
    limited:["Order limited operation","Authorize a short escort or defensive deployment."],
    congress:["Request war authorization","Seek votes in both chambers for authority and funding."],
    major:["Order authorized operation","Commit forces under an active congressional mandate."],
    ceasefire:["Negotiate a ceasefire","Pause combat through an agreement sensitive to tension and allies."],
    peace:["Negotiate a peace agreement","Close the crisis after a ceasefire and diplomatic progress."],
    withdraw:["Withdraw forces","End the deployment and absorb its political consequences."],
    allies:["Coordinate with allies","Increase support and reduce tensions."],
    sanctions:["Impose sanctions","Pressure opposing leaders while increasing tensions."],
    briefing:["Review intelligence","Gather information about the Meridian Strait."]
  };
  function militaryAvailability(g,key){
    const c=g.gov.conflict;
    const conditions={
      respond:c.incidents>0,limited:c.level===1,congress:c.level>=1&&!c.authorized,
      major:c.authorized&&c.funding>0&&c.level>=1&&c.level<=2,
      ceasefire:c.level===2||c.level===3,peace:c.level===4,withdraw:c.level>=2,briefing:c.level===0
    };
    return !Object.hasOwn(conditions,key)||Boolean(conditions[key]);
  }
  function militaryAction(g,key){
    if(!military[key]||!militaryAvailability(g,key))return fail("The current crisis status does not permit that action.");
    const blocked=use(g);if(blocked)return blocked;
    const v=g.gov,c=v.conflict;
    let detail=military[key][1];
    if(key==="readiness"||key==="defense"){
      v.readiness=clamp(v.readiness+(key==="readiness"?8:5));
      v.effects.push({label:military[key][0],months:4,cost:key==="readiness"?.09:.06,growth:0,jobs:0,revenue:0});
    }
    if(key==="briefing"){c.tension=clamp(c.tension-2);v.confidence=clamp(v.confidence+.6);}
    if(key==="respond"){c.incidents--;c.tension=clamp(c.tension+3);v.readiness=clamp(v.readiness-2);c.opinion=clamp(c.opinion+3);}
    if(key==="limited"){c.level=2;c.operation="Limited escort";c.limit=g.turn+3;c.tension=clamp(c.tension+8);}
    if(key==="congress"){
      const appeal=(c.tension-45)*.44+c.allies*1.6+(c.opinion-50)*.29+G.diff(g).compromise+6;
      const h=sum(voteCount(g,g.congress.house,appeal,"House"));
      const s=sum(voteCount(g,senateTotals(g.congress.senate),appeal,"Senate"));
      c.authorized=h>=218&&senatePasses(g,s);c.funding=c.authorized?10:0;
      detail="House "+h+" yes · Senate "+s+" yes. "+(c.authorized?"Congress authorized and funded ten months of operations.":"The authorization and funding package failed.");
    }
    if(key==="major"){c.level=3;c.operation="Authorized operation";c.tension=clamp(c.tension+13);v.readiness=clamp(v.readiness-8);}
    if(key==="allies"){c.allies=clamp(c.allies+2,0,8);c.tension=clamp(c.tension-7);v.relations.Canada=clamp(v.relations.Canada+2);}
    if(key==="sanctions"){c.tension=clamp(c.tension+6);c.opinion=clamp(c.opinion+2);v.confidence=clamp(v.confidence-1.6);}
    if(key==="ceasefire"||key==="peace"){
      const chance=clamp(.54+c.allies*.058-(c.tension-45)*.008+(key==="peace"?.08:0),.2,.94);
      if(random(g)<chance){
        c.tension=clamp(c.tension-24);c.opinion=clamp(c.opinion+6);v.approval=clamp(v.approval+1.9,12,88);
        if(key==="peace"){
          endConflict(g,"Peace agreement");
          g.stats.agreements++;
        }else{c.level=4;c.operation="Ceasefire monitoring";}
        detail=key==="peace"?"The agreement ended the crisis.": "Forces paused hostilities under a monitored ceasefire.";
      }else{c.tension=clamp(c.tension-3);detail="Mediators made progress. The parties have yet to reach an agreement.";}
    }
    if(key==="withdraw"){v.approval=clamp(v.approval+(c.opinion<48?1.1:-1.2),12,88);c.tension=clamp(c.tension-8);endConflict(g,"Withdrawal");}
    return govNotice(g,military[key][0],detail,"Defense");
  }
  function endConflict(g,outcome){
    const c=g.gov.conflict;
    g.gov.conflictHistory.unshift({turn:g.turn,outcome,cost:c.cost,casualties:c.casualties,displaced:c.displaced});
    c.level=0;c.operation=outcome;c.authorized=false;c.funding=0;c.incidents=0;
  }
  function conflictTick(g){
    const v=g.gov,c=v.conflict;
    if(c.level===0)c.tension=clamp(c.tension+noise(g,3)+(v.relations.China<34?.55:0));
    if(c.level===1&&c.tension<22){endConflict(g,"Diplomatic de-escalation");return 0;}
    if(c.level===2&&g.turn>=c.limit){
      c.level=1;c.operation="Limited mandate expired";
      logged(g,"Limited operation ends","Forces stood down after the limited authority expired.","Defense");
    }
    if(c.authorized&&--c.funding<=0){
      c.authorized=false;c.funding=0;
      if(c.level===3){c.level=1;c.operation="Funding expired";logged(g,"War funding expired","The operation ended. Further deployment requires another vote.","Defense");}
    }
    if(c.level===4&&random(g)<.08+(c.tension>62?.13:0)){
      c.level=1;c.operation="Ceasefire breached";c.tension=clamp(c.tension+12);
      logged(g,"Ceasefire breached","Mediators requested a new round of talks.","Defense");
    }
    if(c.level===1&&c.tension>65&&random(g)<.20){
      c.incidents++;
      if(!v.events.some(e=>e.id==="attack"))v.events.push({id:"attack",turn:g.turn});
    }
    if(![2,3].includes(c.level))return 0;
    const intensity=c.level===3?2.9:1;
    const cost=(.004+random(g)*.006)*intensity;
    c.cost+=cost;
    c.casualties+=Math.round((100-v.readiness)*.14*intensity*random(g));
    c.displaced+=Math.round(c.tension*intensity*random(g)*1.7);
    c.tension=clamp(c.tension+noise(g,4)+2-intensity*.7-c.allies*.3);
    c.opinion=clamp(c.opinion-.5*intensity+noise(g,.8));
    v.approval=clamp(v.approval+(c.opinion-53)*.029-.28*intensity,12,88);
    v.stability=clamp(v.stability-.32*intensity);
    v.readiness=clamp(v.readiness-.7*intensity);
    if(random(g)<.18)v.relations.China=clamp(v.relations.China-1);
    return cost;
  }
  function caseTick(g){
    const v=g.gov;
    for(const entry of v.cases){
      if(entry.reviewed||g.turn<entry.turn)continue;
      const item=(entry.type==="order"?v.orders:v.bills).find(x=>x.id===entry.id);
      if(!item||(entry.type==="order"&&!item.active)){entry.reviewed=true;entry.result="Moot";continue;}
      entry.reviewed=true;
      const reasoning=entry.risk>=1?"The spending power belongs to Congress.":entry.type==="law"?"The Court examined the law’s scope and implementation.":"The Court reviewed the agency's statutory authority.";
      if(random(g)<entry.risk){
        entry.result="Blocked";
        if(entry.type==="order")item.active=false;
        else {item.status="Blocked by Court";v.effects=v.effects.filter(e=>e.label!==item.title);}
        v.stability=clamp(v.stability-2);
        logged(g,"Court blocked "+item.title,reasoning,"Courts");
      }else{
        entry.result="Upheld";
        logged(g,"Court upheld "+item.title,reasoning,"Courts");
      }
    }
  }
  function eventTick(g){
    const v=g.gov,c=v.conflict;
    for(const e of v.events.filter(e=>g.turn-e.turn>=3)){
      v.approval=clamp(v.approval-1.25,12,88);v.stability=clamp(v.stability-1.5);
      const title=eventList.find(t=>t.id===e.id).title;
      v.eventHistory.unshift({turn:g.turn,title,decision:"Agencies used their standing response",impact:"Approval −1.3 · stability −1.5"});
      logged(g,title,"Agencies used their standing response when no presidential decision arrived.","National Event");
    }
    v.events=v.events.filter(e=>g.turn-e.turn<3);
    if(g.monthsInOffice%3!==1 || v.events.length>=2)return;
    const weights=eventList.filter(e=>e.id!=="attack"&&!v.events.some(x=>x.id===e.id)&&
      !v.eventHistory.slice(0,3).some(h=>h.title===e.title)&&(e.id!=="strait"||c.level===0));
    const scores={slowdown:(2-v.growth)*3,inflation:(v.inflation-2.6)*2,shutdown:control(g.congress.house)!==g.person.party?2.8:0,
      strait:c.level===0?(c.tension-26)*.18+2.2:0,housing:(v.unemployment-3.6)*1.3};
    const selected=weights.map(e=>({e,rank:(scores[e.id]||0)+noise(g,5)})).sort((a,b)=>b.rank-a.rank)[0]?.e;
    if(!selected)return;
    v.events.push({id:selected.id,turn:g.turn});
    if(selected.id==="strait"){
      Object.assign(c,{level:1,operation:"Diplomatic crisis",tension:Math.max(52,c.tension),cost:0,casualties:0,displaced:0,opinion:56});
      g.stats.conflicts++;
    }
    logged(g,selected.title,selected.detail,"National Event");
  }
  function economy(g,warCost){
    const v=g.gov;
    const out=v.effects.reduce((totals,e)=>({
      cost:totals.cost+e.cost,growth:totals.growth+e.growth,jobs:totals.jobs+e.jobs,revenue:totals.revenue+e.revenue
    }),{cost:0,growth:0,jobs:0,revenue:0});
    const activeOrders=v.orders.filter(o=>o.active).reduce((n,o)=>n+o.cost,0);
    const fed=(v.inflation-2.3)*.04;
    v.growth=clamp(v.growth+(2.05-v.growth)*.13+out.growth*.32-fed+noise(g,.22)-warCost*1.4,-5.5,6.8);
    v.inflation=clamp(v.inflation+(2.45-v.inflation)*.11+(v.growth-2)*.048+out.cost*.075+noise(g,.10),.2,14);
    v.unemployment=clamp(v.unemployment+(4.55-v.unemployment)*.08-(v.growth-2)*.095+out.jobs*.26+noise(g,.098),2.4,14);
    v.spending=clamp(6.36+out.cost+activeOrders+warCost*12+(v.defense-.93)*.42,4.7,11.8);
    v.revenue=clamp(5.23+(v.growth-2)*.14+out.revenue,3.5,8.5);
    v.debt=Math.max(0,v.debt+(v.spending-v.revenue)/12);
    v.confidence=clamp(v.confidence+(55-v.confidence)*.1+(v.growth-2)*.7-(v.inflation-2.5)*.6-(v.unemployment-4.5)*.56+noise(g,.7));
    for(const effect of v.effects)effect.months--;
    v.effects=v.effects.filter(e=>e.months>0);
    v.record.push({turn:g.turn,growth:v.growth,inflation:v.inflation,unemployment:v.unemployment,debt:v.debt});
  }
  const administrations=[
    ["announced a supply-chain investment package.",.12,.10],
    ["tightened discretionary spending.",-.05,-.08],
    ["expanded trade talks with regional partners.",.09,.025],
    ["redirected agency resources toward job training.",.08,.06],
    ["released a budget update while negotiating with Congress.",.025,.045],
    ["coordinated a regional infrastructure response.",.11,.06]
  ];
  function tick(g){
    const v=g.gov;
    const inOffice=G.president(g);
    if(!inOffice){
      const [news,growth,cost]=administrations[Math.floor(random(g)*administrations.length)];
      if(g.turn%2===0)v.effects.push({label:"Current administration",months:4,growth,cost,jobs:-growth*.25,revenue:0});
      if(v.conflict.level&&random(g)<.11)endConflict(g,"Successor negotiated a settlement");
      economy(g,0);
      g.other.approval=clamp(g.other.approval+(51-g.other.approval)*.10+growth*2-(v.inflation-2.5)*.3+noise(g,1.1),19,81);
      g.report=g.other.name+" "+news+" Growth "+v.growth.toFixed(1)+"% · inflation "+v.inflation.toFixed(1)+"%.";
      return;
    }
    g.monthsInOffice++;
    caseTick(g);
    const warCost=conflictTick(g);
    const previous=v.growth;
    economy(g,warCost);
    eventTick(g);
    if((g.monthsInOffice===10||g.monthsInOffice===57||g.monthsInOffice%31===0&&random(g)<.60)&&!v.courts.includes(null)){
      const index=Math.floor(random(g)*9);
      const justice=v.courts[index];v.courts[index]=null;
      logged(g,"Supreme Court vacancy","Justice "+justice+" retired. The Senate can consider your nominee.","Courts");
    }
    const pendingPromises=Object.values(g.promises).filter(p=>!p.fulfilled&&g.turn-p.turn>=18).length;
    const anchor=51+(v.growth-2)*2-(v.inflation-2.5)*1.17-(v.unemployment-4.5)*.85+(g.trust-55)*.16+(v.stability-72)*.10;
    v.approval=clamp(v.approval+(anchor-v.approval)*.074-pendingPromises*.072+noise(g,.68)*G.diff(g).volatility,12,88);
    v.approvalHistory.push({turn:g.turn,value:v.approval});
    for(const group of groups)v.groups[group]=clamp(v.groups[group]+(v.approval-v.groups[group])*.052+noise(g,.24));
    for(const s of D.states)v.regional[s.id]*=.975;
    if(previous<1.2&&v.growth>1.55&&g.stats.signed>0)award(g,"Economic Recovery");
    g.report="The monthly briefing is in. Growth "+signed(v.growth)+"% · unemployment "+v.unemployment.toFixed(1)+"%. "+(v.events.length?"A decision is waiting in National Events.":"Departments are carrying out current policy.");
  }
  function handover(g){
    const v=g.gov;
    for(const order of v.orders){
      if(order.active&&random(g)<.72){
        order.active=false;
        logged(g,"Executive order reversed",g.other.name+" rescinded "+order.title+".","Career");
      }
    }
    v.events=[];
    v.officials={Treasury:null,State:null,Defense:null};
    for(const bill of v.bills)if(["House vote","Senate vote","Amended","Ready to sign","Vetoed"].includes(bill.status))bill.status="Expired";
  }
  window.Government={initialize,control,senateTotals,classIndex,congressElection,seatCongress,propose,legislation,orders,executive,appointments,
    changePriorities,eventList,event,foreign,diplomacy,military,militaryAvailability,militaryAction,tick,handover};
}());
