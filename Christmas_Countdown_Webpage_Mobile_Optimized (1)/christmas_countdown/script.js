// Christmas Countdown App with Procedural SVGs + WebAudio jingles
(function(){
  const appYear = new Date().getFullYear();
  const target = new Date(appYear, 11, 25, 0, 0, 0, 0); // Dec 25
  const today = new Date();
  const msPerDay = 24*60*60*1000;
  const daysLeft = Math.max(0, Math.ceil((target - new Date(today.getFullYear(), today.getMonth(), today.getDate()))/msPerDay));

  // UI elements
  const countdownEl = document.getElementById('countdown');
  const calendarEl = document.getElementById('calendar');
  const svgHolder = document.getElementById('svgHolder');
  const captionEl = document.getElementById('caption');
  const playBtn = document.getElementById('playJingle');
  const stopBtn = document.getElementById('stopJingle');
  const prevDayBtn = document.getElementById('prevDay');
  const nextDayBtn = document.getElementById('nextDay');
  const dayLabel = document.getElementById('dayLabel');
  const previewToggle = document.getElementById('previewToggle');

  function fmtCountdown(){
    const now = new Date();
    const diff = target - now;
    if(diff <= 0){
      countdownEl.textContent = "🎅 It's Christmas! Merry Christmas!";
      return;
    }
    const d = Math.floor(diff / (24*3600*1000));
    const h = Math.floor((diff % (24*3600*1000)) / (3600*1000));
    const m = Math.floor((diff % (3600*1000)) / (60*1000));
    const s = Math.floor((diff % (60*1000)) / 1000);
    countdownEl.textContent = `${d}d ${h}h ${m}m ${s}s until Christmas`;
  }
  fmtCountdown();
  setInterval(fmtCountdown, 1000);

  // Build list of calendar days from Nov 1 to Dec 25 for fun (or from today to Dec 25 if later)
  const startDate = new Date(appYear, 10, 1); // Nov 1
  const totalDays = Math.ceil((target - startDate)/msPerDay)+1;
  const days = [];
  for(let i=0;i<totalDays;i++){
    const d = new Date(startDate.getTime()+i*msPerDay);
    days.push(d);
  }

  // Seeded RNG (Mulberry32)
  function rng(seed){
    return function(){
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Caption snippets for humor (will combine randomly)
  const setups = [
    "Snowman forgot his sunscreen",
    "Elf union demands more marshmallows",
    "Reindeer GPS needs recalibration",
    "Santa upgraded to sleigh 2.0",
    "Gingerbread on a low-carb diet",
    "Hot cocoa stock soaring",
    "Candy canes in supply chain limbo",
    "Mistletoe miscommunication",
    "Tinsel tangled beyond recovery",
    "North Pole HR scheduling chaos"
  ];
  const punchlines = [
    "— but spirits are still bright!",
    "— jolly bugs, jollier fixes.",
    "— hoof prints lead to snacks.",
    "— patch notes: +25% ho-ho-ho.",
    "— crumbs everywhere, morale high.",
    "— futures taste delicious.",
    "— elves blame the grinchy gremlins.",
    "— consent forms now peppermint-scented.",
    "— sending thoughts & untanglers.",
    "— PTO approved for all penguins."
  ];

  // Generate a short melody for a given seed using WebAudio
  let audioCtx = null;
  let activeNodes = [];
  function stopAll(){
    activeNodes.forEach(n=>{ try{ n.stop(0);}catch(e){} });
    activeNodes = [];
  }
  function playJingleForSeed(seed){
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    stopAll();
    const R = rng(seed);
    // choose a scale & tempo
    const scales = [
      [0,2,4,5,7,9,11,12], // major
      [0,2,3,5,7,8,10,12], // minor
      [0,3,5,7,10,12],     // pentatonic-ish
      [0,4,7,11,12],       // jazzy
    ];
    const baseFreq = 220 * Math.pow(2, Math.floor(R()*3)); // A3..A5-ish
    const scale = scales[Math.floor(R()*scales.length)];
    const notes = Array.from({length: 12}, ()=>baseFreq * Math.pow(2, scale[Math.floor(R()*scale.length)]/12));
    const tempo = 120 + Math.floor(R()*60);
    const beat = 60/tempo;
    const now = audioCtx.currentTime;
    const master = audioCtx.createGain(); master.gain.value = 0.15; master.connect(audioCtx.destination);
    // Simple sleigh-bell-ish ping + bass
    for(let i=0;i<notes.length;i++){
      const t = now + i*beat*0.5;
      // bell
      const osc = audioCtx.createOscillator();
      osc.type = (R()<0.5)?'triangle':'sine';
      osc.frequency.value = notes[i];
      const g = audioCtx.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.4, t+0.01); g.gain.exponentialRampToValueAtTime(0.0001, t+0.25);
      osc.connect(g); g.connect(master);
      osc.start(t); osc.stop(t+0.3);
      activeNodes.push(osc);
      // occasional bass hit
      if(i%4===0){
        const bass = audioCtx.createOscillator(); bass.type='square'; bass.frequency.value = baseFreq/2;
        const gb = audioCtx.createGain(); gb.gain.setValueAtTime(0.0001,t); gb.gain.exponentialRampToValueAtTime(0.25,t+0.01); gb.gain.exponentialRampToValueAtTime(0.0001, t+0.3);
        bass.connect(gb); gb.connect(master); bass.start(t); bass.stop(t+0.32);
        activeNodes.push(bass);
      }
    }
  }

  // Procedural SVG: goofy snowman / reindeer / tree variants
  function svgForSeed(seed, width=720, height=360){
    const R = rng(seed);
    function rand(min,max){ return min + (max-min)*R(); }
    function pick(arr){ return arr[Math.floor(R()*arr.length)]; }

    const sky = ['#0d1b2a','#162238','#0f213f','#1a2542','#0f1c30'];
    const snow = '#e9f6ff';

    let svg = [];
    svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Funny Christmas scene">`);
    // background
    svg.push(`<defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${pick(sky)}"/>
        <stop offset="100%" stop-color="#091221"/>
      </linearGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.5" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>`);
    svg.push(`<rect width="100%" height="100%" fill="url(#g)"/>`);

    // stars
    for(let i=0;i<80;i++){
      const x = rand(0,width), y=rand(0,height*0.6), r=rand(0.6,1.8);
      svg.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#fff" opacity="${rand(0.4,1)}"/>`);
    }

    // ground
    svg.push(`<rect x="0" y="${height-80}" width="${width}" height="100" fill="${snow}"/>`);

    // choose character
    const character = pick(['snowman','reindeer','tree','penguin','giftbot']);
    if(character==='snowman'){
      const cx = width*0.3, cy = height-80;
      const body = rand(58,72), mid = body*0.75, head = body*0.6;
      svg.push(`<circle cx="${cx}" cy="${cy- body}" r="${body}" fill="${snow}" stroke="#cdd9e4" stroke-width="2"/>`);
      svg.push(`<circle cx="${cx}" cy="${cy- body - mid + 10}" r="${mid}" fill="${snow}" stroke="#cdd9e4" stroke-width="2"/>`);
      svg.push(`<circle cx="${cx}" cy="${cy- body - mid - head + 22}" r="${head}" fill="${snow}" stroke="#cdd9e4" stroke-width="2"/>`);
      // eyes
      for(let i=0;i<2;i++){
        svg.push(`<circle cx="${cx-12 + i*24}" cy="${cy- body - mid - head + 12}" r="4" fill="#222"/>`);
      }
      // carrot nose
      svg.push(`<polygon points="${cx+4},${cy- body - mid - head + 16} ${cx+36},${cy- body - mid - head + 20} ${cx+4},${cy- body - mid - head + 24}" fill="#ff8c42"/>`);
      // smile
      const mouthY = cy- body - mid - head + 34;
      for(let i=0;i<6;i++){
        svg.push(`<circle cx="${cx-18 + i*7}" cy="${mouthY + (i===2||i===3?2:0)}" r="2.2" fill="#333"/>`);
      }
      // hat / earmuffs / antlers variant
      const topAcc = pick(['hat','earmuffs','stars']);
      if(topAcc==='hat'){
        svg.push(`<rect x="${cx-26}" y="${cy- body - mid - head - 6}" width="52" height="10" fill="#1b1b1b"/>`);
        svg.push(`<rect x="${cx-18}" y="${cy- body - mid - head - 34}" width="36" height="28" fill="#111" stroke="${pick(['#c00','#16d38c','#ffd166'])}" stroke-width="3"/>`);
      }else if(topAcc==='earmuffs'){
        svg.push(`<circle cx="${cx-22}" cy="${cy- body - mid - head + 5}" r="9" fill="${pick(['#c00','#16d38c','#ffd166'])}"/>`);
        svg.push(`<circle cx="${cx+22}" cy="${cy- body - mid - head + 5}" r="9" fill="${pick(['#c00','#16d38c','#ffd166'])}"/>`);
        svg.push(`<path d="M ${cx-22} ${cy- body - mid - head - 6} Q ${cx} ${cy- body - mid - head - 26} ${cx+22} ${cy- body - mid - head - 6}" stroke="#888" stroke-width="4" fill="none"/>`);
      }else{
        for(let i=0;i<5;i++){
          const sx = cx-40+i*20, sy = cy- body - mid - head - rand(20,34);
          svg.push(`<polygon points="${sx},${sy} ${sx+6},${sy+12} ${sx-6},${sy+12}" fill="#ffd166" filter="url(#glow)"/>`);
        }
      }
      // scarf
      const sc = pick(['#c00','#16d38c','#ffd166']);
      svg.push(`<rect x="${cx-30}" y="${cy- body - mid - head + 22}" width="60" height="10" fill="${sc}"/>`);
      svg.push(`<rect x="${cx+10}" y="${cy- body - mid - head + 26}" width="12" height="28" fill="${sc}"/>`);
      // arms
      svg.push(`<path d="M ${cx-mid} ${cy- body - mid + 10} q -40 -20 -70 -10" stroke="#6b4f2a" stroke-width="5" fill="none"/>`);
      svg.push(`<path d="M ${cx+mid} ${cy- body - mid + 10} q 40 -20 70 -10" stroke="#6b4f2a" stroke-width="5" fill="none"/>`);
    } else if(character==='reindeer'){
      const rx = width*0.68, ry = height-100;
      svg.push(`<ellipse cx="${rx}" cy="${ry}" rx="70" ry="40" fill="#a57c52" stroke="#6d5338" stroke-width="2"/>`);
      svg.push(`<circle cx="${rx+64}" cy="${ry-10}" r="28" fill="#a57c52" stroke="#6d5338" stroke-width="2"/>`);
      // nose
      svg.push(`<circle cx="${rx+86}" cy="${ry-6}" r="10" fill="${Math.random()<0.5?'#ff4b4b':'#8b0000'}"/>`);
      // eyes
      svg.push(`<circle cx="${rx+54}" cy="${ry-18}" r="4" fill="#111"/>`);
      // antlers
      for(let s of [-1,1]){
        svg.push(`<path d="M ${rx+54} ${ry-28} q ${10*s} -20 ${30*s} -24 M ${rx+74*s} ${ry-52} q ${-10*s} -12 ${-24*s} -14" stroke="#6b4f2a" stroke-width="4" fill="none"/>`);
      }
      // scarf
      const sc = pick(['#c00','#16d38c','#ffd166']);
      svg.push(`<rect x="${rx-20}" y="${ry-10}" width="40" height="10" fill="${sc}"/>`);
      svg.push(`<rect x="${rx-6}" y="${ry}" width="12" height="26" fill="${sc}"/>`);
    } else if(character==='tree'){
      const tx = width*0.5, ty=height-80;
      const layers = 3+Math.floor(R()*2);
      for(let i=0;i<layers;i++){
        const w = 180 - i*40, h = 55;
        svg.push(`<polygon points="${tx-w/2},${ty-i*50} ${tx+w/2},${ty-i*50} ${tx},${ty-i*50-h}" fill="${['#0b6b2a','#0e7f34','#0a5e26'][i%3]}" stroke="#083b18" stroke-width="2"/>`);
      }
      svg.push(`<rect x="${tx-18}" y="${ty+2}" width="36" height="36" fill="#6b4f2a"/>`);
      // ornaments
      for(let i=0;i<20;i++){
        const ox = tx + (Math.random()-0.5)*140;
        const oy = ty - Math.random()*120;
        svg.push(`<circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="${(Math.random()*4+2).toFixed(1)}" fill="${pick(['#ffd166','#ff5d5d','#16d38c','#73b7ff'])}"/>`);
      }
      svg.push(`<polygon points="${tx},${ty-160} ${tx+10},${ty-140} ${tx-10},${ty-140}" fill="#ffd166" filter="url(#glow)"/>`);
    } else if(character==='penguin'){
      const px = width*0.42, py = height-90;
      svg.push(`<ellipse cx="${px}" cy="${py}" rx="40" ry="56" fill="#111" stroke="#333" stroke-width="2"/>`);
      svg.push(`<ellipse cx="${px}" cy="${py-18}" rx="26" ry="30" fill="#fff"/>`);
      svg.push(`<circle cx="${px-10}" cy="${py-28}" r="4" fill="#000"/>`);
      svg.push(`<circle cx="${px+10}" cy="${py-28}" r="4" fill="#000"/>`);
      svg.push(`<polygon points="${px},${py-18} ${px-10},${py-6} ${px+10},${py-6}" fill="#ffb347"/>`);
      svg.push(`<path d="M ${px-40} ${py-10} q -20 10 -34 0 M ${px+40} ${py-10} q 20 10 34 0" stroke="#111" stroke-width="8" fill="none"/>`);
      // beanie
      svg.push(`<rect x="${px-28}" y="${py-52}" width="56" height="12" fill="#c00"/>`);
      svg.push(`<rect x="${px-8}" y="${py-40}" width="16" height="18" fill="#c00"/>`);
      svg.push(`<circle cx="${px}" cy="${py-24}" r="8" fill="#ffd166"/>`);
    } else { // giftbot
      const gx = width*0.58, gy = height-90;
      const col = pick(['#ff5d5d','#16d38c','#73b7ff','#ffd166']);
      svg.push(`<rect x="${gx-40}" y="${gy-40}" width="80" height="80" rx="10" fill="${col}" stroke="#333"/>`);
      svg.push(`<rect x="${gx-8}" y="${gy-40}" width="16" height="80" fill="#111" opacity=".25"/>`);
      svg.push(`<rect x="${gx-40}" y="${gy-8}" width="80" height="16" fill="#111" opacity=".25"/>`);
      svg.push(`<circle cx="${gx-14}" cy="${gy-56}" r="6" fill="#fff"/>`);
      svg.push(`<circle cx="${gx+14}" cy="${gy-56}" r="6" fill="#fff"/>`);
      svg.push(`<rect x="${gx-12}" y="${gy-52}" width="24" height="6" rx="3" fill="#fff"/>`);
      svg.push(`<path d="M ${gx-22} ${gy-40} q -20 -20 0 -40 M ${gx+22} ${gy-40} q 20 -20 0 -40" stroke="#ddd" stroke-width="6" fill="none"/>`);
    }

    // foreground snowballs
    for(let i=0;i<6;i++){
      const x = rand(0,width), y = height-20 - rand(0,40), r=rand(5,16);
      svg.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${snow}" opacity=".9"/>`);
    }
    svg.push(`</svg>`);
    return svg.join('');
  }

  function captionForSeed(seed){
    const R = rng(seed);
    const s = setups[Math.floor(R()*setups.length)];
    const p = punchlines[Math.floor(R()*punchlines.length)];
    return s + " " + p;
  }

  // determine "unlocked" days: only show up to today's date unless preview is on
  function isUnlocked(date){
    if(previewToggle.checked) return true;
    const todayYMD = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const dYMD = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return dYMD <= todayYMD;
  }

  // Selected day index
  let selectedIndex = days.findIndex(d=> d.toDateString() === new Date(Math.min(today,target)).toDateString());
  if(selectedIndex < 0) selectedIndex = Math.min(days.length-1, Math.max(0, Math.floor((today - days[0])/msPerDay)));

  function renderCalendar(){
    calendarEl.innerHTML = '';
    days.forEach((d, idx)=>{
      const div = document.createElement('div');
      div.className = 'day' + (isUnlocked(d)?'':' locked');
      div.dataset.index = idx;
      const nice = d.toLocaleDateString(undefined, { month:'short', day:'numeric' });
      div.innerHTML = `<strong>${nice}</strong><span class="small">${d.getDay()===0?'Sun':d.getDay()===1?'Mon':d.getDay()===2?'Tue':d.getDay()===3?'Wed':d.getDay()===4?'Thu':d.getDay()===5?'Fri':'Sat'}</span>`;
      if(d.toDateString() === new Date().toDateString()) {
        const b = document.createElement('span'); b.className='badge'; b.textContent='Today'; div.appendChild(b);
      }
      div.addEventListener('click', ()=>{
        if(isUnlocked(d)){ setSelected(idx); }
      });
      calendarEl.appendChild(div);
    });
  }

  function setSelected(idx){
    selectedIndex = Math.max(0, Math.min(days.length-1, idx));
    const date = days[selectedIndex];
    dayLabel.textContent = date.toLocaleDateString(undefined,{weekday:'long', month:'long', day:'numeric'});
    const seed = Number(String(date.getFullYear()) + String(date.getMonth()+1).padStart(2,'0') + String(date.getDate()).padStart(2,'0'));
    svgHolder.innerHTML = svgForSeed(seed);
    captionEl.textContent = captionForSeed(seed);
  }

  prevDayBtn.addEventListener('click', ()=> setSelected(selectedIndex-1));
  nextDayBtn.addEventListener('click', ()=> setSelected(selectedIndex+1));
  previewToggle.addEventListener('change', ()=> { const prev = selectedIndex; renderCalendar(); setSelected(Math.min(prev, days.length-1)); });

  playBtn.addEventListener('click', ()=>{
    const date = days[selectedIndex];
    const seed = Number(String(date.getFullYear()) + String(date.getMonth()+1).padStart(2,'0') + String(date.getDate()).padStart(2,'0'));
    playJingleForSeed(seed);
  });
  stopBtn.addEventListener('click', stopAll);

  renderCalendar();
  setSelected(selectedIndex);
})();



// ---- Mobile enhancements ----

// Swipe navigation on the illustration card
(function(){
  const el = document.getElementById('svgHolder');
  if(!el) return;
  let startX = 0, startY = 0, swiping = false;
  const THRESH_X = 42; const THRESH_Y = 60;

  function onStart(e){
    const t = e.touches ? e.touches[0] : e;
    startX = t.clientX; startY = t.clientY; swiping = true;
  }
  function onMove(e){
    if(!swiping) return;
    const t = e.touches ? e.touches[0] : e;
    const dx = t.clientX - startX; const dy = t.clientY - startY;
    if(Math.abs(dy) > THRESH_Y) { swiping = false; return; }
    if(Math.abs(dx) > THRESH_X){
      swiping = false;
      if(dx < 0){
        try{ document.getElementById('nextDay').click(); }catch(_){}
      }else{
        try{ document.getElementById('prevDay').click(); }catch(_){}
      }
    }
  }
  function onEnd(){ swiping = false; }
  el.addEventListener('touchstart', onStart, {passive:true});
  el.addEventListener('touchmove', onMove, {passive:true});
  el.addEventListener('touchend', onEnd, {passive:true});
})();

// Keyboard accessibility on buttons (helpful on mobile with external keyboards)
['prevDay','nextDay','playJingle','stopJingle'].forEach(id=>{
  const btn = document.getElementById(id);
  if(btn){ btn.addEventListener('keyup', (e)=>{ if(e.key==='Enter' || e.key===' '){ btn.click(); } }); }
});

// Avoid double-tap-to-zoom for buttons on iOS
document.querySelectorAll('button').forEach(b=>{
  b.style.touchAction = 'manipulation';
});
