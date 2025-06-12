/*jshint esversion: 11 */

var bookmarks = []; // bookmark storage
var search_history = []; // history storage
var help_form = null;
const HISTORY_LENGTH = 100;

function clock() // update the "last updated" clock
{
	let now = new Date();
	let elapsed = (now - (new Date(timestamp))) / 1000;
	let msg = "";
	if(elapsed < 120) msg = Math.trunc(elapsed) + " seconds ago.";
	else if(elapsed < 7200) msg = Math.trunc(elapsed / 60) + " minutes ago.";
	else if(elapsed < 172800) msg = Math.trunc(elapsed / 3600) + " hours ago.";
	else if(elapsed < 5270400) msg = Math.trunc(elapsed / 86400) + " days ago.";
	else if(elapsed < 63115200) msg = Math.trunc(elapsed / 2635200) + " months ago.";
	else msg = Math.trunc(elapsed / 31557600) + " years ago.";
	document.getElementById('timestamp').textContent = "Last update: " + msg;
}

function resetTabs() // reset the tab state
{
	let tabcontent = document.getElementsByClassName("tab-content");
	for(let i = 0; i < tabcontent.length; i++)
		tabcontent[i].style.display = "none";
	let tabbuttons = document.getElementsByClassName("tab-button");
	for (let i = 0; i < tabbuttons.length; i++)
		tabbuttons[i].classList.remove("active");
}

function open_tab(tabName) // reset and then select a tab
{
	resetTabs();
	document.getElementById(tabName).style.display = "";
	document.getElementById("tab-"+tabName).classList.add("active");
}

function crash() // setup the notice
{
	let el = document.getElementById("issues");
	if(el)
	{
		el.innerHTML = '<p>A critical error occured, please report the issue if it persists.<br>You can also try to clear your cache or do a CTRL+F5.<br><a href="https://mizagbf.github.io/">Home Page</a><br><a href="https://github.com/MizaGBF/GBFAL/issues">Github</a></p>';
		el.style.display = null;
	}
}

function issues(changelog) // setup the issue notice
{
	if(changelog.issues.length > 0)
	{
		let el = document.getElementById("issues");
		if(el)
		{
			let html = "<ul>";
			for(let i = 0; i < changelog.issues.length; ++i)
				html += "<li>" + changelog.issues[i] + "</li>\n";
			html += "</ul>";
			el.innerHTML = html;
			el.style.display = null;
		}
	}
}

function help_wanted() // setup the help wanted notice
{
	let d = document.getElementById("notice");
	if(d)
	{
		d.style.display = null;
		d.innerHTML = 'Looking for help to find the name of those <a href="?id=missing-help-wanted">elements</a>.<br>Contact me or use this <a href="' + help_form + '">form</a> to submit a name.';
	}
}

function init_lists(changelog, callback)
{
	let node = document.getElementById('new');
	if(gbf)
	{
		try
		{
			if(node && changelog.new)
			{
				let fragment = document.createDocumentFragment();
				for(const [key, value] of Object.entries(changelog.new))
				{
					let div = document.createElement("div");
					div.classList.add("mobile-big");
					div.classList.add("updated-header");
					div.innerText = key;
					fragment.appendChild(div);
					list_elements(fragment, value.reverse(), callback);
				}
				node.appendChild(fragment);
			}
			toggle_bookmark();
			update_history();
		} catch(err) {
			console.error("Exception thrown", err.stack);
			crash();
		}
	}
	else crash();
}

function toggle_bookmark(id = null, type = null)
{
	if(bookmark_key)
	{
		try
		{
			bookmarks = localStorage.getItem(bookmark_key);
			if(bookmarks == null)
			{
				bookmarks = [];
			}
			else
			{
				bookmarks = JSON.parse(bookmarks);
			}
		}
		catch(err)
		{
			console.error("Exception thrown", err.stack);
			bookmarks = [];
		}
		if(id != null)
		{
			let fav = document.getElementById('fav-btn');
			if(fav)
				{
				if(!fav.classList.contains("fav-on"))
				{
					bookmarks.push([id, type]);
					set_bookmark_button(true);
					push_popup("" + id + " has been bookmarked.");
				}
				else
				{
					for(let i = 0; i < bookmarks.length; ++i)
					{
						if(bookmarks[i][0] == id)
						{
							bookmarks.splice(i, 1);
							break;
						}
					}
					set_bookmark_button(false);
					push_popup("" + id + " has been removed from the bookmarks.");
				}
				localStorage.setItem(bookmark_key, JSON.stringify(bookmarks));
			}
		}
		update_bookmark();
	}
}

function init_bookmark_button(state, id = null, type = null) // favorite button control
{
	let fav = document.getElementById('fav-btn');
	if(fav)
	{
		if(state)
		{
			fav.style.display = null;
			fav.onclick = function() { toggle_bookmark(id, type); };
			for(let e of bookmarks)
			{
				if(e[0] == id)
				{
					set_bookmark_button(true);
					return;
				}
			}
			set_bookmark_button(false);
		}
		else
		{
			fav.style.display = "none";
			fav.onclick = null;
		}
	}
}

function set_bookmark_button(val) // set bookmark button state
{
	let fav = document.getElementById('fav-btn');
	if(val)
	{
		fav.classList.toggle("fav-on", true);
		fav.innerHTML = "★";
	}
	else
	{
		fav.classList.toggle("fav-on", false);
		fav.innerHTML = "☆";
	}
}

function update_bookmark() // update bookmark list
{
	let node = document.getElementById('bookmark');
	if(node)
	{
		var fragment = document.createDocumentFragment();
		list_elements(fragment, bookmarks, bookmark_onclick);

		fragment.appendChild(document.createElement("br"));
		
		let div = add_to(fragment, "div", {
			cls:["std-button-container"]
		});
		add_to(div, "button", {
			cls:["std-button"],
			innertext:"Clear",
			onclick:clear_bookmark
		});
		add_to(div, "button", {
			cls:["std-button"],
			innertext:"Export",
			onclick:export_bookmark
		});
		add_to(div, "button", {
			cls:["std-button"],
			innertext:"Import",
			onclick:import_bookmark
		});
		update_next_frame(function() {
			node.innerHTML = "";
			if(bookmarks.length == 0)
				node.appendChild.innerText = "No bookmarked elements.";
			node.appendChild(fragment);
		});
	}
}

