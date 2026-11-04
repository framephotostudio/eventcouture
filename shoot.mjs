import { chromium } from 'playwright'; import fs from 'node:fs'; import path from 'node:path';
fs.mkdirSync('showcase',{recursive:true}); const b=await chromium.launch();
let p=await b.newPage({viewport:{width:1024,height:1536},deviceScaleFactor:2}); await p.goto('file://'+path.resolve('posts/flyer2.html')); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(1500); await p.screenshot({path:'posts/comp1.png'}); await p.screenshot({path:'showcase/flyer2.png'}); await p.close();
p=await b.newPage({viewport:{width:1024,height:1536},deviceScaleFactor:2}); await p.goto('file://'+path.resolve('posts/flyer3.html')); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(1500); await p.screenshot({path:'showcase/flyer3.png'});
await b.close(); process.exit(0);
