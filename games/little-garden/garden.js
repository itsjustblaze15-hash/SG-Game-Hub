(() => {
  const $ = id => document.getElementById(id);
  if (!window.gardenPhone) {
    $('phone-only').hidden = false;
    return;
  }

  const flowers = GardenEconomy.flowers;
  const species = new Map(flowers.map(flower => [flower.id, flower]));
  const storageKey = 'sg-little-garden-v1';
  const tips = {
    plant: 'Tap an empty garden bed.',
    water: 'Tap a plant or sweep across several beds.',
    pick: 'Tap a flower that has opened.'
  };
  let newGarden = false;
  const state = load();
  const economy = GardenEconomy.init(state, {newGarden});
  const previousOwned = new Set(state.economy.owned);
  const previews = createGardenPreviews();
  const canvas = $('world');
  const gardenView = canvas.parentElement;
  const beds = $('beds');
  const bedButtons = [];
  const plotModels = [];
  const vaseModels = [];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let world;
  let residents;
  let residentCount = -1;
  let playing = false;
  let avatar;
  let wardrobeView;
  let activities;
  let frame;
  let tool = 'plant';
  let seed = flowers[0].id;
  let audio;
  let gesture;
  let pickRay;
  let pickPoint;

  function load() {
    let saved;
    try {
      const raw = localStorage.getItem(storageKey);
      newGarden = raw === null;
      saved = JSON.parse(raw);
    } catch { newGarden = true; }
    const counts = Object.fromEntries(flowers.map(({id}) => [id,
      Number.isSafeInteger(saved?.counts?.[id]) && saved.counts[id] >= 0 ? saved.counts[id] : 0
    ]));
    const plots = Array.from({length: 8}, (_, index) => {
      const plot = saved?.plots?.[index];
      return species.has(plot?.kind) && [0, 1, 2].includes(plot.stage) ? {kind: plot.kind, stage: plot.stage} : null;
    });
    const collected = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const blooms = Number.isSafeInteger(saved?.blooms) ? Math.max(collected, saved.blooms) : collected;
    const vase = (Array.isArray(saved?.vase) ? saved.vase : []).filter(id => counts[id] > 0);
    const outfit = {style:'curls', hair:'brown', outfit:'pink', hat:'straw', ...saved?.outfit};
    const solved = Number.isSafeInteger(saved?.solved) ? Math.max(0, saved.solved) : 0;
    const area = ['garden','pond','butterfly'].includes(saved?.area) ? saved.area : 'garden';
    const knownFlowers = Array.isArray(saved?.knownFlowers)
      ? saved.knownFlowers.filter(id => species.has(id))
      : flowers.filter(({id}) => counts[id] > 0 || plots.some(plot => plot?.kind === id && plot.stage === 2)).map(({id}) => id);
    const pendingUnlocks = Array.isArray(saved?.pendingUnlocks) ? saved.pendingUnlocks.filter(item => item && typeof item.key === 'string' && typeof item.id === 'string') : [];
    const seenUnlocks = Array.isArray(saved?.seenUnlocks) ? saved.seenUnlocks.filter(key => typeof key === 'string') : [];
    return {knownFlowers, pendingUnlocks, seenUnlocks, plots, counts, blooms, vase: [...new Set(vase)].slice(0,6), sound: saved?.sound === true, outfit, solved, economy:saved?.economy, area, companion:saved?.companion};
  }

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch {}
  }

  function cue(notes) {
    if (!state.sound) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      audio ||= new Audio();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      const start = audio.currentTime;
      for (const [index, note] of notes.entries()) {
        const oscillator = audio.createOscillator();
        const volume = audio.createGain();
        const time = start + index * .1;
        oscillator.type = 'sine';
        oscillator.frequency.value = note;
        volume.gain.setValueAtTime(.001, time);
        volume.gain.exponentialRampToValueAtTime(.065, time + .02);
        volume.gain.exponentialRampToValueAtTime(.001, time + .24);
        oscillator.connect(volume).connect(audio.destination);
        oscillator.start(time);
        oscillator.stop(time + .26);
      }
    } catch {}
  }

  function showMessage(message) {
    $('guide').textContent = message;
  }

  function sparkle(index, symbol) {
    if (reducedMotion.matches) return;
    const effect = $('effect');
    const box = bedButtons[index].getBoundingClientRect();
    const area = beds.getBoundingClientRect();
    effect.textContent = symbol;
    effect.style.left = (box.left - area.left + box.width / 2) + 'px';
    effect.style.top = (box.top - area.top + box.height / 2) + 'px';
    effect.classList.remove('pop');
    void effect.offsetWidth;
    effect.classList.add('pop');
  }

  function selectTool(next) {
    tool = next;
    for (const button of document.querySelectorAll('[data-tool]')) {
      button.setAttribute('aria-pressed', String(button.dataset.tool === tool));
    }
    $('seeds').hidden = tool !== 'plant';
    $('tool-tip').hidden = tool === 'plant';
    $('tool-tip').textContent = tool === 'water' ? 'Water a seed, then water the sprout to bloom.' : 'Picked flowers go in your basket. Sell them at the shop or deliver a request.';
    showMessage(tips[tool]);
  }

  function layout() {
    if (!world) return;
    const { width, height } = gardenView.getBoundingClientRect();
    if (!width || !height) return;
    world.resize(width, height);
    const project = point => {
      const projected = point.clone().project(world.camera);
      return [(projected.x + 1) * width / 2, (1 - projected.y) * height / 2];
    };
    const centers = world.plots.map(project);
    const horizontal = Math.abs(centers[1][0] - centers[0][0]);
    const vertical = Math.abs(centers[4][1] - centers[0][1]);
    const hitWidth = Math.max(44, Math.min(140, horizontal * .92));
    const hitHeight = Math.max(44, Math.min(110, vertical * .92));
    bedButtons.forEach((button, index) => {
      const [x, y] = centers[index];
      Object.assign(button.style, {
        left: x + 'px',
        top: (y - Math.min(8, hitHeight * .12)) + 'px',
        width: hitWidth + 'px',
        height: hitHeight + 'px'
      });
    });
  }

  function updatePlot(index) {
    const plot = state.plots[index];
    const button = bedButtons[index];
    const label = plot ? [species.get(plot.kind).name + ' seed', species.get(plot.kind).name + ' sprout', species.get(plot.kind).name + ' in bloom'][plot.stage] : 'Empty bed';
    button.setAttribute('aria-label', label + ', bed ' + (index + 1));
    if (!world) {
      button.textContent = !plot ? '·' : ['🫘', '🌱', species.get(plot.kind).icon][plot.stage];
      return;
    }
    if (plotModels[index]) world.scene.remove(plotModels[index]);
    plotModels[index] = null;
    if (plot) {
      const model = GardenCollectionModels.flower(species.get(plot.kind), plot.stage, index);
      model.position.copy(world.plots[index]);
      model.rotation.y = (index % 3 - 1) * .28;
      plotModels[index] = model;
      world.scene.add(model);
    }
  }

  function updateVase() {
    $('bouquet-count').textContent = Object.values(state.counts).reduce((sum, count) => sum + count, 0);
    if (!world?.vase) return;
    for (const model of vaseModels) world.scene.remove(model);
    vaseModels.length = 0;
    state.vase.forEach((kind, index) => {
      const model = GardenCollectionModels.flower(species.get(kind), 2, index + 6);
      model.scale.setScalar(.31);
      model.position.copy(world.vase);
      model.position.x += (index % 2 ? .08 : -.08);
      model.position.z += index >= 2 ? -.05 : .05;
      model.rotation.z = [.27, -.3, .45, -.45, .59, -.59][index];
      model.rotation.y = index * .7;
      world.scene.add(model);
      vaseModels.push(model);
    });
  }

  function updateVisitors() {
    if (!residents) return;
    residents.sync(state.economy.animals);
    if (residentCount !== state.economy.animals.length) {
      residentCount = state.economy.animals.length;
      const bounds = new THREE.Box3();
      for (const home of residents.getHomes().values()) {
        bounds.expandByPoint(home.position.clone().add(new THREE.Vector3(-.58, -.065, -.58)));
        bounds.expandByPoint(home.position.clone().add(new THREE.Vector3(.58, 1.2, .58)));
      }
      world.setResidentBounds(bounds.isEmpty() ? null : bounds);
      layout();
    }
  }

  function setCompanion(id) {
    if (!residents || !residents.focus(id)) return;
    state.companion = id;
    save();
  }

  function updateAvatar() {
    if (world) {
      if (avatar) {
        world.scene.remove(avatar);
        avatar.userData.dispose?.();
      }
      avatar = createGardenAvatar(state.outfit);
      avatar.position.copy(world.avatarSpot);
      avatar.rotation.y = .28;
      avatar.scale.setScalar(1.1);
      world.scene.add(avatar);
    }

  }

  const unlocks = createGardenUnlocks({
    onContinue: item => {
      if (item.type === 'animal') setCompanion(item.id);
      state.pendingUnlocks = state.pendingUnlocks.filter(pending => pending.key !== item.key);
      if (!state.seenUnlocks.includes(item.key)) state.seenUnlocks.push(item.key);
      save();
    }
  });

  function enqueueUnlock(type, id) {
    const key = type + ':' + id;
    if (state.seenUnlocks.includes(key) || state.pendingUnlocks.some(item => item.key === key)) return;
    state.pendingUnlocks.push({key, type, id});
    save();
  }

  function showPendingUnlocks() {
    if (!playing) return;
    const items = [];
    state.pendingUnlocks = state.pendingUnlocks.filter(item => {
      const catalog = item.type === 'animal' ? GardenEconomy.animals : item.type === 'flower' ? flowers : GardenEconomy.items;
      const definition = catalog.find(definition => definition.id === item.id);
      if (!definition || state.seenUnlocks.includes(item.key)) return false;
      items.push({...item, definition,
        title: item.type === 'flower' ? 'Your first ' + definition.name.toLowerCase() + ' bloom!' : undefined,
        message: item.type === 'animal' ? 'A little home in your garden is ready for this friend.'
          : item.type === 'flower' ? 'A new flower for your collection!' : 'A lovely new addition to your garden!'});
      return true;
    });
    unlocks.enqueue(items);
  }

  function sync() {
    $('coins').textContent = state.economy.coins;
    for (const button of $('seeds').children) {
      const flower = species.get(button.dataset.seed);
      button.querySelector('small').textContent = state.economy.seeds[flower.id] + ' owned · ' + flower.rarity;
    }
    world?.setDecor(state.economy.owned);
    if (state.area !== 'garden' && !state.economy.owned.includes('decor-' + state.area)) state.area = 'garden';
    world?.setArea(state.area);
    updateVisitors();
    updateVase();
    for (const id of state.economy.owned) {
      if (previousOwned.has(id)) continue;
      previousOwned.add(id);
      enqueueUnlock('item', id);
    }
    activities?.refresh();
    save();
    showPendingUnlocks();
  }

  function tend(index, showHints = true) {
    const plot = state.plots[index];
    if (tool === 'plant' && !plot) {
      const flower = species.get(seed);
      const result = economy.plant(seed);
      if (!result.ok) { showMessage(result.message); return; }
      state.plots[index] = {kind: seed, stage: 0};
      showMessage(flower.name + ' planted! Give it some water.');
      sparkle(index, '🌱');
      cue([440, 550]);
    } else if (tool === 'water' && plot && plot.stage < 2) {
      plot.stage++;
      if (plot.stage === 2) {
        state.blooms++;
        const discovery = economy.bloom(plot.kind);
        const friend = GardenEconomy.animals.find(animal => animal.id === discovery.animal);
        showMessage(friend ? 'New friend! ' + friend.name + ' found you!' : species.get(plot.kind).name + ' in bloom!');
        for (const id of discovery.animals) enqueueUnlock('animal', id);
        if (!state.knownFlowers.includes(plot.kind)) {
          state.knownFlowers.push(plot.kind);
          enqueueUnlock('flower', plot.kind);
        }
        sparkle(index, '✨');
        cue([523, 659, 784]);
        updateVisitors();
      } else {
        showMessage('A little sprout! Water it once more.');
        sparkle(index, '💧');
        cue([660, 880]);
      }
    } else if (tool === 'pick' && plot?.stage === 2) {
      const harvest = economy.harvest(plot.kind);
      if (!harvest.ok) { showMessage(harvest.message); return; }
      state.counts[plot.kind]++;
      if (!state.vase.includes(plot.kind)) state.vase = [...state.vase.slice(-5), plot.kind];
      state.plots[index] = null;
      showMessage('A ' + species.get(plot.kind).name.toLowerCase() + ' for your basket! Sell it or make a bouquet.');
      sparkle(index, species.get(plot.kind).icon);
      cue([587, 740, 880]);
      updateVase();
    } else {
      if (!showHints) return;
      if (!plot && tool === 'water') showMessage('Plant a seed first.');
      else if (tool === 'water') showMessage('This flower is ready to pick.');
      else if (tool === 'pick') showMessage(plot ? 'Water it until it blooms.' : 'Choose an open flower.');
      else showMessage('Try an empty bed.');
      return;
    }
    const celebration = tool === 'plant' ? 'plant' : tool === 'pick' ? 'pick' : state.plots[index].stage === 2 ? 'bloom' : 'water';
    if (world) world.celebrate(world.plots[index], celebration);
    updatePlot(index);
    sync();
  }

  function render(time) {
    const seconds = reducedMotion.matches ? 0 : time / 1000;
    world.update(seconds);
    residents?.update(seconds);
    unlocks.update(seconds);
    avatar?.userData.animate?.(seconds);
    wardrobeView?.update(seconds);
    previews.update(seconds);
    for (const model of plotModels) {
      if (model) model.rotation.z = Math.sin(seconds * 1.4 + model.position.x) * .025;
    }
    world.renderer.render(world.scene, world.camera);
    frame = requestAnimationFrame(render);
  }

  function bedAtPointer(event) {
    if (world && tool === 'pick') {
      const area = beds.getBoundingClientRect();
      pickPoint.set((event.clientX - area.left) / area.width * 2 - 1,
        1 - (event.clientY - area.top) / area.height * 2);
      pickRay.setFromCamera(pickPoint, world.camera);
      const blooms = plotModels.filter((model, index) => model && state.plots[index]?.stage === 2);
      const hit = pickRay.intersectObjects(blooms, true)[0];
      if (hit) {
        let model = hit.object;
        while (model.parent !== world.scene) model = model.parent;
        return plotModels.indexOf(model);
      }
    }
    const button = document.elementFromPoint(event.clientX, event.clientY)?.closest('.bed');
    return button && beds.contains(button) ? Number(button.dataset.bed) : -1;
  }

  function useAtPointer(event, showHints) {
    const index = bedAtPointer(event);
    if (index < 0) return;
    if (gesture.visited.has(index)) return;
    gesture.visited.add(index);
    tend(index, showHints);
  }

  beds.addEventListener('pointerdown', event => {
    if (gesture || event.button !== 0) return;
    event.preventDefault();
    beds.setPointerCapture(event.pointerId);
    gesture = {id: event.pointerId, visited: new Set()};
    useAtPointer(event, true);
  });
  beds.addEventListener('pointermove', event => {
    if (gesture?.id === event.pointerId && tool === 'water') useAtPointer(event, false);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    beds.addEventListener(type, event => {
      if (gesture?.id === event.pointerId) gesture = null;
    });
  }

  for (const [index] of state.plots.entries()) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bed';
    button.dataset.bed = index;
    button.onclick = event => { if (event.detail === 0) tend(index); };
    beds.append(button);
    bedButtons.push(button);
  }

  for (const {id, name, icon} of flowers) {
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = '<span aria-hidden="true">' + icon + '</span>' + name + '<small></small>';
    button.dataset.seed = id;
    button.setAttribute('aria-pressed', String(id === seed));
    button.onclick = () => {
      seed = id;
      for (const option of $('seeds').children) option.setAttribute('aria-pressed', String(option === button));
      $('seed-inspector').hidden=false;
      onPreview($('seed-preview-host'),'flower',species.get(id));
      showMessage('Plant a ' + name.toLowerCase() + ' in an empty bed.');
      cue([480]);
    };
    $('seeds').append(button);
  }
  for (const button of document.querySelectorAll('[data-tool]')) {
    button.onclick = () => { selectTool(button.dataset.tool); cue([480]); };
  }
  function soundLabel() {
    $('sound').setAttribute('aria-pressed', String(state.sound));
    $('sound').setAttribute('aria-label', state.sound ? 'Turn sound off' : 'Turn sound on');
  }
  $('sound').onclick = () => { state.sound = !state.sound; soundLabel(); save(); cue([523, 659]); };
  function onPreview(host,type,definition) {
    if (host.id !== 'seed-preview-host') $('seed-inspector').hidden=true;
    previews.mount(host);
    previews.show(type,definition);
    const inspector=host.closest('.preview-side');
    if(inspector) inspector.scrollTop=0;
  }
  $('close-seed-preview').onclick = () => {
    $('seed-inspector').hidden=true;
    previews.hide();
  };
  for (const button of $('seeds').children) {
    const definition=species.get(button.dataset.seed);
    previews.thumbnail('flower',definition).then(url=>{
      if(!url)return;
      const image=document.createElement('img');
      image.src=url;
      image.alt=definition.name+' 3D model';
      image.className='model-thumbnail';
      button.querySelector('span').replaceWith(image);
    });
  }
  activities = installGardenActivities({
    state, economy, onChange: sync, previews, onPreview,
    onFriend: setCompanion,
    onArea: area => world?.setArea(area),
    onCare: id => {
      const home = residents?.getHomes().get(id);
      if (home) world.celebrate(home.position,'heart');
      cue([523,659]);
    }
  });
  wardrobeView = installGardenWardrobe($('wardrobe-dialog'), {
    getOutfit: () => state.outfit,
    getOwned: () => state.economy.owned,
    getCoins: () => state.economy.coins,
    onEquip: (key, value) => { state.outfit[key] = value; updateAvatar(); save(); cue([523,659]); },
    onBuy: id => { const result = economy.buyItem(id); if (result.ok) sync(); return result; }
  });
  $('collection').onclick = () => activities.openJournal();
  $('shop').onclick = () => activities.openShop();
  $('requests').onclick = () => activities.openRequests();
  $('animals').onclick = () => activities.openAnimals();
  $('dress-up').onclick = () => wardrobeView.open();
  const puzzles = installGardenPuzzles($('puzzles-dialog'), {
    onSolve: () => {
      state.solved++;
      economy.earn(2);
      sync();
      cue([523, 659, 784]);
    }
  });
  $('puzzles').onclick = () => { puzzles.open(); cue([587]); };
  $('start').onclick = () => {
    $('welcome').hidden = true;
    $('game').hidden = false;
    playing = true;
    try { world = createGardenScene(canvas); } catch (error) { console.warn('Using the flat garden', error); }
    if (!world) {
      gardenView.classList.add('flat');
      canvas.hidden = true;
    } else {
      residents = createGardenResidents(world);
      pickRay = new THREE.Raycaster();
      pickPoint = new THREE.Vector2();
      new ResizeObserver(layout).observe(gardenView);
      layout();
      frame = requestAnimationFrame(render);
    }
    bedButtons.forEach((_, index) => updatePlot(index));
    updateVisitors();
    updateAvatar();
    updateVase();
    selectTool('plant');
    sync();
    if (state.companion) setCompanion(state.companion);
    cue([392, 523, 659]);
  };
  document.addEventListener('visibilitychange', () => {
    if (!world) return;
    if (document.hidden) cancelAnimationFrame(frame);
    else frame = requestAnimationFrame(render);
  });
  document.addEventListener('contextmenu', event => event.preventDefault());
  function orientation() {
    const portrait = innerHeight > innerWidth;
    $('screen-rotate').hidden = !portrait;
    $('game').inert = portrait;
    $('welcome').inert = portrait;
    if (portrait) document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
  }
  addEventListener('resize', orientation);
  orientation();
  soundLabel();
  sync();
  $('welcome').hidden = false;
})();
