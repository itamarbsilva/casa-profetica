/* =====================================================================
   LÓGICA DO SITE — não é preciso editar este arquivo para trocar imagens.
   Todo conteúdo editável está em assets/js/config.js
   ===================================================================== */
(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Escapa texto antes de inserir em HTML (evita quebrar o layout com aspas, < >, etc.)
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Se a imagem não carregar (arquivo trocado/apagado), mostra o degradê de fundo no lugar
  const onImgError = "this.classList.add('img-erro')";
  const imgTag = (src, alt, cls, foco = 'center', lazy = true) =>
    `<img src="${esc(src)}" alt="${esc(alt)}" class="${cls}" style="object-position:${esc(foco)}" ${lazy ? 'loading="lazy"' : ''} decoding="async" onerror="${onImgError}">`;

  /* ------------------------------------------------------------------
     LOGO
  ------------------------------------------------------------------ */
  const LOGO_SVG = `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-3/4 h-3/4" aria-hidden="true">
      <path d="M8 30L32 10L56 30" stroke="#F59E0B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M15 25V44" stroke="#F59E0B" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M33 22V44M26 29H40" stroke="#F59E0B" stroke-width="4" stroke-linecap="round"/>
      <path d="M12 50C24 44 40 44 56 40" stroke="#F59E0B" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M16 56C28 51 42 51 56 47" stroke="#F59E0B" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`;
  $$('.logo-slot').forEach((el) => {
    el.innerHTML = SITE.logo
      ? `<img src="${esc(SITE.logo)}" alt="Logo ${esc(SITE.nome)}" class="w-full h-full object-contain p-1">`
      : LOGO_SVG;
  });

  /* ------------------------------------------------------------------
     LINKS, PIX E TEXTOS GLOBAIS
  ------------------------------------------------------------------ */
  $$('[data-link]').forEach((a) => { const url = SITE[a.dataset.link]; if (url) a.href = url; });
  $$('[data-pix]').forEach((el) => { el.textContent = SITE.pix; });
  $('#year').textContent = new Date().getFullYear();
  $$('[data-count-from]').forEach((el) => { el.textContent = new Date().getFullYear() - Number(el.dataset.countFrom); });

  /* ------------------------------------------------------------------
     IMAGENS FIXAS (data-img / data-bg)
  ------------------------------------------------------------------ */
  $$('[data-img]').forEach((img) => {
    const cfg = IMAGENS[img.dataset.img];
    if (!cfg || !cfg.src) return;
    img.src = cfg.src;
    img.alt = cfg.alt || '';
    if (cfg.foco) img.style.objectPosition = cfg.foco;
    img.addEventListener('error', () => img.classList.add('img-erro'));
  });
  $$('[data-bg]').forEach((el) => {
    const cfg = IMAGENS[el.dataset.bg];
    if (cfg && cfg.src) {
      el.style.backgroundImage = `url('${cfg.src}')`;
      if (cfg.foco) el.style.backgroundPosition = cfg.foco;
    }
  });

  /* ------------------------------------------------------------------
     TOAST
  ------------------------------------------------------------------ */
  function showToast(msg, icon = 'fa-circle-check') {
    const box = $('#toast-container');
    const t = document.createElement('div');
    t.className = 'bg-brand-surface border border-brand-gold text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm pointer-events-auto transition-all duration-300 max-w-xs';
    t.innerHTML = `<i class="fa-solid ${icon} text-brand-gold text-lg"></i><span>${esc(msg)}</span>`;
    box.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; setTimeout(() => t.remove(), 300); }, 3500);
  }
  window.showToast = showToast;
  $$('[data-toast]').forEach((b) => b.addEventListener('click', () => showToast(b.dataset.toast)));

  /* ------------------------------------------------------------------
     WHATSAPP (se configurado)
  ------------------------------------------------------------------ */
  const waLink = (texto) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(texto)}`;
  if (SITE.whatsapp) {
    const f = $('#whatsapp-float');
    f.href = waLink('Olá! Vim pelo site da Casa Profética.');
    f.classList.remove('hidden'); f.classList.add('flex');
  }

  /* ------------------------------------------------------------------
     BANCO DE DADOS
     Ordem de tentativa: 1) banco da Claude (quando hospedado na Claude)
                         2) Supabase (quando configurado em config.js)
                         3) WhatsApp (link com a mensagem pronta)
  ------------------------------------------------------------------ */
  const BANCO = { db: null, user: null, uid: null };
  const temClaude = !!(window.claude && typeof window.claude.use === 'function');
  if (temClaude) {
    Promise.all([window.claude.use('db'), window.claude.use('user')]).then(async ([db, u]) => {
      BANCO.db = db; BANCO.user = u;
      if (u) { try { BANCO.uid = await u.id(); } catch (_) {} }
      if (db && u && typeof u.canEdit === 'function' && u.canEdit()) $('#admin-btn').classList.remove('hidden');
    }).catch(() => {});
  }
  // Aceita a URL com ou sem "/rest/v1/" no final
  if (SITE.supabaseUrl) SITE.supabaseUrl = SITE.supabaseUrl.replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
  const temSupabase = () => !!(SITE.supabaseUrl && SITE.supabaseKey);
  if (temSupabase()) $('#admin-btn').classList.remove('hidden');

  async function salvarRegistro(tipo, dados) {
    const registro = { tipo, ...dados, em: new Date().toISOString() };
    if (BANCO.db && BANCO.uid) {
      try {
        const ref = BANCO.db.doc('envios/' + BANCO.uid);
        const snap = await ref.get();
        const itens = snap.exists ? [...((snap.data() || {}).itens || [])] : [];
        itens.push(registro);
        await ref.set({ itens: itens.slice(-200), atualizado: Date.now() });
        return true;
      } catch (e) { console.warn('Banco Claude indisponível:', e && e.code); }
    }
    if (temSupabase()) {
      try {
        const r = await fetch(`${SITE.supabaseUrl}/rest/v1/envios`, {
          method: 'POST',
          headers: { apikey: SITE.supabaseKey, Authorization: 'Bearer ' + SITE.supabaseKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ tipo, dados }),
        });
        if (r.ok) return true;
        console.warn('Supabase recusou:', r.status);
      } catch (e) { console.warn('Supabase indisponível'); }
    }
    return false;
  }

  // Salva no banco; se não houver banco, oferece o WhatsApp — nunca finge que enviou
  async function enviar(tipo, dados, textoWhats, msgOk) {
    showToast('Enviando...', 'fa-spinner');
    if (await salvarRegistro(tipo, dados)) { showToast(msgOk); return true; }
    if (SITE.whatsapp) {
      openGeneric(`
        ${header('fa-brands fa-whatsapp', 'Quase lá!', 'Toque no botão para enviar sua mensagem pelo WhatsApp da igreja.')}
        <a href="${esc(waLink(textoWhats))}" target="_blank" rel="noopener" class="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"><i class="fa-brands fa-whatsapp text-xl"></i>Enviar pelo WhatsApp</a>`);
      return true;
    }
    openGeneric(`
      ${header('fa-circle-info', 'Envio indisponível no momento', 'Ainda não conseguimos registrar pelo site. Fale com a gente pelo Instagram — respondemos rapidinho!')}
      <a href="${esc(SITE.instagram)}" target="_blank" rel="noopener" class="w-full gold-gradient text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2"><i class="fa-brands fa-instagram text-xl"></i>Chamar no Instagram</a>`);
    return false;
  }

  /* ------------------------------------------------------------------
     BANNER / SLIDER
  ------------------------------------------------------------------ */
  const slidesBox = $('#banner-slides');
  const bulletsBox = $('#banner-bullets');
  const botoesHTML = (s) => (s.botoes || []).map((b) => {
    const ext = /^https?:/.test(b.link);
    const icon = b.icone ? `<i class="${b.icone.includes('fa-brands') ? esc(b.icone) : 'fa-solid ' + esc(b.icone)} ${b.principal ? '' : 'text-brand-gold'}"></i>` : '';
    const cls = b.principal
      ? 'gold-gradient text-black font-bold shadow-lg hover:brightness-110'
      : 'bg-black/40 hover:bg-white/20 text-white font-semibold border border-white/20 backdrop-blur-sm';
    return `<a href="${esc(b.link)}" ${ext ? 'target="_blank" rel="noopener"' : ''} class="${cls} px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl transition flex items-center gap-2 text-sm sm:text-base">
      ${b.principal ? `<span>${esc(b.texto)}</span>${icon}` : `${icon}<span>${esc(b.texto)}</span>`}</a>`;
  }).join('');

  // Slide de arte pronta: imagem inteira (blur de fundo preenche as sobras) + botões embaixo
  const slideSoImagem = (s, i) => `
    <div class="banner-slide absolute inset-0 ${i === 0 ? 'is-active' : 'opacity-0 pointer-events-none'}" role="group" aria-roledescription="slide" aria-label="${i + 1} de ${BANNER.length}" ${i ? 'aria-hidden="true"' : ''}>
      <div class="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-110" style="background-image:url('${esc(s.imagem)}')"></div>
      <div class="slide-bg absolute inset-0 flex items-center justify-center pb-24 sm:pb-0">
        ${imgTag(s.imagem, s.alt || 'Banner', 'w-full h-full object-contain lg:object-cover', s.foco || 'center', i !== 0)}
      </div>
      <div class="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
      <div class="absolute inset-x-0 bottom-24 sm:bottom-28 z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-3 sm:gap-4">${botoesHTML(s)}</div>
    </div>`;

  slidesBox.innerHTML = BANNER.map((s, i) => s.soImagem ? slideSoImagem(s, i) : `
    <div class="banner-slide absolute inset-0 flex items-center ${i === 0 ? 'is-active' : 'opacity-0 pointer-events-none'}" role="group" aria-roledescription="slide" aria-label="${i + 1} de ${BANNER.length}" ${i ? 'aria-hidden="true"' : ''}>
      <div class="slide-bg absolute inset-0 img-box">
        ${imgTag(s.imagem, '', 'w-full h-full object-cover', s.foco, i !== 0)}
      </div>
      <div class="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/10"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-16 sm:pb-0">
        <div class="max-w-2xl space-y-4 sm:space-y-5">
          <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-brand-gold/20 text-brand-gold border border-brand-gold/40 backdrop-blur-sm">
            <i class="fa-solid ${esc(s.icone)}"></i> ${esc(s.selo)}
          </span>
          <${i === 0 ? 'h1' : 'h2'} class="font-display font-black text-4xl sm:text-6xl text-white leading-tight drop-shadow-lg">
            ${esc(s.titulo)} <span class="gold-text-gradient">${esc(s.destaque)}</span>
          </${i === 0 ? 'h1' : 'h2'}>
          <p class="text-gray-200 text-base sm:text-lg leading-relaxed">${esc(s.texto)}</p>
          <div class="pt-2 sm:pt-3 flex flex-wrap gap-3 sm:gap-4">
            ${botoesHTML(s)}
          </div>
        </div>
      </div>
    </div>`).join('');

  bulletsBox.innerHTML = BANNER.map((_, i) =>
    `<button type="button" class="banner-bullet h-2.5 rounded-full transition-all" data-go="${i}" aria-label="Ir para o slide ${i + 1}"></button>`).join('');

  const slides = $$('.banner-slide');
  const bullets = $$('.banner-bullet');
  let current = 0, timer = null;
  const DELAY = 6500;

  function updateSlider() {
    slides.forEach((s, i) => {
      const on = i === current;
      s.classList.toggle('is-active', on);
      s.classList.toggle('opacity-0', !on);
      s.classList.toggle('pointer-events-none', !on);
      s.setAttribute('aria-hidden', on ? 'false' : 'true');
      if (on) { const im = $('img', s); if (im) im.loading = 'eager'; }
    });
    bullets.forEach((b, i) => {
      b.className = 'banner-bullet h-2.5 rounded-full transition-all ' + (i === current ? 'w-8 bg-brand-gold' : 'w-2.5 bg-white/40 hover:bg-white/70');
      b.setAttribute('aria-current', i === current ? 'true' : 'false');
    });
  }
  const go = (i) => { current = (i + slides.length) % slides.length; updateSlider(); };
  const start = () => { stop(); if (slides.length > 1) timer = setInterval(() => go(current + 1), DELAY); };
  const stop = () => { if (timer) clearInterval(timer); timer = null; };
  const goAndRestart = (i) => { go(i); start(); };

  $('#banner-prev').addEventListener('click', () => goAndRestart(current - 1));
  $('#banner-next').addEventListener('click', () => goAndRestart(current + 1));
  bullets.forEach((b) => b.addEventListener('click', () => goAndRestart(Number(b.dataset.go))));
  const slider = $('#banner-slider');
  slider.addEventListener('mouseenter', stop);
  slider.addEventListener('mouseleave', start);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  // Arrastar com o dedo no celular
  let touchX = null;
  slider.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  slider.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) goAndRestart(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });
  if (BANNER.length < 2) { $('#banner-prev').remove(); $('#banner-next').remove(); bulletsBox.remove(); }
  updateSlider(); start();

  /* ------------------------------------------------------------------
     MODAL DE MÍDIA (YouTube / vídeo local / galeria)
  ------------------------------------------------------------------ */
  const mModal = $('#media-modal');
  const mBody = $('#media-modal-body');
  const mTitle = $('#media-modal-title');
  let galleryIndex = -1;
  let lastFocus = null;

  function openLayer(el) {
    lastFocus = document.activeElement;
    el.classList.remove('hidden'); el.classList.add('flex');
    document.body.classList.add('modal-open');
    const btn = $('[data-close], button', el); if (btn) btn.focus();
  }
  function closeLayer(el) {
    el.classList.add('hidden'); el.classList.remove('flex');
    if (!$('#media-modal.flex, #generic-modal.flex')) document.body.classList.remove('modal-open');
    if (lastFocus) lastFocus.focus();
  }

  const ytWatch = (url) => { const id = (String(url).match(/embed\/([^?&]+)/) || [])[1]; return id ? 'https://www.youtube.com/watch?v=' + id : SITE.youtube; };
  function openMedia({ youtube, arquivo, imagem, titulo, capa }) {
    galleryIndex = -1;
    $('#media-prev').classList.add('hidden'); $('#media-next').classList.add('hidden');
    mTitle.textContent = titulo || '';
    if (youtube && SITE.permitirIncorporar === false) {
      mBody.innerHTML = `<div class="w-full max-w-3xl aspect-video relative rounded-2xl overflow-hidden border border-white/15 bg-black img-box">
        ${capa ? imgTag(capa, '', 'w-full h-full object-cover opacity-50', 'center', false) : ''}
        <div class="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <i class="fa-brands fa-youtube text-6xl text-red-500"></i>
          <a href="${esc(ytWatch(youtube))}" target="_blank" rel="noopener" class="gold-gradient text-black font-bold px-6 py-3 rounded-xl flex items-center gap-2"><i class="fa-solid fa-play"></i>Assistir no YouTube</a>
        </div></div>`;
    } else if (youtube) {
      const sep = youtube.includes('?') ? '&' : '?';
      mBody.innerHTML = `<div class="w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/15">
        <iframe class="w-full h-full" src="${esc(youtube)}${sep}autoplay=1&rel=0" title="${esc(titulo)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`;
    } else if (arquivo) {
      mBody.innerHTML = `<video src="${esc(arquivo)}" class="max-h-[80vh] max-w-full rounded-2xl border border-white/15 bg-black" controls autoplay playsinline></video>`;
    } else if (imagem) {
      mBody.innerHTML = `<img src="${esc(imagem)}" alt="${esc(titulo)}" class="max-h-[80vh] max-w-full rounded-2xl border border-white/15 object-contain">`;
    }
    openLayer(mModal);
  }
  function closeMedia() { mBody.innerHTML = ''; closeLayer(mModal); }
  window.openMedia = openMedia;

  function showGallery(i) {
    galleryIndex = (i + GALERIA.length) % GALERIA.length;
    const g = GALERIA[galleryIndex];
    mTitle.textContent = `${g.legenda || ''}  (${galleryIndex + 1}/${GALERIA.length})`;
    mBody.innerHTML = `<img src="${esc(g.src)}" alt="${esc(g.legenda)}" class="max-h-[80vh] max-w-full rounded-2xl border border-white/15 object-contain">`;
    $('#media-prev').classList.remove('hidden'); $('#media-next').classList.remove('hidden');
    if (!mModal.classList.contains('flex')) openLayer(mModal);
  }
  $('#media-prev').addEventListener('click', () => showGallery(galleryIndex - 1));
  $('#media-next').addEventListener('click', () => showGallery(galleryIndex + 1));
  $('[data-close]', mModal).addEventListener('click', closeMedia);
  mModal.addEventListener('click', (e) => { if (e.target === mModal) closeMedia(); });

  /* ------------------------------------------------------------------
     AO VIVO — player carrega só ao clicar (site mais leve)
  ------------------------------------------------------------------ */
  const live = $('#live-player');
  const ytId = (PALAVRAS.aoVivo.match(/embed\/([^?&]+)/) || [])[1];
  if (SITE.permitirIncorporar === false) {
    live.innerHTML = `
      <a href="${esc(ytWatch(PALAVRAS.aoVivo))}" target="_blank" rel="noopener" class="group absolute inset-0 block img-box" aria-label="Assistir no YouTube">
        ${imgTag(IMAGENS.palavraPrincipal.src, '', 'w-full h-full object-cover opacity-60 group-hover:opacity-80 transition', IMAGENS.palavraPrincipal.foco)}
        <span class="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <span class="w-20 h-20 rounded-full gold-gradient text-black text-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition"><i class="fa-solid fa-play ml-1"></i></span>
          <span class="text-white font-bold text-sm bg-black/50 px-4 py-1.5 rounded-full"><i class="fa-brands fa-youtube text-red-500 mr-1.5"></i>Assistir no YouTube</span>
        </span>
      </a>`;
  } else {
  live.innerHTML = `
    <button type="button" class="group absolute inset-0 w-full h-full" aria-label="Reproduzir vídeo">
      ${ytId ? `<img src="https://i.ytimg.com/vi/${esc(ytId)}/hqdefault.jpg" alt="" class="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition" loading="lazy">` : ''}
      <span class="absolute inset-0 flex items-center justify-center">
        <span class="w-20 h-20 rounded-full gold-gradient text-black text-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition"><i class="fa-solid fa-play ml-1"></i></span>
      </span>
    </button>`;
  $('button', live).addEventListener('click', () => {
    live.innerHTML = `<iframe class="w-full h-full" src="${esc(PALAVRAS.aoVivo)}?autoplay=1&rel=0" title="Transmissão Casa Profética" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  });
  }

  /* MAPA */
  const mapsQ = 'Igreja Batista Casa Profética Bairro dos Casa São Bernardo do Campo';
  $('#map-box').innerHTML = SITE.permitirIncorporar === false
    ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQ)}" target="_blank" rel="noopener" class="group relative flex flex-col items-center justify-center gap-3 w-full h-full img-box text-center p-6" style="background-image:radial-gradient(circle at 30% 30%,rgba(245,158,11,.18),transparent 60%),repeating-linear-gradient(45deg,rgba(255,255,255,.03) 0 2px,transparent 2px 22px)">
        <span class="w-16 h-16 rounded-full gold-gradient text-black text-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition"><i class="fa-solid fa-map-location-dot"></i></span>
        <span class="text-white font-bold">Abrir no Google Maps</span>
        <span class="text-gray-400 text-xs">Estrada dos Casa, 3362 — Bairro dos Casa, SBC</span></a>`
    : `<iframe title="Mapa da Igreja Batista Casa Profética" width="100%" height="100%" style="border:0" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=${encodeURIComponent(mapsQ)}&t=&z=15&ie=UTF8&iwloc=&output=embed"></iframe>`;

  /* ------------------------------------------------------------------
     PALAVRAS (cards do YouTube)
  ------------------------------------------------------------------ */
  $$('[data-palavra]').forEach((card) => {
    const p = PALAVRAS[card.dataset.palavra];
    if (!p) return;
    $$('[data-txt]', card).forEach((el) => { el.textContent = p[el.dataset.txt] || ''; if (!p[el.dataset.txt]) el.classList.add('hidden'); });
    card.setAttribute('aria-label', 'Assistir: ' + p.titulo);
    const im = $('img', card);
    card.addEventListener('click', () => openMedia({ youtube: p.youtube, titulo: p.titulo, capa: im && im.src }));
  });

  /* ------------------------------------------------------------------
     VÍDEOS VERTICAIS
  ------------------------------------------------------------------ */
  $('#videos-row').innerHTML = VIDEOS.map((v, i) => `
    <button type="button" data-video="${i}" class="group relative shrink-0 w-[46%] sm:w-[30%] lg:w-[19%] aspect-[9/16] rounded-2xl overflow-hidden border border-white/10 hover:border-brand-gold/60 transition img-box text-left">
      ${imgTag(v.capa, v.titulo, 'w-full h-full object-cover group-hover:scale-105 transition duration-500', 'center', false)}
      <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent"></div>
      <span class="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center text-xs group-hover:bg-brand-gold group-hover:text-black transition"><i class="fa-solid fa-play ml-0.5"></i></span>
      <span class="absolute bottom-0 inset-x-0 p-3 text-white font-bold text-sm leading-tight">${esc(v.titulo)}</span>
    </button>`).join('');
  $$('[data-video]').forEach((b) => b.addEventListener('click', () => {
    const v = VIDEOS[Number(b.dataset.video)];
    openMedia({ arquivo: v.arquivo, youtube: v.youtube, titulo: v.titulo });
  }));
  $$('[data-scroll]').forEach((b) => b.addEventListener('click', () => {
    const row = document.getElementById(b.dataset.scroll);
    row.scrollBy({ left: row.clientWidth * 0.8 * Number(b.dataset.dir), behavior: 'smooth' });
  }));

  /* ------------------------------------------------------------------
     GALERIA
  ------------------------------------------------------------------ */
  $('#gallery-grid').innerHTML = GALERIA.map((g, i) => `
    <button type="button" data-gal="${i}" class="reveal group relative block w-full rounded-2xl overflow-hidden border border-white/10 hover:border-brand-gold/60 transition img-box" aria-label="Ampliar foto: ${esc(g.legenda)}">
      ${imgTag(g.src, g.legenda, 'w-full h-auto group-hover:scale-105 transition duration-500', 'center', false)}
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-3">
        <span class="text-white text-xs font-semibold"><i class="fa-solid fa-expand text-brand-gold mr-1.5"></i>${esc(g.legenda)}</span>
      </div>
    </button>`).join('');
  $$('[data-gal]').forEach((b) => b.addEventListener('click', () => showGallery(Number(b.dataset.gal))));

  /* ------------------------------------------------------------------
     CÉLULAS
  ------------------------------------------------------------------ */
  const uniq = (arr) => [...new Set(arr)];
  $('#cell-network').innerHTML = '<option value="all">Todas as Redes</option>' + uniq(CELULAS.map((c) => c.rede)).map((r) => `<option>${esc(r)}</option>`).join('');
  $('#cell-day').innerHTML = '<option value="all">Qualquer Dia</option>' + uniq(CELULAS.map((c) => c.dia)).map((d) => `<option>${esc(d)}</option>`).join('');

  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); // ignora acentos na busca

  function renderCells(list) {
    const box = $('#cells-grid');
    if (!list.length) {
      box.innerHTML = '<div class="md:col-span-3 text-center py-8 text-gray-400"><i class="fa-solid fa-magnifying-glass text-2xl text-brand-gold mb-3 block"></i>Nenhuma célula encontrada com esses filtros.</div>';
      return;
    }
    box.innerHTML = list.map((c) => `
      <div class="bg-brand-card border border-white/10 rounded-2xl p-6 card-hover flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3 gap-2">
            <span class="text-[11px] font-bold uppercase px-3 py-1 rounded-full bg-brand-gold/20 text-brand-gold">${esc(c.rede)}</span>
            <span class="text-xs text-gray-400"><i class="fa-regular fa-clock mr-1 text-brand-gold"></i>${esc(c.dia)} às ${esc(c.hora)}</span>
          </div>
          <h4 class="font-display font-bold text-lg text-white mb-1">${esc(c.nome)}</h4>
          <p class="text-gray-400 text-xs mb-3"><i class="fa-solid fa-location-dot text-brand-gold mr-1.5"></i>${esc(c.bairro)}</p>
          <p class="text-gray-300 text-xs mb-5"><strong>Líderes:</strong> ${esc(c.lideres)}</p>
        </div>
        <button type="button" data-cell="${esc(c.nome)}" class="w-full py-2.5 rounded-xl border border-brand-gold/50 text-brand-gold hover:bg-brand-gold hover:text-black font-semibold text-xs uppercase tracking-wider transition">Quero Participar desta Célula</button>
      </div>`).join('');
    $$('[data-cell]', box).forEach((b) => b.addEventListener('click', () => openCellModal(b.dataset.cell)));
  }
  function filterCells() {
    const q = norm($('#cell-search').value);
    const net = $('#cell-network').value;
    const day = $('#cell-day').value;
    renderCells(CELULAS.filter((c) =>
      (norm(c.nome).includes(q) || norm(c.bairro).includes(q)) &&
      (net === 'all' || c.rede === net) &&
      (day === 'all' || c.dia === day)));
  }
  $('#cell-search').addEventListener('input', filterCells);
  $('#cell-network').addEventListener('change', filterCells);
  $('#cell-day').addEventListener('change', filterCells);
  renderCells(CELULAS);

  /* ------------------------------------------------------------------
     EVENTOS
  ------------------------------------------------------------------ */
  $('#events-grid').innerHTML = EVENTOS.map((e, i) => `
    <div class="reveal bg-brand-card border border-white/10 rounded-2xl overflow-hidden card-hover flex flex-col">
      <div class="relative h-52 overflow-hidden img-box">
        ${imgTag(e.imagem, e.titulo, 'w-full h-full object-cover', e.foco)}
        <span class="absolute top-3 right-3 ${e.cor === 'dourado' ? 'bg-brand-gold' : 'bg-emerald-500'} text-black text-[11px] font-bold px-3 py-1 rounded-full uppercase">${esc(e.status)}</span>
      </div>
      <div class="p-6 flex-1 flex flex-col justify-between">
        <div>
          <span class="text-xs font-bold text-brand-gold uppercase">${esc(e.data)}</span>
          <h3 class="font-display font-bold text-xl text-white mt-1.5 mb-2">${esc(e.titulo)}</h3>
          <p class="text-gray-400 text-sm mb-4">${esc(e.texto)}</p>
        </div>
        <button type="button" data-event="${i}" class="w-full py-2.5 rounded-xl bg-white/10 hover:bg-brand-gold hover:text-black font-semibold text-sm transition">${esc(e.botao)}</button>
      </div>
    </div>`).join('');
  $$('[data-event]').forEach((b) => b.addEventListener('click', () => openEventModal(EVENTOS[Number(b.dataset.event)])));

  /* ------------------------------------------------------------------
     NOTÍCIAS
  ------------------------------------------------------------------ */
  $('#news-grid').innerHTML = NOTICIAS.map((n, i) => `
    <article class="reveal bg-brand-card border border-white/10 rounded-2xl overflow-hidden card-hover flex flex-col">
      <div class="h-48 overflow-hidden img-box">${imgTag(n.imagem, n.titulo, 'h-full w-full object-cover', n.foco)}</div>
      <div class="p-5 flex-1 flex flex-col justify-between">
        <div>
          <span class="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-brand-gold/20 text-brand-gold mb-2">${esc(n.categoria)}</span>
          <h3 class="font-bold text-base text-white mb-2 line-clamp-2">${esc(n.titulo)}</h3>
        </div>
        <div class="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-white/5">
          <span><i class="fa-regular fa-calendar mr-1"></i> ${esc(n.data)}</span>
          <button type="button" data-news="${i}" class="text-brand-gold font-semibold hover:underline">Ler mais</button>
        </div>
      </div>
    </article>`).join('');
  $$('[data-news]').forEach((b) => b.addEventListener('click', () => openArticleModal(NOTICIAS[Number(b.dataset.news)])));

  /* ------------------------------------------------------------------
     MODAL GENÉRICO
  ------------------------------------------------------------------ */
  const gModal = $('#generic-modal');
  const gContent = $('#generic-modal-content');
  const closeBtn = '<button type="button" data-close class="absolute top-5 right-5 text-gray-400 hover:text-white" aria-label="Fechar"><i class="fa-solid fa-xmark text-xl"></i></button>';
  const inputCls = 'w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-gold';
  const header = (icon, title, sub) => `
    <div class="text-center mb-6">
      <div class="w-12 h-12 rounded-2xl gold-gradient text-black flex items-center justify-center mx-auto mb-3 text-xl font-bold"><i class="${icon.includes('fa-brands') ? icon : 'fa-solid ' + icon}"></i></div>
      <h3 class="font-display font-bold text-xl text-white">${title}</h3>
      <p class="text-xs text-gray-400 mt-1">${sub}</p>
    </div>`;

  function openGeneric(html, onSubmit) {
    gContent.classList.replace('max-w-2xl', 'max-w-md');
    gContent.innerHTML = closeBtn + html;
    $('[data-close]', gContent).addEventListener('click', closeGeneric);
    $$('[data-close-btn]', gContent).forEach((b) => b.addEventListener('click', closeGeneric));
    const form = $('form', gContent);
    if (form && onSubmit) form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      closeGeneric();
      onSubmit(d);
    });
    openLayer(gModal);
    const first = $('input', gContent); if (first) first.focus();
  }
  function closeGeneric() { closeLayer(gModal); }
  gModal.addEventListener('click', (e) => { if (e.target === gModal) closeGeneric(); });

  const MODAIS = {
    login: () => openGeneric(`
      ${header('fa-user-lock', 'Área do Membro', 'Acesse seu perfil, inscrições e conteúdos exclusivos')}
      <form class="space-y-4">
        <div><label class="block text-xs text-gray-400 mb-1">E-mail</label><input name="email" type="email" required placeholder="seu@email.com" class="${inputCls}"></div>
        <div><label class="block text-xs text-gray-400 mb-1">Senha</label><input name="senha" type="password" required placeholder="••••••••" class="${inputCls}"></div>
        <button type="submit" class="w-full gold-gradient text-black font-bold py-3 rounded-xl">Entrar no Portal</button>
      </form>`, () => showToast('Área do membro em breve! Fique de olho nas novidades.', 'fa-circle-info')),

    jesus: () => openGeneric(`
      ${header('fa-heart', 'Quero Aceitar Jesus!', 'O céu está em festa pela sua decisão! Preencha abaixo para nossa equipe acolher você.')}
      <form class="space-y-4">
        <input name="nome" type="text" required placeholder="Seu Nome Completo" class="${inputCls}" aria-label="Nome">
        <input name="tel" type="tel" required placeholder="Seu WhatsApp (11) 90000-0000" class="${inputCls}" aria-label="WhatsApp">
        <button type="submit" class="w-full gold-gradient text-black font-bold py-3 rounded-xl">Enviar Decisão</button>
      </form>`, (d) => enviar('decisao', d, `Olá! Meu nome é ${d.nome} e tomei a decisão de aceitar Jesus. Meu contato: ${d.tel}`, 'Glória a Deus! Nossa equipe entrará em contato com você.')),
  };
  $$('[data-modal]').forEach((b) => b.addEventListener('click', () => MODAIS[b.dataset.modal] && MODAIS[b.dataset.modal]()));

  function openEventModal(ev) {
    openGeneric(`
      <span class="text-xs font-bold text-brand-gold uppercase">${esc(ev.data)}</span>
      <h3 class="font-display font-bold text-xl text-white mt-1 mb-4 pr-8">${esc(ev.titulo)}</h3>
      <form class="space-y-4">
        <input name="nome" type="text" required placeholder="Seu Nome Completo" class="${inputCls}" aria-label="Nome">
        <input name="email" type="email" required placeholder="Seu E-mail" class="${inputCls}" aria-label="E-mail">
        <input name="tel" type="tel" required placeholder="Seu WhatsApp" class="${inputCls}" aria-label="WhatsApp">
        <button type="submit" class="w-full gold-gradient text-black font-bold py-3 rounded-xl">Confirmar Inscrição</button>
      </form>`, (d) => enviar('inscricao', { evento: ev.titulo, ...d }, `Inscrição: ${ev.titulo} (${ev.data})\nNome: ${d.nome}\nE-mail: ${d.email}\nWhatsApp: ${d.tel}`, `Inscrição registrada para ${ev.titulo}!`));
  }

  function openCellModal(nome) {
    openGeneric(`
      ${header('fa-house-chimney-user', esc(nome), 'Deixe seu contato e os líderes da célula vão te chamar.')}
      <form class="space-y-4">
        <input name="nome" type="text" required placeholder="Seu Nome" class="${inputCls}" aria-label="Nome">
        <input name="tel" type="tel" required placeholder="Seu WhatsApp" class="${inputCls}" aria-label="WhatsApp">
        <button type="submit" class="w-full gold-gradient text-black font-bold py-3 rounded-xl">Quero Participar</button>
      </form>`, (d) => enviar('celula', { celula: nome, ...d }, `Olá! Sou ${d.nome} e quero participar da ${nome}. Contato: ${d.tel}`, `Interesse registrado! Os líderes da "${nome}" vão falar com você.`));
  }

  /* ------------------------------------------------------------------
     PAINEL DE GESTÃO (lista o que chegou pelo site)
  ------------------------------------------------------------------ */
  const TIPOS = { oracao: 'Pedido de oração', decisao: 'Aceitou Jesus', inscricao: 'Inscrição em evento', celula: 'Interesse em célula' };
  async function carregarEnvios() {
    if (BANCO.db) {
      const snap = await BANCO.db.collection('envios').get();
      return snap.docs.flatMap((d) => ((d.data() || {}).itens || []));
    }
    if (temSupabase()) {
      const token = sessionStorage.getItem('sb_token');
      if (!token) return null;
      const r = await fetch(`${SITE.supabaseUrl}/rest/v1/envios?select=*&order=criado_em.desc&limit=500`, { headers: { apikey: SITE.supabaseKey, Authorization: 'Bearer ' + token } });
      if (!r.ok) { sessionStorage.removeItem('sb_token'); return null; }
      return (await r.json()).map((x) => ({ tipo: x.tipo, ...x.dados, em: x.criado_em }));
    }
    return [];
  }
  function renderPainel(lista, filtro = 'todos') {
    const itens = lista.filter((x) => filtro === 'todos' || x.tipo === filtro).sort((a, b) => String(b.em).localeCompare(String(a.em)));
    const campo = (k, v) => v ? `<div><span class="text-gray-500">${k}:</span> ${esc(v)}</div>` : '';
    return `
      <div class="flex flex-wrap gap-2 mb-4">
        ${['todos', ...Object.keys(TIPOS)].map((t) => `<button type="button" data-filtro="${t}" class="text-xs px-3 py-1.5 rounded-full border ${t === filtro ? 'bg-brand-gold text-black border-brand-gold' : 'border-white/15 text-gray-300 hover:border-brand-gold'}">${t === 'todos' ? 'Todos' : TIPOS[t]} (${t === 'todos' ? lista.length : lista.filter((x) => x.tipo === t).length})</button>`).join('')}
      </div>
      <div class="space-y-3">
        ${itens.length ? itens.map((x) => `
          <div class="bg-brand-surface border border-white/10 rounded-xl p-4 text-sm text-gray-200 space-y-1">
            <div class="flex justify-between gap-2 mb-1"><span class="text-[11px] font-bold uppercase text-brand-gold">${esc(TIPOS[x.tipo] || x.tipo)}</span><span class="text-[11px] text-gray-500">${esc(new Date(x.em).toLocaleString('pt-BR'))}</span></div>
            ${campo('Nome', x.nome)}${campo('Telefone', x.tel || x.telefone)}${campo('E-mail', x.email)}${campo('Evento', x.evento)}${campo('Célula', x.celula)}${campo('Motivo', x.motivo)}
          </div>`).join('') : '<p class="text-gray-400 text-sm text-center py-6">Nada por aqui ainda.</p>'}
      </div>`;
  }
  async function abrirPainel() {
    // Supabase sem login → tela de login
    if (!BANCO.db && temSupabase() && !sessionStorage.getItem('sb_token')) {
      openGeneric(`
        ${header('fa-database', 'Painel de Gestão', 'Entre com o e-mail e senha cadastrados no Supabase.')}
        <form class="space-y-4">
          <input name="email" type="email" required placeholder="E-mail" class="${inputCls}" aria-label="E-mail">
          <input name="senha" type="password" required placeholder="Senha" class="${inputCls}" aria-label="Senha">
          <button type="submit" class="w-full gold-gradient text-black font-bold py-3 rounded-xl">Entrar</button>
        </form>`, async (d) => {
          const r = await fetch(`${SITE.supabaseUrl}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: SITE.supabaseKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: d.email, password: d.senha }) });
          const j = await r.json().catch(() => ({}));
          if (j.access_token) { sessionStorage.setItem('sb_token', j.access_token); setTimeout(abrirPainel, 50); }
          else showToast('E-mail ou senha incorretos.', 'fa-circle-exclamation');
        });
      return;
    }
    openGeneric(`<h3 class="font-display font-bold text-xl text-white mb-1 pr-8">Painel de Gestão</h3><p class="text-xs text-gray-400 mb-5">Tudo o que chegou pelos formulários do site.</p><div id="painel-corpo" class="text-gray-400 text-sm">Carregando...</div>`);
    gContent.classList.replace('max-w-md', 'max-w-2xl');
    const timer = setTimeout(() => { const c = $('#painel-corpo'); if (c && c.textContent === 'Carregando...') c.textContent = 'O banco não respondeu. Tente novamente em instantes.'; }, 10000);
    try {
      const lista = await carregarEnvios();
      clearTimeout(timer);
      if (lista === null) { closeGeneric(); return abrirPainel(); }
      const corpo = $('#painel-corpo');
      const pintar = (f) => { corpo.innerHTML = renderPainel(lista, f); $$('[data-filtro]', corpo).forEach((b) => b.addEventListener('click', () => pintar(b.dataset.filtro))); };
      pintar('todos');
    } catch (e) { clearTimeout(timer); $('#painel-corpo').textContent = 'Não foi possível carregar os dados.'; }
  }
  $('#admin-btn').addEventListener('click', abrirPainel);

  function openArticleModal(n) {
    openGeneric(`
      <div class="-mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-5 h-48 overflow-hidden rounded-t-3xl img-box">${imgTag(n.imagem, n.titulo, 'w-full h-full object-cover', n.foco, false)}</div>
      <span class="text-xs font-bold text-brand-gold uppercase">${esc(n.categoria)} • ${esc(n.data)}</span>
      <h3 class="font-display font-bold text-xl text-white mt-1 mb-4">${esc(n.titulo)}</h3>
      <p class="text-gray-300 text-sm leading-relaxed mb-6">${esc(n.texto)}</p>
      <button type="button" data-close-btn class="w-full bg-white/10 hover:bg-brand-gold hover:text-black text-white font-semibold py-2.5 rounded-xl transition">Fechar Leitura</button>`);
  }

  // ESC fecha qualquer modal | setas navegam na galeria
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (mModal.classList.contains('flex')) closeMedia();
      else if (gModal.classList.contains('flex')) closeGeneric();
      else if (!$('#mobile-menu').classList.contains('hidden')) toggleMobileMenu(false);
    }
    if (galleryIndex >= 0 && mModal.classList.contains('flex')) {
      if (e.key === 'ArrowRight') showGallery(galleryIndex + 1);
      if (e.key === 'ArrowLeft') showGallery(galleryIndex - 1);
    }
  });

  /* ------------------------------------------------------------------
     PIX
  ------------------------------------------------------------------ */
  async function copy(text, msg) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const t = document.createElement('textarea');
      t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove();
    }
    showToast(msg);
  }
  $('#copy-pix').addEventListener('click', () => copy(SITE.pix, 'Chave PIX (CNPJ) copiada com sucesso!'));
  $('#copy-pix-raw').addEventListener('click', () => copy(SITE.pix.replace(/\D/g, ''), 'CNPJ (somente números) copiado!'));

  /* ------------------------------------------------------------------
     ORAÇÃO
  ------------------------------------------------------------------ */
  $('#prayer-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const form = e.target;
    enviar('oracao', d, `Pedido de oração\nNome: ${d.nome}\nTelefone: ${d.telefone || '-'}\nMotivo: ${d.motivo}`, 'Seu pedido de oração foi recebido pelos nossos intercessores!')
      .then((ok) => { if (ok) form.reset(); });
  });

  /* ------------------------------------------------------------------
     MENU MOBILE
  ------------------------------------------------------------------ */
  const menu = $('#mobile-menu');
  const menuBtn = $('#mobile-menu-btn');
  function toggleMobileMenu(force) {
    const open = typeof force === 'boolean' ? force : menu.classList.contains('hidden');
    menu.classList.toggle('hidden', !open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    $('#hamburger-icon').className = `fa-solid ${open ? 'fa-xmark' : 'fa-bars'} text-xl w-5`;
  }
  menuBtn.addEventListener('click', () => toggleMobileMenu());
  $$('a', menu).forEach((a) => a.addEventListener('click', () => toggleMobileMenu(false)));
  window.addEventListener('resize', () => { if (window.innerWidth >= 1024) toggleMobileMenu(false); });

  /* ------------------------------------------------------------------
     RÁDIO
  ------------------------------------------------------------------ */
  const audio = $('#radio-audio');
  let radioOn = false;
  $('#radio-btn').addEventListener('click', async () => {
    radioOn = !radioOn;
    $('#radio-icon').className = `fa-solid ${radioOn ? 'fa-pause' : 'fa-play'} text-[9px]`;
    if (SITE.radioStream) {
      if (radioOn) { audio.src = SITE.radioStream; try { await audio.play(); } catch { showToast('Não foi possível conectar à rádio.', 'fa-circle-exclamation'); } }
      else { audio.pause(); audio.removeAttribute('src'); }
    } else {
      showToast(radioOn ? 'Sintonizando Rádio Louvor Casa Profética...' : 'Rádio pausada.', 'fa-radio');
    }
  });

  /* ------------------------------------------------------------------
     HEADER, MENU ATIVO, VOLTAR AO TOPO, ANIMAÇÕES
  ------------------------------------------------------------------ */
  const headerEl = $('#main-header');
  const topBtn = $('#back-to-top');
  const onScroll = () => {
    const y = window.scrollY;
    headerEl.classList.toggle('scrolled', y > 40);
    const show = y > 700;
    topBtn.classList.toggle('opacity-0', !show);
    topBtn.classList.toggle('pointer-events-none', !show);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  if (SITE.whatsapp) topBtn.style.bottom = '6rem';

  if ('IntersectionObserver' in window) {
    const navLinks = $$('.nav-link');
    const secObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach((a) => { const s = document.querySelector(a.getAttribute('href')); if (s) secObs.observe(s); });

    const revObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('visible'); revObs.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach((el) => revObs.observe(el));
  } else {
    $$('.reveal').forEach((el) => el.classList.add('visible'));
  }
})();
