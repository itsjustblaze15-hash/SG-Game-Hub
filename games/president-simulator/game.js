(function () {
  "use strict";
  const D = window.Scenario;
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
  const avg = values => values.length ? values.reduce((a,b)=>a+b,0)/values.length : 0;
  const signed = (value,digits=1) => (value >= 0 ? "+" : "−") + Math.abs(value).toFixed(digits);
  const date = (year,month) => year*12+month;
  const calendar = turn => ({year:Math.floor(turn/12),month:turn%12});
  const dateLabel = turn => {const {year,month}=calendar(turn);return monthNames[month]+" "+year;};
  const name = g => g.person.first+" "+g.person.last;
  const diff = g => D.difficulties[g.difficulty];
  const currentYear = g => calendar(g.turn).year;
  const nextElection = g => {
    const {year,month}=calendar(g.turn);
    const ahead=(4-year%4)%4;
    return year+ahead+(ahead===0 && (month>10 || (month===10 && g.elections.some(e=>e.year===year))) ? 4 : 0);
  };
  const nextCongress = g => {
    const {year,month}=calendar(g.turn);
    return year%2 ? year+1 : month>10 || g.congress.results.some(result=>result.year===year) ? year+2 : year;
  };
  function random(g) {
    // Persisting the PRNG seed prevents reloading from rerolling an outcome.
    g.rng = (Math.imul(g.rng,1664525)+1013904223)>>>0;
    return g.rng/4294967296;
  }
  const noise = (g,width=1)=>(random(g)*2-1)*width;
  const logged = (g,title,detail,category="Career") => g.log.unshift({turn:g.turn,title,detail,category});
  const award = (g,title) => {if(!g.achievements.includes(title)) g.achievements.push(title);};
  const fail = message => ({ok:false,message});
  const done = message => ({ok:true,message});
  const president = g => g.office==="President";
  const campaigning = g => Boolean(g.campaign && ["primary","ballot","general"].includes(g.campaign.stage));
  const organization = g => president(g) ? 0 : Math.max(2,diff(g).actions-1);
  const officeActions = g => president(g) ? (g.difficulty==="Easy" ? 4 : 3) : 0;
  function changeDifficulty(g,level) {
    if(!Object.hasOwn(D.difficulties,level)||g.office==="Completed")return fail("Choose a difficulty for an active career.");
    g.difficulty=level;
    // Keep the current move budget. Changing difficulty repeatedly cannot grant extra moves.
    return done("Difficulty set to "+level+". Your new move allowance starts next month.");
  }
  function formCandidate(person) {
    const first=String(person.first??"").trim();
    const last=String(person.last??"").trim();
    const age=Number(person.age);
    const priorities=[...new Set(person.priorities||[])];
    if(!first || !last || first.length>24 || last.length>24) return fail("Enter a first and last name, up to 24 characters each.");
    if(!Number.isInteger(age)||age<35||age>99||!person.eligible) return fail("Create a fictional candidate age 35–99 who is a natural-born citizen and has lived in the U.S. for at least 14 years.");
    if(!D.byId[person.home]||person.home==="DC"||!D.parties[person.party]||!Object.hasOwn(D.difficulties,person.difficulty)) return fail("Choose a home state, party and difficulty.");
    if(priorities.length!==3||priorities.some(x=>!D.issues.includes(x))) return fail("Choose exactly three policy priorities.");
    return done({first,last,age,home:person.home,party:person.party,avatar:clamp(Number(person.avatar)||0,0,3),priorities});
  }
  function rivalInfo(row,id) {
    const [name,party,home,priorities,reputation,strategy,funds,skill]=row;
    return {id,name,party,home,priorities,reputation,strategy,funds,skill,activity:{},news:"Preparing a campaign launch."};
  }
  function newCareer(input,seed=Date.now()) {
    const candidate=formCandidate(input);
    if(!candidate.ok) return candidate;
    const g={
      version:1,id:"career-"+Date.now().toString(36)+"-"+(seed>>>0).toString(36),rng:seed>>>0,person:candidate.message,difficulty:input.difficulty,
      turn:date(2028,0),office:"Candidate",elected:0,served:0,terms:[],actions:0,official:0,funds:D.difficulties[input.difficulty].funds,
      recognition:37,reputation:54,trust:55,enthusiasm:51,promises:{},repeats:{},officePriorities:[...candidate.message.priorities],viceParty:null,
      states:Object.fromEntries(D.states.map(s=>[s.id,{support:0,opponents:{},visits:0,activity:0,enthusiasm:50}])),
      campaign:null,elections:[],pendingPresident:null,other:{name:"President Avery Bennett",party:"R",approval:49},screen:null,
      stats:{campaigns:0,nominations:0,primaryLosses:0,wins:0,losses:0,states:0,ev:0,speeches:0,raised:0,signed:0,vetoes:0,orders:0,conflicts:0,agreements:0,events:0},
      log:[],achievements:[],report:"Your campaign team is ready. Choose a state to start building support.",
      monthsInOffice:0,congress:{house:{D:219,R:214,I:2},senate:[{D:17,R:15,I:1},{D:15,R:17,I:1},{D:17,R:17,I:0}],results:[],pending:null,momentum:0}
    };
    window.Government.initialize(g);
    startCampaign(g);
    return {ok:true,game:g};
  }
  function startCampaign(g){
    const {party}=g.person;
    const year=currentYear(g);
    g.stats.campaigns++;
    if(!president(g)&&!g.served)g.office="Candidate";
    const opponents = opponentsForYear(year);
    const incumbentRival=opponents.find(opponent=>opponent.party===g.other.party);
    if(incumbentRival && !president(g) && year>2028) {
      incumbentRival.name=g.other.name.replace(/^President /,"");
      incumbentRival.reputation=clamp(g.other.approval+19,45,88);
      incumbentRival.strategy="Incumbent running on their record";
    }
    const same=party==="I" ? null : D.rivals.filter(row=>row[1]===party).find(row=>row[0]!==opponents.find(r=>r.party===party).name);
    for(const s of Object.values(g.states)){
      s.support=clamp(s.support*.57,-10,11);
      s.opponents={};
      s.activity=0;
      s.enthusiasm=50+(s.enthusiasm-50)*.5;
    }
    g.campaign={year,stage:party==="I"?"ballot":"primary",rivals:opponents,primary:same?rivalInfo(same,"P"):null,
      delegates:0,total:0,contests:[],petition:19,debates:[],fundraisers:0,monthly:{},news:"The race has begun.",message:"",
      climate:noise(g,2.4),currentEvent:null};
    g.funds = Math.max(g.funds, diff(g).funds*.63)+(g.stats.campaigns>1?5:0);
    g.actions=diff(g).actions;
    award(g,"First Campaign");
    logged(g,year+" presidential campaign",party==="I"?"Independent ballot drive opened.":D.parties[party]+" primary campaign opened.","Election");
  }
  function opponentsForYear(year){
    const index=((year-2028)/4)%2;
    return ["D","R"].map(party=>rivalInfo(D.rivals.filter(row=>row[1]===party)[index],party));
  }
  function players(g) {
    const human={id:"player",name:name(g),party:g.person.party};
    return [human,...g.campaign.rivals.filter(r=>r.party!==g.person.party).map(({id,name,party})=>({id,name,party}))];
  }
  function generalShares(g,s,dist=0) {
    const state=g.states[s.id];
    const p=g.person;
    const rival=g.campaign.rivals;
    const rivalShift=(rival.find(o=>o.id==="D").reputation-rival.find(o=>o.id==="R").reputation)*.055;
    const party=clamp(50+s.lean+dist+rivalShift+(state.opponents.D||0)-(state.opponents.R||0),6,94);
    const story=(g.reputation-54)*.10+(g.trust-55)*.12+(g.recognition-42)*.018+(g.enthusiasm-51)*.055;
    const approval=president(g)?(g.gov.approval-51)*.22+(g.gov.growth-2)*.45-(g.gov.conflict.level>=3?1.2:0)+Math.min(2,g.stats.signed*.19):g.served?(avg(g.gov.approvalHistory.map(h=>h.value))-50)*.07:0;
    const local=state.support+(state.enthusiasm-50)*.06+(s.id===p.home?1.75:0)+p.priorities.filter(i=>s.issues.includes(i)).length*.32;
    const momentum=story+approval+local+g.campaign.climate-(diff(g).ai-1)*3;
    if(p.party==="I"){
      const strength=clamp(27+momentum*1.14-Math.abs(s.lean)*.26+(s.id===p.home?2:0),4,71);
      return {player:strength,D:(100-strength)*party/100,R:(100-strength)*(100-party)/100};
    }
    const opponent=p.party==="D"?"R":"D";
    const alignment=p.party==="D" ? 50+s.lean+dist : 50-s.lean-dist;
    const rivalHome=g.campaign.rivals.find(o=>o.id===opponent).home===s.id ? .8 : 0;
    const support=clamp(alignment+momentum-(state.opponents[opponent]||0)-rivalHome-.55,4,96);
    return {player:support,[opponent]:100-support};
  }
  function primaryWeight(s){return Math.max(9,Math.round(s.ev*5+s.turnout*2));}
  function primaryShares(g,s){
    const local=g.states[s.id];
    const challenger=g.campaign.primary;
    const appeal=g.person.priorities.filter(p=>s.issues.includes(p)).length;
    const counter=challenger.priorities.filter(p=>s.issues.includes(p)).length;
    return clamp(49+(g.trust-54)*.11+(g.reputation-54)*.15+(g.recognition-38)*.09+
      local.support*.66+(appeal-counter)*1.05+(s.id===g.person.home?7:0)-(s.id===challenger.home?5:0)-
      (local.opponents.P||0)-(diff(g).ai-1)*4,12,89);
  }
  function support(g,id){
    const s=D.byId[id];
    if(g.campaign.stage==="primary"){
      const called=g.campaign.contests.find(c=>c.id===id);
      const share=called?called.share:primaryShares(g,s);
      return {player:share,P:100-share};
    }
    return generalShares(g,s);
  }
  function spend(g,cost,pool){
    if(g.screen) return fail("Finish the current screen before taking another action.");
    if(g[pool]<=0) return fail("You have used your available actions this month.");
    if(g.funds+1e-8<cost) return fail("Your campaign cannot afford this action.");
    g[pool]--;
    g.funds=Math.max(0,g.funds-cost);
    return null;
  }
  function repeat(g,key){
    const entry=g.repeats[key]||{turn:g.turn,count:0};
    const pressure=Math.max(0,entry.count-(g.turn-entry.turn)*.25);
    g.repeats[key]={turn:g.turn,count:pressure+1};
    return 1/(1+pressure*.62);
  }
  function campaignAction(g,type,id,topic=g.officePriorities[0]){
    const spec=D.actions[type], s=D.byId[id];
    if(!spec || !s || !D.issues.includes(topic)||!(campaigning(g)||!president(g))||g.office==="Completed") return fail("That campaign action is unavailable.");
    if(president(g)&&!campaigning(g)) return fail("Campaign actions open during an election campaign.");
    if(type==="funds" && g.campaign.fundraisers>=2) return fail("Your donor team has already held two fundraisers this month.");
    const [label,cost,power]=spec;
    const blocked=spend(g,cost,"actions");
    if(blocked) return blocked;
    const c=g.campaign;
    const local=g.states[id];
    const freshness=repeat(g,type+id);
    if(type==="funds"){
      const amount=Math.min(70-g.funds,Math.max(0,(1.55+g.reputation*.032+(s.id===g.person.home?.65:0)+noise(g,.65))*freshness));
      g.funds+=amount;g.stats.raised+=amount;c.fundraisers++;
      const message="$"+amount.toFixed(2)+"M raised. Donor outreach grows less effective with repetition.";
      logged(g,label,message,"Campaign");
      return done(message);
    }
    const relevant=s.issues.includes(topic);
    const priority=g.officePriorities.includes(topic);
    const risk=(g.trust<48?.45:0)+(freshness<.5?.65:0);
    const timely=type==="respond"&&c.currentEvent?(topic===c.currentEvent.topic?1.35:-.75):0;
    const gain=(power+(relevant?.75:-.45)+(priority?.39:0)+timely)*freshness+noise(g,1.13)*diff(g).volatility-risk;
    local.support=clamp(local.support+gain,-13,20);
    local.activity++;
    if(type==="visit") local.visits++;
    if(type==="rally"){
      local.enthusiasm=clamp(local.enthusiasm+gain*1.37);
      g.enthusiasm=clamp(g.enthusiasm+gain*.11);
    }
    g.recognition=clamp(g.recognition+(type==="ads"?1.35:.66)*freshness);
    if(type==="policy") g.promises[topic]=g.promises[topic]||{fulfilled:false,turn:g.turn};
    if(type==="interview"||type==="respond") {
      g.trust=clamp(g.trust+gain*.52);
      g.reputation=clamp(g.reputation+gain*.33);
      if(type==="respond"){
        c.news=gain>0?"Your response steadied the campaign.":"Your response drew mixed coverage.";
        if(c.currentEvent&&timely>0)c.currentEvent=null;
      }
    }
    if(type==="endorse") {
      g.congress.momentum=clamp(g.congress.momentum+gain*.55,-5,8);
      g.reputation=clamp(g.reputation+gain*.44);
    }
    if(c.stage==="ballot") c.petition=clamp(c.petition+(type==="visit"?6:3)*freshness+(relevant?1:0));
    const message=(gain>=0?"Support improved in ":"Support slipped in ")+s.name+" ("+signed(gain)+" campaign boost). "+
      (relevant?"Voters there care about "+topic.toLowerCase()+".":topic+" is a lower priority for voters there.")+
      (freshness<.6?" Try a different action or state next time.":"");
    logged(g,label+" · "+s.name,message,"Campaign");
    return done(message);
  }
  const tones=["Inspirational","Serious","Aggressive","Unifying","Defensive"];
  const messages=[
    {title:"Make a specific pledge",text:"I will put measurable goals on the table and report back on the results."},
    {title:"Build common ground",text:"We can disagree and still work together on the problems families face."},
    {title:"Defend your record",text:"Judge our approach by the work already underway and the people it reaches."}
  ];
  function speech(g,{id,topic,tone,message}){
    if(!(id==="national"||D.byId[id])||![...D.issues,"Government Performance"].includes(topic)||!tones.includes(tone)||![0,1,2].includes(message)||g.office==="Completed") return fail("Choose a valid subject, location and message.");
    const governing=president(g);
    const blocked=spend(g,governing?0:.15,governing?"official":"actions");
    if(blocked)return blocked;
    const audience=id==="national"?D.states:[D.byId[id]];
    const repeated=repeat(g,"speech:"+id+":"+topic);
    const promise=g.promises[topic];
    const benefit=(g.trust-52)*.027+(g.officePriorities.includes(topic)?.6:0)+(governing && g.gov.events.length && tone==="Serious"?.6:0);
    const toneScore={Inspirational:g.enthusiasm/95,Serious:.32,Aggressive:g.enthusiasm/43-1.35,Unifying:.8-Math.abs(g.trust-60)*.014,Defensive:(50-g.trust)*.03}[tone];
    const position=message===0?(promise && !promise.fulfilled?-.54:.48):message===1?.46:(governing?(g.gov.approval-48)*.065:(g.reputation-56)*.055);
    const swing=noise(g,.88)*diff(g).volatility;
    const outreachScale=id==="national"?.20:1;
    const gains=audience.map(s=>{
      const fit=s.issues.includes(topic)?1.15:-.32;
      const polar=tone==="Aggressive"?(fit>0?.82:-1.05):0;
      const effect=(benefit+toneScore+position+fit+polar)*repeated+swing-(1-repeated)*.75;
      const local=g.states[s.id];
      local.support=clamp(local.support+effect*outreachScale,-13,20);
      local.enthusiasm=clamp(local.enthusiasm+effect*.54);
      local.activity+=id==="national"?0:1;
      if(governing)g.gov.regional[s.id]=clamp(g.gov.regional[s.id]+effect*(id==="national"?.44:1),-20,20);
      return effect;
    });
    const gain=avg(gains);
    g.stats.speeches++;
    g.reputation=clamp(g.reputation+gain*.52);
    g.recognition=clamp(g.recognition+1.1*repeated);
    g.trust=clamp(g.trust+gain*(tone==="Aggressive"?.19:.47));
    if(governing) {
      g.gov.approval=clamp(g.gov.approval+gain*(id==="national"?1.12:.45),12,88);
      if(id==="national") g.gov.groups["Cross-party voters"]=clamp(g.gov.groups["Cross-party voters"]+gain*(tone==="Unifying"?1.2:.48));
    }
    if(!governing && g.campaign.stage==="ballot")g.campaign.petition=clamp(g.campaign.petition+2*repeated);
    if(message===0 && D.issues.includes(topic))g.promises[topic]=promise||{fulfilled:false,turn:g.turn};
    const effect=signed(gain*(governing?(id==="national"?1.12:.45):outreachScale));
    const result=(id==="national"?"National address":D.byId[id].name+" speech")+" on "+topic+". "+effect+" points in "+(governing?"approval":"audience support")+". "+(repeated<.6?"Repetition limited the response.":gain>=0?"The message found a receptive audience.":"The message drew a cooler response.");
    logged(g,"Speech · "+topic,result,governing?"White House":"Campaign");
    return done(result);
  }
  const debateQuestions=[
    ["Economy","Household bills are rising. What would you do first?","I would lower costs with focused investments and publish their budget impact.","I would review taxes and regulations before adding new programs.","I would bring governors and both parties into a cost-of-living agreement."],
    ["Healthcare","How would you improve access to healthcare?","I would expand community clinics where care is hardest to reach.","I would prioritize competition and price transparency.","I would let states test reforms against clear national goals."],
    ["National Security","How should America respond to a growing crisis abroad?","I would strengthen defensive readiness and consult Congress.","I would respond quickly with a limited operation when necessary.","I would convene allies and keep a diplomatic channel open."]
  ];
  function debateAvailable(g){
    const m=calendar(g.turn).month;
    return campaigning(g)&&((g.campaign.stage==="primary"&&[1,3].includes(m))||(g.campaign.stage==="general"&&[8,9].includes(m)))&&!g.campaign.debates.includes(m);
  }
  function debate(g,answers){
    if(!debateAvailable(g)||answers.length!==3||answers.some(i=>![0,1,2].includes(i)))return fail("There is no debate available or an answer is missing.");
    const blocked=spend(g,.1,"actions");
    if(blocked)return blocked;
    const c=g.campaign;
    const rival=c.stage==="primary"?c.primary:c.rivals.find(r=>r.party!==g.person.party);
    const notes=[];
    const scores=debateQuestions.map(([topic],i)=>{
      const a=answers[i];
      const style=(a===0?g.officePriorities.includes(topic)?2.1:.16:a===1?g.enthusiasm/38-.85:g.trust/40-.33);
      const reply=(rival.skill-60)*.07+(rival.priorities.includes(topic)?.45:0)+noise(g,.65);
      const gain=style-reply+noise(g,.91);
      notes.push({topic,reply:rival.name+": "+(rival.priorities.includes(topic)?"My record on "+topic.toLowerCase()+" shows I can deliver.":"I would get input from local leaders before setting a national plan."),gain});
      for(const s of D.states) g.states[s.id].support=clamp(g.states[s.id].support+gain*(s.issues.includes(topic)?.6:.17),-13,20);
      return gain;
    });
    const score=avg(scores);
    g.recognition=clamp(g.recognition+3.1);
    g.reputation=clamp(g.reputation+score*1.2);
    g.trust=clamp(g.trust+score*.8);
    c.debates.push(calendar(g.turn).month);
    const summary="Net debate performance: "+signed(score)+". Reputation and state polling have been updated.";
    logged(g,"Presidential debate",summary,"Election");
    return {ok:true,message:summary,notes};
  }
  function aiCampaign(g){
    const c=g.campaign;
    const opponents=c.stage==="primary"?[c.primary]:c.rivals.filter(r=>r.party!==g.person.party);
    for(const r of opponents){
      const target=D.states.map(state=>{
        const share=c.stage==="primary"?primaryShares(g,state):generalShares(g,state)[r.id]||40;
        const fit=state.issues.filter(i=>r.priorities.includes(i)).length;
        const activity=r.activity[state.id]||0;
        return {state,score:18-Math.abs(50-share)*.8+state.ev*.16+fit*1.8-activity*3+noise(g,7)};
      }).sort((a,b)=>b.score-a.score);
      r.funds+=1.5+r.reputation*.021;
      const visited=[];
      for(const {state} of target.slice(0,g.difficulty==="Hard"?4:3)){
        if(r.funds<.62)break;
        r.funds-=.62;
        const score=clamp(.58+noise(g,.42)+state.issues.filter(i=>r.priorities.includes(i)).length*.27,.12,2)*diff(g).ai;
        const row=g.states[state.id].opponents;
        row[r.id]=clamp((row[r.id]||0)+score,0,9);
        r.activity[state.id]=(r.activity[state.id]||0)+1;
        visited.push(state.id);
      }
      const eventTopic=c.currentEvent?.topic;
      const credible=eventTopic&&r.priorities.includes(eventTopic);
      r.reputation=clamp(r.reputation+noise(g,.73)+(credible?.44:0));
      r.news=visited.length?r.name+" organized in "+visited.join(", ")+".":r.name+" focused on fundraising.";
      if(eventTopic)r.news+=" Their campaign addressed "+eventTopic.toLowerCase()+(credible?", highlighting a signature priority.":".");
    }
    c.news=(opponents[0]||c.rivals[0]).news;
  }
  function primaryRound(g,month){
    const c=g.campaign;
    for(const [index,s] of D.states.entries()){
      if(index%5!==month-1)continue;
      const share=clamp(primaryShares(g,s)+noise(g,4.8),0,100);
      const total=primaryWeight(s);
      const delegates=Math.round(total*share/100);
      c.contests.push({id:s.id,share,delegates,total});
      c.total+=total;c.delegates+=delegates;
    }
    if(month!==5)return;
    if(c.delegates>c.total/2) {
      c.stage="general";g.stats.nominations++;award(g,"Presidential Nominee");
      c.message="You won the nomination with "+c.delegates+" of "+c.total+" delegates.";
    } else {
      c.stage="eliminated";g.stats.primaryLosses++;
      c.message=c.primary.name+" won the nomination. Build your organization for "+(c.year+4)+".";
      if(!president(g))g.office=g.served?"Former President":"Political Organizer";
    }
    logged(g,"Nomination results",c.message,"Election");
    g.screen={type:"nomination"};
  }
  function ballotReview(g){
    const c=g.campaign;
    c.qualified=D.states.filter(s=>c.petition+g.states[s.id].support*.8+(s.id===g.person.home?10:0)>=57+Math.abs(s.lean)*.22).map(s=>s.id);
    const ev=D.states.filter(s=>c.qualified.includes(s.id)).reduce((n,s)=>n+s.ev,0);
    if(ev>=270) {
      c.stage="general";g.stats.nominations++;
      c.message="Your petitions cleared ballot access in "+c.qualified.length+" jurisdictions, covering "+ev+" electoral votes.";
    }else{
      c.stage="eliminated";g.stats.primaryLosses++;
      c.message="Your petitions covered "+ev+" electoral votes. Build a larger signature operation for "+(c.year+4)+".";
      if(!president(g))g.office=g.served?"Former President":"Political Organizer";
    }
    logged(g,"Ballot access review",c.message,"Election");
    g.screen={type:"nomination"};
  }
  function winningId(shares){return Object.keys(shares).sort((a,b)=>shares[b]-shares[a])[0];}
  function electoralTotal(rows,tickets){
    const ev=Object.fromEntries(tickets.map(t=>[t.id,0]));
    for(const row of rows)for(const [id,votes] of Object.entries(row.ev))ev[id]+=votes;
    return ev;
  }
  function contingent(g,ev,rows,tickets,congressResult){
    const ranking=Object.keys(ev).filter(id=>ev[id]>0).sort((a,b)=>ev[b]-ev[a]);
    const eligible=ranking.slice(0,3);
    const seats=congressResult.delegations;
    const partyOf=id=>tickets.find(t=>t.id===id).party;
    const rounds=[];
    let active=[...eligible];
    let winner=null;
    // Model repeated House ballots with real state-delegation voting. Negotiations consolidate the lowest caucus.
    for(let round=0;round<4&&!winner;round++){
      if(round>=1&&active.length>2)active=active.slice(0,2);
      const votes=Object.fromEntries(eligible.map(id=>[id,0]));
      const delegationVotes={};
      for(const row of rows){
        if(row.id==="DC")continue;
        const preferred=seats[row.id];
        let pool=active;
        if(preferred!=="split"&&active.some(id=>partyOf(id)===preferred))pool=active.filter(id=>partyOf(id)===preferred);
        if(preferred==="split"&&round===0){delegationVotes[row.id]="split";continue;}
        const choice=[...pool].sort((a,b)=>(row.shares[b]||0)-(row.shares[a]||0))[0];
        votes[choice]++;
        delegationVotes[row.id]=choice;
      }
      winner=Object.keys(votes).find(id=>votes[id]>=26)||null;
      if(!winner&&round>=2){
        const top=active[0], other=active[1];
        const deal=rows.filter(r=>delegationVotes[r.id]===other)
          .sort((a,b)=>((a.shares[other]||0)-(a.shares[top]||0))-((b.shares[other]||0)-(b.shares[top]||0)))[0];
        if(deal){delegationVotes[deal.id]=top;votes[other]--;votes[top]++;winner=top;}
      }
      rounds.push({votes,delegationVotes,agreement:round>=2});
      active.sort((a,b)=>votes[b]-votes[a]||ev[b]-ev[a]);
    }
    const senate=window.Government.senateTotals(congressResult.senate);
    const finalists=ranking.slice(0,2);
    const senateVotes=Object.fromEntries(finalists.map(id=>[id,senate[partyOf(id)]]));
    const undecided=100-Object.values(senateVotes).reduce((a,b)=>a+b,0);
    const favored=[...finalists].sort((a,b)=>senateVotes[b]-senateVotes[a]||ev[b]-ev[a])[0];
    const other=finalists.find(id=>id!==favored);
    senateVotes[favored]+=Math.ceil(undecided/2);
    senateVotes[other]+=Math.floor(undecided/2);
    if(senateVotes[favored]===50){senateVotes[favored]++;senateVotes[other]--;}
    const vicePresident=finalists.find(id=>senateVotes[id]>=51);
    return {winner,rounds,vicePresident,senateVotes};
  }
  function election(g,congressResult){
    const c=g.campaign;
    const year=congressResult.year;
    const sameCycle=c.year===year;
    const onBallot=sameCycle&&c.stage==="general";
    const rivals=sameCycle?c.rivals:opponentsForYear(year);
    const tickets=onBallot?players(g):rivals.map(({id,name,party})=>({id,name,party}));
    const rows=[];
    const popular=Object.fromEntries(tickets.map(t=>[t.id,0]));
    const shift=noise(g,1.45)*diff(g).volatility;
    for(const s of D.states){
      const allowed=onBallot&&(g.person.party!=="I"||c.qualified.includes(s.id));
      const tally=(district=0)=>{
        const party=president(g)?g.person.party:g.other.party;
        const approval=president(g)?g.gov.approval:g.other.approval;
        const incumbentEffect=(party==="D"?1:party==="R"?-1:0)*(approval-48)*.29;
        const shares=allowed?generalShares(g,s,district):{D:clamp(50+s.lean+district+incumbentEffect+(g.states[s.id].opponents.D||0)*.22-(g.states[s.id].opponents.R||0)*.22,5,95)};
        if(!allowed)shares.R=100-shares.D;
        // Preserve a shared national swing, with local uncertainty and district-level variation.
        const jitter=noise(g,2.2);
        const first=allowed?"player":"D";
        const old=shares[first];
        shares[first]=clamp(old+shift+jitter,1,98);
        for(const id of Object.keys(shares))if(id!==first)shares[id]*=(100-shares[first])/(100-old);
        return shares;
      };
      let shares=tally();
      const districts=(D.districts[s.id]||[]).map((tilt,index)=>({label:s.id+"-"+(index+1),shares:tally(tilt)}));
      const turnout=Math.round(s.turnout*1000000*(1+noise(g,.075)+(g.states[s.id].enthusiasm-50)*.002));
      if(districts.length)shares=Object.fromEntries(Object.keys(shares).map(id=>[id,avg(districts.map(d=>d.shares[id]))]));
      const winner=winningId(shares);
      const ev={[winner]:districts.length?2:s.ev};
      for(const district of districts){
        district.winner=winningId(district.shares);
        ev[district.winner]=(ev[district.winner]||0)+1;
      }
      for(const id of Object.keys(shares))popular[id]+=Math.round(turnout*shares[id]/100);
      rows.push({id:s.id,winner,shares,ev,districts,turnout,order:random(g)*3+Math.abs((shares[winner]||0)-50)*.06});
    }
    rows.sort((a,b)=>b.order-a.order);
    const ev=electoralTotal(rows,tickets);
    const majority=Object.keys(ev).find(id=>ev[id]>=270);
    const runoff=majority?null:contingent(g,ev,rows,tickets,congressResult);
    const winner=majority||runoff.winner;
    const result={year,tickets,rows,popular,ev,winner,runoff,onBallot};
    g.elections.push(result);
    if(sameCycle)c.stage="closed";
    if(onBallot){
      g.stats.ev+=ev.player;
      g.stats.states+=rows.filter(r=>r.winner==="player"&&r.id!=="DC").length;
      if(winner==="player"){
        g.elected++;g.stats.wins++;award(g,"Road to the White House");
        if(g.served===1){
          if(president(g))award(g,"Reelected President");
          else award(g,"Political Comeback");
        }else if(g.stats.losses || g.stats.primaryLosses)award(g,"Political Comeback");
      }else{
        g.stats.losses++;
        g.reputation=clamp(g.reputation-2);
        if(!president(g))g.office=g.served?"Former President":"Political Organizer";
      }
    }
    const ticket=tickets.find(t=>t.id===winner);
    g.pendingPresident={...ticket,year:year+1,viceParty:runoff?tickets.find(t=>t.id===runoff.vicePresident).party:ticket.party};
    const detail=ticket.name+" won the presidency "+(runoff?"in the House.":"with "+ev[winner]+" electoral votes.")+(onBallot?" Your total: "+ev.player+".":"");
    logged(g,year+" presidential election",detail,"Election");
    g.screen={type:"election",year};
    return result;
  }
  function inauguration(g,choice){
    if(g.screen?.type!=="inauguration"||![0,1,2].includes(choice))return fail("Choose an inaugural address.");
    g.gov.approval=clamp(g.gov.approval+[1.7,.85,1.2][choice],12,88);
    g.trust=clamp(g.trust+[.5,1.7,1][choice]);
    g.stats.speeches++;
    logged(g,"Inaugural address",["Renewal and opportunity","A government for everyone","Service and accountability"][choice],"White House");
    g.screen=null;
    return done("Your administration has taken office.");
  }
  function transition(g,year){
    const prior=president(g);
    if(prior&&g.terms.at(-1).until===year){
      g.served++;
      logged(g,"Term "+g.served+" completed","Four years in office completed on January 20, "+year+".","White House");
      if(g.served===2){
        g.office="Completed";g.screen={type:"legacy"};
        g.pendingPresident=null;
        award(g,"Two-Term President");award(g,"Presidential Legacy");
        return;
      }
    }
    if(g.pendingPresident?.year!==year)return;
    const winner=g.pendingPresident;
    g.pendingPresident=null;
    g.viceParty=winner.viceParty||winner.party;
    if(winner.id==="player"){
      g.office="President";
      g.terms.push({from:year,until:year+4,startGrowth:g.gov.growth,startDebt:g.gov.debt});
      g.gov.approval=prior?clamp(g.gov.approval+2,30,80):clamp(51+(g.trust-55)*.25,42,66);
      g.gov.approvalHistory.push({turn:g.turn,value:g.gov.approval});
      g.report="Your administration has taken office. Review your national priorities and the new Congress.";
      g.screen={type:"inauguration"};
      logged(g,"Inauguration","President "+name(g)+" took office on January 20, "+year+".","White House");
      if(g.elected===1)award(g,"First-Term President");
    }else{
      g.office=g.served?"Former President":"Political Organizer";
      g.other={name:"President "+winner.name,party:winner.party,approval:51};
      if(prior)window.Government.handover(g);
      logged(g,g.served?"Return to private life":"New administration",g.other.name+" took office. Your next campaign can begin in "+(year+3)+".","Career");
    }
  }
  function advance(g){
    if(g.screen || g.office==="Completed")return fail("Finish the open screen before advancing.");
    const old=calendar(g.turn);
    window.Government.tick(g);
    if(campaigning(g))aiCampaign(g);
    else for(const local of Object.values(g.states))local.support*=.977;
    if(g.campaign.stage==="primary"&&old.month>=1&&old.month<=5)primaryRound(g,old.month);
    if(g.campaign.stage==="ballot"&&old.month===6)ballotReview(g);
    if(old.month===10&&old.year%2===0){
      const result=window.Government.congressElection(g,old.year);
      if(old.year%4===0)election(g,result);
      else g.screen={type:"midterm",year:old.year};
    }
    g.turn++;
    const next=calendar(g.turn);
    if(campaigning(g)){
      g.campaign.currentEvent=null;
      if([2,4,7,9].includes(next.month)){
        const [topic,headline]=D.campaignNews[Math.floor(random(g)*D.campaignNews.length)];
        g.campaign.currentEvent={topic,headline};
      }
    }
    if(next.month===0){
      if(g.congress.pending&&g.congress.pending.year===next.year-1)window.Government.seatCongress(g);
      transition(g,next.year);
      if(next.year%4===0&&g.elected<2&&g.office!=="Completed")startCampaign(g);
    }
    g.actions=g.office==="Completed"?0:campaigning(g)?diff(g).actions:organization(g);
    g.official=officeActions(g);
    g.campaign.fundraisers=0;
    return done(dateLabel(g.turn));
  }
  function dismiss(g){
    if(["nomination","election","midterm"].includes(g.screen?.type)){g.screen=null;return done("Ready for the next month.");}
    return fail("This screen requires a decision.");
  }
  window.Game={clamp,avg,signed,date,calendar,dateLabel,name,diff,currentYear,nextElection,nextCongress,random,noise,logged,award,fail,done,president,campaigning,newCareer,
    support,generalShares,players,tones,messages,speech,campaignAction,debateAvailable,debateQuestions,debate,advance,dismiss,inauguration,electoralTotal,contingent,changeDifficulty};
}());
