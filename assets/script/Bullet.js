import { Vector } from "./Vector.js";

export class Bullet {
	constructor(image, pos = { x: 0, y: 0 }, deltaTimes = 1) {
		this.image = image;
		this.pos = new Vector(pos.x, pos.y);
		this.size = new Vector(image.naturalWidth, image.naturalHeight);
		this.delta = random(5, 15) | 0;
		this.delta *= deltaTimes;
	}
	getBounds = () => {
		return {
			left: this.pos.x,
			top: this.pos.y,
			bottom: this.pos.y + this.size.y,
			right: this.pos.x + this.size.x,
		};
	};
	update = () => {
		this.pos.x += this.delta * game.speed;
	};
	draw() {
		ctx.save();
		ctx.drawImage(this.image, this.pos.x, this.pos.y);
		ctx.restore();
	}
}
