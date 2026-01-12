function clamp(number, min, max) {
	return Math.min(Math.max(number, min), max);
}

class FontTestbed extends HTMLElement {
	static observedAttributes = ["family", "size", "axes", "minimums", "maximums", "features", "featureNames"];

	constructor() {
		super();
	}

	updateAxisValues() {
		let fontVariationSettings = "";
		for (const [key, value] of Object.entries(this.axisValues)) {
			fontVariationSettings += `"${key}" ${value},`;
		}
		this.textBox.style.fontVariationSettings = fontVariationSettings.replace(/,+$/g, '');
	}

	changeAxisValue(axis, value) {
		this.axisValues[axis] = value;
		this.updateAxisValues();
	}


	changeFeatureValue(feature, value) {
		console.log(`changeFeatureValue called: ${feature} = ${value}`);
		this.featureValues[feature] = value;
		let fontFeatureSettings = "";
		for (const [key, value] of Object.entries(this.featureValues)) {
			if (value) {
				fontFeatureSettings += `"${key}",`;
			}
		}
		this.textBox.style.fontFeatureSettings = fontFeatureSettings.replace(/,+$/g, '');
		console.log(fontFeatureSettings);
		console.log(this.textBox);
	}


	// Element functionality written in here
	connectedCallback() {
		//console.log("Custom element added to page.");
		this.axes = this.hasAttribute("axes") ? this.getAttribute("axes").split(" ") : [];
		this.axisMinimums = this.hasAttribute("minimums") ? this.getAttribute("minimums").split(" ") : [];
		this.axisMaximums = this.hasAttribute("maximums") ? this.getAttribute("maximums").split(" ") : [];
		this.axisDefaults = this.hasAttribute("defaults") ? this.getAttribute("defaults").split(" ") : [];

		this.features = this.hasAttribute("features") ? this.getAttribute("features").split(" ") : [];
		this.featureNames = this.hasAttribute("featureNames") ? this.getAttribute("featureNames").split(",") : [];

		this.textColumns = this.hasAttribute("columns") ? this.getAttribute("columns") : 1;

		this.axisValues = {};
		this.featureValues = {};

		this.shadow = this.attachShadow({ mode: "open" });

		let testbedContainer = document.createElement("div");
		testbedContainer.setAttribute("class", "testbedContainer");

		this.infoBox = document.createElement("span");
		this.infoBox.setAttribute("class", "infoBox");


		let sizeContainer = document.createElement("span");
		sizeContainer.setAttribute("class", "axisContainer");

		let sizeLabel = document.createElement("span");
		sizeLabel.textContent = "Size";

		let sizeSlider = document.createElement("input");
		sizeSlider.setAttribute("type", "range");
		sizeSlider.setAttribute("min", 10);
		sizeSlider.setAttribute("max", 512);
		sizeSlider.value = this.getAttribute("size").replace(/[A-Za-z]+$/g, '');

		let sizeTextBox = document.createElement("input");
		sizeTextBox.setAttribute("type", "number");
		sizeTextBox.value = this.getAttribute("size").replace(/[A-Za-z]+$/g, '');

		sizeSlider.addEventListener("input", () => {
			sizeTextBox.value = sizeSlider.valueAsNumber;
			this.textBox.style.fontSize = `${sizeSlider.valueAsNumber}pt`;
		});

		sizeTextBox.addEventListener("change", () => {
			sizeTextBox.value = clamp(sizeTextBox.valueAsNumber, sizeSlider.min, sizeSlider.max);
			sizeSlider.value = sizeTextBox.valueAsNumber;
			this.textBox.style.fontSize = `${sizeSlider.valueAsNumber}pt`;
		});

		sizeContainer.appendChild(sizeLabel);
		sizeContainer.appendChild(sizeSlider);
		sizeContainer.appendChild(sizeTextBox);

		this.infoBox.appendChild(sizeContainer);


		this.axisSliders = []

		let axesTitle = document.createElement("span");
		axesTitle.setAttribute("class", "infoTitle");
		axesTitle.innerText = "Axes";
		this.infoBox.appendChild(axesTitle);

		for (const axis in this.axes) {
			let axisContainer = document.createElement("span");
			axisContainer.setAttribute("class", "axisContainer");

			let axisLabel = document.createElement("span");
			axisLabel.textContent = this.axes[axis];

			let axisSlider = document.createElement("input");
			axisSlider.setAttribute("type", "range");
			axisSlider.setAttribute("min", this.axisMinimums[axis]);
			axisSlider.setAttribute("max", this.axisMaximums[axis]);
			axisSlider.value = this.axisDefaults[axis];

			let axisTextBox = document.createElement("input");
			axisTextBox.setAttribute("type", "number");
			axisTextBox.value = this.axisDefaults[axis];

			axisSlider.addEventListener("input", () => {
				axisTextBox.value = axisSlider.valueAsNumber;
				this.changeAxisValue(this.axes[axis], axisSlider.valueAsNumber);
			});

			axisTextBox.addEventListener("change", () => {
				axisTextBox.value = clamp(axisTextBox.valueAsNumber, axisSlider.min, axisSlider.max);
				axisSlider.value = axisTextBox.valueAsNumber;
				this.changeAxisValue(this.axes[axis], axisSlider.valueAsNumber);
			});

			axisContainer.appendChild(axisLabel);
			axisContainer.appendChild(axisSlider);
			axisContainer.appendChild(axisTextBox);

			this.infoBox.appendChild(axisContainer);

			this.axisValues[this.axes[axis]] = axisSlider.valueAsNumber;
		}

		let featuresTitle = document.createElement("span");
		featuresTitle.setAttribute("class", "infoTitle");
		featuresTitle.innerText = "Features";
		this.infoBox.appendChild(featuresTitle);

		for (const feature in this.features) {
			let featureContainer = document.createElement("span");
			featureContainer.setAttribute("class", "featureContainer");

			let featureLabel = document.createElement("span");
			featureLabel.textContent = this.featureNames[feature];

			let featureCheckbox = document.createElement("input");
			featureCheckbox.setAttribute("type", "checkbox");
			featureLabel.appendChild(featureCheckbox);

			featureLabel.addEventListener("click", () => {
				featureCheckbox.checked = !featureCheckbox.checked;
				this.changeFeatureValue(this.features[feature], featureCheckbox.checked);
			});

			featureContainer.appendChild(featureLabel);
			this.infoBox.appendChild(featureContainer);
		}


		this.textBox = document.createElement("div");
		this.textBox.setAttribute("class", "textBox");
		this.textBox.style.fontFamily = this.getAttribute("family");
		this.textBox.style.fontSize = this.getAttribute("size");
		this.textBox.style.columnCount = this.textColumns;
		this.textBox.setAttribute("contenteditable", "plaintext-only");


		setTimeout(() => {
			this.textBox.textContent = this.textContent.trim();
		}, 10);

		testbedContainer.appendChild(this.infoBox);
		testbedContainer.appendChild(this.textBox);

		const linkElem = document.createElement("link");
		linkElem.setAttribute("rel", "stylesheet");
		linkElem.setAttribute("href", "/fonts/testbed.css");
		this.shadow.appendChild(linkElem);

		this.shadow.appendChild(testbedContainer);

		this.updateAxisValues();
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

customElements.define("font-testbed", FontTestbed);