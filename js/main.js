// ─── LOGO CELLS ANIMATION
(function(){
  var els=[document.getElementById('lc0'),document.getElementById('lc1'),document.getElementById('lc2'),document.getElementById('lc3')];
  var patterns=[[1,0,0,1],[0,1,1,0],[1,1,0,0],[0,0,1,1],[1,0,1,0],[0,1,0,1],[1,1,1,0],[0,1,1,1]];
  var pi=0;
  setInterval(function(){
    pi=(pi+1)%patterns.length;
    els.forEach(function(el,i){if(el){el.className='lc '+(patterns[pi][i]?'on':'off');}});
  },900);
})();

// ─── EQUITY CURVE CANVAS
(function(){
  var canvas=document.getElementById('equityChart');
  if(!canvas)return;
  var ctx=canvas.getContext('2d');
  var W=canvas.offsetWidth||340;
  var H=180;
  canvas.width=W;canvas.height=H;
  var pts=[0,2,-1,4,8,6,10,7,12,15,11,18,14,20,16,22,19,24,21,26,23,28,25,30,27,32,29,35,33,38,36,40,38,42,40,45,43,47,46,50,48,52,50,55,53,57,56,60,58,62,60,65,63,67,66,70,68,72,70,75,73,78,76,80,78,83,81,86,84,88,87,91,90,94,93,97,96,100,98,103,101,106,104,109,107,112,110,115,113,118,116,121,119,124,122,127,125,130,128,133,131,136,134,139,137,142,140,145,143,148,146,151,149,155,152,158,155,161,158,164,162,168,165,171,168,174,171,178,174,181,177,184,180,187,183,190,186,192];
  var min=Math.min.apply(null,pts);
  var max=Math.max.apply(null,pts);
  var pad=12;
  function toY(v){return H-pad-((v-min)/(max-min))*(H-pad*2);}
  function toX(i){return pad+(i/(pts.length-1))*(W-pad*2);}
  // gradient fill
  var grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'rgba(57,255,20,0.18)');
  grad.addColorStop(1,'rgba(57,255,20,0)');
  ctx.beginPath();
  ctx.moveTo(toX(0),H);
  pts.forEach(function(v,i){ctx.lineTo(toX(i),toY(v));});
  ctx.lineTo(toX(pts.length-1),H);
  ctx.closePath();
  ctx.fillStyle=grad;
  ctx.fill();
  // line
  ctx.beginPath();
  pts.forEach(function(v,i){i===0?ctx.moveTo(toX(i),toY(v)):ctx.lineTo(toX(i),toY(v));});
  ctx.strokeStyle='#39ff14';
  ctx.lineWidth=1.5;
  ctx.stroke();
  // end dot
  ctx.beginPath();
  ctx.arc(toX(pts.length-1),toY(pts[pts.length-1]),4,0,Math.PI*2);
  ctx.fillStyle='#39ff14';
  ctx.fill();
})();

// ─── WIN RATE BARS ANIMATE
(function(){
  var fills=document.querySelectorAll('.wr-fill');
  var animated=false;
  function animate(){
    if(animated)return;
    fills.forEach(function(el){
      var w=el.style.width;
      el.style.width='0';
      setTimeout(function(){el.style.width=w;},100);
    });
    animated=true;
  }
  var wrap=document.querySelector('.wr-wrap');
  if(!wrap){animate();return;}
  var obs=new IntersectionObserver(function(entries){
    if(entries[0].isIntersecting){animate();obs.disconnect();}
  },{threshold:0.3});
  obs.observe(wrap);
})();

// ─── SCROLL FADE-UP
(function(){
  var els=document.querySelectorAll('.fade-up');
  if(!els.length)return;
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting)e.target.classList.add('visible');});
  },{threshold:0.1});
  els.forEach(function(el){obs.observe(el);});
})();

// ─── FAQ ACCORDION
(function(){
  document.querySelectorAll('.faq-q').forEach(function(q){
    q.addEventListener('click',function(){
      var item=this.closest('.faq-item');
      var isOpen=item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function(i){i.classList.remove('open');});
      if(!isOpen)item.classList.add('open');
    });
  });
})();

