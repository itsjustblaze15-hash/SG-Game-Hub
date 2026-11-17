const search = document.querySelector('#search');
const grid = document.querySelector('#games');
const count = document.querySelector('#count');
const empty = document.querySelector('#empty');
const dialog = document.querySelector('#details');

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
  document.querySelector('#game-cover').src = game.cover;
  document.querySelector('#game-title').textContent = game.name;
  document.querySelector('#game-genre').textContent = game.subtitle;
  document.querySelector('#game-description').textContent = game.description;
  document.querySelector('#game-devices').replaceChildren(devices(game));
  const play = document.querySelector('#play');
  if (game.play) play.href = game.play;
  else play.removeAttribute('href');
  play.hidden = !game.play;
  document.querySelector('#availability').hidden = !!game.play;
  dialog.showModal();
}

function gameCard(game) {
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
  return card;
}

function render() {
  const query = search.value.trim().toLocaleLowerCase();
  const results = games.filter(game => game.name.toLocaleLowerCase().includes(query));
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
search.addEventListener('input', render);
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});
render();