function clear_bookmark() // clear the bookmark list
{
	localStorage.removeItem(bookmark_key);
	let fav = document.getElementById('fav-btn');
	fav.classList.remove("fav-on");
	fav.innerHTML = "☆";
	bookmarks = [];
	update_bookmark();
}

function export_bookmark() // export the bookmark list to the clipboard
{
	try
	{
		bookmarks = localStorage.getItem(bookmark_key);
		if(bookmarks == null)
		{
			bookmarks = [];
		}
		else
		{
			bookmarks = JSON.parse(bookmarks);
		}
		navigator.clipboard.writeText(JSON.stringify(bookmarks));
		push_popup("Bookmarks have been copied");
	}
	catch(err)
	{
		console.error("Exception thrown", err.stack);
		bookmarks = [];
	}
}

function import_bookmark() // import the bookmark list from the clipboard. need localhost or a HTTPS host
{
	navigator.clipboard.readText().then((clipText) => {
		try
		{
			let tmp = JSON.parse(clipText);
			if(typeof tmp != 'object')
			{
				push_popup("The imported data seems corrupt or invalid.");
				return;
			}
			let val = false;
			for(let i = 0; i < tmp.length; ++i)
			{
				let e = tmp[i];
				if(e.length != 2 || typeof e[0] != 'string' || typeof e[1] != 'number')
				{
					push_popup("The imported data seems corrupt or invalid.");
					return;
				}
			}
			bookmarks = tmp;
			localStorage.setItem(bookmark_key, JSON.stringify(bookmarks));
			set_bookmark_button(val);
			update_bookmark();
			push_popup("Bookmarks have been imported with success");
		}
		catch(err)
		{
			console.error("Exception thrown", err.stack);
		}
	});
}

function clear_history() // clear the history
{
	localStorage.removeItem(history_key);
	update_history();
}

function update_history(id = null, type = null) // update the history list
{
	// update local storage
	try
	{
		search_history = localStorage.getItem(history_key);
		if(search_history == null)
		{
			search_history = [];
		}
		else
		{
			search_history = JSON.parse(search_history);
			if(search_history.length > HISTORY_LENGTH) // resize
				search_history = search_history.slice(search_history.length - HISTORY_LENGTH);
		}
	}
	catch(err)
	{
		console.error("Exception thrown", err.stack);
		search_history = [];
	}
	if(id != null)
	{
		for(let e of search_history)
		{
			if(e[0] == id)
				return; // don't update if already in
		}
		search_history.push([id, type]);
		if(search_history.length > HISTORY_LENGTH) // resize
			search_history = search_history.slice(search_history.length - HISTORY_LENGTH);
		localStorage.setItem(history_key, JSON.stringify(search_history));
	}
	let node = document.getElementById('history');
	if(node)
	{
		if(search_history.length == 0)
		{
			node.innerHTML = "";
			node.appendChild(document.createTextNode("No elements in your history."));
			return;
		}
		var fragment = document.createDocumentFragment();
		list_elements(fragment, search_history.slice().reverse(), history_onclick);
		fragment.appendChild(document.createElement("br"));
		
		
		let div = add_to(fragment, "div", {
			cls:["std-button-container"]
		});
		add_to(div, "button", {
			cls:["std-button"],
			innertext:"Clear",
			onclick:clear_history
		});
		update_next_frame(function() {
			node.innerHTML = "";
			node.appendChild(fragment);
		});
	}
}

function add_to_index(node, data, callback, level = 0)
{
	// detail
	let details = document.createElement("details");
	if(data.id ?? null)
		details.id = data.id;
	if(data.hide ?? false)
		details.style.display = "none";
	let summary = document.createElement("summary");
	summary.classList.add("detail");
	if(level > 0)
	{
		summary.classList.add("sub-detail");
		if(level > 1)
			summary.classList.add("sub-detail-child");
	}
	// icon
	let icon = null;
	if(data.icon)
	{
		icon = document.createElement("img");
		icon.src = data.icon;
	}
	else icon = document.createElement("span");
	icon.classList.add(level ? "sub-detail-icon" : "detail-icon");
	summary.appendChild(icon);
	// name
	summary.appendChild(document.createTextNode(data.name));
	// set
	details.appendChild(summary);
	node.appendChild(details);
	// set content
	if(data.childs)
	{
		let div = document.createElement("div");
		div.className = "subdetails";
		details.appendChild(div);
		for(let child of data.childs)
		{
			add_to_index(div, child, callback, level + 1);
		}
	}
	else
	{
		let h3 = document.createElement("h3");
		h3.className = "container mobile-big";
		details.appendChild(h3);
		details.onclick = function (){
			load_index_content(h3, data, callback);
			this.onclick = null;
		};
	}
}

