let firstCard, secondCard;
let lockBoard = false;
let clickCount = 0;
let matchedCount = 0;
let totalPairs = 0;
let timer;
let timeLeft = 0;
let totalTime =30;

const difficultySettings = {
  easy: { pairs: 3, time: 30 },
  medium: { pairs: 6, time: 60 },
  hard: { pairs: 12, time: 90 }
};

function updateStatus() {
  $('#clicks').text(`Number of Clicks: ${clickCount}`);
  $('#matched').text(`Number of Matches: ${matchedCount}`);
  $('#pairs-left').text(`Number of Pairs Left: ${totalPairs - matchedCount}`);
  $('#total-pairs').text(`Total Number of Pairs: ${totalPairs}`);
  $('#timer').text(`${timeLeft}s`);
  $('#total-seconds').text(`${totalTime}s`);
}
function startTimer() {
  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft--;
    updateStatus();
    if (timeLeft <= 0) {
      clearInterval(timer);
      $('.card').off('click');
      $('#message').text('😭Game Over!');
    }
  }, 1000);
}

function resetGame() {
  clearInterval(timer);
  $('#game_grid').empty();
  $('#message').text('');
  clickCount = 0;
  matchedCount = 0;
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
  updateStatus();
}

async function fetchPokemonPairs(count) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=1025`);
  const data = await res.json();
  const all = data.results;
  const selected = [];
  const used = new Set();

  while (selected.length < count) {
    const index = Math.floor(Math.random() * all.length);
    if (!used.has(index)) {
      used.add(index);
      const pokemon = await fetch(all[index].url).then(res => res.json());
      selected.push({
        id: pokemon.id,
        img: pokemon.sprites.other['official-artwork'].front_default
      });
    }
  }

  return selected.flatMap(p => [p, { ...p }]);
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function createCard(pokemon) {
  const template = $('#card-template').html();
  const $card = $(template);
  $card.attr('data-id', pokemon.id);
  $card.find('.front_face').attr('src', pokemon.img);
  return $card;
}

function handleCardClick() {
  if (lockBoard || $(this).hasClass('flip')) return;

  $(this).addClass('flip');
  const currentCard = $(this);

  if (!firstCard) {
    firstCard = currentCard;
    return;
  }

  secondCard = currentCard;
  lockBoard = true;
  clickCount++;
  updateStatus();

  const match = firstCard.attr('data-id') === secondCard.attr('data-id');

  if (match) {
    firstCard.off('click');
    secondCard.off('click');
    matchedCount++;
    updateStatus();
    if (matchedCount === totalPairs) {
      clearInterval(timer);
      $('#message').text('🎉 You Win!');
    }
    resetTurn();
  } else {
    setTimeout(() => {
      firstCard.removeClass('flip');
      secondCard.removeClass('flip');
      resetTurn();
    }, 1000);
  }
}

function resetTurn() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
}

async function startGame() {
  resetGame();
  const level = $('#difficulty').val();
  const timeMap = {easy:30, medium:60, hard:90};
  totalTime = timeMap[level];
  totalPairs = difficultySettings[level].pairs;
  timeLeft = difficultySettings[level].time;

  const pairs = await fetchPokemonPairs(totalPairs);
  const cards = shuffle(pairs.map(createCard));
  $('#game_grid').append(cards);
  $('.card').on('click', handleCardClick);
  $('#card-container').fadeIn(300);
  updateStatus();
  startTimer();
}

function triggerPowerUp() {
  $('.card').addClass('flip');
  setTimeout(() => {
    $('.card').each(function () {
      if (!$(this).hasClass('matched')) {
        $(this).removeClass('flip');
      }
    });
  }, 2000);
}

function toggleTheme() {
  $('body').toggleClass('dark-theme light-theme');
}

$(document).ready(() => {
  $('#start').on('click', startGame);
  $('#reset').on('click', resetGame);
  $('#powerup').on('click', triggerPowerUp);
  $('#theme').on('click', toggleTheme);
});
