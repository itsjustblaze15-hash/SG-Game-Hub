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
const portraitGames = new Set(['fus', 'gp', 'pitchside']);
const play = document.querySelector('#play');
const phoneBuild = '2026-11-21.2';
const repairedGames = new Set(['motor-dynasty', 'redwood', 'second-chance', 'apex-circuit', 'blacktide']);
const phoneLayout = matchMedia('(pointer: coarse) and (max-width: 1100px), (max-height: 550px) and (max-width: 1100px)');
const refreshHub = document.querySelector('#refresh-hub');
const isAppleMobile = /iPhone|iPad/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isNewArcadeDevice = window.SGAppleMobile();

function reloadHub(build) {
  const url = new URL(location.href);
  url.searchParams.set('sg-refresh', String(Date.now()));
  if (build) url.searchParams.set('sg-update', build);
  location.replace(url.href);
}

function bindHubRefresh() {
  if (!isAppleMobile) {
    refreshHub.addEventListener('click', () => {
      refreshHub.disabled = true;
      refreshHub.setAttribute('aria-label', 'Refreshing SG');
      reloadHub();
    });
    return;
  }

  const build = document.querySelector('meta[name="sg-build"]').content;
  const popup = document.querySelector('#hub-update');
  const message = document.querySelector('#hub-update-message');
  const announce = document.querySelector('#hub-update-status');
  const retry = document.querySelector('#hub-update-retry');
  const close = document.querySelector('#hub-update-close');
  const icon = popup.querySelector('.hub-update-icon');
  const validBuild = value => /^\d{10}$/.test(value || '');
  const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
  let hideTimer;
  document.body.classList.add('has-mobile-refresh');

  function hidePopup() {
    popup.hidden = true;
    announce.textContent = '';
  }

  function showPopup(state, text) {
    clearTimeout(hideTimer);
    popup.dataset.state = state;
    icon.textContent = state === 'success' ? '✓' : state === 'error' ? '!' : '';
    message.textContent = text;
    retry.hidden = state !== 'error';
    close.hidden = state !== 'error';
    popup.hidden = false;
    announce.textContent = text;
    if (state === 'success') hideTimer = setTimeout(hidePopup, 3000);
  }

  async function checkForUpdate() {
    if (refreshHub.disabled) return;
    refreshHub.disabled = true;
    showPopup('busy', 'Checking for updates…');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let updating = false;
    try {
      const url = new URL('./index.html', location.href);
      url.searchParams.set('sg-check', String(Date.now()));
      const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error('Update check failed');
      const latest = new DOMParser().parseFromString(await response.text(), 'text/html')
        .querySelector('meta[name="sg-build"]')?.content;
      if (!validBuild(latest) || latest < build) throw new Error('Update check returned an older build');

      await delay(350);
      if (latest === build) {
        showPopup('success', 'You’re on the latest version!');
        return;
      }
      updating = true;
      showPopup('busy', 'Updating you to the newest version…');
      await delay(700);
      reloadHub(latest);
    } catch (error) {
      updating = false;
      showPopup('error', 'Couldn’t check for updates. Check your connection and try again.');
    } finally {
      clearTimeout(timeout);
      if (!updating) refreshHub.disabled = false;
    }
  }

  close.addEventListener('click', () => {
    hidePopup();
    refreshHub.focus();
  });
  retry.addEventListener('click', checkForUpdate);
  refreshHub.addEventListener('click', checkForUpdate);

  const url = new URL(location.href);
  const expected = url.searchParams.get('sg-update');
  if (!validBuild(expected)) return;
  url.searchParams.delete('sg-update');
  history.replaceState(history.state, '', url.href);
  if (build >= expected) {
    showPopup('success', 'You’re on the newest version!');
  } else {
    showPopup('error', 'SG is still on the previous version. Try the update again.');
  }
}

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
  const wantsPortrait = playingGame.mobileExclusive
    ? playingGame.orientation === 'portrait' : portraitGames.has(playingGame.id);
  const needsRotation = !wantsPortrait && portraitPhone.matches;
  if (needsRotation && playingGame.mobileExclusive)
    playerFrame.firstElementChild?.contentWindow?.postMessage({type: 'sg-mobile-pause'}, location.origin);
  rotatePrompt.hidden = !needsRotation;
  playerFrame.classList.toggle('waiting-for-landscape', needsRotation);
  playerFrame.inert = needsRotation;
  if (needsRotation || playerFrame.firstElementChild) return;

  const frame = document.createElement('iframe');
  frame.title = playingGame.name;
  const game = playingGame;
  const source = new URL(game.play, location.href);
  if (game.mobileExclusive) source.searchParams.set('v', document.querySelector('meta[name="sg-build"]').content);
  if (repairedGames.has(game.id)) source.searchParams.set('sg-version', phoneBuild);
  if (game.id === 'little-garden') source.searchParams.set('sg-version', document.querySelector('meta[name="sg-build"]').content);
  const refreshed = new URL(location.href).searchParams.get('sg-refresh');
  if (refreshed) source.searchParams.set('sg-refresh', refreshed);
  frame.src = source.href;
  frame.addEventListener('load', () => applyPhoneLayout(frame, game));
  playerFrame.replaceChildren(frame);
}
portraitPhone.addEventListener('change', syncPlayerOrientation);

function canPlay(game) {
  if (!game?.play) return false;
  if (game.mobileExclusive) return isNewArcadeDevice;
  if (game.id !== 'little-garden') return true;
  return isAppleMobile;
}

function startGame(game) {
  if (!canPlay(game) || !player.hidden) return;
  playingGame = game;
  syncPlayerOrientation();
  document.querySelector('#player-title').textContent = game.name;
  dialog.close();
  player.hidden = false;
  document.body.classList.add('playing');
  sizePlayerToScreen();
  player.classList.toggle('arcade-player', !!game.mobileExclusive);
  if (history.state?.sgHub) history.replaceState({ sgHub: true, sgPlayer: true }, '');
  else history.pushState({ sgHub: true, sgPlayer: true }, '');
  exitGame.focus({ preventScroll: true });
}

play.addEventListener('click', () => startGame(selectedGame));
exitGame.addEventListener('click', () => {
  closeGame();

});
window.addEventListener('popstate', closeGame);
window.addEventListener('message', event => {
  if (!playingGame?.mobileExclusive || event.origin !== location.origin ||
      event.source !== playerFrame.firstElementChild?.contentWindow) return;
  if (event.data?.type === 'sg-mobile-exit') closeGame();
});

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
  dialog.classList.toggle('mobile-details', !!game.mobileExclusive);
  document.querySelector('#game-title').textContent = game.name;
  document.querySelector('#game-genre').textContent = game.subtitle;
  document.querySelector('#game-description').textContent = game.description;
  document.querySelector('#game-devices').replaceChildren(devices(game));
  const playable = canPlay(game);
  play.hidden = !playable;
  play.disabled = !playable;
  const availability = document.querySelector('#availability');
  availability.hidden = playable || !!game.mobileExclusive;
  availability.textContent = game.id === 'little-garden'
    ? 'Playable on iPhone and iPad.'
    : 'Playable in SG on Mac.';
  dialog.showModal();
}

function gameCard(game) {
  const tile = document.createElement('div');
  tile.className = 'game-tile' + (game.mobileExclusive ? ' mobile-exclusive' : '');
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
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(error => console.warn('SG could not set up offline play', error));
}
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});
render();
bindHubRefresh();
