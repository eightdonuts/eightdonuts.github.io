/**
 * global variables and some settings
 * variables should be changed while adding/deleting articels
 */
var articleNum = {
	novel: [21, 18, 2],
	shortStory: 6,
	flashFiction: 13,
	sevenLibrary: 3
};
var pageNum = {
	novel: [],
	shortStory: Math.ceil(articleNum.shortStory / 3),
	flashFiction: Math.ceil(articleNum.flashFiction / 3),
	sevenLibrary: Math.ceil(articleNum.sevenLibrary / 3)
};

var novelChapterNum = articleNum.novel.length;
for(var i = 0; i < novelChapterNum; i++)
	pageNum.novel[i] = Math.ceil(articleNum.novel[i] / 3);

var newDateThresh = 7;

$.ajaxSetup({cache: false }); //not sure whether it will work


/**
 * go back function
 */
function goBack() {
	$("#go-back").hide();
	$("#reading-area").hide();
	$("html,body").scrollTop();
	$("#summary-wrapper").show();
}


/**
 * nav display
 */
var nav = document.getElementById("nav");
var navFixed = document.getElementById("nav-fixed");

function handleNav() {
	if(nav.getBoundingClientRect().top < -50) {
		navFixed.style.transition = "top 0s, opacity 0.5s";
		navFixed.style.top = "0";
		navFixed.style.opacity = 1;
	}
	else {
		navFixed.style.transition = "top 0s 0.5s, opacity 0.5s"; //top delay 0.5s
		navFixed.style.top = "-9999px";
		navFixed.style.opacity = 0;
	}
}

window.addEventListener("scroll", function(){handleNav(); }, false);


/**
 * smooth scrolling
 */
$(document).ready(function() {
	$('a[href*="#"]:not([href="#"])').click(function() {
		$("#reading-area").hide();
		$("#summary-wrapper").show();
		if(location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
			var target = $(this.hash);
			target = target.length? target : $('[name=' + this.hash.slice(1) +']');
			if(target.length) {
				$("html,body").animate({scrollTop: target.offset().top - 80}, 800);
				$("#go-back").hide();
        		return false;
        	}
        }
    });
});


/**
 * active tab
 */
var activeChapter = novelChapterNum;

function activeTab(targetChapter) {
	//tab
	for(var i = 1; i <= novelChapterNum; i++) {
		var tab = document.getElementById("tab-chapter-" + i);
		tab.className = tab.className.replace(/ btn-active/g, "");
	}
	document.getElementById("tab-chapter-" + targetChapter).className += " btn-active";

	//content
	loadLatestChapterArticle(targetChapter);
	deployPagingBtn("novel", targetChapter);
	loadSummary("novel", targetChapter, 1); //load the summary of latest article
	activeChapter = targetChapter;

	//reload disqus comment count
	window.DISQUSWIDGETS = undefined;
	$.getScript("http://chazeldisqus.disqus.com/count.js");
}

function loadLatestChapterArticle(targetChapter) {
	$("#latest-novel-title").html("讀取中...").removeClass("new");
	$("#latest-novel-comment-count").html("讀取中...");
	$("#latest-novel-comment-count").attr("data-disqus-identifier", "novel__" + targetChapter + "__" + articleNum.novel[targetChapter - 1]);
	$("#latest-novel-content").html("讀取中...");

	var src = "http://eightdonuts.github.io/chazel/text/novel/chapter-" + targetChapter + "/" + articleNum.novel[targetChapter - 1];
	$.get(src, function(data) {
		var a = data.split("\n"); //article array

		//load cover
		$("#latest-novel-cover").css({
			background: "url('./img/cover/novel/" + a[0] + "') center center",
			backgroundSize: "cover"
		})
		.unbind().click(function() {
			readArticle("novel", targetChapter, articleNum.novel[targetChapter - 1]);
		});

		//load article
		$("#latest-novel-title").html(a[2])
		.unbind().click(function() {
			readArticle("novel", targetChapter, articleNum.novel[targetChapter - 1]);
		});
		if((Date.now() - Date.parse(a[1])) / 86400000 <= newDateThresh)
			$("#latest-novel-title").addClass("new");
		$("#latest-novel-content").html(a[3].replace(/<br>/g, "").replace(/　/g, "").substring(0, 120) + "...");
	});
}


/**
 * select other chapter in latest novel section
 */
var novelSection = {
	show: function() {
		$("#latest-novel-wrapper").hide();
		$("#novel-wrapper").show();
	},
	hide: function() {
		$("#novel-wrapper").hide();
		$("#latest-novel-wrapper").show();
	}
}


