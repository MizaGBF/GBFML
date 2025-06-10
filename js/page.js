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
		let retrieved = false;
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
			retrieved = true
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
				if(!retrieved)
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
		let fragment = document.createDocumentFragment();
		list_elements(fragment, bookmarks, bookmark_onclick);

		fragment.appendChild(document.createElement("br"));
		let div = document.createElement("div");
		div.classList.add("std-button-container");
		let btn = document.createElement("button");
		btn.className = "std-button";
		btn.innerHTML = "Clear";
		btn.onclick = clear_bookmark;
		div.appendChild(btn);
		btn = document.createElement("button");
		btn.className = "std-button";
		btn.innerHTML = "Export";
		btn.onclick = export_bookmark;
		div.appendChild(btn);
		btn = document.createElement("button");
		btn.className = "std-button";
		btn.innerHTML = "Import";
		btn.onclick = import_bookmark;
		div.appendChild(btn);
		fragment.appendChild(div);
		node.innerHTML = "";
		if(bookmarks.length == 0)
			node.appendChild(document.createTextNode("No bookmarked elements."));
		node.appendChild(fragment);
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
		let fragment = document.createDocumentFragment();
		list_elements(fragment, search_history.slice().reverse(), history_onclick);
		fragment.appendChild(document.createElement("br"));
		let div = document.createElement("div");
		div.classList.add("std-button-container");
		let btn = document.createElement("button");
		btn.innerHTML = "Clear";
		btn.className = "std-button";
		btn.onclick = clear_history;
		div.appendChild(btn);
		fragment.appendChild(div);
		node.innerHTML = "";
		node.appendChild(fragment);
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
	let type = target;
	switch(target)
	{
		case "characters":
			type = GBFType.character;
			callback = get_character;
			break;
		case "skins":
			type = GBFType.character;
			callback = get_skin;
			break;
		case "partners":
			type = GBFType.partner;
			callback = get_partner;
			break;
		case "summons":
			type = GBFType.summon;
			callback = get_summon;
			break;
		case "weapons":
			type = GBFType.weapon;
			callback = get_weapon;
			break;
		case "job":
			type = GBFType.job;
			callback = get_job;
			break;
		case "enemies":
			type = GBFType.enemy;
			callback = get_enemy;
			break;
		case "npcs":
			type = GBFType.npc;
			callback = get_npc;
			break;
		case "valentines":
			callback = get_valentine;
			break;
		case "story":
			type = GBFType.story;
			callback = get_story;
			image_callback = add_text_image;
			break;
		case "fate":
			type = GBFType.fate;
			callback = get_fate;
			image_callback = add_fate_image;
			break;
		case "events":
			type = GBFType.event;
			callback = get_event;
			break;
		case "skills":
			type = GBFType.skill;
			callback = get_skill;
			break;
		case "subskills":
			callback = get_subskill;
			break;
		case "buffs":
			type = GBFType.buff;
			callback = get_buff;
			break;
		case "background":
			type = GBFType.background;
			callback = get_background;
			break;
		case "title":
			callback = get_title;
			break;
		case "suptix":
			callback = get_suptix;
			break;
		case "mypage_bg":
			callback = get_mypage_bg;
			break;
		default:
			return;
	};
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
	let onerr = null;
	if(uncap != "_01")
		onerr = function() {this.src=gbf.id_to_endpoint(id) + "assets_en/img_low/sp/assets/npc/m/"+id+"_01.jpg"; this.onerror=default_onerror;};
	else
		onerr = default_onerror;
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
	let onerr = null;
	if(uncap != "")
		onerr = function() {this.src=gbf.id_to_endpoint(id) + "assets_en/img_low/sp/assets/summon/m/"+id+".jpg"; this.onerror=default_onerror;};
	else
		onerr = default_onerror;
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
	let onerr = null;
	if(uncap != "")
		onerr = function() {this.src=gbf.id_to_endpoint(id) + "assets_en/img_low/sp/assets/weapon/m/"+id+".jpg"; this.onerror=default_onerror;};
	else
		onerr = default_onerror;
	let path = "GBF/assets_en/img_low/sp/assets/weapon/m/" + id + uncap + ".jpg";
	return [{id:id, path:path, onerr:onerr, class:"", link:false}];
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

function get_suptix(id, data, unusedA = null, unusedB = null)
{
	return [{id:id, path:"GBF/assets_en/img_low/sp/gacha/campaign/surprise/top_" + id + ".jpg", onerr:null, class:"preview", link:true}];
}

function get_mypage_bg(id, data, unusedA = null, unusedB = null)
{
	return [{id:id, path:"GBF/assets_en/img_low/sp/mypage/town/" + id + "/bg.jpg", onerr:null, class:"preview", link:true}];
}

// path must start with "GBF/" if it's not a local asset.
function add_index_image(node, data, onclick)
{
	if(data.link) // two behavior based on link attribute
	{
		let a = document.createElement("a");
		let img = document.createElement("img");
		a.appendChild(img);
		node.appendChild(a);
		img.classList.add("loading");
		img.setAttribute('loading', 'lazy');
		img.onload = function() {
			this.classList.remove("loading");
			this.classList.add(data.class);
			this.classList.add("link");
		};
		if(data.onerr == null)
		{
			img.onerror = function() {
				this.parentNode.remove();
				this.remove();
			};
		}
		else img.onerror = data.onerr;
		img.src = data.path.replace("GBF/", gbf.id_to_endpoint(data.id));
		img.title = "Click to open: " + data.id;
		a.href = img.src.replace("img_low/", "img/");
		return img;
	}
	else
	{
		if(data.onclick ?? null)
			onclick = data.onclick;
		let img = document.createElement("img");
		node.appendChild(img);
		img.title = data.id;
		if(data.class)
			img.className = data.class;
		img.classList.add("loading");
		img.setAttribute('loading', 'lazy');
		if(data.onerr == null)
		{
			img.onerror = function() {
				this.remove();
			};
		}
		else img.onerror = data.onerr;
		img.onload = function() {
			this.classList.remove("loading");
			this.classList.add("clickable");
			this.classList.add("index-image");
			this.onclick = onclick;
		};
		img.onclickid = data.id;
		img.src = data.path.replace("GBF/", gbf.id_to_endpoint(data.id));
		return img;
	}
}

function add_text_image(node, data, onclick)
{
	let elem = document.createElement("div");
	elem.classList.add(data.modifier);
	elem.classList.add("preview-noborder");
	elem.classList.add("clickable");
	elem.onclick = onclick;
	elem.onclickid = data.id;
	elem.title = data.id;
	elem.appendChild(document.createTextNode(data.text));
	node.appendChild(elem);
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