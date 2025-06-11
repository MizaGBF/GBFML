/*jshint esversion: 11 */

var beep_audio = new Audio("../GBFML/assets/audio/beep.ogg"); // play GBF beep
var beep_enabled = true;
var typing_timer; // typing timer timeout
var typing_update = 100;

async function fetchJSON(url) { // generic function to request a JSON file.
	try
	{
		const response = await fetch(url);
		if (!response.ok)
		{
			throw new Error(`Error HTTP ${response.status}`);
		}
		return await response.json();
	} catch (err) {
		console.error(`Fetch of ${url} failed:`, err);
		return null;
	}
}

function nested_array_are_equal(A, B)
{
	if(A.length != B.length)
		return false;
	for(let i = 0; i < A.length; ++i)
	{
		if(A[i].length != B[i].length)
			return false;
		for(let j = 0; j < A[i].length; ++j)
		{
			if(A[i][j] != B[i][j])
				return false;
		}
	}
	return true;
}

function swap(json)  // swap keys and values from an object
{
	var ret = {};
	for(var key in json)
	{
		ret[json[key]] = key;
	}
	return ret;
}

function push_popup(string) // display a popup on the top left corner
{
	let div = document.createElement('div');
	div.className = 'popup';
	div.textContent = string;
	document.body.appendChild(div);
	setTimeout(remove_popup, 2500, div);
}

function remove_popup(popup) // remove a popup
{
	popup.parentNode.removeChild(popup);
}

function get_url_params() // retrieve url parameters
{
	return new URLSearchParams(window.location.search);
}

function update_query(id) // update url parameters
{
	let params = new URLSearchParams(window.location.search);
	params.set("id", id);
	if('?' + params.toString() != window.location.search)
	{
		history.pushState(null, '', window.location.pathname + '?' + params.toString());
	}
}

function beep() // play a sound effect
{
	if(beep_enabled)
	{
		if(!beep_audio.paused)
			return;
		beep_audio.play();
	}
}

function toggle_beep()
{
	beep_enabled = !beep_enabled;
	return beep_enabled;
}

function sound_sort(a, b) // used to sort some sound file suffixes
{
	const A = a.split('_');
	const B = b.split('_');
	const l = Math.max(A.length, B.length);
	// uncap
	let lvlA = 1;
	if(["02", "03", "04"].includes(A[1]))
	{
		lvlA = parseInt(A[1]);
	}
	let lvlB = 1;
	if(["02", "03", "04"].includes(B[1]))
	{
		lvlB = parseInt(B[1]);
	}
	if(lvlA < lvlB) return -1;
	else if(lvlA > lvlB) return 1;
	// string cmp
	for(let i = 0; i < l; ++i)
	{
		if(i >= A.length) return -1;
		else if(i >= B.length) return 1;
		
		if(A[i] < B[i])
		{
			if(A[i].length > B[i].length) return 1;
			return -1;
		}
		else if(A[i] > B[i])
		{
			if(A[i].length < B[i].length) return -1;
			return 1;
		}
	}
	return 0;
}

function typying() // clear timeout when typying (onkeydown event)
{
	clearTimeout(typing_timer);
}

// add element to another element
function add_to(node, tagName, {cls = [], id = null, title = null, innertext = null, innerhtml = null, onload = null, onclick = null, onerror = null, disabled = false, br = false}={})
{
	let tag = document.createElement(tagName);
	for(let i = 0; i < cls.length; ++i)
		tag.classList.add(cls[i]);
	if(title) tag.title = title;
	if(innertext) tag.innerText = innertext;
	if(innerhtml) tag.innerHTML = innerhtml;
	if(id) tag.id = id;
	if(onload) tag.onload = onload;
	if(onclick) tag.onclick = onclick;
	if(onerror) tag.onerror = onerror;
	if(disabled) tag.disabled = true;
	if(node) node.appendChild(tag);
	if(br) node.appendChild(document.createElement("br"));
	return tag;
}

function update_next_frame(callback)
{
	requestAnimationFrame(() => {
		callback();
	});
}