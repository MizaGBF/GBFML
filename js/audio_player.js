class AudioBasePlayer
{
	constructor(node, tracks)
	{
		this.list = tracks;
		this.player = new Audio();
		this.player.preload = "none";
		this.player.loop = false;
		
		this.player.addEventListener('loadedmetadata', this.update_audio_duration.bind(this));
		this.player.addEventListener('timeupdate', this.update_audio_time.bind(this));
		
		// main node
		this.container = add_to(node, "div", {
			cls:["audio-container"]
		});
		// playing header
		this.playing = add_to(this.container, "div", {
			cls:["audio-inner-container", "audio-header"],
			innertext:"None playing"
		});
		
		// custom player
		this.custom_player = add_to(this.container, "div", {
			cls:["audio-player"]
		});
		// play button
		this.play_button = add_to(this.custom_player, "button", {
			cls:["audio-player-button"],
			onclick:this.audio_play_button.bind(this)
		});
		this.play_button.disabled = true;
		// player current time
		this.seek_time = add_to(this.custom_player, "span", {
			cls:["audio-player-value"],
			innertext:"00:00"
		});
		// seek slider
		this.seek_slider = add_to(this.custom_player, "input", {
			cls:["audio-player-slider"]
		});
		this.seek_slider.type = "range";
		this.seek_slider.min = "0";
		this.seek_slider.max = "100";
		this.seek_slider.value = "0";
		this.seek_slider.onmouseup = this.set_audio_current_time.bind(this);
		this.seek_slider.ontouchend = this.set_audio_current_time.bind(this);
		// audio duration
		this.duration = add_to(this.custom_player, "span", {
			cls:["audio-player-value"],
			innertext:"00:00"
		});
		// special element for a line break
		add_to(this.custom_player, "div", {
			cls:["audio-player-break"]
		});
		// audio volume
		this.volume = add_to(this.custom_player, "span", {
			cls:["audio-player-value"],
			innertext:"100%"
		});
		// volume slider
		this.volume_slider = add_to(this.custom_player, "input", {
			cls:["audio-player-slider"]
		});
		this.volume_slider.type = "range";
		this.volume_slider.min = "0";
		this.volume_slider.max = "100";
		this.volume_slider.value = "100";
		this.volume_slider.onmouseup = this.set_audio_volume.bind(this);
		this.volume_slider.ontouchend = this.set_audio_volume.bind(this);
		
		// category select
		let track_select_container = add_to(this.container, "div", {
			cls:["audio-inner-container"]
		});
		let label = add_to(track_select_container, "label", {cls:["audio-label"]});
		label.htmlFor = "audio-category";
		label.innerText = "Category";
		this.category = add_to(track_select_container, "select", {
			cls:["audio-select"],
			id:"audio-category"
		});
		let set_default = false;
		for(const category of Object.keys(this.list))
		{
			let option = add_to(this.category, "option");
			option.value = category;
			option.innerText = category;
			if(!set_default)
			{
				set_default = true;
				option.selected = true;
			}
		}
		this.category.onchange = () => {
			this.update_audio_tracks();
		};
		
		// track select
		track_select_container = add_to(this.container, "div", {
			cls:["audio-inner-container"]
		});
		label = add_to(track_select_container, "label", {cls:["audio-label"]});
		label.htmlFor = "audio-track";
		label.innerText = "Track";
		this.track = add_to(track_select_container, "select", {
			cls:["audio-select"],
			id:"audio-track"
		});
		
		// buttons
		track_select_container = add_to(this.container, "div", {
			cls:["audio-inner-container"]
		});
		add_to(track_select_container, "button", {
			cls:["audio-button"],
			innertext:"Set & Play",
			onclick:this.set_and_play_audio.bind(this)
		});
		add_to(track_select_container, "button", {
			cls:["audio-button"],
			innertext:"Open in a Tab",
			onclick:this.open_audio.bind(this)
		});
	}

	audio_play_button()
	{
		if(this.player.src != "")
		{
			if(this.player.paused)
			{
				if(this.player.currentTime >= this.player.duration)
				{
					this.player.currentTime = 0;
				}
				this.player.play();
				this.play_button.classList.toggle("audio-player-button-paused", false);
			}
			else
			{
				this.player.pause();
				this.play_button.classList.toggle("audio-player-button-paused", true);
			}
		}
	}

	set_audio_current_time()
	{
		this.player.currentTime = parseInt(this.seek_slider.value) / 1000.0;
		this.seek_time.innerText = this.format_duration(this.player.currentTime);
	}

	set_audio_volume()
	{
		this.volume.innerText = this.volume_slider.value + "%";
		this.player.volume = parseInt(this.volume_slider.value) / 100.0;
	}

	format_duration(d)
	{
		if(isNaN(d))
		{
			return "00:00";
		}
		else
		{
			return ("" + Math.floor(d / 60)).padStart(2, "0") + ":" + ("" + Math.floor(d % 60)).padStart(2, "0");
		}
	}

	update_audio_duration()
	{
		this.duration.innerText = this.format_duration(this.player.duration);
		this.seek_slider.max = "" + this.player.duration * 1000;
		this.seek_slider.value = "0";
	}

	update_audio_time()
	{
		this.seek_time.innerText = this.format_duration(this.player.currentTime);
		this.seek_slider.value = "" + this.player.currentTime * 1000;
		if(this.player.currentTime >= this.player.duration)
			this.play_button.classList.toggle("audio-player-button-paused", true);
	}

	set_and_play_audio()
	{
		throw new Error("Not implemented");
	}

	open_audio()
	{
		throw new Error("Not implemented");
	}

	update_audio_tracks()
	{
		let set_default = false;
		this.track.innerHTML = "";
		for(const track of this.list[this.category.value])
		{
			let option = add_to(this.track, "option");
			option.value = track;
			option.innerText = this.format_sound_suffix(track);
			if(!set_default)
			{
				set_default = true;
				option.selected = true;
			}
		}
	}
	
	format_sound_suffix(s)
	{
		throw new Error("Not implemented");
	}
}

