"use strict";

function getMetadata() {
	let metaElements = document.querySelectorAll("ift-font-meta");
	let metadata = {};

	for (let element of metaElements) {
		element.style.display = "none";

		let fontName = element.getAttribute("font");
		let fontFamily = element.hasAttribute("family-name") ? element.getAttribute("family-name") : fontName;
		let axes = [];
		let features = [];
		let variants = {};

		let axisElements = element.querySelectorAll("axis");
		for (let axisElement of axisElements) {
			axes.push({
				tag: axisElement.getAttribute("tag"),
				min: axisElement.getAttribute("min"),
				max: axisElement.getAttribute("max"),
				default: axisElement.hasAttribute("default") ? axisElement.getAttribute("default") : axisElement.getAttribute("min"),
				text: axisElement.innerHTML
			});
		}

		let featureElements = element.querySelectorAll("feature");
		for (let featureElement of featureElements) {
			features.push({
				tag: featureElement.getAttribute("tag"),
				text: featureElement.innerHTML
			});
		}

		let variantElements = element.querySelectorAll("variant");
		for (let variantElement of variantElements) {
			let variantOf = variantElement.getAttribute("of");
			if (!variants.hasOwnProperty(variantOf)) variants[variantOf] = [];
			variants[variantOf].push({
				value: variantElement.hasAttribute("value") ? variantElement.getAttribute("value") : variantElement.innerText,
				text: variantElement.innerHTML,
				isDefault: variantElement.hasAttribute("default")
			});
		}
		
		metadata[fontName] = {
			family: fontFamily,
			axes: axes,
			features: features,
			variants: variants
		};
	}

	return metadata;
}

document.iftMeta = getMetadata();
console.log("Ishtar's Font Site Tools loaded");
//window.addEventListener("load", () => { document.iftMeta = getMetadata(); console.log("Ishtar's Font Site Tools loaded") });