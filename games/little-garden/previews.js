(() => {
  'use strict';

  window.createGardenPreviews = function createGardenPreviews() {
    const panel = document.createElement('section');
    panel.className = 'model-preview garden-model-preview';
    panel.setAttribute('aria-label', '3D model preview');
    panel.innerHTML = `
      <h3 class="model-preview-title">Choose a flower or animal</h3>
      <div class="model-preview-stage">
        <canvas tabindex="0" role="img" aria-label="3D preview. Drag to turn and tilt. Arrow keys also turn and tilt."></canvas>
        <p class="model-preview-fallback" hidden>3D preview is unavailable on this device.</p>
      </div>
      <p class="model-preview-hint">Drag to turn and tilt</p>
      <div class="model-preview-controls" role="group" aria-label="Turn the 3D preview">
        <button type="button" data-view="left" aria-label="Rotate left">←</button>
        <button type="button" data-view="right" aria-label="Rotate right">→</button>
        <button type="button" data-view="up" aria-label="Tilt up">↑</button>
        <button type="button" data-view="down" aria-label="Tilt down">↓</button>
        <button type="button" data-view="reset" aria-label="Reset view">↺</button>
      </div>`;

    const canvas = panel.querySelector('canvas');
    const stage = panel.querySelector('.model-preview-stage');
    const title = panel.querySelector('.model-preview-title');
    const fallback = panel.querySelector('.model-preview-fallback');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const models = new Map();
    const thumbnails = new Map();
    const queue = [];
    let renderer;
    let scene;
    let camera;
    let displayed;
    let currentKey;
    let yaw = 0;
    let pitch = 0;
    let pointer;
    let frame;
    let hidden = true;
    let failed = false;
    let lastTime = 0;
    let pendingResize = true;

    function initialize() {
      if (renderer || failed) return Boolean(renderer);
      try {
        renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'low-power'});
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.06;
        scene = new THREE.Scene();
        scene.add(new THREE.HemisphereLight(0xfff4e1, 0x7d9e79, 2.1));
        const light = new THREE.DirectionalLight(0xfff0dc, 2.3);
        light.position.set(-3, 4, 5);
        scene.add(light);
        const fill = new THREE.DirectionalLight(0xe3eaff, .7);
        fill.position.set(4, 2, 0);
        scene.add(fill);
        camera = new THREE.PerspectiveCamera(35, 1, .1, 20);
        camera.position.set(0, .18, 3.4);
        camera.lookAt(0, 0, 0);
        return true;
      } catch (error) {
        failed = true;
        canvas.hidden = true;
        fallback.hidden = false;
        panel.querySelector('.model-preview-controls').hidden = true;
        panel.querySelector('.model-preview-hint').hidden = true;
        console.warn('The 3D item preview could not open', error);
        return false;
      }
    }

    function keyFor(type, definition) {
      return type + ':' + definition.id;
    }

    function obtain(type, definition) {
      const key = keyFor(type, definition);
      if (!models.has(key)) {
        const model = type === 'flower'
          ? GardenCollectionModels.flower(definition, 2, 0)
          : GardenCollectionModels.animal(definition);
        model.userData.animate?.(0);
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const diameter = Math.max(size.x, size.y, size.z, .1);
        const centered = new THREE.Group();
        centered.position.copy(center).multiplyScalar(-1);
        centered.add(model);
        const scaled = new THREE.Group();
        scaled.scale.setScalar(1.5 / diameter);
        scaled.add(centered);
        const root = new THREE.Group();
        root.add(scaled);
        const initialPitch = type === 'animal' && ['butterfly', 'ladybug', 'bee', 'turtle', 'frog', 'hedgehog'].includes(definition.base) ? .48 : 0;
        models.set(key, {root, model, initialPitch});
      }
      return models.get(key);
    }

    function visible() {
      return !hidden && panel.isConnected && panel.getClientRects().length > 0 && !panel.closest('dialog:not([open])');
    }

    function resize() {
      const bounds = stage.getBoundingClientRect();
      if (bounds.width < 1 || bounds.height < 1) return false;
      renderer.setSize(bounds.width, bounds.height, false);
      camera.aspect = bounds.width / bounds.height;
      const narrow = Math.min(camera.aspect, 1);
      camera.position.z = 3.4 / narrow;
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      pendingResize = false;
      return true;
    }

    function draw() {
      if (!renderer || !displayed || !visible()) return;
      if (pendingResize && !resize()) return;
      displayed.root.rotation.set(pitch, yaw, 0);
      panel.dataset.yaw = String(yaw);
      panel.dataset.pitch = String(pitch);
      renderer.render(scene, camera);
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(process);
    }

    function process() {
      frame = null;
      const job = queue.shift();
      if (!job) return;
      if (!initialize()) {
        job.resolve(null);
        if (queue.length) schedule();
        return;
      }
      const previous = displayed;
      let temporary;
      try {
        temporary = obtain(job.type, job.definition);
        if (previous) scene.remove(previous.root);
        temporary.model.userData.animate?.(0);
        temporary.root.rotation.set(temporary.initialPitch, .12, 0);
        scene.add(temporary.root);
        renderer.setPixelRatio(1);
        renderer.setSize(160, 160, false);
        camera.aspect = 1;
        camera.position.z = 3.4;
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
        job.resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        console.warn('A model thumbnail could not render', error);
        job.resolve(null);
      } finally {
        if (temporary) scene.remove(temporary.root);
        if (previous) {
          scene.add(previous.root);
          previous.model.userData.animate?.(reducedMotion.matches ? 0 : lastTime);
        }
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
        pendingResize = true;
        draw();
      }
      if (queue.length) schedule();
    }

    function mount(host) {
      if (!host) return;
      host.append(panel);
      hidden = false;
      panel.hidden = false;
      pendingResize = true;
      draw();
    }

    function show(type, definition) {
      if (!definition || !['flower', 'animal'].includes(type)) return;
      const key = keyFor(type, definition);
      hidden = false;
      panel.hidden = false;
      title.textContent = definition.name;
      panel.dataset.previewType = type;
      panel.dataset.previewId = definition.id;
      canvas.setAttribute('aria-label', definition.name + '. Drag to turn and tilt. Arrow keys also turn and tilt.');
      if (!initialize()) return;
      if (currentKey !== key) {
        if (displayed) scene.remove(displayed.root);
        displayed = obtain(type, definition);
        scene.add(displayed.root);
        currentKey = key;
        yaw = .12;
        pitch = displayed.initialPitch;
      }
      pendingResize = true;
      draw();
    }

    function thumbnail(type, definition) {
      if (!definition || !['flower', 'animal'].includes(type)) return Promise.resolve(null);
      const key = keyFor(type, definition);
      if (!thumbnails.has(key)) {
        thumbnails.set(key, new Promise(resolve => {
          queue.push({type, definition, resolve});
          schedule();
        }));
      }
      return thumbnails.get(key);
    }

    function update(seconds) {
      lastTime = seconds;
      if (!displayed || !visible()) return;
      displayed.model.userData.animate?.(reducedMotion.matches ? 0 : seconds);
      draw();
    }

    function turn(direction) {
      if (!displayed) return;
      if (direction === 'left') yaw -= .35;
      if (direction === 'right') yaw += .35;
      if (direction === 'up') pitch -= .22;
      if (direction === 'down') pitch += .22;
      if (direction === 'reset') {
        yaw = .12;
        pitch = displayed.initialPitch;
      }
      pitch = Math.max(-1.15, Math.min(1.15, pitch));
      draw();
    }

    canvas.addEventListener('pointerdown', event => {
      if (pointer || !displayed) return;
      event.preventDefault();
      pointer = {id: event.pointerId, x: event.clientX, y: event.clientY};
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', event => {
      if (event.pointerId !== pointer?.id) return;
      yaw += (event.clientX - pointer.x) * .012;
      pitch += (event.clientY - pointer.y) * .012;
      pitch = Math.max(-1.15, Math.min(1.15, pitch));
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      draw();
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      canvas.addEventListener(type, event => {
        if (event.pointerId === pointer?.id) pointer = null;
      });
    }
    canvas.addEventListener('keydown', event => {
      const direction = {ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', Home: 'reset'}[event.code];
      if (!direction) return;
      event.preventDefault();
      turn(direction);
    });
    panel.querySelectorAll('[data-view]').forEach(button => button.onclick = () => turn(button.dataset.view));
    new ResizeObserver(() => {
      pendingResize = true;
      draw();
    }).observe(stage);

    function hide() {
      hidden = true;
      panel.hidden = true;
      pointer = null;
    }

    return {mount, show, thumbnail, update, hide};
  };
})();
