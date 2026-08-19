/* =========================================================================
   CENTRO DE USINAGEM CNC — motor do jogo
   Inspirado na progressão e arquitetura de CNC Coordenadas, reescrito para
   o domínio de centro de usinagem: sem diâmetro, com Z/ciclos de furação,
   funções M e estrutura de programa.
   ========================================================================= */
'use strict';

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const KEY = 'usinagemcnc_v1';
const REDUCED = matchMedia('(prefers-reduced-motion:reduce)').matches;
const _MODO   = new URLSearchParams(location.search).get('r');
const HOVER   = _MODO==='touch' ? false : _MODO==='mouse' ? true
              : matchMedia('(hover:hover) and (pointer:fine)').matches;
const TOUCH   = !HOVER;
const APONTE  = TOUCH ? 'Toque nessa linha da tabela (ou no ponto do desenho)'
                      : 'Passe o mouse nessa linha da tabela';

/* ---------------- progressão ---------------- */
const RANKS = [
  [0,'Aprendiz de Usinagem'], [180,'Operador Júnior'], [480,'Operador CNC'],
  [840,'Programador CNC'], [1200,'Mestre de Usinagem'], [1440,'Lenda da Usinagem']
];
const UNLOCKS = [
  {lvl:2,  id:'shop',        name:'Oficina / Loja',  desc:'Agora você pode gastar moedas em ferramentas.'},
  {lvl:3,  id:'th_blueprint',name:'Tema Blueprint',  desc:'Aquele visual de prancheta azul. Troque na Loja.'},
  {lvl:5,  id:'calc',        name:'Assistente Δ',    desc:'Mostra o ponto anterior enquanto você digita incrementais.'},
  {lvl:8,  id:'reveal',      name:'Revelar célula',  desc:'Compre a resposta de UMA célula por 40 🪙 — a fase passa a valer no máximo 2 ★ (1 ★ da terceira revelação em diante).'},
  {lvl:12, id:'th_neon',     name:'Tema Neon',       desc:'Modo oficina cyberpunk. Troque na Loja.'},
  {lvl:15, id:'endless',     name:'Modo Infinito',   desc:'Peças e furações geradas aleatoriamente, para sempre.'}
];
const SHOP = [
  {id:'pack',    name:'Pacote de 3 dicas', price:40,  repeat:true, desc:'Mais três fichas 💡 para usar em qualquer fase.'},
  {id:'marker',  name:'Marcador de cotas', price:100, desc:'Ao focar uma linha da tabela, as cotas daquele ponto acendem no desenho.'},
  {id:'safety',  name:'Seguro do Novato',  price:200, desc:'A primeira tentativa errada de cada fase não conta para as estrelas.'},
  {id:'goldchip',name:'Cavaco Dourado',    price:120, desc:'Na animação de usinagem, o cavaco que voa da ferramenta sai dourado e brilhante.'},
  {id:'fanfare', name:'Fanfarra Dupla',    price:150, desc:'Toda peça perfeita (3 ★) ganha uma segunda leva de confete e som de vitória.'}
];
const THEMES = [
  {t:'steel',    name:'Oficina (padrão)', price:0,   desc:'Visual escuro de chão de fábrica.'},
  {t:'blueprint',name:'Blueprint',        price:180, unlock:'th_blueprint', desc:'Prancheta azul. Sai de graça ao completar a fase 3.'},
  {t:'paper',    name:'Impressão',        price:80, desc:'Fundo claro, cara de folha de processo impressa.'},
  {t:'neon',     name:'Neon',             price:250, unlock:'th_neon', desc:'Oficina cyberpunk. Sai de graça ao completar a fase 12.'},
  {t:'brasa',    name:'Brasa',            price:150, desc:'Preto e vermelho, fundo quase todo escuro.'},
  {t:'forja',    name:'Forja',            price:150, desc:'Preto e dourado, acento único bem forte.'},
  {t:'oceano',   name:'Oceano',           price:150, desc:'Azul-petróleo profundo, acento turquesa.'},
  {t:'ametista', name:'Ametista',         price:150, desc:'Roxo elegante, acentos rosa e lilás.'}
];
const REVEAL_COST = 40;
const TOL = 0.005;
const STRKINDS = new Set(['g','m','t']);
const tolFor = k => k==='s' ? 3 : k==='f' ? 5 : k==='q'||k==='p' ? 0.05 : TOL;

const MAX_STARS = LEVELS.length*3;
const BOSS_STARS = Math.round(MAX_STARS*0.5);

/* ---------------- estado ---------------- */
const DEF = {xp:0, coins:0, hints:3, stars:{}, unlocked:[], owned:[], theme:'steel',
             tutorial:false, endlessRun:0, best:{}, streak:0, bestStreak:0, dev:false};
let S = load();
function load(){
  let txt=localStorage.getItem(KEY);
  let raw={}; try{ raw=JSON.parse(txt||'{}')||{}; }catch(e){ raw={}; }
  return sanitize(raw);
}
function sanitize(raw){
  const num=(v,d)=> typeof v==='number'&&isFinite(v)?v:d;
  const arr=v=> Array.isArray(v)?v.filter(x=>typeof x==='string'):[];
  const obj=v=> (v&&typeof v==='object'&&!Array.isArray(v))?v:{};
  const s={...DEF};
  const IDS=new Set(LEVELS.map(l=>String(l.id)));
  const cap=(v,d,max)=>Math.max(0,Math.min(Math.floor(num(v,d)),max));
  const clampObj=(v,max)=>{ const o={};
    for(const k in obj(v)){ if(!IDS.has(String(k))) continue;
      const x=+obj(v)[k]; if(isFinite(x)&&x>0) o[k]=Math.min(Math.floor(x),max); }
    return o; };
  const OK_UNLOCK=new Set(UNLOCKS.map(u=>u.id));
  const OK_OWN=new Set([...SHOP.map(i=>i.id), ...THEMES.map(t=>'th_'+t.t)]);
  s.xp=cap(raw.xp,0,999999); s.coins=cap(raw.coins,0,999999); s.hints=cap(raw.hints,3,999);
  s.endlessRun=cap(raw.endlessRun,0,99999); s.bestStreak=cap(raw.bestStreak,0,9999);
  s.streak=Math.min(cap(raw.streak,0,9999), s.bestStreak);
  s.tutorial=!!raw.tutorial;
  s.dev=!!raw.dev;
  s.stars=clampObj(raw.stars,3); s.best=clampObj(raw.best,86400);
  s.unlocked=[...new Set(arr(raw.unlocked))]; s.owned=[...new Set(arr(raw.owned))];
  s.unlocked=s.unlocked.filter(x=>OK_UNLOCK.has(x));
  s.owned=s.owned.filter(x=>OK_OWN.has(x));
  s.theme = THEMES.some(t=>t.t===raw.theme) ? raw.theme : 'steel';
  return s;
}
function save(){
  try{ localStorage.setItem(KEY, JSON.stringify(S)); }
  catch(e){ if(!save._warned){ save._warned=1; toast('Não consegui salvar o progresso neste navegador (modo privado?).',5000); } }
}

let P = null;      // partida atual
let CC = null;     // cache das cores do tema
let timer = null;
const HINT_TIER = {};

/* ---------------- util ---------------- */
const totalStars = () => Object.values(S.stars).reduce((a,b)=>a+(+b||0),0);
const rankOf = xp => RANKS.filter(r=>xp>=r[0]).pop();
const nextRank = xp => RANKS.find(r=>xp<r[0]);
const has = id => S.dev || S.unlocked.includes(id) || S.owned.includes(id);
const done = id => (S.stars[id]||0) > 0;
const fmt = n => { const v=Math.round(n*1000)/1000; return (v===0?0:v).toString(); };
const mmss = s => String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
const eq = (a,b,t)=> !isNaN(a) && Math.abs(a-b) < (t==null?TOL:t);

function countUp(el,from,to,ms=900){
  if(REDUCED||from===to){ el.textContent=to; return; }
  const t0=performance.now();
  (function step(t){ const k=Math.min(1,(t-t0)/ms), e=1-Math.pow(1-k,3);
    el.textContent=Math.round(from+(to-from)*e); if(k<1) requestAnimationFrame(step); })(performance.now());
}
function toast(msg, ms=2400){
  const t=$('#toast'); t.textContent=msg; t.classList.add('on');
  clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('on'), ms);
}
let AC=null;
function unlockAudio(){
  try{
    AC = AC || new (window.AudioContext||window.webkitAudioContext)();
    if(AC.state!=='running') AC.resume();
    const b=AC.createBuffer(1,1,22050), s=AC.createBufferSource();
    s.buffer=b; s.connect(AC.destination); s.start(0);
  }catch(e){}
}
['touchend','pointerup','mousedown','keydown'].forEach(ev=>
  window.addEventListener(ev, unlockAudio, {passive:true}));
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden && AC && AC.state==='suspended') AC.resume();
});
function beep(freq=660, dur=.09, type='sine', vol=.06){
  try{
    AC = AC || new (window.AudioContext||window.webkitAudioContext)();
    if(AC.state==='suspended') AC.resume();
    const o=AC.createOscillator(), g=AC.createGain();
    o.type=type; o.frequency.value=freq; o.connect(g); g.connect(AC.destination);
    g.gain.setValueAtTime(vol, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime+dur);
    o.start(); o.stop(AC.currentTime+dur);
  }catch(e){}
}
const sndOk   = ()=>{beep(880,.08);setTimeout(()=>beep(1320,.12),80);};
const sndErr  = ()=>beep(150,.18,'square',.05);
const sndWin  = ()=>{[523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,.16,'triangle'),i*110));};
const sndCoin = ()=>{beep(1200,.05,'square',.04);setTimeout(()=>beep(1600,.07,'square',.04),60);};

