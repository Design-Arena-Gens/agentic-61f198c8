(function(){
  const canvas = document.getElementById('posterCanvas');
  const ctx = canvas.getContext('2d');

  const els = {
    format: document.getElementById('formatSelect'),
    align: document.getElementById('alignSelect'),
    title: document.getElementById('titleInput'),
    subtitle: document.getElementById('subtitleInput'),
    cta: document.getElementById('ctaInput'),
    logo: document.getElementById('logoInput'),
    font: document.getElementById('fontSelect'),
    titleSize: document.getElementById('titleSize'),
    bg1: document.getElementById('bg1'),
    bg2: document.getElementById('bg2'),
    textColor: document.getElementById('textColor'),
    accentColor: document.getElementById('accentColor'),
    overlayStrength: document.getElementById('overlayStrength'),
    radius: document.getElementById('radius'),
    imageInput: document.getElementById('imageInput'),
    clearImageBtn: document.getElementById('clearImageBtn'),
    randomPaletteBtn: document.getElementById('randomPaletteBtn'),
    download1x: document.getElementById('download1xBtn'),
    download2x: document.getElementById('download2xBtn'),
    shareBtn: document.getElementById('shareBtn'),
    templateRow: document.getElementById('templateRow'),
  };

  const FORMATS = {
    square: { w: 1080, h: 1080 },
    portrait: { w: 1080, h: 1350 },
    story: { w: 1080, h: 1920 },
  };

  const TEMPLATES = [
    { id: 'bold-center', name: 'Bold Center', draw: drawBoldCenter },
    { id: 'top-left', name: 'Top Left', draw: drawTopLeft },
    { id: 'split', name: 'Split', draw: drawSplit },
    { id: 'minimal', name: 'Minimal', draw: drawMinimal },
  ];

  const PALETTES = [
    ['#0ea5e9', '#7c3aed', '#ffffff', '#f59e0b'],
    ['#ef4444', '#f59e0b', '#0f172a', '#22d3ee'],
    ['#0ea5e9', '#22c55e', '#0b1020', '#f97316'],
    ['#111827', '#374151', '#f9fafb', '#60a5fa'],
    ['#111111', '#1e293b', '#e2e8f0', '#f43f5e'],
    ['#0f172a', '#0b1020', '#ffffff', '#a78bfa'],
  ];

  let currentTemplateId = 'bold-center';
  let bgImage = null; // HTMLImageElement

  const state = {
    format: 'portrait',
    align: 'center',
    title: 'Create standout Instagram posters',
    subtitle: 'Design bold visuals with customizable layouts, colors, and fonts.',
    cta: '@yourhandle ? www.website.com',
    logo: 'POSTERLAB',
    font: 'Inter',
    titleSize: 120,
    bg1: '#0ea5e9',
    bg2: '#7c3aed',
    textColor: '#ffffff',
    accentColor: '#f59e0b',
    overlayStrength: 20,
    radius: 24,
  };

  init();

  function init(){
    initTemplateButtons();
    bindInputs();
    loadFromHash();
    resizeCanvasForFormat();
    render();
  }

  function initTemplateButtons(){
    els.templateRow.innerHTML = '';
    TEMPLATES.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'template-btn';
      btn.textContent = t.name;
      btn.dataset.id = t.id;
      btn.addEventListener('click', () => {
        currentTemplateId = t.id;
        updateTemplateActive();
        render();
      });
      els.templateRow.appendChild(btn);
    });
    updateTemplateActive();
  }

  function updateTemplateActive(){
    Array.from(els.templateRow.children).forEach(ch => {
      ch.classList.toggle('active', ch.dataset.id === currentTemplateId);
    });
  }

  function bindInputs(){
    bind(els.format, 'change', () => { state.format = els.format.value; resizeCanvasForFormat(); render(); saveToHash(); });
    bind(els.align, 'change', () => { state.align = els.align.value; render(); saveToHash(); });
    bind(els.title, 'input', () => { state.title = els.title.value; render(); saveToHash(); });
    bind(els.subtitle, 'input', () => { state.subtitle = els.subtitle.value; render(); saveToHash(); });
    bind(els.cta, 'input', () => { state.cta = els.cta.value; render(); saveToHash(); });
    bind(els.logo, 'input', () => { state.logo = els.logo.value; render(); saveToHash(); });
    bind(els.font, 'change', () => { state.font = els.font.value; render(); saveToHash(); });
    bind(els.titleSize, 'input', () => { state.titleSize = parseInt(els.titleSize.value,10); render(); saveToHash(); });
    bind(els.bg1, 'input', () => { state.bg1 = els.bg1.value; render(); saveToHash(); });
    bind(els.bg2, 'input', () => { state.bg2 = els.bg2.value; render(); saveToHash(); });
    bind(els.textColor, 'input', () => { state.textColor = els.textColor.value; render(); saveToHash(); });
    bind(els.accentColor, 'input', () => { state.accentColor = els.accentColor.value; render(); saveToHash(); });
    bind(els.overlayStrength, 'input', () => { state.overlayStrength = parseInt(els.overlayStrength.value,10); render(); saveToHash(); });
    bind(els.radius, 'input', () => { state.radius = parseInt(els.radius.value,10); render(); saveToHash(); });

    els.imageInput.addEventListener('change', onImageUpload);
    els.clearImageBtn.addEventListener('click', () => { bgImage = null; render(); });

    els.randomPaletteBtn.addEventListener('click', () => {
      const pal = PALETTES[Math.floor(Math.random() * PALETTES.length)];
      state.bg1 = pal[0]; state.bg2 = pal[1]; state.textColor = pal[2]; state.accentColor = pal[3];
      applyStateToInputs();
      render(); saveToHash();
    });

    els.download1x.addEventListener('click', () => download(1));
    els.download2x.addEventListener('click', () => download(2));

    els.shareBtn.addEventListener('click', () => {
      saveToHash();
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        toast('Link copied to clipboard');
      });
    });

    applyStateToInputs();
  }

  function applyStateToInputs(){
    els.format.value = state.format;
    els.align.value = state.align;
    els.title.value = state.title;
    els.subtitle.value = state.subtitle;
    els.cta.value = state.cta;
    els.logo.value = state.logo;
    els.font.value = state.font;
    els.titleSize.value = String(state.titleSize);
    els.bg1.value = state.bg1; els.bg2.value = state.bg2;
    els.textColor.value = state.textColor; els.accentColor.value = state.accentColor;
    els.overlayStrength.value = String(state.overlayStrength);
    els.radius.value = String(state.radius);
  }

  function onImageUpload(e){
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => { bgImage = img; render(); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function resizeCanvasForFormat(){
    const { w, h } = FORMATS[state.format];
    canvas.width = w; canvas.height = h;
  }

  function render(){
    const { w, h } = canvas;

    // Background
    if(bgImage){
      drawImageCover(bgImage, 0, 0, w, h);
    } else {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, state.bg1);
      grad.addColorStop(1, state.bg2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // Overlay
    if(state.overlayStrength > 0){
      ctx.fillStyle = `rgba(0,0,0,${state.overlayStrength/100})`;
      ctx.fillRect(0, 0, w, h);
    }

    // Rounded mask
    if(state.radius > 0){
      ctx.save();
      roundRectPath(0, 0, w, h, state.radius);
      ctx.clip();
      // Repaint what we already drew into clipped region is not needed; clipping from now on
    }

    // Accent decorations and text via template
    const template = TEMPLATES.find(t => t.id === currentTemplateId) || TEMPLATES[0];
    template.draw(ctx, state, w, h);

    // Logo/tag small text
    if(state.logo){
      ctx.save();
      ctx.fillStyle = hexToRgba(state.textColor, 0.9);
      ctx.font = `600 ${Math.round(Math.max(18, Math.min(28, h*0.018)))}px ${safeFont(state.font)}`;
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
      ctx.fillText(state.logo, Math.round(w*0.06), Math.round(h*0.08));
      ctx.restore();
    }

    if(state.radius > 0){
      ctx.restore();
    }
  }

  function drawBoldCenter(ctx, s, w, h){
    const padding = Math.round(w * 0.1);

    // Accent bar
    ctx.save();
    ctx.fillStyle = s.accentColor;
    ctx.fillRect(padding, Math.round(h*0.3), 80, 6);
    ctx.restore();

    // Title
    ctx.save();
    ctx.fillStyle = s.textColor;
    ctx.textAlign = s.align;

    const titleW = w - padding*2;
    const lineHeight = Math.round(s.titleSize * 1.08);

    ctx.font = `800 ${s.titleSize}px ${safeFont(s.font)}`;
    const lines = wrapText(ctx, s.title, titleW, s.align);

    const titleBlockH = lines.length * lineHeight;
    let x = w/2;
    if(s.align === 'left') x = padding;
    if(s.align === 'right') x = w - padding;

    let y = Math.round(h*0.35) + (lineHeight - s.titleSize)/2;
    lines.forEach((line, i) => {
      ctx.fillText(line, x, y + i*lineHeight);
    });
    ctx.restore();

    // Subtitle
    if(s.subtitle){
      ctx.save();
      ctx.fillStyle = hexToRgba(s.textColor, 0.85);
      ctx.font = `600 ${Math.round(s.titleSize*0.22)}px ${safeFont(s.font)}`;
      ctx.textAlign = s.align;
      const subW = w - padding*2;
      const subLines = wrapText(ctx, s.subtitle, subW, s.align);
      const subLH = Math.round(s.titleSize*0.28);

      let sx = w/2;
      if(s.align === 'left') sx = padding;
      if(s.align === 'right') sx = w - padding;

      let sy = Math.round(h*0.35) + Math.round(s.titleSize*1.1) * 2; // below title
      subLines.forEach((line, i) => ctx.fillText(line, sx, sy + i*subLH));
      ctx.restore();
    }

    // CTA
    if(s.cta){
      ctx.save();
      ctx.fillStyle = s.accentColor;
      ctx.font = `700 ${Math.round(s.titleSize*0.22)}px ${safeFont(s.font)}`;
      ctx.textAlign = 'center';
      ctx.fillText(s.cta, w/2, h - Math.round(h*0.07));
      ctx.restore();
    }
  }

  function drawTopLeft(ctx, s, w, h){
    const padding = Math.round(w * 0.08);

    // Split accent rectangle
    ctx.save();
    ctx.fillStyle = hexToRgba(s.accentColor, 0.8);
    roundRectFill(Math.round(w*0.55), 0, Math.round(w*0.5), h, Math.round(w*0.08));
    ctx.restore();

    // Title left aligned
    ctx.save();
    ctx.fillStyle = s.textColor;
    ctx.textAlign = 'left';
    ctx.font = `800 ${s.titleSize}px ${safeFont(s.font)}`;
    const titleW = Math.round(w*0.5) - padding*2;
    const lines = wrapText(ctx, s.title, titleW, 'left');
    const lh = Math.round(s.titleSize*1.05);

    let y = Math.round(h*0.32);
    lines.forEach((line, i) => ctx.fillText(line, padding, y + i*lh));
    ctx.restore();

    if(s.subtitle){
      ctx.save();
      ctx.fillStyle = hexToRgba(s.textColor, .85);
      ctx.font = `600 ${Math.round(s.titleSize*0.22)}px ${safeFont(s.font)}`;
      const subW = Math.round(w*0.5) - padding*2;
      const slines = wrapText(ctx, s.subtitle, subW, 'left');
      const slh = Math.round(s.titleSize*0.28);
      let sy = Math.round(h*0.32) + lh*2;
      slines.forEach((line, i) => ctx.fillText(line, padding, sy + i*slh));
      ctx.restore();
    }

    if(s.cta){
      ctx.save();
      ctx.fillStyle = s.accentColor;
      ctx.font = `700 ${Math.round(s.titleSize*0.22)}px ${safeFont(s.font)}`;
      ctx.textAlign = 'right';
      ctx.fillText(s.cta, w - padding, h - Math.round(h*0.07));
      ctx.restore();
    }
  }

  function drawSplit(ctx, s, w, h){
    const pad = Math.round(w*0.08);

    // Diagonal overlay
    ctx.save();
    ctx.fillStyle = hexToRgba(s.accentColor, .18);
    ctx.beginPath();
    ctx.moveTo(0, Math.round(h*0.6));
    ctx.lineTo(w, Math.round(h*0.4));
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Title centered
    ctx.save();
    ctx.fillStyle = s.textColor;
    ctx.textAlign = s.align;
    ctx.font = `800 ${s.titleSize}px ${safeFont(s.font)}`;
    const titleW = w - pad*2;
    const lines = wrapText(ctx, s.title, titleW, s.align);
    const lh = Math.round(s.titleSize*1.06);

    let x = w/2; if(s.align==='left') x = pad; if(s.align==='right') x = w - pad;
    let y = Math.round(h*0.42) - (lines.length-1)*lh/2;
    lines.forEach((line, i) => ctx.fillText(line, x, y + i*lh));
    ctx.restore();

    if(s.cta){
      ctx.save();
      ctx.fillStyle = hexToRgba(s.textColor, .9);
      ctx.font = `700 ${Math.round(s.titleSize*0.22)}px ${safeFont(s.font)}`;
      ctx.textAlign = 'center';
      ctx.fillText(s.cta, w/2, h - Math.round(h*0.06));
      ctx.restore();
    }
  }

  function drawMinimal(ctx, s, w, h){
    const pad = Math.round(w*0.09);

    // Subtle border
    ctx.save();
    ctx.strokeStyle = hexToRgba(s.textColor, .25);
    ctx.lineWidth = 4;
    roundRectStroke(pad, pad, w - pad*2, h - pad*2, Math.max(8, s.radius*0.6));
    ctx.restore();

    // Title
    ctx.save();
    ctx.fillStyle = s.textColor;
    ctx.textAlign = s.align;
    ctx.font = `800 ${s.titleSize}px ${safeFont(s.font)}`;
    const titleW = w - pad*2;
    const lines = wrapText(ctx, s.title, titleW, s.align);
    const lh = Math.round(s.titleSize*1.05);
    let x = w/2; if(s.align==='left') x = pad; if(s.align==='right') x = w - pad;
    let y = Math.round(h*0.5) - (lines.length-1)*lh/2;
    lines.forEach((line, i) => ctx.fillText(line, x, y + i*lh));
    ctx.restore();

    // CTA subtle
    if(s.cta){
      ctx.save();
      ctx.fillStyle = hexToRgba(s.textColor, .8);
      ctx.font = `600 ${Math.round(s.titleSize*0.2)}px ${safeFont(s.font)}`;
      ctx.textAlign = 'center';
      ctx.fillText(s.cta, w/2, h - Math.round(h*0.08));
      ctx.restore();
    }
  }

  function wrapText(ctx, text, maxWidth, align){
    const words = (text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';

    for(const word of words){
      const test = current ? current + ' ' + word : word;
      if(ctx.measureText(test).width <= maxWidth){
        current = test;
      } else {
        if(current) lines.push(current);
        current = word;
      }
    }
    if(current) lines.push(current);

    // Avoid very short last line by rebalancing
    if(lines.length >= 2){
      const last = lines[lines.length-1];
      if(last.length < 6){
        const prev = lines[lines.length-2];
        const parts = prev.split(' ');
        if(parts.length > 1){
          const moved = parts.pop();
          lines[lines.length-2] = parts.join(' ');
          lines[lines.length-1] = moved + ' ' + last;
        }
      }
    }

    // For right alignment, keep text order but rendering with textAlign handles offset
    return lines;
  }

  function roundRectPath(x, y, w, h, r){
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }
  function roundRectFill(x, y, w, h, r){
    roundRectPath(x,y,w,h,r); ctx.fill();
  }
  function roundRectStroke(x, y, w, h, r){
    roundRectPath(x,y,w,h,r); ctx.stroke();
  }

  function drawImageCover(img, x, y, w, h){
    const iw = img.width, ih = img.height;
    const ir = iw/ih, r = w/h;
    let sw, sh, sx, sy;
    if(ir > r){
      sh = ih; sw = ih * r; sx = (iw - sw)/2; sy = 0;
    } else {
      sw = iw; sh = iw / r; sx = 0; sy = (ih - sh)/2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function hexToRgba(hex, a){
    const res = hex.replace('#','');
    const bigint = parseInt(res.length === 3 ? res.split('').map(h=>h+h).join('') : res, 16);
    const r = (bigint >> 16) & 255; const g = (bigint >> 8) & 255; const b = bigint & 255;
    return `rgba(${r},${g},${b},${a})`;
  }

  function safeFont(f){
    // fallbacks for Playfair
    if(f === 'Playfair Display') return '"Playfair Display", Georgia, serif';
    if(f === 'Poppins') return 'Poppins, Inter, system-ui, sans-serif';
    return 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';
  }

  function bind(el, ev, fn){ el.addEventListener(ev, fn); }

  function download(scale){
    const { w, h } = FORMATS[state.format];
    const tmp = document.createElement('canvas');
    tmp.width = w*scale; tmp.height = h*scale;
    const tctx = tmp.getContext('2d');

    // Clone state for scaled render
    const prev = { ...state };

    // Draw into tmp by temporarily swapping context scaling
    tctx.save();
    tctx.scale(scale, scale);

    // Draw background
    if(bgImage){
      // to reuse cover logic, switch ctx temporarily
      const old = ctx; window.__ctx_old = old; Object.assign(ctx, tctx);
      drawImageCover(bgImage, 0, 0, w, h);
      Object.assign(ctx, old);
    } else {
      const grad = tctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, state.bg1);
      grad.addColorStop(1, state.bg2);
      tctx.fillStyle = grad;
      tctx.fillRect(0, 0, w, h);
    }
    if(state.overlayStrength>0){
      tctx.fillStyle = `rgba(0,0,0,${state.overlayStrength/100})`;
      tctx.fillRect(0,0,w,h);
    }

    // Rounded mask via clipping
    if(state.radius>0){
      tctx.save();
      tctx.beginPath();
      const r = Math.min(state.radius, w/2, h/2);
      tctx.moveTo(r, 0);
      tctx.arcTo(w, 0, w, h, r);
      tctx.arcTo(w, h, 0, h, r);
      tctx.arcTo(0, h, 0, 0, r);
      tctx.arcTo(0, 0, w, 0, r);
      tctx.closePath();
      tctx.clip();
    }

    // Draw template content by calling template draw with a temporary ctx-like wrapper
    const template = TEMPLATES.find(t => t.id === currentTemplateId) || TEMPLATES[0];
    template.draw(tctx, state, w, h);

    // Logo/tag
    if(state.logo){
      tctx.fillStyle = hexToRgba(state.textColor, 0.9);
      tctx.font = `600 ${Math.round(Math.max(18, Math.min(28, h*0.018)))}px ${safeFont(state.font)}`;
      tctx.textBaseline = 'alphabetic';
      tctx.textAlign = 'left';
      tctx.fillText(state.logo, Math.round(w*0.06), Math.round(h*0.08));
    }

    if(state.radius>0){ tctx.restore(); }
    tctx.restore();

    const a = document.createElement('a');
    a.download = `poster_${state.format}@${scale}x.png`;
    a.href = tmp.toDataURL('image/png');
    a.click();
  }

  function toast(msg){
    const t = document.createElement('div');
    t.textContent = msg; t.className = 'toast';
    Object.assign(t.style, {
      position:'fixed', bottom:'20px', left:'50%', transform:'translateX(-50%)',
      background:'#0f172a', border:'1px solid #334155', color:'#e2e8f0',
      padding:'10px 14px', borderRadius:'10px', zIndex:50, boxShadow:'0 6px 24px rgba(0,0,0,.3)'
    });
    document.body.appendChild(t);
    setTimeout(()=>{ t.remove(); }, 1600);
  }

  function saveToHash(){
    const payload = { ...state, template: currentTemplateId, hasImg: !!bgImage };
    try{
      const encoded = encodeURIComponent(JSON.stringify(payload));
      location.hash = encoded;
    }catch{}
  }

  function loadFromHash(){
    if(!location.hash) return;
    try{
      const obj = JSON.parse(decodeURIComponent(location.hash.slice(1)));
      if(!obj) return;
      Object.assign(state, obj);
      currentTemplateId = obj.template || currentTemplateId;
      applyStateToInputs();
      updateTemplateActive();
    }catch{}
  }
})();
