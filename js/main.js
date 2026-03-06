// ─── LANGUAGE TOGGLE
function setLang(lang) {
  // Toggle all [data-lang] elements
  document.querySelectorAll('[data-lang]').forEach(el => {
    const elLang = el.getAttribute('data-lang');
    if (elLang === lang) {
      el.style.removeProperty('display');
    } else {
      el.style.display = 'none';
    }
  });
  // Update toggle buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === 'btn' + lang.toUpperCase());
  });
  try { localStorage.setItem('si_lang', lang); } catch(e) {}
}

// Init lang on load — default ID
(function() {
  let saved = null;
  try { saved = localStorage.getItem('si_lang'); } catch(e) {}
  setLang(saved || 'id');
})();

// ─── LOGO CELLS ANIMATION
const lcEls=[document.getElementById('lc0'),document.getElementById('lc1'),document.getElementById('lc2'),document.getElementById('lc3')];
const patterns=[[1,0,0,1],[0,1,1,0],[1,1,0,0],[0,0,1,1],[1,0,1,0],[0,1,0,1]];
let pi=0;
setInterval(()=>{pi=(pi+1)%patterns.length;lcEls.forEach((el,i)=>{if(el){el.className='lc '+(patterns[pi][i]?'on':'off');}});},900);

// ─── EQUITY CURVE CANVAS
const canvas=document.getElementById('equityChart');
if(canvas){const ctx=canvas.getContext('2d');const dpr=window.devicePixelRatio||1;canvas.width=canvas.offsetWidth*dpr;canvas.height=canvas.offsetHeight*dpr;ctx.scale(dpr,dpr);const W=canvas.offsetWidth,H=canvas.offsetHeight;const pts=[];let v=10000;for(let i=0;i<180;i++){v+=v*(Math.random()*0.04-0.015);v=Math.max(v,8000);pts.push(v);}const mn=Math.min(...pts),mx=Math.max(...pts);const sx=i=>i/(pts.length-1)*W;const sy=v=>H-((v-mn)/(mx-mn))*(H*0.8)-H*0.1;ctx.beginPath();ctx.moveTo(sx(0),H);pts.forEach((v,i)=>ctx.lineTo(sx(i),sy(v)));ctx.lineTo(W,H);ctx.closePath();const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'rgba(57,255,20,0.15)');g.addColorStop(1,'rgba(57,255,20,0)');ctx.fillStyle=g;ctx.fill();ctx.beginPath();pts.forEach((v,i)=>i===0?ctx.moveTo(sx(i),sy(v)):ctx.lineTo(sx(i),sy(v)));ctx.strokeStyle='rgba(57,255,20,0.8)';ctx.lineWidth=1.5;ctx.shadowColor='rgba(57,255,20,0.5)';ctx.shadowBlur=6;ctx.stroke();}

// ─── WIN RATE BARS ANIMATE ON SCROLL
const wr=document.querySelectorAll('.wr-fill');
const wrObs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){const fill=e.target;const tw=fill.style.width;fill.style.width='0%';setTimeout(()=>{fill.style.width=tw;},100);wrObs.unobserve(fill);}});},{threshold:0.3});
wr.forEach(el=>wrObs.observe(el));

// ─── SCROLL FADE-IN
const fadeEls=document.querySelectorAll('.sbox,.cw-card,.sl,.pc,.hiw-step,.state-card,.bot-card,.pricing-idr-card,.usdc-box');
const fObs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){setTimeout(()=>{e.target.style.opacity='1';e.target.style.transform='translateY(0)';},50);fObs.unobserve(e.target);}});},{threshold:0.1});
fadeEls.forEach(el=>{el.style.opacity='0';el.style.transform='translateY(20px)';el.style.transition='opacity 0.55s ease, transform 0.55s ease';fObs.observe(el);});

// ─── FAQ ACCORDION
document.querySelectorAll('.faq-q').forEach(q=>{q.addEventListener('click',()=>{const item=q.parentElement;const isOpen=item.classList.contains('open');document.querySelectorAll('.faq-item').forEach(i=>i.classList.remove('open'));if(!isOpen)item.classList.add('open');});});

// ─── SIGNAL FEED FILTER TABS
document.querySelectorAll('.feed-tag').forEach(tag=>{tag.addEventListener('click',()=>{document.querySelectorAll('.feed-tag').forEach(t=>t.classList.remove('active'));tag.classList.add('active');});});

// ─── SIMULATE NEW SIGNAL EVERY 8s
const buyTypes=['⚡ CONWAY BUY','SSL2 ↑','GOLD BUY'];
const sellTypes=['⚡ DOOM SELL','SSL2 ↓','CONWAY DIED'];
const syms=['BTCUSDT','XAUUSD','EURUSD','GBPUSD','ETHUSDT'];
const sessions=['LONDON','NEW YORK','ASIA'];
setTimeout(()=>{const feed=document.querySelector('.feed-box');if(!feed)return;const firstRow=feed.querySelector('.sig-row');if(!firstRow)return;const now=new Date();const t=`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;const isBuy=Math.random()>0.5;const type=(isBuy?buyTypes:sellTypes)[Math.floor(Math.random()*3)];const sym=syms[Math.floor(Math.random()*syms.length)];const sess=sessions[Math.floor(Math.random()*sessions.length)];const newRow=document.createElement('div');newRow.className='sig-row highlight new';newRow.innerHTML=`<span class="st">${t}</span><span class="stype ${isBuy?'buy':'sell'}">${type}</span><span class="ssym">${sym}</span><span class="sprice">—</span><span class="ssess">${sess}</span><span class="sdesc">Live simulated signal</span><span class="spnl ${isBuy?'up':'dn'}">${isBuy?'+':'-'}${(Math.random()*2+0.5).toFixed(1)}%</span>`;firstRow.parentNode.insertBefore(newRow,firstRow);setTimeout(()=>newRow.classList.remove('highlight'),3000);},8000);

// ─── CONWAY CARD CELL PIP PULSE
const allPips=document.querySelectorAll('.cw-card .pip.on');
setInterval(()=>{if(allPips.length){const rp=allPips[Math.floor(Math.random()*allPips.length)];rp.style.opacity='0.35';setTimeout(()=>{rp.style.opacity='1';},400);}},2500);
