"use strict";

function clamp(number, min, max) {
	return Math.min(Math.max(number, min), max);
}

class FontTestbed extends HTMLElement {
	constructor() {
		super();
	}

	// Element functionality written in here
	connectedCallback() {
		this.fontName = this.getAttribute("font-name");
		this.font = document.iftMeta[this.fontName];
		this.fontSize = parseInt(this.hasAttribute("font-size") ? this.getAttribute("font-size") : 72);
		this.textColumns = parseInt(this.hasAttribute("text-columns") ? this.getAttribute("text-columns") : 1);
		this.autofit = this.hasAttribute("autofit");
		this.isAutoFitting = this.autofit;
		//this.autofitSetter(this.isAutoFitting);

		this.axisValues = {};
		for (let axis of this.font.axes) {
			this.axisValues[axis.tag] = this.hasAttribute(`axis-${axis.tag}`) ? this.getAttribute(`axis-${axis.tag}`) : axis.default;
		}

		this.featureValues = {};
		for (let feature of this.font.features) {
			this.featureValues[feature.tag] = this.hasAttribute(`feat-${feature.tag}`);
		}

		this.variantValues = {};
		for (let [variant, entries] of Object.entries(this.font.variants)) {
			this.variantValues[variant] = this.hasAttribute(`variant-${variant}`) ? this.getAttribute(`variant-${variant}`) : entries[0].value;
		}

		this.shadow = this.attachShadow({ mode: "open" });

		this.testbedContainer = document.createElement("div");
		this.testbedContainer.setAttribute("class", "testbedContainer");
		this.shadow.appendChild(this.testbedContainer);

		// -- setting up info box --

		this.infoBox = document.createElement("span");
		this.infoBox.setAttribute("class", "infoBox");

		// Size slider
		{
			let $this = this;
			let sizeSlider = createSlider("Size", 6, 1000, this.fontSize, (value) => $this.manualResize(value));
			this.infoBox.appendChild(sizeSlider[0]);
			this.sizeSetter = sizeSlider[1];
		}

		// Autofit toggle
		if (this.autofit) {
			let $this = this;
			let autofitToggle = createToggle(" \u276E \u276F ", this.isAutoFitting, function(value) {
				$this.isAutoFitting = value;
				this.autofitSetter(this.isAutoFitting);
			});
			
			this.infoBox.appendChild(autofitToggle[0]);
			this.autofitSetter = autofitToggle[1];
		}

		this.infoBox.appendChild(createTitle("Instances"));

		for (const [variant, entries] of Object.entries(this.font.variants)) {
			let $this = this;
			let variantSelector = createSelector(null, entries, this.variantValues[variant], function(value) {
				$this.changeVariantValue(variant, value);
				$this.autoResize();
			});
			this.infoBox.appendChild(variantSelector);
		}

		this.infoBox.appendChild(createTitle("Axes"));

		for (const axis of this.font.axes) {
			let $this = this;
			let axisSlider = createSlider(axis.text, axis.min, axis.max, this.axisValues[axis.tag], function(value) {
				$this.changeAxisValue(axis.tag, value);
				$this.autoResize();
			});
			this.infoBox.appendChild(axisSlider[0]);
		}

		this.infoBox.appendChild(createTitle("Features"));

		for (const feature of this.font.features) {
			let $this = this;
			let featureSelector = createToggle(feature.text, this.featureValues[feature.tag], function(value) {
				$this.changeFeatureValue(feature.tag, value);
				$this.autoResize();
			})[0];
			this.infoBox.appendChild(featureSelector);
		}

		// -- setting up text box --

		this.textBox = document.createElement("div");
		this.textBox.setAttribute("class", "textBox");

		this.textBox.style.fontFamily = this.font.family;
		this.textBox.style.fontSize = this.fontSize + "px";
		this.textBox.style.width = "fit-content";
		if (this.autofit) this.textBox.style.whiteSpace = "nowrap";
		else this.textBox.style.columnCount = this.textColumns;
		this.textBox.setAttribute("contenteditable", "plaintext-only");

		this.textBox.addEventListener("input", () => {
			this.isAutoFitting = false;
			this.autofitSetter(this.isAutoFitting);
		});

		this.testbedContainer.appendChild(this.infoBox);
		this.testbedContainer.appendChild(this.textBox);

		setTimeout(() => this.textBox.append(this.textContent.trim().replace(/\s+/g, " ")), 50);

		if (this.autofit) {
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

		if (this.autofit) {
			this.fontSize = Math.min(parseInt(value), maxFontSize);
			if (value >= maxFontSize) {
				this.isAutoFitting = true;
				this.sizeSetter(this.fontSize);
			} else this.isAutoFitting = false;
			this.autofitSetter(this.isAutoFitting);
		} else {
			this.fontSize = parseInt(value);
		}

		this.textBox.style.fontSize = this.fontSize + "px";
	}

	autoResize() {
		if (this.autofit) {
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
				this.autofitSetter(this.isAutoFitting);
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

	updateVariantValues() {
		for (const [key, value] of Object.entries(this.variantValues)) {
			if (value) this.textBox.style.setProperty(key, value);
		}
	}

	changeAxisValue(axis, value) {
		this.axisValues[axis] = value;
		this.updateAxisValues();
	}


	changeFeatureValue(feature, value) {
		this.featureValues[feature] = value;
		this.updateFeatureValues();
	}

	changeVariantValue(variant, value) {
		this.variantValues[variant] = value;
		this.updateVariantValues();
	}

	disconnectedCallback() {
		//console.log("Custom element removed from page.");
	}

	connectedMoveCallback() {
		//console.log("Custom element moved with moveBefore()");
	}

	adoptedCallback() {
		//console.log("Custom element moved to new page.");
	}

	attributeChangedCallback(name, oldValue, newValue) {
		//console.log(`Attribute ${name} has changed.`);
	}
}

customElements.define("ift-testbed", FontTestbed);