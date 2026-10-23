# Builds a single-file preview page for a private Artifact.
import re, base64, sys
out = sys.argv[1]
css = open('css/app.css').read()
js = ''.join(open(f).read() + '\n' for f in ['js/config.js', 'js/data.js', 'js/engine.js', 'js/app.js'])
icon = base64.b64encode(open('img/icon.svg','rb').read()).decode()
page = ('<title>Event Couture</title>\n'
 '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500;6..96,600&family=Jost:wght@400;500&display=swap">\n'
 '<style>' + css + '\nmain{padding-left:max(18px,env(safe-area-inset-left,0px));padding-right:max(18px,env(safe-area-inset-right,0px));}</style>\n'
 '<div id="app"></div>\n<script>' + js.replace('</script', '<\\/script') + '</script>\n')
open(out, 'w').write(page)
print(len(page))
