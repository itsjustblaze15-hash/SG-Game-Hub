const search = document.querySelector('#search');
const grid = document.querySelector('#games');
const count = document.querySelector('#count');
const empty = document.querySelector('#empty');
const dialog = document.querySelector('#details');
const reorder = document.querySelector('#reorder');
const reorderHelp = document.querySelector('#reorder-help');
const orderStatus = document.querySelector('#order-status');
const player = document.querySelector('#player');
const playerFrame = document.querySelector('#player-frame');
const exitGame = document.querySelector('#exit-game');
const rotatePrompt = document.querySelector('#rotate-prompt');
const portraitPhone = matchMedia('(orientation: portrait) and (pointer: coarse), (orientation: portrait) and (max-width: 600px)');
const portraitGames = new Set(['fus', 'gp']);
const play = document.querySelector('#play');
const phoneBuild = '2026-11-21.2';
const repairedGames = new Set(['motor-dynasty', 'redwood', 'second-chance', 'apex-circuit', 'blacktide']);
const phoneLayout = matchMedia('(pointer: coarse) and (max-width: 1100px), (max-height: 550px) and (max-width: 1100px)');
const refreshHub = document.querySelector('#refresh-hub');
refreshHub.addEventListener('click', () => {
  refreshHub.disabled = true;
  refreshHub.setAttribute('aria-label', 'Refreshing SG');
  const url = new URL(location.href);
  url.searchParams.set('sg-refresh', String(Date.now()));
  location.replace(url.href);
});

function sizePlayerToScreen() {
  const viewport = window.visualViewport;
  player.style.setProperty('--player-height', (viewport?.height || innerHeight) + 'px');
  player.style.setProperty('--player-top', (viewport?.offsetTop || 0) + 'px');
}
window.visualViewport?.addEventListener('resize', sizePlayerToScreen);
window.visualViewport?.addEventListener('scroll', sizePlayerToScreen);
window.addEventListener('resize', sizePlayerToScreen);

function applyPhoneLayout(frame, game) {
  if (!repairedGames.has(game.id) || !phoneLayout.matches) return;
  try {
    const doc = frame.contentDocument;
    if (!doc?.head) return;
    doc.documentElement.dataset.sgPhoneGame = game.id;
    if (doc.getElementById('sg-phone-layout')) return;
    const style = doc.createElement('link');
    style.id = 'sg-phone-layout';
    style.rel = 'stylesheet';
    style.href = new URL('phone/game-layout.css?v=' + phoneBuild, location.href).href;
    doc.head.append(style);
  } catch (error) {
    console.warn('SG could not apply the phone layout', error);
  }
}
const orderKey = 'sg-library-order-v1';
let editing = false;
let order = loadOrder();
let drag = null;
let selectedGame = null;
let launcher = null;
let playingGame = null;

function closeGame() {
  if (player.hidden) return;
  player.hidden = true;
  playerFrame.replaceChildren();
  playingGame = null;
  document.body.classList.remove('playing');
  if (history.state?.sgHub) history.replaceState({sgHub: true, sgPlayer: false}, '');

  launcher?.focus({ preventScroll: true });
}

function syncPlayerOrientation() {
  if (!playingGame) return;
  const needsRotation = !portraitGames.has(playingGame.id) && portraitPhone.matches;
  rotatePrompt.hidden = !needsRotation;
  playerFrame.classList.toggle('waiting-for-landscape', needsRotation);
  playerFrame.inert = needsRotation;
  if (needsRotation || playerFrame.firstElementChild) return;

  const frame = document.createElement('iframe');
  frame.title = playingGame.name;
  const game = playingGame;
  const source = new URL(game.play, location.href);
  if (repairedGames.has(game.id)) source.searchParams.set('sg-version', phoneBuild);
  const refreshed = new URL(location.href).searchParams.get('sg-refresh');
  if (refreshed) source.searchParams.set('sg-refresh', refreshed);
  frame.src = source.href;
  frame.addEventListener('load', () => applyPhoneLayout(frame, game));
  playerFrame.replaceChildren(frame);
}
portraitPhone.addEventListener('change', syncPlayerOrientation);

function startGame(game) {
  if (!game?.play || !player.hidden) return;
  playingGame = game;
  syncPlayerOrientation();
  document.querySelector('#player-title').textContent = game.name;
  dialog.close();
  player.hidden = false;
  document.body.classList.add('playing');
  sizePlayerToScreen();
  if (history.state?.sgHub) history.replaceState({ sgHub: true, sgPlayer: true }, '');
  else history.pushState({ sgHub: true, sgPlayer: true }, '');
  exitGame.focus({ preventScroll: true });
}

play.addEventListener('click', () => startGame(selectedGame));
exitGame.addEventListener('click', () => {
  closeGame();

});
window.addEventListener('popstate', closeGame);

function loadOrder() {
  const currentIds = games.map(game => game.id);
  try {
    const saved = JSON.parse(localStorage.getItem(orderKey));
    if (!Array.isArray(saved)) return currentIds;
    return [...new Set([...saved.filter(id => currentIds.includes(id)), ...currentIds])];
  } catch {
    return currentIds;
  }
}

