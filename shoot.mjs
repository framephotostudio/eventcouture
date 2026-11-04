import { chromium } from 'playwright'; import fs from 'node:fs'; import path from 'node:path';
fs.mkdirSync('showcase',{recursive:true}); const b=await chromium.launch();
const pins=[
 ['pin-houston-wedding',{img:'pin_w.jpg',k:'Houston · 2026 costs',t:'What a wedding really costs in Houston',n:'$21K – $93K',s:'Typical for 120 guests, line by line. Plan yours free in minutes.'}],
 ['pin-quinceanera',{img:'pin_q.jpg',k:'Quinceañera planning',t:'Your quinceañera budget, made simple',n:'$14K – $72K',s:'See what each part costs and plan the whole day free.'}],
 ['pin-ai-planner',{img:'pin_h.jpg',k:'Free AI event planner',t:'Plan your whole event from one photo',n:'',s:'The look, the budget, top-rated vendors, checklist and invitations — in minutes.'}]];
for (const [n,o] of pins){ const p=await b.newPage({viewport:{width:1000,height:1500},deviceScaleFactor:1}); await p.goto('file://'+path.resolve('posts/pin.html')+'?'+new URLSearchParams(o)); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(1500); await p.screenshot({path:'showcase/'+n+'.png'}); await p.close(); }
await b.close(); process.exit(0);
