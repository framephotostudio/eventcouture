# Checks the connected (live) path with a fake server: python3 tests/live.py
import json
from playwright.sync_api import sync_playwright
BASE = 'http://localhost:8765/'
CONCEPTS = {'concepts': [{'id': f'c{i}', 'name': f'Test Concept {i}', 'styleName': f'Test {i}', 'palette': ['#111111', '#C9A86A', '#FFFFFF'], 'mood': 'Mood', 'decor': ['A', 'B', 'C', 'D'], 'dress': 'Cocktail', 'menuStyle': 'modern', 'music': 'house', 'fit': 'Closest match', 'outline': ['Arrival: a', 'Tables: b', 'Moment: c', 'Dress code: d']} for i in range(3)]}
PLACES = {'places': [{'id': 'p1', 'name': 'Real Loft', 'address': '1 Main St', 'rating': 4.7, 'reviews': 120, 'mapsUrl': 'https://maps.google.com/?cid=1'}]}
problems = []
with sync_playwright() as p:
    b = p.chromium.launch(); page = b.new_page(viewport={'width': 390, 'height': 844})
    errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
    page.route('**/js/config.js', lambda r: r.fulfill(content_type='application/javascript', body="window.EC_CONFIG={apiUrl:'https://api.test',amazonTag:'tag-20',preview:false};"))
    page.route('https://api.test/api/concepts', lambda r: r.fulfill(content_type='application/json', body=json.dumps(CONCEPTS)))
    page.route('https://api.test/api/places', lambda r: r.fulfill(content_type='application/json', body=json.dumps(PLACES)))
    page.route('https://api.test/api/drive', lambda r: r.fulfill(content_type='application/json', body=json.dumps({'times': [{'placeId': 'p1', 'minutes': 14, 'miles': 6.2}]})))
    page.goto(BASE + '#/new/1')
    page.fill('#text', 'black and gold birthday'); page.click('#next')
    page.fill('#start', 'Downtown Houston'); page.click('#setting [data-v=indoor]'); page.click('#next')
    if 'Pay $' not in page.inner_text('#pay'): problems.append('live checkout label missing price')
    page.click('#pay'); page.wait_for_selector('.concept')
    if 'Test Concept 0' not in page.inner_text('#cs'): problems.append('server concepts not used')
    page.click('.concept button.gold'); page.wait_for_selector('.tier')
    page.goto(page.url.rstrip('/') + '/places'); page.wait_for_selector('[data-live]')
    page.click('[data-live] >> nth=0'); page.wait_for_selector('text=Real Loft'); page.wait_for_timeout(300)
    if '14 min drive' not in page.inner_text('#tab'): problems.append('drive time missing')
    page.goto(page.url.replace('/places', '/style')); page.wait_for_timeout(200)
    if 'tag=tag-20' not in page.inner_html('#tab'): problems.append('affiliate tag missing')
    if errs: problems.append(errs)
    b.close()
print(problems or 'live path ok')