function load_index_content(node, data, onclick)
{
	let callback = null;
	let image_callback = add_index_image;
	let target = data.target ? data.target : data.key;
	let type = gbf.index_to_type(target);
	if(type == null)
	{
		switch(target) // extra GBFAL types
		{
			case "title":
				callback = get_title;
				break;
			case "sky_title":
				callback = get_sky_title;
				break;
			case "suptix":
				callback = get_suptix;
				break;
			case "mypage_bg":
				callback = get_mypage_bg;
				break;
			case "subskills":
				callback = get_subskill;
				break;
			case "valentines":
				callback = get_valentine;
				break;
			default:
				return;
		};
	}
	else
	{
		switch(type)
		{
			case GBFType.job:
				callback = get_job;
				break;
			case GBFType.weapon:
				callback = get_weapon;
				break;
			case GBFType.summon:
				callback = get_summon;
				break;
			case GBFType.character:
				callback = target == "skins" ? get_skin : get_character;
				break;
			case GBFType.enemy:
				callback = get_enemy;
				break;
			case GBFType.npc:
				callback = get_npc;
				break;
			case GBFType.partner:
				callback = get_partner;
				break;
			case GBFType.event:
				callback = get_event;
				break;
			case GBFType.skill:
				callback = get_skill;
				break;
			case GBFType.buff:
				callback = get_buff;
				break;
			case GBFType.background:
				callback = get_background;
				break;
			case GBFType.story:
				callback = get_story;
				image_callback = add_text_image;
				break;
			case GBFType.fate:
				callback = get_fate;
				image_callback = add_fate_image;
				break;
			case GBFType.shield:
				callback = get_shield;
				break;
			case GBFType.manatura:
				callback = get_manatura;
				break;
		}
	}
	try
	{
		let ref = index;
		let start = null;
		let lengths = null;
		if(!data.root)
			ref = index[target];
		if(data.check)
		{
			start = data.check[0];
			lengths = data.check[1];
		}
		let slist = {};
		for(const id in ref)
		{
			if(
				(lengths != null && !lengths.includes(id.length))
				|| (start != null && !id.startsWith(start))
			) continue;
			let r = callback(id, ref[id], data.arg1, data.arg2);
			if(r != null)
			{
				if(data.pad)
					slist[id.padStart(20, "0")] = r;
				else
					slist[id] = r;
			}
		}
		const keys = data.reverse ? Object.keys(slist).sort().reverse() : Object.keys(slist).sort();
		if(keys.length > 0)
		{
			if(data.text)
				node.innerHTML = "<div>" + data.text + "</div>";
			else
				node.innerHTML = data.reverse ? "<div>Newest first</div>" : "<div>Oldest first</div>";
		}
		else node.innerHTML = '<div>Empty</div><img src="../GBFML/assets/ui/sorry.png">'
		for(const k of keys)
		{
			for(let r of slist[k])
			{
				r.id = gbf.get_prefix(type) + r.id;
				image_callback(node, r, onclick);
			}
		}
	} catch(err) {
		console.error("Exception thrown", err.stack);
		return;
	}
}

function init_index(config, changelog, callback) // build the html index. simply edit config.json to change the index.
{
	var content = document.getElementById('index');
	if(content == null || !config.hasOwnProperty("index"))
		return;
	try
	{
		let frag = document.createDocumentFragment();
		for(const section of config.index)
		{
			add_to_index(frag, section, callback);
		}
		// stat string
		if(changelog.hasOwnProperty("stat") && changelog.stat != null)
		{
			let center = document.createElement("center");
			center.appendChild(document.createTextNode(changelog.stat));
			center.classList.add("small-text");
			frag.appendChild(center);
		}
		// wait next frame to give time to calculate
		update_next_frame(function() {
			content.innerHTML = "";
			content.appendChild(frag);
		});
	}
	catch(err)
	{
		console.error("Exception thrown", err.stack);
		content.innerHTML = '<div class="container">An error occured while loading the index.<br>Please notify me if you see this message.</div>';
	}
}

function list_elements(frag, elems, onclick)
{
	for(const [id, type] of elems)
	{
		try
		{
			let res = null;
			let callback = add_index_image;
			switch(type)
			{
				case GBFType.character:
				{
					if(gbf.is_character_skin(id))
					{
						res = get_skin(id, (id in index['skins']) ? index['skins'][id] : null, [0, 1000]);
					}
					else
					{
						res = get_character(id, (id in index['characters']) ? index['characters'][id] : null, [0, 1000, 0, 1000, 0, 1000]);
					}
					break;
				}
				case GBFType.summon:
				{
					res = get_summon(id, (id in index['summons']) ? index['summons'][id] : null, id[2], [0, 1000]);
					break;
				}
				case GBFType.weapon:
				{
					res = get_weapon(id, (id in index['weapons']) ? index['weapons'][id] : null, id[2], id[4]);
					break;
				}
				case GBFType.shield:
				{
					res = get_shield(id, (id in index['shields']) ? index['shields'][id] : null, id[0]);
					break;
				}
				case GBFType.manatura:
				{
					res = get_manatura(id, (id in index['manaturas']) ? index['manaturas'][id] : null, id[0]);
					break;
				}
				case GBFType.job:
				{
					res = get_job(id, (id in index['job']) ? index['job'][id] : null);
					break;
				}
				case GBFType.enemy:
				{
					res = get_enemy(id, (id in index['enemies']) ? index['enemies'][id] : null, id[0], id[1]);
					break;
				}
				case GBFType.npc:
				{
					res = get_npc(id, (id in index['npcs']) ? index['npcs'][id] : null, id.slice(1, 3), [0, 10000]);
					break;
				}
				case GBFType.partner:
				{
					res = get_partner(id, (id in index['partners']) ? index['partners'][id] : null, id.slice(1, 3));
					break;
				}
				case GBFType.event:
				{
					res = get_event(id, (id in index['events']) ? index['events'][id] : null);
					break;
				}
				case GBFType.skill:
				{
					res = get_skill(id, (id in index['skills']) ? index['skills'][id] : null, [0, 10000]);
					break;
				}
				case GBFType.buff:
				{
					res = get_buff(id, (id in index['buffs']) ? index['buffs'][id] : null, [0, 10000]);
					break;
				}
				case GBFType.background:
				{
					if(id in index['background'])
					{
						let tmp = id.split('_')[0];
						res = get_background(id, index['background'][id], (["common", "main", "event"].includes(tmp) ? tmp : ""));
					}
					break;
				}
				case GBFType.story:
					res = get_story(id, (id in index['story']) ? index['story'][id] : null);
					callback = add_text_image;
					break;
				case GBFType.fate:
					res = get_fate(id, (id in index['fate']) ? index['fate'][id] : null);
					callback = add_fate_image;
					break;
				case "subskills":
				{
					res = get_subskill(id.split(':')[1], index['subskills'][id.split(':')[1]]);
					break;
				}
				case "title":
				{
					res = get_title(id.split(':')[1], index['title'][id.split(':')[1]]);
					break;
				}
				case "sky_title":
				{
					res = get_sky_title(id.split(':')[1], index['title'][id.split(':')[1]]);
					break;
				}
				case "suptix":
				{
					res = get_suptix(id.split(':')[1], index['suptix'][id.split(':')[1]]);
					break;
				}
				case "mypage_bg":
				{
					res = get_mypage_bg(id.split(':')[1], index['mypage_bg'][id.split(':')[1]]);
					break;
				}
			};
			if(res != null)
			{
				for(let r of res)
				{
					if(r.unlisted ?? false)
						continue;
					r.id = gbf.get_prefix(type) + r.id; // update prefix
					callback(frag, r, onclick);
				}
			}
		} catch(err) {
			console.error("Exception thrown", err.stack);
		}
	}
}