/**
 * AJAX
 */
function loadSummary(section, subSection, targetPage) {
	var articleN, pageN;
	switch(section) {
		case "novel":
			articleN = articleNum.novel[subSection - 1];
			break;
		case "short-story":
			articleN = articleNum.shortStory;
			break;
		case "flash-fiction":
			articleN = articleNum.flashFiction;
			break;
		case "seven-library":
			articleN = articleNum.sevenLibrary;
	}
	pageN = Math.ceil(articleN / 3);

	//button style
	for(var p = 1; p <= pageN; p++)
		$("#" + section + "-paging-btn-" + p).removeClass("btn-active");
	$("#" + section + "-paging-btn-" + targetPage).addClass("btn-active");

	//deploy article summary
	for(var col = 1; col <= 3; col++) {
		var articleID = articleN - 3 * (targetPage - 1) - col + 1;
		if(articleID <= 0) {
			for(var i = col; i <= 3; i++) {
				deployArticleSummary(section, subSection, i, 0); //deploy an empty page
			}
			break;
		}
		deployArticleSummary(section, subSection, col, articleID);
	}
}

function deployArticleSummary(section, subSection, col, articleID) {
	//deploy an empty page
	if(articleID == 0) {
		$("#" + section + "-" + col + "-cover").css("background-image", "none");
		$("#" + section + "-" + col + "-category").html("");
		$("#" + section + "-" + col + "-title").html("").removeClass("new");
		$("#" + section + "-" + col + "-comment-count").html("").removeAttr("data-disqus-identifier");
		$("#" + section + "-" + col + "-content").html("");
		return;
	} else {
		$("#" + section + "-" + col + "-title").html("讀取中...").removeClass("new");
		$("#" + section + "-" + col + "-content").html("讀取中...");
		$("#" + section + "-" + col + "-comment-count").html("0 則評論");
	}

	var srcHeader;
	if(section == "novel")
		srcHeader = "http://eightdonuts.github.io/chazel/text/novel/chapter-" + subSection + "/";
	else
		srcHeader = "http://eightdonuts.github.io/chazel/text/" + section + "/";

	$.get(srcHeader + articleID, function(data) {
		var a = data.split("\n"); //article array

		//load cover
		$("#" + section + "-" + col + "-cover")
		.css({
			background: "url('./img/cover/" + section + "/" + a[0] + "') center center",
			backgroundSize: "cover"
		})
		.unbind().click(function() {
			readArticle(section, subSection, articleID);
		});

		//load article
		switch(section) {
			case "novel":
				$("#" + section + "-" + col + "-category").html("長篇小說");
				break;
			case "short-story":
				$("#" + section + "-" + col + "-category").html("短篇小說");
				break;
			case "flash-fiction":
				$("#" + section + "-" + col + "-category").html("極短篇小說");
				break;
			case "seven-library":
				$("#" + section + "-" + col + "-category").html("七號圖書館");
				break;
		}
		$("#" + section + "-" + col + "-title").html(a[2])
		.unbind().click(function() {
			readArticle(section, null, articleID);
		});
		if((Date.now() - Date.parse(a[1])) / 86400000 <= newDateThresh)
			$("#" + section + "-" + col + "-title").addClass("new");
		$("#" + section + "-" + col + "-content").html(a[3].replace(/<br>/g, "").replace(/　/g, "").substring(0, 120) + "...");
	});

	//disqus comment count
	var identifier;
	if(subSection == null)
		identifier = section + "__" + articleID;
	else
		identifier = section + "__" + subSection + "__" + articleID;
	$("#" + section + "-" + col + "-comment-count").attr("data-disqus-identifier", identifier);

	//reload disqus comment count
	window.DISQUSWIDGETS = undefined;
	$.getScript("http://chazeldisqus.disqus.com/count.js");
}


/**
 * deploy paging buttons
 * doesn't set the style of active button (e.g. the first page)
 */
function deployPagingBtn(section, subSection) {
	var pageN, output = [];
	switch(section) {
		case "novel":
			pageN = pageNum.novel[subSection - 1];
			break;
		case "short-story":
			pageN = pageNum.shortStory;
			break;
		case "flash-fiction":
			pageN = pageNum.flashFiction;
			break;
		case "seven-library":
			pageN = pageNum.sevenLibrary;
			break;
	}

	for(var page = 1; page <= pageN; page++)
		output.push("<button id=\"" + section + "-paging-btn-" + page + "\" class=\"btn\" onclick=\"loadSummary('" + section + "', " + subSection + ", " + page + ")\">" + page + "</button>");
	if(section == "novel")
		output.push("<button class=\"btn\" onclick=\"novelSection.hide()\">顯示最新一回</button>")
	$("#" + section + "-paging").html(output.join(""));
}


