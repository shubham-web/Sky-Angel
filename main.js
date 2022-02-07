// imports
import { Game } from "./assets/script/Game.js";

// helpers
window.qs = (selector, parent) => (parent || document).querySelector(selector);
window.qsa = (selector, parent) => (parent || document).querySelectorAll(selector);
window.clamp = (number, min, max) => {
	return Math.min(Math.max(number, min), max);
};
window.random = (min, max) => {
	return min + Math.random() * (max - min);
};

// elements
const instructionsWrapper = qs(".instructions");
const instructions = qs(".how-to-play");
const gameBoard = qs(".game-board");
const gameCanvas = qs("#gameCanvas");
const universe = qs(".universe");
const sensibleAreas = qsa(".universe .sensible-areas > *[data-dir]");
const gameAssets = qsa(".gameAssets");
const playerNameInput = qs("#playerNameInput");
const saveBtn = qs("#saveBtn");

const startGame = qs("#startGame");

// add animation delays
[...instructions.children].forEach((element, index) => {
	element.style.animationDelay = `${index * 50}ms`;
});

// initialize Game
const game = new Game(gameCanvas, gameAssets);
window.game = game;
startGame.addEventListener("click", (e) => {
	instructionsWrapper.classList.add("dn");
	gameBoard.classList.remove("dn");

	game.init(
		{
			width: universe.clientWidth,
			height: universe.clientHeight,
		},
		{
			score: qs("#score"),
			finalScore: qs("#finalScore"),
			finalTimer: qs("#finalTimer"),
			fuelCount: qs("#fuel-count"),
			fuelBar: qs("#bar-fill"),
			timer: qs("#timer"),
			soundOnOff: qs("#soundOnOff"),
			playPause: qs("#playPause"),
			universe,
			sensibleAreas,
		}
	);
	game.start();
});

// game over screen
playerNameInput.addEventListener("input", () => {
	let playerName = playerNameInput.value.trim();
	saveBtn.disabled = !!!playerName;
});
saveBtn.addEventListener("click", () => {
	window.location.reload();
});
