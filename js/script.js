"use strict";

const WINNING_PATHS = [
  // horizontal paths
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],

  // vertical paths
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],

  // diagonal paths
  [0, 4, 8],
  [2, 4, 6],
];

const DOM = {
  game: document.getElementById("game"),
  modal: document.getElementById("modal-wrapper"),
  forms: [...document.querySelectorAll(".player-form")],
  board: document.getElementById("board"),
  tiles: [...document.querySelectorAll(".tile")],
  gameInfo: document.getElementById("game-info"),
  players: [...document.querySelectorAll(".player")],
  startGameButton: document.getElementById("start-game"),
  newGameButton: document.getElementById("new-game"),
  changePlayersButton: document.getElementById("change-players"),
  mainMenuButton: document.getElementById("main-menu"),
};

const player = function (name, marker) {
  return { name, marker };
};

const gameBoard = (function () {
  const board = new Array(9).fill("");

  const addMark = (index, mark) => {
    board[index] = mark;
  };

  const checkForWin = (mark) => {
    return WINNING_PATHS.reduce(
      (winPath, path) =>
        path.every((index) => board[index] === mark) ? path : winPath,
      false
    );
  };

  const checkForTie = () => board.every((tile) => tile !== "");

  const clearBoard = () => board.fill("");

  return { addMark, checkForWin, checkForTie, clearBoard };
})();

const displayController = (function () {
  const { board, tiles, gameInfo, players, modal, game, forms } = DOM;

  const setPlayerName = (name, mark) => {
    players.forEach((player) => {
      if (player.dataset.marker === mark) {
        player.querySelector(".player-name").textContent = name;
      }
    });
  };

  const showWinPath = (path) => {
    path.forEach((index) => (tiles[index].dataset.win = "true"));
    board.dataset.status = "win";
  };

  const showTie = () => {
    board.dataset.status = "tie";
    setTurn("");
  };

  const clearBoard = () => {
    tiles.forEach((tile) => {
      tile.dataset.marker = "";
      tile.dataset.win = "";
    });
  };

  const startGame = () => {
    board.dataset.status = "playing";
    tiles.forEach((tile) => (tile.tabIndex = 0));
  };

  const endGame = () => {
    tiles.forEach((tile) => (tile.tabIndex = -1));
  };

  const setTurn = (mark) => (gameInfo.dataset.turn = mark);

  const markTile = (index, mark) => (tiles[index].dataset.marker = mark);

  const hideModal = () => {
    modal.classList.add("hidden");
    game.classList.remove("hidden");
  };

  const showModal = () => {
    modal.classList.remove("hidden");
    game.classList.add("hidden");
  };

  const setModalFormInputValues = (player1Name, player2Name) => {
    forms[0].querySelector("input").value = player1Name;
    forms[1].querySelector("input").value = player2Name;
  };

  return {
    setTurn,
    setPlayerName,
    markTile,
    clearBoard,
    showWinPath,
    showTie,
    startGame,
    endGame,
    hideModal,
    showModal,
    setModalFormInputValues,
  };
})();

const gameController = (function () {
  const players = {
    x: null,
    o: null,
  };
  let turn;
  let confetti;

  function generateConfetti() {
    confetti = new ConfettiGenerator({
      target: "confetti",
      rotate: true,
      colors: [
        [139, 233, 253],
        [80, 250, 123],
        [255, 184, 108],
        [255, 121, 198],
        [189, 147, 249],
        [255, 85, 85],
        [241, 250, 140],
      ],
    });
    confetti.render();
  }

  function clearConfetti() {
    confetti && confetti.clear();
    confetti = undefined;
  }

  const {
    tiles,
    startGameButton,
    newGameButton,
    changePlayersButton,
    mainMenuButton,
    forms,
  } = DOM;

  const takeTurn = (e) => {
    e.stopPropagation();
    const index = Number(e.target.dataset.index);
    gameBoard.addMark(index, turn);
    displayController.markTile(index, turn);
    const winPath = gameBoard.checkForWin(turn);
    if (winPath) {
      endGame(winPath, false);
    } else if (gameBoard.checkForTie()) {
      endGame();
    } else {
      nextTurn();
    }
  };

  const addTileEventListeners = () => {
    tiles.forEach((tile) => {
      tile.addEventListener("click", takeTurn, {
        once: true,
      });
    });
  };

  const removeTileEventListeners = () => {
    tiles.forEach((tile) => {
      tile.removeEventListener("click", takeTurn, {
        once: true,
      });
    });
  };

  const addPlayer = (player) => {
    players[player.marker] = player;
  };

  const clearPlayers = () => {
    players.x = null;
    players.o = null;
  };

  const getFirstTurn = () => (Math.random() > 0.5 ? "x" : "o");

  const nextTurn = () => {
    turn = turn === "x" ? "o" : "x";
    displayController.setTurn(turn);
  };

  const endGame = (winPath = [], tie = true) => {
    removeTileEventListeners();
    displayController.endGame();
    if (tie) {
      displayController.showTie();
    } else {
      displayController.showWinPath(winPath);
      generateConfetti();
    }
  };

  const startGame = () => {
    clearConfetti();
    addTileEventListeners();
    turn = getFirstTurn();
    gameBoard.clearBoard();
    displayController.setTurn(turn);
    displayController.clearBoard();
    displayController.startGame();
  };

  const ready = () => players.x && players.o;

  const handleStartGame = () => {
    if (!ready()) {
      alert("You need to enter both players");
      return;
    }
    displayController.hideModal();
    displayController.setPlayerName(players.x.name, "x");
    displayController.setPlayerName(players.o.name, "o");
    startGame();
  };

  const handlePlayerFormSubmit = (e) => {
    e.preventDefault();
    const marker = e.target.dataset.marker;

    const formData = new FormData(e.target);
    const { name } = Object.fromEntries(formData);

    if (players[marker]) {
      // player already exists, so update the name
      players[marker].name = name;
    } else {
      // player does not exist, so create and add it
      const newPlayer = player(name, marker);
      addPlayer(newPlayer);
    }
    console.log(players);
  };

  const changePlayers = () => {
    displayController.setModalFormInputValues(players.x.name, players.o.name);
    displayController.showModal();
  };

  const goToMainMenu = () => {
    clearPlayers();
    displayController.setModalFormInputValues("", "");
    displayController.showModal();
  };

  forms.forEach((form) => {
    form.addEventListener("submit", handlePlayerFormSubmit);
  });
  startGameButton.addEventListener("click", handleStartGame);
  newGameButton.addEventListener("click", startGame);
  changePlayersButton.addEventListener("click", changePlayers);
  mainMenuButton.addEventListener("click", goToMainMenu);
})();
