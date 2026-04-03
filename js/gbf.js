const GBFType = Object.freeze({
	unknown: -1,
	job: 0,
	weapon: 1,
	summon: 2,
	character: 3,
	enemy: 4,
	npc: 5,
	partner: 6,
	event: 7,
	skill: 8,
	buff: 9,
	background: 10,
	story0: 11,
	fate: 12,
	shield: 13,
	manatura: 14,
	story1: 15
});

class GBF
{
	static c_endpoint = (
		"https://prd-game-a-granbluefantasy.akamaized.net/"
	);
	static c_eternals = Object.freeze([
		"3040030000", "3040031000", "3040032000", "3040033000", "3040034000", "3040035000", "3040036000", "3040037000", "3040038000", "3040039000"
	]);
	static c_default_type_size = Object.freeze({
		10: [GBFType.weapon, GBFType.summon, GBFType.character, GBFType.partner, GBFType.npc],
		7: [GBFType.enemy],
		6: [GBFType.job, GBFType.event],
		4: [GBFType.skill, GBFType.buff, GBFType.fate],
		3: [GBFType.story0, GBFType.story1]
	});
	static c_special_tokens = new Set([
		"/a", "/b", "/c", "/e", "/f", "/k", "/m", "/n", "/p", "/s", "/t", "/w", "/x", "/y", "/_", "/!", "/!!", "/1", "/2", "/$", "/%"
	]);
	static c_name_word_regex = /\S+/g;
	
	constructor()
	{
		// list of id to ignore
		this.banned_ids = [];
		// lookup table of string prefixes and GBFType
		this.m_lookup_prefix = {};
		this.m_reverse_lookup_prefix = {};
	}
	
	// getter: return the endpoint
	endpoint()
	{
		return GBF.c_endpoint;
	}
	
	// getter: return the list of eternal IDs
	eternals()
	{
		return GBF.c_eternals;
	}
	
	// set m_lookup_prefix and its variants
	set_lookup_prefix(lookup_prefix)
	{
		this.m_lookup_prefix = lookup_prefix;
		this.m_reverse_lookup_prefix = swap(lookup_prefix);
	}
	
	// get associated prefix with type
	get_prefix(elem_type)
	{
		for(const [type, prefix] of Object.entries(this.m_reverse_lookup_prefix))
		{
			if(type == elem_type)
				return prefix;
		}
		return "";
	}
	
	remove_prefix(id, type)
	{
		if(type in this.m_reverse_lookup_prefix)
			return id.slice(this.m_reverse_lookup_prefix[type].length);
		return id;
	}
	
	/* 
		Take a string in entry and return the matching GBFType.
		supports:
			character/skin (skin uses the character type)
			enemy
			event
			class (main ID)
			skill (zero padded to length 4)
			fate episode (zero padded to length 4)
			buff (zero padded to length 4)
		example: this.lookup_prefix = {"e":GBFType.enemy};
		If you pass "e100000" to the function, it will return GBFType.enemy.
	*/
	lookup_string_to_element(string)
	{
		let ignore_prefix_types = Object.values(this.m_lookup_prefix);
		for(const [prefix, type] of Object.entries(this.m_lookup_prefix))
		{
			if(string.startsWith(prefix))
			{
				let is_valid = this.validate_lookup(string.substring(prefix.length), type);
				if(is_valid)
					return type;
				else;
					return GBFType.unknown;
			}
		}
		
		for(const [size, possibles] of Object.entries(GBF.c_default_type_size))
		{
			if(string.length == size)
			{
				for(const possible of possibles)
				{
					if(!ignore_prefix_types.includes(possible))
					{
						let is_valid = this.validate_lookup(string, possible);
						if(is_valid)
							return possible;
					}
				}
			}
		}
		return GBFType.unknown;
	}
	
	validate_lookup(string, type)
	{
		switch(type)
		{
			case GBFType.character:
				return (string.length == 10 && ["304", "303", "302", "371"].some(word => string.startsWith(word)) && !isNaN(string));
			case GBFType.npc:
				return (string.length == 10 && ["305", "399"].some(word => string.startsWith(word)) && !isNaN(string));
			case GBFType.partner:
				return (string.length == 10 && ["384", "383", "382", "388", "389"].some(word => string.startsWith(word)) && !isNaN(string));
			case GBFType.summon:
				return (string.length == 10 && ["204", "203", "202", "201", "290"].some(word => string.startsWith(word)) && !isNaN(string));
			case GBFType.weapon:
				return (string.length == 10 && ["104", "103", "102", "101"].some(word => string.startsWith(word)) && !isNaN(string));
			case GBFType.enemy:
				return (string.length == 7 && !isNaN(string));
			case GBFType.job:
				return (string.length == 6 && !isNaN(string));
			case GBFType.event:
				return (string.length == 6 && !isNaN(string));
			case GBFType.shield:
			case GBFType.manatura:
			case GBFType.skill:
			case GBFType.buff:
			case GBFType.fate:
				return (string.length == 4 && !isNaN(string));
			case GBFType.story0:
			case GBFType.story1:
				return (string.length == 3 && (!isNaN(string) || ((string.startsWith("r") || string.startsWith("c")) && !isNaN(string.substring(1)))));
			default:
				return false;
		}
	}
	