function default_onerror()
{
	this.src= "../GBFML/assets/ui/no_asset.jpg";
	this.classList.remove("preview");
	this.classList.remove("preview-noborder");
}

function get_character(id, data, range, unused = null)
{
	let val = parseInt(id.slice(4, 7));
	switch(id[2])
	{
		case '4':
			if(val < range[4] || val >= range[5])
				return null;
			break;
		case '3':
			if(val < range[2] || val >= range[3])
				return null;
			break;
		case '2':
			if(val < range[0] || val >= range[1])
				return null;
			break;
		default:
			return null;
	}
	let uncap = 1;
	let uncap_string = "_01";
	if(data)
	{
		for(const f of data[5])
		{
			if(f.includes("_st")) continue;
			const u = parseInt(f.slice(11, 13));
			switch(u)
			{
				case 3: case 4: case 5: case 6:
					if(u > uncap || (uncap_string.length == 3 && f.length == 13))
					{
						uncap = u;
						uncap_string = f.slice(10);
					}
					break;
				default:
					break;
			}
		}
	}
	let onerr = null;
	if(uncap_string != "_01")
	{
		onerr = function() {
			if(uncap_string.includes("_f"))
			{
				this.src=gbf.id_to_endpoint(id) + "assets_en/img_low/sp/assets/npc/m/"+id+uncap_string.split("_f")[0]+".jpg";
				this.onerror=function(){this.src=gbf.id_to_endpoint(id) + "assets_en/img_low/sp/assets/npc/m/"+id+"_01.jpg"; this.onerror=default_onerror;};
			}
			else
			{
				this.src=gbf.id_to_endpoint(id) + "assets_en/img_low/sp/assets/npc/m/"+id+"_01.jpg";
				this.onerror=default_onerror;
			}
		};
	}
	else
	{
		onerr = default_onerror;
	}
	let path = "GBF/assets_en/img_low/sp/assets/npc/m/" + id + uncap_string + ".jpg";
	return [{id:id, path:path, onerr:onerr, class:"", link:false}];
}

function get_skin(id, data, range, unused = null)
{
	let val = parseInt(id.slice(4, 7));
	if(val < range[0] || val >= range[1])
		return null;
	let uncap = "_01";
	if(data)
	{
		for(const f of data[6])
			if(!f.includes("st") && f[11] != 8 && f.slice(11, 13) != "02" && (f[11] != 9 || (f[11] == 9 && !(["_03", "_04", "_05"].includes(uncap))))) uncap = f.slice(10);
	}
	let onerr = default_onerror;
	if(uncap != "_01")
	{
		onerr = function() {
			this.src=gbf.id_to_endpoint(id) + "assets_en/img_low/sp/assets/npc/m/"+id+"_01.jpg";
			this.onerror=default_onerror;
		};
	}
	let path = "GBF/assets_en/img_low/sp/assets/npc/m/" + id + uncap + ".jpg";
	return [{id:id, path:path, onerr:onerr, class:"", link:false}];
}

function get_partner(id, data, prefix, unused = null)
{
	if(id.slice(1, 3) != prefix)
		return null;
	let onerr = function() {
		this.src = gbf.id_to_endpoint(id) + "assets_en/img_low/sp/assets/npc/raid_normal/3999999999.jpg";
	};
	let path = null;
	if(data && data[5].length > 0)
	{
		let onerr;
		if(data[5].length > 1)
		{
			onerr = function() { // failsafe
				this.onerror = function() {
					this.src =  gbf.id_to_endpoint(id) + "assets_en/img_low/sp/assets/npc/raid_normal/3999999999.jpg";
				};
				this.src =  gbf.id_to_endpoint(id) + "assets_en/img_low/sp/assets/npc/raid_normal/" + data[5][1] + ".jpg";
			};
		}
		path =  "GBF/assets_en/img_low/sp/assets/npc/raid_normal/" + data[5][0] + ".jpg";
	}
	else
	{
		path =  "GBF/assets_en/img_low/sp/assets/npc/raid_normal/" + id + "_01.jpg";
	}
	return [{id:id, path:path, onerr:onerr, class:"preview", link:false}];
}

function get_summon(id, data, rarity, range)
{
	if(id[2] != rarity)
		return null;
	let val = parseInt(id.slice(4, 7));
	if(val < range[0] || val >= range[1])
		return null;
	let uncap = "";
	if(data)
	{
		for(const f of data[0])
			if(f.includes("_")) uncap = f.slice(10);
	}
	let onerr = default_onerror;
	if(uncap != "")
	{
		onerr = function() {
			this.src=gbf.id_to_endpoint(id) + "assets_en/img_low/sp/assets/summon/m/"+id+".jpg";
			this.onerror=default_onerror;
		};
	}
	let path = "GBF/assets_en/img_low/sp/assets/summon/m/" + id + uncap + ".jpg";
	return [{id:id, path:path, onerr:onerr, class:"", link:false}];
}