function moveGame(fromId, toId, focusAction) {
  const from = order.indexOf(fromId);
  const to = order.indexOf(toId);
  if (from < 0 || to < 0 || from === to) return;
  order.splice(from, 1);
  order.splice(to, 0, fromId);
  try { localStorage.setItem(orderKey, JSON.stringify(order)); } catch {}
  render();
  const moved = [...grid.children].find(tile => tile.dataset.game === fromId);
  if (focusAction) {
    const control = moved?.querySelector('[data-move="' + focusAction + '"]:enabled');
    (control || moved?.querySelector('.drag-handle'))?.focus({ preventScroll: true });
  }
  orderStatus.textContent = games.find(game => game.id === fromId).name +
    ' moved to position ' + (to + 1) + '.';
}

function moveControls(game, index) {
  const tools = document.createElement('div');
  tools.className = 'move-tools';
  const handle = document.createElement('button');
  handle.type = 'button';
  handle.className = 'drag-handle';
  handle.textContent = '⠿';
  handle.setAttribute('aria-label', 'Drag ' + game.name);
  handle.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    handle.setPointerCapture(event.pointerId);
    drag = {id: game.id, pointer: event.pointerId, tile: handle.closest('.game-tile'), target: null};
    drag.tile.classList.add('dragging');
  });
  handle.addEventListener('pointermove', event => {
    if (drag?.pointer !== event.pointerId) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.game-tile');
    drag.target?.classList.remove('drop-target');
    drag.target = target && target !== drag.tile ? target : null;
    drag.target?.classList.add('drop-target');
  });
  function stopDrag(event, save) {
    if (drag?.pointer !== event.pointerId) return;
    const {id, tile, target} = drag;
    drag = null;
    tile.classList.remove('dragging');
    target?.classList.remove('drop-target');
    if (save && target) moveGame(id, target.dataset.game);
  }
  handle.addEventListener('pointerup', event => stopDrag(event, true));
  handle.addEventListener('pointercancel', event => stopDrag(event, false));
  handle.addEventListener('lostpointercapture', event => stopDrag(event, false));
  tools.append(handle);
  for (const [offset, glyph, label] of [[-1, '←', 'earlier'], [1, '→', 'later']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = glyph;
    button.setAttribute('aria-label', 'Move ' + game.name + ' ' + label);
    button.dataset.move = label;
    const neighbor = order[index + offset];
    button.disabled = !neighbor;
    button.addEventListener('click', () => moveGame(game.id, neighbor, label));
    tools.append(button);
  }
  return tools;
}

function icon(platform, supported) {
  const status = document.createElement('span');
  status.className = supported ? 'device supported' : 'device';
  const label = platform === 'mac' ? 'Mac' : 'iPhone';
  status.setAttribute('role', 'img');
  status.setAttribute('aria-label', label + (supported ? ': playable' : ': unavailable'));
  status.title = status.getAttribute('aria-label');
  const shape = document.createElement('span');
  shape.className = 'device-icon ' + platform;
  shape.setAttribute('aria-hidden', 'true');
  status.append(shape);
  return status;
}

function devices(game) {
  const group = document.createElement('span');
  group.className = 'devices';
  group.append(icon('mac', game.macSupported), icon('iphone', !!game.play));
  return group;
}

function openGame(game) {
  selectedGame = game;
  launcher = document.activeElement;
  document.querySelector('#game-cover').src = game.cover;
  document.querySelector('#game-title').textContent = game.name;
  document.querySelector('#game-genre').textContent = game.subtitle;
  document.querySelector('#game-description').textContent = game.description;
  document.querySelector('#game-devices').replaceChildren(devices(game));
  play.hidden = !game.play;
  document.querySelector('#availability').hidden = !!game.play;
  dialog.showModal();
}

function gameCard(game) {
  const tile = document.createElement('div');
  tile.className = 'game-tile';
  tile.dataset.game = game.id;
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'game-card';
  card.addEventListener('click', () => openGame(game));

  const cover = document.createElement('img');
  cover.src = game.cover;
  cover.alt = '';
  cover.loading = 'lazy';
  cover.decoding = 'async';

  const copy = document.createElement('span');
  copy.className = 'card-copy';
  const name = document.createElement('span');
  name.className = 'game-name';
  name.textContent = game.name;
  copy.append(name, devices(game));
  card.append(cover, copy);
  tile.append(card);
  if (editing) tile.append(moveControls(game, order.indexOf(game.id)));
  return tile;
}

function render() {
  const query = search.value.trim().toLocaleLowerCase();
  const results = order.map(id => games.find(game => game.id === id))
    .filter(game => game.name.toLocaleLowerCase().includes(query));
  count.textContent = results.length;
  empty.hidden = results.length !== 0;
  grid.replaceChildren(...results.map(gameCard));
}

const legend = document.querySelector('#legend');
legend.append(icon('mac', true), 'Mac', icon('iphone', true), 'iPhone');
legend.querySelectorAll('.device').forEach(item => {
  item.setAttribute('aria-hidden', 'true');
  item.removeAttribute('title');
});
reorder.addEventListener('click', () => {
  editing = !editing;
  reorder.setAttribute('aria-pressed', String(editing));
  reorder.textContent = editing ? 'Done' : 'Reorder';
  reorderHelp.hidden = !editing;
  search.disabled = editing;
  if (editing) search.value = '';
  render();
});
search.addEventListener('input', render);
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});
render();
