(function () {
  "use strict";
  const issues = ["Economy", "Healthcare", "Education", "Immigration", "National Security", "Housing", "Infrastructure", "Taxes", "Environment", "Foreign Policy"];
  // Electoral votes are the official 2028 allocation. Later cycles use this baseline in the fictional timeline.
  // Lean is a fictional Democratic two-party advantage in percentage points, and turnout is in millions.
  const rows = [
    ["AL","Alabama",9,-13,2.3,6,4],["AK","Alaska",3,-7,.34,8,4],["AZ","Arizona",11,-1.5,3.4,3,5],
    ["AR","Arkansas",6,-14,1.2,2,7],["CA","California",54,11,15.9,5,8],["CO","Colorado",10,5,3.2,8,5],
    ["CT","Connecticut",7,7,1.8,1,7],["DE","Delaware",3,7,.5,1,6],["DC","Washington, D.C.",3,39,.31,5,2],
    ["FL","Florida",30,-4,10.8,7,8],["GA","Georgia",16,-.5,5.3,6,1],["HI","Hawaii",4,14,.49,5,8],
    ["ID","Idaho",4,-16,.91,8,7],["IL","Illinois",19,7,5.7,6,2],["IN","Indiana",11,-9,3,0,2],
    ["IA","Iowa",6,-6,1.6,0,8],["KS","Kansas",6,-8,1.3,0,2],["KY","Kentucky",8,-14,2.1,1,0],
    ["LA","Louisiana",8,-11,2,8,6],["ME","Maine",4,3,.81,8,1],["MD","Maryland",10,14,3,4,5],
    ["MA","Massachusetts",11,14,3.5,2,1],["MI","Michigan",15,1,5.5,6,0],["MN","Minnesota",10,2.5,3.2,2,8],
    ["MS","Mississippi",6,-11,1.2,1,6],["MO","Missouri",10,-8,3,0,1],["MT","Montana",4,-9,.61,8,5],
    ["NE","Nebraska",5,-10,.95,7,6],["NV","Nevada",6,-.5,1.5,5,3],["NH","New Hampshire",4,2,.82,7,5],
    ["NJ","New Jersey",14,5,4.3,7,6],["NM","New Mexico",5,3,.92,3,8],["NY","New York",28,11,8.3,5,6],
    ["NC","North Carolina",16,-1.3,5.6,2,0],["ND","North Dakota",3,-17,.37,7,0],["OH","Ohio",17,-5.5,5.8,0,6],
    ["OK","Oklahoma",7,-17,1.6,0,4],["OR","Oregon",8,7,2.3,8,5],["PA","Pennsylvania",19,-.3,7,0,1],
    ["RI","Rhode Island",4,9,.5,6,5],["SC","South Carolina",9,-6,2.5,4,6],["SD","South Dakota",3,-14,.42,7,2],
    ["TN","Tennessee",11,-13,3.1,1,0],["TX","Texas",40,-6,11.4,3,0],["UT","Utah",6,-12,1.5,2,5],
    ["VT","Vermont",3,18,.37,8,1],["VA","Virginia",13,2.7,4.5,4,6],["WA","Washington",12,9,4,9,8],
    ["WV","West Virginia",4,-20,.77,0,1],["WI","Wisconsin",10,.2,3.4,0,2],["WY","Wyoming",3,-21,.27,7,8]
  ];
  const states = rows.map(([id,name,ev,lean,turnout,a,b], index) => {
    const fallback = (index * 7 + 3) % issues.length;
    const c = fallback === a || fallback === b ? (b + 1 + Number((b + 1) % 10 === a)) % 10 : fallback;
    return {id,name,ev,lean,turnout,issues:[issues[a],issues[b],issues[c]]};
  });
  const parties = {D:"Democrat",R:"Republican",I:"Independent"};
  const rivals = [
    ["Morgan Hale","D","MI",["Economy","Healthcare","Infrastructure"],72,"Industrial-state organizer",22,63],
    ["Elena Brooks","D","VA",["Education","Housing","Environment"],66,"Suburban coalition builder",18,59],
    ["Jordan Mercer","R","GA",["Taxes","National Security","Economy"],75,"Sun Belt advertising strategist",23,65],
    ["Cameron Reid","R","AZ",["Immigration","Housing","Infrastructure"],67,"Retail campaigner",17,60]
  ];
  const actions = {
    visit:["Visit State",.09,1.35,"Travel and build local recognition."],
    rally:["Hold Rally",.25,2.35,"Turn supporters into an enthusiastic base."],
    ads:["Run Advertisements",.65,3.5,"Reach undecided voters with targeted media."],
    funds:["Raise Campaign Funds",0,0,"Solicit donations from your coalition."],
    policy:["Announce Policy",.12,1.8,"Make a campaign promise on a priority."],
    respond:["Respond to Political Event",.08,1.45,"Address the campaign news cycle."],
    interview:["Give an Interview",.02,1.1,"Rebuild trust and draw national attention."],
    endorse:["Endorse Candidates",.10,1.05,"Build relationships and help down-ballot candidates."]
  };
  const campaignNews = [
    ["Economy","A weak hiring report puts jobs at the center of the race."],
    ["Housing","A mayors’ coalition calls for answers on rising rents."],
    ["Healthcare","Hospital closures draw national coverage."],
    ["Immigration","Governors seek changes to border processing."],
    ["Education","A forum asks candidates to explain their plans for schools."],
    ["National Security","A security briefing shifts attention to preparedness."],
    ["Infrastructure","Travel disruptions expose disagreements over infrastructure funding."],
    ["Environment","Recent storms prompt questions about disaster preparedness."],
    ["Taxes","A budget report brings tax plans back into the spotlight."],
    ["Foreign Policy","A trade dispute opens a debate over international priorities."]
  ];
  // State membership from the U.S. Senate's public class rosters.
  const senateStates = [
    "AZ CA CT DE FL HI IN MA MD ME MI MN MO MS MT ND NE NJ NM NV NY OH PA RI TN TX UT VA VT WA WI WV WY",
    "AK AL AR CO DE GA IA ID IL KS KY LA MA ME MI MN MS MT NC NE NH NJ NM OK OR RI SC SD TN TX VA WV WY",
    "AK AL AR AZ CA CO CT FL GA HI IA ID IL IN KS KY LA MD MO NC ND NH NV NY OH OK OR PA SC SD UT VT WA WI"
  ].map(s=>s.split(" "));
  const policies = {
    Healthcare:["Community Health Access Act",.12,.04,-.02,1.5,.09,"Expand primary care and lower out-of-pocket costs."],
    Education:["Skills and Schools Act",.09,.10,-.05,1.2,.05,"Fund career training and school modernization."],
    Taxes:["Household Tax Relief Act",0,.14,-.03,1.35,-.23,"Reduce federal tax collections to support household budgets."],
    Immigration:["Border and Processing Act",.08,.05,-.03,.85,.01,"Expand processing capacity and improve border operations."],
    Housing:["Affordable Housing Act",.15,.12,-.08,1.4,.02,"Fund housing construction and local permitting assistance."],
    Infrastructure:["National Infrastructure Act",.20,.21,-.10,1.6,.05,"Repair transport links and modernize utilities."],
    "National Security":["Defense Resilience Act",.19,.03,-.015,.9,.02,"Modernize equipment and protect critical infrastructure."],
    Environment:["Clean Energy Transition Act",.12,.10,-.065,1.1,.03,"Invest in grid upgrades and cleaner energy."],
    "Government Spending":["Budget Stabilization Act",-.21,-.08,.035,-.6,.04,"Reduce spending growth and narrow the deficit."],
    "Economic Policy":["Small Business Investment Act",.09,.20,-.08,1.3,.08,"Support new businesses with credit guarantees and training."]
  };
  const civics = {
    "Electoral College":"The country has 538 electoral votes in this scenario. A majority of 270 normally elects the president. Maine and Nebraska give two votes to the statewide winner and one to each congressional district winner.",
    "Popular vote":"The popular vote counts individual ballots. Statewide and district results determine which presidential electors are appointed.",
    "Presidential primaries":"Party voters choose delegates in a series of state contests. This game uses a proportional two-candidate model and a majority of delegates to settle the nomination.",
    "Ballot access":"Independent candidates qualify state by state. This game bundles the requirements into a petition drive and organizational threshold.",
    "House of Representatives":"The House has 435 voting seats apportioned by population. Every seat is elected every two years.",
    "Senate":"The Senate has 100 seats. Senators serve six years in three staggered classes. Most bills here use a simple majority; real procedures can require more votes.",
    "Congress":"Congress consists of the House and Senate. Both must approve the same bill before it reaches the president.",
    "Executive orders":"An executive order directs federal agencies using existing legal authority. Courts can block an order that exceeds that authority.",
    "Presidential veto":"A president can reject a bill. Congress can override the veto with a two-thirds vote in each chamber.",
    "Supreme Court":"The Supreme Court has nine seats. The president nominates a justice for a vacancy and the Senate votes on confirmation.",
    "Midterm elections":"Midterms fall halfway through a presidential term. Voters elect the full House and about one-third of the Senate.",
    "Federal budget":"When federal spending exceeds revenues, the government runs a deficit. This simulation reports revenue, spending and deficits at annual rates.",
    "National debt":"The debt is the accumulated borrowing. Monthly budget deficits add to it and surpluses reduce it.",
    "Presidential term limits":"The 22nd Amendment generally limits a person to being elected president twice. Elected terms can be nonconsecutive. Each term here runs four years from January 20.",
    "Commander in Chief":"The president directs armed forces. Congress controls funding and authorizes major operations in this simulation.",
    "Checks and balances":"Congress writes laws and funds the government, the president executes laws, and courts review government actions for legality.",
    "Contingent election":"If nobody wins 270 electoral votes, the House chooses among up to three leading candidates. Each state delegation casts one vote, and a candidate needs 26. The Senate chooses the vice president separately.",
    "Federal Reserve":"The Federal Reserve makes independent monetary policy decisions. In the simulation, inflation and financial conditions influence its response automatically."
  };
  window.Scenario = {issues,states,byId:Object.fromEntries(states.map(state=>[state.id,state])),parties,rivals,actions,policies,civics,campaignNews,senateStates,
    districts:{ME:[5.5,-7.5],NE:[3.5,12.5,-8]},countries:{Canada:83,Mexico:67,"United Kingdom":87,France:78,Germany:81,China:38,Russia:27,Japan:85},
    difficulties:{Easy:{funds:27,ai:.64,compromise:7,volatility:.75,actions:5},Normal:{funds:20,ai:1,compromise:0,volatility:1,actions:4},Hard:{funds:14,ai:1.34,compromise:-6,volatility:1.23,actions:4}}};
}());
