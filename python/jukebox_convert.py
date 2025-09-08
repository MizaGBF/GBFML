from __future__ import annotations
import json

"""
jukebox_dump.json must contain an array of dump of the game jukebox JSON files
"""
with open("jukebox_dump.json", mode="r", encoding="utf-8") as f:
    data = json.load(f)

l = []
juke_table = set();
for group in data:
    for bgm in group["bgm"].values():
        print(bgm["title"].replace("<br>", " "))
        iterate = bgm["list"].values() if isinstance(bgm["list"], dict) else bgm["list"]
        for entry in iterate:
            l.append(
                {
                    "title":entry["title"].replace("<br>", " "),
                    "files":[],
                    "link":bgm.get("link", None),
                    "jacket":bgm["jacket_image"]
                }
            )
            if "file" in entry:
                l[-1]["files"].append(entry["file"])
            elif "list" in entry:
                for f in entry["list"].values():
                    l[-1]["files"].append(f["file"])
            if len(l[-1]["files"]) == 1 and l[-1]["files"][0].endswith("_juke"):
                del l[-1]

l.sort(key=lambda x: int(x["files"][0].split("_")[0]))

with open("jukebox.json", mode="w", encoding="utf-8") as f:
    json.dump(l, f)