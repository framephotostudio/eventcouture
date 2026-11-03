import { chromium } from 'playwright'; import fs from 'node:fs'; import path from 'node:path';
fs.mkdirSync('showcase',{recursive:true}); const b=await chromium.launch();
for (const [f,h] of [['post',1350],['story',1920]]) { const p=await b.newPage({viewport:{width:1080,height:h},deviceScaleFactor:1}); await p.goto('file://'+path.resolve('posts/'+f+'.html')); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(1500); const over=await p.evaluate(()=>{const u=document.querySelector('ul').getBoundingClientRect(),c=document.querySelector('.cta').getBoundingClientRect();return Math.round(c.top-u.bottom)}); console.log(f,'space above banner',over); await p.screenshot({path:'showcase/'+f+'.png'}); }
await b.close(); process.exit(0);