/* ---------------- som de usinagem (fresa/furação, sintetizado) ---------------- */
let machNodes=null;
function machSoundStart(){
  try{
    AC = AC || new (window.AudioContext||window.webkitAudioContext)();
    if(AC.state==='suspended') AC.resume();
    const t=AC.currentTime;
    const master=AC.createGain(); master.gain.setValueAtTime(0,t); master.gain.linearRampToValueAtTime(.5,t+.35);
    master.connect(AC.destination);
    const spindle=AC.createOscillator();
    spindle.type='sawtooth';
    spindle.frequency.setValueAtTime(28,t);
    spindle.frequency.exponentialRampToValueAtTime(260, t+.55);
    const spindleFilt=AC.createBiquadFilter(); spindleFilt.type='lowpass'; spindleFilt.frequency.value=1500;
    const spindleGain=AC.createGain(); spindleGain.gain.value=.5;
    spindle.connect(spindleFilt); spindleFilt.connect(spindleGain); spindleGain.connect(master);
    spindle.start();
    const buf=AC.createBuffer(1, AC.sampleRate*2, AC.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    const noise=AC.createBufferSource(); noise.buffer=buf; noise.loop=true;
    const noiseFilt=AC.createBiquadFilter(); noiseFilt.type='bandpass'; noiseFilt.frequency.value=2600; noiseFilt.Q.value=.8;
    const cutGain=AC.createGain(); cutGain.gain.value=0;
    noise.connect(noiseFilt); noiseFilt.connect(cutGain); cutGain.connect(master);
    noise.start();
    machNodes={master,spindle,noise,cutGain};
  }catch(e){ machNodes=null; }
}
function machSoundCutting(active){
  if(!machNodes) return;
  try{
    const t=AC.currentTime;
    machNodes.cutGain.gain.cancelScheduledValues(t);
    machNodes.cutGain.gain.linearRampToValueAtTime(active?.22:0, t+.08);
  }catch(e){}
}
function machSoundStop(){
  if(!machNodes) return;
  const {master,spindle,noise}=machNodes; machNodes=null;
  try{
    const t=AC.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.linearRampToValueAtTime(0, t+.25);
    setTimeout(()=>{ try{spindle.stop(); noise.stop();}catch(e){} }, 320);
  }catch(e){}
}
function machChip(){ beep(1700+Math.random()*900, .02, 'square', .014); }

/* ---------------- HUD ---------------- */
function hud(){
  const [minXp,name]=rankOf(S.xp), nx=nextRank(S.xp);
  $('#rankLabel').textContent=name;
  const pct = nx ? (S.xp-minXp)/(nx[0]-minXp)*100 : 100;
  $('#xpFill').style.width=pct+'%';
  $('#xpBar').setAttribute('aria-valuenow', Math.round(pct));
  $('#xpBar').setAttribute('aria-valuetext', $('#xpTxt').textContent);
  $('#xpTxt').textContent = nx ? `${S.xp} / ${nx[0]} XP → ${nx[1]}` : `${S.xp} XP — nível máximo`;
  $('#coinTxt').textContent=S.coins;
  $('#hintTxt').textContent=S.hints;
  $('#starTxt').textContent=totalStars();
  document.body.dataset.theme=S.theme;
  CC=null;
}

/* ---------------- navegação ---------------- */
function closeAllModals(){
  document.body.style.overflow=''; setInert(false);
  $('#overlay').classList.remove('on');
  $$('.modal').forEach(m=>m.classList.remove('on'));
}
function show(id){
  closeAllModals();
  if(id!=='play' && P && !P.won && !P.pausedAt) P.pausedAt=Date.now();
  $$('.screen').forEach(s=>{ s.classList.remove('active'); s.setAttribute('aria-hidden','true'); });
  const sc=$('#screen-'+id); sc.classList.add('active'); sc.setAttribute('aria-hidden','false');
  if(id!=='play'&&timer){clearInterval(timer);timer=null;}
  if(id!=='play') clearTimeout(startLevel._tut);
  if(id==='map') renderMap();
  if(id==='shop') renderShop();
  if(id==='help') renderHelp();
  window.scrollTo({top:0,behavior:REDUCED?'auto':'smooth'});
  const h1=sc.querySelector('h1'); if(h1){ h1.tabIndex=-1; h1.focus({preventScroll:true}); }
}
$('#navMap').onclick =()=>show('map');
$('#navShop').onclick=()=>{ if(!has('shop')){toast('A Loja abre ao completar a fase 2.');return;} show('shop'); };
$('#navHelp').onclick=()=>show('help');
$('#btnBack').onclick=()=>show('map');

/* ---------------- modo desenvolvedor (7 cliques no logo) ---------------- */
(function(){
  let clicks=[];
  if(S.dev) $('#logoMark').classList.add('dev-on');
  $('#logoMark').addEventListener('click',()=>{
    const now=Date.now();
    clicks=clicks.filter(t=>now-t<3000); clicks.push(now);
    if(clicks.length>=7){
      clicks=[];
      S.dev=!S.dev; save();
      $('#logoMark').classList.toggle('dev-on', S.dev);
      toast(S.dev?'Modo desenvolvedor ativado — tudo desbloqueado.':'Modo desenvolvedor desativado.', 3000);
      if($('#screen-map').classList.contains('active')) renderMap();
    }
  });
})();

/* ---------------- mapa ---------------- */
function isUnlocked(lv){
  if(S.dev) return true;
  const i=LEVELS.indexOf(lv);
  if(i<=0) return true;
  if(S.stars[lv.id]) return true;
  if(!done(LEVELS[i-1].id)) return false;
  if(lv.boss) return totalStars()>=BOSS_STARS;
  return true;
}
function renderMap(){
  const t=$('#mapTrack'); t.innerHTML='';
  const trackStars=totalStars();
  $('#mapTitle').textContent = 'Trilha do Programador';
  const perfect=LEVELS.filter(l=>(S.stars[l.id]||0)===3).length;
  const feitas =LEVELS.filter(l=>done(l.id)).length;
  $('#mapStats').innerHTML =
    `<b>${trackStars} / ${MAX_STARS} ★</b> · ${feitas} de ${LEVELS.length} fases · ${perfect} peça(s) perfeita(s)`;
  const bossLv=LEVELS.find(l=>l.boss && !isUnlocked(l));
  if(bossLv){
    const faltamEstrelas=Math.max(0,BOSS_STARS-trackStars);
    const txt = faltamEstrelas>0
      ? `Faltam <b>${faltamEstrelas} ★</b> para o CHEFE (fase ${bossLv.id})`
      : `Estrelas suficientes — falta completar as fases até a ${bossLv.id-1} para liberar o CHEFE`;
    $('#mapStats').insertAdjacentHTML('beforeend',
      `<span class="goal"><i style="width:${Math.min(100,trackStars/BOSS_STARS*100)}%"></i></span>
       <span class="goal-txt">${txt}</span>`);
  }

  if(P && !P.won){
    const d=document.createElement('div');
    d.className='node cur'; d.tabIndex=0; d.setAttribute('role','button');
    d.innerHTML=`<div class="num">EM ANDAMENTO</div><div class="nm">Retomar</div>
      <div class="sb">${P.lv.endless?P.lv.name:'Fase '+P.lv.id+' — '+P.lv.name}</div>
      <div class="st" aria-hidden="true">▶</div>`;
    const act=()=>resumeLevel();
    d.onclick=act;
    d.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); act(); }});
    t.appendChild(d);
  }
  let curMarked=false;
  LEVELS.forEach(lv=>{
    const st=S.stars[lv.id]||0, open=isUnlocked(lv), b=S.best[lv.id];
    const cur = open && st===0 && !curMarked; if(cur) curMarked=true;
    const d=document.createElement('div');
    d.className='node'+(open?'':' locked')+(lv.boss?' boss':'')+(cur?' cur':'');
    d.style.setProperty('--i', LEVELS.indexOf(lv));
    d.tabIndex=0; d.setAttribute('role','button');
    d.setAttribute('aria-disabled', open?'false':'true');
    d.setAttribute('aria-label',`Fase ${lv.id}: ${lv.name}. ${st} de 3 estrelas.${open?'':' Bloqueada.'}`);
    d.innerHTML=`
      <div class="num">FASE ${String(lv.id).padStart(2,'0')}</div>
      <div class="nm">${lv.name}</div>
      <div class="sb">${lv.sub}</div>
      <div class="st" aria-hidden="true">${[1,2,3].map(i=>i<=st?'<b>★</b>':'☆').join('')}</div>
      ${b?`<div class="rec">⏱ ${mmss(b)}</div>`:''}
      ${lv.boss?'<div class="badge">CHEFE</div>':''}
      ${lv.boss&&!open?`<div class="gate">Requer ${BOSS_STARS} ★ — você tem ${trackStars}</div>`:''}
      ${open?'':'<div class="lock" aria-hidden="true">🔒</div>'}`;
    const act = open
      ? ()=>startLevel(lv)
      : ()=>toast(lv.boss && done(LEVELS[LEVELS.indexOf(lv)-1].id)
          ? `O CHEFE exige ${BOSS_STARS} ★. Você tem ${trackStars} — refaça fases para pegar 3 ★.`
          : 'Complete a fase anterior primeiro.', 4000);
    d.onclick=act;
    d.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); act(); }});
    t.appendChild(d);
  });

  if(has('endless')){
    const d=document.createElement('div');
    d.className='node boss'; d.tabIndex=0; d.setAttribute('role','button');
    d.innerHTML=`<div class="num">EXTRA</div><div class="nm">Modo Infinito</div>
      <div class="sb">Peças e furações aleatórias sem fim. Rodada ${S.endlessRun+1}.</div>
      <div class="st" aria-hidden="true">∞</div>
      <div class="rec">🔥 sequência ${S.streak} · recorde ${S.bestStreak}</div>
      <div class="badge">∞</div>`;
    const act=()=>startLevel(makeEndlessLevel(S.endlessRun+1));
    d.onclick=act;
    d.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); act(); }});
    t.appendChild(d);
  }
  const prox = UNLOCKS.find(u=>!has(u.id));
  $('#unlockStrip').innerHTML = UNLOCKS.map(u=>
    `<span class="uchip ${has(u.id)?'on':(u===prox?'next':'')}">${has(u.id)?'✓':(u===prox?'▶':'🔒')} ${u.name} <small>(fase ${u.lvl})</small></span>`).join('');
}

/* ---------------- colunas / valores esperados ---------------- */
function colsOf(lv){ return lv.cols; }
function rowLabel(lv,r){ const p=lv.pts[r]; return p.id || ('N'+((r+1)*10)); }
function required(lv,r,col){ const p=lv.pts[r]; return !p.req || p.req.includes(col.k); }
function isXY(col){ return col.kind==='x'||col.kind==='y'||col.kind==='dx'||col.kind==='dy'; }
function expected(lv,r,col){
  const p=lv.pts[r], pv=r>0?lv.pts[r-1]:{x:0,y:0};
  switch(col.kind){
    case 'x': return p.x;
    case 'y': return p.y;
    case 'dx': return +((p.x||0)-(pv.x||0)).toFixed(3);
    case 'dy': return +((p.y||0)-(pv.y||0)).toFixed(3);
    default: return p[col.kind];
  }
}

/* ---------------- iniciar fase ---------------- */
function startLevel(lv){
  clearTimeout(startLevel._tut);
  P={lv, tries:0, hints:0, revealed:0, borrowed:false, t0:Date.now(),
     assisted:false, safetyUsed:false, won:false, hl:-1};
  for(const k in HINT_TIER) delete HINT_TIER[k];
  $('#lvName').textContent = lv.endless ? lv.name : `Fase ${lv.id} — ${lv.name}`;
  $('#lvSub').textContent=lv.brief;
  $('#chipMode').textContent=lv.sub;
  $('#chipTry').textContent='Tentativas: 0';
  $('#tipLine').textContent=lv.tip;
  $('#feedback').textContent=''; $('#feedback').className='feedback';
  $('#hintBox').innerHTML='';
  $('#btnReveal').style.display = has('reveal')?'':'none';
  buildTable(lv);
  syncExplainBtn();
  show('play');
  resetCam();
  resize(); draw();
  cv.setAttribute('aria-label','Desenho técnico da peça.');
  clearInterval(timer);
  $('#chipTime').textContent='00:00';
  timer=setInterval(()=>{
    const s=Math.floor((Date.now()-P.t0)/1000);
    $('#chipTime').textContent=mmss(s);
  },1000);
  if(!S.tutorial && lv.id===1) startLevel._tut=setTimeout(startTutorial,420);
}
function resumeLevel(){
  if(!P) return;
  if(P.pausedAt){ P.t0 += Date.now()-P.pausedAt; P.pausedAt=0; }
  show('play'); resize(); draw();
  clearInterval(timer);
  timer=setInterval(()=>{
    const s=Math.floor((Date.now()-P.t0)/1000);
    $('#chipTime').textContent=mmss(s);
  },1000);
}

/* ---------------- tabela ---------------- */
function buildTable(lv){
  const cols=colsOf(lv), t=$('#coordTable');
  const groups=[]; cols.forEach(c=>{ const g=groups[groups.length-1];
    if(g&&g.n===c.g) g.span++; else groups.push({n:c.g,span:1}); });
  const inc = lv.kind==='contour' && (lv.modes[0]==='inc'||lv.modes[0]==='both'||lv.modes[0]==='gcode');
  const firstHdr = lv.kind==='program' ? 'Bloco' : (inc?'De → Para':'Ponto');
  let h=`<thead><tr><th rowspan="2">${firstHdr}</th>`+
        groups.map(g=>`<th class="grp" colspan="${g.span}">${g.n}</th>`).join('')+`</tr><tr>`+
        cols.map(c=>`<th>${c.h}</th>`).join('')+`</tr></thead><tbody>`;
  lv.pts.forEach((p,r)=>{
    const lbl = inc ? ((r>0?rowLabel(lv,r-1):'0')+' → '+rowLabel(lv,r)) : rowLabel(lv,r);
    h+=`<tr data-r="${r}"><td class="lbl">${lbl}</td>`+
      cols.map(c=>{
        if(!required(lv,r,c)) return `<td class="nacell">—</td>`;
        if(c.k==='g'){
          const opts = lv.kind==='program' ? GSEL_FULL : GSEL_MILL;
          return `<td><select aria-label="${lbl} — função G" data-r="${r}" data-k="g"><option value="">--</option>${opts.map(o=>`<option>${o}</option>`).join('')}</select></td>`;
        }
        if(c.k==='m'){
          return `<td><select aria-label="${lbl} — função M" data-r="${r}" data-k="m"><option value="">--</option>${MSEL.map(o=>`<option>${o}</option>`).join('')}</select></td>`;
        }
        const numeric = !STRKINDS.has(c.kind);
        return `<td><input type="text" inputmode="${numeric?'decimal':'text'}"
             enterkeyhint="next" autocomplete="off" autocorrect="off"
             autocapitalize="off" spellcheck="false" aria-label="${lbl} — ${c.h}"
             data-r="${r}" data-k="${c.k}" placeholder="?"></td>`;
      }).join('')+`</tr>`;
  });
  t.innerHTML=h+'</tbody>';
  $('#btnCheck').classList.remove('ready');

  const all=()=>[...t.querySelectorAll('input,select')];
  const lastEl=all().pop();
  if(lastEl) lastEl.setAttribute('enterkeyhint','done');
  t.querySelectorAll('input,select').forEach(el=>{
    el.addEventListener('focus',()=>{
      setHL(+el.dataset.r); assistDelta(el);
      setTimeout(()=>{
        const vv=window.visualViewport, r=el.getBoundingClientRect();
        const limite = vv ? vv.height : innerHeight;
        if(r.bottom>limite-20 || r.top<60) el.scrollIntoView({block:'center',behavior:'auto'});
      },300);
    });
    el.addEventListener('blur',()=>{
      if(P && P.hl===+el.dataset.r) setHL(-1);
      if(has('calc')) $('#tipLine').textContent=P.lv.tip;
    });
    el.addEventListener('input',()=>{
      el.classList.remove('ok','err'); el.removeAttribute('aria-invalid'); draw();
      const cheia=all().every(i=>(i.value||'').trim()!=='');
      const btn=$('#btnCheck');
      if(cheia && !btn.classList.contains('ready')){ beep(880,.07); btn.scrollIntoView({block:'nearest'}); }
      btn.classList.toggle('ready', cheia);
    });
    el.addEventListener('keydown',e=>{
      const list=all(), i=list.indexOf(el);
      if(e.key==='Enter'){ e.preventDefault(); if(i===list.length-1) check(); else list[i+1].focus(); }
      else if(e.key==='ArrowDown'||e.key==='ArrowUp'){
        e.preventDefault();
        const tr=el.closest('tr'), sib=e.key==='ArrowDown'?tr.nextElementSibling:tr.previousElementSibling;
        const n=sib && sib.querySelector(`[data-k="${el.dataset.k}"]`);
        if(n) n.focus();
      }
    });
  });
  t.querySelectorAll('tbody tr').forEach(tr=>{
    const r=+tr.dataset.r;
    if(HOVER){
      tr.addEventListener('mouseenter',()=>setHL(r));
      tr.addEventListener('mouseleave',()=>setHL(-1));
    }
    tr.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse') return;
      setHL(P && P.hl===r ? -1 : r);
    });
  });
}
function setHL(r){
  if(!P || P.hl===r) return;
  $$('#coordTable tbody tr').forEach(tr=>tr.classList.toggle('hl', +tr.dataset.r===r));
  P.hl=r; draw();
}
function assistDelta(el){
  if(!has('calc')) return;
  const k=el.dataset.k, r=+el.dataset.r;
  if(k!=='dx'&&k!=='dy') return;
  const prev = r>0?P.lv.pts[r-1]:{x:0,y:0};
  const prevLbl = r>0?rowLabel(P.lv,r-1):'origem';
  $('#tipLine').textContent=`Assistente Δ — anterior (${prevLbl}): X${fmt(prev.x||0)} Y${fmt(prev.y||0)}`;
}

/* ---------------- leitura das células ---------------- */
const cellsOf = () => $$('#coordTable input,#coordTable select');
function cellInfo(el){
  const lv=P.lv, r=+el.dataset.r, k=el.dataset.k;
  const col=lv.cols.find(c=>c.k===k);
  const exp=expected(lv,r,col), p=lv.pts[r];
  const raw=(el.value||'').trim();
  if(STRKINDS.has(col.kind)) return {el,r,k,col,p,exp,raw,val:raw,blank:!raw,ok:raw.toUpperCase()===String(exp).toUpperCase()};
  const val=parseNum(raw);
  return {el,r,k,col,p,exp,raw,val,blank:raw==='',bad:raw!==''&&isNaN(val),ok:!isNaN(val)&&Math.abs(val-exp)<=tolFor(col.kind)};
}
const firstBadCell = () => cellsOf().map(cellInfo).find(c=>!c.ok) || null;

