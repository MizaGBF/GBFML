function set_theme(state, save = true)
{
	switch(state)
	{
		case 0: // dark
		{
			document.documentElement.setAttribute("data-theme", "dark");
			break;
		}
		case 1: // light
		{
			document.documentElement.setAttribute("data-theme", "light");
			break;
		}
		default: // reset
		{
			state = 0;
			document.documentElement.setAttribute("data-theme", "dark");
			break;
		}
	}
	if(save)
	{
		localStorage.setItem("gbfml-theme", "" + state);
	}
}

function toggle_theme()
{
	if(localStorage.getItem("gbfml-theme") !== "1")
	{
		set_theme(1);
	}
	else
	{
		set_theme(0);
	}
	beep();
}