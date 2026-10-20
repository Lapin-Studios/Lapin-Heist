"""Bundle src/ into one self-contained LapinHeist.html (open it in Chrome to play).

Also writes dist/LapinHeist-artifact.html: the same game as page content only
(no <html>/<head>/<body> wrapper), for publishing as a claude.ai artifact link.
"""
import re
from pathlib import Path

root = Path(__file__).parent
src = root / "src"
shell = (src / "shell.html").read_text(encoding="utf-8")
css = (src / "style.css").read_text(encoding="utf-8")
js = "\n".join(p.read_text(encoding="utf-8") for p in sorted((src / "js").glob("*.js")))

out = shell.replace("/*@@CSS@@*/", css).replace("/*@@JS@@*/", js)
(root / "LapinHeist.html").write_text(out, encoding="utf-8")
print(f"Built LapinHeist.html ({len(out) // 1024} KB)")

head = re.search(r"<head>(.*)</head>", out, re.S).group(1)
body = re.search(r"<body>(.*)</body>", out, re.S).group(1)
head = re.sub(r"\s*<meta (charset|name=\"viewport\")[^>]*>", "", head)
head = head.replace("<title>Lapin Heist</title>", "")
artifact = '<title>Lapin Heist</title>\n<meta name="claude:viewport-fit-sides" content="cover">' + head + body
(root / "dist").mkdir(exist_ok=True)
(root / "dist" / "LapinHeist-artifact.html").write_text(artifact, encoding="utf-8")
print(f"Built dist/LapinHeist-artifact.html ({len(artifact) // 1024} KB)")