const NUMRE=/^[+-]?(\d+(\.\d*)?|\.\d+)$/;
function parseNum(v){
  v=String(v==null?'':v).trim().toLowerCase()
     .replace(/^[xyz]\s*/,'').replace(/\s*mm$/,'')
     .replace(',','.').replace(/\s+/g,'');
  if(!NUMRE.test(v)) return NaN;
  return +v;
}

/* ---------------- linguagem didática ---------------- */
function describeMove(a,b){
  const ax=a.x||0, ay=a.y||0, bx=b.x||0, by=b.y||0;
  if(ax===bx && ay===by) return 'a ferramenta não sai do lugar.';
  if(ax===bx) return `só o eixo <b>Y</b> muda — lado reto do contorno, X continua ${fmt(bx)}.`;
  if(ay===by) return `é um <b>degrau reto</b>: só o eixo <b>X</b> muda, o Y continua ${fmt(by)}.`;
  const dx=Math.abs(bx-ax), dy=Math.abs(by-ay);
  if(b.arc) return `é um <b>raio de canto R${fmt(b.arc)}</b>: a curva desloca ${fmt(b.arc)} mm em X e ${fmt(b.arc)} mm em Y — é curva, não corte reto.`;
  if(Math.abs(dx-dy)<TOL) return `é um <b>chanfro cortado a 45°</b>: anda ${fmt(dx)} mm em X e ${fmt(dy)} mm em Y, os dois iguais.`;
  return `é um <b>trecho diagonal</b>: X e Y mudam no mesmo trecho (ΔX ${fmt(bx-ax)}, ΔY ${fmt(by-ay)}).`;
}
const GDESC={G0:'a ferramenta se desloca <b>sem cortar</b> (rápido)', G1:'a ferramenta corta em <b>linha reta</b>',
  G2:'a ferramenta corta um <b>arco no sentido horário</b>', G3:'a ferramenta corta um <b>arco no sentido anti-horário</b>',
  G40:'cancela a <b>compensação de raio</b> da ferramenta', G54:'chama o <b>zero-peça</b> 1',
  G80:'cancela o <b>ciclo fixo</b> de furação', G81:'ciclo de <b>furação simples</b>',
  G82:'ciclo de furação com <b>pausa</b> no fundo', G83:'ciclo de furação em <b>picadas</b> (quebra-cavaco)',
  G84:'ciclo de <b>rosqueamento</b>', G28:'retorna ao <b>ponto de referência</b> da máquina'};
const MDESC={M00:'parada de programa', M01:'parada opcional', M02:'fim de programa', M03:'liga o giro <b>horário</b>',
  M04:'liga o giro <b>anti-horário</b>', M05:'<b>para</b> o giro', M06:'<b>troca</b> de ferramenta',
  M08:'liga o <b>refrigerante</b>', M09:'desliga o <b>refrigerante</b>', M30:'<b>fim</b> de programa'};

function diagnose(c){
  const lv=P.lv, r=c.r, p=c.p, col=c.col, v=c.val, e=c.exp;
  const pv=r>0?lv.pts[r-1]:{x:0,y:0}, prevLbl=r>0?rowLabel(lv,r-1):'a origem', lbl=rowLabel(lv,r);
  if(c.blank) return {code:'vazio', msg:`A célula <b>${col.h}</b> da linha <b>${lbl}</b> está vazia.`+(isXY(col)?` De ${prevLbl} para ${lbl} ${describeMove(pv,p)}`:'')};
  if(c.bad) return {code:'formato', msg:`O valor digitado em <b>${lbl}</b> não é um número. Use só dígitos, ponto ou vírgula e o sinal (ex.: <b>-12</b>).`};
  if(col.kind==='g') return {code:'gcode', msg:`No bloco <b>${lbl}</b> ${GDESC[e]||'a ferramenta se move'} → <b>${e}</b>.`};
  if(col.kind==='m') return {code:'mcode', msg:`No bloco <b>${lbl}</b>, <b>${e}</b> ${MDESC[e]||''}.`};
  const twinK={x:'y',y:'x',dx:'dy',dy:'dx'}[col.kind];
  if(twinK){
    const twinCol=lv.cols.find(cc=>cc.kind===twinK);
    if(twinCol && required(lv,r,twinCol) && eq(v, expected(lv,r,twinCol))) return {code:'inverteu',
      msg:`Em <b>${lbl}</b> os eixos foram trocados: <b>${fmt(v)}</b> é o valor de <b>${twinCol.h}</b>. X é o eixo horizontal do plano; Y é o vertical.`};
  }
  if(e!==0 && !isNaN(e) && eq(v,-e)){
    let expl;
    if(col.kind==='x'||col.kind==='y') expl=`Esse ponto fica do lado <b>${e<0?'negativo':'positivo'}</b> do eixo ${col.kind==='x'?'X':'Y'} → <b>${fmt(e)}</b>.`;
    else if(col.kind==='dx'||col.kind==='dy') expl=`Confira o sentido do deslocamento: aqui o eixo ${col.kind==='dx'?'X':'Y'} ${e>0?'aumenta':'diminui'}, então o Δ é <b>${e>0?'positivo':'negativo'}</b>.`;
    else if(col.kind==='z') expl=`Z <b>negativo</b> é dentro do material; Z <b>positivo</b> é ainda no ar, acima da peça.`;
    else expl=`Confira o sinal — aqui o valor certo é <b>${fmt(e)}</b>.`;
    return {code:'sinal', msg:`Em <b>${lbl}</b> o número está certo, o <b>sinal</b> não. `+expl};
  }
  if(col.kind==='x'||col.kind==='y'){
    const dCol=lv.cols.find(cc=>cc.kind===(col.kind==='x'?'dx':'dy'));
    if(dCol && required(lv,r,dCol) && eq(v, expected(lv,r,dCol))) return {code:'incAbs',
      msg:`Você escreveu quanto a ferramenta <b>andou</b> desde ${prevLbl}. A coluna absoluta pede a posição a partir do zero-peça: ${fmt(col.kind==='x'?(pv.x||0):(pv.y||0))} ${v>=0?'+':'−'} ${fmt(Math.abs(v))} = <b>${fmt(e)}</b>.`};
  }
  if(col.kind==='dx'||col.kind==='dy'){
    const xCol=lv.cols.find(cc=>cc.kind===(col.kind==='dx'?'x':'y'));
    if(xCol && required(lv,r,xCol) && eq(v, expected(lv,r,xCol))) return {code:'absInc',
      msg:`Você repetiu a coordenada <b>absoluta</b>. A coluna Δ pede a <b>diferença</b> para a linha de cima: ${fmt(p[col.kind==='dx'?'x':'y'])} − ${fmt(pv[col.kind==='dx'?'x':'y']||0)} = <b>${fmt(e)}</b>.`};
  }
  if(r>0 && required(lv,r-1,col) && eq(v, expected(lv,r-1,col))) return {code:'linha',
    msg:`Em <b>${lbl}</b> o valor <b>${fmt(v)}</b> é o mesmo da linha de cima. `+(isXY(col)?`De ${prevLbl} para ${lbl} ${describeMove(pv,p)}`:'Confira se essa linha realmente repete o valor anterior.')};
  if(col.kind==='r' && p.z!=null && eq(v,p.z)) return {code:'rz',
    msg:`Você digitou a profundidade <b>Z</b> no lugar do plano <b>R</b>. R é a folga ANTES de furar (positivo); Z é o fundo do furo (negativo).`};
  if(col.kind==='z' && p.r!=null && eq(v,p.r)) return {code:'zr',
    msg:`Você digitou o plano <b>R</b> no lugar da profundidade <b>Z</b>. Z é o fundo do furo, sempre negativo.`};
  if(col.kind==='q' && p.z!=null && eq(Math.abs(v),Math.abs(p.z))) return {code:'qz',
    msg:`<b>Q</b> é a profundidade de CADA picada, não o furo inteiro. A profundidade total é Z${fmt(p.z)}; Q é só o incremento por passe.`};
  if(col.kind==='f' && p.s!=null && eq(v,p.s)) return {code:'fs',
    msg:`Você confundiu <b>F</b> (avanço, mm/min) com <b>S</b> (rotação, rpm). São grandezas diferentes.`};
  return {code:'geral', msg:`Linha <b>${lbl}</b>, coluna <b>${col.h}</b>: ${p.note?p.note:(isXY(col)?describeMove(pv,p):'confira o valor correspondente no processo.')}`};
}
const TYPE_LBL={vazio:'campo em branco', formato:'formato inválido', sinal:'sinal trocado', inverteu:'X trocado com Y',
  incAbs:'incremental na coluna absoluta', absInc:'absoluto na coluna Δ', linha:'copiou a linha anterior',
  gcode:'função G errada', mcode:'função M errada', rz:'Z no lugar de R', zr:'R no lugar de Z',
  qz:'profundidade total no lugar da picada', fs:'avanço trocado com rotação', geral:'valor fora da medida'};

/* ---------------- verificação ---------------- */
$('#btnCheck').onclick=check;
function check(){
  if(P.won) return;
  const cols=colsOf(P.lv);
  $$('#coordTable thead th').forEach(th=>th.classList.remove('colbad'));
  const infos=cellsOf().map(cellInfo);
  infos.forEach(c=>{
    c.el.classList.toggle('ok',c.ok); c.el.classList.toggle('err',!c.ok);
    c.el.setAttribute('aria-invalid', c.ok?'false':'true');
    c.el.title = c.ok?'Correto':'Valor incorreto';
  });
  draw();
  const bad=infos.filter(c=>!c.ok);
  const fb=$('#feedback');
  if(!bad.length){ if(animActive) return; playMachining(()=>win()); return; }
  if(bad.length===infos.length && bad.every(c=>c.blank)){
    fb.className='feedback bad';
    fb.textContent='Preencha a tabela antes de verificar — esta não conta como tentativa.';
    sndErr(); return;
  }
  P.tries++;
  $('#chipTry').textContent='Tentativas: '+P.tries;
  sndErr(); syncExplainBtn();

  const byCol={}, byType={};
  bad.forEach(c=>{ byCol[c.k]=(byCol[c.k]||0)+1; const d=diagnose(c); c._d=d; byType[d.code]=(byType[d.code]||0)+1; });
  const worst=Object.entries(byCol).sort((a,b)=>b[1]-a[1])[0];
  const worstCol=cols.find(c=>c.k===worst[0]);
  $$('#coordTable thead tr:nth-child(2) th').forEach((th,i)=>
    th.classList.toggle('colbad', !!(cols[i] && cols[i].k===worst[0])));
  const top=Object.entries(byType).filter(([k])=>k!=='geral'&&k!=='vazio').sort((a,b)=>b[1]-a[1])[0];
  fb.className='feedback bad';
  fb.innerHTML = `<b>${bad.length} célula(s) para revisar.</b> A coluna <b>${worstCol?worstCol.h:worst[0]}</b> concentra ${worst[1]}.`
    + (top?`<br>Padrão detectado: <b>${TYPE_LBL[top[0]]}</b> (${top[1]}×).`:'')
    + `<br>${bad[0]._d.msg}`;
}
function syncExplainBtn(){
  const b=$('#btnExplain'), falta=3-P.tries;
  b.disabled=false;
  b.dataset.locked = falta>0 ? '1' : '';
  b.classList.toggle('locked-soft', falta>0);
  b.textContent = falta>0 ? `Explicar (${falta})` : 'Explicar';
  b.title = falta>0 ? `Abre depois de ${falta} tentativa(s).` : 'Passo a passo completo desta peça.';
}

/* ---------------- dicas adaptativas ---------------- */
$('#btnHint').onclick=()=>{
  const box=$('#hintBox'), c=firstBadCell();
  if(!c){ toast('Não há nada errado na tabela — clique em Verificar!'); return; }
  const key=c.r+'|'+c.k, tier=HINT_TIER[key]||0;
  let txt, custa=true, titulo='Dica';

  if(tier===0){
    custa=false; titulo='Onde olhar';
    txt=`Olhe a linha <b>${rowLabel(P.lv,c.r)}</b>, coluna <b>${c.col.h}</b>. ${APONTE}: a linha acende na tabela.`;
  }else if(tier===1){
    txt=diagnose(c).msg;
  }else{
    const extra=P.lv.hints[Math.min(tier-2, P.lv.hints.length-1)];
    txt=`<i>${extra}</i>`;
  }
  if(custa){
    if(S.hints>0){ S.hints--; save(); hud(); P.hints++; }
    else { P.borrowed=true; toast('Dica emprestada: sem ficha 💡, esta fase vale 1 ★. Compre um pacote na Loja (40 🪙).',4200); }
  }
  HINT_TIER[key]=tier+1;
  const d=document.createElement('div');
  d.className='hint'; d.innerHTML=`<b>${titulo}:</b> ${txt}`;
  box.appendChild(d); d.scrollIntoView({block:'nearest'}); beep(760,.1);
};

/* ---------------- revelar célula ---------------- */
$('#btnReveal').onclick=()=>{
  if(S.coins<REVEAL_COST){ toast(`Faltam moedas (custa ${REVEAL_COST} 🪙).`); return; }
  const c=firstBadCell();
  if(!c){ toast('Nada para revelar — está tudo certo, clique em Verificar!'); return; }
  c.el.value = STRKINDS.has(c.col.kind)?c.exp:fmt(c.exp);
  c.el.classList.add('given','ok'); c.el.classList.remove('err'); c.el.setAttribute('aria-invalid','false');
  S.coins-=REVEAL_COST; P.revealed++; save(); hud(); sndCoin(); draw();
  toast(`Célula ${rowLabel(P.lv,c.r)} revelada. −${REVEAL_COST} 🪙 · a fase agora vale no máximo ${P.revealed>2?1:2} ★`,3400);
};

