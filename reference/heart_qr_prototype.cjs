const QR=require('qrcode'),jsQR=require('jsqr'),{PNG}=require('pngjs');
function rng(seed){let s=0;for(const c of seed)s=(s*31+c.charCodeAt(0))>>>0;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
function inHeart(x,y){ // x,y in [-1.3,1.3]
  const a=x*x+y*y-1;return a*a*a-x*x*y*y*y<=0;}
function render(url,size,opts){
  const {ec='H',margin=2,density=.45,coreFrac=0.46}=opts;
  const q=QR.create(url,{errorCorrectionLevel:ec});const n=q.modules.size;
  // heart bounding box in heart coords: x[-1.14,1.14], y[-1.0,1.25]
  const hx0=-1.15,hx1=1.15,hy0=-1.2,hy1=1.3; // y up
  const W=hx1-hx0,H=hy1-hy0;
  const px=size*0.72/ W; // px per heart unit (heart ~72% width)
  const heartW=W*px, heartH=H*px; const ox=(size-heartW)/2, oy=(size-heartH)/2;
  const coreW=heartW*coreFrac; const mod=coreW/n; // module px
  const cx=size/2, cy=oy+heartH*0.40; // core center
  const x0=cx-coreW/2,y0=cy-coreW/2;
  const png=new PNG({width:size,height:size});png.data.fill(255);
  const set=(i,j,v)=>{ if(i<0||j<0||i>=size||j>=size)return; const k=(j*size+i)*4;png.data[k]=png.data[k+1]=png.data[k+2]=v;png.data[k+3]=255;};
  const r=rng(url);
  // module grid aligned to the core grid, extended outward
  const gx0=Math.floor((ox-x0)/mod)-1, gx1=Math.ceil((ox+heartW-x0)/mod)+1;
  const gy0=Math.floor((oy-y0)/mod)-1, gy1=Math.ceil((oy+heartH-y0)/mod)+1;
  for(let gy=gy0;gy<=gy1;gy++)for(let gx=gx0;gx<=gx1;gx++){
    const mx=x0+gx*mod+mod/2,my=y0+gy*mod+mod/2;
    const hxu=((mx-ox)/px)+hx0, hyu=hy1-((my-oy)/px); // y up
    if(!inHeart(hxu,hyu))continue;
    const inCore=gx>=0&&gy>=0&&gx<n&&gy<n;
    const inMargin=gx>=-margin&&gy>=-margin&&gx<n+margin&&gy<n+margin;
    let dark;
    if(inCore)dark=q.modules.get(gx,gy)===1; else if(inMargin)dark=false; else dark=r()<density;
    if(!dark)continue;
    for(let j=Math.floor(my-mod/2);j<Math.ceil(my+mod/2);j++)for(let i=Math.floor(mx-mod/2);i<Math.ceil(mx+mod/2);i++)set(i,j,0);
  }
  return {png,n,mod};
}
function decode(png){const d=jsQR(new Uint8ClampedArray(png.data),png.width,png.height);return d&&d.data;}
const fs=require('fs');
const slugs=[...Array(60)].map((_,i)=>Math.random().toString(36).slice(2,12));
for(const cfg of [{ec:'H',coreFrac:.46},{ec:'M',coreFrac:.46},{ec:'H',coreFrac:.40},{ec:'H',coreFrac:.50}]){
  for(const size of [1024,512,360]){
    let ok=0;
    for(const s of slugs){const url='https://museum.example/m/'+s;const {png}=render(url,size,cfg);if(decode(png)===url)ok++;}
    console.log(JSON.stringify(cfg),size,ok+'/'+slugs.length);
  }
}
const {png,n,mod}=render('https://museum.example/m/abcdefghij',900,{ec:'H'});
fs.writeFileSync('heart.png',PNG.sync.write(png));console.log('modules',n,'modpx',mod.toFixed(1));
