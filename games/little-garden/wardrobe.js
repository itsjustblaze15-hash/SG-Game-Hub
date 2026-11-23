(() => {
  'use strict';

  const categories = [
    {key: 'outfit', name: 'Clothes', icon: '👗'},
    {key: 'hat', name: 'Hats', icon: '👒'},
    {key: 'style', name: 'Hair', icon: '🎀'},
    {key: 'hair', name: 'Color', icon: '🎨'}
  ];
  const hairChoices = {
    style: [
      {value: 'curls', name: 'Soft curls', icon: '〰'},
      {value: 'bob', name: 'Little bob', icon: '✿'},
      {value: 'pigtails', name: 'Pigtails', icon: '🎀'}
    ],
    hair: [
      {value: 'brown', name: 'Brown', icon: '🟤', color: '#78432e'},
      {value: 'gold', name: 'Golden', icon: '🟡', color: '#efc668'},
      {value: 'black', name: 'Black', icon: '⚫', color: '#39303d'},
      {value: 'auburn', name: 'Auburn', icon: '🟠', color: '#b65435'}
    ]
  };
  const tints = {
    pink: '#eb78a1', mint: '#78bfa2', lilac: '#a894cc', peach: '#f4b18f',
    sky: '#88c4e4', rose: '#df7197', lemon: '#efd06d', berry: '#c27aaa',
    meadow: '#9bbd77', ocean: '#67b1c5', coral: '#ee9a8b', plum: '#a386b6',
    sunflower: '#efc14e', strawberry: '#e77b89', rainbow: '#92c4dc', daisy: '#f3eacd',
    denim: '#6e98b6', lavender: '#bd9ed4', buttercup: '#d7c465', woodland: '#ad8963',
    straw: '#e5c078', flower: '#edacc6', bow: '#eaa4c1', bee: '#f4d574',
    bunny: '#eadbd3', kitty: '#cdb5d1', beret: '#b798ca', cap: '#9ac6ce',
    leaf: '#a9ca8c', crown: '#edce70', moon: '#95a9cf', mushroom: '#e9b099',
    butterfly: '#d6b4df', pom: '#b9d1e0', bonnet: '#f3c5cd'
  };

  window.installGardenWardrobe = function installGardenWardrobe(dialog, {
    getOutfit, getOwned, getCoins = () => 0, onEquip, onBuy
  }) {
    dialog.classList.add('wardrobe-studio');
    dialog.setAttribute('aria-labelledby', 'studio-title');
    dialog.innerHTML = `
      <header class="studio-header">
        <div><h2 id="studio-title">My little wardrobe</h2><p class="studio-subtitle">Try a new look</p></div>
        <span class="studio-coins" aria-label="Flower coins"><span aria-hidden="true">✿</span> <b></b></span>
        <form method="dialog"><button type="submit" aria-label="Close dress up">×</button></form>
      </header>
      <div class="studio-body">
        <section class="studio-preview" aria-label="Your gardener preview">
          <div class="studio-sparkle studio-sparkle-one" aria-hidden="true">✦</div>
          <div class="studio-sparkle studio-sparkle-two" aria-hidden="true">✧</div>
          <canvas aria-hidden="true"></canvas>
          <span class="studio-fallback" hidden aria-hidden="true">👩‍🌾</span>
          <span class="studio-preview-label">Your gardener</span>
          <div class="studio-turn">
            <button type="button" data-turn="-1" aria-label="Turn gardener left">↶</button>
            <button type="button" data-turn="1" aria-label="Turn gardener right">↷</button>
          </div>
        </section>
        <section class="studio-catalog" aria-label="Wardrobe choices">
          <div class="studio-tabs" role="group" aria-label="Choose a wardrobe category"></div>
          <div class="studio-section-heading"><h3></h3><span class="studio-owned"></span></div>
          <div class="studio-choices"></div>
          <footer class="studio-purchase">
            <p class="studio-feedback" role="status"></p>
            <button type="button" class="studio-buy" hidden></button>
          </footer>
        </section>
      </div>`;

    const query = selector => dialog.querySelector(selector);
    const canvas = query('canvas');
    const choices = query('.studio-choices');
    const feedback = query('.studio-feedback');
    const buy = query('.studio-buy');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let category = 'outfit';
    let selection;
    let renderer;
    let scene;
    let camera;
    let avatar;
    let rotation = .08;
    let lastTime = 0;
    let buying = false;

    function catalog(key) {
      if (hairChoices[key]) return hairChoices[key].map(item => ({...item, key, free: true, price: 0}));
      return (window.GardenEconomy?.items || []).filter(item => item.type === key);
    }

    function owned(item) {
      return item.free || !item.id || getOwned().includes(item.id);
    }

    function setFeedback(message) {
      feedback.textContent = message;
    }

    function buildPreview() {
      if (!dialog.open) return;
      const area = canvas.getBoundingClientRect();
      if (!area.width || !area.height) return;
      if (!renderer) {
        try {
          renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true, powerPreference: 'low-power'});
          renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
          renderer.outputColorSpace = THREE.SRGBColorSpace;
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1.06;
          scene = new THREE.Scene();
          scene.add(new THREE.HemisphereLight(0xfff2e1, 0x9fba8e, 2));
          const sun = new THREE.DirectionalLight(0xffedd7, 2.5);
          sun.position.set(-3, 5, 4);
          scene.add(sun);
          const fill = new THREE.DirectionalLight(0xf4e2ff, .7);
          fill.position.set(3, 2, 2);
          scene.add(fill);
          camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 15);
          camera.position.set(0, 1.1, 4);
          camera.lookAt(0, .87, 0);
          const platform = new THREE.Mesh(
            new THREE.CylinderGeometry(.52, .55, .08, 48),
            new THREE.MeshStandardMaterial({color: 0xd3dca8, roughness: 1})
          );
          platform.position.y = -.055;
          scene.add(platform);
        } catch {
          canvas.hidden = true;
          query('.studio-fallback').hidden = false;
          return;
        }
      }
      if (avatar) {
        scene.remove(avatar);
        avatar.userData.dispose?.();
      }
      const outfit = {...getOutfit()};
      if (selection) outfit[selection.key] = selection.value;
      avatar = createGardenAvatar(outfit);
      avatar.rotation.y = rotation;
      scene.add(avatar);
      resizePreview();
    }

    function resizePreview() {
      if (!renderer || !dialog.open) return;
      const {width, height} = canvas.getBoundingClientRect();
      if (!width || !height) return;
      const vertical = Math.max(2.22, 1.6 / (width / height));
      camera.top = vertical / 2;
      camera.bottom = -vertical / 2;
      camera.left = -vertical * width / height / 2;
      camera.right = vertical * width / height / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      update(lastTime);
    }

    function choose(item) {
      selection = {...item, key: item.key || category};
      if (owned(item)) {
        onEquip(selection.key, item.value);
        setFeedback(item.name + ' is on!');
      } else {
        setFeedback('Try it on. Buy with your flower coins to keep it.');
      }
      renderOptions();
      buildPreview();
    }

    function renderOptions() {
      const items = catalog(category);
      query('.studio-coins b').textContent = getCoins();
      const name = categories.find(item => item.key === category).name;
      query('.studio-section-heading h3').textContent = name;
      query('.studio-owned').textContent = items.filter(owned).length + ' / ' + items.length + ' owned';
      for (const tab of query('.studio-tabs').children) {
        tab.setAttribute('aria-pressed', String(tab.dataset.category === category));
      }
      choices.replaceChildren(...items.map(item => {
        const button = document.createElement('button');
        const isOwned = owned(item);
        const selected = selection?.value === item.value && selection?.key === category;
        button.type = 'button';
        button.className = 'studio-item';
        button.setAttribute('aria-label', item.name + (isOwned ? ', owned' : ', ' + item.price + ' flower coins'));
        button.setAttribute('aria-pressed', String(selected));
        const art = document.createElement('span');
        art.className = 'studio-item-art';
        art.style.setProperty('--item-tint', item.color || tints[item.value] || '#e9ddca');
        art.setAttribute('aria-hidden', 'true');
        art.textContent = item.icon || (category === 'outfit' ? '👗' : '👒');
        const label = document.createElement('span');
        label.className = 'studio-item-name';
        label.textContent = item.name;
        const status = document.createElement('span');
        status.className = 'studio-item-status';
        status.textContent = isOwned ? (getOutfit()[category] === item.value ? 'Wearing ✓' : 'Owned') : '✿ ' + item.price;
        button.classList.toggle('is-locked', !isOwned);
        button.append(art, label, status);
        button.onclick = () => choose(item);
        return button;
      }));
      const locked = selection && !owned(selection);
      buy.hidden = !locked;
      buy.disabled = buying;
      if (locked) buy.textContent = 'Buy ' + selection.name + ' · ✿ ' + selection.price;
      query('.studio-preview-label').textContent = locked ? 'Trying it on' : 'Your gardener';
    }

    function refresh() {
      const outfit = getOutfit();
      if (!selection) selection = {...catalog(category).find(item => item.value === outfit[category]), key: category};
      renderOptions();
      buildPreview();
    }

    function open() {
      selection = {...catalog(category).find(item => item.value === getOutfit()[category]), key: category};
      dialog.showModal();
      setFeedback('Choose something you love.');
      refresh();
    }

    function update(seconds) {
      lastTime = seconds;
      if (!dialog.open || !renderer) return;
      if (avatar) {
        avatar.userData.animate?.(reducedMotion.matches ? 0 : seconds);
        avatar.rotation.y = rotation + (reducedMotion.matches ? 0 : Math.sin(seconds * .65) * .035);
      }
      renderer.render(scene, camera);
    }

    for (const item of categories) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.category = item.key;
      button.innerHTML = '<span aria-hidden="true">' + item.icon + '</span>' + item.name;
      button.onclick = () => {
        category = item.key;
        selection = {...catalog(category).find(choice => choice.value === getOutfit()[category]), key: category};
        setFeedback('Choose ' + item.name.toLowerCase() + ' for your gardener.');
        refresh();
        choices.scrollTop = 0;
      };
      query('.studio-tabs').append(button);
    }
    for (const button of dialog.querySelectorAll('[data-turn]')) {
      button.onclick = () => {
        rotation += Number(button.dataset.turn) * Math.PI / 4;
        update(lastTime);
      };
    }
    buy.onclick = () => {
      if (!selection || owned(selection) || buying) return;
      buying = true;
      buy.disabled = true;
      try {
        const result = onBuy(selection.id);
        if (result?.ok) {
          onEquip(selection.key, selection.value);
          setFeedback(selection.name + ' is yours!');
          buildPreview();
        } else {
          setFeedback(result?.message || 'Grow and sell more flowers to earn coins.');
        }
      } finally {
        buying = false;
        renderOptions();
      }
    };
    dialog.addEventListener('close', () => {
      selection = null;
    });
    new ResizeObserver(resizePreview).observe(canvas);
    addEventListener('pagehide', () => {
      avatar?.userData.dispose?.();
      renderer?.dispose();
    }, {once: true});
    return {open, refresh, update};
  };
})();