function get_weapon(id, data, rarity, proficiency)
{
	if(id[2] != rarity || id[4] != proficiency)
		return null;
	let uncap = "";
	if(data)
	{
		for(const f of data[0])
			if(f.includes("_")) uncap = f.slice(10);
	}
	let onerr = default_onerror;
	if(uncap != "")
	{
		onerr = function() {
			this.src=gbf.id_to_endpoint(id) + "assets_en/img_low/sp/assets/weapon/m/"+id+".jpg";
			this.onerror=default_onerror;
		};
	}
	let path = "GBF/assets_en/img_low/sp/assets/weapon/m/" + id + uncap + ".jpg";
	return [{id:id, path:path, onerr:onerr, class:"", link:false}];
}

function get_shield(id, data, rarity, unused = null)
{
	if(rarity != null && id[0] != rarity)
		return null;
	let path = "GBF/assets_en/img_low/sp/assets/shield/m/" + id + ".jpg";
	return [{id:id, path:path, onerr:default_onerror, class:"", link:false}];
}

function get_manatura(id, data, unusedA = null, unusedB = null)
{
	let path = "GBF/assets_en/img_low/sp/assets/familiar/m/" + parseInt(id) + ".jpg";
	return [{id:id, path:path, onerr:default_onerror, class:"", link:false}];
}

function get_job(id, data, unusedA = null, unusedB = null)
{
	return [{id:id, path:"GBF/assets_en/img_low/sp/assets/leader/m/" + id + "_01.jpg", onerr:default_onerror, class:"", link:false}];
}

function get_enemy(id, data, type, size)
{
	if(id[0] != type || id[1] != size)
		return null;
	return [{id:id, path:"GBF/assets_en/img/sp/assets/enemy/s/" + id + ".png", onerr:function() {
		this.src=gbf.id_to_endpoint(id) + "assets_en/img_low/sp/assets/enemy/m/"+id+".png";
		this.onerror=default_onerror;
	}, class:"preview", link:false}];
}

function get_npc(id, data, prefix, range)
{
	if(prefix != null && id.slice(1, 3) != prefix)
		return null;
	let val = parseInt(id.slice(3, 7));
	if(val < range[0] || val >= range[1])
		return null;
	let path = "";
	let className = "";
	if(data)
	{
		if(data[0])
		{
			path = "GBF/assets_en/img_low/sp/assets/npc/m/" + id + "_01.jpg";
		}
		else if(data[1].length > 0)
		{
			path = "GBF/assets_en/img_low/sp/quest/scene/character/body/" + id + data[1][0] + ".png";
			className = "preview";
		}
		else
		{
			path = "../GBFML/assets/ui/sound_only.png";
			className = "preview-noborder";
		}
	}
	else return null;
	let onerr = function()
	{
		this.src=this.src.replace("sp/quest/scene/character/body", "sp/raid/navi_face");
		this.onerror = default_onerror;
	};
	return [{id:id, path:path, onerr:onerr, class:className, link:false}];
}

function get_valentine(id, data = null, unusedA = null, unusedB = null)
{
	switch(id.slice(0, 3)) // we hook up to existing functions
	{
		case "304":
		case "302":
		case "303":
			return get_character(id, index["characters"][id], parseInt(id[2]), null);
		case "399":
		case "305":
			return get_npc(id, index["npcs"][id], parseInt(id.slice(1,3)), [0, 10000]);
		default:
			return null;
	}
}

function get_story(id, data, unusedA = null, unusedB = null)
{
	if(data[0].length == 0)
		return null;
	let recap = gbf.msq_recap_lookup(id);
	if(recap != null)
		return [{id:id, modifier:"scene", text:recap}];
	else
		return [{id:id, modifier:"scene", text:"Chapter " + parseInt(id)}];
}

function get_fate(id, data, prefix = null, linked = null)
{
	if(data[0].length + data[1].length + data[2].length + data[3].length == 0)
		return null;
	if((linked === true && (data[4] == null || !data[4].startsWith(prefix))) || (linked === false && data[4] != null))
		return null;
	if(data[4] != null) 
	{
		let ret = null;
		if(data[4].startsWith("30") && "characters" in index && data[4] in index["characters"])
			ret = get_character(data[4], index["characters"][data[4]], [0, 9999]);
		else if(data[4].startsWith("20") && "summons" in index && data[4] in index["summons"])
			ret = get_summon(data[4], index["summons"][data[4]], data[4][2], [0, 9999]);
		if(ret != null)
		{
			ret[0].path = ret[0].path.replace("GBF/", gbf.id_to_endpoint(ret[0].id)); // update url here
			ret[0].id = id; // set fate id
			return ret;
		}
	}
	return [{id:id, modifier:"scene", text:"Fate " + id}];
}

function get_event(id, data, idfilter = null, unusedB = null)
{
	if(!data)
		return null;
	if(idfilter != null)
	{
		if(idfilter == "" && !isNaN(id))
			return null;
		else if(!id.startsWith(idfilter))
			return null;
	}
	let has_file = false;
	let path = "";
	let className = "";
	for(let i = 2; i < data.length; ++i)
	{
		if(data[i].length > 0)
		{
			has_file = true;
			break;
		}
	}
	if(has_file)
	{
		if(index["events"][id][1] == null)
		{
			path = "assets/ui/event.png";
			className = "preview-noborder";
		}
		else
		{
			path = "GBF/assets_en/img_low/sp/archive/assets/island_m2/" + index["events"][id][1] + ".png";
			className = (data[data.length-1].length > 0 ? "preview sky-event":"preview");
		}
		return [{id:id, path:path, onerr:null, class:className, link:false}];
	}
	else return null;
}

function get_skill(id, data, range, unused = null)
{
	if(!data)
		return null;
	let val = parseInt(id);
	if(val < range[0] || val >= range[1])
		return null;
	return [{id:id, path:"GBF/assets_en/img_low/sp/ui/icon/ability/m/" + data[0][0] + ".png", onerr:null, class:"preview", link:false}];
}

