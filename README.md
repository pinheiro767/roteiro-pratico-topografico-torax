# ATLAS DIGITAL DE ANATOMIA HUMANA — TÓRAX

## Como adicionar as imagens
Coloque as imagens principais dentro da pasta `images/`, nomeadas exatamente:
`1.png`, `2.png`, `3.png` ... `94.png`.

O Atlas faz a associação automaticamente pelo número global.

## Exibição
- fotografia grande dentro do card;
- `object-fit: contain` — não corta a fotografia;
- fundo escuro apenas dentro da área da fotografia para melhorar visualização;
- clique na imagem ou em **Ampliar / Zoom**;
- zoom de 25% a 600%;
- pan/arrastar;
- ESC fecha o visualizador.

## Cards
Cada card possui:
- número global 1–94;
- nome completo;
- número/letra original do roteiro;
- nome do arquivo esperado;
- localização anatômica;
- imagem principal;
- galeria;
- anexar múltiplas fotos;
- câmera quando suportada.

## Aparência
Use o botão **Aparência** para escolher cor de destaque e cor de fundo.
Há presets Papel, Claro e Escuro.

## GitHub Pages
Envie TODO o conteúdo desta pasta para a raiz do repositório.
Depois: Settings → Pages → Deploy from a branch → branch principal → `/ (root)`.

O PWA só instala corretamente por HTTPS (GitHub Pages) ou servidor local.


## TESTE DIRETAMENTE NO PC
Agora as imagens principais também são carregadas ao abrir `index.html` diretamente pelo computador.

Estrutura obrigatória:
- `index.html`
- pasta `images`
  - `1.png` ou `1.PNG`
  - `2.png` ou `2.PNG`
  - ...
  - `94.png` ou `94.PNG`

Também são aceitos `.jpg`, `.jpeg` e `.webp` em maiúsculas ou minúsculas.

Observação: ao abrir por `file://`, as imagens e a interface funcionam, mas a instalação PWA/offline por Service Worker exige HTTPS (por exemplo, GitHub Pages) ou localhost.
