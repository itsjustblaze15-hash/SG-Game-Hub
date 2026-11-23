(() => {
  'use strict';

  window.createGardenUnlocks = function createGardenUnlocks({onContinue = () => {}} = {}) {
    const dialog = document.createElement('dialog');
    dialog.id = 'unlock-dialog';
    dialog.className = 'unlock-dialog';
    dialog.setAttribute('aria-labelledby', 'unlock-name');
    dialog.setAttribute('aria-describedby', 'unlock-message');
    dialog.innerHTML = `
      <div class="unlock-confetti" aria-hidden="true"></div>
      <div class="unlock-model"><div id="unlock-preview-host"></div><div class="unlock-icon" hidden aria-hidden="true"></div></div>
      <section class="unlock-copy">
        <p class="unlock-eyebrow">A LITTLE GARDEN SURPRISE</p>
        <p class="unlock-title"></p>
        <span class="unlock-rarity"></span>
        <h2 id="unlock-name"></h2>
        <p id="unlock-message"></p>
        <button type="button" class="primary unlock-continue">Continue</button>
      </section>`;
    document.body.append(dialog);

    const queue = [];
    const known = new Set();
    const modelHost = dialog.querySelector('#unlock-preview-host');
    const itemIcon = dialog.querySelector('.unlock-icon');
    const continueButton = dialog.querySelector('.unlock-continue');
    const confetti = dialog.querySelector('.unlock-confetti');
    let viewer;
    let current;
    let scheduled = false;

    for (let index = 0; index < 18; index++) {
      const petal = document.createElement('span');
      petal.style.setProperty('--petal-x', (index * 37 % 100) + '%');
      petal.style.setProperty('--petal-turn', (index * 53 % 180) + 'deg');
      petal.style.setProperty('--petal-delay', (index % 5) * .07 + 's');
      petal.style.setProperty('--petal-color', ['#efacc8', '#e7ca70', '#b9cfa1', '#bea8de'][index % 4]);
      confetti.append(petal);
    }

    function schedule() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        openNext();
      });
    }

    function openNext() {
      if (dialog.open || queue.length === 0 || innerHeight > innerWidth || document.hidden) return;
      if (document.querySelector('dialog[open]')) return;
      current = queue[0];
      const isModel = current.type === 'animal' || current.type === 'flower';
      dialog.dataset.unlockKey = current.key;
      dialog.dataset.unlockType = current.type;
      const rarity = current.definition.rarity;
      dialog.dataset.rarity = rarity || 'common';
      const badge = dialog.querySelector('.unlock-rarity');
      badge.hidden = !rarity;
      badge.textContent = rarity ? rarity[0].toUpperCase() + rarity.slice(1) : '';
      dialog.querySelector('.unlock-title').textContent = current.title
        || (current.type === 'animal' ? 'You found a new friend!' : 'Something lovely is yours!');
      dialog.querySelector('#unlock-name').textContent = current.definition.name;
      dialog.querySelector('#unlock-message').textContent = current.message
        || (current.type === 'animal' ? 'Your new friend has a place in the garden.' : 'Keep growing your little garden.');
      modelHost.hidden = !isModel;
      itemIcon.hidden = isModel;
      itemIcon.textContent = current.definition.icon || '✿';
      continueButton.textContent = queue.length > 1 ? 'Next surprise' : 'Back to my garden';
      dialog.classList.remove('unlock-celebrating');
      dialog.showModal();
      if (isModel) {
        viewer ||= createGardenPreviews();
        viewer.mount(modelHost);
        viewer.show(current.type, current.definition);
      }
      void dialog.offsetWidth;
      dialog.classList.add('unlock-celebrating');
      continueButton.focus({preventScroll: true});
    }

    function acknowledge() {
      if (!current || !dialog.open) return;
      const item = current;
      current = null;
      queue.shift();
      viewer?.hide();
      dialog.close();
      onContinue(item);
      schedule();
    }

    continueButton.addEventListener('click', acknowledge);
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      acknowledge();
    });
    dialog.addEventListener('close', () => {
      // A rotation can close all dialogs. Keep the current item queued until the child continues.
      if (!dialog.open) viewer?.hide();
      schedule();
    });
    addEventListener('resize', schedule);
    document.addEventListener('visibilitychange', schedule);
    new MutationObserver(schedule).observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['open']
    });

    function enqueue(items) {
      for (const item of items || []) {
        if (!item?.key || !item.definition?.id || !item.definition?.name || known.has(item.key)) continue;
        known.add(item.key);
        queue.push(item);
      }
      openNext();
    }

    function update(seconds) {
      if (dialog.open) viewer?.update(seconds);
      else if (queue.length) openNext();
    }

    return {enqueue, update};
  };
})();
