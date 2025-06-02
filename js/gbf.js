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
	fate: 12
});

class GBFElement
{
	constructor(id, type)
	{
		this.id = id;
		this.type = type;
		this.character_outfit = false;
		this.uncap = null;
		this.style = null;
	}
};

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
	get endpoints()
	{
		return GBF.c_endpoints;
	}
	
	// getter: return the list of eternal IDs
	get eternals()
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
		this.m_current_endpoint = (this.m_current_endpoint + 1) % this.endpoints.length;
		return this.endpoints[this.m_current_endpoint];
	}
	
	// get a random endpoint using an id as the seed
	id_to_endpoint(id)
	{
		return this.endpoints[parseInt(id.replace(/\D/g,'')) % this.endpoints.length];
	}
	
	remove_prefix(id, type)
	{
		if(type in this.m_reverse_lookup_prefix)
			return id.slice(this.m_reverse_lookup_prefix[type].length);
		return id;
	}
	
	/* 
		Take a string in entry and return an array of possible GBFType matching it.
		supports:
			character/skin (skin uses the character type)
			enemy
			event
			class (main ID)
			skill (zero padded to length 4)
			fate episode (zero padded to length 4)
			buff (zero padded to length 4)
		The check_prefix parameter is for internal use.
		this.lookup_prefix can be set to refine the search by setting prefixes.
		example: this.lookup_prefix = {"e":GBFType.enemy};
		If you pass "e100000" to the function, it will return [GBFType.enemy].
	*/
	lookup_string_to_element(string, check_prefix = true)
	{
		if(check_prefix)
		{
			for (const [prefix, type] of Object.entries(this.m_lookup_prefix))
			{
				if(string.startsWith(prefix))
				{
					let substring = string.substring(prefix.length);
					let possible_types = this.lookup_string_to_element(substring, false);
					if(possible_types.includes(type))
						return [type];
				}
			}
		}
		
		switch(string.length)
		{
			case 10:
			{
				if(!isNaN(string))
				{
					switch(string.slice(0, 3))
					{
						case "305":
						case "399":
							return [GBFType.npc];
						case "304":
						case "303":
						case "302":
						case "371":
							return [GBFType.character];
						case "384":
						case "383":
						case "382":
						case "388":
						case "389":
							return [GBFType.partner];
						case "290":
						case "204":
						case "203":
						case "202":
						case "201":
							return [GBFType.summon];
						case "104":
						case "103":
						case "102":
						case "101":
							return [GBFType.weapon];
						default:
							break;
					}
				};
				break;
			}
			case 7:
			{
				if(!isNaN(string))
					return [GBFType.enemy];
				break;
			}
			case 6:
			{
				if(check_prefix)
					return [GBFType.job];
				else
					return [GBFType.event, GBFType.job];
			}
			case 4:
			{
				if(check_prefix)
					return [];
				else
					return [GBFType.skill, GBFType.fate, GBFType.buff];
			}
			case 3:
			{
				return [GBFType.story];
			}
		};
		return [];
	}
	
	is_banned(id)
	{
		this.banned_ids.includes(id);
	}
	
	is_character_skin(id)
	{
		return id.startsWith("371");
	}
	
	msq_recap_lookup(id)
	{
		switch(id)
		{
			case "r00": return "Recap";
			case "r01": return "Recap 1-12";
			case "r02": return "Recap 13-28";
			case "r03": return "Recap 29-54";
			case "r04": return "Recap 55-63";
			case "r05": return "Recap 64-79";
			case "r06": return "Recap 80-89";
			case "r07": return "Recap 90-100";
			case "r08": return "Recap 101-114";
			case "r09": return "Recap 115-132";
			default: return null;
		};
	}
};