/**
 * read the target article
 */
var prevFunc, nextFunc;

function readArticle(section, subSection, articleID) {
	$("#summary-wrapper").hide();
	$("html,body").scrollTop();
	$("#go-back").show();
	$("#reading-area").show();

	var articleN;
	switch(section) {
		case "novel":
			articleN = articleNum.novel[subSection - 1];
			break;
		case "short-story":
			articleN = articleNum.shortStory;
			break;
		case "flash-fiction":
			articleN = articleNum.flashFiction;
			break;
		case "seven-library":
			articleN = articleNum.sevenLibrary;
	}

	//initialize reading area
	$("#reading-area-title").html("讀取中...").removeClass("new");
	$("#reading-area-content").html("<div id=\"disqus_thread\"></div>");
	resetDisqus(section, subSection, articleID);

	//load the target article
	var srcHeader;
	if(section == "novel")
		srcHeader = "http://eightdonuts.github.io/chazel/text/novel/chapter-" + subSection + "/";
	else
		srcHeader = "http://eightdonuts.github.io/chazel/text/" + section + "/";
	$.get(srcHeader + articleID, function(data) {
		var a = data.split("\n");
		$("#reading-area-title").html(a[2]);
		if((Date.now() - Date.parse(a[1])) / 86400000 <= newDateThresh)
			$("#reading-area-title").addClass("new");
		$("<div>" + a[3] + "</div>").insertBefore("#disqus_thread");
	});

	//deploy sub-column
	$("#prev-article-title").html("讀取中...");
	$("#next-article-title").html("讀取中...");

	if(articleID > 1) {
		$.get(srcHeader + (articleID - 1), function(data) {
			$("#prev-article-title").html(data.split("\n")[2]);
			prevFunc = function() {
				readArticle(section, subSection, articleID - 1);
			}
		});
		$("#prev").show();
	}
	else $("#prev").hide();

	if(articleID < articleN) {
		$.get(srcHeader + (articleID + 1), function(data) {
			$("#next-article-title").html(data.split("\n")[2]);
			nextFunc = function() {
				readArticle(section, subSection, articleID + 1);
			}
		});
		$("#next").show()
	}
	else $("#next").hide();
}


/**
 * change font-size and line-height
 */
 var readingSetting = {
 	fontSize: [14, 16, 20],
 	lineHeight: [1.6, 2.0, 2.4]
 }

function setFontSize(level) {
	//button style
	for(var i = 1; i <= 3; i++) {
		var tab = document.getElementById("font-size-btn-" + i);
		tab.className = tab.className.replace(/ btn-active/g, "");
	}
	document.getElementById("font-size-btn-" + level).className += " btn-active";

	$("#reading-area-content").css("font-size",  readingSetting.fontSize[level - 1] + "px");
}

function setLineHeight(level) {
	//button style
	for(var i = 1; i <= 3; i++) {
		var tab = document.getElementById("line-height-btn-" + i);
		tab.className = tab.className.replace(/ btn-active/g, "");
	}
	document.getElementById("line-height-btn-" + level).className += " btn-active";

	$("#reading-area-content").css("line-height",  readingSetting.lineHeight[level - 1]);
}


/**
 * disqus
 */
 var disqus_config = function () {
	this.page.url = "http://eightdonuts.github.io/chazel/";
	this.page.identifier = "home";
};

(function() {
	var d = document, s = d.createElement('script');
	s.src = 'http://chazeldisqus.disqus.com/embed.js';
	s.setAttribute('data-timestamp', +new Date());
	(d.head || d.body).appendChild(s);
})();//don't edit this

function resetDisqus(section, subSection, articleID) {
	var identifier;
	if(subSection == null)
		identifier = section + "__" + articleID;
	else
		identifier = section + "__" + subSection + "__" + articleID;

	DISQUS.reset({
		reload: true,
		config: function () {  
			this.page.url = "http://eightdonuts.github.io/chazel/#!" + identifier;
			this.page.identifier = identifier;
		}
	});
}


/**
 * deploy initial page
 */
loadLatestChapterArticle(novelChapterNum);
deployPagingBtn("novel", novelChapterNum);
loadSummary("novel", novelChapterNum, 1);
deployPagingBtn("short-story", null);
loadSummary("short-story", null, 1);
deployPagingBtn("flash-fiction", null);
loadSummary("flash-fiction", null, 1);
deployPagingBtn("seven-library", null);
loadSummary("seven-library", null, 1);