class AudioVoicePlayer extends AudioBasePlayer
{
	constructor(node, id, tracks)
	{
		super(node, tracks);
		this.id = id;
		this.update_audio_tracks();
	}
	
	set_and_play_audio()
	{
		let src = "https://prd-game-a5-granbluefantasy.akamaized.net/assets_en/sound/voice/" + this.id + this.track.value + ".mp3";
		if(this.player.src == src)
		{
			this.player.pause();
			this.player.currentTime = 0;
			this.player.play();
		}
		else
		{
			this.playing.innerText = "Playing: " + this.format_sound_suffix(this.track.value);
			this.player.pause();
			this.player.src = src;
			this.player.play();
		}
		this.play_button.disabled = false;
		this.play_button.classList.toggle("audio-player-button-paused", false);
	}

	open_audio()
	{
		let a = document.createElement("a");
		a.setAttribute('href', "https://prd-game-a5-granbluefantasy.akamaized.net/assets_en/sound/voice/" + this.id + this.track.value + ".mp3");
		a.target = "_blank";
		a.rel = "noopener noreferrer";
		a.click();
	}

	format_sound_suffix(s)
	{
		if(s[0] == '_')
			s = s.substring(1);
		switch(s.substring(0, 3))
		{
			case "02_":
				s = "4★_" + s.substring(3);
				break;
			case "03_":
				s = "5★_" + s.substring(3);
				break;
			case "04_":
				s = "6★_" + s.substring(3);
				break;
			case "05_":
				s = "7★_" + s.substring(3);
				break;
			default:
				s = "0★_" + s;
				break;
		}
		s = s.split('_');
		let isCB = false;
		for(let i = 0; i < s.length; ++i)
		{
			switch(s[i])
			{
				case "chain1":
				{
					s[i] = "Fire CB";
					isCB = true;
					break;
				}
				case "chain2":
				{
					s[i] = "Water CB";
					isCB = true;
					break;
				}
				case "chain3":
				{
					s[i] = "Earth CB";
					isCB = true;
					break;
				}
				case "chain4":
				{
					s[i] = "Wind CB";
					isCB = true;
					break;
				}
				case "chain5":
				{
					s[i] = "Light CB";
					isCB = true;
					break;
				}
				case "chain6":
				{
					s[i] = "Dark CB";
					isCB = true;
					break;
				}
				case "s1":
				{
					s[i] = "Scene 1";
					break;
				}
				case "s2":
				{
					s[i] = "Scene 2";
					break;
				}
				case "s3":
				{
					s[i] = "Scene 3";
					break;
				}
				case "s4":
				{
					s[i] = "Scene 4";
					break;
				}
				case "s5":
				{
					s[i] = "Scene 5";
					break;
				}
				case "s6":
				{
					s[i] = "Scene 6";
					break;
				}
				default:
				{
					if(isCB)
						s[i] = s[i] + " chains";
					break;
				}
			}
			// capitalize
			s[i] = s[i].charAt(0).toUpperCase() + s[i].slice(1);
		}
		return s.join(" ");
	}
}

