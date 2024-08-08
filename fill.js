"use strict";

var loader = document.getElementById("loader");
var loaderProgress = document.getElementById("loader-progress");

var stacks = [
	document.getElementById("stack1"),
	document.getElementById("stack2"),
	document.getElementById("stack3"),
];

function loadImage(url, onSingleLoad) {
	return new Promise(resolve => {
		const image = new Image();
		image.addEventListener('load', () => { onSingleLoad(); resolve(image) });
		image.src = url; // begins the image loading process
	});
}

async function fillStacks(text) {
	const delay = millis => new Promise((resolve, reject) => {
		setTimeout(_ => resolve(), millis)
	});

	var files = text.trim().split(/\n/);
	//files = files.map(value => ({ value, sort: Math.random() }))
	//.sort((a, b) => a.sort - b.sort)
	//.map(({ value }) => value);

	var image_promises = [];
	var loaded_images = 0;

	document.body.style.overflow = "hidden";

	for (var i = 0; i < files.length; i++) { 
		image_promises.push(
			loadImage(
				window.location.href + "/images/" + files[i],
				() => {
					console.log("loaded image");
					loaded_images += 1;
					loaderProgress.style.width = `${ ((files.length - loaded_images) / files.length) * 100 }vw`;
				}
			)
		);
	}

 	Promise.all(image_promises).then(images => {
		for (const i of images) stacks[0].appendChild(i);

		while (stacks.length > 1) {
			while (stacks[0].offsetHeight > (stacks[1].offsetHeight / (stacks.length - 1.1))) {
				//await delay(10);
				var lastChild = stacks[0].lastChild;
				stacks[0].removeChild(lastChild);
				stacks[1].insertBefore(lastChild, stacks[1].firstChild);
			}
			stacks.shift();
		}

		setTimeout(() => {
			document.body.style.overflowY = "scroll";
			loaderProgress.style.opacity = "0";
			loader.style.opacity = "0";
		}, 200);

		setTimeout(() => {
			loaderProgress.style.display = "none";
			loader.style.display = "none";
		}, 400);
	});
}

fetch(window.location.href + "/images/images.txt").then((response) => {
	if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
	return response.text();
}).then((text) => fillStacks(text))