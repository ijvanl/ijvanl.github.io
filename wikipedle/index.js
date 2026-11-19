"use strict";

function gi(query) { return document.getElementById(query); }
function gq(query) { return document.querySelectorAll(query); }

var settings = {
	introLength:	10,
	maxSteps:		7,
	maxUndos:		3,
	pollInterval:	200,
	foundingDate:	Date.UTC(2026, 10, 17),
}

var game = {
	startingArticle:	"Philosophy",
	currentArticle:		"Philosophy",
	targetArticle:		"Science",
	startTime:			Date.now(),
	stepCount:			0,
	undosLeft:			Number(settings.maxUndos),
	followedLinks:		[],
	textResults:		"💥",
	finishCondition:	"",
	get secondsSinceStart() { return ((Date.now() - game.startTime) / 1000) - settings.introLength; },
	get fmtTimeSinceStart() { 
		let time = game.secondsSinceStart;
		let minutes = Math.floor(Math.abs(time) / 60);
		let seconds = Math.floor(Math.abs(time) % 60);
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	},
	get nthGame() { return Math.floor((Date.now() - settings.foundingDate) / (1000 * 60 * 60 * 24)); },
	startTimer() { this.startTime = Date.now(); },
}

var ui = {
	pregame:		null,
	intro:			null,
	gamePage:		null,
	wikiFrame:		null,
	wikiDoc:		null,
	undoButton:		null,
	stepCounter:	null,

	startSummary:	"",
	targetSummary:	"",

	introDone:		false,
	
	updateArticleTitles() {
		for (let e of gq(".startingArticle")) e.innerText = `${game.startingArticle}`;
		for (let e of gq(".currentArticle")) e.innerText = `${game.currentArticle}`;
		for (let e of gq(".targetArticle")) e.innerText = `${game.targetArticle}`;
	},

	updateTimers() {
		for (let e of gq(".liveTimer"))
			e.innerText = `${game.fmtTimeSinceStart}`;
		return game.secondsSinceStart;
	},

	updateLinksFollowed() {
		for (let e of gq(".linksFollowed"))
			e.innerText = `${game.stepCount}`;
	},

	updateUndoSteps() {
		for (let e of gq(".linksLeft"))
			e.innerText = `${settings.maxSteps - game.stepCount}`;
		for (let e of gq(".undoSteps"))
			e.innerText = `${game.undosLeft}`;
	},


	startIntro() {
		this.pregame.style.display = "none";
		this.gamePage.style.display = "flex";
	},

	updateInterface() {
		this.updateArticleTitles();
		this.updateTimers();
		this.updateLinksFollowed();
		this.updateUndoSteps();
	},
}

function onPageLoad() {
	ui.pregame = gi("pregame");
	ui.intro = gi("intro");
	ui.gamePage = gi("game");
	ui.wikiFrame = gi("wikiFrame");
	ui.undoButton = gi("undoButton");
	ui.stepCounter = gi("stepCounter");
	ui.wikiDoc = ui.wikiFrame.contentDocument || ui.wikiFrame.contentWindow.document;

	if (localStorage.getItem("gameInPlay") == `${game.nthGame}`) {
		let parsedGame = JSON.parse(localStorage.getItem("gameData"));
		console.log(game.startTime, parsedGame.startTime, game.startTime - parsedGame.startTime);
		game.startingArticle = parsedGame.startingArticle;
		game.currentArticle = parsedGame.currentArticle;
		game.targetArticle = parsedGame.targetArticle;
		game.followedLinks = parsedGame.followedLinks;
		game.startTime = parsedGame.startTime;
		game.stepCount = parsedGame.stepCount;
		game.undosLeft = parsedGame.undosLeft;
		game.textResults = parsedGame.textResults;
		console.log(game.startTime);
		onStartFired(false);
		checkForFinish();
	} else {
		setupGameForToday();
	}
}

function setupGameForToday() {
	let nthDay = game.nthGame;
	let articles = getPagesForToday(nthDay, pageList);
	console.log(articles);
	game.startingArticle = articles[0];
	game.currentArticle = articles[0];
	game.targetArticle = articles[1];
	game.followedLinks = [game.startingArticle];
	gi("startingArticleSummary").innerHTML = getWikiSummary(formatArticleName(game.startingArticle));
	gi("targetArticleSummary").innerHTML = getWikiSummary(formatArticleName(game.targetArticle));
	localStorage.setItem("gameData", JSON.stringify(game));
}

function onStartFired(resetTimer) {
	loadWikiContent(formatArticleName(game.currentArticle));

	if (resetTimer) game.startTimer();
	ui.updateArticleTitles();
	ui.updateTimers();
	localStorage.setItem("gameInPlay", `${game.nthGame}`);

	window.setInterval(onIntervalFired, settings.pollInterval);

	ui.startIntro();
}

