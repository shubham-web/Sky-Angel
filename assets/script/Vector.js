export class Vector {
	constructor(x = 0, y = 0) {
		this._x = x;
		this._y = y;
	}
	get x() {
		return this._x;
	}
	get y() {
		return this._y;
	}
	set x(newValue) {
		this._x = newValue;
	}
	set y(newValue) {
		this._y = newValue;
	}
}
