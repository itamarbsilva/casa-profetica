/* =====================================================================
   ÁREA DE MEMBROS — login, cadastro e painéis por papel (Supabase)
   Papéis: admin, pastor, secretaria, obreiro, lider_ministerio,
           lider_celula, lider_treinamento, membro
   As permissões REAIS ficam no banco (supabase-membros.sql). Este arquivo
   só mostra/esconde telas; mesmo que alguém altere o código no navegador,
   o banco não entrega dados que o papel não pode ver.
   ===================================================================== */
(function () {
  'use strict';
  const CP = window.CP;
  if (!CP || typeof SITE === 'undefined' || !SITE.supabaseUrl || !SITE.supabaseKey) return;
  const { esc, showToast, openGeneric, closeGeneric, header, inputCls, gContent, TIPOS } = CP;
  const BASE = SITE.supabaseUrl, KEY = SITE.supabaseKey;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- Papéis e permissões de tela ---------- */
  const PAPEIS = {
    admin: 'Administrador do site', pastor: 'Pastor(a)', secretaria: 'Secretaria', obreiro: 'Obreiro(a)',
    lider_ministerio: 'Líder de Ministério', lider_celula: 'Líder de Célula',
    lider_treinamento: 'Líder em Treinamento', membro: 'Membro da Igreja',
  };
  const ICONES = {
    admin: 'fa-user-shield', pastor: 'fa-book-bible', secretaria: 'fa-clipboard-list', obreiro: 'fa-hands-praying',
    lider_ministerio: 'fa-people-group', lider_celula: 'fa-house-chimney-user', lider_treinamento: 'fa-seedling', membro: 'fa-user',
  };
  const VE_ENVIOS = {
    admin: ['oracao', 'decisao', 'inscricao', 'celula'], pastor: ['oracao', 'decisao', 'inscricao', 'celula'],
    secretaria: ['inscricao', 'decisao', 'celula'], obreiro: ['oracao', 'decisao'],
    lider_ministerio: ['inscricao'], lider_celula: ['celula'], lider_treinamento: ['celula'],
  };
  const PUBLICA_AVISOS = ['admin', 'pastor', 'secretaria'];
  const VE_MEMBROS = ['admin', 'pastor', 'secretaria'];
  const APAGA_ENVIOS = ['admin', 'pastor'];

  /* ---------- Sessão ---------- */
  const SESSAO = 'cp_sessao';
  const S = {
    get() { try { return JSON.parse(localStorage.getItem(SESSAO)); } catch (_) { return null; } },
    set(v) { try { localStorage.setItem(SESSAO, JSON.stringify(v)); } catch (_) {} },
    clear() { try { localStorage.removeItem(SESSAO); } catch (_) {} },
  };
  const salvarSessao = (j) => S.set({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (Number(j.expires_in) || 3600) * 1000 });
  const voltarPara = () => location.origin + location.pathname;

  async function auth(caminho, body, { metodo = 'POST', token: tk } = {}) {
    const r = await fetch(`${BASE}/auth/v1/${caminho}`, {
      method: metodo,
      headers: { apikey: KEY, 'Content-Type': 'application/json', ...(tk ? { Authorization: 'Bearer ' + tk } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, j };
  }

  async function token() {
    const s = S.get();
    if (!s || !s.access_token) return null;
    if (Date.now() < (s.expires_at || 0) - 60000) return s.access_token;
    if (!s.refresh_token) { S.clear(); return null; }
    const r = await auth('token?grant_type=refresh_token', { refresh_token: s.refresh_token });
    if (r.ok && r.j.access_token) { salvarSessao(r.j); return r.j.access_token; }
    S.clear();
    return null;
  }

  async function api(caminho, { metodo = 'GET', body, prefer } = {}) {
    const tk = await token();
    if (!tk) throw new Error('sessao');
    const r = await fetch(`${BASE}/rest/v1/${caminho}`, {
      method: metodo,
      headers: { apikey: KEY, Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 401) { S.clear(); throw new Error('sessao'); }
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || 'Erro ' + r.status); }
    if (r.status === 204) return null;
    const txt = await r.text();
    return txt ? JSON.parse(txt) : null;
  }

  function uidDoToken(tk) {
    try {
      let b = tk.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      while (b.length % 4) b += '=';
      return JSON.parse(atob(b)).sub;
    } catch (_) { return null; }
  }

  const dataBR = (d) => { try { return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); } catch (_) { return ''; } };
  const largo = () => { gContent.classList.remove('max-w-md', 'max-w-2xl'); gContent.classList.add('max-w-3xl'); };

  /* ---------- Botão "Entrar" do topo mostra o nome quando logado ---------- */
  function atualizarBotaoEntrar(nome) {
    $$('[data-modal="login"] span').forEach((sp) => {
      if (sp.closest('footer')) return;
      sp.textContent = nome ? nome.split(' ')[0] : 'Entrar';
    });
  }

  /* =====================================================================
     TELA DE ACESSO: Entrar | Criar conta | Esqueci a senha
     ===================================================================== */
  function telaAcesso(aba = 'entrar', emailPre = '') {
    const abas = [['entrar', 'Entrar'], ['cadastro', 'Criar conta'], ['senha', 'Esqueci a senha']];
    const tabs = `<div class="flex gap-1 bg-black/40 p-1 rounded-xl mb-5 text-xs font-semibold" role="tablist">
      ${abas.map(([k, l]) => `<button type="button" role="tab" data-aba="${k}" aria-selected="${k === aba}" class="flex-1 py-2 rounded-lg transition ${k === aba ? 'bg-brand-gold text-black' : 'text-gray-300 hover:text-white'}">${l}</button>`).join('')}
    </div>`;
    const email = `<input name="email" type="email" required autocomplete="email" placeholder="Seu e-mail" value="${esc(emailPre)}" class="${inputCls}" aria-label="E-mail">`;
    const forms = {
      entrar: `<form class="space-y-4">${email}
          <input name="senha" type="password" required autocomplete="current-password" placeholder="Sua senha" class="${inputCls}" aria-label="Senha">
          <button type="submit" class="w-full gold-gradient text-black font-bold py-3 rounded-xl">Entrar</button></form>`,
      cadastro: `<form class="space-y-4">
          <input name="nome" type="text" required maxlength="120" autocomplete="name" placeholder="Nome completo" class="${inputCls}" aria-label="Nome completo">
          <input name="telefone" type="tel" maxlength="30" autocomplete="tel" placeholder="WhatsApp (11) 90000-0000" class="${inputCls}" aria-label="WhatsApp">
          ${email}
          <input name="senha" type="password" required minlength="8" autocomplete="new-password" placeholder="Crie uma senha (mín. 8 caracteres)" class="${inputCls}" aria-label="Senha">
          <p class="text-[11px] text-gray-500">Seu cadastro entra como <b>Membro</b> e é liberado após aprovação da administração da igreja.</p>
          <button type="submit" class="w-full gold-gradient text-black font-bold py-3 rounded-xl">Criar minha conta</button></form>`,
      senha: `<form class="space-y-4">${email}
          <p class="text-[11px] text-gray-500">Enviaremos um link para você criar uma nova senha.</p>
          <button type="submit" class="w-full gold-gradient text-black font-bold py-3 rounded-xl">Enviar link</button></form>`,
    };
    openGeneric(header('fa-user-lock', 'Área de Membros', 'Igreja Batista Casa Profética') + tabs + forms[aba], (d) => acoes[aba](d));
    $$('[data-aba]', gContent).forEach((b) => b.addEventListener('click', () => {
      const em = $('input[name=email]', gContent);
      telaAcesso(b.dataset.aba, em ? em.value : '');
    }));
  }

  const acoes = {
    async entrar(d) {
      showToast('Entrando...', 'fa-spinner');
      const r = await auth('token?grant_type=password', { email: d.email, password: d.senha });
      if (r.ok && r.j.access_token) { salvarSessao(r.j); return abrirArea(); }
      const msg = r.j.error_code === 'email_not_confirmed' ? 'Confirme seu e-mail pelo link que enviamos antes de entrar.'
        : r.status === 429 ? 'Muitas tentativas. Aguarde alguns minutos.' : 'E-mail ou senha incorretos.';
      showToast(msg, 'fa-circle-exclamation');
      telaAcesso('entrar', d.email);
    },
    async cadastro(d) {
      showToast('Criando sua conta...', 'fa-spinner');
      const r = await auth('signup?redirect_to=' + encodeURIComponent(voltarPara()), {
        email: d.email, password: d.senha, data: { nome: d.nome.trim(), telefone: (d.telefone || '').trim() },
      });
      if (r.ok && r.j.access_token) { salvarSessao(r.j); return abrirArea(); }
      if (r.ok) {
        return openGeneric(`${header('fa-envelope-circle-check', 'Confirme seu e-mail', 'Enviamos um link para ' + esc(d.email) + '. Abra o e-mail e clique no link para ativar sua conta.')}
          <p class="text-xs text-gray-400 text-center">Não chegou? Veja a caixa de spam. Depois de confirmar, sua conta ainda precisa ser aprovada pela administração.</p>`);
      }
      const code = r.j.error_code || r.j.code || '';
      const msg = code === 'user_already_exists' ? 'Este e-mail já tem conta. Use "Entrar" ou "Esqueci a senha".'
        : code === 'signup_disabled' ? 'Os cadastros estão fechados no momento. Fale com a secretaria.'
        : code === 'weak_password' ? 'Senha fraca: use pelo menos 8 caracteres, misturando letras e números.'
        : r.status === 429 ? 'Muitos cadastros agora. Tente novamente em alguns minutos.'
        : (r.j.msg || 'Não foi possível criar a conta.');
      showToast(msg, 'fa-circle-exclamation');
      telaAcesso(code === 'user_already_exists' ? 'entrar' : 'cadastro', d.email);
    },
    async senha(d) {
      await auth('recover?redirect_to=' + encodeURIComponent(voltarPara()), { email: d.email });
      showToast('Se o e-mail estiver cadastrado, você receberá o link em instantes.', 'fa-envelope');
    },
  };

  function telaNovaSenha() {
    openGeneric(`${header('fa-key', 'Criar nova senha', 'Digite a nova senha da sua conta.')}
      <form class="space-y-4">
        <input name="senha" type="password" required minlength="8" autocomplete="new-password" placeholder="Nova senha (mín. 8 caracteres)" class="${inputCls}" aria-label="Nova senha">
        <button type="submit" class="w-full gold-gradient text-black font-bold py-3 rounded-xl">Salvar nova senha</button>
      </form>`, async (d) => {
        const tk = await token();
        const r = await auth('user', { password: d.senha }, { metodo: 'PUT', token: tk });
        if (r.ok) { showToast('Senha alterada com sucesso!'); abrirArea(); }
        else { showToast(r.j.msg || 'Não foi possível alterar a senha.', 'fa-circle-exclamation'); telaNovaSenha(); }
      });
  }

  async function sair() {
    const tk = await token();
    if (tk) auth('logout', {}, { token: tk }).catch(() => {});
    S.clear();
    atualizarBotaoEntrar('');
    closeGeneric();
    showToast('Você saiu da Área de Membros.');
  }

  /* =====================================================================
     ÁREA LOGADA
     ===================================================================== */
  let PERFIL = null, UID = null;

  async function abrirArea(abaInicial = 'inicio') {
    const tk = await token();
    if (!tk) return telaAcesso();
    UID = uidDoToken(tk);
    openGeneric('<div id="area-membros" class="text-gray-400 text-sm py-6 text-center"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Carregando...</div>');
    largo();
    try {
      const rows = await api(`perfis?id=eq.${encodeURIComponent(UID)}&select=*`);
      PERFIL = rows && rows[0];
    } catch (e) {
      if (e.message === 'sessao') return telaAcesso();
      return erroArea('Não foi possível carregar seu perfil. ' + e.message);
    }
    if (!PERFIL) return erroArea('Seu perfil ainda não foi criado. Fale com a administração da igreja.');
    atualizarBotaoEntrar(PERFIL.nome || PERFIL.email || 'Minha área');
    if (!PERFIL.aprovado) return telaPendente();
    montarArea(abaInicial);
  }

  function erroArea(msg) {
    const box = $('#area-membros');
    if (box) box.innerHTML = `<p class="text-red-300">${esc(msg)}</p><button type="button" id="am-sair" class="mt-4 text-xs text-gray-400 hover:text-brand-gold">Sair</button>`;
    const b = $('#am-sair'); if (b) b.addEventListener('click', sair);
  }

  function telaPendente() {
    $('#area-membros').outerHTML = `
      <div class="text-center py-4">
        <div class="w-14 h-14 rounded-2xl bg-brand-gold/15 border border-brand-gold/40 text-brand-gold flex items-center justify-center mx-auto mb-4 text-2xl"><i class="fa-solid fa-hourglass-half"></i></div>
        <h3 class="font-display font-bold text-xl text-white">Olá, ${esc(PERFIL.nome || 'irmão(ã)')}!</h3>
        <p class="text-gray-300 text-sm mt-2 max-w-md mx-auto">Seu cadastro foi recebido e está <b class="text-brand-gold">aguardando aprovação</b> da administração da igreja. Assim que for liberado, você verá aqui os conteúdos do seu papel.</p>
        <button type="button" id="am-sair" class="mt-6 text-xs text-gray-400 hover:text-brand-gold"><i class="fa-solid fa-right-from-bracket mr-1"></i>Sair</button>
      </div>`;
    $('#am-sair').addEventListener('click', sair);
  }

  function abasDoPapel(p) {
    const a = [['inicio', 'Início', 'fa-house']];
    const nomeEnvios = { obreiro: 'Intercessão', lider_ministerio: 'Inscrições', lider_celula: 'Minha Célula', lider_treinamento: 'Minha Célula' }[p] || 'Pedidos & Contatos';
    if (VE_ENVIOS[p]) a.push(['envios', nomeEnvios, 'fa-inbox']);
    a.push(['avisos', 'Avisos', 'fa-bullhorn']);
    if (VE_MEMBROS.includes(p)) a.push(['membros', p === 'admin' ? 'Membros & Papéis' : 'Membros', 'fa-users']);
    a.push(['perfil', 'Meu Perfil', 'fa-id-card']);
    return a;
  }

  function montarArea(aba) {
    const p = PERFIL.papel;
    const abas = abasDoPapel(p);
    if (!abas.some(([k]) => k === aba)) aba = 'inicio';
    $('#area-membros').outerHTML = `
      <div>
        <div class="flex items-center gap-3 mb-5 pr-8">
          <div class="w-12 h-12 rounded-2xl gold-gradient text-black flex items-center justify-center text-xl"><i class="fa-solid ${ICONES[p]}"></i></div>
          <div class="min-w-0">
            <h3 class="font-display font-bold text-lg text-white truncate">${esc(PERFIL.nome || PERFIL.email)}</h3>
            <span class="text-[11px] font-bold uppercase tracking-wider text-brand-gold">${esc(PAPEIS[p])}</span>
            ${PERFIL.celula ? `<span class="text-[11px] text-gray-400"> • ${esc(PERFIL.celula)}</span>` : ''}
            ${PERFIL.ministerio ? `<span class="text-[11px] text-gray-400"> • ${esc(PERFIL.ministerio)}</span>` : ''}
          </div>
        </div>
        <div class="flex gap-1 overflow-x-auto snap-row border-b border-white/10 mb-5" role="tablist">
          ${abas.map(([k, l, ic]) => `<button type="button" role="tab" data-am-aba="${k}" aria-selected="${k === aba}" class="shrink-0 px-3 py-2.5 text-xs font-semibold border-b-2 -mb-px transition ${k === aba ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-400 hover:text-white'}"><i class="fa-solid ${ic} mr-1.5"></i>${l}</button>`).join('')}
        </div>
        <div id="am-conteudo" class="min-h-[200px]"></div>
      </div>`;
    $$('[data-am-aba]', gContent).forEach((b) => b.addEventListener('click', () => trocarAba(b.dataset.amAba)));
    trocarAba(aba);
  }

  function trocarAba(aba) {
    $$('[data-am-aba]', gContent).forEach((b) => {
      const on = b.dataset.amAba === aba;
      b.setAttribute('aria-selected', String(on));
      b.className = `shrink-0 px-3 py-2.5 text-xs font-semibold border-b-2 -mb-px transition ${on ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-400 hover:text-white'}`;
    });
    const box = $('#am-conteudo');
    box.innerHTML = '<p class="text-gray-400 text-sm"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Carregando...</p>';
    const fn = { inicio: abaInicio, envios: abaEnvios, avisos: abaAvisos, membros: abaMembros, perfil: abaPerfil }[aba];
    Promise.resolve(fn(box)).catch((e) => {
      if (e.message === 'sessao') { showToast('Sua sessão expirou. Entre novamente.', 'fa-circle-info'); return telaAcesso(); }
      box.innerHTML = `<p class="text-red-300 text-sm">Erro ao carregar: ${esc(e.message)}</p>`;
    });
  }

  /* ---------- Aba: Início ---------- */
  const DESCRICAO = {
    admin: 'Você administra o site: aprova cadastros, define papéis e acompanha tudo o que chega pelos formulários.',
    pastor: 'Você acompanha pedidos de oração, decisões por Jesus, inscrições e interessados em células, e publica avisos.',
    secretaria: 'Você acompanha inscrições, decisões e interessados em células, publica avisos e consulta os membros.',
    obreiro: 'Você recebe os pedidos de oração para interceder e acompanha as decisões por Jesus.',
    lider_ministerio: 'Você acompanha as inscrições nos eventos da igreja.',
    lider_celula: 'Você acompanha as pessoas interessadas em participar da sua célula.',
    lider_treinamento: 'Você acompanha (somente leitura) os interessados na célula onde está sendo treinado.',
    membro: 'Bem-vindo à Área de Membros! Aqui você recebe os avisos da igreja e mantém seus dados atualizados.',
  };

  async function abaInicio(box) {
    const p = PERFIL.papel;
    const tarefas = [api('avisos?select=id,titulo,criado_em&order=criado_em.desc&limit=3')];
    if (VE_ENVIOS[p]) tarefas.push(api('envios?select=tipo&lido=eq.false&limit=1000'));
    if (p === 'admin') tarefas.push(api('perfis?select=id&aprovado=eq.false'));
    const [avisos, naoLidos, pendentes] = await Promise.all(tarefas);
    const contagem = (naoLidos || []).reduce((acc, x) => { acc[x.tipo] = (acc[x.tipo] || 0) + 1; return acc; }, {});
    const cartoes = [];
    if (VE_ENVIOS[p]) VE_ENVIOS[p].forEach((t) => cartoes.push([TIPOS[t] || t, contagem[t] || 0, 'envios']));
    if (p === 'admin') cartoes.push(['Cadastros aguardando aprovação', (pendentes || []).length, 'membros']);
    if (p === 'lider_celula' || p === 'lider_treinamento') {
      if (!PERFIL.celula) cartoes.length = 0;
    }
    box.innerHTML = `
      <p class="text-gray-300 text-sm mb-5">${esc(DESCRICAO[p])}</p>
      ${(p === 'lider_celula' || p === 'lider_treinamento') && !PERFIL.celula ? '<div class="bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs rounded-xl p-3 mb-5"><i class="fa-solid fa-triangle-exclamation mr-1.5"></i>Sua célula ainda não foi vinculada ao seu perfil. Peça ao administrador para definir.</div>' : ''}
      ${cartoes.length ? `<div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        ${cartoes.map(([l, n, ab]) => `<button type="button" data-ir="${ab}" class="text-left bg-brand-surface border border-white/10 hover:border-brand-gold/50 rounded-xl p-4 transition">
          <span class="block font-display font-black text-2xl ${n ? 'text-brand-gold' : 'text-gray-500'}">${n}</span>
          <span class="text-[11px] text-gray-400">${esc(l)}${ab === 'envios' ? ' (não lidos)' : ''}</span></button>`).join('')}
      </div>` : ''}
      <h4 class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Últimos avisos</h4>
      ${(avisos || []).length ? avisos.map((a) => `<button type="button" data-ir="avisos" class="w-full text-left bg-brand-surface border border-white/10 hover:border-brand-gold/50 rounded-xl p-3 mb-2 transition">
          <span class="text-sm text-white font-semibold">${esc(a.titulo)}</span><span class="block text-[11px] text-gray-500">${dataBR(a.criado_em)}</span></button>`).join('')
        : '<p class="text-gray-500 text-sm">Nenhum aviso por enquanto.</p>'}`;
    $$('[data-ir]', box).forEach((b) => b.addEventListener('click', () => trocarAba(b.dataset.ir)));
  }

  /* ---------- Aba: Pedidos & Contatos (envios) ---------- */
  async function abaEnvios(box, filtro = 'todos', soNaoLidos = false) {
    const p = PERFIL.papel;
    if ((p === 'lider_celula' || p === 'lider_treinamento') && !PERFIL.celula) {
      box.innerHTML = '<p class="text-gray-400 text-sm">Sua célula ainda não foi vinculada ao seu perfil. Peça ao administrador.</p>';
      return;
    }
    const lista = (await api('envios?select=*&order=criado_em.desc&limit=500')) || [];
    const tipos = VE_ENVIOS[p];
    const podeMarcar = p !== 'lider_treinamento';
    const podeApagar = APAGA_ENVIOS.includes(p);
    const vis = lista.filter((x) => (filtro === 'todos' || x.tipo === filtro) && (!soNaoLidos || !x.lido));
    const campo = (k, v) => v ? `<div><span class="text-gray-500">${k}:</span> ${esc(v)}</div>` : '';
    box.innerHTML = `
      <div class="flex flex-wrap items-center gap-2 mb-4">
        ${(tipos.length > 1 ? ['todos', ...tipos] : tipos).map((t) => `<button type="button" data-filtro="${t}" class="text-xs px-3 py-1.5 rounded-full border ${t === filtro || tipos.length === 1 ? 'bg-brand-gold text-black border-brand-gold' : 'border-white/15 text-gray-300 hover:border-brand-gold'}">${t === 'todos' ? 'Todos' : esc(TIPOS[t])} (${t === 'todos' ? lista.length : lista.filter((x) => x.tipo === t).length})</button>`).join('')}
        <label class="ml-auto text-xs text-gray-400 flex items-center gap-1.5 cursor-pointer"><input type="checkbox" id="so-nao-lidos" ${soNaoLidos ? 'checked' : ''} class="accent-amber-500"> Só não lidos</label>
      </div>
      ${p === 'lider_treinamento' ? '<p class="text-[11px] text-gray-500 mb-3"><i class="fa-solid fa-eye mr-1"></i>Modo somente leitura (líder em treinamento).</p>' : ''}
      <div class="space-y-3">
        ${vis.length ? vis.map((x) => {
          const d = x.dados || {};
          return `<div class="bg-brand-surface border ${x.lido ? 'border-white/5 opacity-70' : 'border-brand-gold/30'} rounded-xl p-4 text-sm text-gray-200">
            <div class="flex flex-wrap justify-between gap-2 mb-2">
              <span class="text-[11px] font-bold uppercase text-brand-gold">${esc(TIPOS[x.tipo] || x.tipo)} ${x.lido ? '<span class="text-gray-500 normal-case font-normal">• lido</span>' : ''}</span>
              <span class="text-[11px] text-gray-500">${dataBR(x.criado_em)}</span>
            </div>
            <div class="space-y-0.5">${campo('Nome', d.nome)}${campo('Telefone', d.tel || d.telefone)}${campo('E-mail', d.email)}${campo('Evento', d.evento)}${campo('Célula', d.celula)}${campo('Motivo', d.motivo)}</div>
            ${(podeMarcar && !x.lido) || podeApagar ? `<div class="flex gap-2 mt-3">
              ${podeMarcar && !x.lido ? `<button type="button" data-lido="${x.id}" class="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-brand-gold hover:text-black transition"><i class="fa-solid fa-check mr-1"></i>Marcar como lido</button>` : ''}
              ${podeApagar ? `<button type="button" data-apagar="${x.id}" class="text-xs px-3 py-1.5 rounded-lg text-red-300 hover:bg-red-500/20 transition"><i class="fa-solid fa-trash mr-1"></i>Apagar</button>` : ''}
            </div>` : ''}
          </div>`;
        }).join('') : '<p class="text-gray-400 text-sm text-center py-6">Nada por aqui.</p>'}
      </div>`;
    $$('[data-filtro]', box).forEach((b) => b.addEventListener('click', () => abaEnvios(box, b.dataset.filtro, soNaoLidos)));
    $('#so-nao-lidos', box).addEventListener('change', (e) => abaEnvios(box, filtro, e.target.checked));
    $$('[data-lido]', box).forEach((b) => b.addEventListener('click', async () => {
      b.disabled = true;
      try { await api(`envios?id=eq.${b.dataset.lido}`, { metodo: 'PATCH', body: { lido: true }, prefer: 'return=minimal' }); abaEnvios(box, filtro, soNaoLidos); }
      catch (e) { b.disabled = false; showToast('Não foi possível marcar: ' + e.message, 'fa-circle-exclamation'); }
    }));
    $$('[data-apagar]', box).forEach((b) => b.addEventListener('click', async () => {
      if (b.dataset.confirmar !== '1') { b.dataset.confirmar = '1'; b.innerHTML = '<i class="fa-solid fa-triangle-exclamation mr-1"></i>Confirmar exclusão'; return; }
      try { await api(`envios?id=eq.${b.dataset.apagar}`, { metodo: 'DELETE', prefer: 'return=minimal' }); showToast('Registro apagado.'); abaEnvios(box, filtro, soNaoLidos); }
      catch (e) { showToast('Não foi possível apagar: ' + e.message, 'fa-circle-exclamation'); }
    }));
  }

  /* ---------- Aba: Avisos ---------- */
  async function abaAvisos(box) {
    const p = PERFIL.papel;
    const avisos = (await api('avisos?select=*&order=criado_em.desc&limit=50')) || [];
    const podePublicar = PUBLICA_AVISOS.includes(p);
    const nomesPublico = (arr) => !arr || !arr.length ? 'Todos os membros' : arr.map((k) => PAPEIS[k] || k).join(', ');
    box.innerHTML = `
      ${podePublicar ? `<form id="form-aviso" class="bg-brand-surface border border-white/10 rounded-xl p-4 mb-5 space-y-3">
        <h4 class="text-sm font-bold text-white"><i class="fa-solid fa-bullhorn text-brand-gold mr-1.5"></i>Publicar aviso</h4>
        <input name="titulo" required maxlength="150" placeholder="Título" class="${inputCls}" aria-label="Título do aviso">
        <textarea name="texto" required maxlength="4000" rows="3" placeholder="Mensagem" class="${inputCls}" aria-label="Mensagem"></textarea>
        <fieldset class="text-xs text-gray-300"><legend class="text-gray-400 mb-1.5">Quem vê este aviso:</legend>
          <label class="inline-flex items-center gap-1.5 mr-3 mb-1.5"><input type="checkbox" name="todos" checked class="accent-amber-500"> Todos</label>
          ${Object.keys(PAPEIS).map((k) => `<label class="inline-flex items-center gap-1.5 mr-3 mb-1.5"><input type="checkbox" name="publico" value="${k}" class="accent-amber-500"> ${esc(PAPEIS[k])}</label>`).join('')}
        </fieldset>
        <button type="submit" class="gold-gradient text-black font-bold text-sm px-5 py-2.5 rounded-xl">Publicar</button>
      </form>` : ''}
      <div class="space-y-3">
        ${avisos.length ? avisos.map((a) => `<article class="bg-brand-surface border border-white/10 rounded-xl p-4">
          <div class="flex justify-between gap-3 mb-1"><h4 class="font-bold text-white">${esc(a.titulo)}</h4><span class="text-[11px] text-gray-500 shrink-0">${dataBR(a.criado_em)}</span></div>
          <p class="text-sm text-gray-300 whitespace-pre-line">${esc(a.texto)}</p>
          ${podePublicar ? `<div class="flex items-center justify-between mt-3 text-[11px] text-gray-500"><span><i class="fa-solid fa-eye mr-1"></i>${esc(nomesPublico(a.publico))}</span>
            ${p === 'admin' || p === 'pastor' || a.autor === UID ? `<button type="button" data-apagar-aviso="${a.id}" class="text-red-300 hover:underline">Apagar</button>` : ''}</div>` : ''}
        </article>`).join('') : '<p class="text-gray-400 text-sm text-center py-6">Nenhum aviso publicado.</p>'}
      </div>`;
    const f = $('#form-aviso', box);
    if (f) {
      const todos = $('input[name=todos]', f);
      $$('input[name=publico]', f).forEach((c) => c.addEventListener('change', () => { if (c.checked) todos.checked = false; }));
      todos.addEventListener('change', () => { if (todos.checked) $$('input[name=publico]', f).forEach((c) => { c.checked = false; }); });
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const publico = todos.checked ? [] : $$('input[name=publico]:checked', f).map((c) => c.value);
        if (!todos.checked && !publico.length) return showToast('Escolha quem vai ver o aviso.', 'fa-circle-info');
        try {
          await api('avisos', { metodo: 'POST', body: { titulo: f.titulo.value.trim(), texto: f.texto.value.trim(), publico, autor: UID }, prefer: 'return=minimal' });
          showToast('Aviso publicado!');
          abaAvisos(box);
        } catch (err) { showToast('Não foi possível publicar: ' + err.message, 'fa-circle-exclamation'); }
      });
    }
    $$('[data-apagar-aviso]', box).forEach((b) => b.addEventListener('click', async () => {
      if (b.dataset.confirmar !== '1') { b.dataset.confirmar = '1'; b.textContent = 'Confirmar exclusão'; return; }
      try { await api(`avisos?id=eq.${b.dataset.apagarAviso}`, { metodo: 'DELETE', prefer: 'return=minimal' }); abaAvisos(box); }
      catch (e) { showToast('Não foi possível apagar: ' + e.message, 'fa-circle-exclamation'); }
    }));
  }

  /* ---------- Aba: Membros (admin edita papéis; pastor/secretaria consultam) ---------- */
  async function abaMembros(box, busca = '') {
    const admin = PERFIL.papel === 'admin';
    const lista = (await api('perfis?select=*&order=aprovado.asc,criado_em.desc&limit=1000')) || [];
    const q = busca.toLowerCase();
    const vis = lista.filter((m) => !q || [m.nome, m.email, m.telefone, m.celula, m.ministerio, PAPEIS[m.papel]].some((v) => (v || '').toLowerCase().includes(q)));
    const pend = lista.filter((m) => !m.aprovado).length;
    const celulas = (typeof CELULAS !== 'undefined' ? CELULAS : []).map((c) => c.nome);
    box.innerHTML = `
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <input type="search" id="busca-membro" value="${esc(busca)}" placeholder="Buscar por nome, e-mail, célula..." class="${inputCls} flex-1 min-w-[200px]" aria-label="Buscar membro">
        <span class="text-xs text-gray-400">${lista.length} cadastrados${pend ? ` • <b class="text-brand-gold">${pend} aguardando</b>` : ''}</span>
      </div>
      <datalist id="lista-celulas">${celulas.map((c) => `<option value="${esc(c)}">`).join('')}</datalist>
      <div class="space-y-3">
        ${vis.map((m) => `<div class="bg-brand-surface border ${m.aprovado ? 'border-white/10' : 'border-brand-gold/50'} rounded-xl p-4" data-membro="${m.id}">
          <div class="flex flex-wrap justify-between gap-2">
            <div class="min-w-0">
              <div class="font-semibold text-white truncate">${esc(m.nome || '(sem nome)')} ${m.id === UID ? '<span class="text-[10px] text-gray-500">(você)</span>' : ''}</div>
              <div class="text-[11px] text-gray-400">${esc(m.email || '')}${m.telefone ? ' • ' + esc(m.telefone) : ''}</div>
            </div>
            <span class="text-[11px] font-bold uppercase ${m.aprovado ? 'text-brand-gold' : 'text-amber-300'}">${m.aprovado ? esc(PAPEIS[m.papel]) : 'Aguardando aprovação'}</span>
          </div>
          ${admin ? `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              <select name="papel" class="${inputCls} !py-2" aria-label="Papel">${Object.entries(PAPEIS).map(([k, l]) => `<option value="${k}" ${k === m.papel ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>
              <label class="flex items-center gap-2 text-xs text-gray-300 px-1"><input type="checkbox" name="aprovado" ${m.aprovado ? 'checked' : ''} class="accent-amber-500 w-4 h-4"> Acesso aprovado</label>
              <input name="celula" list="lista-celulas" value="${esc(m.celula || '')}" maxlength="120" placeholder="Célula (para líderes)" class="${inputCls} !py-2" aria-label="Célula">
              <input name="ministerio" value="${esc(m.ministerio || '')}" maxlength="120" placeholder="Ministério (ex.: Louvor, Kids)" class="${inputCls} !py-2" aria-label="Ministério">
            </div>
            <button type="button" data-salvar-membro class="mt-3 text-xs font-bold px-4 py-2 rounded-lg gold-gradient text-black">${m.aprovado ? 'Salvar alterações' : 'Aprovar e salvar'}</button>`
          : (m.celula || m.ministerio ? `<div class="text-[11px] text-gray-400 mt-1">${esc([m.celula, m.ministerio].filter(Boolean).join(' • '))}</div>` : '')}
        </div>`).join('') || '<p class="text-gray-400 text-sm text-center py-6">Nenhum membro encontrado.</p>'}
      </div>`;
    let t;
    $('#busca-membro', box).addEventListener('input', (e) => { clearTimeout(t); const v = e.target.value; t = setTimeout(() => abaMembros(box, v).then(() => { const i = $('#busca-membro', box); i.focus(); i.setSelectionRange(v.length, v.length); }), 300); });
    $$('[data-salvar-membro]', box).forEach((b) => b.addEventListener('click', async () => {
      const card = b.closest('[data-membro]');
      const novo = { p_id: card.dataset.membro, p_papel: $('[name=papel]', card).value, p_aprovado: $('[name=aprovado]', card).checked, p_celula: $('[name=celula]', card).value, p_ministerio: $('[name=ministerio]', card).value };
      if (!novo.p_aprovado && b.textContent.includes('Aprovar')) novo.p_aprovado = true;
      b.disabled = true;
      try {
        await api('rpc/admin_definir_perfil', { metodo: 'POST', body: novo });
        showToast('Membro atualizado!');
        if (novo.p_id === UID) { const r = await api(`perfis?id=eq.${UID}&select=*`); PERFIL = r[0]; }
        abaMembros(box, busca);
      } catch (e) { b.disabled = false; showToast(e.message, 'fa-circle-exclamation'); }
    }));
  }

  /* ---------- Aba: Meu Perfil ---------- */
  function abaPerfil(box) {
    box.innerHTML = `
      <form id="form-perfil" class="space-y-3 max-w-md">
        <label class="block text-xs text-gray-400">Nome completo<input name="nome" required maxlength="120" value="${esc(PERFIL.nome || '')}" class="${inputCls} mt-1"></label>
        <label class="block text-xs text-gray-400">WhatsApp<input name="telefone" maxlength="30" value="${esc(PERFIL.telefone || '')}" class="${inputCls} mt-1"></label>
        <label class="block text-xs text-gray-400">E-mail<input value="${esc(PERFIL.email || '')}" disabled class="${inputCls} mt-1 opacity-60"></label>
        <button type="submit" class="gold-gradient text-black font-bold text-sm px-5 py-2.5 rounded-xl">Salvar dados</button>
      </form>
      <form id="form-senha" class="space-y-3 max-w-md mt-6 pt-6 border-t border-white/10">
        <h4 class="text-sm font-bold text-white">Trocar senha</h4>
        <input name="senha" type="password" required minlength="8" autocomplete="new-password" placeholder="Nova senha (mín. 8 caracteres)" class="${inputCls}" aria-label="Nova senha">
        <button type="submit" class="bg-white/10 hover:bg-brand-gold hover:text-black text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition">Alterar senha</button>
      </form>
      <button type="button" id="am-sair" class="mt-8 text-sm text-gray-400 hover:text-brand-gold"><i class="fa-solid fa-right-from-bracket mr-1.5"></i>Sair da Área de Membros</button>`;
    $('#form-perfil', box).addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        await api(`perfis?id=eq.${UID}`, { metodo: 'PATCH', body: { nome: f.nome.value.trim(), telefone: f.telefone.value.trim() }, prefer: 'return=minimal' });
        PERFIL.nome = f.nome.value.trim(); PERFIL.telefone = f.telefone.value.trim();
        atualizarBotaoEntrar(PERFIL.nome);
        showToast('Dados atualizados!');
      } catch (err) { showToast('Não foi possível salvar: ' + err.message, 'fa-circle-exclamation'); }
    });
    $('#form-senha', box).addEventListener('submit', async (e) => {
      e.preventDefault();
      const r = await auth('user', { password: e.target.senha.value }, { metodo: 'PUT', token: await token() });
      if (r.ok) { showToast('Senha alterada!'); e.target.reset(); }
      else showToast(r.j.msg || 'Não foi possível alterar a senha.', 'fa-circle-exclamation');
    });
    $('#am-sair', box).addEventListener('click', sair);
  }

  /* =====================================================================
     RETORNO DE LINKS DO E-MAIL (confirmação de cadastro / nova senha)
     ===================================================================== */
  function tratarRetornoDoEmail() {
    const h = location.hash.slice(1);
    if (!/access_token=|error_description=/.test(h)) return false;
    const q = new URLSearchParams(h);
    history.replaceState(null, '', location.pathname + location.search);
    if (q.get('error_description')) {
      showToast('Link inválido ou expirado. Peça um novo.', 'fa-circle-exclamation');
      telaAcesso(q.get('error_code') === 'otp_expired' ? 'senha' : 'entrar');
      return true;
    }
    salvarSessao({ access_token: q.get('access_token'), refresh_token: q.get('refresh_token'), expires_in: q.get('expires_in') });
    if (q.get('type') === 'recovery') telaNovaSenha();
    else { showToast('E-mail confirmado! Bem-vindo(a).'); abrirArea(); }
    return true;
  }

  /* ---------- Início ---------- */
  window.Membros = { abrir: (aba) => (S.get() ? abrirArea(aba) : telaAcesso()), sair };
  if (!tratarRetornoDoEmail() && S.get()) {
    token().then((tk) => {
      if (!tk) return atualizarBotaoEntrar('');
      api(`perfis?id=eq.${encodeURIComponent(uidDoToken(tk))}&select=nome,email`).then((r) => atualizarBotaoEntrar(r && r[0] ? (r[0].nome || r[0].email) : 'Minha área')).catch(() => {});
    });
  }
})();
