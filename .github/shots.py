import os, urllib.request, re
os.makedirs('out',exist_ok=True); log=lambda m: open('out/log.txt','a').write(str(m)+'\n')
for s in ['destination-wedding-planner','destination-wedding-planner-mallorca','destination-wedding-planner-cancun','toronto-wedding-planner']:
    try:
        t=urllib.request.urlopen('https://eventcouture.app/'+s+'/?v=d',timeout=30).read().decode()
        log(s+' ok '+re.search(r'<h1[^>]*>(.*?)</h1>',t,re.S).group(1)[:60]+' | '+str('in US dollars' in t))
    except Exception as e: log(s+' ERR '+str(e))
sm=urllib.request.urlopen('https://eventcouture.app/sitemap.xml',timeout=30).read().decode(); log('planner urls: '+str(len(re.findall(r'-planner[^<]*/</loc>',sm))))