function loadWikiContent(page) {
	getWikiPage(page, function(pageData) {
		ui.wikiDoc.open();
		ui.wikiDoc.write(pageData);
		ui.wikiDoc.close();
		
		const stylesheet = ui.wikiDoc.createElement('style');
		stylesheet.textContent = wikiStyle;
		ui.wikiDoc.head.appendChild(stylesheet);

		const articleTitle = ui.wikiDoc.createElement('h1');
		articleTitle.classList.add("articleTitle");
		articleTitle.textContent = game.currentArticle;
		ui.wikiDoc.body.insertBefore(articleTitle, ui.wikiDoc.body.firstChild);

		// deal with wikilinks
		let wikiLinks = ui.wikiDoc.querySelectorAll("a[rel='mw:WikiLink']");
		for (let link of wikiLinks) {
			let href = link.getAttribute("href");
			
			if (
				href.startsWith("./Special:") || href.startsWith("./File:")
				|| href.startsWith("./Template:") || href.startsWith("./Wikipedia:")
				|| href.startsWith("./Help:") || href.includes("#CITEREF")
			) {
				link.removeAttribute("rel");
			} else if (href.startsWith("./")) {
				link.addEventListener("click", function() { followWikiLink(this, href) });
			} else {
				link.removeAttribute("rel");
			}
		}

		// deal with hrefs on all links
		let allLinks = ui.wikiDoc.querySelectorAll("a");
		for (let link of allLinks) link.removeAttribute("href");
	});
}

function cleanupHref(href) {
	if (href.startsWith("./")) return decodeURI(href.slice(2)).replaceAll("_", " ");
	else return decodeURI(href).replaceAll("_", " ");
}

function formatArticleName(articleName) {
	return encodeURI(articleName.replaceAll(" ", "_"));
}

function followWikiLink(element, href) {
	game.stepCount += 1;
	game.currentArticle = cleanupHref(href);
	if (game.currentArticle == game.targetArticle) {
		game.textResults = game.textResults + "🌟";
	} else {
		game.textResults = game.textResults + "➡️";
	}
	checkForFinish();
	ui.undoButton.dataset.undoCount = game.undosLeft;
	ui.undoButton.dataset.stepCount = game.stepCount;
	ui.stepCounter.dataset.stepCount = (settings.maxSteps - game.stepCount);
	game.followedLinks.push(cleanupHref(href));
	ui.wikiDoc.body.classList.add("gameLoading");
	element.classList.add("gameClicked");
	loadWikiContent(cleanupHref(href));
	checkForFinish();
	localStorage.setItem("gameData", JSON.stringify(game));
}

function undoStep() {
	game.undosLeft -= 1;
	game.textResults = game.textResults + "↩️";
	checkForFinish();
	ui.undoButton.dataset.undoCount = game.undosLeft;
	ui.undoButton.dataset.stepCount = game.stepCount;
	ui.stepCounter.dataset.stepCount = (settings.maxSteps - game.stepCount);
	
	game.followedLinks.pop();
	let last = game.followedLinks.at(-1);

	game.currentArticle = last;
	ui.wikiDoc.body.classList.add("gameLoading");
	loadWikiContent(formatArticleName(last));
	localStorage.setItem("gameData", JSON.stringify(game));
}

function onIntervalFired() {
	let timer = ui.updateTimers();
	
	if (timer > -1 && !ui.introDone) {
		ui.intro.style.opacity = 0;
		if (timer > 0) {
			ui.intro.style.display = "none";
			ui.introDone = true;
		}
	} else {
		ui.updateInterface();
	}
}

function checkForFinish() {
	if (game.undosLeft <= 0 || game.stepCount >= settings.maxSteps || game.currentArticle == game.targetArticle) {
		ui.gamePage.classList.add("gameFinished");
		
		if (game.undosLeft <= 0) {
			gi("finishBadUndo").classList.add("shown");
			game.textResults = game.textResults + "🟧";
			game.finishCondition = "failUndo";
		} else if (game.stepCount >= settings.maxSteps && game.currentArticle != game.targetArticle) {
			gi("finishBadLinks").classList.add("shown");
			game.textResults = game.textResults + "🟥";
			game.finishCondition = "failLinks";
		} else if (game.currentArticle == game.targetArticle) {
			gi("finishGood").classList.add("shown");
			game.finishCondition = "win";
		}

		console.log(game.textResults);
	}
}

function generateResults() {
	let text;
	let undoText = "";

	if (settings.maxUndos - game.undosLeft > 0) {
		undoText = ` — ${settings.maxUndos - game.undosLeft} undo steps used`;
	}

	if (game.finishCondition == "win") {
		text = `Wikipedle ${game.nthGame}
${game.textResults}
${game.stepCount}/${settings.maxSteps} (${game.fmtTimeSinceStart})${undoText}
https://ishtar.page/wikipedle/`;
	} else if (game.finishCondition == "failUndo") {
		text = `Wikipedle ${game.nthGame}
${game.textResults}
${game.stepCount}/${settings.maxSteps} (${game.fmtTimeSinceStart}) — all undo steps used
https://ishtar.page/wikipedle/`
	} else if (game.finishCondition == "failLinks") {
		text = `Wikipedle ${game.nthGame}
${game.textResults}
X/${settings.maxSteps} (${game.fmtTimeSinceStart})${undoText}
https://ishtar.page/wikipedle/`;
	}
	console.log(text);
	navigator.clipboard.writeText(text);

}