"use strict";

function elementId() {
	return Math.random().toString(36).substring(2, 7);
}

class FontRepertoire extends HTMLElement {
	constructor() {
		super();
	}

	// Element functionality written in here
	connectedCallback() {
		this.fontName = this.getAttribute("font-name");
		this.fontNameSanitized = this.fontName.replace(/[^\w]/g, "");
		this.font = document.iftMeta[this.fontName];
		this.fontSize = parseInt(this.hasAttribute("font-size") ? this.getAttribute("font-size") : 50);

		this.selectedGlyph = "A";
		this.selectedGlyphButton = null;

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

		// -- GUI --

		this.shadow = this.attachShadow({ mode: "open" });

		this.repertoireContainer = document.createElement("div");
		this.repertoireContainer.setAttribute("class", "repertoireContainer");
		this.shadow.appendChild(this.repertoireContainer);

		// -- grid --

		this.gridContainer = document.createElement("div");
		this.gridContainer.setAttribute("class", "repertoireGrid");
		this.repertoireContainer.appendChild(this.gridContainer);

		this.charClassName = `char-${this.fontNameSanitized}-${elementId()}`;

		for (let [name, chars] of Object.entries(this.font.charset)) {
			let charsetName = document.createElement("div");
			charsetName.setAttribute("class", "charsetName");
			charsetName.innerText = name;
			this.gridContainer.appendChild(charsetName);

			for (const char of chars) {
				let charCell = document.createElement("div");
				charCell.setAttribute("class", "charCell");
				charCell.classList.add(this.charClassName);
				charCell.innerText = char;
				charCell.style.fontFamily = this.font.family;
				charCell.style.fontSize = this.fontSize + "px";
				charCell.addEventListener("click", () => {
					if (this.selectedGlyphButton) this.selectedGlyphButton.classList.remove("selected");
					this.selectedGlyph = char;
					this.selectedGlyphButton = charCell;
					this.updateSelectedGlyph();
					this.selectedGlyphButton.classList.add("selected");
					console.log(char);
				});
				this.gridContainer.appendChild(charCell);
				//console.log(char);
			}
		}

		// -- info --

		this.infoContainer = document.createElement("div");
		this.infoContainer.setAttribute("class", "repertoireInfo");
		this.repertoireContainer.appendChild(this.infoContainer);

		this.glyphDetail = document.createElement("div");
		this.glyphDetail.setAttribute("class", "repertoireGlyph");
		this.glyphDetail.innerHTML = `<span>A</span>`;
		this.glyphDetail.style.fontFamily = this.font.family;

		console.log(this.font.metrics);
		for (const [name, metric] of Object.entries(this.font.metrics)) {
			let metricLine = document.createElement("div");
			metricLine.setAttribute("class", "metric");
			metricLine.style.transform = `translateY(${-metric / 1000 * 480}px)`;
			metricLine.innerHTML = `<span>${name}</span>`;
			this.glyphDetail.appendChild(metricLine);
		}

		this.infoContainer.appendChild(this.glyphDetail);

		// -- end --

		const linkElem = document.createElement("link");
		linkElem.setAttribute("rel", "stylesheet");
		linkElem.setAttribute("href", TOOLS_CSS_ADDR);
		this.shadow.appendChild(linkElem);

		this.updateAxisValues();
		this.updateFeatureValues();
		this.updateVariantValues();
	}

	getGridChars() {
		return document.getElementsByClassName(this.charClassName);
	}

	updateSelectedGlyph() {
		this.glyphDetail.firstChild.innerText = this.selectedGlyph;
		
	}

	updateAxisValues() {
		let fontVariationSettings = "";
		for (const [key, value] of Object.entries(this.axisValues)) {
			fontVariationSettings += `"${key}" ${value},`;
		}
		fontVariationSettings = fontVariationSettings.replace(/,+$/g, '');
		for (const char of this.getGridChars()) char.style.fontVariationSettings = fontVariationSettings;
		this.glyphDetail.style.fontVariationSettings = fontVariationSettings;
	}

	updateFeatureValues() {
		let fontFeatureSettings = "";
		for (const [key, value] of Object.entries(this.featureValues)) {
			if (value) fontFeatureSettings += `"${key}",`;
		}
		fontFeatureSettings = fontFeatureSettings.replace(/,+$/g, '');
		for (const char of this.getGridChars()) char.style.fontFeatureSettings = fontFeatureSettings;
		this.glyphDetail.style.fontFeatureSettings = fontFeatureSettings;
	}

	updateVariantValues() {
		for (const [key, value] of Object.entries(this.variantValues)) {
			if (value) {
				for (const char of this.getGridChars()) char.style.setProperty(key, value);
				this.glyphDetail.style.setProperty(key, value);
			}
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

customElements.define("ift-repertoire", FontRepertoire);