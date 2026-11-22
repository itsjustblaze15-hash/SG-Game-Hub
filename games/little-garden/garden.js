(() => {
  const $ = id => document.getElementById(id);
  if (!window.gardenPhone) {
    $('phone-only').hidden = false;
    return;
  }

  const flowers = [
    { id: 'daisy', name: 'Daisy', icon: '🌼' },
    { id: 'sunflower', name: 'Sunflower', icon: '🌻' },
    { id: 'cosmos', name: 'Cosmos', icon: '🌸' },
    { id: 'lavender', name: 'Lavender', icon: '🪻' },
    { id: 'tulip', name: 'Tulip', icon: '🌷' },
    { id: 'poppy', name: 'Poppy', icon: '🏵️' }
  ];
  const species = new Map(flowers.map(flower => [flower.id, flower]));
  const wardrobe = [
    {key: 'style', title: 'Hairstyle', choices: [
      ['curls', 'Curls', '〰'], ['bob', 'Bob', '✿'], ['pigtails', 'Pigtails', '🎀']
    ]},
    {key: 'hair', title: 'Hair color', choices: [
      ['brown', 'Brown', '🟤'], ['gold', 'Gold', '🟡'], ['black', 'Black', '⚫'], ['auburn', 'Auburn', '🟠']
    ]},
    {key: 'outfit', title: 'Overalls', choices: [
      ['pink', 'Pink', '🩷'], ['mint', 'Mint', '💚'], ['lilac', 'Lilac', '💜']
    ]},
    {key: 'hat', title: 'Hat', choices: [
      ['straw', 'Straw', '👒'], ['flower', 'Flower', '🌸'], ['none', 'None', '✦']
    ]}
  ];
  const visitorTypes = [
    {id: 'butterfly', name: 'Butterfly', icon: '🦋', blooms: 1},
    {id: 'rabbit', name: 'Bunny', icon: '🐰', blooms: 3},
    {id: 'bird', name: 'Bluebird', icon: '🐦', blooms: 6},
    {id: 'squirrel', name: 'Squirrel', icon: '🐿️', blooms: 9},
    {id: 'ladybug', name: 'Ladybug', icon: '🐞', blooms: 12}
  ];
  const storageKey = 'sg-little-garden-v1';
  const tips = {
    plant: 'Tap an empty garden bed.',
    water: 'Tap a plant or sweep across several beds.',
    pick: 'Tap a flower that has opened.'
  };
  const state = load();
  const canvas = $('world');
  const gardenView = canvas.parentElement;
  const beds = $('beds');
  const bedButtons = [];
  const plotModels = [];
  const vaseModels = [];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let world;
  const visitors = new Map();
  let avatar;
  let preview;
  let frame;
  let tool = 'plant';
  let seed = flowers[0].id;
  let audio;
  let gesture;
  let pickRay;
  let pickPoint;

  function load() {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(storageKey)); } catch {}
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
    const outfit = Object.fromEntries(wardrobe.map(({key, choices}) => {
      const value = saved?.outfit?.[key];
      return [key, choices.some(([id]) => id === value) ? value : choices[0][0]];
    }));
    const solved = Number.isSafeInteger(saved?.solved) ? Math.max(0, saved.solved) : 0;
    return {plots, counts, blooms, vase: [...new Set(vase)], sound: saved?.sound === true, outfit, solved};
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
    $('tool-tip').textContent = tool === 'water' ? 'Water a seed, then water the sprout to bloom.' : 'Picked flowers go in your vase.';
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
    const vertical = Math.abs(centers[2][1] - centers[0][1]);
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
      const model = GardenModels.flower(plot.kind, plot.stage, index);
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
      const model = GardenModels.flower(kind, 2, index + 6);
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
    if (!world) return;
    const models = {
      butterfly: () => GardenModels.butterfly('pink'),
      rabbit: GardenModels.bunny,
      bird: GardenModels.bird,
      squirrel: GardenModels.squirrel,
      ladybug: GardenModels.ladybug
    };
    for (const {id, blooms} of visitorTypes) {
      if (visitors.has(id) || state.blooms < blooms) continue;
      const visitor = models[id]();
      const spot = world[id + 'Spot'];
      if (spot) visitor.position.copy(spot);
      visitor.rotation.y = {rabbit: .55, bird: -.65, squirrel: -.45, ladybug: .38}[id] || 0;
      visitors.set(id, visitor);
      world.scene.add(visitor);
    }
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
    if ($('wardrobe-dialog').open) renderAvatarPreview();
  }

  function renderAvatarPreview() {
    const view = $('avatar-preview');
    const { width, height } = view.getBoundingClientRect();
    if (!width || !height) return;
    if (!preview) {
      try {
        const renderer = new THREE.WebGLRenderer({canvas: view, alpha: true, antialias: true});
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        const scene = new THREE.Scene();
        scene.add(new THREE.HemisphereLight(0xfff2dc, 0x93a175, 2.15));
        const light = new THREE.DirectionalLight(0xffedd8, 2.1);
        light.position.set(-2, 5, 4);
        scene.add(light);
        const camera = new THREE.PerspectiveCamera(35, width / height, .1, 20);
        camera.position.set(.46, 1.05, 3.1);
        camera.lookAt(0, .79, 0);
        preview = {scene, renderer, camera, model: null};
      } catch {
        view.hidden = true;
        $('avatar-fallback').hidden = false;
        return;
      }
    }
    if (preview.model) {
      preview.scene.remove(preview.model);
      preview.model.userData.dispose?.();
    }
    preview.model = createGardenAvatar(state.outfit);
    preview.scene.add(preview.model);
    preview.camera.aspect = width / height;
    preview.camera.updateProjectionMatrix();
    preview.renderer.setSize(width, height, false);
    preview.renderer.render(preview.scene, preview.camera);
  }

  function renderWardrobe() {
    const options = $('wardrobe-options');
    for (const {key, title, choices} of wardrobe) {
      const field = document.createElement('fieldset');
      const legend = document.createElement('legend');
      legend.textContent = title;
      const row = document.createElement('div');
      row.className = 'wardrobe-choices';
      for (const [id, name, icon] of choices) {
        const choice = document.createElement('button');
        choice.type = 'button';
        choice.innerHTML = '<span aria-hidden="true">' + icon + '</span>' + name;
        choice.setAttribute('aria-label', title + ': ' + name);
        choice.setAttribute('aria-pressed', String(state.outfit[key] === id));
        choice.onclick = () => {
          state.outfit[key] = id;
          for (const button of row.children) button.setAttribute('aria-pressed', String(button === choice));
          updateAvatar();
          save();
          cue([523, 659]);
        };
        row.append(choice);
      }
      field.append(legend, row);
      options.append(field);
    }
  }

  function tend(index, showHints = true) {
    const plot = state.plots[index];
    if (tool === 'plant' && !plot) {
      const flower = species.get(seed);
      state.plots[index] = {kind: seed, stage: 0};
      showMessage(flower.name + ' planted! Give it some water.');
      sparkle(index, '🌱');
      cue([440, 550]);
    } else if (tool === 'water' && plot && plot.stage < 2) {
      plot.stage++;
      if (plot.stage === 2) {
        state.blooms++;
        const visitor = visitorTypes.find(({blooms}) => blooms === state.blooms);
        showMessage(visitor ? 'A ' + visitor.name.toLowerCase() + ' came to visit!' : species.get(plot.kind).name + ' in bloom!');
        sparkle(index, '✨');
        cue([523, 659, 784]);
        updateVisitors();
      } else {
        showMessage('A little sprout! Water it once more.');
        sparkle(index, '💧');
        cue([660, 880]);
      }
    } else if (tool === 'pick' && plot?.stage === 2) {
      state.counts[plot.kind]++;
      if (!state.vase.includes(plot.kind)) state.vase.push(plot.kind);
      state.plots[index] = null;
      showMessage('A ' + species.get(plot.kind).name.toLowerCase() + ' for your vase!');
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
    updatePlot(index);
    save();
  }

  function renderCollection() {
    $('puzzle-count').textContent = state.solved;
    $('visitor-list').replaceChildren(...visitorTypes.map(({name, icon, blooms}) => {
      const item = document.createElement('li');
      const label = document.createElement('strong');
      label.textContent = icon + ' ' + name;
      const status = document.createElement('span');
      status.textContent = state.blooms >= blooms ? 'Visited ✓' : blooms + (blooms === 1 ? ' bloom' : ' blooms');
      item.append(label, status);
      return item;
    }));
    $('flowers').replaceChildren(...flowers.map(({id, name, icon}) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = icon + ' ' + name + ' · ' + state.counts[id];
      button.disabled = !state.counts[id];
      button.setAttribute('aria-pressed', String(state.vase.includes(id)));
      button.onclick = () => {
        const index = state.vase.indexOf(id);
        if (index === -1) state.vase.push(id);
        else state.vase.splice(index, 1);
        button.setAttribute('aria-pressed', String(index === -1));
        updateVase();
        save();
      };
      return button;
    }));
    $('vase-guide').textContent = Object.values(state.counts).some(Boolean)
      ? 'Tap your flowers to arrange what goes in the garden vase.'
      : 'Pick a flower that has bloomed to put it in your vase.';
  }

  function render(time) {
    const seconds = reducedMotion.matches ? 0 : time / 1000;
    world.update(seconds);
    const butterfly = visitors.get('butterfly');
    if (butterfly) {
      butterfly.position.set(Math.sin(seconds * .75) * 2.8, 1.6 + Math.sin(seconds * 2.4) * .23, Math.cos(seconds * .75) * 2.45);
      butterfly.rotation.y = seconds * .75 + Math.PI / 2;
    }
    for (const visitor of visitors.values()) visitor.userData.animate?.(seconds);
    avatar?.userData.animate?.(seconds);
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
    button.innerHTML = '<span aria-hidden="true">' + icon + '</span>' + name;
    button.dataset.seed = id;
    button.setAttribute('aria-pressed', String(id === seed));
    button.onclick = () => {
      seed = id;
      for (const option of $('seeds').children) option.setAttribute('aria-pressed', String(option === button));
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
  $('collection').onclick = () => { renderCollection(); $('vase-dialog').showModal(); cue([587]); };
  renderWardrobe();
  $('dress-up').onclick = () => {
    $('wardrobe-dialog').showModal();
    renderAvatarPreview();
    cue([587]);
  };
  new ResizeObserver(() => {
    if ($('wardrobe-dialog').open) renderAvatarPreview();
  }).observe($('avatar-preview'));
  const puzzles = installGardenPuzzles($('puzzles-dialog'), {
    onSolve: () => {
      state.solved++;
      save();
      cue([523, 659, 784]);
    }
  });
  $('puzzles').onclick = () => { puzzles.open(); cue([587]); };
  $('start').onclick = () => {
    $('welcome').hidden = true;
    $('game').hidden = false;
    try { world = createGardenScene(canvas); } catch (error) { console.warn('Using the flat garden', error); }
    if (!world) {
      gardenView.classList.add('flat');
      canvas.hidden = true;
    } else {
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
    cue([392, 523, 659]);
  };
  document.addEventListener('visibilitychange', () => {
    if (!world) return;
    if (document.hidden) cancelAnimationFrame(frame);
    else frame = requestAnimationFrame(render);
  });
  document.addEventListener('contextmenu', event => event.preventDefault());
  soundLabel();
  $('welcome').hidden = false;
})();