function get_subskill(id, data, unusedA = null, unusedB = null)
{
	return [
		{id:id+"_1", path:"GBF/assets_en/img_low/sp/assets/item/ability/s/" + id + "_1.jpg", onerr:null, class:"preview", link:true},
		{id:id+"_2", path:"GBF/assets_en/img_low/sp/assets/item/ability/s/" + id + "_2.jpg", onerr:null, class:"preview", link:true},
		{id:id+"_3", path:"GBF/assets_en/img_low/sp/assets/item/ability/s/" + id + "_3.jpg", onerr:null, class:"preview", link:true},
		{id:id+"_4", path:"GBF/assets_en/img_low/sp/assets/item/ability/s/" + id + "_4.jpg", onerr:null, class:"preview", link:true}
	];
}

function get_buff(id, data, range, unused = null)
{
	if(!data)
		return null;
	let val = parseInt(id);
	if(val < range[0] || val >= range[1])
		return null;
	return [
		{
			id:id,
			path:"GBF/assets_en/img_low/sp/ui/icon/status/x64/status_" + data[0][0] + data[1][0] + ".png",
			onerr:null,
			class:"preview" + (data[1].length > 1 ? " more" : ""),
			link:false
		}
	];
}

function get_background(id, data, key, unused = null)
{
	if(!data)
		return null;
	let path = null;
	switch(id.split('_')[0])
	{
		case "common":
			if(key != "common")
				return null;
			path = ["sp/raid/bg/", ".jpg"];
			break;
		case "main":
			if(key != "main")
				return null;
			path = ["sp/guild/custom/bg/", ".png"];
			break;
		case "event":
			if(key != "event")
				return null;
			path = ["sp/raid/bg/", ".jpg"];
			break;
		default:
			if(key != "")
				return null;
			path = ["sp/raid/bg/", ".jpg"];
			break;
	}
	let ret = [];
	for(let i of data[0])
	{
		ret.push({id:i, path:"GBF/assets_en/img_low/" + path[0] + i + path[1], onerr:null, class:"preview", link:true});
	}
	return ret;
}

function get_title(id, data, unusedA = null, unusedB = null)
{
	return [{id:id, path:"GBF/assets_en/img_low/sp/top/bg/bg_" + id + ".jpg", onerr:null, class:"preview", link:true}];
}

function get_sky_title(id, data, unusedA = null, unusedB = null)
{
	return [{id:id, path:"https://media.skycompass.io/assets/archives/galleries/" + id + "/detail_s.png", onerr:null, class:"preview", link:true}];
}

function get_suptix(id, data, unusedA = null, unusedB = null)
{
	return [{id:id, path:"GBF/assets_en/img_low/sp/gacha/campaign/surprise/top_" + id + ".jpg", onerr:null, class:"preview", link:true}];
}

function get_mypage_bg(id, data, unusedA = null, unusedB = null)
{
	return [{id:id, path:"GBF/assets_en/img_low/sp/mypage/town/" + id + "/bg.jpg", onerr:null, class:"preview", link:true}];
}

// path must start with "GBF/" if it's not a local asset.
function add_index_image(node, data, onclick_callback)
{
	if(data.link) // two behavior based on link attribute
	{
		let a = add_to(node, "a");
		let img = add_to(a, "img", {
			cls: ["loading"],
			onload: function() {
				this.classList.remove("loading");
				this.classList.add(data.class);
				this.classList.add("link");
			},
			onerror: (data.onerr == null ?
				function() {
					this.parentNode.remove();
					this.remove();
				} :
				data.onerr
			),
			title: "Click to open: " + data.id
		});
		img.setAttribute('loading', 'lazy');
		img.src = data.path.replace("GBF/", gbf.id_to_endpoint(data.id));
		a.href = img.src.replace("img_low/", "img/");
		return img;
	}
	else
	{
		if(data.onclick ?? null) // override
			onclick_callback = data.onclick;
		let cls = data.class ? data.class.split(" ") : [];
		let img = add_to(node, "img", {
			cls: cls,
			onload: function() {
				this.classList.remove("loading");
				if(onclick_callback != null)
				this.classList.add("clickable");
				this.classList.add("index-image");
				this.onclick = onclick_callback;
			},
			onerror: (data.onerr == null ?
				function() {
					this.remove();
				} :
				data.onerr
			),
			title: data.id
		});
		img.classList.toggle("loading", true);
		img.setAttribute('loading', 'lazy');
		img.onclickid = data.id;
		img.src = data.path.replace("GBF/", gbf.id_to_endpoint(data.id));
		return img;
	}
}

function add_text_image(node, data, onclick)
{
	let elem = add_to(node, "div", {
		cls:[data.modifier, "preview-noborder", "clickable"],
		onclick:onclick,
		title:data.id,
		innertext:data.text
	});
	elem.onclickid = data.id;
	return elem;
}

function add_fate_image(node, data, onclick)
{
	if(data.path)
	{
		let img = add_index_image(node, data, onclick);
		img.classList.add("fate-image");
	}
	else
	{
		add_text_image(node, data, onclick);
	}
}

