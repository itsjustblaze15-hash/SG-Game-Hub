/** Keep the mobile buttons and look surface separate so both thumbs can work at once. */
function installTouchControls({ surface, enabled, hold, look, actions }) {
  if (!matchMedia('(pointer: coarse)').matches) return () => {};
  const controls = document.createElement('div');
  controls.className = 'sg-touch-controls';
  controls.hidden = true;
  const movement = document.createElement('div');
  movement.className = 'sg-touch-movement';
  const actionPad = document.createElement('div');
  actionPad.className = 'sg-touch-actions';

  const pressed = new Map();
  function release(event) {
    const key = pressed.get(event.pointerId);
    if (key) hold(key, false);
    pressed.delete(event.pointerId);
    if (lookPointer === event.pointerId) lookPointer = null;
  }
  for (const [key, glyph, label] of [['KeyW','↑','Forward'],['KeyA','←','Left'],
    ['KeyS','↓','Backward'],['KeyD','→','Right']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = glyph;
    button.setAttribute('aria-label', label);
    button.dataset.key = key;
    button.addEventListener('pointerdown', event => {
      if (!enabled()) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      pressed.set(event.pointerId, key);
      hold(key, true);
    });
    for (const type of ['pointerup','pointercancel','lostpointercapture']) {
      button.addEventListener(type, release);
    }
    movement.append(button);
  }
  for (const [label, action] of actions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.onclick = () => { if (enabled()) action(); };
    actionPad.append(button);
  }
  controls.append(movement, actionPad);
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
    if (lookPointer !== event.pointerId || !enabled()) return;
    look(event.clientX - lastX, event.clientY - lastY);
    lastX = event.clientX;
    lastY = event.clientY;
  });
  for (const type of ['pointerup','pointercancel','lostpointercapture']) {
    surface.addEventListener(type, release);
  }
  return () => {
    const hide = !enabled();
    if (hide && !controls.hidden) {
      for (const key of pressed.values()) hold(key, false);
      pressed.clear();
      lookPointer = null;
    }
    if (controls.hidden !== hide) controls.hidden = hide;
  };
}
window.installTouchControls = installTouchControls;
