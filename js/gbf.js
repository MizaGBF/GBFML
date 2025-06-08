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
			case GBFType.skill:
			case GBFType.buff:
			case GBFType.fate:
				return (string.length == 4 && !isNaN(string));
			case GBFType.story:
				return (string.length == 3 && (!isNaN(string) || (string.startsWith("r") && !isNaN(string.substring(1)))));
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