/* ---------------- explicação ---------------- */
function explainRows(lv){
  return lv.pts.map((p,r)=>{
    const pv=r>0?lv.pts[r-1]:{x:0,y:0};
    const lbl=rowLabel(lv,r), prevLbl=r>0?rowLabel(lv,r-1):'a origem';
    const bits=[];
    if(lv.kind==='contour'){
      bits.push(`<b>O trecho:</b> de ${prevLbl} para ${lbl} ${describeMove(pv,p)}`);
      if(p.safe) bits.push('<b>Onde ler:</b> este ponto não está no desenho — é o ponto de aproximação, longe da peça (X e Y bem afastados, geralmente negativos).');
      lv.cols.forEach(c=>{
        if(!required(lv,r,c)) return;
        if(c.kind==='g') bits.push(`<b>A função:</b> <em>${p.g}</em> — ${GDESC[p.g]||''}.`);
        else if(c.kind==='x') bits.push(`<b>X:</b> a posição no plano nesse ponto → <em>X${fmt(p.x)}</em>.`);
        else if(c.kind==='y') bits.push(`<b>Y:</b> a posição no plano nesse ponto → <em>Y${fmt(p.y)}</em>.`);
        else if(c.kind==='dx'||c.kind==='dy'){
          const cur=c.kind==='dx'?(p.x||0):(p.y||0), prev=c.kind==='dx'?(pv.x||0):(pv.y||0), d=+(cur-prev).toFixed(3);
          bits.push(`<b>Δ${c.kind==='dx'?'X':'Y'}:</b> ${fmt(cur)} − ${fmt(prev)} = <em>${fmt(d)}</em>`);
        }
      });
      if(p.arc) bits.push(`<b>R:</b> o raio de canto vale <em>${fmt(p.arc)}</em>.`);
    } else {
      bits.push(p.note ? '<b>O que este bloco faz:</b> '+p.note : '<b>Bloco do programa.</b>');
      lv.cols.forEach(c=>{
        if(!required(lv,r,c)) return;
        const val=p[c.kind];
        const desc = c.kind==='g'?(GDESC[val]||'') : c.kind==='m'?(MDESC[val]||'') : '';
        bits.push(`<b>${c.h}:</b> <em>${val}</em>${desc?' — '+desc:''}`);
      });
    }
    return `<div class="exrow"><b>${lbl}</b><br>${bits.join('<br>')}</div>`;
  }).join('');
}
$('#btnExplain').onclick=()=>{
  if($('#btnExplain').dataset.locked){
    toast(`Tente primeiro! O passo a passo abre depois de mais ${3-P.tries} tentativa(s). Enquanto isso use a Dica — o nível 1 é grátis.`,4600);
    return;
  }
  $('#explainBody').innerHTML =
    `<h4>Regras que resolvem esta fase</h4><div class="exrow">${P.lv.tip}</div>
     <h4>Bloco a bloco</h4>${explainRows(P.lv)}`;
  openModal('#modalExplain');
};
$('#expClose').onclick=()=>closeModal('#modalExplain');
$('#expFill').onclick=()=>{
  if(!confirm('Isso preenche a tabela inteira e fecha a fase com 1 ★ (de 3). Você pode repetir a fase depois para recuperar as estrelas. Continuar?')) return;
  cellsOf().forEach(el=>{
    const col=P.lv.cols.find(c=>c.k===el.dataset.k);
    const exp=expected(P.lv,+el.dataset.r,col);
    el.value = STRKINDS.has(col.kind)?exp:fmt(exp);
    el.classList.add('given'); el.classList.remove('err');
  });
  P.assisted=true; closeModal('#modalExplain'); draw();
  toast('Tabela preenchida. Leia as explicações e clique em Verificar — esta fase vale 1 ★.',4200);
};

/* ---------------- vitória ---------------- */
function starsFor(){
  if(P.assisted) return 1;
  let tries=P.tries;
  if(has('safety') && tries>0 && !P.safetyUsed){ tries--; P.safetyUsed=true; }
  let st = (tries===0 && P.hints===0) ? 3 : (tries<=2 && P.hints<=2) ? 2 : 1;
  if(P.revealed>2) st=1;
  else if(P.revealed>0) st=Math.min(2,st);
  if(P.borrowed) st=1;
  return st;
}
function win(){
  if(P.won) return;
  P.won=true;
  clearInterval(timer); timer=null;
  sndWin(); if(!REDUCED) confetti();
  const lv=P.lv, st=starsFor();
  if(st===3 && has('fanfare')){
    setTimeout(()=>{ sndWin(); if(!REDUCED) confetti(); },550);
  }
  const secs=Math.floor((Date.now()-P.t0)/1000);
  const clean = !P.assisted && P.revealed===0;
  let coins=20+st*15, xp=40+st*20+(lv.boss?120:0), first=false, recorde=false;

  if(lv.endless){
    if(st===3){ S.streak++; if(S.streak>S.bestStreak) S.bestStreak=S.streak; } else S.streak=0;
    S.endlessRun++;
    coins = P.assisted?0:8+6*st+Math.min(S.streak,6)*3;
    xp    = P.assisted?0:15+15*st;
  }else{
    const prev=S.stars[lv.id]||0;
    first = prev===0;
    if(st>prev) S.stars[lv.id]=st;
    if(!first || P.assisted){ coins=Math.round(coins*.3); xp=Math.round(xp*.3); }
    if(clean && (!S.best[lv.id] || secs<S.best[lv.id])){ recorde=!!S.best[lv.id]; S.best[lv.id]=secs; }
  }
  S.coins+=coins; S.xp+=xp; S.hints+=first?2:0;
  const newly=[];
  UNLOCKS.forEach(u=>{ if(!S.unlocked.includes(u.id) && (S.stars[u.lvl]||0)>0){
    if(u.id.startsWith('th_') && S.owned.includes(u.id)){
      const th=THEMES.find(t=>'th_'+t.t===u.id);
      if(th){ S.coins+=th.price; toast(`${th.name} veio de graça na fase ${u.lvl} — ${th.price} 🪙 devolvidos.`,4200); }
      S.owned=S.owned.filter(x=>x!==u.id);
    }
    S.unlocked.push(u.id); newly.push(u);
  }});
  save(); hud();

  $('#resStars').setAttribute('aria-label', st+' de 3 estrelas');
  $$('#resStars span').forEach((s,i)=>{ const on=i<st; s.classList.toggle('on',on); s.textContent=on?'★':'☆'; });
  $('#resLine').textContent = st===3?'PEÇA PERFEITA' : st===2?'DENTRO DA TOLERÂNCIA' : 'APROVADA COM RESSALVA';
  $('#resTitle').textContent = st===3?'Peça perfeita!' : st===2?'Peça aprovada!' : 'Passou no controle';
  $('#resText').textContent =
    (lv.endless?'Rodada concluída':'Fase concluída') + ` em ${mmss(secs)} · ` +
    (P.tries===0&&P.hints===0 ? 'sem erros, sem dicas.' : `${P.tries} tentativa(s) · ${P.hints} dica(s) paga(s).`);
  $('#resRewards').innerHTML =
    `<span class="rw">+${xp} XP</span><span class="rw">+${coins} 🪙</span>`+
    (first?'<span class="rw">+2 💡</span>':'')+
    (recorde?'<span class="rw">⏱ NOVO RECORDE</span>':'')+
    (lv.endless&&S.streak>1?`<span class="rw">🔥 sequência ${S.streak}</span>`:'')+
    (!first&&!lv.endless?'<span class="rw dim">30% (repetição)</span>':'');
  const rk=rankOf(S.xp), nxr=nextRank(S.xp);
  const pctR = nxr ? Math.round((S.xp-rk[0])/(nxr[0]-rk[0])*100) : 100;
  const bst = S.best[lv.id];
  const bossLv = LEVELS.find(l=>l.boss && !isUnlocked(l));
  const proxU  = UNLOCKS.find(u=>!has(u.id));
  const faltamEstrelas = bossLv ? Math.max(0,BOSS_STARS-totalStars()) : 0;
  const meta = bossLv ? (faltamEstrelas>0
               ? `Faltam <b>${faltamEstrelas} ★</b> para liberar o CHEFE (fase ${bossLv.id}).`
               : `Estrelas suficientes — falta completar as fases até a ${bossLv.id-1} para liberar o CHEFE.`)
             : proxU  ? `Próximo desbloqueio: <b>${proxU.name}</b> na fase ${proxU.lvl}.` : '';
  $('#resProg').innerHTML =
    `<div class="rp-rank"><span>${rk[1]}</span><span>${nxr?`faltam ${nxr[0]-S.xp} XP → ${nxr[1]}`:'patente máxima'}</span></div>
     <div class="rp-bar"><i style="width:${pctR}%"></i></div>`
    + (!lv.endless && bst ? `<div class="rp-line">⏱ ${mmss(secs)} agora · recorde <b>${mmss(bst)}</b>${
        recorde?' — <b style="color:var(--ok)">novo recorde!</b>' : (secs>bst?` (${mmss(secs-bst)} a mais)`:'')}</div>` : '')
    + (meta?`<div class="rp-line">${meta}</div>`:'');
  const coinsAntes=S.coins-coins;
  countUp($('#coinTxt'), coinsAntes, S.coins);
  const cstat=$('#coinTxt').closest('.stat');
  cstat.classList.remove('bump'); void cstat.offsetWidth; cstat.classList.add('bump');
  const last = !lv.endless && LEVELS.indexOf(lv)===LEVELS.length-1;
  $('#resNext').textContent = lv.endless?'Próxima peça ›' : last?'Ver conclusão ›':'Próxima fase ›';
  openModal('#modalResult');

  $('#resNext').onclick=()=>{
    closeModal('#modalResult');
    if(newly.length) showUnlocks(newly);
    else nextLevel();
  };
  $('#resRepeat').textContent = lv.endless?'Outra peça':'Repetir';
  $('#resRepeat').onclick=()=>{ closeModal('#modalResult'); startLevel(lv.endless?makeEndlessLevel(S.endlessRun+1):lv); };
}
function nextLevel(){
  const lv=P.lv;
  if(lv.endless){ startLevel(makeEndlessLevel(S.endlessRun+1)); return; }
  const i=LEVELS.indexOf(lv), nx=LEVELS[i+1];
  if(nx && isUnlocked(nx)) startLevel(nx);
  else if(nx){ show('map'); toast(`O CHEFE exige ${BOSS_STARS} ★. Você tem ${totalStars()} — refaça fases para pegar 3 ★.`,4500); }
  else showFinish();
}
function showFinish(){
  const perfeitas=LEVELS.filter(l=>(S.stars[l.id]||0)===3);
  const faltam=LEVELS.filter(l=>(S.stars[l.id]||0)<3);
  const tot=totalStars(), pct=Math.round(tot/MAX_STARS*100);
  const soma=LEVELS.reduce((a,l)=>a+(S.best[l.id]||0),0);
  $('#modalUnlock').classList.add('finish');
  $('#unTitle').textContent='Fim da trilha';
  $('#unBody').innerHTML=`
    <div class="diploma">
      <div class="dip-seal">⌖</div>
      <div class="dip-kick">CERTIFICADO DE CONCLUSÃO</div>
      <div class="dip-name">${rankOf(S.xp)[1]}</div>
      <div class="dip-sub">${LEVELS.length} fases concluídas · ${S.xp} XP</div>
      <div class="dip-bar"><i style="width:${pct}%"></i></div>
      <div class="dip-nums">
        <span><b>${tot}</b><small>de ${MAX_STARS} ★</small></span>
        <span><b>${perfeitas.length}</b><small>peças perfeitas</small></span>
        <span><b>${soma?mmss(soma):'—'}</b><small>soma dos recordes</small></span>
      </div>
    </div>`
    + (faltam.length
      ? `<h4>Ainda dá para platinar</h4><div class="exrow">Sem 3 ★: ${faltam.map(l=>`fase ${l.id} ${l.name}`).join(' · ')}.</div>`
      : `<div class="exrow"><b>Platinado.</b> Todas as peças perfeitas — não sobrou nada para o inspetor reclamar.</div>`)
    + (has('endless')?`<div class="exrow">O <b>Modo Infinito</b> continua no mapa, com peças e furações novas a cada rodada.</div>`:'');
  openModal('#modalUnlock');
  sndWin(); if(!REDUCED){ confetti(); setTimeout(confetti,700); }
  $('#unClose').textContent='Voltar ao mapa';
  $('#unClose').onclick=()=>{ closeModal('#modalUnlock'); show('map'); };
}
function showUnlocks(list){
  $('#modalUnlock').classList.remove('finish'); $('#unClose').textContent='Beleza';
  $('#unTitle').textContent = list.length>1?'Novidades desbloqueadas!':'Desbloqueado!';
  $('#unBody').innerHTML = list.map(u=>`<div class="exrow"><b>${u.name}</b><br>${u.desc}</div>`).join('');
  openModal('#modalUnlock'); sndCoin();
  $('#unClose').onclick=()=>{ closeModal('#modalUnlock'); nextLevel(); };
}

/* ---------------- modais ---------------- */
let lastFocus=null;
function setInert(v){ $('#topbar').inert=v; $('#app').inert=v; }
function openModal(sel){
  lastFocus=document.activeElement;
  document.body.style.overflow='hidden';
  setInert(true);
  $('#overlay').classList.add('on');
  const m=$(sel); m.classList.add('on');
  (m.querySelector('.btn.primary')||m.querySelector('.btn')||m).focus();
}
function closeModal(sel){
  document.body.style.overflow=''; setInert(false);
  $('#overlay').classList.remove('on'); $(sel).classList.remove('on');
  if(lastFocus&&document.contains(lastFocus)) lastFocus.focus();
}
$('#overlay').onclick=()=>{
  if($('#modalResult').classList.contains('on')||$('#modalUnlock').classList.contains('on')) return;
  document.body.style.overflow=''; setInert(false);
  $('#overlay').classList.remove('on'); $$('.modal').forEach(m=>m.classList.remove('on'));
  if(lastFocus&&document.contains(lastFocus)) lastFocus.focus();
};

