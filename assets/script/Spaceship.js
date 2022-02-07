import { Vector } from "./Vector.js";

export class Spaceship {
	constructor(image, pos = { x: 0, y: 0 }) {
		this.image = image;
		this.pos = new Vector(pos.x, pos.y);
		this.size = new Vector(image.naturalWidth, image.naturalHeight);
		this.deltaX = random(1, 3);
		this.hit = 0;
	}
	getBounds = () => {
		return {
			left: this.pos.x,
			top: this.pos.y,
			bottom: this.pos.y + this.size.y,
			right: this.pos.x + this.size.x,
		};
	};
	update() {
		this.pos.x -= this.deltaX * game.speed;
	}
	draw() {
		ctx.save();
		ctx.drawImage(this.image, this.pos.x, this.pos.y);
		ctx.restore();
	}
}
