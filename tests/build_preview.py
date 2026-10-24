# Builds a single-file preview page for a private Artifact.
import re, base64, sys
out = sys.argv[1]
css = open('css/app.css').read()
js = ''.join(open(f).read() + '\n' for f in ['js/config.js', 'js/data.js', 'js/inspo.js', 'js/engine.js', 'js/songs.js', 'js/legal.js', 'js/app.js'])
import glob, io, json
from PIL import Image
def data_uri(path, width):
    im = Image.open(path).convert('RGB'); im = im.resize((width, round(width * im.size[1] / im.size[0])), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'JPEG', quality=74, optimize=True, progressive=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()
embed = {'img/hero.jpg': data_uri('img/hero.jpg', 900)}
for f in sorted(glob.glob('img/events/*.jpg')): embed[f] = data_uri(f, 900)
embed['img/brand/logo-banner-wide.jpg'] = data_uri('img/brand/logo-banner-wide.jpg', 3200)
embed['img/brand/logo-letters.png'] = 'data:image/png;base64,' + base64.b64encode(open('img/brand/logo-letters.png','rb').read()).decode()
embed['img/brand/facecouture-icon-128.png'] = 'data:image/png;base64,' + base64.b64encode(open('img/brand/facecouture-icon-128.png','rb').read()).decode()
embed['img/brand/ec-mark-128.png'] = 'data:image/png;base64,' + base64.b64encode(open('img/brand/ec-mark-128.png','rb').read()).decode()
js = 'window.EC_EMBED = ' + json.dumps(embed) + ';\n' + js
icon = base64.b64encode(open('img/icon.svg','rb').read()).decode()
page = ('<title>Event Couture by Always Luxe</title>\n'
 '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500;6..96,600&family=Jost:wght@400;500&display=swap">\n'
 '<style>' + css + '\nmain{padding-left:max(18px,env(safe-area-inset-left,0px));padding-right:max(18px,env(safe-area-inset-right,0px));}</style>\n'
 '<div id="loader" class="loader" role="status"><img src="' + embed['img/brand/ec-mark-128.png'] + '" alt=""><span>Event Couture</span></div>\n<div id="app"></div>\n<script>' + js.replace('</script', '<\\/script') + '</script>\n')
open(out, 'w').write(page)
print(len(page))