/* ---------------- loja ---------------- */
function renderShop(){
  const tools = SHOP.map(it=>{
    const owned = !it.repeat && has(it.id);
    return `<div class="card ${owned?'owned':''}">
      <h3>${it.name}</h3><p>${it.desc}</p>
      ${owned?`<button class="btn" disabled>Adquirido ✓</button>`
             :`<button class="btn primary" data-buy="${it.id}">Comprar <span class="price">${it.price} 🪙</span></button>`}
    </div>`;
  }).join('');
  const themes = THEMES.map(th=>{
    const id='th_'+th.t;
    const owned = th.price===0 || has(id);
    const active = S.theme===th.t;
    const gratisEm = th.unlock ? UNLOCKS.find(u=>u.id===th.unlock) : null;
    return `<div class="card ${owned?'owned':''}">
      <h3>${th.name}</h3><p>${th.desc}</p>
      ${owned?`<button class="btn ${active?'primary':''}" data-use="${th.t}">${active?'Em uso':'Usar tema'}</button>`
             :`<button class="btn primary" data-buy-theme="${th.t}">Comprar <span class="price">${th.price} 🪙</span></button>
               ${gratisEm?`<p style="margin:8px 0 0;font-size:12px">Grátis ao completar a fase ${gratisEm.lvl}.</p>`:''}`}
    </div>`;
  }).join('');
  $('#shopGrid').innerHTML = `<h2 class="shop-sec">Ferramentas</h2>${tools}<h2 class="shop-sec">Temas</h2>${themes}`;

  $$('#shopGrid [data-buy]').forEach(b=>b.onclick=()=>{
    const it=SHOP.find(i=>i.id===b.dataset.buy);
    if(S.coins<it.price){ toast('Moedas insuficientes.'); sndErr(); return; }
    S.coins-=it.price;
    if(it.id==='pack') S.hints+=3; else S.owned.push(it.id);
    save(); hud(); renderShop(); sndCoin(); toast(it.name+' adquirido!');
  });
  $$('#shopGrid [data-buy-theme]').forEach(b=>b.onclick=()=>{
    const th=THEMES.find(t=>t.t===b.dataset.buyTheme);
    if(S.coins<th.price){ toast('Moedas insuficientes.'); sndErr(); return; }
    S.coins-=th.price; S.owned.push('th_'+th.t); S.theme=th.t;
    save(); hud(); renderShop(); sndCoin(); toast('Tema '+th.name+' em uso!');
  });
  $$('#shopGrid [data-use]').forEach(b=>b.onclick=()=>{
    S.theme=b.dataset.use; save(); hud(); renderShop(); draw();
  });
}

/* ---------------- manual ---------------- */
function renderHelp(){
  $('#helpGrid').innerHTML = `
  <div class="card"><h3>Os eixos do centro de usinagem</h3><ul>
    <li><code>X, Y</code> = posição da ferramenta no plano da peça, vista de cima.</li>
    <li><code>Z</code> = profundidade. Z0 é a face de cima; Z negativo entra no material.</li>
    <li>Sem diâmetro: X e Y são só posição — podem ser negativos.</li>
    <li>Ponto de aproximação fica fora da peça, longe do contorno.</li></ul></div>
  <div class="card"><h3>Absoluta × Incremental</h3><ul>
    <li><b>Absoluta (G90)</b>: tudo medido a partir do zero-peça W.</li>
    <li><b>Incremental (G91)</b>: quanto a ferramenta andou desde o ponto anterior.</li>
    <li><code>ΔX = X − X anterior</code> · <code>ΔY = Y − Y anterior</code></li></ul></div>
  <div class="card"><h3>Chanfro e raio de canto</h3><ul>
    <li>Chanfro <code>C x45°</code>: anda <code>C</code> mm em X e <code>C</code> mm em Y ao mesmo tempo.</li>
    <li>Raio de canto <code>R</code>: desloca <code>R</code> mm em X e <code>R</code> mm em Y (é curva, não corte reto).</li>
    <li>Leitura rápida: só X muda → lado reto em X · só Y muda → lado reto em Y · os dois iguais → 45° · proporções diferentes → diagonal.</li></ul></div>
  <div class="card"><h3>Funções G básicas</h3><ul>
    <li><code>G0</code> rápido, sem cortar. <code>G1</code> avanço de trabalho.</li>
    <li><code>G2/G3</code> arco horário/anti-horário.</li>
    <li><code>G17/G18/G19</code> plano XY/XZ/YZ (padrão G17). <code>G40/G41/G42</code> cancela/liga compensação de raio.</li>
    <li><code>G90/G91</code> absoluto/incremental · <code>G54</code> zero-peça · <code>G04</code> pausa (X = segundos).</li></ul></div>
  <div class="card"><h3>Funções M</h3><ul>
    <li><code>M00/M01</code> parada (obrigatória/opcional) · <code>M02/M30</code> fim de programa.</li>
    <li><code>M03/M04/M05</code> giro horário/anti-horário/parado.</li>
    <li><code>M06</code> troca de ferramenta (com <code>T</code>) · <code>M08/M09</code> refrigerante ligado/desligado.</li></ul></div>
  <div class="card"><h3>Ciclos fixos de furação</h3><ul>
    <li><code>G80</code> cancela o ciclo ativo.</li>
    <li><code>G81 X Y Z R F</code> furação simples: rápido até R, avanço até Z, recuo rápido.</li>
    <li><code>G82 X Y Z R P F</code> igual ao G81, com pausa <code>P</code> segundos no fundo.</li>
    <li><code>G83 X Y Z R Q F</code> furação em picadas de <code>Q</code> mm (quebra-cavaco, furo fundo).</li>
    <li><code>G84 X Y Z R F</code> rosqueamento: <code>F = S × passo</code> da rosca.</li>
    <li><code>G85/G86 X Y Z R F</code> mandrilamento (acabamento de furo).</li>
    <li><b>Modal:</b> chamado uma vez com todos os parâmetros, o ciclo repete a cada novo X/Y até vir um <code>G80</code>.</li>
    <li>Em controles Siemens/Mach9 os nomes de ciclo mudam (ex.: <code>CYCLE81</code>), mas a lógica de plano R, profundidade e avanço é a mesma.</li></ul></div>
  <div class="card"><h3>Fórmulas de corte</h3><ul>
    <li>Velocidade de corte: <code>Vc = π·D·N / 1000</code> (m/min).</li>
    <li>Rotação: <code>N = 1000·Vc / (π·D)</code> (rpm) — D é o diâmetro da ferramenta.</li>
    <li>Avanço de fresamento: <code>Vf = fz · z · N</code> (mm/min) — fz = avanço por dente, z = nº de dentes.</li>
    <li>Rosqueamento: <code>F = N × passo</code> da rosca (mm/min).</li></ul></div>
  <div class="card"><h3>Estrutura de um programa</h3><ul>
    <li>Chamada de ferramenta (<code>T.. M06</code>) → zero-peça e giro (<code>G54 S.. M03</code>).</li>
    <li>Posiciona rápido (<code>G0 X Y</code>) → aproxima com refrigerante (<code>G0 Z.. M08</code>).</li>
    <li>Usina (<code>G1</code> ou ciclo de furação) → cancela compensação/ciclo (<code>G40</code>/<code>G80</code>).</li>
    <li>Recua, refrigerante fora (<code>M09</code>) → retorno seguro, giro parado (<code>G28 M05</code>) → fim (<code>M30</code>).</li></ul></div>
  <div class="card"><h3>Exemplo resolvido</h3>
    <p>Contorno com um degrau, zero-peça na quina inicial:</p><ul>
    <li><b>A</b> zero-peça → <code>X0 Y0</code></li>
    <li><b>B</b> andou em X → <code>X30 Y0</code></li>
    <li><b>C</b> subiu em Y → <code>X30 Y20</code></li>
    <li><b>D</b> degrau: sobe X sem mudar Y → <code>X50 Y20</code></li>
    <li><b>E</b> fim do contorno → <code>X50 Y40</code></li></ul>
    <p><b>Fechamento:</b> ΣΔX = 50 (último X) e ΣΔY = 40 (último Y). Se não fecha, o erro está entre duas linhas.</p></div>
  <div class="card"><h3>Erros clássicos</h3><ul>
    <li>Trocar as colunas X e Y.</li>
    <li>Esquecer o sinal (pontos do outro lado do zero-peça, ou Z positivo/negativo).</li>
    <li>No degrau reto mudar os dois eixos (só um muda).</li>
    <li>Digitar Z no lugar de R (ou o contrário) num ciclo de furação.</li>
    <li>Confundir a profundidade total do furo com a picada Q do G83.</li>
    <li>Esquecer que o ciclo é modal e repetir X/Y/Z/R sem necessidade — ou, ao contrário, esquecer que furos modais só precisam de X e Y.</li></ul></div>
  <div class="card"><h3>Ajuda e estrelas</h3><ul>
    <li>3 ★ = acertou de primeira, sem dica paga.</li>
    <li><b>Dica</b> nível 1 é sempre grátis (mostra onde olhar); aprofundar gasta 💡.</li>
    <li>2 ★ = até 2 tentativas e até 2 dicas pagas.</li>
    <li><b>Revelar célula</b> limita a 2 ★ (da terceira revelação em diante, 1 ★); <b>ver a resposta</b>, 1 ★.</li>
    <li>Pedir dica sem ter ficha 💡 ("dica emprestada") fecha a fase em 1 ★.</li>
    <li>Após 3 tentativas o botão <b>Explicar</b> abre o passo a passo.</li>
    <li>Fase repetida rende 30% da recompensa.</li></ul>
    <button class="btn" id="helpTutor">Rever o tutorial (fase 1)</button></div>
  <div class="card"><h3>Progresso salvo</h3>
    <p>O progresso fica guardado só neste atalho/navegador. Se apagar o ícone da tela de início, ele vai junto — exporte de vez em quando.</p>
    <div class="actions" style="padding:0;border:0">
      <button class="btn" id="btnExport">Exportar save</button>
      <button class="btn" id="btnImport">Importar save</button>
      <button class="btn danger" id="btnReset">Zerar progresso</button>
    </div><input type="file" id="fileImport" accept="application/json" style="display:none"></div>`;

  $('#helpTutor').onclick=()=>{ startLevel(LEVELS[0]); clearTimeout(startLevel._tut); startTutorial(); };
  $('#btnExport').onclick=async ()=>{
    const json=JSON.stringify(S,null,1);
    try{
      const file=new File([json],'usinagem-cnc-save.json',{type:'application/json'});
      if(navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({files:[file], title:'Save Centro de Usinagem CNC'});
        toast('Save exportado.'); return;
      }
    }catch(e){ if(e && e.name==='AbortError') return; }
    const a=document.createElement('a'), url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
    a.href=url; a.download='usinagem-cnc-save.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('Save exportado.');
  };
  $('#btnImport').onclick=()=>$('#fileImport').click();
  $('#fileImport').onchange=e=>{
    const f=e.target.files[0]; if(!f) return;
    const rd=new FileReader();
    rd.onload=()=>{
      let raw; try{ raw=JSON.parse(rd.result); }catch(err){ toast('Arquivo inválido.'); return; }
      if(!raw || typeof raw!=='object' || Array.isArray(raw) || !('xp' in raw || 'stars' in raw)){
        toast('Isso não parece um save do jogo.'); return; }
      if(!confirm(`Importar substitui o progresso atual (${totalStars()}★, ${S.coins} moedas). Continuar?`)) return;
      S=sanitize(raw); P=null; save(); hud(); renderHelp(); toast('Progresso importado!');
    };
    rd.readAsText(f);
  };
  $('#btnReset').onclick=()=>{
    if(!confirm('Isso apaga estrelas, moedas, XP e desbloqueios. Não dá para desfazer. Continuar?')) return;
    S={...DEF, stars:{}, best:{}, unlocked:[], owned:[]}; P=null; save(); hud(); renderHelp(); toast('Progresso zerado.');
  };
}

/* =========================================================================
   DESENHO TÉCNICO (vista de topo, plano XY)
   ========================================================================= */
const cv=$('#cv'), ctx=cv.getContext('2d'), cvWrap=$('.cv-wrap');
const CVFONT='-apple-system, system-ui, "Segoe UI", Roboto, sans-serif';
const HIT=[];
function selectAt(clientX,clientY){
  if(!P || !HIT.length) return;
  const b=cv.getBoundingClientRect();
  const px=(clientX-b.left-cam.tx)/cam.zoom, py=(clientY-b.top-cam.ty)/cam.zoom;
  let best=null, bd=Infinity;
  HIT.forEach(h=>{ const d=(h.x-px)**2+(h.y-py)**2; if(d<bd){bd=d; best=h;} });
  if(!best || bd>(46/cam.zoom)*(46/cam.zoom)){ setHL(-1); return; }
  setHL(P.hl===best.r ? -1 : best.r);
  const el=document.querySelector(`#coordTable [data-r="${best.r}"]`);
  if(el) el.scrollIntoView({block:'nearest',behavior:REDUCED?'auto':'smooth'});
}

const cam={zoom:1, tx:0, ty:0};
const ZMIN=1, ZMAX=6;
function resetCam(){ cam.zoom=1; cam.tx=0; cam.ty=0; updateZoomUI(); }
function clampPan(){
  const W=cv.clientWidth, H=cv.clientHeight;
  const minTx=Math.min(0,W-W*cam.zoom), minTy=Math.min(0,H-H*cam.zoom);
  cam.tx=Math.min(0,Math.max(minTx,cam.tx));
  cam.ty=Math.min(0,Math.max(minTy,cam.ty));
}
function updateZoomUI(){
  $('#zoomReset').textContent=Math.round(cam.zoom*100)+'%';
  cvWrap.classList.toggle('zoomed',cam.zoom>1.001);
}
function zoomAt(factor,cx,cy){
  if(animActive) return;
  const old=cam.zoom;
  cam.zoom=Math.min(ZMAX,Math.max(ZMIN,cam.zoom*factor));
  const k=cam.zoom/old;
  cam.tx=cx-(cx-cam.tx)*k; cam.ty=cy-(cy-cam.ty)*k;
  if(cam.zoom<=ZMIN+.0001){ cam.tx=0; cam.ty=0; }
  clampPan(); updateZoomUI(); draw();
}
cv.addEventListener('wheel',e=>{
  if(!P) return;
  e.preventDefault();
  const b=cv.getBoundingClientRect();
  zoomAt(e.deltaY<0?1.18:1/1.18, e.clientX-b.left, e.clientY-b.top);
},{passive:false});
$('#zoomIn').onclick=()=>zoomAt(1.35, cv.clientWidth/2, cv.clientHeight/2);
$('#zoomOut').onclick=()=>zoomAt(1/1.35, cv.clientWidth/2, cv.clientHeight/2);
$('#zoomReset').onclick=()=>{ resetCam(); draw(); };

