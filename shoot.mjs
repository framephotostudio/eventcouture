import { chromium } from 'playwright'; import fs from 'node:fs';
fs.mkdirSync('showcase',{recursive:true}); const b=await chromium.launch();
const S='https://eventcouture.app/';
const shots=[['dir-home',S,1270,760],['dir-wedding',S+'#/sample/4',1270,760],['dir-budget',S+'#/sample/4/budget',1270,760],['dir-style',S+'#/sample/4/style',1270,760],['dir-vendors',S+'#/sample/4/vendors',1270,760],['dir-phone-home',S,390,844],['dir-phone-plan',S+'#/sample/4',390,844]];
for (const [n,u,w,h] of shots){ const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:2}); await p.goto(u,{waitUntil:'networkidle'}); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(2500); await p.screenshot({path:'showcase/'+n+'.png'}); await p.close(); }
await b.close(); process.exit(0);
