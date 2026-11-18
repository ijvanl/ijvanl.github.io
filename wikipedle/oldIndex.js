"use strict";

function gi(id) { return document.getElementById(id); }

let startingArticle = "Philosophy";
let currentArticle = startingArticle;
let targetArticle = "Science";

let startTime = Date.now();

function secondsSinceStart() {
	return Math.floor((Date.now() / 1000) - (startTime / 1000));
}

function updateTimers(value) {
	for (let e of document.getElementsByClassName("live-timer")) e.innerText = `${value}`;
}

function updateArticleTitles(starting, current, target) {
	for (let e of document.getElementsByClassName("startingArticle")) e.innerText = `${starting}`;
	for (let e of document.getElementsByClassName("currentArticle")) e.innerText = `${current}`;
	for (let e of document.getElementsByClassName("targetArticle")) e.innerText = `${target}`;
}

function start() {
	let pregame = gi("pregame");
	let intro = gi("intro");
	let game = gi("game");
	let gameWindow = gi("gameWindow");

	let content = loadWikiContent(startingArticle);
}

function loadWikiContent(page) {
	let gameWindow = gi("gameWindow");
	
	let pageData = getWikiPage(page);
	gameWindow.srcdoc = pageData;
	
	let gameDocument = gameWindow.contentDocument || gameWindow.contentWindow.document;
	let links = gameDocument.querySelectorAll("a");
	console.log(links);
}





function playButton() {
	let pregame = gi("pregame");
	let intro = gi("intro");
	let game = gi("game");
	let gameWindow = gi("gameWindow");

	pregame.style.display = "none";

	startTime = Date.now();
	updateTimers(Math.abs(secondsSinceStart() - startCount));

	game.style.display = "flex";
	
	gameWindow.contentDocument.addEventListener("load",
		function() { console.log("hello"); massageLinks(gameWindow.contentDocument.documentElement); }
	);

	updateArticleTitles(startingArticle, startingArticle, targetArticle);

	window.setInterval(intervalChecker, 100);
}

let introDone = false;
let firstLoadDone = false;
let startCount = 5;

function loadPage(page) {
	let gameWindow = gi("gameWindow");
	let pageData = getWikiPage(page);
	gameWindow.srcdoc = pageData;
	currentArticle = page;
}

function massageLinks(pageDoc) {
	console.log("massageLinks", pageDoc);
	console.log(pageDoc.querySelector("a"));

	for (let link of pageDoc.querySelector("a")) {
		let page = link.title.replace(" ", "_");
		link.href = "#";
		console.log(link);
		link.onclick = (() => getWikiPage(page));
	}
}

function intervalChecker() {
	let timer = secondsSinceStart() - startCount;
	updateTimers(Math.abs(timer));

	let intro = gi("intro");

	if (!firstLoadDone) {
		firstLoadDone = true;
		loadPage(currentArticle);
	}

	if (timer > -1 && !introDone) {
		intro.style.opacity = 0;
		if (timer > 0) {
			intro.style.display = "none";
			introDone = true;
		}
	} else {
		//let currentSrc = window.top.location.href;
		//console.log(currentSrc);
	}
}