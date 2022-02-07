import { Asteroid } from "./Asteroid.js";
import { Bullet } from "./Bullet.js";
import { Spaceship } from "./Spaceship.js";
import { FuelBox } from "./FuelBox.js";
import { Planet } from "./Planet.js";
import { Player } from "./Player.js";
import { Blast } from "./Blast.js";

const [UP, DOWN, RIGHT, LEFT] = ["UP", "DOWN", "RIGHT", "LEFT"];
const keymap = {
	ArrowUp: UP,
	ArrowDown: DOWN,
	ArrowLeft: LEFT,
	ArrowRight: RIGHT,
};
export class Game {
	constructor(canvas, mediaFiles) {
		this.canvas = canvas;

		// game assets (images, audio, etc.)
		this.gameAssets = {};
		this.gameSounds = [];
		[...mediaFiles].forEach((el) => {
			this.gameAssets[el.id] = el;
			if (el.classList.contains("gameSounds")) {
				this.gameSounds.push(el);
			}
		});
		window.gameAssets = this.gameAssets;

		this.availableAsteroids = [
			{ normal: this.gameAssets.asteroid1, cracked: this.gameAssets.asteroid1Cracked },
			{ normal: this.gameAssets.asteroid2, cracked: this.gameAssets.asteroid2Cracked },
		];

		// timer
		this.timers = [];
		this.lastTick = 0;
		this.startedAt;
		this.pausedAt;

		window.every = this.every;
		window.once = this.once;

		// stats
		this.uiTimer = 0;
		this.score = 0;
		this.fuel = 15;
		this.maxFuel = 30;

		this.activeSensibleArea = null;
		this.pressedArrowKeys = [];

		// elements
		this.playerBullets = [];
		this.enemyBullets = [];
		this.asteroids = [];
		this.enemySpaceships = [];
		this.friendlySpaceships = [];
		this.fuelBoxes = [];
		this.blasts = [];

		// game state
		this.paused = false;
		this.started = false;
		this.ended = false;
		this.muted = false;

		this.speed = 1;
	}
	init = (config, elems) => {
		this.config = config;
		this.elems = elems;

		// globalize canvas and it's context
		window.canvas = this.canvas;
		window.ctx = this.canvas.getContext("2d");

		// set width n height
		this.canvas.width = this.config.width;
		this.canvas.height = this.config.height;

		this.planets = [
			new Planet(this.gameAssets.bigPlanets, { speed: 2 }),
			new Planet(this.gameAssets.smallPlanets, { speed: 1 }),
		];

		this.player = new Player(this.gameAssets.mainSpaceship);

		// refresh score and timer
		this.refreshStats();

		this.addEvents();
	};
	get playing() {
		return this.started && !this.paused && !this.ended;
	}
	tick = () => {
		if (!this.playing) {
			return;
		}
		this.update(); // update data (position velocity etc.)
		this.draw(); // paints stuff on canvas

		this.isGameOver() && this.handleGameOver();

		requestAnimationFrame(this.tick);
	};
	update = () => {
		this.updateTimers();

		let dryUpdate = [...this.planets, ...this.fuelBoxes, ...this.blasts];

		dryUpdate.forEach((el) => {
			el.update();
		});

		// update player
		if (this.activeSensibleArea) {
			this.player.move(this.activeSensibleArea, 5 * (this.speed / 2));
		}
		if (this.pressedArrowKeys.length > 0) {
			for (let dir of this.pressedArrowKeys) {
				this.player.move(dir, 5 * (this.speed / 2));
			}
		}

		// update bullets
		this.playerBullets.forEach((bullet) => {
			// check if it's out of screen
			let bounds = bullet.getBounds();
			if (bounds.left > this.canvas.width) {
				this.playerBullets = this.removeElement(this.playerBullets, bullet);
			}
			bullet.update();
		});

		// update bullets
		this.enemyBullets.forEach((bullet) => {
			// check if it's out of screen
			let bounds = bullet.getBounds();
			if (bounds.right <= 0) {
				this.enemyBullets = this.removeElement(this.enemyBullets, bullet);
			}
			bullet.update();
		});

		// update asteroids
		this.asteroids.forEach((asteroid) => {
			let bounds = asteroid.getBounds();
			if (bounds.right <= 0) {
				this.asteroids = this.removeElement(this.asteroids, asteroid);
			}
			asteroid.update();
		});

		// update enemy spaceships
		this.enemySpaceships.forEach((enemy) => {
			let bounds = enemy.getBounds();
			if (bounds.right <= 0) {
				this.enemySpaceships = this.removeElement(this.enemySpaceships, enemy);
			}
			enemy.update();
		});

		// update friendlyspaceships
		this.friendlySpaceships.forEach((spaceship) => {
			let bounds = spaceship.getBounds();
			if (bounds.right <= 0) {
				this.friendlySpaceships = this.removeElement(this.friendlySpaceships, spaceship);
			}
			spaceship.update();
		});

		// check if blast is ended
		this.blasts = this.blasts.filter((blast) => !blast.ended);

		// Check Collisions

		// player bullets
		let playerBounds = this.player.getBounds();
		this.playerBullets.forEach((bullet) => {
			let bulletBounds = bullet.getBounds();

			// check player bullets X asteroid collision
			this.asteroids.forEach((asteroid) => {
				let asteroidBounds = asteroid.getBounds();
				let collided = this.checkCollision(bulletBounds, asteroidBounds);
				if (collided) {
					asteroid.hit++;
					this.playerBullets = this.removeElement(this.playerBullets, bullet);
				}

				if (asteroid.hit >= 2) {
					this.boom(asteroid.pos, asteroid.size);
					this.asteroids = this.removeElement(this.asteroids, asteroid);
					this.score += 10;
					this.playSound("destroyAudio");
				}
			});

			// check player bullets X enemy spaceships collision
			this.enemySpaceships.forEach((enemy) => {
				let enemyBounds = enemy.getBounds();
				let collided = this.checkCollision(bulletBounds, enemyBounds);
				if (collided) {
					enemy.hit++;
					this.playerBullets = this.removeElement(this.playerBullets, bullet);
				}

				if (enemy.hit >= 1) {
					this.boom(enemy.pos, enemy.size);
					this.enemySpaceships = this.removeElement(this.enemySpaceships, enemy);
					this.score += 5;
					this.playSound("destroyAudio");
				}
			});

			// check player bullets X friendly spaceships collision
			this.friendlySpaceships.forEach((spaceship) => {
				let spaceshipBounds = spaceship.getBounds();
				let collided = this.checkCollision(bulletBounds, spaceshipBounds);
				if (collided) {
					this.playerBullets = this.removeElement(this.playerBullets, bullet);
					this.boom(spaceship.pos, spaceship.size);
					this.friendlySpaceships = this.removeElement(this.friendlySpaceships, spaceship);
					this.score -= 10;
					this.playSound("destroyAudio");
				}
			});
		});

		this.enemyBullets.forEach((bullet) => {
			let bulletBounds = bullet.getBounds();

			// check enemy bullets X player collision
			let collided = this.checkCollision(bulletBounds, playerBounds);
			if (collided) {
				this.enemyBullets = this.removeElement(this.enemyBullets, bullet);

				this.fuel = clamp(this.fuel - 15, 0, this.maxFuel);
			}
		});

		// check fuel x player collision
		this.fuelBoxes.forEach((box) => {
			let boxBounds = box.getBounds();
			let collided = this.checkCollision(playerBounds, boxBounds);
			if (collided) {
				this.fuel = clamp(this.fuel + 15, 0, this.maxFuel);
				this.fuelBoxes = this.removeElement(this.fuelBoxes, box);
				this.playSound("fuelAudio");
			}
		});

		// check asteroid x player collision
		this.asteroids.forEach((asteroid) => {
			let asteroidBounds = asteroid.getBounds();
			let collided = this.checkCollision(playerBounds, asteroidBounds);
			if (collided) {
				this.fuel = clamp(this.fuel - 15, 0, this.maxFuel);
				this.boom(asteroid.pos, asteroid.size);
				this.playSound("destroyAudio");
				this.asteroids = this.removeElement(this.asteroids, asteroid);
			}
		});

		// check enemy spaceship x player collision
		this.enemySpaceships.forEach((spaceship) => {
			let spaceshipBounds = spaceship.getBounds();
			let collided = this.checkCollision(playerBounds, spaceshipBounds);
			if (collided) {
				this.fuel = clamp(this.fuel - 15, 0, this.maxFuel);
				this.boom(spaceship.pos, spaceship.size);
				this.playSound("destroyAudio");
				this.enemySpaceships = this.removeElement(this.enemySpaceships, spaceship);
			}
		});
	};
	checkCollision = (firstElBounds, secondElBounds) => {
		return (
			firstElBounds.right > secondElBounds.left &&
			firstElBounds.left < secondElBounds.right &&
			firstElBounds.bottom > secondElBounds.top &&
			firstElBounds.top < secondElBounds.bottom
		);
	};
	draw = () => {
		this.clearCanvas();

		let elements = [
			...this.planets,
			...this.blasts,
			...this.enemyBullets,
			...this.playerBullets,
			...this.friendlySpaceships,
			...this.asteroids,
			...this.enemySpaceships,
			...this.fuelBoxes,
			this.player,
		];

		for (let el of elements) {
			el.draw();
		}

		this.refreshStats();
	};
	updateTimers = () => {
		let currentTick = Date.now() - this.startedAt; // ms lapsed since game start
		let skippedFrames = currentTick - this.lastTick;
		while (skippedFrames--) {
			this.runTimers(++this.lastTick);
		}
	};
	every = (ms, cb, once = false) => {
		this.timers.push({
			every: ms,
			cb: cb,
			once: once,
		});
	};
	once = (ms, cb) => {
		this.every(this.lastTick + ms, cb, true);
	};
	runTimers = (tick) => {
		this.timers.forEach((timer) => {
			if (tick % timer.every === 0) {
				timer.cb();
				if (timer.once) {
					this.timers = this.timers.filter((innerTimer) => innerTimer !== timer);
				}
			}
		});
	};
	start = () => {
		this.started = true;
		this.startedAt = Date.now();
		this.lastTick = 0;

		this.once(1000, () => {
			this.generateFuelBox();
		});
		this.every(1000, () => {
			this.uiTimer++;

			if (this.fuel > 0) {
				this.fuel--;
			}
			this.refreshStats();
		});
		this.once(2000, () => {
			this.generateAsteroid();
			this.generateEnemy();
			this.generateFriendlySpaceship();
		});

		this.every(3000, () => {
			this.shootEnemyBullets();
		});

		this.every(7000, () => {
			this.generateEnemy();
		});

		this.every(6000, () => {
			this.generateAsteroid();

			this.speed = parseFloat((this.speed + 0.2).toPrecision(2));
		});
		this.every(10000, () => {
			this.generateFriendlySpaceship();
			this.generateFuelBox();
		});

		requestAnimationFrame(this.tick);
	};
	refreshStats = () => {
		this.elems.score.innerHTML = this.score;
		this.elems.fuelCount.innerHTML = this.fuel;
		this.elems.timer.innerHTML = `${this.uiTimer}s`;

		Object.assign(this.elems.fuelBar.style, {
			width: `${(this.fuel / this.maxFuel) * 100}%`,
		});

		// if fuel is less than 4 drop a fuel box
		if (this.fuel < 5) {
			if (this.fuelBoxes.length === 0) {
				this.generateFuelBox();
			}
			this.elems.fuelCount.parentElement.classList.add("red");
		} else {
			this.elems.fuelCount.parentElement.classList.remove("red");
		}

		this.elems.playPause.classList.remove("PLAY", "PAUSE");
		this.elems.playPause.classList.add(this.paused ? "PLAY" : "PAUSE");

		this.elems.soundOnOff.classList.remove("ONN", "OFF");
		this.elems.soundOnOff.classList.add(this.muted ? "OFF" : "ONN");

		this.elems.universe.classList.remove("gameOver", "gamePaused");
		this.paused && this.elems.universe.classList.add("gamePaused");
		this.ended &&
			(this.elems.universe.classList.add("gameOver"),
			(this.elems.finalScore.innerHTML = this.score),
			(this.elems.finalTimer.innerHTML = `${this.uiTimer}s`));
	};
	clearCanvas = () => {
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		/* ctx.fillStyle = "#2229a650";
		ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); */
	};
	addEvents = () => {
		window.addEventListener("keyup", (e) => {
			let _ = e.code;
			if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(_)) {
				this.pressedArrowKeys = this.pressedArrowKeys.filter((inner) => inner !== keymap[_]);
			}
		});
		window.addEventListener("keydown", (e) => {
			let _ = e.code;
			_ === "KeyP" && this.togglePause();

			if (!this.playing) {
				return;
			}
			_ === "KeyM" && this.toggleSound();

			if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(_) && !e.repeat) {
				this.activeSensibleArea = null;
				if (!this.pressedArrowKeys.includes(keymap[_])) {
					this.pressedArrowKeys.push(keymap[_]);
				}
			}

			if (_ === "Space" && !e.repeat) {
				let playerBound = this.player.getBounds();
				this.playerBullets.push(
					new Bullet(this.gameAssets.playerbullet, {
						x: playerBound.right - this.gameAssets.playerbullet.naturalWidth / 2,
						y: playerBound.top + this.player.size.y / 2 - this.gameAssets.playerbullet.naturalHeight / 2,
					})
				);
				this.playSound("shootAudio");
			}
		});
		this.elems.sensibleAreas.forEach((area) => {
			area.addEventListener("mouseenter", () => {
				this.activeSensibleArea = area.dataset.dir;
			});
			area.addEventListener("mouseleave", () => {
				this.activeSensibleArea = null;
			});
		});
		this.elems.playPause.addEventListener("click", () => {
			this.togglePause();
		});
		this.elems.soundOnOff.addEventListener("click", () => {
			this.toggleSound();
		});
	};
	generateAsteroid = () => {
		let randomAsteroid = this.availableAsteroids[random(0, this.availableAsteroids.length) | 0];
		this.asteroids.push(
			new Asteroid(randomAsteroid, {
				x: this.canvas.width - 10,
				y: random(0, this.canvas.height - randomAsteroid.normal.naturalHeight),
			})
		);
	};
	generateFriendlySpaceship = () => {
		this.friendlySpaceships.push(
			new Spaceship(this.gameAssets.friendlySpaceship, {
				x: this.canvas.width - 10,
				y: random(0, this.canvas.height - this.gameAssets.friendlySpaceship.naturalHeight),
			})
		);
	};
	generateEnemy = () => {
		this.enemySpaceships.push(
			new Spaceship(this.gameAssets.enemy, {
				x: this.canvas.width - 10,
				y: random(0, this.canvas.height - this.gameAssets.enemy.naturalHeight),
			})
		);
	};
	shootEnemyBullets = () => {
		if (this.enemySpaceships.length === 0) return;
		let randomEnemy = this.enemySpaceships[random(0, this.enemySpaceships.length) | 0];
		let enemyBounds = randomEnemy.getBounds();
		this.enemyBullets.push(
			new Bullet(
				this.gameAssets.enemyBullet,
				{
					x: enemyBounds.left - this.gameAssets.enemyBullet.naturalWidth / 2,
					y: enemyBounds.top + randomEnemy.size.y / 2 - this.gameAssets.enemyBullet.naturalHeight / 2,
				},
				-1
			)
		);
	};
	generateFuelBox = () => {
		this.fuelBoxes.push(
			new FuelBox(this.gameAssets.fuelElement, {
				x: random(this.canvas.width * 0.1, this.canvas.width * 0.6 - this.gameAssets.fuelElement.naturalWidth),
				y: -this.gameAssets.fuelElement.naturalHeight,
			})
		);
	};
	isGameOver = () => {
		return this.fuel === 0;
	};
	playSound = (key) => {
		if (!this.gameAssets[key]) {
			return;
		}
		this.gameAssets[key].currentTime = 0;
		this.gameAssets[key].play();
	};
	removeElement = (arr, elem) => {
		return arr.filter((inner) => inner !== elem);
	};
	togglePause = () => {
		if (this.ended) {
			return;
		}
		this.paused = !this.paused;

		if (!this.paused) {
			this.lastTick += Date.now() - this.pausedAt;
			requestAnimationFrame(this.tick);
		} else {
			this.pausedAt = Date.now();
		}

		this.refreshStats();
	};
	toggleSound = () => {
		if (this.ended) {
			return;
		}
		this.muted = !this.muted;

		this.gameSounds.forEach((el) => {
			el.muted = this.muted;
		});

		this.refreshStats();
	};
	handleGameOver = () => {
		this.ended = true;
		this.playSound("gameOver");
		this.refreshStats();
	};
	boom = (pos, size) => {
		let blast = new Blast(this.gameAssets.blastSprite, pos, size);
		this.blasts.push(blast);
	};
}
