/* =====================================================================
   CONFIGURAÇÃO DO SITE — Igreja Batista Casa Profética
   ---------------------------------------------------------------------
   ESTE É O ÚNICO ARQUIVO QUE VOCÊ PRECISA EDITAR PARA TROCAR IMAGENS,
   VÍDEOS, CÉLULAS, EVENTOS E NOTÍCIAS. O index.html lê tudo daqui.

   COMO TROCAR UMA IMAGEM:
     1) Copie a nova foto para a pasta  assets/img/
     2) Troque o caminho correspondente abaixo (ex.: 'assets/img/minha-foto.jpg')
     OU simplesmente salve a nova foto com o MESMO NOME do arquivo antigo.

   Dicas:
     - Fotos horizontais: 1920x1080 px (banner) | 1200x800 px (cards)
     - Fotos verticais funcionam também (o site recorta automaticamente).
     - "foco" define que parte da foto aparece no recorte:
         'center' | 'top' | 'bottom' | '50% 30%' (horizontal vertical)
     - Pode usar links da internet (https://...) no lugar de arquivos.
   ===================================================================== */

const SITE = {
  /* ---------- DADOS GERAIS ---------- */
  nome: 'Igreja Batista Casa Profética',
  instagram: 'https://www.instagram.com/ibcasaprofetica.ofc/',
  facebook: 'https://www.facebook.com/CasaProfeticaIgrejaDeVencedores',
  youtube: 'https://www.youtube.com/results?search_query=Igreja+Batista+Casa+Prof%C3%A9tica',
  pix: '26.226.830/0001-25',

  // Endereço oficial do site (usado nas cópias do site, como a página na Claude, para levar o visitante até aqui)
  siteOficial: 'https://casa-profetica-rust.vercel.app/',

  // WhatsApp da secretaria só com números (ex.: '5511999998888').
  // Se preenchido, aparece o botão flutuante e os formulários abrem o WhatsApp
  // com a mensagem pronta. Se vazio, os formulários só mostram confirmação.
  whatsapp: '',

  // Transmissão ao vivo dos cultos (player do YouTube, selo "Ao Vivo" no menu e card "Cultos Online").
  // false = desativada (os horários dos cultos continuam aparecendo) | true = ativada
  cultoAoVivo: false,

  // Link direto de streaming da rádio (mp3/aac), se o seu provedor fornecer.
  radioStream: '',

  /* ---------- RÁDIO CASTER.FM (plano gratuito) ----------
     No painel do Caster.fm (cloud.caster.fm), copie:
       publicToken → "Public Token" (página API Token)
       channelId   → ID do canal da sua rádio (opcional; vazio = player com todos os canais)
     Com o publicToken preenchido, o botão da rádio abre o player do Caster.fm. */
  radioCaster: {
    publicToken: '',
    channelId: '',
    tema: 'dark',      // 'dark' ou 'light'
    cor: 'F59E0B',     // cor do player (dourado da igreja), sem o #
  },

  /* ---------- LOGO ----------
     Deixe vazio ('') para usar o logo desenhado em SVG (casa + cruz).
     Para usar o arquivo oficial: 'assets/img/logo.png' (fundo transparente). */
  logo: '',

  /* ---------- BANCO DE DADOS (Supabase — gratuito) ----------
     Preencha com os dados do seu projeto em supabase.com → Project Settings → API.
     A "anon key" é pública por natureza (a segurança fica nas regras do banco). */
  supabaseUrl: 'https://kijpevnexjanyvigcpgx.supabase.co',   // sem /rest/v1 no final
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpanBldm5leGphbnl2aWdjcGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyNDE4NzUsImV4cCI6MjEwOTgxNzg3NX0.QAECrmIPnA8j3jB5Knve9XgZyi0GH_S1VkNqLH3f55k',

  // false = não usa iframes do YouTube/Google Maps (necessário na hospedagem da Claude)
  permitirIncorporar: true,
};

/* =====================================================================
   IMAGENS FIXAS DO SITE
   Cada chave é usada no index.html através de  data-img="chave"
   ===================================================================== */
const IMAGENS = {
  // Seção "Sobre Nós"
  sobre:            { src: 'assets/img/pastor-pregando-1.jpg', foco: '50% 25%', alt: 'Pastor ministrando no culto da Casa Profética' },

  // Seção "Palavras que transformam" (mensagem principal + 2 laterais)
  palavraPrincipal: { src: 'assets/img/pastor-pregando-2.jpg', foco: '50% 30%', alt: 'Ministração da Palavra' },
  palavra2:         { src: 'assets/img/culto-congregacao.jpg', foco: '50% 40%', alt: 'Congregação no culto' },
  palavra3:         { src: 'assets/img/leitura-biblia-3.jpg',  foco: '50% 55%', alt: 'Membro lendo a Bíblia' },

  // Fundo da seção de Dízimos e da seção de Células (opcional — '' desativa)
  fundoCelulas:     { src: 'assets/img/culto-em-pe.jpg', foco: 'center', alt: '' },
};

