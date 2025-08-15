/*jshint esversion: 11 */

// pretty much some sort of custom linked list to keep track of search results at each step
class SearchChain
{
	constructor(parent = null)
	{
		this.m_parent = parent;
		this.m_results = [];
		this.m_link_name = null;
		this.m_link = null;
	}
	
	clear()
	{
		this.m_results = [];
		this.m_link_name = null;
		this.m_link = null;
	}
	
	break_link()
	{
		this.m_link = null;
	}
	
	get_next_link()
	{
		return [this.m_results, this.m_link];
	}
	
	new_link(name, results)
	{
		this.m_results = results;
		this.m_link_name = name;
		this.m_link = new SearchChain(this);
		return this.m_link;
	}
	
	get_link(word)
	{
		if(word == this.m_link_name)
			return this.m_link;
		return null;
	}
}

class Search
{
	static c_special_words = new Set(["ssr", "sr", "r", "female", "male"]);
	static c_special_replace = Object.freeze({
		// eternals
		"uno":"anre",
		"song":"tweyen",
		"sorn":"tweyen",
		"sarasa":"threo",
		"quatre":"feower",
		"funf":"fif",
		"six":"seox",
		"siete":"seofon",
		"okto":"eahta",
		"nio":"niyon",
		"esser":"tien",
		// zodiacs
		"sheep":"anila",
		"monkey":"andira",
		"monki":"andira",
		"chicken":"mahira",
		"cock":"mahira",
		"dog":"vajra",
		"pig":"kumbhira",
		"boar":"kumbhira",
		"rat":"vikala",
		"ox":"catura",
		"cow":"catura",
		"tiger":"cidala",
		"bunny":"makura",
		"rabbit":"makura",
		"dragon":"payila",
		"snake":"indala",
		// some potatos
		"box":"charlotta",
		"toot":"mimlemel",
		"sleeptato":"estarriola",
		"moontato":"haaselia",
		"flaretato":"zahlhamelina",
		"corntato":"melissabelle",
		// random characters
		"cog":"cagliostro",
		"dokkan":"clarisse",
		"woofus":"cerberus",
		"birdman":"nezahualpilli",
		"gandalf":"aletheia",
		"jk":"rosetta",
		"女子高生":"rosetta",
		"nano":"lily",
		"shiro":"nicholas",
		"zako":"chichiri",
		"faa":"lucilius",
		"mt":"maria theresa",
		"gobu":"goblin mage",
		"oyoyo":"azrael and israfel",
		"lizard":"vyrn",
		"dao":"dark angel olivia",
		"yugu":"yggdrasil",
		"chev":"luminiera",
		"chevalier":"luminiera",
		"jannu":"jeanne d'arc",
		"sochie":"societte",
		"vampy":"vania",
		"zoi":"zooey",
		"bk":"black knight",
		"gk":"golden knight",
		"vk":"violet knight",
		"wk":"white knight",
		// convenience
		"sword":"sabre",
		"fist":"melee",
		"stick":"staff",
		"magna":"omega"
	});
	static c_special_filters = Object.freeze({
		/*"premium":"Gacha Only",*/ // disabled for now
		"reverse":"Reverse Order"
	});
	
	// utility function
	static element_list_equals(list_a, list_b)
	{
		if(list_a.length != list_b.length)
			return false;
		for(let i = 0; i < list_a.length; ++i)
		{
			if(list_a[i][0] != list_b[i][0] || list_a[i][1] != list_b[i][1])
			{
				return false;
			}
		}
		return true;
	}
	
	constructor(search_bar_node, search_result_node, storage_key, filters, allow_lookup)
	{
		this.m_allow_lookup = allow_lookup;
		// save custom filters
		this.m_filters = filters;
		// build reverse lookup
		this.m_reverse_lookup = {};
		if((index.lookup ?? null) != null)
		{
			for(const [key, value] of Object.entries(index.lookup))
			{
				if(!(value in this.m_reverse_lookup))
					this.m_reverse_lookup[value] = [];
				this.m_reverse_lookup[value].push(key);
			}
		}
		else
		{
			throw new Error("Can't initialize search, no lookup in the index.");
		}
		// search bar node
		this.m_search_bar = search_bar_node;
		if(this.m_search_bar != null)
		{
			this.m_search_bar.addEventListener('input', (event) => {
				this.set_timeout();
			});
		}
		// search area node
		this.m_search_area = search_result_node;
		document.addEventListener('search-update', (event) => {
			this.update_area();
		});
		// containers for search area child nodes
		this.m_control_header = null;
		this.m_control_results = null;
		// key for local storage access
		this.m_key = storage_key;
		// typing delay
		this.m_debounce_delay = 200;
		// typing timeout storage
		this.m_search_timeout = null;
		// search chain start
		this.m_search_chain = new SearchChain();
		// last search results
		this.m_last_search_words = null;
		this.m_last_elements = null;
		this.m_last_filtereds = null;
		// settings
		this.m_settings = {};
		// init settings
		for(const k of Object.keys(Search.c_special_filters))
		{
			this.m_settings[k] = false;
		}
		
		for(const k of Object.keys(filters))
		{
			if(k in this.m_settings)
			{
				throw new Error("Invalid search filter key " + k);
			}
			this.m_settings[k] = true;
		}
		// load from storage (if set)
		this.load_settings();
	}
	
