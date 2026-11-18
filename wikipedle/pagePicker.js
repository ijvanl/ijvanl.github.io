function getPagesForToday(nthDay, pageList) {
	let start = getPagesWithConstants(nthDay, 192, 1, pageList);
	let end = getPagesWithConstants(nthDay, 55, -3, pageList);
	return [start, end];
}

function getPagesWithConstants(nthDay, bigSkips, littleSkips, pageList) {
	let offsetBig = (nthDay * bigSkips);
	let offsetLil = Math.floor(nthDay / bigSkips) * littleSkips;
	return pageList[Math.abs(offsetBig + offsetLil) % (pageList.length)];
}