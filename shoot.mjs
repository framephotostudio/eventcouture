import { chromium } from 'playwright'; import fs from 'node:fs'; import path from 'node:path';
fs.mkdirSync('showcase',{recursive:true}); const b=await chromium.launch();
const pins=JSON.parse(fs.readFileSync('pins.json','utf8'));
for (const o of pins){ const p=await b.newPage({viewport:{width:1000,height:1500},deviceScaleFactor:1});
  await p.goto('file://'+path.resolve('posts/pin.html')+'?'+new URLSearchParams({img:'pimg/'+o.img+'.jpg',k:o.k,t:o.t,n:o.n,s:o.s}));
  await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(800); await p.screenshot({path:'showcase/pin-'+o.id+'.jpg',type:'jpeg',quality:88}); await p.close(); }
await b.close(); process.exit(0);
