"use strict";

const TOOLS_CSS_ADDR = "/fonts/tools/tools.css";

function clamp(number, min, max) {
	return Math.min(Math.max(number, min), max);
}

class FontTestbed extends HTMLElement {
	constructor() {
		super();
	}

	createTitle(text) {
		let axesTitle = document.createElement("span");
		axesTitle.setAttribute("class", "infoTitle");
		axesTitle.innerText = text;
		return axesTitle;
	}

	createSlider(name, min, max, value, onUpdateCallback) {
		let container = document.createElement("span");
		container.setAttribute("class", "axisContainer");

		let label = document.createElement("span");
		label.textContent = name;

		let slider = document.createElement("input");
		slider.setAttribute("type", "range");
		slider.setAttribute("min", min);
		slider.setAttribute("max", max);
		slider.value = value;

		let textInput = document.createElement("input");
		textInput.setAttribute("type", "number");
		textInput.value = value;

		slider.addEventListener("input", () => {
			textInput.value = slider.valueAsNumber;
			onUpdateCallback(slider.valueAsNumber);
		});

		textInput.addEventListener("change", () => {
			textInput.value = clamp(textInput.valueAsNumber, slider.min, slider.max);
			slider.value = textInput.valueAsNumber;
			onUpdateCallback(slider.valueAsNumber);
		});

		let setter = (value) => {
			textInput.value = clamp(value, slider.min, slider.max);
			slider.value = value;
		}

		container.appendChild(label);
		container.appendChild(slider);
		container.appendChild(textInput);

		return [container, setter];
	}

	createToggle(name, value, onUpdateCallback) {
		let container = document.createElement("span");
		container.setAttribute("class", "featureContainer");

		let label = document.createElement("span");
		label.textContent = name;

		let checkbox = document.createElement("input");
		checkbox.setAttribute("type", "checkbox");
		checkbox.checked = value;
		label.appendChild(checkbox);

		label.addEventListener("click", () => {
			checkbox.checked = !checkbox.checked;
			onUpdateCallback(checkbox.checked);
		});

		container.appendChild(label);
		return container;
	}

	// Element functionality written in here
	connectedCallback() {
		//this.displayText = this.childNodes[0].textContent.trim();

		this.fontName = this.getAttribute("font-name");
		this.font = document.iftMeta[this.fontName];
		this.fontSize = parseInt(this.hasAttribute("font-size") ? this.getAttribute("font-size") : 72);
		this.textColumns = parseInt(this.hasAttribute("text-columns") ? this.getAttribute("text-columns") : 1);
		this.multiline = this.hasAttribute("multiline");
		this.isAutoFitting = !this.multiline;

		this.axisValues = {};
		for (let axis of this.font.axes) {
			this.axisValues[axis.tag] = this.hasAttribute(`axis-${axis.tag}`) ? this.getAttribute(`axis-${axis.tag}`) : axis.default;
		}

		this.featureValues = {};
		for (let feature of this.font.features) {
			this.featureValues[feature.tag] = this.hasAttribute(`feat-${feature.tag}`);
		}

		this.shadow = this.attachShadow({ mode: "open" });

		this.testbedContainer = document.createElement("div");
		this.testbedContainer.setAttribute("class", "testbedContainer");
		this.shadow.appendChild(this.testbedContainer);

		// -- setting up info box --

		this.infoBox = document.createElement("span");
		this.infoBox.setAttribute("class", "infoBox");

		{
			let $this = this;
			let sizeSlider = this.createSlider("Size", 6, 1000, this.fontSize, function(value) {
				$this.manualResize(value);
			});

			this.infoBox.appendChild(sizeSlider[0]);
			this.sizeSetter = sizeSlider[1];

			let italicToggle = this.createToggle("Italic", false, function(value) {
				$this.textBox.style.fontStyle = value ? "italic" : "normal";
				$this.autoResize();
			});
			this.infoBox.appendChild(italicToggle);
		}

		this.infoBox.appendChild(this.createTitle("Axes"));

		for (let axis of this.font.axes) {
			let $this = this;
			let axisSlider = this.createSlider(axis.text, axis.min, axis.max, this.axisValues[axis.tag], function(value) {
				$this.changeAxisValue(axis.tag, value);
				$this.autoResize();
			});
			this.infoBox.appendChild(axisSlider[0]);
		}

		this.infoBox.appendChild(this.createTitle("Features"));

		for (let feature of this.font.features) {
			let $this = this;
			let featureSelector = this.createToggle(feature.text, this.featureValues[feature.tag], function(value) {
				$this.changeFeatureValue(feature.tag, value);
				$this.autoResize();
			});
			this.infoBox.appendChild(featureSelector);
		}

		// -- setting up text box --

		this.textBox = document.createElement("div");
		this.textBox.setAttribute("class", "textBox");

		this.textBox.style.fontFamily = this.font.family;
		this.textBox.style.fontSize = this.fontSize + "px";
		this.textBox.style.width = "fit-content";
		if (!this.multiline) this.textBox.style.whiteSpace = "nowrap";
		else this.textBox.style.columnCount = this.textColumns;
		this.textBox.setAttribute("contenteditable", "plaintext-only");

		this.testbedContainer.appendChild(this.infoBox);
		this.testbedContainer.appendChild(this.textBox);

		setTimeout(() => this.textBox.append(this.textContent.trim().replace(/\s+/g, " ")), 50);

		if (!this.multiline) {
			setTimeout(() => this.autoResize(), 100);
			addEventListener("resize", () => this.autoResize());
		}

		const linkElem = document.createElement("link");
		linkElem.setAttribute("rel", "stylesheet");
		linkElem.setAttribute("href", TOOLS_CSS_ADDR);
		this.shadow.appendChild(linkElem);

		this.updateAxisValues();
		this.updateFeatureValues();
	}

