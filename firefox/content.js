// Workaround to capture Esc key on certain sites
var isOpen = false;
document.onkeyup = (e) => {
	if (e.key == "Escape" && isOpen) {
		browser.runtime.sendMessage({request:"close-Celer"})
	}
}

$(document).ready(() => {
	var actions = [];
	var isFiltered = false;

	// Append the Celer into the current page
	$.get(browser.runtime.getURL('/content.html'), (data) => {
		$(data).appendTo('body');

		// Get checkmark image for toast
		$("#Celer-extension-toast img").attr("src", browser.runtime.getURL("assets/check.svg"));

		// Request actions from the background
		browser.runtime.sendMessage({request:"get-actions"}, (response) => {
			actions = response.actions;
			populateCeler();
		});

		// New tab page workaround
		if (window.location.href == "browser-extension://mpanekjjajcabgnlbabmopeenljeoggm/newtab.html") {
			isOpen = true;
			$("#Celer-extension").removeClass("Celer-closing");
			window.setTimeout(() => {
				$("#Celer-extension input").focus();
			}, 100);
		}
	});

	function renderAction(action, index, keys, img) {
		var skip = "";
		if (action.action == "search" || action.action == "goto") {
			skip = "style='display:none'";
		}
		if (index != 0) {
			$("#Celer-extension #Celer-list").append("<div class='Celer-item' "+skip+" data-index='"+index+"' data-type='"+action.type+"'>"+img+"<div class='Celer-item-details'><div class='Celer-item-name'>"+action.title+"</div><div class='Celer-item-desc'>"+action.desc+"</div></div>"+keys+"<div class='Celer-select'>Select <span class='Celer-shortcut'>⏎</span></div></div>");
		} else {
			$("#Celer-extension #Celer-list").append("<div class='Celer-item Celer-item-active' "+skip+" data-index='"+index+"' data-type='"+action.type+"'>"+img+"<div class='Celer-item-details'><div class='Celer-item-name'>"+action.title+"</div><div class='Celer-item-desc'>"+action.desc+"</div></div>"+keys+"<div class='Celer-select'>Select <span class='Celer-shortcut'>⏎</span></div></div>");
		}
		if (!action.emoji) {
			var loadimg = new Image();
			loadimg.src = action.favIconUrl;

			// Favicon doesn't load, use a fallback
			loadimg.onerror = () => {
				$(".Celer-item[data-index='"+index+"'] img").attr("src", browser.runtime.getURL("/assets/globe.svg"));
			}
		}
	}

	// Add actions to the Celer
	function populateCeler() {
		$("#Celer-extension #Celer-list").html("");
		actions.forEach((action, index) => {
			var keys = "";
			if (action.keycheck) {
					keys = "<div class='Celer-keys'>";
					action.keys.forEach(function(key){
						keys += "<span class='Celer-shortcut'>"+key+"</span>";
					});
					keys += "</div>";
			}
			
			// Check if the action has an emoji or a favicon
			if (!action.emoji) {
				var onload = 'if ("naturalHeight" in this) {if (this.naturalHeight + this.naturalWidth === 0) {this.onerror();return;}} else if (this.width + this.height == 0) {this.onerror();return;}';
				var img = "<img src='"+action.favIconUrl+"' alt='favicon' onload='"+onload+"' onerror='this.src=&quot;"+browser.runtime.getURL("/assets/globe.svg")+"&quot;' class='Celer-icon'>";
				renderAction(action, index, keys, img);
			} else {
				var img = "<span class='Celer-emoji-action'>"+action.emojiChar+"</span>";
				renderAction(action, index, keys, img);
			}
		})
		$(".Celer-extension #Celer-results").html(actions.length+" results");
	}

	// Add filtered actions to the Celer
	function populateCelerFilter(actions) {
		isFiltered = true;
		$("#Celer-extension #Celer-list").html("");
		const renderRow = (index) => {
			const action = actions[index]
			var keys = "";
			if (action.keycheck) {
					keys = "<div class='Celer-keys'>";
					action.keys.forEach(function(key){
						keys += "<span class='Celer-shortcut'>"+key+"</span>";
					});
					keys += "</div>";
			}
			var img = "<img src='"+action.favIconUrl+"' alt='favicon' onerror='this.src=&quot;"+browser.runtime.getURL("/assets/globe.svg")+"&quot;' class='Celer-icon'>";
			if (action.emoji) {
				img = "<span class='Celer-emoji-action'>"+action.emojiChar+"</span>"
			}
			if (index != 0) {
				return $("<div class='Celer-item' data-index='"+index+"' data-type='"+action.type+"' data-url='"+action.url+"'>"+img+"<div class='Celer-item-details'><div class='Celer-item-name'>"+action.title+"</div><div class='Celer-item-desc'>"+action.url+"</div></div>"+keys+"<div class='Celer-select'>Select <span class='Celer-shortcut'>⏎</span></div></div>")[0]
			} else {
				return $("<div class='Celer-item Celer-item-active' data-index='"+index+"' data-type='"+action.type+"' data-url='"+action.url+"'>"+img+"<div class='Celer-item-details'><div class='Celer-item-name'>"+action.title+"</div><div class='Celer-item-desc'>"+action.url+"</div></div>"+keys+"<div class='Celer-select'>Select <span class='Celer-shortcut'>⏎</span></div></div>")[0]
			}
		}
		actions.length && new VirtualizedList.default($("#Celer-extension #Celer-list")[0], {
			height: 400,
			rowHeight: 60,
			rowCount: actions.length,
			renderRow,
			onMount: () => $(".Celer-extension #Celer-results").html(actions.length+" results"),
		});
	}

	// Open the Celer
	function openCeler() {
		browser.runtime.sendMessage({request:"get-actions"}, (response) => {
			isOpen = true;
			actions = response.actions;
			$("#Celer-extension input").val("");
			populateCeler();
			$("html, body").stop();
			$("#Celer-extension").removeClass("Celer-closing");
			window.setTimeout(() => {
				$("#Celer-extension input").focus();
				focusLock.on($("#Celer-extension input").get(0));
				$("#Celer-extension input").focus();
			}, 100);
		});
	}

	// Close the Celer
	function closeCeler() {
		if (window.location.href == "browser-extension://mpanekjjajcabgnlbabmopeenljeoggm/newtab.html") {
			browser.runtime.sendMessage({request:"restore-new-tab"});
		} else {
			isOpen = false;
			$("#Celer-extension").addClass("Celer-closing");
		}
	}

	// Hover over an action in the Celer
	function hoverItem() {
		$(".Celer-item-active").removeClass("Celer-item-active");
		$(this).addClass("Celer-item-active");
	}

	// Show a toast when an action has been performed
	function showToast(action) {
		$("#Celer-extension-toast span").html('"'+action.title+'" has been successfully performed');
		$("#Celer-extension-toast").addClass("Celer-show-toast");
		setTimeout(() => {
			$(".Celer-show-toast").removeClass("Celer-show-toast");
		}, 3000)
	}

	// Autocomplete commands. Since they all start with different letters, it can be the default behavior
	function checkShortHand(e, value) {
		var el = $(".Celer-extension input");
		if (e.keyCode != 8) {
			if (value == "/t") {
				el.val("/tabs ")
			} else if (value == "/b") {
				el.val("/bookmarks ")
			} else if (value == "/h") {
				el.val("/history ");
			} else if (value == "/r") {
				el.val("/remove ");
			} else if (value == "/a") {
				el.val("/actions ");
			}
		} else {
			if (value == "/tabs" || value == "/bookmarks" || value == "/actions" || value == "/remove" || value == "/history") {
				el.val("");
			}
		}
	}

	// Add protocol
	function addhttp(url) {
			if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
					url = "http://" + url;
			}
			return url;
	}

	// Check if valid url
	function validURL(str) {
		var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
			'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
			'((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
			'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
			'(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
			'(\\#[-a-z\\d_]*)?$','i'); // fragment locator
		return !!pattern.test(str);
	}

	// Search for an action in the Celer
	function search(e) {
		if (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40 || e.keyCode == 13 || e.keyCode == 37) {
			return;
		}
		var value = $(this).val().toLowerCase();
		checkShortHand(e, value);
		value = $(this).val().toLowerCase();
		if (value.startsWith("/history")) {
			$(".Celer-item[data-index='"+actions.findIndex(x => x.action == "search")+"']").hide();
			$(".Celer-item[data-index='"+actions.findIndex(x => x.action == "goto")+"']").hide();
			var tempvalue = value.replace("/history ", "");
			var query = "";
			if (tempvalue != "/history") {
				query = value.replace("/history ", "");
			}
			browser.runtime.sendMessage({request:"search-history", query:query}, (response) => {
				populateCelerFilter(response.history);
			});
		} else if (value.startsWith("/bookmarks")) {
			$(".Celer-item[data-index='"+actions.findIndex(x => x.action == "search")+"']").hide();
			$(".Celer-item[data-index='"+actions.findIndex(x => x.action == "goto")+"']").hide();
			var tempvalue = value.replace("/bookmarks ", "");
			if (tempvalue != "/bookmarks" && tempvalue != "") {
				var query = value.replace("/bookmarks ", "");
				browser.runtime.sendMessage({request:"search-bookmarks", query:query}, (response) => {
					populateCelerFilter(response.bookmarks);
				});
			} else {
				populateCelerFilter(actions.filter(x => x.type == "bookmark"));
			}
		} else {
			if (isFiltered) {
				populateCeler();
				isFiltered = false;
			}
			$(".Celer-extension #Celer-list .Celer-item").filter(function(){
				if (value.startsWith("/tabs")) {
					$(".Celer-item[data-index='"+actions.findIndex(x => x.action == "search")+"']").hide();
					$(".Celer-item[data-index='"+actions.findIndex(x => x.action == "goto")+"']").hide();
					var tempvalue = value.replace("/tabs ", "");
					if (tempvalue == "/tabs") {
						$(this).toggle($(this).attr("data-type") == "tab");
					} else {
						tempvalue = value.replace("/tabs ", "");
						$(this).toggle(($(this).find(".Celer-item-name").text().toLowerCase().indexOf(tempvalue) > -1 || $(this).find(".Celer-item-desc").text().toLowerCase().indexOf(tempvalue) > -1) && $(this).attr("data-type") == "tab");
					}
				} else if (value.startsWith("/remove")) {
					$(".Celer-item[data-index='"+actions.findIndex(x => x.action == "search")+"']").hide();
					$(".Celer-item[data-index='"+actions.findIndex(x => x.action == "goto")+"']").hide();
					var tempvalue = value.replace("/remove ", "")
					if (tempvalue == "/remove") {
						$(this).toggle($(this).attr("data-type") == "bookmark" || $(this).attr("data-type") == "tab");
					} else {
						tempvalue = value.replace("/remove ", "");
						$(this).toggle(($(this).find(".Celer-item-name").text().toLowerCase().indexOf(tempvalue) > -1 || $(this).find(".Celer-item-desc").text().toLowerCase().indexOf(tempvalue) > -1) && ($(this).attr("data-type") == "bookmark" || $(this).attr("data-type") == "tab"));
					}
				} else if (value.startsWith("/actions")) {
					$(".Celer-item[data-index='"+actions.findIndex(x => x.action == "search")+"']").hide();
					$(".Celer-item[data-index='"+actions.findIndex(x => x.action == "goto")+"']").hide();
					var tempvalue = value.replace("/actions ", "")
					if (tempvalue == "/actions") {
						$(this).toggle($(this).attr("data-type") == "action");
					} else {
						tempvalue = value.replace("/actions ", "");
						$(this).toggle(($(this).find(".Celer-item-name").text().toLowerCase().indexOf(tempvalue) > -1 || $(this).find(".Celer-item-desc").text().toLowerCase().indexOf(tempvalue) > -1) && $(this).attr("data-type") == "action");
					}
				} else {
					$(this).toggle($(this).find(".Celer-item-name").text().toLowerCase().indexOf(value) > -1 || $(this).find(".Celer-item-desc").text().toLowerCase().indexOf(value) > -1);
					if (value == "") {
						$(".Celer-item[data-index='"+actions.findIndex(x => x.action == "search")+"']").hide();
						$(".Celer-item[data-index='"+actions.findIndex(x => x.action == "goto")+"']").hide();
					} else if (!validURL(value)) {
						$(".Celer-item[data-index='"+actions.findIndex(x => x.action == "search")+"']").show();
						$(".Celer-item[data-index='"+actions.findIndex(x => x.action == "goto")+"']").hide();
						$(".Celer-item[data-index='"+actions.findIndex(x => x.action == "search")+"'] .Celer-item-name").html('\"'+value+'\"');
					} else {
						$(".Celer-item[data-index='"+actions.findIndex(x => x.action == "search")+"']").hide();
						$(".Celer-item[data-index='"+actions.findIndex(x => x.action == "goto")+"']").show();
						$(".Celer-item[data-index='"+actions.findIndex(x => x.action == "goto")+"'] .Celer-item-name").html(value);
					}
				}
			});
		}
		
		$(".Celer-extension #Celer-results").html($("#Celer-extension #Celer-list .Celer-item:visible").length+" results");
		$(".Celer-item-active").removeClass("Celer-item-active");
		$(".Celer-extension #Celer-list .Celer-item:visible").first().addClass("Celer-item-active");
	}

	// Handle actions from the Celer
	function handleAction(e) {
		var action = actions[$(".Celer-item-active").attr("data-index")];
		closeCeler();
		if ($(".Celer-extension input").val().toLowerCase().startsWith("/remove")) {
			browser.runtime.sendMessage({request:"remove", type:action.type, action:action});
		} else if ($(".Celer-extension input").val().toLowerCase().startsWith("/history")) {
			if (e.ctrlKey || e.metaKey) {
				window.open($(".Celer-item-active").attr("data-url"));
			} else {
				window.open($(".Celer-item-active").attr("data-url"), "_self");
			}
		} else if ($(".Celer-extension input").val().toLowerCase().startsWith("/bookmarks")) {
			if (e.ctrlKey || e.metaKey) {
				window.open($(".Celer-item-active").attr("data-url"));
			} else {
				window.open($(".Celer-item-active").attr("data-url"), "_self");
			}
		} else {
			browser.runtime.sendMessage({request:action.action, tab:action, query:$(".Celer-extension input").val()});
			switch (action.action) {
				case "bookmark":
					if (e.ctrlKey || e.metaKey) {
						window.open(action.url);
					} else {
						window.open(action.url, "_self");
					}
					break;
				case "scroll-bottom":
					window.scrollTo(0,document.body.scrollHeight);
					showToast(action);
					break;
				case "scroll-top":
					window.scrollTo(0,0);
					break;
				case "navigation":
					if (e.ctrlKey || e.metaKey) {
						window.open(action.url);
					} else {
						window.open(action.url, "_self");
					}
					break;
				case "fullscreen":
					var elem = document.documentElement;
					elem.requestFullscreen();
					break;
				case "new-tab":
					window.open("");
					break;
				case "email":
					window.open("mailto:");
					break;
				case "url":
					if (e.ctrlKey || e.metaKey) {
						window.open(action.url);
					} else {
						window.open(action.url, "_self");
					}
					break;
				case "goto":
					if (e.ctrlKey || e.metaKey) {
						window.open(addhttp($(".Celer-extension input").val()));
					} else {
						window.open(addhttp($(".Celer-extension input").val()), "_self");
					}
					break;
				case "print":
					window.print();
					break;
				case "remove-all":
				case "remove-history":
				case "remove-cookies":
				case "remove-cache":
				case "remove-local-storage":
				case "remove-passwords":
					showToast(action);
					break;
			}
		}

		// Fetch actions again
		browser.runtime.sendMessage({request:"get-actions"}, (response) => {
			actions = response.actions;
			populateCeler();
		});
	}

	// Customize the shortcut to open the Celer box
	function openShortcuts() {
		browser.runtime.sendMessage({request:"extensions/shortcuts"});
	}


	// Check which keys are down
	var down = [];

	$(document).keydown((e) => {
		down[e.keyCode] = true;
		if (down[38]) {
			// Up key
			if ($(".Celer-item-active").prevAll("div").not(":hidden").first().length) {
				var previous = $(".Celer-item-active").prevAll("div").not(":hidden").first();
				$(".Celer-item-active").removeClass("Celer-item-active");
				previous.addClass("Celer-item-active");
				previous[0].scrollIntoView({block:"nearest", inline:"nearest"});
			}
		} else if (down[40]) {
			// Down key
			if ($(".Celer-item-active").nextAll("div").not(":hidden").first().length) {
				var next = $(".Celer-item-active").nextAll("div").not(":hidden").first();
				$(".Celer-item-active").removeClass("Celer-item-active");
				next.addClass("Celer-item-active");
				next[0].scrollIntoView({block:"nearest", inline:"nearest"});
			}
		} else if (down[27] && isOpen) {
			// Esc key
			closeCeler();
		} else if (down[13] && isOpen) {
			// Enter key
			handleAction(e);
		}
	}).keyup((e) => {
		if (down[18] && down[16] && down[80]) {
			if (actions.find(x => x.action == "pin") != undefined) {
				browser.runtime.sendMessage({request:"pin-tab"});
			} else {
				browser.runtime.sendMessage({request:"unpin-tab"});
			}
			browser.runtime.sendMessage({request:"get-actions"}, (response) => {
				actions = response.actions;
				populateCeler();
			});
		} else if (down[18] && down[16] && down[77]) {
			if (actions.find(x => x.action == "mute") != undefined) {
				browser.runtime.sendMessage({request:"mute-tab"});
			} else {
				browser.runtime.sendMessage({request:"unmute-tab"});
			}
			browser.runtime.sendMessage({request:"get-actions"}, (response) => {
				actions = response.actions;
				populateCeler();
			});
		} else if (down[18] && down[16] && down[67]) {
			window.open("mailto:");
		}

		down = [];
	});

	// Recieve messages from background
	browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (message.request == "open-Celer") {
			if (isOpen) {
				closeCeler();
			} else {
				openCeler();
			}
		} else if (message.request == "close-Celer") {
			closeCeler();
		}
	});

	$(document).on("click", "#open-page-Celer-extension-thing", openShortcuts);
	$(document).on("mouseover", ".Celer-extension .Celer-item:not(.Celer-item-active)", hoverItem);
	$(document).on("keyup", ".Celer-extension input", search);
	$(document).on("click", ".Celer-item-active", handleAction);
	$(document).on("click", ".Celer-extension #Celer-overlay", closeCeler);
});
