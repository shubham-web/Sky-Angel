import { Vector } from "./Vector.js";

const [UP, DOWN, RIGHT, LEFT] = ["UP", "DOWN", "RIGHT", "LEFT"];
export class Player {
	constructor(image) {
		this.image = image;

		this.size = new Vector(image.naturalWidth, image.naturalHeight);

		this.pos = new Vector(10, canvas.height / 2 - this.size.y / 2);
	}
	getBounds = () => {
		return {
			left: this.pos.x,
			top: this.pos.y,
			bottom: this.pos.y + this.size.y,
			right: this.pos.x + this.size.x,
		};
	};
	move = (dir, delta = 5) => {
		let newX = this.pos.x;
		let newY = this.pos.y;

		if (dir === UP) {
			newY -= delta;
		} else if (dir === DOWN) {
			newY += delta;
		} else if (dir === LEFT) {
			newX -= delta * 2;
		} else if (dir === RIGHT) {
			newX += delta;
		}

		newX = clamp(newX, 0, canvas.width - this.size.x);
		newY = clamp(newY, 0, canvas.height - this.size.y);

		this.pos.x = newX;
		this.pos.y = newY;

		return this;
	};
	draw() {
		ctx.save();
		ctx.drawImage(this.image, this.pos.x, this.pos.y);
		/* ctx.strokeStyle = "#000";
		ctx.strokeRect(this.pos.x, this.pos.y, this.size.x, this.size.y); */
		ctx.restore();
	}
}
