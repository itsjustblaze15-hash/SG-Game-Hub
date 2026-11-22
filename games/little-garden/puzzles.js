(() => {
  const topics = [
    {id: 'add', label: 'Add', icon: '＋', prompt: 'How many flowers altogether?'},
    {id: 'subtract', label: 'Take away', icon: '−', prompt: 'How many flowers are left?'},
    {id: 'spell', label: 'Spell', icon: 'Aa', prompt: 'Which letter is missing?'},
    {id: 'multiply', label: 'Groups', icon: '×', prompt: 'How many flowers in all the groups?'}
  ];
  const numbers = {
    add: [[1, 2], [2, 2], [1, 4], [2, 3], [3, 3], [4, 2], [3, 4], [4, 4], [5, 3], [5, 4], [5, 5]],
    subtract: [[3, 1], [4, 2], [4, 4], [5, 2], [5, 4], [6, 1], [6, 3], [7, 3], [7, 5], [8, 4], [8, 5], [9, 6]],
    multiply: [[2, 2], [2, 3], [2, 4], [2, 5], [3, 2], [3, 3], [3, 4]]
  };
  const words = [
    {word: 'SUN', index: 1, icon: '☀️', choices: ['U', 'O', 'A']},
    {word: 'BEE', index: 0, icon: '🐝', choices: ['B', 'D', 'P']},
    {word: 'BUD', index: 2, icon: '🌱', choices: ['D', 'P', 'T']},
    {word: 'SEED', index: 2, icon: '🫘', choices: ['E', 'A', 'I']},
    {word: 'RAIN', index: 0, icon: '🌧️', choices: ['R', 'S', 'G']},
    {word: 'LEAF', index: 0, icon: '🍃', choices: ['L', 'B', 'T']},
    {word: 'ROSE', index: 1, icon: '🌹', choices: ['O', 'U', 'A']},
    {word: 'POT', index: 2, icon: '🪴', choices: ['T', 'D', 'M']},
    {word: 'BIRD', index: 1, icon: '🐦', choices: ['I', 'E', 'U']},
    {word: 'FROG', index: 2, icon: '🐸', choices: ['O', 'U', 'E']}
  ];

  function shuffled(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index--) {
      const swap = Math.floor(Math.random() * (index + 1));
      [result[index], result[swap]] = [result[swap], result[index]];
    }
    return result;
  }

  function numberQuestion(topic, [left, right]) {
    const operators = {add: '+', subtract: '−', multiply: '×'};
    const answer = {
      add: left + right,
      subtract: left - right,
      multiply: left * right
    }[topic];
    const alternatives = shuffled([-2, -1, 1, 2].map(offset => answer + offset).filter(number => number >= 0));
    return {
      answer: String(answer),
      expression: left + ' ' + operators[topic] + ' ' + right + ' = ?',
      equationLabel: left + ' ' + {add: 'plus', subtract: 'minus', multiply: 'times'}[topic] + ' ' + right + ' equals how many?',
      options: shuffled([answer, ...alternatives.slice(0, 2)]).map(String),
      groups: {add: [left, right], subtract: [left], multiply: Array(left).fill(right)}[topic],
      crossed: topic === 'subtract' ? right : 0,
      hint: {
        add: 'Count the flowers in both bunches.',
        subtract: 'Count only the flowers without a line through them.',
        multiply: 'Count the flowers in each bunch, then add the bunches together.'
      }[topic],
      complete: left + ' ' + operators[topic] + ' ' + right + ' = ' + answer
    };
  }

  function wordQuestion({word, index, icon, choices}) {
    const answer = word[index];
    const missing = [...word];
    missing[index] = '＿';
    return {
      answer, icon, word,
      expression: missing.join(' '),
      equationLabel: 'Spell ' + word.toLowerCase() + '. ' + missing.map(letter => letter === '＿' ? 'blank' : letter).join(' '),
      options: shuffled(choices),
      hint: index === 0
        ? 'Say “' + word.toLowerCase() + '” slowly. Listen for the first sound.'
        : index === word.length - 1
          ? 'Say “' + word.toLowerCase() + '” slowly. Listen for the last sound.'
          : 'Say “' + word.toLowerCase() + '” slowly. Think about the letter between the ones you can see.',
      complete: 'You spelled ' + word + '!'
    };
  }

  function pictureFor(question, topic) {
    const picture = document.createElement('div');
    picture.className = 'puzzle-picture';
    picture.setAttribute('aria-hidden', 'true');
    if (question.word) {
      picture.classList.add('puzzle-word-icon');
      picture.textContent = question.icon;
      return picture;
    }

    question.groups.forEach((amount, groupIndex) => {
      if (groupIndex > 0 && topic === 'add') {
        const plus = document.createElement('span');
        plus.className = 'puzzle-plus';
        plus.textContent = '+';
        picture.append(plus);
      }
      const group = document.createElement('div');
      group.className = 'puzzle-bunch';
      for (let number = 0; number < amount; number++) {
        const flower = document.createElement('span');
        flower.className = 'puzzle-flower';
        flower.textContent = groupIndex % 2 ? '🌸' : '🌼';
        if (number >= amount - question.crossed) flower.classList.add('puzzle-crossed');
        group.append(flower);
      }
      picture.append(group);
    });
    return picture;
  }

  window.installGardenPuzzles = function installGardenPuzzles(dialog, {onSolve = () => {}} = {}) {
    dialog.classList.add('puzzle-dialog');
    dialog.setAttribute('aria-labelledby', 'puzzles-title');
    dialog.innerHTML = `
      <div class="puzzle-header">
        <h2 id="puzzles-title">Garden puzzles</h2>
        <form method="dialog"><button type="submit" aria-label="Close garden puzzles">×</button></form>
      </div>
      <div class="puzzle-topics" role="group" aria-label="Choose a puzzle type"></div>
      <section class="puzzle-card" aria-labelledby="puzzle-instruction">
        <h3 id="puzzle-instruction"></h3>
        <div class="puzzle-clue"></div>
        <p class="puzzle-equation"></p>
      </section>
      <div class="puzzle-answers" role="group" aria-label="Answers"></div>
      <p class="puzzle-feedback" aria-live="polite" aria-atomic="true"></p>
      <button type="button" class="puzzle-next" hidden>Next puzzle <span aria-hidden="true">→</span></button>
    `;
    const topicButtons = dialog.querySelector('.puzzle-topics');
    const instruction = dialog.querySelector('#puzzle-instruction');
    const clue = dialog.querySelector('.puzzle-clue');
    const equation = dialog.querySelector('.puzzle-equation');
    const answers = dialog.querySelector('.puzzle-answers');
    const feedback = dialog.querySelector('.puzzle-feedback');
    const next = dialog.querySelector('.puzzle-next');
    const decks = new Map();
    const questions = new Map();
    let topic = topics[0].id;

    function drawQuestion() {
      const previous = questions.get(topic)?.source;
      let deck = decks.get(topic);
      if (!deck?.length) {
        deck = shuffled(topic === 'spell' ? words : numbers[topic]);
        if (deck.at(-1) === previous) deck.unshift(deck.pop());
        decks.set(topic, deck);
      }
      const source = deck.pop();
      return {
        source,
        ...(topic === 'spell' ? wordQuestion(source) : numberQuestion(topic, source)),
        solved: false,
        tried: new Set()
      };
    }

    function checkAnswer(question, button) {
      const chosen = button.value;
      if (question.solved || question.tried.has(chosen)) return;
      if (chosen !== question.answer) {
        question.tried.add(chosen);
        button.dataset.result = 'try';
        button.setAttribute('aria-disabled', 'true');
        feedback.dataset.state = 'hint';
        feedback.textContent = 'Try again! ' + question.hint;
        return;
      }
      question.solved = true;
      for (const option of answers.children) option.setAttribute('aria-disabled', 'true');
      button.dataset.result = 'correct';
      feedback.dataset.state = 'correct';
      feedback.textContent = 'Nice work! ' + question.complete;
      next.hidden = false;
      onSolve({topic, answer: chosen});
    }

    function showQuestion({focusAnswer = false} = {}) {
      if (!questions.has(topic)) questions.set(topic, drawQuestion());
      const question = questions.get(topic);
      for (const button of topicButtons.children) {
        button.setAttribute('aria-pressed', String(button.dataset.topic === topic));
      }
      instruction.textContent = topics.find(item => item.id === topic).prompt;
      clue.replaceChildren(pictureFor(question, topic));
      const visible = document.createElement('span');
      visible.setAttribute('aria-hidden', 'true');
      visible.textContent = question.expression;
      const spoken = document.createElement('span');
      spoken.className = 'puzzle-spoken';
      spoken.textContent = question.equationLabel;
      equation.replaceChildren(visible, spoken);
      feedback.dataset.state = question.solved ? 'correct' : question.tried.size ? 'hint' : '';
      feedback.textContent = question.solved
        ? 'Nice work! ' + question.complete
        : question.tried.size ? 'Try again! ' + question.hint : '';
      next.hidden = !question.solved;
      answers.replaceChildren(...question.options.map(value => {
        const button = document.createElement('button');
        button.type = 'button';
        button.value = value;
        button.textContent = value;
        if (question.tried.has(value)) button.dataset.result = 'try';
        if (question.solved && value === question.answer) button.dataset.result = 'correct';
        if (question.solved || question.tried.has(value)) button.setAttribute('aria-disabled', 'true');
        button.addEventListener('click', () => checkAnswer(question, button));
        return button;
      }));
      if (focusAnswer) answers.firstElementChild.focus();
    }

    for (const {id, label, icon} of topics) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.topic = id;
      if (id === topic) button.autofocus = true;
      const symbol = document.createElement('span');
      symbol.textContent = icon;
      symbol.setAttribute('aria-hidden', 'true');
      button.append(symbol, label);
      button.addEventListener('click', () => {
        if (topic === id) return;
        topic = id;
        showQuestion();
      });
      topicButtons.append(button);
    }
    next.addEventListener('click', () => {
      questions.set(topic, drawQuestion());
      showQuestion({focusAnswer: true});
    });

    return {
      open() {
        if (dialog.open) return;
        showQuestion();
        dialog.showModal();
      }
    };
  };
})();
