# Site — Igreja Batista Casa Profética

## Estrutura

```
site/
├── index.html            ← estrutura da página (não precisa mexer para trocar fotos)
├── LEIA-ME.md
└── assets/
    ├── js/
    │   ├── config.js     ← ★ EDITE AQUI: imagens, vídeos, slides, células, eventos, notícias
    │   └── app.js        ← lógica do site (não precisa mexer)
    ├── img/              ← fotos
    └── video/            ← vídeos .mp4 + capas .jpg
```

## Trocar uma imagem (2 jeitos)

**Jeito rápido:** salve a foto nova em `assets/img/` com **o mesmo nome** da antiga
(ex.: `pastor-pregando-1.jpg`). Pronto, sem editar código.

**Jeito organizado:** coloque a foto em `assets/img/` e troque o caminho no `config.js`:

```js
sobre: { src: 'assets/img/NOVA-FOTO.jpg', foco: '50% 25%', alt: 'Descrição da foto' },
```

`foco` escolhe qual parte da foto aparece quando ela é recortada:
`'center'`, `'top'`, `'bottom'` ou `'X% Y%'` (ex.: `'50% 20%'` = centro, mais para cima).

## Onde fica cada imagem no config.js

| Lugar no site                     | Bloco no config.js           |
|-----------------------------------|------------------------------|
| Slides do topo                    | `BANNER`                     |
| Foto do "Quem Somos"              | `IMAGENS.sobre`              |
| Cards "Palavras que transformam"  | `IMAGENS.palavraPrincipal`, `palavra2`, `palavra3` |
| Fundo da seção Células            | `IMAGENS.fundoCelulas`       |
| Galeria "Momentos na Casa"        | `GALERIA`                    |
| Vídeos verticais                  | `VIDEOS`                     |
| Cards de eventos                  | `EVENTOS[].imagem`           |
| Cards de notícias                 | `NOTICIAS[].imagem`          |
| Logo                              | `SITE.logo`                  |

**Imagens provisórias:** os eventos *Noite de Aliança* e *Batismo* e a notícia *Ação Social*
ainda usam fotos de banco de imagens (links `unsplash`). Troque-as por fotos da igreja.

## Slide com arte pronta

Se a imagem do banner já tem texto (como a arte "SEJA BEM VINDO"), use `soImagem: true`.
Assim a arte aparece inteira, sem título por cima, só com os botões.

## Adicionar fotos à galeria / vídeos

Copie o arquivo para a pasta e acrescente uma linha:

```js
{ src: 'assets/img/batismo-2026.jpg', legenda: 'Batismo 2026' },
```

Vídeos: prefira .mp4 com até ~15 MB. Para reduzir um vídeo do WhatsApp:
`ffmpeg -i entrada.mp4 -vf "scale=-2:960" -c:v libx264 -crf 28 -preset veryfast -c:a aac -b:a 96k -movflags +faststart saida.mp4`

## WhatsApp e Rádio

No `config.js`, preencha `whatsapp: '5511999998888'`. O botão verde flutuante aparece, e os
formulários (oração, células, eventos, aceitar Jesus) passam a abrir o WhatsApp com a mensagem
pronta. Sem número, os formulários só mostram a confirmação na tela.
`radioStream` aceita o link de streaming da rádio.

## Publicar grátis: GitHub Pages + banco Supabase

### 1. Banco de dados (Supabase, ~5 min)
1. Crie uma conta em https://supabase.com e clique em **New project** (plano Free).
2. Abra **SQL Editor → New query**, cole o conteúdo de `supabase.sql` e clique em **Run**.
3. Em **Authentication → Sign In / Providers**, desative **Allow new users to sign up**.
4. Em **Authentication → Users → Add user**, crie o seu login (e-mail + senha) da equipe.
5. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public** e cole em
   `assets/js/config.js`:
   ```js
   supabaseUrl: 'https://xxxxxxxx.supabase.co',
   supabaseKey: 'eyJhbGciOi...',
   ```

### 2. Site (GitHub Pages)
1. No GitHub, crie um repositório público chamado `casa-profetica` (vazio).
2. Envie todos os arquivos desta pasta (botão **Add file → Upload files**, arraste tudo).
3. Em **Settings → Pages**, escolha **Branch: main / (root)** e salve.
4. Em 1–2 minutos o site fica em `https://SEU-USUARIO.github.io/casa-profetica/`.

### 3. Painel de gestão
Com o Supabase configurado, aparece **Painel de Gestão** no rodapé do site. Entre com o login
criado no passo 1.4 para ver pedidos de oração, inscrições, decisões e interesses em células.

Domínio próprio depois (ex.: casaprofetica.com.br): compre no registro.br e configure em
**Settings → Pages → Custom domain**.
