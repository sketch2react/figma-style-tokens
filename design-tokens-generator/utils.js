module.exports.convertName = (name) => {
  return name.toLowerCase().replace(" ", "-");
}

module.exports.rgbHex = (red, green, blue, alpha) => {
	const isPercent = (red + (alpha || '')).toString().includes('%');

	if (typeof red === 'string') {
		[red, green, blue, alpha] = red.match(/(0?\.?\d+)%?\b/g).map(component => Number(component));
	} else if (alpha !== undefined) {
		alpha = Number.parseFloat(alpha);
	}

	if (typeof red !== 'number' ||
		typeof green !== 'number' ||
		typeof blue !== 'number' ||
		red > 255 ||
		green > 255 ||
		blue > 255
	) {
		throw new TypeError('Expected three numbers below 256');
	}

	if (typeof alpha === 'number') {
		if (!isPercent && alpha >= 0 && alpha <= 1) {
			alpha = Math.round(255 * alpha);
		} else if (isPercent && alpha >= 0 && alpha <= 100) {
			alpha = Math.round(255 * alpha / 100);
		} else {
			throw new TypeError(`Expected alpha value (${alpha}) as a fraction or percentage`);
		}

		alpha = (alpha | 1 << 8).toString(16).slice(1); // eslint-disable-line no-mixed-operators
	} else {
		alpha = '';
	}

	// TODO: Remove this ignore comment.
	// eslint-disable-next-line no-mixed-operators
	return "#" + ((blue*255 | green*255 << 8 | red*255 << 16) | 1 << 24).toString(16).slice(1) + (alpha == "ff" ? "" : alpha);
}

module.exports.figmaRgba = (color) => {
    const { r, g, b, a} = color;
    const red = r < 1 && r > 0 ? (r*100).toFixed(0) + "%" : r;
    const green = g < 1 && g > 0 ? (g*100).toFixed(0) + "%" : g;
    const blue = b < 1 && b > 0 ? (b*100).toFixed(0) + "%" : b;

    return `${red}, ${green}, ${blue}, ${a}`;
}