"use strict";

const wikiStyle = `
	/* polyfill missing */

	body {
		font-family: sans-serif;
		font-size: 0.875rem;
		line-height: 1.5714285;
		padding: 1cm 2cm;
		max-width: 1150px;
		margin: 0 auto;
	}

	h1, h2 {
		font-family: "Georgia", serif;
	}

	h1, h2, h3 {
		margin: 0.25em 0em;
		padding: 0em;
	}

	h1.articleTitle {
		margin-bottom: 2rem;
	}
	
	h3 { font-size: 1.2em; }

	div[role="note"] {
		margin-top: 0.25em;
	}

	.floatright {
		clear: right;
		float: right;
	}

	.thumbinner {
		border: 1px solid #c8ccd1;
		background-color: #f8f9fa;
		font-size: 12.3px;
		padding: 3px;
		margin: 0.5em;
	}

	.thumbinner img {
		border: 1px solid #c8ccd1;
	}

	.thumbcaption {
		padding: 3px;
	}

	/* game css */

	a {
		font-weight: 700;
		text-decoration: none;
		pointer-events: none;
		display: inline-block;
	}

	a:not(:has(img)) {
		opacity: 0.6;
	}

	a[rel="mw:WikiLink"] {
		opacity: 1;
		font-weight: inherit;
		text-decoration: initial;
		pointer-events: all;
	}

	a.wikiLink:hover {
		text-decoration: underline;
	}

	a.gameClicked {
		animation: 1s evap ease-in;
		translate: 0px -100px;
		opacity: 0;
		position: relative;
	}

	a.gameClicked::after {
		content: "+1";
		font-size: 3em; font-family: "Georgia";
		width: 5rem; height: 5rem;
		border-radius: 100%;
		text-align: center; line-height: 5rem;
		background: #03c; color: #fff;
		position: absolute;
		bottom: 0; left: 0;
		animation: 2s evap ease-in;
	}

	body.gameLoading {
		opacity: 0.5;
		animation: 1s gameLoadAnim ease-in;
	}

	@keyframes evap {
		from { translate: 0px 0px; opacity: 1; }
		to { translate: 0px -100px; opacity: 0; }
	}

	@keyframes gameLoadAnim {
		0% { opacity: 1; }
		75% { opacity: 1; }
		100% { opacity: 0.5; }
	}
`

function getWikiPage(page, callback) {
	let url = `https://en.wikipedia.org/w/rest.php/v1/page/${page}/html?redirect=true`;
	let request = new XMLHttpRequest();
	request.open("GET", url, true);
	request.addEventListener("load", function(event) { (callback)(request.responseText) });
	request.send();
}

function getWikiSummary(page) {
	let url = `https://en.wikipedia.org/api/rest_v1/page/summary/${page}?redirect=true`;
	let request = new XMLHttpRequest();
	request.open("GET", url, false);
	request.send();
	return JSON.parse(request.responseText).extract_html;
}