(function () {
  "use strict";
  const G=window.Game, W=window.Government, D=window.Scenario, C=window.Careers;
  const app=document.getElementById("app"), modal=document.getElementById("dialog"), toast=document.getElementById("toast");
  const I={
    arrow:"M5 12h14m-6-6 6 6-6 6",back:"M19 12H5m6-6-6 6 6 6",plus:"M12 5v14M5 12h14",
    play:"m8 5 11 7-11 7V5Z",book:"M12 6c-3-2-6-3-9-2v15c3-1 6 0 9 2m0-15c3-2 6-3 9-2v15c-3-1-6 0-9 2m0-15v15",
    history:"M4 11a8 8 0 1 1 2 6m-2-9v4h4m4-5v5l3 2",settings:"M4 7h16M4 17h16M8 4v6m8 4v6",
    grid:"M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",map:"m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15",
    mic:"M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5Zm-4 6v1a7 7 0 0 0 14 0v-1m-7 8v3m-3 0h6",
    ballot:"M5 11h14l2 3v6H3v-6l2-3Zm2 4h10M9 8V3h6v5m-4 0 2 2 3-4",
    graph:"M3 19h18M5 15l5-6 4 3 5-7m-3 0h3v3",bank:"m3 8 9-5 9 5M4 19h16M6 10v6m6-6v6m6-6v6M3 21h18",
    scroll:"M6 20h11a3 3 0 0 0 3-3v-2h-4V4H6a2 2 0 0 0-2 2v2h4v9a3 3 0 0 1-3 3m5-12h3m-3 4h3",
    shield:"M12 22c4-2 8-5 8-11V5l-8-3-8 3v6c0 6 4 9 8 11Zm-4-10 3 3 5-6",
    globe:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0 0c5-3 5-17 0-20-5 3-5 17 0 20ZM2 12h20",
    people:"M4 19v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 3a4 4 0 0 1 4 4v2m-3-9a3 3 0 0 0 0-6",
    pulse:"M3 12h4l3-6 4 12 3-6h4",calendar:"M4 5h16v16H4zM4 9h16M8 3v4m8-4v4",
    funds:"M4 6h16v12H4zM7 9h1m8 6h1m-5-6v6m2-5h-3a1 1 0 0 0 0 2h2a1 1 0 0 1 0 2h-3",
    message:"M4 4h16v12H9l-5 4V4Zm4 5h8m-8 3h5",flag:"M5 21V4m0 2c5-5 9 5 14 0v9c-5 5-9-5-14 0",
    target:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-5a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-5h.01",
    brief:"M4 7h16v13H4zM9 7V4h6v3M4 12h16m-9 0v2h2v-2",cash:"M6 20h12M12 4v16m5-13h-7a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6"
  };
  const icon=(id)=>'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+I[id]+'"/></svg>';
  const esc=(s)=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const attr=esc;
  const fmt=(n,d=1)=>Number(n).toFixed(d);
  const pct=(n,d=1)=>fmt(n,d)+"%";
  const money=(n,unit="M")=>"$"+fmt(n,unit==="M"?2:2)+unit;
  const count=n=>Number(n).toLocaleString("en-US");
  const color={D:"#6899e5",R:"#e58678",I:"#ad8bd2",none:"#c2cfdb"};
  const raceColors={leading:"#74b9a4",rival:"#b8a7d2",close:"#f6c777"};
  const options=(items,selected)=>items.map(item=>{
    const [value,label]=Array.isArray(item)?item:[item,item];
    return '<option value="'+attr(value)+'"'+(String(value)===String(selected)?" selected":"")+'>'+esc(label)+'</option>';
  }).join("");
  const stateOptions=(selected,dc=true)=>options(D.states.filter(s=>dc||s.id!=="DC").map(s=>[s.id,s.name]),selected);
  const btn=(label,action,opts={})=>'<button type="button" class="btn '+(opts.style||"")+'" data-action="'+attr(action)+'"'+(opts.value!==undefined?' data-value="'+attr(opts.value)+'"':"")+(opts.disabled?" disabled":"")+(opts.title?' title="'+attr(opts.title)+'"':"")+'>'+ (opts.icon?icon(opts.icon):"")+esc(label)+(opts.arrow?icon("arrow"):"")+'</button>';
  const panel=(body,css="")=>'<div class="panel pad '+css+'">'+body+'</div>';
  const section=(title,description="")=>'<div class="section-head"><h2>'+title+'</h2>'+(description?'<p class="body-copy">'+description+'</p>':"")+'</div>';
  const pill=(label,style="")=>'<span class="pill '+style+'">'+esc(label)+'</span>';
  const meter=(value,style="")=>'<div class="bar" aria-hidden="true"><span class="'+style+'" style="width:'+G.clamp(value)+'%"></span></div>';
  const info=(term)=>'<button class="info" type="button" aria-label="Learn about '+attr(term)+'" title="Learn about '+attr(term)+'" data-action="info" data-value="'+attr(term)+'">i</button>';
  const row=(a,b)=>'<div class="row"><span>'+a+'</span><strong>'+b+'</strong></div>';
  const field=(label,control)=>'<label class="form-field">'+esc(label)+control+'</label>';
  const head=(eyebrow,title,description="",side="")=>'<header class="page-head"><div>'+(eyebrow?'<div class="eyebrow">'+esc(eyebrow)+'</div>':"")+'<h1 tabindex="-1">'+esc(title)+'</h1>'+(description?'<p class="body-copy">'+description+'</p>':"")+'</div>'+side+'</header>';
  const metric=(label,value,note,id)=>'<article class="metric"><div class="metric-label">'+label+(id?icon(id):"")+'</div><strong class="num">'+value+'</strong><small>'+note+'</small></article>';
  const metrics=(items)=>'<div class="metrics">'+items.join("")+'</div>';
  const stateNames=(ids)=>ids.map(id=>D.byId[id].name).join(", ");
  const portrait=(id)=>{
    const shapes=[
      "M7 34v-5c2-6 7-8 11-8s9 2 11 8v5M18 19a6 6 0 1 0 0-12 6 6 0 0 0 0 12",
      "M6 34v-4c1-5 6-8 12-8s11 3 12 8v4M12 17c-2-3-2-11 6-11 8 0 8 8 6 11l-2 3h-8z",
      "M6 34v-4c2-5 7-7 12-7s10 2 12 7v4M18 20c4 0 6-4 6-8a6 6 0 0 0-12 0c0 4 2 8 6 8",
      "M7 34v-4c2-6 8-7 11-7s9 1 11 7v4M13 19l-2-4c-1-5 2-9 7-9s8 4 7 9l-2 4-5 2z"
    ];
    return '<span class="avatar a'+Number(id)+'" aria-hidden="true"><svg viewBox="0 0 36 36"><path d="'+shapes[id]+'" fill="currentColor"/></svg></span>';
  };
  let game=null, screen="menu", page="overview", state="PA", resultState="PA", mapMode="auto", formMessage="";
  let revealed=0, revealTimer, toastTimer, visibleYear=null, logFilter="All", pendingLabel="";
  let lastDecision="";
  const gov=()=>G.president(game);
  const canCampaign=()=>G.campaigning(game)||!gov();
  const canDo=(cost=0)=>canCampaign()&&game.actions>0&&game.funds>=cost&&!game.screen;
  const canGovern=()=>gov()&&game.official>0&&!game.screen;
  const toastMessage=(message,error=false)=>{
    clearTimeout(toastTimer);
    toast.textContent=message;
    toast.className="visible"+(error?" error":"");
    toastTimer=setTimeout(()=>{toast.className="";},5600);
  };
  function topbar(inGame=false,result=false){
    const hub=C.hub();
    const moves=inGame?game.official+game.actions:0;
    const controls=inGame?
      '<span class="save-chip'+(C.healthy()?"":" negative")+'"><span class="dot"></span>'+ (C.healthy()?"Autosaved":"Save unavailable")+'</span>'+
      (!result?'<span class="turn-chip">'+icon("calendar")+esc(G.dateLabel(game.turn))+'</span>'+btn("Next month","advance",{style:moves?"ghost":"primary",arrow:true}):"")+
      btn("Settings","settings",{style:"ghost",icon:"settings"}):
      (hub?'<a class="btn ghost" href="'+attr(hub)+'">'+icon("back")+' Back to SG</a>':"")+btn("Settings","settings",{style:"ghost",icon:"settings"});
    return '<div class="topbar"><div class="top-inner '+(inGame?"ingame":"")+'"><button class="brand" data-action="menu" aria-label="President Simulator main menu"><img class="mark" src="assets/game-mark.svg" alt=""><span><strong>President Simulator</strong><small>SG Game Hub</small></span></button><div class="top-actions">'+controls+'</div></div></div>';
  }
  function shortcut(label,description,action,id,{value,disabled=false}={}){
    return '<button class="panel menu-card" type="button" data-action="'+attr(action)+'"'+(value!==undefined?' data-value="'+attr(value)+'"':"")+(disabled?' disabled':"")+'>'+
      '<span class="tile-icon">'+icon(id)+'</span><span><strong>'+esc(label)+'</strong><small>'+esc(description)+'</small></span><span class="arrow">'+icon("arrow")+'</span></button>';
  }
  function menu(){
    const save=C.load();
    return topbar()+'<main class="menu-page"><section class="hero"><div class="hero-content">'+
      '<div class="hero-sub">Road to the White House</div><h1>President<br>Simulator</h1><p class="hero-desc">Win over voters, run the country, and see where your choices take you. The game guides you one month at a time.</p>'+
      '<div class="button-row">'+(save?btn("Continue career","continue",{style:"primary large",icon:"play",arrow:true})+btn("New career","new",{style:"large ghost",icon:"plus"}):btn("Start a career","new",{style:"primary large",icon:"play",arrow:true}))+'</div>'+
      (save?'<p class="hero-save">'+esc(G.name(save))+' · '+esc(G.dateLabel(save.turn))+'</p>':"")+'</div>'+
      '<img class="hero-illustration" src="assets/white-house-day.jpg" alt="The White House on a sunny spring day"></section>'+
      '<nav class="menu-options" aria-label="Main menu">'+shortcut("How to play","Get the basics in a minute","help","book")+
      shortcut("Saved careers","Pick up a different game","library","history")+'</nav></main>';
  }
  function setup(){
    const setting=C.read().settings.difficulty;
    return topbar()+'<main class="setup-page">'+head("New career","Meet your candidate","Give your candidate a name and decide what they’ll campaign for.",btn("Main menu","menu",{style:"ghost",icon:"back"}))+
      '<form id="candidate-form" class="setup-form"><div class="panel flow">'+section("Who are you playing?")+
      '<div class="form-row">'+field("First name",'<input name="first" maxlength="24" placeholder="Alex" required>')+field("Last name",'<input name="last" maxlength="24" placeholder="Morgan" required>')+'</div>'+
      '<div class="form-row three">'+field("Age",'<input type="number" name="age" value="48" min="35" max="99" required>')+
      field("Home state",'<select name="home">'+stateOptions("PA",false)+'</select>')+
      field("Political party",'<select name="party">'+options(Object.entries(D.parties),"D")+'</select>')+'</div>'+
      '<div><div class="form-field">Candidate avatar</div><div class="choice-list" style="margin-top:7px">'+[0,1,2,3].map((id)=>'<label class="choice avatar-opt"><input type="radio" name="avatar" aria-label="Avatar '+(id+1)+'" value="'+id+'" '+(id===0?"checked":"")+'>'+portrait(id)+'</label>').join("")+'</div></div>'+
      '<label class="checkline"><input name="eligible" type="checkbox" required><span>My fictional candidate is a natural-born U.S. citizen and has lived in the United States for at least 14 years.</span></label></div>'+
      '<div class="panel flow tight"><h2>What do you care about?</h2><p class="body-copy">We’ve picked three starting topics. Swap any of them to shape your campaign.</p>'+
      issueChoices(["Economy","Healthcare","Education"], "priority")+'</div>'+
      '<div class="panel flow tight"><div class="form-row">'+field("Difficulty",'<select name="difficulty">'+difficultyOptions(setting)+'</select>')+'</div>'+
      '<p id="difficulty-hint" class="body-copy">'+difficultyHint(setting)+'</p><p id="form-message" class="negative" role="alert">'+esc(formMessage)+'</p>'+
      '<div class="button-row"><button class="btn primary large" type="submit">Launch campaign '+icon("arrow")+'</button></div></div></form></main>';
  }
  const difficultyOptions=(level)=>options([["Easy","Easy · Recommended"],["Normal","Normal"],["Hard","Hard"]],level);
  const difficultyHint=level=>({Easy:"More money to start, more moves each month, and easier votes in Congress.",Normal:"A smaller starting budget and tougher opponents.",Hard:"The tightest budget, stronger opponents, and tougher votes in Congress."})[level];
  function issueChoices(selected,name){
    return '<div class="choice-list">'+D.issues.map((issue)=>'<label class="choice"><input type="checkbox" name="'+name+'" value="'+attr(issue)+'"'+(selected.includes(issue)?" checked":"")+'>'+esc(issue)+'</label>').join("")+'</div>';
  }
  function library(){
    const saves=Object.values(C.read().careers).filter(g=>C.load(g.id)).reverse();
    return topbar()+'<main class="setup-page">'+head("SG Game Hub","Career history","Open a saved career or review a finished presidency.",btn("Main menu","menu",{style:"ghost",icon:"back"}))+
      '<div class="flow">'+(saves.length?saves.map(g=>panel('<div class="spread"><div class="briefing">'+portrait(g.person.avatar)+'<div><h3>'+esc(G.name(g))+'</h3><p class="muted small">'+esc(D.parties[g.person.party])+' · '+esc(G.dateLabel(g.turn))+' · '+esc(g.office)+'</p></div></div>'+
      '<div class="button-row">'+btn(g.office==="Completed"?"View legacy":"Load Career","load",{value:g.id,style:"primary"})+btn("Delete","confirm-delete",{value:g.id,style:"danger ghost"})+'</div></div>')).join(""):panel('<p class="muted">Your saved careers will appear here after you create a candidate.</p>'))+
      '<div class="button-row">'+btn("Import backup","import",{icon:"history"})+btn("New Career","new",{icon:"plus"})+'</div></div></main>';
  }
  function nav(){
    const main=[["overview","This month","grid"],...(gov()?[["events","Decisions","pulse"],["laws","Laws & bills","scroll"],["economy","Economy","graph"]]:[["map","Campaign map","map"],["speeches","Speeches","mic"]]),["elections","Elections","ballot"]];
    const more=[...(gov()?[["congress","Congress","bank"],["opinion","Public opinion","people"],["speeches","Speeches","mic"],["military","Military","shield"],["foreign","Foreign relations","globe"],["map","Campaign map","map"]]:[]),["history","Career history","history"]];
    const links=rows=>rows.map(([key,title,id])=>'<button class="nav-btn '+(page===key?"active":"")+'" data-action="page" data-value="'+key+'"'+(page===key?' aria-current="page"':"")+'>'+
      icon(id)+title+(key==="events"&&game.gov.events.length?'<span class="nav-count">'+game.gov.events.length+'</span>':"")+'</button>').join("");
    return '<aside class="sidebar"><nav class="sidebar-inner" aria-label="Career navigation"><div class="identity">'+portrait(game.person.avatar)+
      '<div><strong title="'+attr(G.name(game))+'">'+esc(G.name(game))+'</strong><small>'+esc(D.parties[game.person.party])+' · '+esc(game.office)+'</small></div></div>'+
      '<div class="nav-group">'+links(main)+'</div><details class="nav-more"'+(more.some(([id])=>id===page)?" open":"")+'><summary>More tools</summary><div class="nav-group">'+links(more)+'</div></details>'+
      '<div class="nav-help">'+links([["guide","How to play","book"]])+'</div></nav></aside>';
  }
  function campaignMetrics(){
    const cycle=G.nextElection(game);
    const stage=game.campaign.stage;
    const ballotDate=stage==="primary"?["Party decision","June "+game.campaign.year,"Win more than half the delegates"]:
      stage==="ballot"?["Signatures due","July "+game.campaign.year,"Visit states to collect signatures"]:["Election Day","Nov "+cycle,"See upcoming votes in Elections"];
    return metrics([
      metric("Moves left",count(game.actions),"Refill when you start the next month","target"),
      metric("Campaign money",money(game.funds),"Pays for visits, rallies, and ads","funds"),
      metric(...ballotDate,"calendar")
    ]);
  }
  function briefing(){
    const heading=gov()?"News from the White House":"Campaign news";
    if(!gov()&&game.turn===G.date(2028,0)&&game.campaign.news==="The race has begun.")return "";
    const text=gov()||!G.campaigning(game)?game.report:game.campaign.news==="The race has begun."?game.report:game.campaign.news;
    return panel('<div class="briefing"><span class="tile-icon">'+icon("brief")+'</span><div><h3>'+heading+'</h3><p class="body-copy small">'+esc(text)+'</p>'+
      (game.office==="Former President"&&text!==game.report?'<p class="body-copy small">'+esc(game.report)+'</p>':"")+'</div></div>');
  }
  function suggestedTopic(s){
    return s.issues.find(issue=>game.officePriorities.includes(issue))||s.issues[0];
  }
  function suggestedState(){
    const primary=game.campaign.stage==="primary";
    const called=new Set(game.campaign.contests.map(contest=>contest.id));
    const nextRound=Math.max(0,G.calendar(game.turn).month-1);
    const targets=D.states.map((s,index)=>{
      if(primary&&called.has(s.id))return null;
      if(game.campaign.qualified&&!game.campaign.qualified.includes(s.id))return null;
      const {player,...rivals}=G.support(game,s.id);
      const lead=player-Math.max(...Object.values(rivals));
      const local=game.states[s.id];
      const score=18-Math.abs(lead-2)*.7+s.ev*.18-local.activity*2.4+(primary&&index%5===nextRound?4:0);
      return {s,score};
    }).filter(Boolean).sort((a,b)=>b.score-a.score);
    return targets[0]?.s||D.byId[game.person.home];
  }
  function coachCard({label,description,action,options={},moveCost=""}){
    return '<section class="coach"><div class="coach-copy"><div class="coach-label">'+icon("flag")+' Your next move</div>'+
      '<h2>'+esc(label)+'</h2><p>'+esc(description)+'</p></div>'+
      '<div class="coach-action">'+btn(options.button||label,action,{...options,style:"primary large",arrow:true})+
      (moveCost?'<small>'+esc(moveCost)+'</small>':"")+'</div></section>';
  }
  function nextMonthCard(description){
    return coachCard({label:"On to next month",description,action:"advance",options:{button:"Next month"}});
  }
  function campaignCoach(){
    if(!game.actions)return nextMonthCard("You’ve used your moves for this month. Start the next month to get more.");
    if(game.funds<2&&game.campaign.fundraisers<2){
      return coachCard({label:"Raise money for your campaign",description:"Ask supporters to chip in so you can keep traveling and running ads.",action:"guided-campaign",
        options:{value:"funds:"+game.person.home,button:"Raise money"},moveCost:"1 move · free"});
    }
    if(G.debateAvailable(game)&&canDo(.1)){
      return coachCard({label:"Show voters where you stand",description:"A debate is on the calendar. Pick an answer to three questions and see how voters react.",
        action:"debate",options:{button:"Enter debate"},moveCost:"1 move · $100k"});
    }
    const fresh=game.stats.campaigns===1&&game.turn===G.date(2028,0)&&!game.states[game.person.home].activity;
    const ballot=game.campaign.stage==="ballot";
    const s=fresh?D.byId[game.person.home]:suggestedState();
    const key=fresh||ballot||!canDo(D.actions.rally[1])?"visit":"rally";
    if(!canDo(D.actions[key][1]))return nextMonthCard("Your campaign can save its money and try again next month.");
    return coachCard({label:(key==="visit"?"Visit ":"Hold a rally in ")+s.name,
      description:ballot?"Meet voters and collect signatures so your name can appear on the ballot.":fresh?
        "Start in your home state and talk about an issue that matters there. Your team suggests "+suggestedTopic(s).toLowerCase()+".":
        "Build support by talking about "+suggestedTopic(s).toLowerCase()+", one of the topics voters care about here.",
      action:"guided-campaign",options:{value:key+":"+s.id,button:key==="visit"?"Visit state":"Hold rally"},
      moveCost:"1 move · $"+Math.round(D.actions[key][1]*1000)+"k"});
  }
  function presidentCoach(){
    if(!game.official){
      if(G.campaigning(game)&&game.actions)return coachCard({label:"Work on your reelection campaign",
        description:"You’ve used your White House moves for the month. There’s still time to meet voters.",action:"page",options:{value:"map",button:"Open campaign map"}});
      return nextMonthCard("You’ve used your White House moves. Next month brings a fresh set of moves and may bring new decisions.");
    }
    const pending=game.gov.events[0];
    if(pending){
      const event=W.eventList.find(e=>e.id===pending.id);
      return coachCard({label:event.title,description:event.detail,action:"page",options:{value:"events",button:"See my choices"}});
    }
    const bills=game.gov.bills;
    const ready=bills.find(b=>b.status==="Ready to sign");
    if(ready)return coachCard({label:"Sign a bill into law",description:ready.title+" passed the House and Senate. You can sign it or review it in Laws & bills.",
      action:"legislate",options:{value:ready.id+":sign",button:"Sign bill"},moveCost:"1 move"});
    const bill=bills.find(b=>["House vote","Senate vote","Amended"].includes(b.status));
    if(bill){
      const negotiate=bill.support< (bill.scope==="Ambitious"?14:7);
      const senate=bill.status==="Senate vote";
      return coachCard({label:negotiate?"Build support for your bill":senate?"Send your bill to a Senate vote":"Send your bill to a House vote",
        description:negotiate?"Talk with lawmakers to give "+bill.title+" a better chance of passing.":bill.title+" needs a yes vote from the "+(senate?"Senate.":"House."),
        action:"legislate",options:{value:bill.id+":"+(negotiate?"negotiate":"vote"),button:negotiate?"Talk to lawmakers":"Hold the vote"},moveCost:"1 move"});
    }
    if(!game.stats.signed&&game.monthsInOffice<12&&!bills.some(b=>b.status==="Vetoed")){
      return coachCard({label:"Write your first bill",description:"Pick an issue you care about. A focused bill is easier for the House and Senate to agree on.",
        action:"propose",options:{button:"Pick a bill"}});
    }
    if(G.campaigning(game)&&game.actions)return coachCard({label:"Get back on the campaign trail",description:"Your reelection campaign is open. Check which states could use a visit.",
      action:"page",options:{value:"map",button:"Open campaign map"}});
    return nextMonthCard("There’s nothing urgent on your desk. You can make another move or see what next month brings.");
  }
  function campaignGoal(){
    const c=game.campaign;
    if(c.stage==="primary")return "First, win your party’s race. That earns you a spot on the November ballot.";
    if(c.stage==="ballot")return "Collect signatures by the end of July to get your name on enough ballots.";
    if(c.stage==="general")return "Win states that add up to 270 electoral votes in November.";
    return "Keep meeting voters and fundraising before the next campaign opens in "+G.nextElection(game)+".";
  }
  function electionPalette(result,id){
    const ticket=result.tickets.find(t=>t.id===id);
    return ticket?color[ticket.party]:color.none;
  }
  const coastal={VT:[854,113],NH:[898,110],MA:[955,154],RI:[957,179],CT:[954,205],NJ:[926,230],DE:[917,255],MD:[901,279],DC:[876,303]};
  function currentMapPrimary(){return mapMode!=="general"&&game.campaign.stage==="primary";}
  function mapValues(s){
    if(currentMapPrimary()){
      const values=G.support(game,s.id);
      const close=Math.abs(values.player-values.P)<3;
      return {fill:close?raceColors.close:values.player>50?raceColors.leading:raceColors.rival,label:fmt(values.player,0)+"% primary support"};
    }
    const values=G.generalShares(game,s);
    if(game.person.party==="I"&&game.campaign.qualified&&!game.campaign.qualified.includes(s.id)&&G.campaigning(game))delete values.player;
    const ordered=Object.entries(values).sort((a,b)=>b[1]-a[1]);
    const first=ordered[0],second=ordered[1];
    const leaning=color[first[0]==="player"?game.person.party:first[0]];
    return {fill:first[1]-second[1]<3?raceColors.close:leaning,label:"Projected leader "+ticketName(first[0])};
  }
  function ticketName(id){
    if(id==="player")return G.name(game);
    if(id==="P")return game.campaign.primary.name;
    return game.campaign.rivals.find(r=>r.id===id)?.name||id;
  }
  function mapSVG(result=null,called=0){
    const selection=result?resultState:state;
    const visible=result?Object.fromEntries(result.rows.slice(0,called).map(row=>[row.id,row])):null;
    const states=D.states.map(s=>{
      const mv=visible?{fill:visible[s.id]?electionPalette(result,visible[s.id].winner):color.none,label:visible[s.id]?"Called for "+result.tickets.find(t=>t.id===visible[s.id].winner).name:"Awaiting results"}:mapValues(s);
      return {...s,...mv,...window.StateShapes[s.id]};
    });
    const action=result?"result-state":"state";
    const interaction=(s)=>' role="button" tabindex="0" aria-label="'+attr(s.name+", "+s.ev+" electoral votes, "+s.label)+'" data-action="'+action+'" data-value="'+s.id+'"';
    return '<svg class="map-area" viewBox="0 0 975 610" aria-label="Interactive United States election map">'+
      '<g>'+states.map(s=>'<path class="state-shape '+(selection===s.id?"selected":"")+'" data-abbr="'+s.id+'" d="'+s.path+'" fill="'+s.fill+'"'+(coastal[s.id]?' data-action="'+action+'" data-value="'+s.id+'"':interaction(s))+'><title>'+esc(s.name)+'</title></path>').join("")+'</g>'+
      '<g>'+states.filter(s=>!coastal[s.id]).map(s=>'<text class="map-abbr" x="'+s.center[0]+'" y="'+s.center[1]+'">'+s.id+'</text>').join("")+'</g>'+
      '<g>'+states.filter(s=>coastal[s.id]).map(s=>{
        const [x,y]=coastal[s.id];
        return '<g class="state-target '+(selection===s.id?"selected":"")+'"'+interaction(s)+'><line x1="'+s.center[0]+'" y1="'+s.center[1]+'" x2="'+x+'" y2="'+y+'"/><circle cx="'+x+'" cy="'+y+'" r="10.5" fill="'+s.fill+'" stroke="#9bb4d8"/><text x="'+x+'" y="'+y+'" class="map-abbr" style="font-size:10px;stroke-width:1.5">'+s.id+'</text></g>';
      }).join("")+'</g></svg>';
  }
  function legend(items){
    return '<div class="map-legend">'+items.map(([value,name])=>'<span class="legend-item"><span class="dot" style="color:'+value+'"></span>'+esc(name)+'</span>').join("")+'</div>';
  }
  function campaignMap(){
    const primary=currentMapPrimary();
    const name=primary?"Your party’s race":"Race for president";
    const controls=game.campaign.stage==="primary"?'<div class="button-row">'+btn("Party race","map-mode",{value:"auto",style:"tiny "+(primary?"primary":"ghost")})+btn("Presidential race","map-mode",{value:"general",style:"tiny "+(!primary?"primary":"ghost")})+'</div>':"";
    const labels=primary?[[raceColors.leading,"You lead"],[raceColors.rival,"Rival leads"],[raceColors.close,"Close race"]]:[[color.D,"Democratic lead"],[color.R,"Republican lead"],...(game.person.party==="I"?[[color.I,"Independent lead"]]:[]),[raceColors.close,"Close race"]];
    return '<div class="board"><section class="panel map-wrap"><div class="map-head spread"><div><h2 class="map-title">'+name+' '+info(primary?"Presidential primaries":"Electoral College")+'</h2>'+
      '<div class="map-meta">Pick a state to see who’s ahead and campaign there.</div></div>'+controls+'</div>'+mapSVG()+legend(labels)+'</section>'+statePanel()+'</div>';
  }
  function pollingRows(entries){
    return '<div class="support-lines">'+entries.map(([label,value,style])=>'<div>'+row(esc(label),pct(value))+
      meter(value,style)+'</div>').join("")+'</div>';
  }
  function statePanel(){
    const s=D.byId[state];
    const activity=game.states[state];
    const primary=currentMapPrimary();
    const shares=primary?G.support(game,state):G.generalShares(game,s);
    const called=primary?game.campaign.contests.find(c=>c.id===state):null;
    const undecided=called?0:Math.max(2.4,7.3-G.calendar(game.turn).month*.34-activity.activity*.17);
    const options=Object.entries(shares).map(([id,v])=>[id==="player"?"Your support":ticketName(id),v*(100-undecided)/100,
      (id==="player"?game.person.party:id)==="R"?"red":id==="P"?"gold":""]);
    if(undecided)options.push(["Undecided",undecided,"gold"]);
    const district=D.districts[state];
    const onBallot=game.person.party==="I"&&game.campaign.qualified&&G.campaigning(game)?game.campaign.qualified.includes(state)?"Qualified for the ballot.":"Petitions fell short here.":null;
    const labels={visit:"Visit",rally:"Rally",ads:"Run ads",speech:"Give a speech"};
    const actions=canCampaign()?'<div class="state-buttons">'+["visit","rally","ads","speech"].map(key=>{
      const data=D.actions[key];
      return btn(labels[key]+(data?" · $"+Math.round(data[1]*1000)+"k":""),key==="speech"?"state-speech":"local-action",{value:key,disabled:key==="speech"?(gov()?!canGovern():!canDo(.15)):!canDo(data[1]),title:data?"Uses 1 move":"Open the speech planner"});
    }).join("")+'</div>':"";
    return '<aside class="panel state-panel"><label class="form-field"><span>Choose a state</span><select id="state-select" class="state-select">'+stateOptions(state)+'</select></label>'+
      '<div class="spread"><h2 class="state-title">'+esc(s.name)+'</h2>'+pill(s.ev+" electoral votes","live")+'</div>'+pollingRows(options)+
      (called?'<p class="small muted">'+called.delegates+' of '+called.total+' primary delegates won.</p>':"")+
      (district?'<p class="small muted">2 statewide EV + '+district.length+' district EV.</p>':"")+
      (onBallot?'<p class="small muted">'+onBallot+'</p>':"")+
      '<div><div class="small muted">What voters care about</div><div class="state-issues" style="margin-top:6px">'+s.issues.map(i=>pill(i)).join("")+'</div></div>'+
      (actions?'<p class="small muted">Each button uses one move. Your team will talk about <span data-local-topic>'+esc((pendingLabel||suggestedTopic(s)).toLowerCase())+'</span>.</p>':"")+actions+'</aside>';
  }
  function campaignActions(){
    if(!canCampaign())return panel('<p class="muted">'+(game.elected>=2?"You have reached the two-election limit. You can still govern and speak as president.":"Your next eligible presidential campaign opens in "+G.nextElection(game)+". You can still govern or speak as president.")+'</p>');
    const keys=["funds","policy","respond",...(!G.campaigning(game)?["interview","endorse"]:[])];
    return '<details class="panel pad campaign-tools"><summary>More campaign moves</summary>'+
      '<div class="flow tight"><p class="small muted">Name recognition '+pct(game.recognition,0)+' · Public trust '+pct(game.trust,0)+' · Reputation '+pct(game.reputation,0)+'</p>'+
      field("Topic in "+D.byId[state].name,'<select id="campaign-topic">'+options(D.issues,pendingLabel||suggestedTopic(D.byId[state]))+'</select>')+
      '<div class="actions-grid">'+keys.map(key=>{
        const [label,cost,,description]=D.actions[key];
        return '<article class="action-card"><h3>'+label+'</h3><p>'+description+'</p><span class="small muted">'+(cost?money(cost)+" · ":"")+'1 move</span>'+
          btn(label,"campaign-action",{value:key,style:"tiny",disabled:!canDo(cost)||(key==="funds"&&game.campaign.fundraisers>=2)})+'</article>';
      }).join("")+'</div></div></details>';
  }
  function recentDecision(){
    return lastDecision?'<p class="move-result" role="status">'+icon("message")+' <span>'+esc(lastDecision)+'</span></p>':"";
  }
  function campaignOverview(){
    const stage=game.campaign.stage;
    const active=G.campaigning(game);
    const phase=stage==="primary"?"Party race":stage==="ballot"?"Collecting signatures":stage==="general"?"Presidential race":"Between elections";
    const title=page==="map"?"Campaign map":active?"On the campaign trail":game.office==="Former President"?"Plan your comeback":"Build your next campaign";
    if(page!=="map")return head(G.dateLabel(game.turn)+" · "+phase,title,campaignGoal())+
      '<div class="flow">'+campaignCoach()+recentDecision()+campaignMetrics()+'<div class="quick-links">'+
      shortcut("Explore the map","Pick a state and see what voters care about.","page","map",{value:"map"})+
      shortcut("Raise money","Ask supporters in your home state to chip in.","guided-campaign","funds",{value:"funds:"+game.person.home,disabled:!canDo()||game.campaign.fundraisers>=2})+
      shortcut("Give a speech","Choose what to say and who hears it.","page","mic",{value:"speeches"})+
      '</div>'+briefing()+'</div>';
    return head(G.dateLabel(game.turn)+" · "+phase,title,"Choose a state or start with a close race in gold.",canCampaign()?pill(game.actions+" moves left","live"):"")+
      '<div class="flow">'+recentDecision()+campaignMap()+
      (active&&game.campaign.currentEvent?'<div class="banner">'+icon("message")+' <span>'+esc(game.campaign.currentEvent.headline)+'</span>'+
      btn("Respond · $80k","respond-news",{style:"tiny primary",disabled:!canDo(.08)})+'</div>':"")+
      (stage==="ballot"?panel('<div class="spread"><h3>Signature drive '+info("Ballot access")+'</h3><strong>'+pct(game.campaign.petition,0)+'</strong></div><div style="margin-top:10px">'+meter(game.campaign.petition)+'</div>'):"")+
      campaignActions()+'</div>';
  }
  function chart(values,{min=0,max=100,unit="%",label}){
    if(!values.length)return '<p class="body-copy">Monthly readings will appear after your first month in office.</p>';
    const items=values.slice(-50);
    const width=650,height=175,x0=42,x1=625,y0=15,y1=145;
    const x=(i)=>items.length===1?(x0+x1)/2:x0+i*(x1-x0)/(items.length-1);
    const y=(val)=>y1-(G.clamp(val,min,max)-min)/(max-min)*(y1-y0);
    const path=items.map((d,i)=>(i===0?"M":"L")+fmt(x(i),2)+","+fmt(y(d.value),2)).join(" ");
    const ticks=[0,1,2,3,4].map(i=>min+(max-min)*i/4);
    const latest=items.at(-1);
    return '<svg class="chart" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="'+attr(label+" history, latest "+fmt(latest.value)+unit)+'">'+
      ticks.map(v=>'<line class="grid-line" x1="'+x0+'" x2="'+x1+'" y1="'+y(v)+'" y2="'+y(v)+'"/><text x="4" y="'+(y(v)+4)+'">'+fmt(v,Number.isInteger(v)?0:1)+unit+'</text>').join("")+
      '<path class="series" d="'+path+'"/>'+items.map((d,i)=>'<circle cx="'+x(i)+'" cy="'+y(d.value)+'" r="'+(i===items.length-1?4:2)+'" fill="#a4c7ff"><title>'+esc(G.dateLabel(d.turn))+' · '+fmt(d.value)+unit+'</title></circle>').join("")+
      '<text x="'+x0+'" y="165">'+esc(G.dateLabel(items[0].turn))+'</text><text x="'+x1+'" y="165" text-anchor="end">'+esc(G.dateLabel(items.at(-1).turn))+'</text></svg>';
  }
  function whiteHouse(){
    const v=game.gov,term=game.terms.at(-1);
    const termMonths=game.turn-G.date(term.from,0);
    return head(G.dateLabel(game.turn)+" · The White House","President "+G.name(game),"Term "+game.terms.length+" of 2 · "+termMonths+" of 48 months served")+
      '<div class="flow">'+presidentCoach()+recentDecision()+metrics([
        metric("Moves left",count(game.official),"Refill when you start the next month","target"),
        metric("Public approval",pct(v.approval,0),"Americans who approve of your work","people"),
        metric("Economic growth",pct(v.growth),v.growth>=0?"The economy is growing":"The economy is shrinking","graph")
      ])+
      '<div class="quick-links">'+shortcut("Make a decision",v.events.length?v.events.length+" waiting on your desk.":"See what’s happening around the country.","page","pulse",{value:"events"})+
      shortcut("Work on laws","Propose, vote on, and sign bills.","page","scroll",{value:"laws"})+
      shortcut("Check the economy","See jobs, prices, and the budget.","page","graph",{value:"economy"})+'</div>'+briefing()+
      (G.campaigning(game)?'<div class="banner">'+icon("ballot")+' <span>Your reelection campaign has '+game.actions+' moves left.</span>'+btn("Open campaign","page",{value:"map",style:"tiny primary"})+'</div>':"")+'</div>';
  }
  function economy(){
    const v=game.gov;
    const balance=v.revenue-v.spending;
    return head("Domestic policy","Economy","Budget, employment, and growth respond to legislation and national events.")+
      '<div class="flow">'+metrics([metric("GDP Growth",pct(v.growth),"Annual rate","graph"),metric("Inflation",pct(v.inflation),"Annual rate","pulse"),
        metric("Unemployment",pct(v.unemployment),"Labor force share","people"),metric("Economic Confidence",pct(v.confidence,0),"Household and business sentiment","target")])+
      '<div class="grid cols-main">'+panel(section("Economic growth")+chart(v.record.map(r=>({turn:r.turn,value:r.growth})),{min:-2,max:6,label:"Economic growth"}))+
      panel(section("Federal budget "+info("Federal budget"))+'<div class="flow tight">'+row("Revenue",money(v.revenue,"T"))+row("Spending",money(v.spending,"T"))+
      row(balance<0?"Annual deficit":"Annual surplus",money(Math.abs(balance),"T"))+row("Debt "+info("National debt"),money(v.debt,"T"))+'</div>')+'</div>'+
      panel(section("Fiscal agenda","Tax and spending proposals must pass both chambers of Congress.")+
      '<div class="button-row">'+["Taxes","Infrastructure","Education","Healthcare","National Security","Housing","Economic Policy","Government Spending"].map(key=>btn(key,"propose",{value:key,style:"tiny",disabled:!canGovern()})).join("")+'</div>')+
      panel('<p class="body-copy">Inflation also shapes the independent Federal Reserve response. '+info("Federal Reserve")+'</p>')+'</div>';
  }
  function chamber(title,seats,total,layout,tiebreak){
    const p=W.control(seats,tiebreak);
    const dots=Object.entries(seats).map(([party,n])=>'<span class="'+party+'"></span>'.repeat(n)).join("");
    const counts=Object.entries(seats).map(([party,n])=>'<span class="legend-item"><span class="dot" style="color:'+color[party]+'"></span>'+n+' '+esc(D.parties[party])+'</span>').join("");
    return panel('<div class="spread"><h2>'+title+' '+info(title)+'</h2>'+pill(total+" seats")+'</div>'+
      '<div class="seats" style="grid-template-columns:repeat('+layout+',1fr)" aria-hidden="true">'+dots+'</div>'+
      '<div class="button-row small muted">'+counts+'</div><div class="divider" style="margin-top:12px">'+row("Control",p?esc(D.parties[p]):"Split")+'</div>');
  }
  function congress(){
    const v=game.gov;
    const senate=W.senateTotals(game.congress.senate);
    const next=G.nextCongress(game);
    const cls=W.classIndex(next);
    const offices=[...Object.keys(v.officials),...(v.courts.includes(null)?["Supreme Court"]:[])];
    return head("Legislative branch","Congress","The two chambers vote independently. Negotiate before bringing close bills to a vote.")+
      '<div class="flow"><div class="grid cols-2">'+chamber("House of Representatives",game.congress.house,435,43)+chamber("Senate",senate,100,25,game.viceParty||game.person.party)+'</div>'+
      panel('<div class="spread"><div><h2>Next congressional election '+info("Midterm elections")+'</h2><p class="body-copy small">'+next+' · All 435 House seats and '+[33,33,34][cls]+' Class '+["I","II","III"][cls]+' Senate seats</p></div>'+btn("Support candidates","midterm-speech",{disabled:!canGovern(),icon:"mic"})+'</div>')+
      '<div class="grid cols-2">'+panel(section("Supreme Court "+info("Supreme Court"))+'<div class="simple-list">'+v.courts.map((justice,i)=>row("Seat "+(i+1),justice?"Justice "+esc(justice):'<span class="gold">Vacancy</span>')).join("")+'</div>')+
      panel(section("Appointments","The Senate votes to confirm officials and Supreme Court nominees.")+
      '<div class="simple-list">'+Object.entries(v.officials).map(([key,value])=>row(esc(key),esc(value||"Awaiting appointment"))).join("")+'</div>'+
      '<div class="button-row divider" style="margin-top:12px">'+offices.map(role=>btn("Nominate · "+role,"nominate",{value:role,style:"tiny",disabled:!canGovern()})).join("")+'</div>')+'</div>'+
      panel(section("Judicial review "+info("Checks and balances"))+(v.cases.length?'<div class="simple-list">'+v.cases.slice().reverse().map(c=>{
        const item=(c.type==="order"?v.orders:v.bills).find(x=>x.id===c.id);
        return row(esc(item?.title||"Retired case"),esc(c.result||"Under review"));
      }).join("")+'</div>':'<p class="body-copy">Challenges to federal laws and executive orders will appear here.</p>'))+'</div>';
  }
  const legControls={
    "House vote":[["Negotiate","negotiate"],["Support","support"],["Oppose","oppose"],["Hold House vote","vote"]],
    "Senate vote":[["Negotiate","negotiate"],["Support","support"],["Oppose","oppose"],["Hold Senate vote","vote"]],
    Amended:[["Negotiate","negotiate"],["Support","support"],["Oppose","oppose"],["Vote on amended text","vote"]],
    "Ready to sign":[["Sign bill","sign"],["Veto","veto"]],Vetoed:[["Hold override vote","override"]]
  };
  function laws(){
    const list=game.gov.bills;
    return head("The White House","Laws & bills","A bill is an idea for a law. The House and Senate both need to agree before you can sign it.",btn("Propose a bill","propose",{style:"primary",icon:"plus",disabled:!canGovern()}))+
      '<div class="flow">'+panel('<ol class="law-steps"><li>Propose a bill</li><li>House votes</li><li>Senate votes</li><li>Sign into law</li></ol>')+
      panel(section("Your bills "+info("Congress")+" "+info("Presidential veto"))+
      (list.length?'<div class="simple-list">'+list.map(b=>'<article><div class="spread"><h3>'+esc(b.title)+'</h3>'+pill(b.status,["Signed","Override enacted"].includes(b.status)?"done":b.status==="Ready to sign"?"live":"")+'</div>'+
      '<p class="body-copy small">'+esc(b.scope)+' · '+esc(D.policies[b.category][6])+(b.amended?" · Amended funding package":"")+'</p>'+
      (b.votes.length?'<p class="small muted">'+b.votes.map(esc).join("<br>")+'</p>':"")+
      ((legControls[b.status]||[]).length?'<div class="button-row" style="margin-top:8px">'+legControls[b.status].map(([label,act])=>
        btn(label,"legislate",{value:b.id+":"+act,style:"tiny "+(["vote","sign"].includes(act)?"primary":""),disabled:!canGovern()||(act==="negotiate"&&b.support>=18)})).join("")+'</div>':"")+'</article>').join("")+'</div>':
      '<p class="body-copy">Pick an issue and start your first bill. You can talk to lawmakers before they vote.</p>'))+
      panel(section("Executive orders "+info("Executive orders"),"Orders carry out existing law. Judicial review can overturn orders that exceed statutory authority.")+
      '<div class="actions-grid">'+Object.entries(W.orders).map(([title,o])=>'<article class="action-card"><h3>'+esc(title)+'</h3><p>'+esc(o.detail)+'</p>'+btn("Issue order","order",{value:title,style:"tiny",disabled:!canGovern()||game.gov.orders.some(x=>x.title===title&&x.active)})+'</article>').join("")+'</div>'+
      (game.gov.orders.length?'<div class="simple-list divider" style="margin-top:13px">'+game.gov.orders.map(o=>row(esc(o.title),o.active?"In effect":"Ended")).join("")+'</div>':""))+
      panel('<div class="spread"><div><h2>Administration priorities</h2><p class="body-copy small">'+esc(game.officePriorities.join(" · "))+'</p></div>'+btn("Update priorities","priorities",{disabled:!canGovern()})+'</div>')+'</div>';
  }
  function opinion(){
    const v=game.gov,s=D.byId[state];
    const regional=G.clamp(v.approval+v.regional[state]+s.lean*(game.person.party==="D"?.28:game.person.party==="R"?-.28:0),0,100);
    return head("Domestic policy","Public opinion","Review who supports the administration and where you can rebuild trust.")+
      '<div class="flow">'+metrics([metric("National Approval",pct(v.approval),"Current job approval","people"),metric("Public Trust",pct(game.trust,0),"Confidence in your commitments","shield"),
        metric("Political Reputation",pct(game.reputation,0),"Campaign and career standing","flag"),metric("Approval in "+s.id,pct(regional),esc(s.name),"map")])+
      '<div class="grid cols-main">'+panel(section("Approval over time")+chart(v.approvalHistory,{min:25,max:85,label:"Presidential approval"})+
      '<p class="body-copy small">National stability '+pct(v.stability,0)+'</p>')+
      panel(section("State sentiment")+field("State",'<select id="state-select">'+stateOptions(state)+'</select>')+
      '<div class="flow tight" style="margin-top:12px">'+row(esc(s.name),pct(regional))+meter(regional)+'</div>')+'</div>'+
      '<div class="grid cols-2">'+panel(section("Voter groups")+pollingRows(Object.entries(v.groups).map(([label,value])=>[label,value,""])))+
      panel(section("Campaign promises")+(Object.keys(game.promises).length?'<div class="simple-list">'+Object.entries(game.promises).map(([topic,p])=>row(esc(topic),p.fulfilled?"Fulfilled":"Open")).join("")+'</div>':'<p class="body-copy">Specific pledges made in speeches or campaign announcements appear here.</p>'))+'</div></div>';
  }
  function events(){
    const v=game.gov;
    return head("The White House","Decisions","Read what happened, then choose how you want to respond.")+
      '<div class="flow">'+(v.events.length?v.events.map(entry=>{
        const e=W.eventList.find(x=>x.id===entry.id);
        return panel('<div class="spread"><h2>'+esc(e.title)+'</h2>'+pill(G.dateLabel(entry.turn),"live")+'</div><p class="body-copy" style="margin-top:8px">'+esc(e.detail)+'</p>'+
          '<div class="button-row" style="margin-top:12px">'+e.choices.map(([label],i)=>btn(label,"event",{value:e.id+":"+i,disabled:!canGovern()})).join("")+'</div>');
      }).join(""):panel('<p class="body-copy">There are no decisions waiting for you this month.</p>'))+
      panel(section("Response history")+(v.eventHistory.length?'<div class="simple-list">'+v.eventHistory.map(e=>'<article><h3>'+esc(e.title)+'</h3><p class="body-copy small">'+esc(G.dateLabel(e.turn))+' · '+esc(e.decision)+'</p><p class="muted small">'+esc(e.impact)+'</p></article>').join("")+'</div>':
        '<p class="body-copy">Resolved national events will appear here.</p>'))+'</div>';
  }
  const conflictLabels=["Normal operations","Diplomatic crisis","Limited operations","Authorized conflict","Ceasefire"];
  function straitMap(c){
    const route=c.level===3?"#ff8999":c.level===4?"#6cdec4":"#79aaff";
    return '<svg class="strait-map" viewBox="0 0 620 210" role="img" aria-label="Schematic of the fictional Meridian Strait and its shipping corridor">'+
      '<defs><pattern id="ocean-grid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" fill="none" stroke="#244361" stroke-opacity=".7"/></pattern></defs>'+
      '<rect width="620" height="210" fill="#10223a"/><rect width="620" height="210" fill="url(#ocean-grid)"/>'+
      '<path d="M0 0H318l-27 27-61 12-43 25-40 5-40 34-56 6L0 124Zm620 210H247l34-31 50-8 26-25 81-8 39-37 76-12 67-40Z" fill="#354a56" stroke="#6d8b95"/>'+
      '<path d="M0 155C105 153 147 119 231 109S402 94 496 48s113-32 124-40" fill="none" stroke="'+route+'" stroke-width="2" stroke-dasharray="8 8"/>'+
      '<circle cx="310" cy="103" r="23" fill="'+route+'" opacity=".16"/><circle cx="310" cy="103" r="7" fill="'+route+'" stroke="#edf4ff" stroke-width="1.5"/>'+
      '<text x="328" y="87">Meridian Strait</text><text x="344" y="181" class="coast-label">Southern coast</text><text x="48" y="46" class="coast-label">Northern coast</text></svg>';
  }
  function military(){
    const c=game.gov.conflict;
    return head("National security","Military","Manage readiness, congressional authority, and a fictional crisis in the "+c.name+".",info("Commander in Chief"))+
      '<div class="flow">'+metrics([metric("Readiness",pct(game.gov.readiness,0),"Defense budget "+money(game.gov.defense,"T"),"shield"),
        metric("Regional Tensions",pct(c.tension,0),conflictLabels[c.level],"pulse"),metric("Public Support",pct(c.opinion,0),"Support for military operations","people"),
        metric("Conflict Cost",money(c.cost,"T"),count(c.casualties)+" casualties · "+count(c.displaced)+" displaced","funds")])+
      panel('<div class="flow"><div class="spread"><div><h2>'+esc(c.name)+'</h2><p class="body-copy">'+esc(c.operation)+' · '+c.allies+' allied commitments</p></div>'+
      pill(c.authorized?"Congressional funding · "+c.funding+" mo.":"No active war funding",c.authorized?"live":"")+'</div>'+straitMap(c)+'</div>')+
      panel(section("Decisions","Major deployments require authorization and funding from both chambers.")+'<div class="actions-grid">'+Object.entries(W.military).map(([key,[title,description]])=>
      '<article class="action-card"><h3>'+esc(title)+'</h3><p>'+esc(description)+'</p>'+btn(title,"military",{value:key,style:"tiny",disabled:!canGovern()||!W.militaryAvailability(game,key)})+'</article>').join("")+'</div>')+
      panel(section("Conflict history")+(game.gov.conflictHistory.length?'<div class="simple-list">'+game.gov.conflictHistory.map(e=>row(esc(e.outcome)+" · "+esc(G.dateLabel(e.turn)),money(e.cost,"T")+" · "+count(e.casualties)+" casualties")).join("")+'</div>':'<p class="body-copy">Completed operations and settlements will appear here.</p>'))+'</div>';
  }
  function foreign(){
    const v=game.gov;
    return head("National security","Foreign relations","Build cooperation, negotiate deals, or apply economic pressure.")+
      '<div class="flow"><div class="grid cols-4">'+Object.entries(v.relations).map(([name,value])=>panel('<div class="flow tight"><div class="spread"><h3>'+esc(name)+'</h3><strong>'+fmt(value,0)+'</strong></div>'+
      meter(value,value<40?"red":value>70?"green":"")+btn("Diplomatic action","diplomacy",{value:name,style:"tiny",disabled:!canGovern()})+'</div>')).join("")+'</div>'+
      panel(section("Diplomatic record")+(v.agreements.length?'<div class="simple-list">'+v.agreements.map(e=>row(esc(e.country+" · "+e.type),esc(e.success?G.dateLabel(e.turn):"Talks paused"))).join("")+'</div>':
      '<p class="body-copy">Visits, talks, sanctions, and agreements will appear here.</p>'))+'</div>';
  }
  function speeches(initial="national"){
    return head(gov()?"The White House":"Public outreach","Speeches","Choose a message and audience. Public trust, local priorities, and repeated themes shape the response.")+
      '<div class="grid cols-main">'+panel(speechForm(initial))+
      panel(section("Recent speeches")+(game.stats.speeches?timeline(game.log.filter(x=>/^(Speech ·|Inaugural address)/.test(x.title)).slice(0,7)):'<p class="body-copy">Your addresses and audience responses will appear here.</p>'))+'</div>';
  }
  function speechForm(preselected){
    return '<form id="speech-form" class="flow"><div class="form-row">'+field("Audience",'<select name="location"><option value="national">National audience</option>'+stateOptions(preselected)+'</select>')+
      field("Topic",'<select name="topic">'+options([...D.issues,"Government Performance"],game.officePriorities[0])+'</select>')+'</div>'+
      field("Tone",'<select name="tone">'+options(G.tones,"Unifying")+'</select>')+
      '<div class="flow tight"><h3>Message</h3>'+G.messages.map((m,i)=>'<label class="choice"><input name="message" type="radio" value="'+i+'" '+(i===1?"checked":"")+'><span><strong>'+esc(m.title)+'</strong><br><span class="muted small">'+esc(m.text)+'</span></span></label>').join("")+'</div>'+
      '<div class="spread"><span class="muted small">'+(gov()?"1 presidential action":"$0.15M · 1 campaign action")+'</span><button type="submit" class="btn primary"'+((gov()?canGovern():canDo(.15))?"":" disabled")+'>'+icon("mic")+' Deliver speech</button></div></form>';
  }
  function timeline(entries){
    return '<div class="timeline">'+entries.map(e=>'<article><span class="small dim">'+esc(G.dateLabel(e.turn))+' · '+esc(e.category)+'</span><h3>'+esc(e.title)+'</h3><p>'+esc(e.detail)+'</p></article>').join("")+'</div>';
  }
  function statistics(){
    const s=game.stats,v=game.gov;
    const values=[
      ["Campaigns",s.campaigns],["General elections entered",s.wins+s.losses],["Elections won",s.wins],["Elections lost",s.losses],
      ["Nominations / ballot drives lost",s.primaryLosses],["States won",s.states],["Electoral votes earned",s.ev],["Speeches",s.speeches],
      ["Campaign funds raised",money(s.raised)],["Terms served",game.served],["Years in office",fmt(game.monthsInOffice/12,1)],
      ["Average approval",v.approvalHistory.length?pct(G.avg(v.approvalHistory.map(x=>x.value))):"—"],["Laws signed",s.signed],
      ["Laws vetoed",s.vetoes],["Executive orders",s.orders],["Crises encountered",s.conflicts],["Diplomatic agreements",s.agreements],["National events decided",s.events]];
    return '<div class="grid cols-3">'+values.map(([a,b])=>'<div class="action-card"><span class="muted">'+a+'</span><strong class="num">'+b+'</strong></div>').join("")+'</div>';
  }
  function history(){
    const types=["All",...new Set(game.log.map(x=>x.category))];
    return head("Career record","Career history","Review your decisions, election results, and milestones.")+
      '<div class="flow">'+panel(section("Career statistics")+statistics())+panel(section("Achievements")+
      '<div class="button-row">'+game.achievements.map(x=>pill(x,"done")).join("")+'</div>')+
      panel('<div class="spread section-head"><h2>Timeline</h2>'+field("Filter",'<select id="log-filter">'+options(types,logFilter)+'</select>')+'</div>'+
      timeline(game.log.filter(e=>logFilter==="All"||e.category===logFilter)))+'</div>';
  }
  function guide(standalone=false){
    const modules=[
      ["Start with one move","Open This month. The game suggests a move you can make right away. Each move uses part of your monthly allowance. Next Month gives you a fresh set."],
      ["Get on the ballot","As a Democrat or Republican, win more than half your party’s delegates in June. As an Independent, visit states to collect signatures by July."],
      ["Win November","Pick close races on the campaign map and talk about issues voters care about. Each state is worth electoral votes. Aim for 270."],
      ["Run the country","Make decisions and work on bills. Both the House and Senate have to approve a bill before you can sign it into law."],
      ["Keep going","You can try again after a loss. Your career ends after you finish two four-year terms as president."]
    ];
    const content='<div class="flow">'+panel('<div class="simple-list">'+modules.map(([title,desc])=>'<article><h3>'+title+'</h3><p class="body-copy">'+desc+'</p></article>').join("")+'</div>')+
      '<details class="panel pad campaign-tools"><summary>Look up a term</summary><div class="grid cols-2">'+Object.entries(D.civics).map(([topic,desc])=>'<details class="action-card"><summary>'+esc(topic)+'</summary><p class="body-copy small">'+esc(desc)+'</p></details>').join("")+'</div></details></div>';
    if(!standalone)return head("","How to play")+content;
    return topbar()+'<main class="setup-page">'+head("","How to play","From your first visit to your last day in office.",btn("Main menu","menu",{style:"ghost",icon:"back"}))+content+'</main>';
  }
  function elections(){
    const c=game.campaign;
    const primary=c.stage==="primary";
    const rivals=primary?[c.primary]:c.rivals.filter(r=>r.party!==game.person.party);
    const stageText={primary:"Primary campaign",ballot:"Ballot access",general:"General election",closed:"Election complete",eliminated:"Out of the race"};
    const contestTable='<div class="table-wrap"><table><thead><tr><th>State</th><th>Your share</th><th>Delegates won</th><th>Total</th></tr></thead><tbody>'+
      c.contests.map(t=>'<tr><td>'+esc(D.byId[t.id].name)+'</td><td>'+pct(t.share)+'</td><td>'+t.delegates+'</td><td>'+t.total+'</td></tr>').join("")+'</tbody></table></div>';
    return head("","Elections",campaignGoal(),pill(stageText[c.stage],"live"))+
      '<div class="flow"><div class="grid cols-2">'+panel(section(c.year+" presidential campaign "+info("Electoral College"))+
      '<div class="flow tight">'+row("Stage",esc(stageText[c.stage]))+row("Next presidential election",G.nextElection(game))+row("Next congressional election",G.nextCongress(game))+
      (c.primary?row("Your delegates",c.delegates+" of "+c.total+" awarded")+ (primary?'<p class="small muted">States award delegates, which are votes for your party’s candidate. Win more than half by the end of June.</p>':""):row("Signatures collected",pct(c.petition,0)))+
      (c.qualified?row("Jurisdictions qualified",c.qualified.length+"/51"):"")+'<p class="small muted">'+esc(c.message||"Your next milestone appears here after the opening contests.")+'</p>'+
      (G.debateAvailable(game)?btn("Enter debate","debate",{style:"tiny primary",icon:"mic",disabled:!canDo(.1)}):"")+
      (!G.campaigning(game)?btn("Support congressional candidates","midterm-speech",{style:"tiny",disabled:!(gov()?canGovern():canDo(.15))}):"")+'</div>')+
      panel(section("Who you’re up against")+'<div class="simple-list">'+rivals.map(r=>'<article><div class="spread"><h3>'+esc(r.name)+'</h3>'+pill(D.parties[r.party])+'</div>'+
      '<p class="body-copy small">'+esc(D.byId[r.home].name+" · "+r.strategy)+'</p><p class="body-copy small">'+esc(r.priorities.join(" · "))+'</p>'+
      '<p class="body-copy small">'+money(r.funds)+' funds · Reputation '+fmt(r.reputation,0)+' · Debate skill '+r.skill+'</p><p class="body-copy small">'+esc(r.news)+'</p></article>').join("")+'</div>')+'</div>'+
      (c.contests.length?panel(section("State primary results "+info("Presidential primaries"))+contestTable):"")+
      panel(section("Presidential election results")+(game.elections.length?'<div class="simple-list">'+game.elections.slice().reverse().map(e=>'<div class="spread"><span>'+e.year+' · '+esc(e.tickets.find(t=>t.id===e.winner).name)+'</span>'+
      btn("View results","view-election",{value:e.year,style:"tiny",arrow:true})+'</div>').join("")+'</div>':'<p class="body-copy">The first general election takes place in November 2028.</p>'))+
      panel(section("Congressional results "+info("Midterm elections"))+(game.congress.results.length?'<div class="simple-list">'+game.congress.results.slice().reverse().map(e=>'<div class="spread"><span>'+e.year+' · All 435 House seats and '+e.total+' Senate seats</span>'+
      btn("View results","view-midterm",{value:e.year,style:"tiny",arrow:true})+'</div>').join("")+'</div>':'<p class="body-copy">Results will appear after each November congressional election.</p>'))+'</div>';
  }
  function gamePage(){
    const content={overview:gov()?whiteHouse:campaignOverview,map:campaignOverview,economy,congress,laws,opinion,speeches,events,military,foreign,elections,history,guide};
    const available=gov()||!["economy","congress","laws","opinion","events","military","foreign"].includes(page);
    if(!available)page="overview";
    return topbar(true)+'<div class="game-shell">'+nav()+'<main class="game-main"><section>'+content[page]()+'</section></main></div>';
  }
  function contestRows(result,called){
    return result.rows.slice(0,called).sort((a,b)=>D.byId[a.id].name.localeCompare(D.byId[b.id].name)).map(r=>{
      const first=result.tickets.find(t=>t.id===r.winner);
      const tally=Object.entries(r.ev).map(([key,v])=>esc(result.tickets.find(t=>t.id===key).name.split(" ").at(-1))+" "+count(v)).join(" / ");
      return '<tr><td>'+esc(D.byId[r.id].name)+'</td><td>'+esc(first.name)+'</td><td>'+pct(r.shares[r.winner])+'</td><td>'+tally+'</td><td>'+count(r.turnout)+'</td></tr>';
    }).join("");
  }
  function electionState(result,called){
    const s=D.byId[resultState];
    const selected=result.rows.slice(0,called).find(r=>r.id===resultState);
    return '<div class="spread"><h2 class="state-title">'+esc(s.name)+'</h2>'+pill(s.ev+" EV","live")+'</div>'+
      (selected?pollingRows(Object.entries(selected.shares).map(([id,v])=>[result.tickets.find(t=>t.id===id).name,v,id==="R"?"red":id==="I"?"gold":""]))+
        '<div class="small muted">Statewide winner: '+esc(result.tickets.find(t=>t.id===selected.winner).name)+'</div>'+
        '<div class="small muted">'+count(selected.turnout)+' ballots counted</div>'+
        (selected.districts.length?'<div class="simple-list small">'+row("Statewide · 2 EV",esc(result.tickets.find(t=>t.id===selected.winner).name))+
          selected.districts.map(d=>row(d.label+" · 1 EV",esc(result.tickets.find(t=>t.id===d.winner).name))).join("")+'</div>':""):
        '<p class="body-copy">The state has yet to be called.</p>');
  }
  function runoffContent(result){
    const r=result.runoff;
    if(!r)return "";
    const names=id=>esc(result.tickets.find(t=>t.id===id).name);
    return panel(section("Contingent election "+info("Contingent election"),"The new House voted by state delegation. Each state cast a single vote and 26 were needed. The Senate considered the top two vice-presidential tickets separately.")+
      '<div class="simple-list">'+r.rounds.map((round,index)=>row("House ballot "+(index+1)+(round.agreement?" · Coalition agreement":""),Object.entries(round.votes).map(([id,n])=>names(id)+" "+count(n)).join(" · "))).join("")+
      row("President selected by House",names(r.winner))+row("Senate vote",Object.entries(r.senateVotes||{}).map(([id,n])=>names(id)+" "+count(n)).join(" · "))+
      row("Vice president’s ticket",names(r.vicePresident))+'</div>');
  }
  function electionMarkup(result,archived){
    const complete=revealed>=result.rows.length;
    const winner=result.tickets.find(t=>t.id===result.winner);
    const label=complete?(result.winner==="player"?"You won the presidency":result.onBallot?"You lost the election":winner.name+" won the election"):"The polls have closed";
    const desc=complete?(result.runoff?"The House elected "+winner.name+" after no candidate reached 270 electoral votes.":winner.name+" received "+result.ev[result.winner]+" electoral votes.")+
      (!archived&&result.winner!=="player"?" Your career continues.":""):"Track the calls as they come in.";
    const visible=result.rows.slice(0,revealed);
    const ev=G.electoralTotal(visible,result.tickets);
    const popular=Object.fromEntries(result.tickets.map(t=>[t.id,visible.reduce((n,r)=>n+Math.round(r.turnout*(r.shares[t.id]||0)/100),0)]));
    const score=result.tickets.map(t=>'<article class="panel score-card" style="--candidate-color:'+electionPalette(result,t.id)+'"><span>'+esc(D.parties[t.party])+(t.id==="player"?" · You":"")+'</span><h3>'+esc(t.name)+'</h3>'+
      '<strong style="color:'+electionPalette(result,t.id)+'" data-candidate="'+t.id+'">'+ev[t.id]+'</strong><span data-popular="'+t.id+'">'+count(popular[t.id])+' popular votes</span></article>').join("");
    return topbar(true,true)+'<main class="result-page"><div class="result-header"><div class="eyebrow">Election night · '+result.year+'</div><h1 tabindex="-1" id="result-title">'+esc(label)+'</h1><p id="result-desc">'+esc(desc)+'</p></div>'+
      '<div class="flow"><div class="result-score">'+score+'</div><div class="banner spread"><span id="calls">'+revealed+' / 51 jurisdictions called · '+(51-revealed)+' remaining</span><span>270 to win '+info("Electoral College")+'</span>'+
      (complete?btn(archived?"Back to Elections":"Continue career",archived?"close-result":"dismiss",{style:"tiny primary",arrow:true}):btn("Show all results","reveal-all",{style:"tiny"}))+'</div>'+
      '<div class="board"><div class="panel map-wrap"><div class="map-head"><h2 class="map-title">Electoral College results</h2></div>'+mapSVG(result,revealed)+legend([...result.tickets.map(t=>[electionPalette(result,t.id),t.name]),[color.none,"Awaiting call"]])+'</div>'+
      '<aside class="panel state-panel" id="election-state">'+electionState(result,revealed)+'</aside></div>'+
      (complete?runoffContent(result):"")+
      panel(section("State-by-state results "+info("Popular vote"))+'<div class="table-wrap"><table><thead><tr><th>State</th><th>Statewide winner</th><th>Winner share</th><th>EV allocation</th><th>Ballots</th></tr></thead><tbody id="result-rows">'+contestRows(result,revealed)+'</tbody></table></div>')+
      (complete?'<div class="button-row">'+btn(archived?"Back to Elections":"Continue career",archived?"close-result":"dismiss",{style:"primary",arrow:true})+'</div>':"")+'</div></main>';
  }
  function updateReveal(result){
    const visible=result.rows.slice(0,revealed);
    const ev=G.electoralTotal(visible,result.tickets);
    for(const t of result.tickets){
      app.querySelector('[data-candidate="'+t.id+'"]').textContent=ev[t.id];
      app.querySelector('[data-popular="'+t.id+'"]').textContent=count(visible.reduce((n,r)=>n+Math.round(r.turnout*(r.shares[t.id]||0)/100),0))+" popular votes";
    }
    const projected=Object.keys(ev).find(k=>ev[k]>=270);
    if(projected){
      const winner=result.tickets.find(t=>t.id===projected);
      document.getElementById("result-title").textContent=winner.name+" is projected to win";
      document.getElementById("result-desc").textContent="The remaining states are still reporting.";
    }
    document.getElementById("calls").textContent=revealed+" / 51 jurisdictions called · "+(51-revealed)+" remaining";
    document.getElementById("election-state").innerHTML=electionState(result,revealed);
    document.getElementById("result-rows").innerHTML=contestRows(result,revealed);
    for(const r of visible){
      const shape=app.querySelector('[data-abbr="'+r.id+'"]');
      shape.setAttribute("fill",electionPalette(result,r.winner));
      const target=app.querySelector('.state-target[data-value="'+r.id+'"]');
      const element=target||shape;
      element.setAttribute("aria-label",D.byId[r.id].name+", "+D.byId[r.id].ev+" electoral votes, called for "+result.tickets.find(t=>t.id===r.winner).name);
      if(target)target.querySelector("circle").setAttribute("fill",electionPalette(result,r.winner));
    }
  }
  const currentResult=()=>game.elections.find(x=>x.year===(screen==="archived-election"?visibleYear:game.screen.year));
  function electionScreen(){
    const result=currentResult(), archived=screen==="archived-election";
    if(archived||!C.read().settings.motion||matchMedia("(prefers-reduced-motion: reduce)").matches)revealed=51;
    app.innerHTML=electionMarkup(result,archived);
    clearTimeout(revealTimer);
    if(revealed<51){
      const step=()=>{
        revealed=Math.min(51,revealed+2);
        if(revealed===51){app.innerHTML=electionMarkup(result,archived);return;}
        updateReveal(result);
        revealTimer=setTimeout(step,revealed<38?205:330);
      };
      revealTimer=setTimeout(step,400);
    }
  }
  function congressResult(){
    const archived=screen==="archived-congress";
    const result=game.congress.results.find(r=>r.year===(archived?visibleYear:game.screen.year));
    const returnButton=btn(archived?"Back to Elections":"Continue career",archived?"close-result":"dismiss",{style:"primary",arrow:true});
    return topbar(true,true)+'<main class="result-page">'+head("Congressional elections","Congressional results · "+result.year,"The new Congress takes office on January 3, "+(result.year+1)+".",returnButton)+
      '<div class="flow"><div class="grid cols-2">'+chamber("House of Representatives",result.house,435,43)+chamber("Senate",W.senateTotals(result.senate),100,25)+'</div>'+
      panel(section("Senate class "+["I","II","III"][result.slot],result.total+" seats were up this year. The other two classes continue serving their six-year terms.")+
      '<div class="simple-list">'+Object.entries(result.senate[result.slot]).map(([p,n])=>row(esc(D.parties[p]),n+" seats won")).join("")+'</div>')+
      '<div class="button-row">'+returnButton+'</div></div></main>';
  }
  function nomination(){
    const c=game.campaign;
    const won=c.stage==="general";
    return topbar(true,true)+'<main class="setup-page"><section class="panel milestone flow"><div><div class="eyebrow">'+c.year+' · '+(c.primary?"Party primaries":"Independent ballot access")+'</div>'+
      '<h1 tabindex="-1">'+(won?(c.primary?"You won the nomination":"You qualified for the ballot"):(c.primary?"Your nomination bid fell short":"Your ballot drive fell short"))+'</h1>'+
      '<p class="muted">'+esc(c.message)+'</p></div><div class="button-row">'+btn("Continue career","dismiss",{style:"primary large",arrow:true})+'</div></section></main>';
  }
  function inaugural(){
    const term=game.terms.at(-1);
    const result=game.elections.at(-1);
    const addresses=[
      ["Renewal and opportunity","Together, we will rebuild opportunity and open doors for the next generation."],
      ["A government for everyone","I will listen across every division and serve every community."],
      ["Service and accountability","We will earn the public’s trust through steady work and clear results."]
    ];
    return topbar(true,true)+'<main class="setup-page">'+
      '<section class="panel milestone flow"><div><div class="eyebrow">Inauguration Day · January 20, '+term.from+'</div><h1 tabindex="-1">President '+esc(G.name(game))+'</h1>'+
      '<p class="muted">'+result.year+' election · '+count(result.ev.player)+' electoral votes · Elected term '+game.terms.length+' of 2</p></div></section>'+
      '<div class="flow" style="margin-top:16px">'+panel(section("Choose your inaugural address")+'<div class="grid cols-3">'+addresses.map(([title,text],i)=>
        '<article class="action-card"><h3>'+esc(title)+'</h3><p>“'+esc(text)+'”</p>'+btn("Deliver address","inaugurate",{value:i,style:"tiny primary",icon:"mic"})+'</article>').join("")+'</div>')+'</div></main>';
  }
  function legacy(){
    const v=game.gov;
    const start=game.terms[0];
    const last=game.terms.at(-1);
    const nonconsecutive=last.from!==start.until;
    return topbar(true,true)+'<main class="result-page"><section class="panel milestone flow"><div><div class="eyebrow">January 20, '+last.until+' · Second term completed</div>'+
      '<h1 tabindex="-1">Your presidential legacy</h1><p class="muted">President '+esc(G.name(game))+' served two '+(nonconsecutive?"nonconsecutive ":"")+
      'elected terms and left office after eight years of service.</p></div><div class="button-row">'+btn("Start a new career","new",{style:"primary",icon:"plus"})+btn("Main menu","menu",{style:"ghost",icon:"back"})+'</div></section>'+
      '<div class="flow" style="margin-top:16px">'+panel(section("Career statistics")+statistics())+
      '<div class="grid cols-2">'+panel(section("Economic results")+'<div class="simple-list">'+row("Growth at departure",pct(v.growth)+" ("+G.signed(v.growth-start.startGrowth)+" pts since first inauguration)")+
      row("Inflation",pct(v.inflation))+row("Unemployment",pct(v.unemployment))+row("National debt",money(v.debt,"T"))+'</div>')+
      panel(section("Presidential record")+'<div class="simple-list">'+game.terms.map((t,i)=>row("Term "+(i+1),"Jan "+t.from+" – Jan "+t.until)).join("")+
      row("Close of last conflict",esc(v.conflictHistory.at(0)?.outcome||v.conflict.operation))+row("Foreign agreements",count(game.stats.agreements))+'</div>')+'</div>'+
      panel(section("Achievements")+'<div class="button-row">'+game.achievements.map(x=>pill(x,"done")).join("")+'</div>')+
      panel(section("Complete career timeline")+timeline(game.log))+'</div></main>';
  }
  function render({focus=false,scroll=false}={}){
    clearTimeout(revealTimer);
    document.documentElement.classList.toggle("reduce-motion",!C.read().settings.motion);
    if(screen==="menu")app.innerHTML=menu();
    else if(screen==="setup")app.innerHTML=setup();
    else if(screen==="library")app.innerHTML=library();
    else if(screen==="help")app.innerHTML=guide(true);
    else if(screen==="archived-election"||game.screen?.type==="election")electionScreen();
    else if(screen==="archived-congress"||game.screen?.type==="midterm")app.innerHTML=congressResult();
    else if(game.screen?.type==="nomination")app.innerHTML=nomination();
    else if(game.screen?.type==="inauguration")app.innerHTML=inaugural();
    else if(game.screen?.type==="legacy")app.innerHTML=legacy();
    else app.innerHTML=gamePage();
    if(scroll)window.scrollTo(0,0);
    if(focus)app.querySelector("h1")?.focus({preventScroll:true});
  }
  function openDialog(title,body){
    modal.innerHTML='<header class="dialog-head"><h2 id="dialog-title">'+esc(title)+'</h2><button class="dialog-close" type="button" data-action="close" aria-label="Close">×</button></header>'+
      '<div class="dialog-body">'+body+'</div>';
    if(!modal.open)modal.showModal();
  }
  function formDialog(title,id,content,label="Confirm"){
    openDialog(title,'<form id="'+id+'" class="flow">'+content+'<div class="button-row"><button type="submit" class="btn primary">'+esc(label)+' '+icon("arrow")+'</button></div></form>');
  }
  function settings(){
    const settings=C.read().settings;
    const current=screen==="game"||screen.startsWith("archived");
    const activeCareer=current&&game.office!=="Completed";
    openDialog("Settings",'<div class="flow"><form class="flow" id="settings-form">'+
      (activeCareer?field("Difficulty for this career",'<select name="careerDifficulty">'+difficultyOptions(game.difficulty)+'</select>')+
      '<p class="muted small">You can switch to Easy anytime. Extra moves arrive when you start the next month.</p>':"")+
      '<div class="form-row">'+field("Difficulty for new careers",'<select name="difficulty">'+difficultyOptions(settings.difficulty)+'</select>')+
      field("SG Game Hub URL",'<input name="hub" value="'+attr(settings.hub)+'" placeholder="../index.html">')+'</div>'+
      '<label class="checkline"><input name="motion" type="checkbox" '+(settings.motion?"checked":"")+'> Animate election night and page transitions</label>'+
      '<div class="button-row"><button class="btn primary" type="submit">Save settings</button></div></form>'+
      '<div class="flow tight divider"><h3>Career saves</h3><p class="body-copy small">Progress saves after every action. Export a backup to move a career between browsers or game folders.</p>'+
      '<div class="button-row">'+(current?btn("Save now","save",{style:"tiny"})+btn("Export backup","export",{style:"tiny"}):"")+
      btn("Load a career","library",{style:"tiny"})+btn("Import backup","import",{style:"tiny"})+(current?btn("Main menu","menu",{style:"tiny ghost"}):"")+'</div></div></div>');
  }
  function activate(g){
    game=g;
    screen="game";page="overview";state=game.person.home;resultState=state;mapMode="auto";revealed=0;visibleYear=null;logFilter="All";pendingLabel="";
    lastDecision="";
    C.select(g.id);
    render({scroll:true,focus:true});
  }
  function mutate(result,{redirect,close=true,announce=true}={}){
    if(!result.ok){toastMessage(result.message,true);return false;}
    if(close&&modal.open)modal.close();
    C.save(game);
    if(redirect)page=redirect;
    const moved=Boolean(game.screen);
    if(announce)lastDecision=result.message;
    render({scroll:moved,focus:moved});
    if(announce&&(moved||!["overview","map"].includes(page)))toastMessage(result.message);
    return true;
  }
  function midtermSpeech(){
    const result=G.speech(game,{id:state,topic:game.officePriorities[0],tone:"Unifying",message:1});
    if(result.ok){
      game.congress.momentum=G.clamp(game.congress.momentum+1.15,-5,8);
      const title="Supported "+(game.person.party==="I"?"independent":D.parties[game.person.party].toLowerCase())+" candidates";
      G.logged(game,"Congressional campaign",title+" in "+D.byId[state].name+".","Congress");
      result.message=title+". "+result.message;
    }
    mutate(result);
  }
  function showDebate(){
    const r=game.campaign.stage==="primary"?game.campaign.primary:game.campaign.rivals.find(x=>x.party!==game.person.party);
    formDialog("Debate with "+r.name,"debate-form",'<p class="body-copy">Choose an answer to each question. The debate costs one campaign action and $0.10M.</p>'+
      G.debateQuestions.map(([,q,...answers],i)=>'<div class="flow tight"><h3>'+esc(q)+'</h3>'+answers.map((a,j)=>'<label class="choice"><input type="radio" name="q'+i+'" value="'+j+'" required><span>'+esc(a)+'</span></label>').join("")+'</div>').join(""),"Submit responses");
  }
  function showBill(category){
    const choices=Object.keys(D.policies);
    const select=category||choices[0];
    formDialog("Write a bill","bill-form",
      field("Policy category",'<select name="category" id="bill-category">'+options(choices,select)+'</select>')+
      '<p class="body-copy" id="bill-details">'+esc(D.policies[select][0]+" · "+D.policies[select][6])+'</p>'+
      field("How big is the bill?",'<select name="scope">'+options([["Targeted","Focused · easier to pass"],["Standard","Standard"],["Ambitious","Ambitious · harder to pass"]],"Targeted")+'</select>')+
      '<p class="muted small">This uses one move. You can talk to lawmakers before asking them to vote.</p>',"Send to the House");
  }
  function exportCareer(){
    const blob=new Blob([JSON.stringify(game,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement("a");
    anchor.href=url;anchor.download="president-simulator-"+G.name(game).toLowerCase().replace(/[^a-z0-9]+/g,"-")+".json";
    document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
    toastMessage("Career backup exported.");
  }
  const dispatcher={
    menu(){if(modal.open)modal.close();screen="menu";render({scroll:true,focus:true});},
    new(){if(modal.open)modal.close();formMessage="";screen="setup";render({scroll:true,focus:true});},
    help(){screen="help";render({scroll:true,focus:true});},
    library(){if(modal.open)modal.close();screen="library";render({scroll:true,focus:true});},
    continue(){const save=C.load();if(save)activate(save);},
    load(id){const save=C.load(id);if(save)activate(save);else toastMessage("This save could not be opened.",true);},
    "confirm-delete"(id){
      const g=C.load(id);if(!g)return;
      openDialog("Delete "+G.name(g)+"?",'<p class="body-copy">This removes the career from this browser.</p><div class="button-row" style="margin-top:13px">'+btn("Delete career","delete",{value:id,style:"danger"})+btn("Cancel","close")+'</div>');
    },
    delete(id){C.remove(id);modal.close();render();toastMessage("Career deleted.");},
    settings,
    close(){modal.close();},
    info(term){openDialog(term,'<p class="body-copy">'+esc(D.civics[term])+'</p>');},
    save(){toastMessage(C.save(game)?"Career saved.":"Browser storage is unavailable. Export a backup to keep this career.",!C.healthy());},
    export:exportCareer,
    import(){
      formDialog("Import career backup","import-form",field("Backup file",'<input type="file" name="backup" accept=".json,application/json" required>')+
        '<p class="body-copy small">The backup opens as a separate saved career.</p>',"Import");
    },
    page(key){page=key;render({scroll:true,focus:true});},
    advance(){
      const previous=game.office;
      revealed=0;resultState=state;lastDecision="";
      const result=G.advance(game);
      if(previous!==game.office)page="overview";
      if(mutate(result,{announce:false})&&!game.screen)app.querySelector('[data-action="advance"]')?.focus({preventScroll:true});
    },
    state(id,element){
      if(!D.byId[id])return;
      state=id;pendingLabel="";render();
      if(element?.getAttribute("role")==="button")app.querySelector('[role="button"][data-action="state"][data-value="'+id+'"]')?.focus({preventScroll:true});
    },
    "map-mode"(id){mapMode=id;render();app.querySelector('[data-action="map-mode"][data-value="'+id+'"]')?.focus();},
    "guided-campaign"(value){
      const [key,id]=value.split(":");
      const s=D.byId[id];
      if(s)mutate(G.campaignAction(game,key,id,suggestedTopic(s)));
    },
    "campaign-action"(key){mutate(G.campaignAction(game,key,state,pendingLabel||suggestedTopic(D.byId[state])));},
    "local-action"(key){mutate(G.campaignAction(game,key,state,pendingLabel||suggestedTopic(D.byId[state])));},
    "respond-news"(){mutate(G.campaignAction(game,"respond",state,game.campaign.currentEvent.topic));},
    "state-speech"(){openDialog("Speech in "+D.byId[state].name,speechForm(state));},
    debate:showDebate,
    "midterm-speech":midtermSpeech,
    propose:showBill,
    legislate(value){const [id,key]=value.split(":");mutate(W.legislation(game,Number(id),key));},
    order(title){mutate(W.executive(game,title));},
    nominate(position){formDialog("Nominate · "+position,"nomination-form",'<input type="hidden" name="position" value="'+attr(position)+'">'+
      field("Nominee profile",'<select name="nominee">'+options(["Consensus nominee","Reform advocate","Experienced administrator"],"Consensus nominee")+'</select>')+
      '<p class="body-copy small">Confirmation requires a Senate majority. The nominee’s profile affects the vote.</p>',"Submit nomination");},
    priorities(){formDialog("Administration priorities","priorities-form",'<p class="body-copy">Choose three priorities to guide the rest of your term.</p>'+issueChoices(game.officePriorities,"priority"),"Update priorities");},
    event(value){const [id,i]=value.split(":");mutate(W.event(game,id,Number(i)));},
    military(key){mutate(W.militaryAction(game,key));},
    diplomacy(country){
      formDialog(country,"diplomacy-form",'<input type="hidden" name="country" value="'+attr(country)+'">'+
        field("Diplomatic action",'<select name="type">'+options(Object.keys(W.foreign),"Diplomatic meeting")+'</select>')+
        '<p class="body-copy small">Each diplomatic action uses one presidential action. Negotiations depend on the relationship and recent outreach.</p>',"Proceed");
    },
    dismiss(){if(mutate(G.dismiss(game),{announce:false})){window.scrollTo(0,0);app.querySelector("h1")?.focus({preventScroll:true});}},
    inaugurate(value){mutate(G.inauguration(game,Number(value)),{redirect:"overview"});window.scrollTo(0,0);},
    "view-election"(value){visibleYear=Number(value);revealed=51;resultState=state;screen="archived-election";render({scroll:true,focus:true});},
    "view-midterm"(value){visibleYear=Number(value);screen="archived-congress";render({scroll:true,focus:true});},
    "close-result"(){visibleYear=null;screen="game";page="elections";render({scroll:true,focus:true});},
    "reveal-all"(){revealed=51;render();app.querySelector("h1")?.focus({preventScroll:true});},
    "result-state"(id,element){
      if(!D.byId[id])return;
      resultState=id;
      for(const node of app.querySelectorAll('.map-area [data-action="result-state"]'))node.classList.toggle("selected",node.dataset.value===id);
      document.getElementById("election-state").innerHTML=electionState(currentResult(),revealed);
      if(element?.getAttribute("role")==="button")element.focus({preventScroll:true});
    }
  };
  document.addEventListener("click",event=>{
    const el=event.target.closest("[data-action]");
    if(el&&!el.disabled&&Object.hasOwn(dispatcher,el.dataset.action))dispatcher[el.dataset.action](el.dataset.value||"",el);
  });
  document.addEventListener("keydown",event=>{
    if(event.target.matches('svg [role="button"][data-action]')&&["Enter"," "].includes(event.key)){
      event.preventDefault();
      dispatcher[event.target.dataset.action](event.target.dataset.value,event.target);
    }
  });
  document.addEventListener("change",event=>{
    const el=event.target;
    if(el.id==="state-select"){state=el.value;pendingLabel="";render();document.getElementById("state-select")?.focus();}
    if(el.id==="log-filter"){logFilter=el.value;render();document.getElementById("log-filter")?.focus();}
    if(el.id==="campaign-topic"){
      pendingLabel=el.value;
      const note=app.querySelector("[data-local-topic]");
      if(note)note.textContent=el.value.toLowerCase();
    }
    if(el.id==="bill-category")document.getElementById("bill-details").textContent=D.policies[el.value][0]+" · "+D.policies[el.value][6];
    if(el.form?.id==="candidate-form"&&el.name==="difficulty")document.getElementById("difficulty-hint").textContent=difficultyHint(el.value);
    if(el.name==="priority"&&el.checked&&new FormData(el.form).getAll("priority").length>3){
      el.checked=false;toastMessage("Choose up to three priorities.",true);
    }
  });
  document.addEventListener("submit",async event=>{
    const id=event.target.id;
    if(!id)return;
    event.preventDefault();
    const data=new FormData(event.target);
    const obj=Object.fromEntries(data.entries());
    if(id==="candidate-form"){
      const r=G.newCareer({...obj,priorities:data.getAll("priority"),eligible:data.has("eligible")});
      if(!r.ok){formMessage=r.message;document.getElementById("form-message").textContent=formMessage;return;}
      C.save(r.game);activate(r.game);
      return;
    }
    if(id==="settings-form"){
      const settings=C.read().settings;
      if(obj.hub.trim()){
        try{
          const url=new URL(obj.hub.trim(),location.href);
          if(!["file:","https:","http:"].includes(url.protocol))throw Error();
        }catch{toastMessage("Enter an HTTP, HTTPS, or local file URL.",true);return;}
      }
      let message="Settings updated.";
      if(obj.careerDifficulty&&obj.careerDifficulty!==game.difficulty){
        const result=G.changeDifficulty(game,obj.careerDifficulty);
        if(!result.ok){toastMessage(result.message,true);return;}
        C.save(game);
        message=result.message;
      }
      Object.assign(settings,{difficulty:obj.difficulty,motion:data.has("motion"),hub:obj.hub.trim()});
      C.write();modal.close();
      if(screen==="setup"){
        app.querySelector(".topbar").outerHTML=topbar();
        document.documentElement.classList.toggle("reduce-motion",!settings.motion);
      }else render();
      toastMessage(message);
      return;
    }
    if(id==="import-form"){
      try{
        const imported=C.upload(await obj.backup.text());modal.close();activate(imported);toastMessage("Career backup imported.");
      }catch(error){toastMessage(error.message,true);}
      return;
    }
    if(id==="speech-form"){mutate(G.speech(game,{id:obj.location,topic:obj.topic,tone:obj.tone,message:Number(obj.message)}));return;}
    if(id==="debate-form"){
      const r=G.debate(game,[obj.q0,obj.q1,obj.q2].map(Number));
      if(mutate(r,{close:false,announce:false})){
        openDialog("Debate summary",'<div class="flow">'+r.notes.map(note=>'<div><h3>'+esc(note.topic)+'</h3><p class="body-copy">'+esc(note.reply)+'</p>'+
          '<p class="muted small">Audience response '+G.signed(note.gain)+'</p></div>').join("")+
          '<p class="body-copy">'+esc(r.message)+'</p>'+btn("Return to campaign","close",{style:"primary"})+'</div>');
      }
      return;
    }
    if(id==="bill-form"){mutate(W.propose(game,obj.category,obj.scope),{redirect:"laws"});return;}
    if(id==="nomination-form"){mutate(W.appointments(game,obj.position,obj.nominee));return;}
    if(id==="priorities-form"){mutate(W.changePriorities(game,data.getAll("priority")));return;}
    if(id==="diplomacy-form"){mutate(W.diplomacy(game,obj.country,obj.type));}
  });
  render();
}());
