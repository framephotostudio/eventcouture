import os, urllib.request, re
os.makedirs('out',exist_ok=True); log=lambda m: open('out/log.txt','a').write(str(m)+'\n')
for s in ['houston-arabic-wedding-planner','charlotte-wedding-planner','toronto-indian-wedding-planner','boise-party-planner','virtual-wedding-planner','plan/houston-tx']:
    try:
        r=urllib.request.urlopen('https://eventcouture.app/'+s+'/?v=pl',timeout=30); t=r.read().decode()
        log(s+' '+str(r.status)+' '+re.search(r'<h1[^>]*>(.*?)</h1>',t,re.S).group(1)[:60]+(' | planner links: '+str(t.count('-planner/')) if 'plan/' in s else ''))
    except Exception as e: log(s+' ERR '+str(e))
sm=urllib.request.urlopen('https://eventcouture.app/sitemap.xml',timeout=30).read().decode(); log('sitemap planner urls: '+str(len(re.findall(r'-planner/</loc>',sm))))
