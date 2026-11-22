const isOrchardIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function installOrchardTouch({ surface, enabled, hold, look, actions, direction }) {
  const storageKey = 'redwood-orchard-touch';
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(storageKey));
  } catch {
    // Controls still work when storage is unavailable.
  }

  const settings = document.getElementById('orchard-touch-settings');
  const movement = document.getElementById('orchard-movement');
  const moveSize = document.getElementById('orchard-move-size');
  const actionSize = document.getElementById('orchard-action-size');
  const moveValue = document.getElementById('orchard-move-value');
  const actionValue = document.getElementById('orchard-action-value');
  movement.value = saved?.movement === 'stick' ? 'stick' : 'arrows';
  moveSize.value = saved?.moveSize ?? 100;
  actionSize.value = saved?.actionSize ?? 100;

  const controls = document.createElement('div');
  controls.className = 'sg-touch-controls orchard-touch';
  controls.hidden = true;

  const arrows = document.createElement('div');
  arrows.className = 'sg-touch-movement';
  const held = new Map();
  const endEvents = ['pointerup', 'pointercancel', 'lostpointercapture'];
  for (const [key, glyph, label] of [
    ['KeyW', '↑', 'Forward'], ['KeyA', '←', 'Left'],
    ['KeyS', '↓', 'Backward'], ['KeyD', '→', 'Right']
  ]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.key = key;
    button.textContent = glyph;
    button.setAttribute('aria-label', label);
    button.addEventListener('pointerdown', event => {
      if (!enabled()) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      held.set(event.pointerId, key);
      hold(key, true);
    });
    for (const type of endEvents) {
      button.addEventListener(type, event => {
        if (!held.delete(event.pointerId)) return;
        if (![...held.values()].includes(key)) hold(key, false);
      });
    }
    arrows.append(button);
  }

  const stick = document.createElement('div');
  stick.className = 'orchard-stick';
  stick.setAttribute('aria-label', 'Drag to move');
  const knob = document.createElement('div');
  stick.append(knob);

  let movePointer = null;
  let moveX = 0;
  let moveY = 0;
  function releaseStick() {
    movePointer = null;
    knob.style.transform = '';
    direction(0, 0);
  }
  stick.addEventListener('pointerdown', event => {
    if (!enabled() || movePointer !== null || event.pointerType === 'mouse') return;
    event.preventDefault();
    stick.setPointerCapture(event.pointerId);
    movePointer = event.pointerId;
    moveX = event.clientX;
    moveY = event.clientY;
  });
  stick.addEventListener('pointermove', event => {
    if (event.pointerId !== movePointer) return;
    const x = event.clientX - moveX;
    const y = event.clientY - moveY;
    const length = Math.hypot(x, y);
    const radius = stick.clientWidth * 0.31;
    const divisor = Math.max(length, radius);
    knob.style.transform = `translate(${x / divisor * radius}px, ${y / divisor * radius}px)`;
    const strength = Math.max(0, Math.min(1, (length / radius - 0.12) / 0.88));
    direction(length ? x / length * strength : 0, length ? y / length * strength : 0);
  });
  for (const type of endEvents) {
    stick.addEventListener(type, event => {
      if (event.pointerId === movePointer) releaseStick();
    });
  }

  const actionPad = document.createElement('div');
  actionPad.className = 'sg-touch-actions';
  for (const [label, action] of actions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.onclick = () => { if (enabled()) action(); };
    actionPad.append(button);
  }
  controls.append(arrows, stick, actionPad);
  document.body.append(controls);

  let lookPointer = null;
  let lastX = 0;
  let lastY = 0;
  surface.classList.add('sg-touch-surface');
  surface.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' || !enabled() || lookPointer !== null) return;
    event.preventDefault();
    lookPointer = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    surface.setPointerCapture(event.pointerId);
  });
  surface.addEventListener('pointermove', event => {
    if (event.pointerId !== lookPointer || !enabled()) return;
    look(event.clientX - lastX, event.clientY - lastY);
    lastX = event.clientX;
    lastY = event.clientY;
  });
  for (const type of endEvents) {
    surface.addEventListener(type, event => {
      if (event.pointerId === lookPointer) lookPointer = null;
    });
  }

  const preview = controls.cloneNode(true);
  preview.hidden = false;
  preview.inert = true;
  settings.querySelector('.orchard-preview').append(preview);
  function applySizes() {
    arrows.hidden = preview.children[0].hidden = movement.value === 'stick';
    stick.hidden = preview.children[1].hidden = movement.value !== 'stick';
    moveValue.textContent = moveSize.value + '%';
    actionValue.textContent = actionSize.value + '%';
    for (const layout of [controls, preview]) {
      layout.style.setProperty('--orchard-move', (moveSize.valueAsNumber - 70) / 90);
      layout.style.setProperty('--orchard-action', (actionSize.valueAsNumber - 70) / 90);
    }
  }
  settings.addEventListener('input', () => {
    applySizes();
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        movement: movement.value,
        moveSize: moveSize.value,
        actionSize: actionSize.value
      }));
    } catch {
      // Keep the current settings for this session.
    }
  });
  applySizes();
  settings.hidden = false;
  document.body.classList.add('orchard-ios');
  document.addEventListener('contextmenu', event => {
    if (enabled()) event.preventDefault();
  });

  return () => {
    controls.hidden = !enabled();
    if (controls.hidden) {
      for (const key of held.values()) hold(key, false);
      held.clear();
      releaseStick();
      lookPointer = null;
    }
  };
}