	manualResize(value) {
		let minTextSize = 8;
		let maxTextSize = 1000;

		let availableWidth = this.textBox.parentNode.clientWidth;
		let currentWidth = this.textBox.scrollWidth;
		let previousFontSize = this.fontSize;
		let maxFontSize = parseInt(clamp((availableWidth / currentWidth) * previousFontSize, minTextSize, maxTextSize));

		if (!this.multiline) {
			this.fontSize = Math.min(parseInt(value), maxFontSize);
			if (value >= maxFontSize) {
				this.isAutoFitting = true;
				this.sizeSetter(this.fontSize);
			} else this.isAutoFitting = false;
		} else {
			this.fontSize = parseInt(value);
		}

		this.textBox.style.fontSize = this.fontSize + "px";
	}

	autoResize() {
		if (!this.multiline) {
			let minTextSize = 8;
			let maxTextSize = 1000;

			let availableWidth = this.textBox.parentNode.clientWidth;
			//console.log("availableWidth", availableWidth);
			let currentWidth = this.textBox.scrollWidth;
			//console.log("currentWidth", currentWidth);
			let previousFontSize = this.fontSize;

			let targetFontSize = parseInt(clamp((availableWidth / currentWidth) * previousFontSize, minTextSize, maxTextSize));

			if (this.isAutoFitting) {
				this.fontSize = targetFontSize;
			} else {
				if (this.fontSize >= targetFontSize) this.isAutoFitting = true;
				this.fontSize = Math.min(this.fontSize, targetFontSize);
			}
			this.sizeSetter(this.fontSize);
			this.textBox.style.fontSize = this.fontSize + "px";
		}
	}

	updateAxisValues() {
		let fontVariationSettings = "";
		for (const [key, value] of Object.entries(this.axisValues)) {
			fontVariationSettings += `"${key}" ${value},`;
		}
		this.textBox.style.fontVariationSettings = fontVariationSettings.replace(/,+$/g, '');
	}

	updateFeatureValues() {
		let fontFeatureSettings = "";
		for (const [key, value] of Object.entries(this.featureValues)) {
			if (value) fontFeatureSettings += `"${key}",`;
		}
		this.textBox.style.fontFeatureSettings = fontFeatureSettings.replace(/,+$/g, '');
	}

	changeAxisValue(axis, value) {
		this.axisValues[axis] = value;
		this.updateAxisValues();
	}


	changeFeatureValue(feature, value) {
		this.featureValues[feature] = value;
		this.updateFeatureValues();
	}

	disconnectedCallback() {
		console.log("Custom element removed from page.");
	}

	connectedMoveCallback() {
		console.log("Custom element moved with moveBefore()");
	}

	adoptedCallback() {
		console.log("Custom element moved to new page.");
	}

	attributeChangedCallback(name, oldValue, newValue) {
		console.log(`Attribute ${name} has changed.`);
	}
}

customElements.define("ift-testbed", FontTestbed);