	// load from local storage
	load_settings()
	{
		if(this.m_key == null)
			return;
		try
		{
			const data = localStorage.getItem(this.m_key);
			if(data != null)
			{
				for(const [key, value] of Object.entries(JSON.parse(data)))
				{
					if(key in this.m_settings)
					{
						this.m_settings[key] = value;
					}
				}
			}
		} catch(err) {
			console.error("Exception occured in Search.load_settings", err);
		}
	}
	
	// save to local storage
	save_settings()
	{
		if(this.m_key == null)
			return;
		try
		{
			localStorage.setItem(this.m_key, JSON.stringify(this.m_settings));
		} catch(err) {
			console.error("Exception occured in Search.save_settings", err);
		}
	}
	
	// default function to set the html
	populate_search_area()
	{
		const _search_ = this; // ref
		if(this.m_search_area)
		{
			this.m_search_area.innerHTML = "";
			// top part
			this.m_control_header = add_to(this.m_search_area, "span", {
				cls:["search-control"],
				id:"search-header"
			});
			// special filters
			let special_filters = add_to(this.m_search_area, "span", {
				cls:["search-control"],
				id:"search-controls"
			});
			for(const [key, name] of Object.entries(Search.c_special_filters))
			{
				let container = add_to(special_filters, "span", {
					cls:["search-checkbox-container"]
				});
				
				let input = add_to(container, "input", {
					cls:["checkbox"],
					onclick:function() {
						_search_.toggle_filter(key);
					}
				});
				input.type = "checkbox";
				input.name = name;
				input.checked = this.m_settings[key];
				
				let label = add_to(container, "label", {
					cls:["checkbox-label"],
					innertext:name
				});
				label.for = name;
			}
			// user filters
			let filters = add_to(this.m_search_area, "span", {
				cls:["search-control"],
				id:"search-controls"
			});
			if(this.m_filters == 0)
			{
				filters.style.display = "none";
			}
			else
			{
				for(const [key, [name, type]] of Object.entries(this.m_filters))
				{
					let container = add_to(filters, "span", {
						cls:["search-checkbox-container"]
					});
					
					let input = add_to(container, "input", {
						cls:["checkbox"],
						onclick:function() {
							_search_.toggle_filter(key);
						}
					});
					input.type = "checkbox";
					input.name = name;
					input.checked = this.m_settings[key];
					
					let label = add_to(container, "label", {
						cls:["checkbox-label"],
						innertext:name
					});
					label.for = name;
				}
			}
			// bottom part
			this.m_control_results = add_to(this.m_search_area, "span", {
				cls:["search-control-results"],
				id:"search-results"
			});
		}
	}
	
	toggle_filter(key)
	{
		this.m_settings[key] = !this.m_settings[key];
		this.save_settings();
		this.apply_filters();
	}
	
	// timeout used for typing rebound
	set_timeout()
	{
		if(this.m_search_timeout != null)
			clearTimeout(this.m_search_timeout);
		this.m_search_timeout = setTimeout(() => {
			this.update();
		}, this.m_debounce_delay);
	}
	
	// return result list
	get_results()
	{
		return this.m_last_elements;
	}
	
	// return result list with filters applied
	get_filtered_results()
	{
		return this.m_last_filtereds;
	}
	