function build_header(node, {id, target, create_div = true, navigation = false, navigation_special_targets = [], lookup = false, related = false, link = false, extra_links = []}={})
{
	let name = "";
	switch(target)
	{
		case "characters":
		{
			name = "Character " + id;
			break;
		}
		case "skins":
		{
			name = "Skin " + id;
			break;
		}
		case "partners":
		{
			name = "Partner " + id;
			break;
		}
		case "summons":
		{
			name = "Summon " + id;
			break;
		}
		case "weapons":
		{
			name = "Weapon " + id;
			break;
		}
		case "npcs":
		{
			name = "NPC " + id;
			break;
		}
		case "enemies":
		{
			name = "Enemy " + id;
			break;
		}
		case "job":
		{
			name = "Main Character " + id;
			break;
		}
		case "shields":
		{
			name = "Shield " + id;
			break;
		}
		case "manaturas":
		{
			name = "Manatura " + id;
			break;
		}
		case "fate":
		{
			name = "Fate Episode " + id;
			break;
		}
		case "events":
		{
			name = "Event " + id;
			if(!isNaN(id))
				name += " (" + id.substring(0, 2) + "/" + id.substring(2, 4) + "/" + id.substring(4, 6) + ")";
			break;
		}
		case "story":
		{
			if(!isNaN(id) && parseInt(id) == 0)
			{
				name = "Main Story Prologue";
			}
			else
			{
				let recap = gbf.msq_recap_lookup(id);
				name = (recap != null) ?
					("Main Story " + recap) :
					("Main Story Chapter " + id);
			}
			break;
		}
		case "skills":
		{
			name = "Skill " + id;
			break;
		}
		case "buffs":
		{
			name = "Buff " + id;
			break;
		}
		default:
		{
			console.error("Unsupported " + target);
			return;
		}
	}
	let div = node;
	if(create_div)
	{
		div = add_to(
			node,
			"div",
			{
				cls:["container-header"]
			}
		)
	}
	add_to(div, "span", {
		cls:["header-block"],
		id:"container-header-element-name",
		innertext:name
	});
	list_elements(
		add_to(div, "span", {
			cls:["header-block"],
			id:"container-header-element-thumbnail"
		}),
		[[id, gbf.index_to_type(target)]],
		null
	);
	if(link)
	{
		add_links(div, id, extra_links);
	}
	if(navigation)
	{
		add_navigation(div, id, target, navigation_special_targets);
	}
	if(lookup)
	{
		add_lookup(div, id);
	}
	if(related)
	{
		add_related(div, id, target);
	}
	return div;
}

function add_links(node, id, extra_links)
{
	let block = add_to(node, "span", {
		cls:["header-block"],
		id:"container-header-element-links"
	});
	if("lookup" in index && id in index["lookup"] && index["lookup"][id].includes("@@"))
	{
		const wiki_path = index["lookup"][id].split("@@")[1].split(" ")[0];
		let a = add_to(block, "a", {title:"Wiki page for " + wiki_path.replaceAll("_", " ")});
		a.href = "https://gbf.wiki/" + wiki_path;
		let img = add_to(a, "img", {cls:["img-link"]});
		img.src = "../GBFML/assets/ui/icon/wiki.png";
	}
	else
	{
		let a = add_to(block, "a", {title:"Wiki search for " + id});
		a.href = "https://gbf.wiki/index.php?title=Special:Search&search=" + id;
		let img = add_to(a, "img", {cls:["img-link"]});
		img.src = "../GBFML/assets/ui/icon/wiki.png";
	}
	for(const [title, imgsrc, href] of extra_links)
	{
		let a = add_to(block, "a", {title:title});
		a.href = href;
		let img = add_to(a, "img", {cls:["img-link"]});
		img.src = imgsrc;
	}
}

function add_navigation(node, id, target, navigation_special_targets)
{
	if(target in index && id in index[target])
	{
		let is_special = navigation_special_targets.length > 0 && navigation_special_targets.includes(target);
		let keys = Object.keys(index[target]);
		if(keys.length > 0)
		{
			keys.sort();
			const c = keys.indexOf(id);
			let next = c;
			let previous = c;
			if(is_special)
			{
				// this mode lets us skip over empty elements
				if(typeof get_special_navigation_indexes !== "undefined")
				{
					let ret = get_special_navigation_indexes(id, target, c, keys);
					previous = ret[0];
					next = ret[1];
				}
				else
				{
					console.error("get_special_navigation_indexes is undefined");
					return;
				}
			}
			else
			{
				next = (c + 1) % keys.length;
				previous = (c + keys.length - 1) % keys.length;
			}
			if(next != c) // assume previous is too
			{
				let type = gbf.index_to_type(target);
				list_elements(
					add_to(node, "span", {
						cls:["navigate-element", "navigate-element-left"]
					}),
					[[keys[previous], type]],
					index_onclick
				);
				list_elements(
					add_to(node, "span", {
						cls:["navigate-element", "navigate-element-right"]
					}),
					[[keys[next], type]],
					index_onclick
				);
			}
		}
	}
}

