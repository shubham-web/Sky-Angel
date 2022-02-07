import { Vector } from "./Vector.js";

export class Blast {
	constructor(image, pos = { x: 0, y: 0 }, size = { x: 100, y: 100 }) {
		this.image = image;
		this.pos = new Vector(pos.x, pos.y + size.y / 2 - 50);
		let dimension = Math.min(size.x, size.y);
		this.size = new Vector(dimension, dimension); // passing x for both to maintain the square ratio of sprite

		this.ended = false;
		this.offsetX = 0;
		this.offsetY = 0;
	}
	update = () => {
		this.offsetX += 100;

		if (this.offsetX > 800) {
			if (this.offsetY > 800) {
				this.ended = true;
			} else {
				this.offsetX = 0;
				this.offsetY += 100;
			}
		}
	};
	draw = () => {
		ctx.save();
		ctx.drawImage(this.image, this.offsetX, this.offsetY, 100, 100, this.pos.x, this.pos.y, 100, 100);
		ctx.restore();
	};
}