const pointers=new Map();
let dragStart=null, pinchStart=null, movedDuringGesture=false;
function pinchInfo(pts){
  const [a,b]=pts, dx=a.x-b.x, dy=a.y-b.y;
  return {dist:Math.hypot(dx,dy)||1, midX:(a.x+b.x)/2, midY:(a.y+b.y)/2};
}
cv.addEventListener('pointerdown',e=>{
  if(!P || animActive) return;
  cv.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  movedDuringGesture=false;
  if(pointers.size===1){
    dragStart={x:e.clientX,y:e.clientY,tx:cam.tx,ty:cam.ty};
    pinchStart=null;
  }else if(pointers.size===2){
    const b=cv.getBoundingClientRect();
    const info=pinchInfo([...pointers.values()]);
    pinchStart={dist:info.dist, zoom:cam.zoom, cx:info.midX-b.left, cy:info.midY-b.top, tx:cam.tx, ty:cam.ty};
    dragStart=null;
  }
});
cv.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size>=2 && pinchStart){
    const info=pinchInfo([...pointers.values()]);
    const newZoom=Math.min(ZMAX,Math.max(ZMIN, pinchStart.zoom*(info.dist/pinchStart.dist)));
    const k=newZoom/pinchStart.zoom;
    cam.zoom=newZoom;
    cam.tx=pinchStart.cx-(pinchStart.cx-pinchStart.tx)*k;
    cam.ty=pinchStart.cy-(pinchStart.cy-pinchStart.ty)*k;
    clampPan(); updateZoomUI(); movedDuringGesture=true; draw();
  }else if(pointers.size===1 && dragStart && cam.zoom>1.0001){
    const dx=e.clientX-dragStart.x, dy=e.clientY-dragStart.y;
    if(Math.abs(dx)>3||Math.abs(dy)>3) movedDuringGesture=true;
    cam.tx=dragStart.tx+dx; cam.ty=dragStart.ty+dy;
    clampPan(); cvWrap.classList.add('panning'); draw();
  }
});
function endGesture(e){
  pointers.delete(e.pointerId);
  if(pointers.size<2) pinchStart=null;
  if(pointers.size===0){
    cvWrap.classList.remove('panning');
    if(!movedDuringGesture) selectAt(e.clientX,e.clientY);
    dragStart=null;
  }
}
cv.addEventListener('pointerup',endGesture);
cv.addEventListener('pointercancel',endGesture);

const view={dims:true, grid:true, axis:true, ghost:true};
function bindToggle(id,key){
  $(id).onclick=e=>{ view[key]=!view[key];
    e.currentTarget.classList.toggle('on',view[key]);
    e.currentTarget.setAttribute('aria-pressed',view[key]); draw(); };
}
function ghostAviso(){
  if(!P || P.lv.kind!=='contour') return;
  const g=playerPts(P.lv).filter(p=>p.ok&&!p.safe);
  if(view.ghost && g.length<2) toast('Preencha pelo menos 2 pontos para ver o seu perfil.',2600);
}
bindToggle('#tglDims','dims'); bindToggle('#tglGrid','grid');
bindToggle('#tglAxis','axis'); bindToggle('#tglGhost','ghost');
$('#tglGhost').addEventListener('click',ghostAviso);
$$('.mini-tools > .mini').forEach(m=>{m.classList.add('on'); m.setAttribute('aria-pressed','true');});

function resize(){
  const r=cv.getBoundingClientRect(), d=window.devicePixelRatio||1;
  if(r.width<2) return;
  cv.width=r.width*d; cv.height=r.height*d; ctx.setTransform(d,0,0,d,0,0);
}
window.addEventListener('resize',()=>{
  if($('#screen-play').classList.contains('active')){resize();clampPan();draw();}
});
if(window.ResizeObserver){
  new ResizeObserver(()=>{ if($('#screen-play').classList.contains('active')){ resize(); clampPan(); draw(); } }).observe(cv);
}
window.addEventListener('orientationchange',()=>
  setTimeout(()=>{ if($('#screen-play').classList.contains('active')){resize();clampPan();draw();} },350));
function themeColors(){
  const th=document.body.dataset.theme;
  if(CC && CC._t===th) return CC;
  const cs=getComputedStyle(document.body), g=n=>cs.getPropertyValue(n).trim();
  CC={_t:th, paper:g('--paper'), draw:g('--draw'), dim:g('--dim'), pt:g('--pt'),
      line:g('--line'), muted:g('--muted'), acc:g('--acc'), acc2:g('--acc2'),
      ok:g('--ok'), err:g('--err')};
  return CC;
}

/* perfil que os números do jogador desenham (só fases de contorno) */
function playerPts(lv){
  const mode=lv.modes[0], out=[]; let cx=0, cy=0;
  lv.pts.forEach((p,r)=>{
    let x,y;
    if(mode==='inc'){
      const dx=parseNum(val(r,'dx')), dy=parseNum(val(r,'dy'));
      x=cx+dx; y=cy+dy;
    }else{ x=parseNum(val(r,'x')); y=parseNum(val(r,'y')); }
    const ok=!isNaN(x)&&!isNaN(y);
    out.push({id:p.id, x, y, safe:p.safe, ok,
              hit: ok && Math.abs(x-p.x)<=TOL && Math.abs(y-p.y)<=TOL});
    if(ok){ cx=x; cy=y; }
  });
  return out;
  function val(r,k){ const el=document.querySelector(`#coordTable [data-r="${r}"][data-k="${k}"]`); return el?el.value:''; }
}

