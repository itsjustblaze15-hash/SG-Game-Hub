const games = [
  {
    "id": "eight-ball",
    "name": "Eight Ball",
    "subtitle": "8-BALL POOL · 1 ON 1 & LOCAL PLAY",
    "description": "Rack up for 1-on-1 pool, pass-and-play, or solo practice. Earn levels and unlock new table finishes and cues.",
    "cover": "assets/eight-ball.jpg",
    "macSupported": true,
    "iPhoneSupported": true,
    "play": "games/eight-ball/"
  },
  {
    "id": "ben10-open-world",
    "name": "Ben 10: Open World",
    "subtitle": "OPEN WORLD · V34",
    "description": "Explore an open world as Ben and use the Omnitrix to transform into aliens. Pick up your V34 adventure from your SG save.",
    "cover": "assets/ben10-open-world.jpg",
    "macSupported": true,
    "iPhoneSupported": false,
    "play": null
  },
  {
    "id": "foamfall",
    "name": "Foamfall",
    "subtitle": "3D · BATTLE ROYALE",
    "description": "Drop onto the island, scavenge for weapons and gear, and fight to be the last one standing. Choose where to land and adapt to what you find.",
    "cover": "assets/foamfall.jpg",
    "macSupported": true,
    "iPhoneSupported": false,
    "play": null
  },
  {
    "id": "fus",
    "name": "FUS",
    "subtitle": "FOOTBALL · UNIVERSE SIMULATOR",
    "description": "Run your own football universe. Create clubs and leagues, then simulate seasons to see how the competition develops.",
    "cover": "assets/fus.jpg",
    "macSupported": true,
    "iPhoneSupported": true,
    "play": "https://itsjustblaze15-hash.github.io/football-universe-iphone/"
  },
  {
    "id": "armor-dynasty",
    "name": "Armor Dynasty",
    "subtitle": "ARMOR DESIGN · WORKSHOP · COMBAT",
    "description": "Design and assemble powered armor in a 3D workshop with ATLAS. Test your suit in combat, then repair it, research upgrades, and rebuild for the next fight.",
    "cover": "assets/armor-dynasty.jpg",
    "macSupported": true,
    "iPhoneSupported": false,
    "play": null
  },
  {
    "id": "gp",
    "name": "GP",
    "subtitle": "GOLDEN PULLS · V11.14 PREMIUM",
    "description": "Open packs and build your Golden Pulls card collection. Chase rare cards, take on bosses, and spend your coins on the prize wheel.",
    "cover": "assets/gp.jpg",
    "macSupported": true,
    "iPhoneSupported": true,
    "play": "https://itsjustblaze15-hash.github.io/Card-game/"
  },
  {
    "id": "apex-circuit",
    "name": "APEX Circuit",
    "subtitle": "RACING · STORY ADVENTURE",
    "description": "Take to the track in a racing adventure with a story. Race the circuit and follow the journey home.",
    "cover": "assets/apex-circuit.jpg",
    "macSupported": true,
    "iPhoneSupported": false,
    "play": null
  },
  {
    "id": "second-chance",
    "name": "Second Chance Motor Co.",
    "subtitle": "BUY · FIX · UPGRADE · SELL",
    "description": "Buy damaged cars, salvage compatible parts, and repair the vehicles by hand. Sell the finished cars for a profit and put the money toward your next project.",
    "cover": "assets/second-chance.jpg",
    "macSupported": true,
    "iPhoneSupported": false,
    "play": null
  },
  {
    "id": "blacktide",
    "name": "BLACKTIDE",
    "subtitle": "V40 · OPERATORS & AIRLIFT",
    "description": "Choose an operator and fight through the island to take back the coast. This version includes the Operators & Airlift update.",
    "cover": "assets/blacktide.jpg",
    "macSupported": true,
    "iPhoneSupported": false,
    "play": null
  },
  {
    "id": "police-patrol-simulator",
    "name": "Police Patrol Simulator",
    "subtitle": "OPEN WORLD · POLICE DRIVING SIMULATOR",
    "description": "Get behind the wheel of a patrol car and drive through Port Halden in third person. Respond to calls across the open city and build your police career.",
    "cover": "assets/police-patrol-simulator.jpg",
    "macSupported": true,
    "iPhoneSupported": false,
    "play": null
  },
  {
    "id": "redwood",
    "name": "Redwood Orchard",
    "subtitle": "FIRST-PERSON · HARVEST SIM",
    "description": "Walk the orchard in first person and pick red apples by hand. Harvest across 16 plots and earn one coin for every apple you sell.",
    "cover": "assets/redwood.jpg",
    "macSupported": true,
    "iPhoneSupported": false,
    "play": null
  },
  {
    "id": "world-conquest",
    "name": "WORLD CONQUEST",
    "subtitle": "MODERN ERA · REAL-TIME STRATEGY",
    "description": "Choose any of 195 nations. Command armies, forge alliances, and conquer the world one region at a time.",
    "cover": "assets/world-conquest.jpg",
    "macSupported": true,
    "iPhoneSupported": false,
    "play": null
  },
  {
    "id": "president-simulator",
    "name": "President Simulator",
    "subtitle": "ROAD TO THE WHITE HOUSE · POLITICAL STRATEGY",
    "description": "Build a presidential campaign, win the Electoral College, and govern through crises and midterms. Rebuild after a loss and shape your legacy across two elected terms.",
    "cover": "assets/president-simulator.jpg",
    "macSupported": true,
    "iPhoneSupported": false,
    "play": null
  },
  {
    "id": "motor-dynasty",
    "name": "Motor Dynasty",
    "subtitle": "CAR DESIGN · MANUFACTURING · ENDLESS EMPIRE",
    "description": "Design cars and run your own manufacturer. Build out your lineup and grow the company across generations in a timeline with no fixed ending year.",
    "cover": "assets/motor-dynasty.jpg",
    "macSupported": true,
    "iPhoneSupported": false,
    "play": null
  },
  {
    "id": "traffic-jam-simulator",
    "name": "Traffic Jam Simulator",
    "subtitle": "PORT MERIDIAN · TRAFFIC MANAGEMENT",
    "description": "Clear the rush-hour gridlock in Port Meridian by building roads and changing signs and signals.",
    "cover": "assets/traffic-jam-simulator.jpg",
    "macSupported": true,
    "iPhoneSupported": false,
    "play": null
  },
  {
    "id": "minecraft-kingdoms",
    "name": "Minecraft Kingdoms",
    "subtitle": "SURVIVAL · KINGDOM BUILDER",
    "description": "Survive in a block world and build a kingdom of your own. Start with a foothold and expand it as you explore and build.",
    "cover": "assets/minecraft-kingdoms.jpg",
    "macSupported": true,
    "iPhoneSupported": false,
    "play": null
  },
  {
    "id": "estuary",
    "name": "Estuary",
    "subtitle": "3D · CITY BUILDER",
    "description": "Build a city in a 3D valley. Lay roads, plan neighborhoods, and manage your budget as the city grows. You can also explore a working sample city before starting your own.",
    "cover": "assets/estuary.jpg",
    "macSupported": true,
    "iPhoneSupported": false,
    "play": null
  },
  {
    "id": "world-forge",
    "name": "WORLD//FORGE",
    "subtitle": "WORLD-BUILDING · SANDBOX",
    "description": "Create a world from scratch, place kingdoms, and watch villages grow. Build roads and forests, change the terrain, or steer neighboring kingdoms toward war or peace.",
    "cover": "assets/world-forge.jpg",
    "macSupported": true,
    "iPhoneSupported": false,
    "play": null
  },
  {
    "id": "alive",
    "name": "ALIVE",
    "subtitle": "LIFE SIM · AI SETUP REQUIRED",
    "description": "Follow Pip, an AI-driven character living on a simulated island. Shape the surroundings, place objects, and see how Pip responds to the world. Connect an AI model to bring Pip to life.",
    "cover": "assets/alive.jpg",
    "macSupported": true,
    "iPhoneSupported": false,
    "play": null
  }
];