class AudioJukeboxPlayer extends AudioBasePlayer
{
	constructor(node, jukebox_data)
	{
		let tracks = {};
		let jukebox = {};
		for(const data of jukebox_data)
		{
			let title = data.title;
			let count = 2;
			while(title in tracks)
			{
				title = data.title + " " + count;
				++count;
			}
			tracks[title] = data.files;
			jukebox[title] = {
				link:data.link,
				jacket:data.jacket
			};
		}
		tracks = Object.keys(tracks).sort().reduce(
			(obj, key) => { 
				obj[key] = tracks[key]; 
				return obj;
			}, 
			{}
		);
		super(node, tracks);
		// extensions
		this.jukebox_data = jukebox;
		this.playlist = [];
		this.playlist_index = [];

        // for continuous play
        this.player.addEventListener('ended', this.on_track_ended.bind(this));

		// album jacket
		let extra_container = add_to(null, "div", {
			cls: ["audio-inner-container"]
		});
		this.container.firstChild.after(extra_container);
		this.jacket_image = add_to(extra_container, "img", {
			cls: ["audio-jacket"]
		});
		this.jacket_image.setAttribute('loading', 'lazy');

        // mode select
		extra_container = add_to(null, "div", {
			cls:["audio-inner-container"]
		});
		this.container.lastChild.before(extra_container);
		let label = add_to(extra_container, "label", {cls:["audio-label"]});
		label.htmlFor = "audio-mode";
		label.innerText = "Mode";
		this.mode = add_to(extra_container, "select", {
			cls:["audio-select"],
			id:"audio-mode"
		});
		let set_default = false;
		for(const mode_option of ["Play Current Track", "Play All Tracks", "Loop Current Track", "Loop All Tracks", "Shuffle"])
		{
			let option = add_to(this.mode, "option");
			option.value = mode_option;
			option.innerText = mode_option;
			if(!set_default)
			{
				set_default = true;
				option.selected = true;
			}
		}
		// spacer
		add_to(this.container, "br");
        
        // Links
		extra_container = add_to(this.container, "div", {
			cls:["audio-inner-container"]
		});
		add_to(extra_container, "button", {
			cls:["audio-button"],
			innerhtml:'<img src="../GBFML/assets/ui/icon/itunes.png"> ITunes',
			onclick:this.open_itunes.bind(this)
		});
		add_to(extra_container, "button", {
			cls:["audio-button"],
			innerhtml:'<img src="../GBFML/assets/ui/icon/youtube-music.png"> Youtube Music',
			onclick:this.open_youtube_music.bind(this)
		});
		
		this.update_audio_tracks();
	}

    on_track_ended()
    {
		let next_index = (this.playlist_index + 1) % this.playlist.length;
		switch(this.mode.value)
		{
			// all tracks
			case "Play All Tracks":
			{
				this.set_playlist_track(next_index, next_index != 0);
				break;
			}
			case "Loop All Tracks":
			{
				this.set_playlist_track(next_index, true);
				break;
			}
			case "Shuffle":
			{
				if(next_index == 0)
				{
					this.category.selectedIndex = Math.floor(Math.random() * jukebox.category.options.length);
					this.update_audio_tracks();
					this.set_and_play_audio();
				}
				else
				{
					this.set_playlist_track(next_index, true);
				}
				break;
			}
			// single track
			case "Loop Current Track":
			{
				this.set_playlist_track(this.playlist_index, true);
				break;
			}
			default:
			{
				break;
			}
		}
    }
	
	set_playlist_track(track_index, state)
	{
		this.playlist_index = track_index;
		this.player.src = "https://prd-game-a5-granbluefantasy.akamaized.net/assets_en/sound/bgm/" + this.playlist[this.playlist_index] + ".mp3";
		this.player.currentTime = 0;
		this.playing.innerText = "Playing: " + this.format_sound_suffix(this.playlist[this.playlist_index]);
		if(state) this.player.play();
		this.play_button.disabled = !state;
		this.play_button.classList.toggle("audio-player-button-paused", !state);
	}

    update_audio_tracks()
    {
        super.update_audio_tracks();
        if(this.category.value in this.jukebox_data)
		{
            // Update jacket image
            this.jacket_image.src = "https://prd-game-a1-granbluefantasy.akamaized.net/assets_en/img/sp/jukebox/jacket/" + this.jukebox_data[this.category.value].jacket;
        }
    }
	
	set_and_play_audio()
	{
		let src = "https://prd-game-a5-granbluefantasy.akamaized.net/assets_en/sound/bgm/" + this.track.value + ".mp3";
		if(this.player.src == src)
		{
			this.player.pause();
			this.player.currentTime = 0;
			this.player.play();
		}
		else
		{
			this.player.src = src;
			this.player.play();
			this.playing.innerText = "Playing: " + this.format_sound_suffix(this.track.value);
		}
		this.play_button.disabled = false;
		this.play_button.classList.toggle("audio-player-button-paused", false);
		this.playlist = [];
		for(const opt of this.track.options)
		{
			this.playlist.push(opt.value);
		}
		this.playlist_index = this.track.selectedIndex;
	}

	open_audio()
	{
		let a = document.createElement("a");
		a.setAttribute('href', "https://prd-game-a5-granbluefantasy.akamaized.net/assets_en/sound/bgm/" + this.track.value + ".mp3");
		a.target = "_blank";
		a.rel = "noopener noreferrer";
		a.click();
	}
	
	format_sound_suffix(s)
	{
		return s.replaceAll("_", " ");
	}
	
	open_itunes()
	{
		if(this.category.value in this.jukebox_data)
		{
			let a = document.createElement("a");
			a.setAttribute('href', this.jukebox_data[this.category.value].link.pc_link);
			a.target = "_blank";
			a.rel = "noopener noreferrer";
			a.click();
		}
	}
	
	open_youtube_music()
	{
		if(this.category.value in this.jukebox_data)
		{
			let a = document.createElement("a");
			a.setAttribute('href', this.jukebox_data[this.category.value].link.android_link);
			a.target = "_blank";
			a.rel = "noopener noreferrer";
			a.click();
		}
	}
}