/* =====================================================================
   BANNER PRINCIPAL (slides do topo)
   Adicione ou remova blocos { ... } para ter mais ou menos slides.
   soImagem: true → para artes prontas (com texto na própria imagem):
                    a imagem aparece inteira, sem título por cima.
   ===================================================================== */
const BANNER = [
  {
    // Arte que JÁ TEM TEXTO na imagem → soImagem: true (mostra a arte inteira, só com os botões)
    imagem: 'assets/img/banner-seja-bem-vindo.jpg', soImagem: true,
    botoes: [
      { texto: 'Planeje sua Visita', link: '#onde-nos-encontrar', icone: 'fa-arrow-right', principal: true },
      { texto: 'Assistir Culto', link: '#ao-vivo', icone: 'fa-play' },
    ],
  },
  {
    imagem: 'assets/img/pastor-pregando-2.jpg', foco: '50% 25%',
    selo: 'Bem-vindo à Casa', icone: 'fa-fire',
    titulo: 'UMA IGREJA DE', destaque: 'VENCEDORES',
    texto: 'Somos uma comunidade viva em São Bernardo do Campo onde a presença de Deus transforma histórias, restaura famílias e ativa destinos proféticos.',
    botoes: [
      { texto: 'Planeje sua Visita', link: '#onde-nos-encontrar', icone: 'fa-arrow-right', principal: true },
      { texto: 'Siga no Instagram', link: 'https://www.instagram.com/ibcasaprofetica.ofc/', icone: 'fa-brands fa-instagram' },
    ],
  },
  {
    imagem: 'assets/img/culto-em-pe.jpg', foco: '50% 45%',
    selo: 'Cultos Presenciais & Online', icone: 'fa-calendar-check',
    titulo: 'DOMINGO DA', destaque: 'FAMÍLIA',
    texto: 'Participe das nossas celebrações todos os domingos e quartas-feiras. Um ambiente de adoração extravagante e palavra revelada para a sua vida.',
    botoes: [
      { texto: 'Assistir Culto Online', link: '#ao-vivo', icone: 'fa-play', principal: true },
      { texto: 'Ver Programação', link: '#eventos' },
    ],
  },
  {
    imagem: 'assets/img/culto-congregacao.jpg', foco: '50% 45%',
    selo: 'Comunhão nos Lares', icone: 'fa-users',
    titulo: 'CONECTE-SE A UMA', destaque: 'CÉLULA',
    texto: 'Ninguém foi chamado para caminhar sozinho. Encontre uma célula da Casa Profética perto da sua casa e viva em família!',
    botoes: [
      { texto: 'Buscar Célula Próxima', link: '#celulas', icone: 'fa-magnifying-glass', principal: true },
    ],
  },
];

/* =====================================================================
   GALERIA DE FOTOS  (seção "Momentos na Casa")
   Adicione quantas fotos quiser. "legenda" aparece ao ampliar.
   ===================================================================== */
const GALERIA = [
  { src: 'assets/img/pastor-pregando-1.jpg', legenda: 'Ministração da Palavra' },
  { src: 'assets/img/leitura-biblia-1.jpg',  legenda: 'Acompanhando a Palavra' },
  { src: 'assets/img/culto-congregacao.jpg', legenda: 'Culto de celebração' },
  { src: 'assets/img/leitura-biblia-2.jpg',  legenda: 'Estudo bíblico' },
  { src: 'assets/img/pastor-pregando-2.jpg', legenda: 'Palavra revelada' },
  { src: 'assets/img/leitura-biblia-3.jpg',  legenda: 'Meditando nas Escrituras' },
  { src: 'assets/img/culto-em-pe.jpg',       legenda: 'Igreja em adoração' },
  { src: 'assets/img/leitura-biblia-4.jpg',  legenda: 'Anotações da mensagem' },
];

/* =====================================================================
   VÍDEOS  (seção "Ministrações em vídeo" — formato vertical tipo Reels)
   arquivo: vídeo .mp4 em assets/video/   |  capa: imagem de prévia
   Também aceita YouTube: { youtube: 'https://www.youtube.com/embed/ID', capa: '...' }
   ===================================================================== */
const VIDEOS = [
  { arquivo: 'assets/video/video-ministracao-1.mp4',   capa: 'assets/video/video-ministracao-1.jpg',   titulo: 'Ministração — Parte 1' },
  { arquivo: 'assets/video/video-ministracao-2.mp4',   capa: 'assets/video/video-ministracao-2.jpg',   titulo: 'Ministração — Parte 2' },
  { arquivo: 'assets/video/video-pregacao-pastor.mp4', capa: 'assets/video/video-pregacao-pastor.jpg', titulo: 'Palavra do Pastor' },
  { arquivo: 'assets/video/video-ministracao-curta.mp4', capa: 'assets/video/video-ministracao-curta.jpg', titulo: 'Recado rápido' },
  { arquivo: 'assets/video/video-congregacao.mp4',     capa: 'assets/video/video-congregacao.jpg',     titulo: 'A igreja reunida' },
];

