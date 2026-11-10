import json, urllib.request
A='https://event-couture-api.facecouture.workers.dev/api/places'
def q(query,city,cat):
    req=urllib.request.Request(A,data=json.dumps({'query':query,'city':city,'kind':'vendor','cat':cat,'level':'S'}).encode(),headers={'content-type':'application/json','origin':'https://eventcouture.app','referer':'https://eventcouture.app/','user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'})
    try: d=json.load(urllib.request.urlopen(req,timeout=40))
    except Exception as e: d={'error':str(e)}
    open('out/log.txt','a').write(f"{city} | {cat} | {query} => "+(str(d.get('error')) if 'places' not in d else str(len(d['places']))+' '+'; '.join(p['name'][:30] for p in d['places'][:4]))+(' raw:'+str({k:v for k,v in d.items() if k!='places'})[:200])+'\n')
import os; os.makedirs('out',exist_ok=True)
for city in ['London, UK','Cape Town, South Africa']:
    for query,cat in [('event photographer','photographer'),('wedding photographer','photographer'),('makeup artist','hairMakeup'),('hair stylist','hair'),('formal wear boutique','attire'),('wedding DJ','dj')]:
        q(query,city,cat)