function add_lookup(node, id)
{
	if("lookup" in index && id in index["lookup"] && index["lookup"][id].split(' ').length > 0)
	{
		let block = add_to(null, "span", {
			cls:["header-block"],
			id:"container-header-element-lookup"
		});
		let prev = null;
		let missing = false;
		for(const t of index["lookup"][id].split(' '))
		{
			if(t.substring(0, 2) == "@@" || t == "")
				continue;
			if(t == prev)
				continue; // avoid repetitions
			prev = t;
			let i = add_to(block, "i", {
				cls: ["tag", "clickable"],
				onclick: function() {
					if(window.event.ctrlKey)
					{
						let f = document.getElementById('filter');
						f.value = t + " " + f.value;
						lookup(f.value);
					}
					else
					{
						lookup(t);
					}
				}
			});
			switch(t)
			{
				case "ssr":
				case "sr":
				case "r":
				case "n":
				{
					i.innerText = t.toUpperCase();
					break;
				}
				default:
				{
					if(t == id && id != id)
						i.innerText = id;
					else if(t.length == 1)
						i.innerText = t.toUpperCase();
					else
						i.innerText = t.charAt(0).toUpperCase() + t.slice(1);
					break;
				}
			}
			switch(t.toLowerCase())
			{
				case "ssr": case "grand": case "providence": case "optimus": case "dynamis": case "archangel": case "opus": case "xeno": case "exo":
					i.classList.add("tag-gold");
					break;
				case "missing-help-wanted":
					missing = true;
					i.classList.add("tag-gold");
					break;
				case "sr": case "militis": case "voiced": case "voice-only":
					i.classList.add("tag-silver");
					break;
				case "r":
					i.classList.add("tag-bronze");
					break;
				case "n": case "gran": case "djeeta": case "null": case "unknown-element": case "unknown-boss":
					i.classList.add("tag-normal");
					break;
				case "fire": case "dragon-boss": case "elemental-boss": case "other-boss":
					i.classList.add("tag-fire");
					break;
				case "water": case "fish-boss": case "core-boss": case "aberration-boss":
					i.classList.add("tag-water");
					break;
				case "earth": case "beast-boss": case "golem-boss": case "machine-boss": case "goblin-boss":
					i.classList.add("tag-earth");
					break;
				case "wind": case "flying-boss": case "plant-boss": case "insect-boss": case "wyvern-boss":
					i.classList.add("tag-wind");
					break;
				case "light": case "people-boss": case "fairy-boss": case "primal-boss":
					i.classList.add("tag-light");
					break;
				case "dark": case "monster-boss": case "otherworld-boss": case "undead-boss": case "reptile-boss":
					i.classList.add("tag-dark");
					break;
				case "cut-content": case "trial":
					i.classList.add("tag-cut-content"); break;
				case "sabre": case "sword": case "spear": case "dagger": case "axe": case "staff": case "melee": case "gun": case "bow": case "harp": case "katana":
					i.classList.add("tag-weaptype");
					break;
				case "summer":
					i.classList.add("tag-series-summer");
					break;
				case "yukata":
					i.classList.add("tag-series-yukata");
					break;
				case "valentine":
					i.classList.add("tag-series-valentine");
					break;
				case "halloween":
					i.classList.add("tag-series-halloween");
					break;
				case "hoiday":
					i.classList.add("tag-series-hoiday");
					break;
				case "12generals":
					i.classList.add("tag-series-zodiac");
					break;
				case "fantasy":
					i.classList.add("tag-series-fantasy");
					break;
				case "collab":
					i.classList.add("tag-series-collab");
					break;
				case "eternals":
					i.classList.add("tag-series-eternal");
					break;
				case "evokers":
					i.classList.add("tag-series-evoker");
					break;
				case "4saints":
					i.classList.add("tag-series-saint");
					break;
				case "male":
					i.classList.add("tag-gender0");
					break;
				case "female":
					i.classList.add("tag-gender1");
					break;
				case "other":
					i.classList.add("tag-gender2");
					break;
				case "human":
					i.classList.add("tag-race0");
					break;
				case "draph":
					i.classList.add("tag-race1");
					break;
				case "erune":
					i.classList.add("tag-race2");
					break;
				case "harvin":
					i.classList.add("tag-race3");
					break;
				case "primal":
					i.classList.add("tag-race4");
					break;
				case "unknown":
					i.classList.add("tag-race5");
					break;
				case "balanced":
					i.classList.add("tag-type0");
					break;
				case "attack":
					i.classList.add("tag-type1");
					break;
				case "defense":
					i.classList.add("tag-type2");
					break;
				case "heal":
					i.classList.add("tag-type3");
					break;
				case "special":
					i.classList.add("tag-type4");
					break;
				default:
					break;
			}
			block.appendChild(i);
			block.appendChild(document.createTextNode(" ")); // to space
		}
		if(missing && help_form != null)
		{
			let a = document.createElement("a");
			a.href = help_form;
			a.innerHTML = "Submit name";
			block.appendChild(a);
		}
		if(block.childNodes.length > 0)
		{
			node.appendChild(block);
		}
	}
}

function add_related(node, id, target)
{
	let has_been_added = false;
	let block = add_to(null, "span", {
		cls:["header-block"],
		id:"container-header-element-related"
	});
	block.appendChild(document.createTextNode("Related"));
	switch(target)
	{
		case "partners":
		{
			let cid = "30" + id.slice(2);
			if("characters" in index && cid in index["characters"])
			{
				block.appendChild(document.createElement("br"));
				list_elements(block, [[cid, GBFType.character]], index_onclick);has_been_added = true;
			}
			break;
		}
		case "characters":
		{
			let added_line_break = false;
			// fate episode
			let fate_id = gbf.look_for_fate_episode_in_index(id);
			if(fate_id != null)
			{
				block.appendChild(document.createElement("br"));
				list_elements(block, [[fate_id, GBFType.fate]], index_onclick);
				has_been_added = true;
				added_line_break = true;
			}
			// partner
			let partner_id = "38" + id.slice(2);
			if("partners" in index && partner_id in index["partners"])
			{
				if(!added_line_break)
					block.appendChild(document.createElement("br"));
				list_elements(block, [[partner_id, GBFType.partner]], index_onclick);
				has_been_added = true;
				added_line_break = true;
			}
			// weapon
			if("premium" in index && id in index["premium"] && index["premium"][id] != null)
			{
				if(!added_line_break)
					block.appendChild(document.createElement("br"));
				list_elements(block, [[index["premium"][id], GBFType.weapon]], index_onclick);
				has_been_added = true;
			}
			break;
		}
		case "summons":
		{
			// fate episode
			let fate_id = gbf.look_for_fate_episode_in_index(id);
			if(fate_id != null)
			{
				block.appendChild(document.createElement("br"));
				list_elements(block, [[fate_id, GBFType.fate]], index_onclick);
				has_been_added = true;
			}
		}
		case "weapons":
		{
			// character
			if("premium" in index && id in index["premium"] && index["premium"][id] != null)
			{
				block.appendChild(document.createElement("br"));
				list_elements(block, [[index["premium"][id], GBFType.character]], index_onclick);
				has_been_added = true;
			}
		}
		case "fate":
		{
			if("fate" in index && id in index["fate"] && index["fate"][id] != 0 && index["fate"][id][4] != null)
			{
				let target_id = index["fate"][id][4];
				switch(target_id.substring(0, 2))
				{
					case "30":
					{
						block.appendChild(document.createElement("br"));
						list_elements(block, [[target_id, GBFType.character]], index_onclick);
						has_been_added = true;
						break;
					}
					case "20":
					{
						block.appendChild(document.createElement("br"));
						list_elements(block, [[target_id, GBFType.summon]], index_onclick);
						has_been_added = true;
						break;
					}
				}
			}
		}
	}
	if(has_been_added)
	{
		node.appendChild(block);
	}
}