	update()
	{
		if(typeof GBFType === "undefined")
		{
			console.error("'GBFType' not found. Make sure to add 'GBFML/js/gbf.js'.");
			return;
		}
		if(this.m_settings.premium && (index.premium ?? null) == null)
		{
			console.error("The index is lacking the premium table for this setting.");
			return;
		}
		// need at least two letters
		if(this.m_search_bar.value.trim().length <= 1)
		{
			if(this.m_search_area)
				this.m_search_area.style.display = "none";
			document.dispatchEvent(new Event("search-clear"));
			this.m_last_search_words = null;
			this.m_last_elements = null;
			this.m_last_filtereds = null;
			return;
		}
		let search_input = this.m_search_bar.value.trim().toLowerCase();
		// call lookup if set and defined
		if(
			this.m_allow_lookup &&
			(typeof lookup !== "undefined") &&
			lookup(search_input)
		)
		{
			if(this.m_search_area)
				this.m_search_area.style.display = "none";
			return;
		}
		// get list of each words
		let words = search_input.split(" ").filter(word => word !== "");
		// nothing to search
		if(words.length == 0)
		{
			if(this.m_search_area)
				this.m_search_area.style.display = "none";
			document.dispatchEvent(new Event("search-clear"));
			this.m_last_search_words = null;
			this.m_last_elements = null;
			this.m_last_filtereds = null;
			return;
		}
		// remove dupes
		words = [...new Set(words)];
		// check if already searched
		if(this.m_last_search_words == words)
		{
			if(this.m_search_area)
				this.m_search_area.style.display = "";
			return;
		}
		// generate search results
		let last_link = this.m_search_chain; // start of chain
		let narrow = null;
		let positives = [];
		for(let i = 0; i < words.length; ++i)
		{
			let link = last_link.get_link(words[i]); // get chain link for this word
			if(link != null) // doesn't exist
			{
				[positives, last_link] = last_link.get_next_link();
			}
			else
			{
				positives = [];
				let word = words[i];
				// is special word flag (R, SR, SSR...)
				let is_special = Search.c_special_words.has(word);
				// set replace word if it exists
				let replace_word = (word in Search.c_special_replace) ? Search.c_special_replace[word] : null;
				// loop over reverse lookup
				for(const search_string of Object.keys(this.m_reverse_lookup))
				{
					// if we have a previous data set, check if lookup search_string is inside
					if(narrow != null && !narrow.has(search_string))
						continue;
					// if special
					if(is_special)
					{
						// the word must match EXACTLY
						if(search_string.split(" ").includes(word))
							positives.push(search_string);
					}
					// else if it includes the word or the replacement (if set)
					else if(
						search_string.includes(word)
						|| (replace_word != null && search_string.includes(replace_word))
					)
					{
						positives.push(search_string);
					}
				}
				// if no results, we stop now
				if(positives.length == 0)
				{
					last_link.break_link();
					break;
				}
				// add new link to chain
				last_link = last_link.new_link(words[i], positives);
			}
			// update narrow with set of our results so far
			narrow = new Set(positives);
		}
		// we simply update m_last_elements
		this.m_last_search_words = words;
		let last_elements = [];
		for(const key of positives)
		{
			for(const id of this.m_reverse_lookup[key])
			{
				switch(id.length)
				{
					case 10:
					{
						switch(id.substring(0, 3))
						{
							case "399":
							case "305":
								last_elements.push([id, GBFType.npc]);
								break;
							case "389":
							case "388":
							case "384":
							case "383":
							case "382":
								last_elements.push([id, GBFType.partner]);
								break;
							case "371":
							case "304":
							case "303":
							case "302":
								last_elements.push([id, GBFType.character]);
								break;
							case "204":
							case "203":
							case "202":
							case "201":
								last_elements.push([id, GBFType.summon]);
								break;
							case "104":
							case "103":
							case "102":
							case "101":
								last_elements.push([id, GBFType.weapon]);
								break;
						}
						break;
					}
					case 7:
					{
						last_elements.push([id, GBFType.enemy]);
						break;
					}
					case 6:
					{
						last_elements.push([id, GBFType.job]);
						break;
					}
				}
			}
		}
		// if m_last_elements changed
		if(this.m_last_elements == null || !Search.element_list_equals(last_elements, this.m_last_elements))
		{
			// update
			this.m_last_elements = last_elements;
			// apply filters
			this.apply_filters();
		}
	}
	
	apply_filters()
	{
		let filtered = [];
		const is_premium = this.m_settings.premium && "premium" in index;
		const allowed_types = new Set();
		for(const [key, [name, type]] of Object.entries(this.m_filters))
		{
			if(this.m_settings[key])
				allowed_types.add(type);
		}
		let allowed_skin = allowed_types.has("skins");
		//const is_premium = this.m_settings.premium;
		for(const data of this.m_last_elements)
		{
			const element_id = data[0];
			let type = data[1];
			// special exceptions for character skins
			if(type == GBFType.character && element_id.startsWith("371"))
				type = "skins";
			if(is_premium && (!(element_id in index.premium) || index.premium[element_id] == null))
			{
				continue;
			}
			else if(allowed_types.has(type))
			{
				filtered.push(data);
			}
		}
		if(this.m_settings.reverse)
			filtered.reverse();
		if(this.m_last_filtereds == null || !Search.element_list_equals(filtered, this.m_last_filtereds))
		{
			this.m_last_filtereds = filtered;
			document.dispatchEvent(new Event("search-update"));
		}
	}
	
	update_area()
	{
		if(this.m_search_area)
		{
			if(this.m_last_filtereds == null || this.m_last_elements.length == 0)
			{
				// no search results
				this.m_search_area.children[0].innerText = "No results";
				this.m_search_area.children[3].innerHTML = "";
			}
			else
			{
				this.m_search_area.style.display = "";
				// at least one result
				// add number
				this.m_search_area.children[0].innerText = this.m_last_filtereds.length + " results";
				// add list
				const fragment = document.createDocumentFragment();
				list_elements(fragment, this.m_last_filtereds, index_onclick);
				interrupt_image_downloads(this.m_search_area.children[2]);
				// update next frame
				let _search_ = this;
				update_next_frame(function() {
					
					_search_.m_search_area.children[3].innerHTML = "";
					_search_.m_search_area.children[3].appendChild(fragment);
				});
			}
		}
	}
};