let _rafDraw=0;
function draw(){
  if(_rafDraw || animActive) return;
  _rafDraw=requestAnimationFrame(()=>{ _rafDraw=0; _draw(); });
}
function _draw(){
  HIT.length=0;
  if(!P) return;
  const W=cv.clientWidth, H=cv.clientHeight;
  if(W<2||H<2) return;
  const C=themeColors();
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle=C.paper; ctx.fillRect(0,0,W,H);
  ctx.save();
  ctx.translate(cam.tx,cam.ty);
  ctx.scale(cam.zoom,cam.zoom);
  if(P.lv.kind==='program') drawProgram(W,H,C); else drawContour(W,H,C);
  ctx.restore();
}
function drawContour(W,H,C){
  const path=P.lv.pts.filter(p=>!p.safe);
  if(!path.length) return;
  const xsAll=path.map(p=>p.x), ysAll=path.map(p=>p.y);
  const xmin=Math.min(0,...xsAll), xmax=Math.max(0,...xsAll);
  const ymin=Math.min(0,...ysAll), ymax=Math.max(0,...ysAll);
  const xsPos=[...new Set(path.map(p=>p.x).filter(x=>x!==0))].sort((a,b)=>a-b);
  const ysPos=[...new Set(path.map(p=>p.y).filter(y=>y!==0))].sort((a,b)=>a-b);

  const dstep=Math.max(22, Math.min(26, (H*0.44)/Math.max(1,xsPos.length)));
  const dstepY=Math.max(22, Math.min(26, (W*0.34)/Math.max(1,ysPos.length)));
  const botPad=view.dims? 18+xsPos.length*dstep : 30;
  const leftDim=view.dims? 18+ysPos.length*dstepY : 0;
  const padL=Math.min(70,W*0.16)+leftDim, padR=Math.min(40,W*0.10), topPad=Math.min(34,H*0.09);
  const availW=Math.max(60, W-padL-padR), availH=Math.max(60, H-topPad-botPad);
  const sc=Math.min(availW/((xmax-xmin)||1), availH/((ymax-ymin)||1))*0.94;
  const sx=x=> padL+(x-xmin)*sc;
  const sy=y=> topPad+availH-(y-ymin)*sc;
  const hlPt = P.hl>=0 ? P.lv.pts[P.hl] : null;
  const mark = has('marker') && hlPt;

  if(view.grid){
    ctx.strokeStyle=C.line; ctx.globalAlpha = document.body.dataset.theme==='paper' ? .16 : .35; ctx.lineWidth=1;
    const vline=X=>{ if(X>=0&&X<=W){ctx.beginPath();ctx.moveTo(X,0);ctx.lineTo(X,H);ctx.stroke();} };
    const hline=Y=>{ if(Y>=0&&Y<=H){ctx.beginPath();ctx.moveTo(0,Y);ctx.lineTo(W,Y);ctx.stroke();} };
    for(let x=0; x<=xmax+5; x+=5) vline(sx(x));
    for(let x=-5; x>=xmin-5; x-=5) vline(sx(x));
    for(let y=0; y<=ymax+5; y+=5) hline(sy(y));
    for(let y=-5; y>=ymin-5; y-=5) hline(sy(y));
    ctx.globalAlpha=1;
  }

  const m=16;
  ctx.setLineDash([6,4]); ctx.strokeStyle=C.muted; ctx.globalAlpha=.6; ctx.lineWidth=1.2;
  ctx.strokeRect(sx(xmin)-m, sy(ymax)-m, sx(xmax)-sx(xmin)+2*m, sy(ymin)-sy(ymax)+2*m);
  ctx.setLineDash([]); ctx.globalAlpha=1;
  ctx.fillStyle=C.muted; ctx.font='11px '+CVFONT; ctx.textAlign='left';
  ctx.fillText('bloco de material', sx(xmin)-m, sy(ymax)-m-6);

  ctx.lineWidth=2.4; ctx.strokeStyle=C.draw; ctx.lineJoin='round'; ctx.lineCap='round';
  ctx.beginPath();
  ctx.moveTo(sx(path[0].x), sy(path[0].y));
  for(let i=1;i<path.length;i++){
    const a=path[i-1], p=path[i];
    if(p.arc) ctx.quadraticCurveTo(sx(p.x), sy(a.y), sx(p.x), sy(p.y));
    else ctx.lineTo(sx(p.x), sy(p.y));
  }
  ctx.stroke();

  const ox=sx(0), oy=sy(0);
  ctx.strokeStyle=C.acc; ctx.lineWidth=1.6;
  ctx.beginPath(); ctx.arc(ox,oy,7,0,7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ox-11,oy);ctx.lineTo(ox+11,oy);ctx.moveTo(ox,oy-11);ctx.lineTo(ox,oy+11);ctx.stroke();
  ctx.fillStyle=C.acc; ctx.font='bold 11px '+CVFONT; ctx.textAlign='left';
  ctx.fillText('W', ox+13, oy+16);

  if(view.axis){
    const ax=W-58, ay=Math.min(50,topPad+8);
    ctx.strokeStyle=C.acc2; ctx.lineWidth=1.6; ctx.fillStyle=C.acc2; ctx.font='bold 11px '+CVFONT;
    arrow(ctx,ax,ay,ax,ay-26); ctx.textAlign='center'; ctx.fillText('Y+',ax,ay-32);
    arrow(ctx,ax,ay,ax+26,ay); ctx.textAlign='left'; ctx.fillText('X+',ax+30,ay+4);
  }

  if(view.dims){
    ctx.font='12px '+CVFONT; ctx.lineWidth=1.2;
    ctx.fillStyle=C.dim; ctx.strokeStyle=C.dim; ctx.textAlign='left';
    for(let i=1;i<path.length;i++){
      const a=path[i-1], b=path[i];
      const dx=Math.abs(b.x-a.x), dy=Math.abs(b.y-a.y);
      if(dx>0 && dy>0 && Math.abs(dx-dy)<TOL && dx<=6){
        const mx=(sx(a.x)+sx(b.x))/2, my=(sy(a.y)+sy(b.y))/2;
        ctx.fillText(b.arc?('R'+fmt(b.arc)):(fmt(dx)+'x45°'), mx+9, my-6);
      }
    }
    const yBase=topPad+availH;
    xsPos.forEach((x,i)=>{
      const on = mark && hlPt.x===x;
      ctx.strokeStyle=on?C.acc:C.dim; ctx.fillStyle=on?C.acc:C.dim; ctx.lineWidth=on?2:1;
      const Y=yBase+16+i*dstep, X=sx(x), X0=sx(0);
      ctx.globalAlpha=.35;
      ctx.beginPath(); ctx.moveTo(X,yBase+3); ctx.lineTo(X,Y+4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X0,yBase+3); ctx.lineTo(X0,Y+4); ctx.stroke();
      ctx.globalAlpha=1;
      arrow(ctx,X0,Y,X,Y); arrow(ctx,X,Y,X0,Y);
      ctx.textAlign='center';
      const txt=fmt(x), tw=ctx.measureText(txt).width, mxx=(X+X0)/2;
      ctx.save(); ctx.fillStyle=C.paper; ctx.fillRect(mxx-tw/2-3, Y-14, tw+6, 13); ctx.restore();
      ctx.fillText(txt, mxx, Y-4);
      ctx.lineWidth=1;
    });
    const xLeft=sx(xmin);
    ysPos.forEach((y,i)=>{
      const on = mark && hlPt.y===y;
      ctx.strokeStyle=on?C.acc:C.dim; ctx.fillStyle=on?C.acc:C.dim; ctx.lineWidth=on?2:1;
      const X=xLeft-16-i*dstepY, Y=sy(y), Y0=sy(0);
      ctx.globalAlpha=.35;
      ctx.beginPath(); ctx.moveTo(xLeft-3,Y); ctx.lineTo(X-4,Y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xLeft-3,Y0); ctx.lineTo(X-4,Y0); ctx.stroke();
      ctx.globalAlpha=1;
      arrow(ctx,X,Y0,X,Y); arrow(ctx,X,Y,X,Y0);
      const txt=fmt(y), ty=(Y+Y0)/2;
      ctx.save(); ctx.translate(X-6,ty); ctx.rotate(-Math.PI/2);
      const tw=ctx.measureText(txt).width;
      ctx.fillStyle=C.paper; ctx.fillRect(-tw/2-3,-8,tw+6,14);
      ctx.fillStyle=on?C.acc:C.dim; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(txt,0,0); ctx.restore(); ctx.textBaseline='alphabetic';
      ctx.lineWidth=1;
    });
  }

  if(view.ghost){
    const g=playerPts(P.lv).filter(p=>p.ok&&!p.safe);
    if(g.length>1){
      ctx.save(); ctx.beginPath(); ctx.rect(0,0,W,H); ctx.clip();
      ctx.setLineDash([10,6]); ctx.strokeStyle=C.acc;
      ctx.beginPath();
      g.forEach((p,i)=> i?ctx.lineTo(sx(p.x),sy(p.y)):ctx.moveTo(sx(p.x),sy(p.y)));
      ctx.lineWidth=7; ctx.globalAlpha=.12; ctx.stroke();
      ctx.lineWidth=2.6; ctx.globalAlpha=.9;  ctx.stroke();
      ctx.setLineDash([]);
      g.forEach(p=>{ ctx.beginPath(); ctx.arc(sx(p.x),sy(p.y),4.5,0,7);
        ctx.fillStyle=p.hit?C.ok:C.err; ctx.fill(); });
      ctx.restore(); ctx.globalAlpha=1;
    }
  }

  const boxes=[];
  path.forEach(p=>{
    const X=sx(p.x), Y=sy(p.y);
    HIT.push({r:P.lv.pts.indexOf(p), x:X, y:Y});
    const on = hlPt===p;
    if(on){
      ctx.strokeStyle=C.acc2; ctx.setLineDash([4,4]); ctx.lineWidth=1.2; ctx.globalAlpha=.9;
      ctx.beginPath(); ctx.moveTo(X,Y); ctx.lineTo(X,sy(0)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X,Y); ctx.lineTo(sx(0),Y); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha=1;
      ctx.beginPath(); ctx.arc(X,Y,11,0,7); ctx.strokeStyle=C.acc2; ctx.lineWidth=2; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(X,Y,on?6:4.5,0,7);
    ctx.fillStyle= on?C.acc2:C.pt; ctx.fill();

    ctx.font='bold 13px '+CVFONT; ctx.textAlign='center';
    const w=ctx.measureText(p.id).width+8;
    const arcEnd = !!p.arc;
    let lx=arcEnd?X+w/2+16:X, ly=arcEnd?Y-6:Y-24, t=0;
    while(boxes.some(b=>Math.abs(b.x-lx)<(b.w+w)/2 && Math.abs(b.y-ly)<20) && t<8){
      if(arcEnd) lx += w/2+16; else ly-=20;
      if(!arcEnd && t%2===1) lx += (w/2+4)*(t%4===1?1:-1); t++;
    }
    ly=Math.max(14,ly); lx=Math.min(W-w/2-4, Math.max(w/2+4, lx));
    boxes.push({x:lx,y:ly,w});
    ctx.strokeStyle=on?C.acc2:C.muted; ctx.globalAlpha=.5; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(X,Y-6); ctx.lineTo(lx,ly+4); ctx.stroke(); ctx.globalAlpha=1;
    ctx.fillStyle=C.paper; ctx.fillRect(lx-w/2,ly-11,w,15);
    ctx.fillStyle= on?C.acc2:C.draw;
    ctx.fillText(p.id, lx, ly);
  });

  const safes=P.lv.pts.filter(p=>p.safe);
  if(safes.length){
    ctx.fillStyle=C.muted; ctx.font='11px '+CVFONT; ctx.textAlign='right';
    const rotulo = safes.length>1 ? 'pontos de aproximação' : 'ponto de aproximação';
    const lista = safes.map(s=>`${s.id} (X${fmt(s.x)} Y${fmt(s.y)})`).join(', ');
    ctx.fillText('⌖ '+lista+' = '+rotulo+' (fora do desenho)', W-14, H-8);
  }
}

/* resolve posição modal (X/Y/Z carregam o último valor definido) para fases de programa */
function programPath(lv){
  let x=0,y=0,z=0,cycle=null;
  return lv.pts.map((p,r)=>{
    if(p.g){ if(/^G8[1-6]$/.test(p.g)) cycle={z:p.z, r:p.r}; else if(p.g==='G80') cycle=null; }
    if(p.x!=null) x=p.x;
    if(p.y!=null) y=p.y;
    const rapid = p.g==='G0';
    const isHole = !!cycle && (p.x!=null || p.y!=null || (p.g && /^G8[1-6]$/.test(p.g)));
    if(p.z!=null) z=p.z; else if(isHole && cycle) z=cycle.z;
    return {r, x, y, z, rapid, hole:isHole, label:rowLabel(lv,r)};
  });
}
function drawProgram(W,H,C){
  const pts=programPath(P.lv);
  if(!pts.length) return;
  const xsAll=pts.map(p=>p.x), ysAll=pts.map(p=>p.y);
  const xmin=Math.min(0,...xsAll), xmax=Math.max(0,...xsAll)||10;
  const ymin=Math.min(0,...ysAll), ymax=Math.max(0,...ysAll)||10;
  const padL=Math.min(60,W*0.14), padR=Math.min(40,W*0.10), topPad=Math.min(34,H*0.09), botPad=Math.min(50,H*0.12);
  const availW=Math.max(60, W-padL-padR), availH=Math.max(60, H-topPad-botPad);
  const sc=Math.min(availW/((xmax-xmin)||1), availH/((ymax-ymin)||1))*0.9;
  const sx=x=> padL+(x-xmin)*sc;
  const sy=y=> topPad+availH-(y-ymin)*sc;
  const hlR = P.hl;

  if(view.grid){
    ctx.strokeStyle=C.line; ctx.globalAlpha = document.body.dataset.theme==='paper' ? .16 : .35; ctx.lineWidth=1;
    for(let x=Math.ceil(xmin/10)*10; x<=xmax+5; x+=10){ const X=sx(x); if(X>=0&&X<=W){ctx.beginPath();ctx.moveTo(X,0);ctx.lineTo(X,H);ctx.stroke();} }
    for(let y=Math.ceil(ymin/10)*10; y<=ymax+5; y+=10){ const Y=sy(y); if(Y>=0&&Y<=H){ctx.beginPath();ctx.moveTo(0,Y);ctx.lineTo(W,Y);ctx.stroke();} }
    ctx.globalAlpha=1;
  }
  const ox=sx(0), oy=sy(0);
  ctx.strokeStyle=C.acc; ctx.lineWidth=1.6;
  ctx.beginPath(); ctx.arc(ox,oy,7,0,7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ox-11,oy);ctx.lineTo(ox+11,oy);ctx.moveTo(ox,oy-11);ctx.lineTo(ox,oy+11);ctx.stroke();
  ctx.fillStyle=C.acc; ctx.font='bold 11px '+CVFONT; ctx.textAlign='left'; ctx.fillText('W', ox+13, oy+16);

  if(view.axis){
    const ax=W-58, ay=Math.min(50,topPad+8);
    ctx.strokeStyle=C.acc2; ctx.lineWidth=1.6; ctx.fillStyle=C.acc2; ctx.font='bold 11px '+CVFONT;
    arrow(ctx,ax,ay,ax,ay-26); ctx.textAlign='center'; ctx.fillText('Y+',ax,ay-32);
    arrow(ctx,ax,ay,ax+26,ay); ctx.textAlign='left'; ctx.fillText('X+',ax+30,ay+4);
  }

  for(let i=1;i<pts.length;i++){
    const a=pts[i-1], b=pts[i];
    if(a.x===b.x && a.y===b.y) continue;
    ctx.beginPath(); ctx.moveTo(sx(a.x),sy(a.y)); ctx.lineTo(sx(b.x),sy(b.y));
    if(b.rapid || a.hole || b.hole){ ctx.setLineDash([5,4]); ctx.strokeStyle=C.muted; ctx.globalAlpha=.65; ctx.lineWidth=1.4; }
    else { ctx.setLineDash([]); ctx.strokeStyle=C.draw; ctx.globalAlpha=1; ctx.lineWidth=2.2; }
    ctx.stroke();
  }
  ctx.setLineDash([]); ctx.globalAlpha=1;

  pts.forEach(p=>{
    const X=sx(p.x), Y=sy(p.y);
    HIT.push({r:p.r, x:X, y:Y});
    const on = hlR===p.r;
    if(p.hole){
      ctx.beginPath(); ctx.arc(X,Y,on?9:7,0,7);
      ctx.strokeStyle=on?C.acc2:C.acc; ctx.lineWidth=2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X-4,Y); ctx.lineTo(X+4,Y); ctx.moveTo(X,Y-4); ctx.lineTo(X,Y+4); ctx.stroke();
    }else{
      ctx.beginPath(); ctx.arc(X,Y,on?6:4,0,7);
      ctx.fillStyle= on?C.acc2:C.pt; ctx.fill();
    }
    if(on){
      ctx.strokeStyle=C.acc2; ctx.setLineDash([4,4]); ctx.lineWidth=1.2; ctx.globalAlpha=.9;
      ctx.beginPath(); ctx.moveTo(X,Y); ctx.lineTo(X,sy(0)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X,Y); ctx.lineTo(sx(0),Y); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha=1;
    }
    ctx.font=(on?'bold ':'')+'11px '+CVFONT; ctx.textAlign='center';
    const lbl=p.label+(p.z?(' Z'+fmt(p.z)):'');
    const w=ctx.measureText(lbl).width+8;
    const ly=Y-16;
    ctx.fillStyle=C.paper; ctx.fillRect(X-w/2,ly-11,w,15);
    ctx.fillStyle= on?C.acc2:C.muted;
    ctx.fillText(lbl, X, ly);
  });

  ctx.fillStyle=C.muted; ctx.font='11px '+CVFONT; ctx.textAlign='right';
  ctx.fillText('⌖ linha tracejada = deslocamento rápido (G0) · ○ = ciclo de furação', W-14, H-8);
}
function arrow(c,x1,y1,x2,y2){
  c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.stroke();
  const a=Math.atan2(y2-y1,x2-x1), s=6;
  c.beginPath(); c.moveTo(x2,y2);
  c.lineTo(x2-s*Math.cos(a-.4), y2-s*Math.sin(a-.4));
  c.lineTo(x2-s*Math.cos(a+.4), y2-s*Math.sin(a+.4));
  c.closePath(); c.fill();
}

/* =========================================================================
   ANIMAÇÃO DE USINAGEM — toca quando a tabela é verificada e está 100% certa
   ========================================================================= */
