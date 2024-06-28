"use strict";

var stacks = [
	document.getElementById("stack1"),
	document.getElementById("stack2"),
	document.getElementById("stack3"),
	document.getElementById("stack2"), // doubled for 2x photos on non-hero sides
	document.getElementById("stack3"),
];

function fillStacks(text) {
	var files = text.split(/\n/);
	files = files.map(value => ({ value, sort: Math.random() }))
	.sort((a, b) => a.sort - b.sort)
	.map(({ value }) => value);

	for (var i = 0; i < files.length; i++) { 
		var image = document.createElement("img");
		image.src = "images/" + files[i];
		stacks[i % 3].appendChild(image);
	}
}

fetch("images/images.txt").then((response) => {
	if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
	return response.text();
}).then((text) => fillStacks(text))