// ─── SIGNAL FEED FILTER
(function(){
  var tags=document.querySelectorAll('.feed-tag');
  var rows=document.querySelectorAll('.sig-row');
  tags.forEach(function(tag){
    tag.addEventListener('click',function(){
      tags.forEach(function(t){t.classList.remove('active');});
      tag.classList.add('active');
      var filter=tag.textContent.trim().toUpperCase();
      rows.forEach(function(row){
        if(filter==='ALL'){row.classList.remove('hidden');return;}
        var type=row.getAttribute('data-type')||'';
        row.classList.toggle('hidden',type!==filter);
      });
    });
  });
})();

// ─── SIMULATED SIGNAL FEED (every 8s)
(function(){
  var feedBox=document.querySelector('.feed-box .sig-row:first-of-type');
  if(!feedBox)return;
  var parent=feedBox.parentElement;
  var signals=[
    {time:'',type:'buy',typeLabel:'⚡ CONWAY BUY',sym:'BBCA.JK',price:'9,650',sess:'IDX',desc:'BORN · 6/8 cells · Grade 1 · BBP↑',pnl:'+0',pnlClass:'up',dtype:'ENTRY'},
    {time:'',type:'info',typeLabel:'BBP ↑',sym:'XAUUSD',price:'2,914.50',sess:'LONDON',desc:'BBP Crossover · Conway 6/8 active',pnl:'+0',pnlClass:'up',dtype:'INFO'},
    {time:'',type:'buy',typeLabel:'⚡ CONWAY BUY',sym:'EURUSD',price:'1.0851',sess:'LONDON',desc:'BORN · 5/8 cells · Grade 2 · BBP↑',pnl:'+0',pnlClass:'up',dtype:'ENTRY'},
    {time:'',type:'sell',typeLabel:'⚡ DOOM SELL',sym:'NQ100',price:'21,790',sess:'NEW YORK',desc:'BBP Crossunder · VWAP confirmed',pnl:'+1.4%',pnlClass:'up',dtype:'ENTRY'},
    {time:'',type:'exit',typeLabel:'CONWAY DIED',sym:'TLKM.JK',price:'3,420',sess:'IDX',desc:'Cells dropped 5→3 · exit triggered',pnl:'-0.6%',pnlClass:'dn',dtype:'EXIT'},
    {time:'',type:'info',typeLabel:'🗽 NY OPEN',sym:'ALL PAIRS',price:'—',sess:'OPEN',desc:'New York session — highest volume window',pnl:'—',pnlClass:'neu',dtype:'INFO'},
    {time:'',type:'warn',typeLabel:'⚠ ALPHA EXIT',sym:'BTCUSDT',price:'67,320',sess:'ASIA',desc:'Dump risk · reduce exposure',pnl:'—',pnlClass:'neu',dtype:'EXIT'},
  ];
  var idx=0;
  setInterval(function(){
    var s=signals[idx%signals.length];
    var now=new Date();
    var hh=String(now.getHours()).padStart(2,'0');
    var mm=String(now.getMinutes()).padStart(2,'0');
    var ss=String(now.getSeconds()).padStart(2,'0');
    s.time=hh+':'+mm+':'+ss;
    var row=document.createElement('div');
    row.className='sig-row highlight new';
    row.setAttribute('data-type',s.dtype);
    row.innerHTML='<span class="st">'+s.time+'</span>'
      +'<span class="stype '+s.type+'">'+s.typeLabel+'</span>'
      +'<span class="ssym">'+s.sym+'</span>'
      +'<span class="sprice">'+s.price+'</span>'
      +'<span class="ssess">'+s.sess+'</span>'
      +'<span class="sdesc">'+s.desc+'</span>'
      +'<span class="spnl '+s.pnlClass+'">'+s.pnl+'</span>';
    var firstRow=parent.querySelector('.sig-row');
    if(firstRow)parent.insertBefore(row,firstRow);
    else parent.appendChild(row);
    // keep max 15 rows
    var allRows=parent.querySelectorAll('.sig-row');
    if(allRows.length>15)allRows[allRows.length-1].remove();
    idx++;
  },8000);
})();

// ─── PIP PULSE ANIMATION
(function(){
  var cards=document.querySelectorAll('.cw-card');
  cards.forEach(function(card){
    var pips=card.querySelectorAll('.pip.on');
    pips.forEach(function(pip){
      setInterval(function(){
        pip.style.opacity=pip.style.opacity==='0.5'?'1':'0.5';
      },1200+Math.random()*800);
    });
  });
})();
