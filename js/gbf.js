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
	story: 11,
	fate: 12,
	shield: 13,
	manatura: 14,
});

class GBF
{
	static c_endpoints = Object.freeze([
		"https://prd-game-a-granbluefantasy.akamaized.net/",
		"https://prd-game-a1-granbluefantasy.akamaized.net/",
		"https://prd-game-a2-granbluefantasy.akamaized.net/",
		"https://prd-game-a3-granbluefantasy.akamaized.net/",
		"https://prd-game-a4-granbluefantasy.akamaized.net/",
		"https://prd-game-a5-granbluefantasy.akamaized.net/"
	]);
	static c_eternals = Object.freeze([
		"3040030000", "3040031000", "3040032000", "3040033000", "3040034000", "3040035000", "3040036000", "3040037000", "3040038000", "3040039000"
	]);
	static c_default_type_size = Object.freeze({
		10: [GBFType.weapon, GBFType.summon, GBFType.character, GBFType.partner, GBFType.npc],
		7: [GBFType.enemy],
		6: [GBFType.job, GBFType.event],
		4: [GBFType.skill, GBFType.buff, GBFType.fate],
		3: [GBFType.story]
	});
	
	constructor()
	{
		this.m_current_endpoint = -1;
		// list of id to ignore
		this.banned_ids = [];
		// lookup table of string prefixes and GBFType
		this.m_lookup_prefix = {};
		this.m_reverse_lookup_prefix = {};
	}
	
	// getter: return the list of endpoints
	endpoints()
	{
		return GBF.c_endpoints;
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
	
	reset_endpoint()
	{
		this.m_current_endpoint = -1;
	}
	
	// return the next endpoint
	get_endpoint()
	{
		this.m_current_endpoint = (this.m_current_endpoint + 1) % GBF.c_endpoints.length;
		return GBF.c_endpoints[this.m_current_endpoint];
	}
	
	// get a random endpoint using an id as the seed
	id_to_endpoint(id)
	{
		return GBF.c_endpoints[parseInt(id.replace(/\D/g,'')) % GBF.c_endpoints.length];
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
			case GBFType.story:
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
			case "191": return "Ending I";
			case "000": return "Prologue";
			default:
			{
				if(id.startsWith('r'))
					return "Recap";
				else if(id.startsWith('c'))
					return "Compilation " + parseInt(id.slice(1));
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
			case GBFType.story:
				return "story";
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
			case "story":
				return GBFType.story;
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
	
	lookup_word_is_part_of_name(word)
	{
		return !(["human", "harvin", "erune", "draph", "primal", "unknown", "male", "female", "other", "summer", "yukata", "valentine", "halloween", "holiday", "12generals", "grand", "fantasy", "collab", "eternals", "evokers", "4saints", "tie-in", "formal", "voiced", "voice-only", "gbf-versus-rising", "gbf-relink"].includes(word) || word.endsWith("-boss"));
	}
	
	lookup_word_is_japanese(word)
	{
		return (word.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/) != null)
	}
	
	get_lookup_name(id)
	{
		if(typeof index !== "undefined" && "lookup" in index && id in index.lookup)
		{
			let words = index.lookup[id].split(" ");
			let i = 0;
			if(words.includes("missing-help-wanted"))
			{
				return id;
			}
			else if(words[0].startsWith("@@"))
			{
				return words[0].substring(2).replaceAll("_", " ").split("(")[0].trim();
			}
			while(i < words.length)
			{
				if(i == 0)
				{
					if(words[i].startsWith("@@") || ["sabre", "spear", "dagger", "axe", "gun", "bow", "melee", "harp", "katana", "staff", "fire", "water", "earth", "wind", "light", "dark", "r", "sr", "ssr", "cut-content"].includes(words[i]))
					{
						words.shift();
					}
					else
					{
						words[i] = capitalize(words[i]);
						++i;
					}
				}
				else if(this.lookup_word_is_japanese(words[i]))
				{
					words = words.splice(0, i);
				}
				else if(!this.lookup_word_is_part_of_name(words[i]))
				{
					if(i == words.length - 1 || !this.lookup_word_is_part_of_name(words[i+1]) || this.lookup_word_is_japanese(words[i+1]))
					{
						words = words.splice(0, i);
					}
					else
					{
						words[i] = capitalize(words[i]);
						++i;
					}
				}
				else
				{
					words[i] = capitalize(words[i]);
					++i
				}
			}
			if(words.length == 0)
				return id;
			else
				return words.join(" ").trim();
		}
		else return id;
	}
	
	starts_with_name_relation(str)
	{
		for(const prefix of ["father", "mother", "sister", "brother", "youngest", "older", "middle", "grandfather", "grandmother", "aunt", "uncle", "dog", "cat", "pet", "familiar", "hounds", "stuffed toy", "space ship", "guide", "maid", "servant", "gearcycle", "glasses"])
		{
			if(str.startsWith(prefix))
			{
				return [true, prefix];
			}
		}
		return [false, ""];
	}
	
	get_npc_name_relation(name)
	{
		const parts = name.split("'s ");
		if(parts.length == 2)
		{
			const [valid, prefix] = this.starts_with_name_relation(parts[1].toLowerCase());
			if(valid)
			{
				parts[1] = parts[1].slice(prefix.length + 1);
				return parts;
			}
		}
		return [name, ""];
	}
};