/* =====================================================================
   PALAVRAS (vídeos do YouTube abertos pelos cards da seção "Palavras")
   ===================================================================== */
const PALAVRAS = {
  principal: { youtube: 'https://www.youtube.com/embed/ExdUAbwNHGM', selo: 'Série Profética', data: 'Dom, 18 Out • Culto de Celebração', titulo: 'Mergulhando nas Águas do Espírito' },
  lateral1:  { youtube: 'https://www.youtube.com/embed/sLnGKT95b6M', data: 'Dom, 11 Out', titulo: 'Vivendo o Sobrenatural na Família' },
  lateral2:  { youtube: 'https://www.youtube.com/embed/ExdUAbwNHGM', data: 'Qui, 08 Out', titulo: 'O Poder da Palavra Profética nas Decisões' },
  aoVivo:    'https://www.youtube.com/embed/ExdUAbwNHGM',
};

/* =====================================================================
   CÉLULAS
   ===================================================================== */
const CELULAS = [
  { nome: 'Célula Águias da Fé',        rede: 'Famílias', dia: 'Quarta-feira', hora: '20h00', bairro: 'Bairro dos Casa - SBC',            lideres: 'Pr. Marcos & Pra. Juliana' },
  { nome: 'Célula Geração Eleita',      rede: 'Jovens',   dia: 'Sexta-feira',  hora: '20h00', bairro: 'Demarchi / Bairro dos Casa - SBC', lideres: 'Lucas & Mariana' },
  { nome: 'Célula Mulheres de Aliança', rede: 'Mulheres', dia: 'Terça-feira',  hora: '19h30', bairro: 'Jardim Las Palmas - SBC',          lideres: 'Diac. Patrícia' },
];

/* =====================================================================
   EVENTOS
   status: texto do selo | cor: 'verde' ou 'dourado'
   Algumas fotos se repetem de outras seções — troque por fotos de cada evento.
   ===================================================================== */
const EVENTOS = [
  { imagem: 'assets/img/culto-em-pe.jpg', foco: '50% 40%', status: 'Inscrições Abertas', cor: 'verde',
    data: 'Sábado, 14 Novembro • 19:00', titulo: 'Conferência Despertar Profético',
    texto: 'Um final de semana inteiro de imersão, avivamento e ativação de dons espirituais.', botao: 'Fazer Inscrição Gratuita' },
  { imagem: 'assets/img/leitura-biblia-2.jpg', foco: '50% 55%', status: 'Inscrições Abertas', cor: 'verde',
    data: 'Sábado, 28 Novembro • 19:30', titulo: 'Noite de Aliança — Casais',
    texto: 'Um jantar especial com ministração voltada ao fortalecimento de casamentos e famílias.', botao: 'Garantir Vaga do Casal' },
  { imagem: 'assets/img/culto-congregacao.jpg', foco: '50% 45%', status: 'Destaque', cor: 'dourado',
    data: 'Domingo, 06 Dezembro • 09:00', titulo: 'Festa das Águas — Batismo',
    texto: 'Celebração pública de fé e novo nascimento em Cristo Jesus. Faça parte da classe de batismo!', botao: 'Quero me Batizar' },
];

/* =====================================================================
   NOTÍCIAS / DEVOCIONAIS
   ===================================================================== */
const NOTICIAS = [
  { imagem: 'assets/img/leitura-biblia-1.jpg', foco: '50% 60%', categoria: 'Palavra Pastoral', data: '20 Out 2026',
    titulo: 'Como discernir a voz de Deus em tempos de decisão',
    texto: 'Ouvir a voz de Deus é a chave para uma caminhada vitoriosa. Quando silenciamos as distrações ao nosso redor e mergulhamos nas Escrituras Sagradas, o Espírito Santo alinha nossos passos com o propósito eterno do Pai para nossa família e ministério.' },
  { imagem: 'assets/img/culto-em-pe.jpg', foco: '50% 40%', categoria: 'Ação Social', data: '15 Out 2026',
    titulo: 'Projeto Amor em Ação arrecada cestas básicas em SBC',
    texto: 'Graças à generosidade de cada membro e voluntário da Casa Profética, dezenas de famílias do Bairro dos Casa e região foram abençoadas com alimentos, roupas e oração neste mês.' },
  { imagem: 'assets/img/pastor-pregando-2.jpg', foco: '50% 30%', categoria: 'Casa Profética Music', data: '10 Out 2026',
    titulo: 'Ouça nossas canções autorais e momentos de adoração',
    texto: 'Nosso ministério de louvor tem buscado expressar o som do céu em cada culto. Acesse nosso canal no YouTube para ouvir canções como Tuas Águas e compartilhar com sua família.' },
  { imagem: 'assets/img/leitura-biblia-4.jpg', foco: '50% 55%', categoria: 'Plano de Leitura', data: '04 Out 2026',
    titulo: '21 Dias de Jejum, Oração e Leitura Profética da Palavra',
    texto: 'Participe do nosso propósito coletivo de consagração! Separe um momento diário para meditar nos capítulos selecionados e orar pelos motivos da nossa igreja.' },
];