	is_banned(id)
	{
		this.banned_ids.includes(id);
	}
	
	is_character_skin(id)
	{
		return id.startsWith("371");
	}
	
	msq_lookup(id)
	{
		switch(id)
		{
			case "r01": return "Recap 1-12";
			case "r02": return "Recap 13-28";
			case "r03": return "Recap 29-54";
			case "r04": return "Recap 55-63";
			case "r05": return "Recap 64-79";
			case "r06": return "Recap 80-89";
			case "r07": return "Recap 90-100";
			case "r08": return "Recap 101-114";
			case "r09": return "Recap 115-132";
			case "r10": return "Recap 133-155";
			case "000": return "Prologue";
			default:
			{
				if(id.startsWith('r'))
					return "Recap.";
				else if(id.startsWith('c'))
					return "Compil. " + parseInt(id.slice(1));
				else
					return null;
			}
		};
	}
	
	type_to_index(type)
	{
		switch(type)
		{
			case GBFType.job:
				return "job";
			case GBFType.weapon:
				return "weapons";
			case GBFType.summon:
				return "summons";
			case GBFType.character:
				return "characters";
			case GBFType.enemy:
				return "enemies";
			case GBFType.npc:
				return "npcs";
			case GBFType.partner:
				return "partners";
			case GBFType.event:
				return "events";
			case GBFType.skill:
				return "skills";
			case GBFType.buff:
				return "buffs";
			case GBFType.background:
				return "background";
			case GBFType.story0:
				return "story0";
			case GBFType.story1:
				return "story1";
			case GBFType.fate:
				return "fate";
			case GBFType.shield:
				return "shields";
			case GBFType.manatura:
				return "manaturas";
			default:
				return null;
		}
	}
	
	index_to_type(index)
	{
		switch(index)
		{
			case "job":
				return GBFType.job;
			case "weapons":
				return GBFType.weapon;
			case "summons":
				return GBFType.summon;
			case "characters":
			case "skins":
				return GBFType.character;
			case "enemies":
				return GBFType.enemy;
			case "npcs":
				return GBFType.npc;
			case "partners":
				return GBFType.partner;
			case "events":
				return GBFType.event;
			case "skills":
				return GBFType.skill;
			case "buffs":
				return GBFType.buff;
			case "background":
				return GBFType.background;
			case "story0":
				return GBFType.story0;
			case "story1":
				return GBFType.story1;
			case "fate":
				return GBFType.fate;
			case "shields":
				return GBFType.shield;
			case "manaturas":
				return GBFType.manatura;
			default:
				return null;
		}
	}
	
	look_for_fate_episode_in_index(id, allow_empty = false)
	{
		if(typeof index !== "undefined" && "fate" in index)
		{
			for(const [key, val] of Object.entries(index["fate"]))
			{
				// GBFAL fate store character id in index 4
				if(val.length > 4 && val[4] == id)
				{
					// make sure data structure isn't empty
					if(allow_empty || (val[0].length+val[1].length+val[2].length+val[3].length) > 0)
					{
						return key
					}
					else
					{
						return null;
					}
				}
			}
		}
		return null;
	}
	
	// for internal use
	_get_single_lookup_name(lookup_string, allow_wiki=true)
	{
		let wiki = [];
		let name = [];
		let last_token = null;
		// reset the regex position since we are using the 'g' flag globally
		GBF.c_name_word_regex.lastIndex = 0;

		let match;
		while((match = GBF.c_name_word_regex.exec(lookup_string)) !== null)
		{
			const token = match[0];
			if(GBF.c_special_tokens.has(token))
			{
				last_token = token;
				// Optimization: If we already have both name and wiki, we can stop parsing.
				if (wiki.length > 0 && name.length > 0)
					break;
			}
			else
			{
				if(last_token === "/w")
				{
					wiki.push(token);
				}
				else if(last_token === "/n")
				{
					name.push(token);
				}
			}
		}
		if(allow_wiki && wiki.length > 0)
		{
			return wiki.join(" ").replace("_", " ");
		}
		else if(name.length > 0)
		{
			return name.join(" ");
		}
		return null;
	}
	
	get_lookup_names(id, allow_wiki=true)
	{
		if(typeof index === "undefined" || !("lookup" in index) || !(id in index.lookup))
			return [id];
		const ret = [];
		for(const string of index.lookup[id].split("/%"))
		{
			const result = this._get_single_lookup_name(string, allow_wiki);
			if(result != null)
			{
				ret.push(result);
			}
		}
		return (
			ret.length > 0
			? ret
			: [id]
		);
	}
	
	get_npc_relation(id)
	{
		if(typeof index === "undefined" || !("lookup" in index) || !(id in index.lookup))
			return "";
		const lookup_string = index.lookup[id];
		let tokens = lookup_string.split(" ");
		let relation = [];
		let state = false;
		for(let i = 0; i < tokens.length; ++i)
		{
			if(state)
			{
				if(GBF.c_special_tokens.has(tokens[i]))
				{
					break
				}
				else
				{
					relation.push(tokens[i])
				}
			}
			else
			{
				if(tokens[i] == "/x")
				{
					state = true
				}
			}
		}
		return relation.join(" ");
	}
};