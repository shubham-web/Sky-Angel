import { Vector } from "./Vector.js";

export class Asteroid {
	constructor(image, pos = { x: 0, y: 0 }) {
		this.image = image.normal;
		this.cracked = image.cracked;
		this.pos = new Vector(pos.x, pos.y);
		this.size = new Vector(this.image.naturalWidth, this.image.naturalHeight);
		this.angle = 360;
		this.angleDelta = random(0.1, 1);
		this.speed = random(0.5, 2);

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
		this.pos.x -= this.speed * game.speed;
		this.angle -= this.angleDelta * game.speed;
	}
	draw() {
		ctx.save();
		let translateX = this.pos.x + this.size.x / 2;
		let translateY = this.pos.y + this.size.y / 2;
		ctx.translate(translateX, translateY);
		ctx.rotate(this.angle * (Math.PI / 180));
		ctx.translate(-translateX, -translateY);

		ctx.drawImage(this.hit === 0 ? this.image : this.cracked, this.pos.x, this.pos.y);
		ctx.restore();
	}
}