let animActive=false, _animRaf=0, _chips=[];
function cornerOf(a,b){ return {x:b.x, y:a.y}; }
function bezierAt(a,b,corner,t){
  const x=(1-t)**2*a.x + 2*(1-t)*t*corner.x + t*t*b.x;
  const y=(1-t)**2*a.y + 2*(1-t)*t*corner.y + t*t*b.y;
  return {x,y};
}
function segPointAt(raw,i,t){
  const a=raw[i], b=raw[i+1];
  if(b.arc) return bezierAt(a,b,cornerOf(a,b),t);
  return {x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t};
}
function spawnChip(sx,sy){
  const cols = has('goldchip') ? ['#ffd94a','#ffef8a','#ffc23a'] : ['#e8b84b','#c98a3a'];
  for(let n=0;n<3;n++){
    _chips.push({
      x:sx, y:sy, vx:(Math.random()-.5)*2.2, vy:-Math.random()*3-1,
      r:Math.random()*Math.PI*2, vr:(Math.random()-.5)*.5,
      s:2+Math.random()*3, a:1, c: cols[(Math.random()*cols.length)|0]
    });
  }
  if(_chips.length>220) _chips.splice(0,_chips.length-220);
}
function stepChips(dt){
  const k=Math.min(3,dt/16);
  _chips.forEach(p=>{ p.vy+=.18*k; p.x+=p.vx*k; p.y+=p.vy*k; p.r+=p.vr*k; p.a-=.022*k; });
  _chips=_chips.filter(p=>p.a>0);
}
function drawChips(){
  _chips.forEach(p=>{
    ctx.save(); ctx.globalAlpha=Math.max(0,p.a); ctx.translate(p.x,p.y); ctx.rotate(p.r);
    ctx.fillStyle=p.c; ctx.fillRect(-p.s/2,-p.s*.3,p.s,p.s*.6);
    ctx.restore();
  });
}
function buildSim(raw,W,H){
  const xsAll=raw.map(p=>p.x), ysAll=raw.map(p=>p.y);
  const xmin=Math.min(0,...xsAll), xmax=Math.max(0,...xsAll);
  const ymin=Math.min(0,...ysAll), ymax=Math.max(0,...ysAll);
  const m=16;
  const padL=Math.min(70,W*.14), padR=Math.min(70,W*.12), topPad=Math.min(40,H*.10), botPad=Math.min(40,H*.10);
  const availW=Math.max(60,W-padL-padR), availH=Math.max(60,H-topPad-botPad);
  const sc=Math.min(availW/((xmax-xmin)||1), availH/((ymax-ymin)||1))*.9;
  const sx=x=>padL+(x-xmin)*sc, sy=y=>topPad+availH-(y-ymin)*sc;
  const rect={x0:sx(xmin)-m, y0:sy(ymax)-m, x1:sx(xmax)+m, y1:sy(ymin)+m};
  function approach(t){
    const start={x:xmin-m*3, y:ymax+m*3}, end=raw[0], e=1-Math.pow(1-t,3);
    return {x:start.x+(end.x-start.x)*e, y:start.y+(end.y-start.y)*e};
  }
  return {sx,sy,rect,approach,xmin,xmax,ymin,ymax};
}
function renderSimFrame(sim,W,H,C,raw,i,t,tip,now){
  const {sx,sy,rect}=sim;
  ctx.fillStyle=C.muted; ctx.globalAlpha=.22;
  ctx.fillRect(rect.x0,rect.y0,rect.x1-rect.x0,rect.y1-rect.y0);
  ctx.globalAlpha=1;
  ctx.setLineDash([6,4]); ctx.strokeStyle=C.muted; ctx.lineWidth=1.2; ctx.globalAlpha=.6;
  ctx.strokeRect(rect.x0,rect.y0,rect.x1-rect.x0,rect.y1-rect.y0);
  ctx.setLineDash([]); ctx.globalAlpha=1;

  if(i>=0){
    ctx.beginPath();
    ctx.moveTo(sx(raw[0].x), sy(raw[0].y));
    for(let k=1;k<=i;k++){
      const a=raw[k-1], b=raw[k];
      if(b.arc) ctx.quadraticCurveTo(sx(cornerOf(a,b).x), sy(cornerOf(a,b).y), sx(b.x), sy(b.y));
      else ctx.lineTo(sx(b.x), sy(b.y));
    }
    ctx.lineTo(sx(tip.x), sy(tip.y));
    ctx.lineWidth=2.2; ctx.strokeStyle=C.draw; ctx.lineJoin='round'; ctx.lineCap='round';
    ctx.stroke();
  }

  const ox=sx(0), oy=sy(0);
  ctx.strokeStyle=C.acc; ctx.lineWidth=1.6;
  ctx.beginPath(); ctx.arc(ox,oy,7,0,7); ctx.stroke();

  const tsx=sx(tip.x), tsy=sy(tip.y), spin=(now||0)/45;
  ctx.save(); ctx.translate(tsx,tsy);
  ctx.fillStyle='#9aa4b2'; ctx.strokeStyle='#4b525c'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.arc(0,0,7,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.rotate(spin); ctx.strokeStyle='#4b525c'; ctx.lineWidth=1.4;
  for(let k=0;k<3;k++){ ctx.save(); ctx.rotate(k*Math.PI*2/3);
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(9,0); ctx.stroke(); ctx.restore(); }
  ctx.restore();
  return {sx:tsx, sy:tsy};
}
function playMachining(done){
  if(!P){ done(); return; }
  const lv=P.lv;
  const raw = lv.kind==='program' ? programPath(lv).filter((p,i,a)=> i===0 || p.x!==a[i-1].x || p.y!==a[i-1].y)
                                   : lv.pts.filter(p=>!p.safe);
  if(raw.length<2){ done(); return; }
  const W=cv.clientWidth, H=cv.clientHeight;
  if(W<2||H<2){ done(); return; }

  animActive=true; _chips=[];
  cam.zoom=1; cam.tx=0; cam.ty=0; updateZoomUI();
  cvWrap.classList.add('machining');

  const sim = buildSim(raw,W,H);
  const segLen=i=>Math.hypot(raw[i+1].x-raw[i].x, raw[i+1].y-raw[i].y)||.001;
  const lens=raw.slice(0,-1).map((_,i)=>segLen(i));
  const totalLen=lens.reduce((a,b)=>a+b,0)||1;
  const cutDur=Math.min(9500,Math.max(3200,totalLen*95));
  const approachDur=700;

  machSoundStart();
  const t0=performance.now();
  let lastSpawn=0, prevNow=t0;

  function pickSeg(overallT){
    let acc=0;
    for(let k=0;k<lens.length;k++){
      const frac=lens[k]/totalLen;
      if(overallT<=acc+frac || k===lens.length-1) return {i:k, t: frac>0?Math.min(1,Math.max(0,(overallT-acc)/frac)):1};
      acc+=frac;
    }
    return {i:lens.length-1, t:1};
  }
  function frame(now){
    const C=themeColors();
    ctx.clearRect(0,0,W,H); ctx.fillStyle=C.paper; ctx.fillRect(0,0,W,H);
    const dt=now-prevNow; prevNow=now;
    const elapsed=now-t0;
    let tip, cutting=false, overallT=0, tipScreen;

    if(elapsed<approachDur){
      const at=Math.min(1,elapsed/approachDur);
      tip=sim.approach(at);
      machSoundCutting(false);
      tipScreen=renderSimFrame(sim,W,H,C,raw,-1,0,tip,now);
    }else{
      overallT=Math.min(1,(elapsed-approachDur)/cutDur);
      const {i,t}=pickSeg(overallT);
      cutting=true;
      tip=segPointAt(raw,i,t);
      tipScreen=renderSimFrame(sim,W,H,C,raw,i,t,tip,now);
      machSoundCutting(true);
    }
    if(cutting && now-lastSpawn>55){ lastSpawn=now; spawnChip(tipScreen.sx,tipScreen.sy); if(Math.random()<.5) machChip(); }
    stepChips(dt||16); drawChips();

    if(overallT>=1){ finish(); return; }
    _animRaf=requestAnimationFrame(frame);
  }
  function finish(){
    machSoundStop();
    cancelAnimationFrame(_animRaf);
    animActive=false; _chips=[];
    cvWrap.classList.remove('machining');
    draw();
    done();
  }
  _animRaf=requestAnimationFrame(frame);
}

/* =========================================================================
   TUTORIAL DINÂMICO
   ========================================================================= */
const tutCell=(r,k)=>document.querySelector(`#coordTable [data-r="${r}"][data-k="${k}"]`);
function tutFill(r){
  colsOf(P.lv).forEach(c=>{
    const el=tutCell(r,c.k); if(!el) return;
    const exp=expected(P.lv,r,c);
    el.value = STRKINDS.has(c.kind)?exp:fmt(exp);
    el.classList.add('given','ok'); el.classList.remove('err');
  });
  _draw();
}
function tutCheckRow(r){
  const bad=[];
  colsOf(P.lv).forEach(c=>{
    const el=tutCell(r,c.k); if(!el) return;
    const exp=expected(P.lv,r,c);
    const v = STRKINDS.has(c.kind)?el.value:parseNum(el.value);
    const ok = STRKINDS.has(c.kind)? String(v).toUpperCase()===String(exp).toUpperCase() : Math.abs(v-exp)<=tolFor(c.kind);
    el.classList.toggle('ok',ok); el.classList.toggle('err',!ok);
    if(!ok) bad.push({k:c.k,h:c.h,v,exp});
  });
  draw();
  if(!bad.length) return {ok:true};
  const b=bad[0];
  let msg;
  if(b.k!=='g' && b.k!=='m' && isNaN(b.v)) msg=`Falta preencher <b>${b.h}</b>.`;
  else msg = 'Confira a posição desse ponto no desenho: qual X e qual Y ele mostra ali?';
  return {ok:false,msg};
}
const TUT=[
 {sel:'.drawpanel', txt:'Este é o <b>desenho técnico</b> da peça, visto de cima. Cada ponto marcado no contorno (A, B, C…) vira uma linha da tabela — é a sequência que a ferramenta vai percorrer.'},
 {sel:'#cv', txt:'O alvo marcado com <b>W</b> é o <b>zero-peça</b>: o ponto de onde a máquina conta todas as medidas, como o zero de uma régua encostado no canto da peça.'},
 {sel:'#cv', txt:'Não existe diâmetro aqui — <b>X</b> e <b>Y</b> são só a posição da ferramenta no plano, a partir do zero-peça.'},
 {sel:'#coordTable', txt:`Cada ponto vira uma linha aqui. ${TOUCH?'Toque numa linha — ou no próprio ponto do desenho — e ele <b>acende</b>':'Passe o mouse numa linha e o ponto correspondente <b>acende no desenho</b>'}, com as linhas de leitura até os eixos.`},
 {sel:'#coordTable tr[data-r="0"]', onEnter:()=>tutFill(0),
  txt:'Vou resolver o <b>ponto A</b> com você. Ele é o zero-peça: X0 e Y0. Primeira linha preenchida.'},
 {sel:'#coordTable tr[data-r="1"]', gate:true, check:()=>tutCheckRow(1),
  txt:'Sua vez. Onde fica o <b>ponto B</b> no desenho?<br>Preencha X e Y desta linha e clique em <b>Conferir</b>.'},
 {sel:'#btnHint', txt:'Empacou? A <b>Dica</b> olha o que você digitou e aponta a célula errada — o primeiro nível é grátis, aprofundar gasta uma ficha 💡. E depois de 3 tentativas o botão <b>Explicar</b> abre o passo a passo completo.'},
 {sel:'#btnCheck', txt:'Quando terminar, clique em <b>Verificar</b>. Acertar de primeira, sem dica paga, vale <b>3 ★</b>. O ponto A já saiu e você fez o B — siga o mesmo raciocínio até o fim.'}
];
let tstep=0, tutTarget=null, tutRAF=0, tutFails=0;
function startTutorial(){
  tstep=0; tutTarget=null; tutFails=0;
  window.scrollTo({top:0,behavior:'auto'});
  $('#tutor').classList.add('on');
  addEventListener('scroll', tutReflow, true);
  addEventListener('resize', tutReflow);
  tutShow();
}
function tutReflow(){ cancelAnimationFrame(tutRAF); tutRAF=requestAnimationFrame(()=>tutPlace(tutTarget)); }
function tutShow(){
  if(!$('#screen-play').classList.contains('active')){ endTutorial(); return; }
  const s=TUT[tstep], el=$(s.sel);
  if(!el){ endTutorial(); return; }
  tutTarget=el; tutFails=0;
  $('#tutStep').textContent=`PASSO ${tstep+1}/${TUT.length}`;
  $('#tutText').innerHTML=s.txt;
  $('#tutErr').textContent='';
  $('#tutGive').style.display='none';
  $('#tutBack').disabled = tstep===0;
  $('#tutNext').textContent = s.gate?'Conferir' : (tstep===TUT.length-1?'Começar a preencher':'Próximo ›');
  $('#tutor').classList.toggle('interactive', !!s.gate);
  if(s.onEnter) s.onEnter();
  const r0=el.getBoundingClientRect();
  if(r0.top<90 || r0.bottom>innerHeight-40) el.scrollIntoView({block:'center',behavior:'auto'});
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    tutPlace(el);
    $('#tutNext').focus({preventScroll:true});
  }));
  beep(520,.05);
}
function tutPlace(el){
  if(!el || !$('#tutor').classList.contains('on')) return;
  const pad=8, r=el.getBoundingClientRect(), sp=$('#tutSpot'), b=$('#tutBubble');
  sp.style.left=(r.left-pad)+'px'; sp.style.top=(r.top-pad)+'px';
  sp.style.width=(r.width+pad*2)+'px'; sp.style.height=(r.height+pad*2)+'px';
  const bb=b.getBoundingClientRect(), bw=bb.width, bh=bb.height;
  let bx=r.left+r.width/2-bw/2, by=r.bottom+16;
  if(by+bh>innerHeight-10) by=r.top-bh-16;
  by=Math.max(10, Math.min(by, innerHeight-bh-10));
  bx=Math.max(10, Math.min(bx, innerWidth-bw-10));
  b.style.left=bx+'px'; b.style.top=by+'px';
}
$('#tutNext').onclick=()=>{
  const s=TUT[tstep];
  if(s.gate){
    const res=s.check();
    if(!res.ok){
      tutFails++; sndErr();
      $('#tutErr').innerHTML=res.msg;
      const b=$('#tutBubble'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
      if(tutFails>=2) $('#tutGive').style.display='';
      tutPlace(tutTarget); return;
    }
    sndOk(); $('#tutErr').textContent='';
  }
  tstep++; tstep>=TUT.length?endTutorial():tutShow();
};
$('#tutGive').onclick=()=>{ tutFill(1); $('#tutErr').textContent=''; $('#tutGive').style.display='none'; };
$('#tutBack').onclick=()=>{ if(tstep>0){ tstep--; tutShow(); } };
$('#tutBubble').addEventListener('keydown',e=>{
  if(e.key!=='Tab' || $('#tutor').classList.contains('interactive')) return;
  const f=[...$('#tutBubble').querySelectorAll('button')].filter(b=>b.offsetParent&&!b.disabled);
  if(!f.length) return;
  e.preventDefault();
  f[(f.indexOf(document.activeElement)+(e.shiftKey?-1:1)+f.length)%f.length].focus();
});
$('#tutSkip').onclick=()=>{ endTutorial(); toast('Sem problema — o Manual tem o botão “Rever o tutorial”.',4000); };
$('#tutor').addEventListener('click',e=>{
  if(TOUCH) return;
  if(e.target.id==='tutor' && !TUT[tstep].gate) $('#tutNext').click();
});
function endTutorial(){
  $('#tutor').classList.remove('on','interactive');
  removeEventListener('scroll', tutReflow, true);
  removeEventListener('resize', tutReflow);
  tutTarget=null; S.tutorial=true; save();
}

/* =========================================================================
   CONFETE
   ========================================================================= */
const fx=$('#fx'), fctx=fx.getContext('2d');
let fxRAF=0;
function fxResize(){
  const d=window.devicePixelRatio||1;
  fx.width=innerWidth*d; fx.height=innerHeight*d;
  fctx.setTransform(d,0,0,d,0,0);
}
function confetti(){
  cancelAnimationFrame(fxRAF);
  fxResize();
  const cols=['#ffb020','#43d0ff','#31d07a','#ff5d5d','#ffffff'];
  const ps=[...Array(140)].map(()=>({
    x:innerWidth/2+(Math.random()-.5)*260, y:innerHeight/2,
    vx:(Math.random()-.5)*11, vy:-Math.random()*13-4,
    s:4+Math.random()*7, c:cols[(Math.random()*cols.length)|0], r:Math.random()*7, vr:(Math.random()-.5)*.4, a:1
  }));
  let f=0;
  (function loop(){
    fctx.clearRect(0,0,innerWidth,innerHeight);
    ps.forEach(p=>{ p.vy+=.32; p.x+=p.vx; p.y+=p.vy; p.r+=p.vr; p.a-=.008;
      fctx.save(); fctx.globalAlpha=Math.max(0,p.a); fctx.translate(p.x,p.y); fctx.rotate(p.r);
      fctx.fillStyle=p.c; fctx.fillRect(-p.s/2,-p.s/2,p.s,p.s*.6); fctx.restore(); });
    if(++f<170) fxRAF=requestAnimationFrame(loop);
    else { fctx.clearRect(0,0,innerWidth,innerHeight); fx.width=fx.height=0; }
  })();
}

/* =========================================================================
   TECLADO GLOBAL / BOOT
   ========================================================================= */
window.addEventListener('keydown',e=>{
  if($('#tutor').classList.contains('on')){
    if(e.key==='Escape'){ e.preventDefault(); endTutorial(); }
    else if(e.key==='ArrowLeft'){ $('#tutBack').click(); }
    return;
  }
  if(e.key!=='Escape') return;
  const open=$$('.modal.on');
  if(open.length){
    e.preventDefault();
    if($('#modalResult').classList.contains('on')||$('#modalUnlock').classList.contains('on')) return;
    document.body.style.overflow=''; setInert(false);
    $('#overlay').classList.remove('on'); open.forEach(m=>m.classList.remove('on'));
    if(lastFocus&&document.contains(lastFocus)) lastFocus.focus();
    return;
  }
  if(!$('#screen-play').classList.contains('active')) return;
  if(document.activeElement && document.activeElement.closest('#coordTable')){ document.activeElement.blur(); return; }
  show('map');
});
if(navigator.standalone || matchMedia('(display-mode:standalone)').matches)
  document.documentElement.classList.add('standalone');

hud(); show('map');
