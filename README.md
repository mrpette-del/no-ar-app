# No Ar — do código à Play Store

## Aviso sobre a geração de legendas com IA
O botão "Gerar legendas com IA" só funciona dentro do Claude. Para funcionar numa
app publicada, precisas de um pequeno servidor teu com a tua própria chave da API
da Anthropic (docs em https://docs.claude.com). Sem isso, o resto da app funciona
normalmente — só esse botão fica sem efeito.

---

## Caminho completo até à Play Store (4 fases)

### Fase 1 — Publicar a app na internet (precisas de um link https)
1. Cria conta gratuita em **netlify.com** ou **vercel.com**
2. Cria conta em **github.com**, cria um repositório novo e envia para lá todos
   os ficheiros desta pasta
3. Em Netlify/Vercel, escolhe "importar do GitHub" e seleciona o repositório
4. Clica "Deploy" — em 1-2 minutos recebes um link público, ex: `no-ar.netlify.app`
5. Confirma que a app abre bem nesse link no telemóvel, incluindo o acesso à galeria

### Fase 2 — Tornar a app "instalável" (já está feito neste projeto)
Este projeto já inclui:
- `public/manifest.webmanifest` — nome, ícones e cores da app
- `public/sw.js` — permite funcionar como app instalada (PWA)
- `public/icon-192.png`, `public/icon-512.png` — ícones
Não precisas de tocar nestes ficheiros.

### Fase 3 — Gerar o pacote Android (.aab) para a Play Store
1. Vai a **https://www.pwabuilder.com**
2. Cola o link público da Fase 1 (ex: `https://no-ar.netlify.app`)
3. Clica "Start" — o PWABuilder analisa a app e confirma que está pronta
4. Escolhe a opção **Android** → **Google Play (.aab)**
5. Preenche o nome do pacote (ex: `com.declac.noar`) e descarrega o ficheiro `.aab`
   gerado — isto não exige escrever código

### Fase 4 — Publicar na Google Play Console
1. Cria conta de programador em **play.google.com/console** (pagamento único
   de 25 USD, feito uma vez para sempre)
2. Cria uma "Nova app", preenche nome, categoria, descrição, política de
   privacidade (obrigatória — podes gerar uma grátis em sites como
   termsfeed.com), capturas de ecrã e ícone
3. Na secção "Produção" (ou "Teste interno" para testares primeiro só tu),
   carrega o ficheiro `.aab` da Fase 3
4. Submete para revisão — a Google costuma demorar de algumas horas a alguns
   dias a aprovar

---

## Ficheiros incluídos neste projeto
- `src/App.jsx` — código completo da app
- `src/main.jsx` — arranque da app + registo do service worker
- `index.html` — página base, já com manifest e ícones ligados
- `public/manifest.webmanifest` — configuração da PWA
- `public/sw.js` — service worker
- `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png` — ícones
- `package.json`, `vite.config.js` — configuração do projeto
