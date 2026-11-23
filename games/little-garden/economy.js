(() => {
  'use strict';

  const baseFlowers = [
    {id: 'daisy', name: 'Daisy', icon: '🌼', seedPrice: 2, sellPrice: 5, base: 'daisy', color: 0xfff2d2},
    {id: 'sunflower', name: 'Sunflower', icon: '🌻', seedPrice: 3, sellPrice: 7, base: 'sunflower', color: 0xffc739},
    {id: 'cosmos', name: 'Cosmos', icon: '🌸', seedPrice: 3, sellPrice: 7, base: 'cosmos', color: 0xed88b9},
    {id: 'lavender', name: 'Lavender', icon: '🪻', seedPrice: 4, sellPrice: 8, base: 'lavender', color: 0xb39bdf},
    {id: 'tulip', name: 'Tulip', icon: '🌷', seedPrice: 4, sellPrice: 9, base: 'tulip', color: 0xf3ae58},
    {id: 'poppy', name: 'Poppy', icon: '🏵️', seedPrice: 5, sellPrice: 10, base: 'poppy', color: 0xed7069},
    {id: 'pink-daisy', name: 'Blush daisy', icon: '🌼', seedPrice: 3, sellPrice: 7, base: 'daisy', color: 0xf2a6c6},
    {id: 'blue-daisy', name: 'Sky daisy', icon: '🌼', seedPrice: 4, sellPrice: 8, base: 'daisy', color: 0x8cbfe6},
    {id: 'peach-daisy', name: 'Peach daisy', icon: '🌼', seedPrice: 4, sellPrice: 9, base: 'daisy', color: 0xffbd98},
    {id: 'amber-sunflower', name: 'Amber sunflower', icon: '🌻', seedPrice: 4, sellPrice: 9, base: 'sunflower', color: 0xf4a54c},
    {id: 'cream-sunflower', name: 'Cream sunflower', icon: '🌻', seedPrice: 4, sellPrice: 9, base: 'sunflower', color: 0xffe8b6},
    {id: 'rose-sunflower', name: 'Rose sunflower', icon: '🌻', seedPrice: 5, sellPrice: 11, base: 'sunflower', color: 0xcf7d88},
    {id: 'white-cosmos', name: 'Pearl cosmos', icon: '🌸', seedPrice: 4, sellPrice: 9, base: 'cosmos', color: 0xfff3eb},
    {id: 'coral-cosmos', name: 'Coral cosmos', icon: '🌸', seedPrice: 4, sellPrice: 9, base: 'cosmos', color: 0xf58c7d},
    {id: 'purple-cosmos', name: 'Berry cosmos', icon: '🌸', seedPrice: 5, sellPrice: 11, base: 'cosmos', color: 0xb778bd},
    {id: 'pink-lavender', name: 'Pink lavender', icon: '🪻', seedPrice: 4, sellPrice: 9, base: 'lavender', color: 0xe0a7c9},
    {id: 'blue-lavender', name: 'Blue lavender', icon: '🪻', seedPrice: 5, sellPrice: 10, base: 'lavender', color: 0x85a4df},
    {id: 'white-lavender', name: 'Snow lavender', icon: '🪻', seedPrice: 5, sellPrice: 11, base: 'lavender', color: 0xe7e8e1},
    {id: 'pink-tulip', name: 'Pink tulip', icon: '🌷', seedPrice: 4, sellPrice: 9, base: 'tulip', color: 0xe887b0},
    {id: 'lemon-tulip', name: 'Lemon tulip', icon: '🌷', seedPrice: 5, sellPrice: 10, base: 'tulip', color: 0xf3d55e},
    {id: 'purple-tulip', name: 'Plum tulip', icon: '🌷', seedPrice: 5, sellPrice: 11, base: 'tulip', color: 0xa97ac7},
    {id: 'peach-poppy', name: 'Apricot poppy', icon: '🏵️', seedPrice: 5, sellPrice: 10, base: 'poppy', color: 0xf5b987},
    {id: 'white-poppy', name: 'Cloud poppy', icon: '🏵️', seedPrice: 5, sellPrice: 11, base: 'poppy', color: 0xfff1da},
    {id: 'pink-poppy', name: 'Candy poppy', icon: '🏵️', seedPrice: 5, sellPrice: 12, base: 'poppy', color: 0xef8cb8}
  ];
  const seedTiers = {
    common: {encounterChance: .28, weights: {common: .80, rare: .17, special: .03}},
    uncommon: {encounterChance: .32, weights: {common: .60, rare: .32, special: .08}},
    rare: {encounterChance: .38, weights: {common: .43, rare: .42, special: .15}},
    special: {encounterChance: .45, weights: {common: .25, rare: .45, special: .30}}
  };
  const seedRarities = {
    'pink-daisy': ['uncommon', 8, 13], 'blue-daisy': ['rare', 10, 16],
    'peach-daisy': ['uncommon', 8, 13], 'amber-sunflower': ['uncommon', 8, 14],
    'cream-sunflower': ['rare', 10, 17], 'rose-sunflower': ['rare', 11, 18],
    'white-cosmos': ['rare', 10, 17], 'coral-cosmos': ['uncommon', 9, 15],
    'purple-cosmos': ['special', 18, 28], 'pink-lavender': ['rare', 11, 18],
    'blue-lavender': ['rare', 12, 20], 'white-lavender': ['special', 20, 30],
    'pink-tulip': ['rare', 10, 17], 'lemon-tulip': ['uncommon', 10, 16],
    'purple-tulip': ['special', 24, 36], 'peach-poppy': ['uncommon', 10, 16],
    'white-poppy': ['rare', 12, 20], 'pink-poppy': ['special', 22, 33]
  };
  const flowers = baseFlowers.map(flower => {
    const [rarity, seedPrice, sellPrice] = seedRarities[flower.id]
      || ['common', flower.seedPrice, flower.sellPrice];
    return {...flower, rarity, seedPrice, sellPrice, encounterChance: seedTiers[rarity].encounterChance};
  });

  const outfitStyles = [
    ['pink', 'Pink', '🩷', 0], ['mint', 'Mint', '💚', 0], ['lilac', 'Lilac', '💜', 0],
    ['peach', 'Peach', '🍑', 18], ['sky', 'Sky', '🩵', 22], ['rose', 'Rose', '🌹', 28],
    ['lemon', 'Lemon', '🍋', 20], ['berry', 'Berry', '🫐', 24], ['meadow', 'Meadow', '🌿', 24],
    ['ocean', 'Ocean', '🌊', 26], ['coral', 'Coral', '🪸', 26], ['plum', 'Plum', '🟣', 28],
    ['sunflower', 'Sunflower', '🌻', 30], ['strawberry', 'Strawberry', '🍓', 32],
    ['rainbow', 'Rainbow', '🌈', 40], ['daisy', 'Daisy', '🌼', 30], ['denim', 'Denim', '👖', 28],
    ['lavender', 'Lavender', '🪻', 34], ['buttercup', 'Buttercup', '🧈', 32], ['woodland', 'Woodland', '🍂', 36]
  ];
  const hatStyles = [
    ['straw', 'Straw hat', '👒', 0], ['flower', 'Flower hat', '🌸', 0], ['none', 'No hat', '✦', 0],
    ['bow', 'Ribbon hat', '🎀', 16], ['bee', 'Bumblebee hat', '🐝', 25],
    ['sunflower', 'Sunflower hat', '🌻', 28], ['strawberry', 'Strawberry hat', '🍓', 30],
    ['rainbow', 'Rainbow hat', '🌈', 38], ['bunny', 'Bunny hat', '🐰', 35], ['kitty', 'Kitty hat', '🐱', 35],
    ['beret', 'Artist beret', '🎨', 24], ['cap', 'Garden cap', '🧢', 20], ['daisy', 'Daisy hat', '🌼', 25],
    ['leaf', 'Leaf hat', '🍃', 26], ['crown', 'Flower crown', '👑', 42], ['moon', 'Moon hat', '🌙', 40],
    ['mushroom', 'Mushroom hat', '🍄', 32], ['butterfly', 'Butterfly hat', '🦋', 34],
    ['pom', 'Pom-pom hat', '🧶', 28], ['bonnet', 'Garden bonnet', '🌺', 30]
  ];
  const dressStyles = new Set(['peach', 'rose', 'berry', 'daisy', 'lavender', 'buttercup']);
  const apronStyles = new Set(['meadow', 'sunflower', 'strawberry', 'woodland']);
  const items = [
    ...outfitStyles.map(([value, name, icon, price]) => {
      const garment = dressStyles.has(value) ? 'dress' : apronStyles.has(value) ? 'apron' : 'overalls';
      return {id: 'outfit-' + value, type: 'outfit', key: 'outfit', value, name: name + ' ' + garment, icon, price, free: price === 0};
    }),
    ...hatStyles.map(([value, name, icon, price]) => ({id: 'hat-' + value, type: 'hat', key: 'hat', value, name, icon, price, free: price === 0})),
    {id: 'decor-birdbath', type: 'decor', value: 'birdbath', name: 'Birdbath', icon: '⛲', price: 15},
    {id: 'decor-house', type: 'decor', value: 'house', name: 'Bunny cottage', icon: '🏡', price: 22},
    {id: 'decor-lanterns', type: 'decor', value: 'lanterns', name: 'Flower lanterns', icon: '🏮', price: 25},
    {id: 'decor-pond', type: 'decor', value: 'pond', name: 'Lily pond corner', icon: '🪷', price: 35},
    {id: 'decor-butterfly', type: 'decor', value: 'butterfly', name: 'Butterfly patch', icon: '🦋', price: 35}
  ];
  const animalStyles = [
    ['butterfly', 'Butterfly', '🦋', 'butterfly', 0xe89abb, 'common', 'daisy', 1],
    ['rabbit', 'Bunny', '🐰', 'rabbit', 0xfff1e4, 'common', 'tulip', 3],
    ['bird', 'Bluebird', '🐦', 'bird', 0x6ba7df, 'common', 'sunflower', 6],
    ['squirrel', 'Squirrel', '🐿️', 'squirrel', 0xb77849, 'common', 'poppy', 9],
    ['ladybug', 'Ladybug', '🐞', 'ladybug', 0xe86862, 'common', 'cosmos', 12],
    ['golden-rabbit', 'Golden bunny', '🐰', 'rabbit', 0xf2c967, 'special', 'daisy'],
    ['snow-rabbit', 'Snow bunny', '🐰', 'rabbit', 0xe8f2f3, 'rare', 'white-lavender'],
    ['rose-rabbit', 'Rose bunny', '🐰', 'rabbit', 0xeeb3bf, 'rare', 'pink-tulip'],
    ['caramel-rabbit', 'Caramel bunny', '🐰', 'rabbit', 0xc79163, 'common', 'peach-daisy'],
    ['lilac-bird', 'Lilac bird', '🐦', 'bird', 0xb59bdc, 'special', 'lavender'],
    ['robin', 'Little robin', '🐦', 'bird', 0xc7836c, 'common', 'amber-sunflower'],
    ['canary', 'Canary', '🐦', 'bird', 0xe8ce68, 'rare', 'lemon-tulip'],
    ['mint-bird', 'Mint bird', '🐦', 'bird', 0x8bc8b1, 'rare', 'blue-lavender'],
    ['blue-butterfly', 'Blue butterfly', '🦋', 'butterfly', 0x71b9e6, 'special', 'cosmos'],
    ['sunset-butterfly', 'Sunset butterfly', '🦋', 'butterfly', 0xf3a56c, 'rare', 'coral-cosmos'],
    ['lemon-butterfly', 'Lemon butterfly', '🦋', 'butterfly', 0xead56f, 'common', 'cream-sunflower'],
    ['pearl-butterfly', 'Pearl butterfly', '🦋', 'butterfly', 0xf4e6ed, 'rare', 'white-cosmos'],
    ['red-squirrel', 'Red squirrel', '🐿️', 'squirrel', 0xbe7554, 'common', 'rose-sunflower'],
    ['cream-squirrel', 'Cream squirrel', '🐿️', 'squirrel', 0xe8d6af, 'rare', 'cream-sunflower'],
    ['gray-squirrel', 'Silver squirrel', '🐿️', 'squirrel', 0xa8aab1, 'rare', 'blue-daisy'],
    ['golden-ladybug', 'Golden ladybug', '🐞', 'ladybug', 0xe6bc59, 'special', 'sunflower'],
    ['rose-ladybug', 'Rose ladybug', '🐞', 'ladybug', 0xe4a7bd, 'common', 'pink-daisy'],
    ['blue-ladybug', 'Blue ladybug', '🐞', 'ladybug', 0x93b5da, 'rare', 'blue-daisy'],
    ['ginger-cat', 'Ginger kitten', '🐱', 'cat', 0xd69a6b, 'common', 'peach-poppy'],
    ['calico-cat', 'Calico kitten', '🐱', 'cat', 0xd4b49a, 'rare', 'peach-daisy'],
    ['white-cat', 'Snow kitten', '🐱', 'cat', 0xf0e9dc, 'common', 'white-poppy'],
    ['midnight-cat', 'Midnight kitten', '🐱', 'cat', 0x6b687d, 'special', 'purple-tulip'],
    ['red-fox', 'Red fox', '🦊', 'fox', 0xd18a57, 'common', 'amber-sunflower'],
    ['arctic-fox', 'Arctic fox', '🦊', 'fox', 0xe8e7e1, 'rare', 'white-lavender'],
    ['blossom-fox', 'Blossom fox', '🦊', 'fox', 0xe3b0c0, 'rare', 'pink-lavender'],
    ['desert-fox', 'Desert fox', '🦊', 'fox', 0xd8bb83, 'common', 'lemon-tulip'],
    ['moss-turtle', 'Moss turtle', '🐢', 'turtle', 0x86a571, 'common', 'tulip'],
    ['sun-turtle', 'Sun turtle', '🐢', 'turtle', 0xc8ae68, 'rare', 'cream-sunflower'],
    ['pond-turtle', 'Pond turtle', '🐢', 'turtle', 0x83b5a8, 'rare', 'blue-lavender'],
    ['chestnut-hedgehog', 'Chestnut hedgehog', '🦔', 'hedgehog', 0xa98367, 'common', 'poppy'],
    ['honey-hedgehog', 'Honey hedgehog', '🦔', 'hedgehog', 0xc5a069, 'rare', 'peach-poppy'],
    ['rose-hedgehog', 'Rose hedgehog', '🦔', 'hedgehog', 0xc997a5, 'rare', 'pink-poppy'],
    ['yellow-duck', 'Sunshine duck', '🦆', 'duck', 0xe8cd6b, 'common', 'lemon-tulip'],
    ['mallard-duck', 'Mallard duck', '🦆', 'duck', 0x7aaf95, 'rare', 'lavender'],
    ['snow-duck', 'Snow duck', '🦆', 'duck', 0xf4eee2, 'common', 'white-cosmos'],
    ['lily-frog', 'Lily frog', '🐸', 'frog', 0x91b878, 'common', 'pink-tulip'],
    ['mint-frog', 'Mint frog', '🐸', 'frog', 0x85c3af, 'rare', 'blue-daisy'],
    ['lemon-frog', 'Lemon frog', '🐸', 'frog', 0xd0cd70, 'rare', 'peach-daisy'],
    ['honey-bee', 'Honeybee', '🐝', 'bee', 0xe6bc62, 'common', 'coral-cosmos'],
    ['blue-bee', 'Blue orchard bee', '🐝', 'bee', 0x87adcc, 'special', 'blue-lavender'],
    ['pink-bee', 'Pink garden bee', '🐝', 'bee', 0xdba7bc, 'rare', 'pink-lavender'],
    ['moon-rabbit', 'Moon bunny', '🐰', 'rabbit', 0xcac6e2, 'special', 'purple-tulip'],
    ['lilac-cat', 'Lilac kitten', '🐱', 'cat', 0xb7a0cb, 'special', 'purple-cosmos'],
    ['peach-bird', 'Peach bird', '🐦', 'bird', 0xe8b393, 'rare', 'peach-poppy'],
    ['emerald-butterfly', 'Emerald butterfly', '🦋', 'butterfly', 0x7dbca5, 'special', 'pink-poppy']
  ];
  const animals = animalStyles.map(([id, name, icon, base, color, rarity, seed, blooms]) => ({
    id, name, icon, base, color, rarity, seed, seeds: [seed], blooms,
    weight: {common: 6, rare: 3, special: 1}[rarity]
  }));
  const flowerById = new Map(flowers.map(flower => [flower.id, flower]));
  const itemById = new Map(items.map(item => [item.id, item]));
  const animalById = new Map(animals.map(animal => [animal.id, animal]));
  const starterItems = items.filter(item => item.free).map(item => item.id);
  const validItems = new Set([...starterItems, ...items.map(item => item.id)]);
  const number = (value, fallback = 0) => Number.isSafeInteger(value) && value >= 0 ? value : fallback;
  const quantityValid = value => Number.isSafeInteger(value) && value > 0;
  const failure = message => ({ok: false, message});

  function init(state, {newGarden = false} = {}) {
    const previous = state.economy && typeof state.economy === 'object' ? state.economy : {};
    const migrated = previous.version === 1;
    const owned = Array.isArray(previous.owned) ? previous.owned.filter(id => validItems.has(id)) : [];
    const known = Array.isArray(previous.animals) ? previous.animals.filter(id => animalById.has(id)) : [];
    const wallet = {
      version: 1,
      coins: number(previous.coins, 24),
      seeds: {},
      bag: {},
      owned: [...new Set([...starterItems, ...owned])],
      animals: [...new Set(known)],
      discoveryMisses: {},
      care: {},
      names: {},
      requestGeneration: number(previous.requestGeneration),
      deliveries: number(previous.deliveries),
      sold: number(previous.sold)
    };
    for (const {id, rarity} of flowers) {
      const starterSeeds = newGarden && !migrated ? (rarity === 'common' ? 3 : rarity === 'uncommon' ? 1 : 0) : 3;
      wallet.seeds[id] = number(previous.seeds?.[id], starterSeeds);
      wallet.bag[id] = number(previous.bag?.[id], migrated ? 0 : number(state.counts?.[id]));
      wallet.discoveryMisses[id] = Math.min(4, number(previous.discoveryMisses?.[id]));
    }
    for (const {id} of animals) {
      wallet.care[id] = {
        count: number(previous.care?.[id]?.count),
        lastBloom: Number.isSafeInteger(previous.care?.[id]?.lastBloom) ? previous.care[id].lastBloom : -1
      };
      if (typeof previous.names?.[id] === 'string') wallet.names[id] = previous.names[id].trim().slice(0, 24);
    }
    // Existing gardeners keep clothes they were already wearing before the shop arrived.
    for (const key of ['outfit', 'hat']) {
      const id = key + '-' + state.outfit?.[key];
      if (!migrated && validItems.has(id) && !wallet.owned.includes(id)) wallet.owned.push(id);
    }
    state.economy = wallet;

    function syncMilestones() {
      for (const {id, blooms} of animals) {
        if (blooms && number(state.blooms) >= blooms && !wallet.animals.includes(id)) wallet.animals.push(id);
      }
    }
    syncMilestones();

    function earn(amount) {
      if (!quantityValid(amount) || !Number.isSafeInteger(wallet.coins + amount)) return failure('That amount cannot be added.');
      wallet.coins += amount;
      return {ok: true, coins: amount};
    }

    function buySeed(kind, quantity = 1) {
      const flower = flowerById.get(kind);
      if (!flower || !quantityValid(quantity)) return failure('Choose a seed and an amount.');
      const price = flower.seedPrice * quantity;
      if (!Number.isSafeInteger(price) || !Number.isSafeInteger(wallet.seeds[kind] + quantity)) return failure('Choose a smaller amount.');
      if (wallet.coins < price) return failure('Grow and sell flowers to earn more coins.');
      wallet.coins -= price;
      wallet.seeds[kind] += quantity;
      return {ok: true, kind, quantity, coins: -price};
    }

    function plant(kind) {
      if (!flowerById.has(kind)) return failure('Choose a flower to plant.');
      if (wallet.seeds[kind] < 1) return failure('Visit the seed shop for more seeds.');
      wallet.seeds[kind]--;
      return {ok: true, kind};
    }

    function harvest(kind) {
      if (!flowerById.has(kind)) return failure('Choose a flower to pick.');
      if (!Number.isSafeInteger(wallet.bag[kind] + 1)) return failure('Your flower basket is full.');
      wallet.bag[kind]++;
      return {ok: true, kind, quantity: 1};
    }

    function sell(kind, quantity = 1) {
      const flower = flowerById.get(kind);
      if (!flower || !quantityValid(quantity)) return failure('Choose flowers to sell.');
      if (wallet.bag[kind] < quantity) return failure('Pick a few more flowers first.');
      const coins = flower.sellPrice * quantity;
      if (!Number.isSafeInteger(coins) || !Number.isSafeInteger(wallet.coins + coins)
          || !Number.isSafeInteger(wallet.sold + quantity)) return failure('Choose a smaller amount.');
      wallet.bag[kind] -= quantity;
      wallet.coins += coins;
      wallet.sold += quantity;
      return {ok: true, kind, quantity, coins};
    }

    function buyItem(id) {
      const item = itemById.get(id);
      if (!item) return failure('Choose an item in the shop.');
      if (wallet.owned.includes(id)) return failure('You already own this.');
      if (wallet.coins < item.price) return failure('Grow and sell flowers to earn more coins.');
      wallet.coins -= item.price;
      wallet.owned.push(id);
      return {ok: true, item, coins: -item.price};
    }

    function request() {
      const generation = wallet.requestGeneration;
      const flower = flowers[generation % 6];
      const quantity = 1 + Math.floor(generation / 6) % 3;
      const animal = animals[generation % 5];
      return {
        generation, animalId: animal.id, animalName: wallet.names[animal.id] || animal.name,
        icon: animal.icon, kind: flower.id, quantity,
        reward: flower.sellPrice * quantity + 3,
        available: wallet.bag[flower.id], ready: wallet.bag[flower.id] >= quantity
      };
    }

    function completeRequest(expectedGeneration) {
      const current = request();
      if (expectedGeneration !== current.generation) return failure('That bouquet has already been delivered.');
      if (!current.ready) return failure('Pick the flowers for this bouquet first.');
      if (!Number.isSafeInteger(wallet.coins + current.reward)
          || !Number.isSafeInteger(wallet.requestGeneration + 1)
          || !Number.isSafeInteger(wallet.deliveries + 1)) return failure('This delivery cannot be completed.');
      wallet.bag[current.kind] -= current.quantity;
      wallet.coins += current.reward;
      wallet.requestGeneration++;
      wallet.deliveries++;
      return {ok: true, request: current, coins: current.reward};
    }

    function care(id) {
      if (!wallet.animals.includes(id)) return failure('Discover this friend in the garden first.');
      const record = wallet.care[id];
      const blooms = number(state.blooms);
      if (record.lastBloom === blooms) return {ok: true, coins: 0, message: 'Your friend feels loved! Grow a flower, then visit again.'};
      if (!Number.isSafeInteger(wallet.coins + 1) || !Number.isSafeInteger(record.count + 1)) return failure('Your friend is happy to see you.');
      record.lastBloom = blooms;
      record.count++;
      wallet.coins++;
      return {ok: true, coins: 1, message: 'Your friend feels loved! +1 coin'};
    }

    function namePet(id, name) {
      if (!wallet.animals.includes(id)) return failure('Discover this friend in the garden first.');
      if (typeof name !== 'string') return failure('Choose a little name for your friend.');
      const value = name.trim().slice(0, 24);
      wallet.names[id] = value;
      return {ok: true, name: value || animalById.get(id).name};
    }

    function bloom(kind) {
      const flower = flowerById.get(kind);
      if (!flower) return failure('Choose a flower to grow.');
      const before = new Set(wallet.animals);
      syncMilestones();
      wallet.discoveryMisses[kind]++;
      const odds = discoveryOdds(kind);
      const encountered = wallet.discoveryMisses[kind] >= 5 || Math.random() < odds.encounterChance;
      let result = null;
      let duplicate = null;
      if (encountered) {
        wallet.discoveryMisses[kind] = 0;
        const pool = eligibleAnimals(kind);
        const tierDraw = Math.random();
        let cumulative = 0;
        let chosenTier = 'common';
        for (const tier of ['common', 'rare', 'special']) {
          cumulative += odds.tiers[tier];
          if (tierDraw < cumulative) {
            chosenTier = tier;
            break;
          }
        }
        const candidates = pool.filter(animal => animal.rarity === chosenTier);
        // Float rounding at the final boundary still selects a valid eligible friend.
        const available = candidates.length ? candidates : pool;
        const picked = available[Math.min(available.length - 1, Math.floor(Math.random() * available.length))];
        if (wallet.animals.includes(picked.id)) duplicate = picked.id;
        else {
          wallet.animals.push(picked.id);
          result = picked.id;
        }
      }
      return {
        ok: true,
        animal: result || wallet.animals.find(id => !before.has(id)) || null,
        animals: wallet.animals.filter(id => !before.has(id)),
        duplicate,
        encountered
      };
    }

    return {data: wallet, earn, buySeed, plant, harvest, sell, buyItem, request, completeRequest, care, namePet, bloom};
  }

  function eligibleAnimals(kind) {
    return animals.filter(animal => animal.blooms || animal.seeds.includes(kind));
  }

  function discoveryOdds(kind) {
    const flower = flowerById.get(kind);
    if (!flower) return null;
    const settings = seedTiers[flower.rarity];
    const pool = eligibleAnimals(kind);
    const availableTiers = new Set(pool.map(animal => animal.rarity));
    const total = Object.entries(settings.weights).reduce((sum, [tier, weight]) => sum + (availableTiers.has(tier) ? weight : 0), 0);
    const tiers = Object.fromEntries(Object.entries(settings.weights).map(([tier, weight]) => [
      tier, availableTiers.has(tier) ? weight / total : 0
    ]));
    const rareChance = settings.encounterChance * (tiers.rare + tiers.special);
    return {
      encounterChance: settings.encounterChance,
      tiers,
      rareChance,
      description: Math.round(settings.encounterChance * 100) + '% animal encounter chance; '
        + Math.round(rareChance * 1000) / 10 + '% rare or special chance per bloom. '
        + 'After four blooms without an encounter, the next bloom brings an animal. An animal you already own can visit again.'
    };
  }

  window.GardenEconomy = {flowers, items, animals, discoveryOdds, discoveryChance: .28, guaranteedBloom: 5, init};
})();
