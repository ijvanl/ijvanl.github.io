"use strict";

const TOOLS_CSS_ADDR = "/fonts/tools/tools.css";

function createTitle(text) {
	let title = document.createElement("span");
	title.setAttribute("class", "infoTitle");
	title.innerText = text;
	return title;
}

function createSelector(name, choices, defaultValue, onUpdateCallback) {
	let container = document.createElement("span");
	container.setAttribute("class", "selectorContainer");

	if (name != null) {
		let label = document.createElement("span");
		label.textContent = name;
		container.appendChild(label);
	}

	let selector = document.createElement("select");

	for (let choice of choices) {
		let choiceOption = document.createElement("option");
		choiceOption.value = choice.value;
		choiceOption.innerHTML = choice.text;
		selector.appendChild(choiceOption);
		if (choice.isDefault) selector.value = choice.value; // default fallback
	}
	if (defaultValue) selector.value = defaultValue;
	
	selector.addEventListener("input", () => {
		onUpdateCallback(selector.value);
	});

	container.appendChild(selector);
	return container;
}

function createSlider(name, min, max, value, onUpdateCallback) {
	let container = document.createElement("span");
	container.setAttribute("class", "sliderContainer");

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

function createToggle(name, value, onUpdateCallback) {
	let container = document.createElement("span");
	container.setAttribute("class", "toggleContainer");

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

	let setter = (value) => {
		checkbox.checked = value;
	}

	container.appendChild(label);
	return [container, setter];
}