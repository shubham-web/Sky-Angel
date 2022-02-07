import { Vector } from "./Vector.js";

export class Planet {
	constructor(image, config = {}) {
		this.image = image;
		this.config = config;
		this.pos = new Vector(0, 0);
		this.posRepeat = new Vector(canvas.width, 0);
		this.size = new Vector(image.naturalWidth, image.naturalHeight);
	}
	update() {
		this.pos.x = this.pos.x - this.config.speed * game.speed;
		this.posRepeat.x = this.posRepeat.x - this.config.speed * game.speed;

		// refresh position if it goes beyond canvas
		if (this.pos.x + this.size.x < 0) {
			this.pos.x = this.posRepeat.x + this.size.x;
		}
		if (this.posRepeat.x + this.size.x < 0) {
			this.posRepeat.x = this.pos.x + this.size.x;
		}
	}
	draw() {
		ctx.save();
		ctx.globalAlpha = 0.1;
		ctx.drawImage(this.image, this.pos.x, this.pos.y);
		ctx.drawImage(this.image, this.posRepeat.x, this.posRepeat.y);
		ctx.restore();
	}
}
