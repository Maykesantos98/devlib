# DEVLIB

Acervo curado com 133 bibliotecas, frameworks e ferramentas para desenvolvedores que constroem produtos com agentes de IA.

O projeto e um site estatico feito com HTML, CSS e JavaScript vanilla. Nao ha dependencias obrigatorias, build step ou framework.

## Conteudo

- Curadoria organizada por categorias: Kit, Agentes, MCP, Interface, Servidor, Seguranca, Build, Apps e Trade.
- Busca e filtros no front-end.
- Command palette com `Ctrl+K` / `Cmd+K`.
- Atalhos de teclado e comandos no console via `devlib.help()`.
- Blueprints visuais com exemplos de uso de shadcn, ReUI, Magic UI, Aceternity UI e Motion.

## Estrutura

```text
.
|-- index.html          # Pagina principal
|-- Dev2.html           # Variante/backup da pagina
|-- css/                # CSS modular
|-- js/                 # JavaScript principal
`-- public/             # Logo e favicon
```

## Como rodar localmente

Como e um site estatico, voce pode abrir `index.html` diretamente no navegador.

Opcionalmente, rode um servidor local:

```bash
npx serve .
```

ou, com Python:

```bash
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Como editar

1. Edite os cards em `index.html`.
2. Mantenha `Dev2.html` sincronizado se ele continuar sendo usado como variante.
3. Atualize os contadores das secoes quando adicionar ou remover itens.
4. Se alterar estilos ou scripts de origem em `css/*.css` ou `js/script.js`, confira a pagina principal e a variante antes de publicar.

## Deploy

O repositorio pode ser publicado diretamente pelo GitHub Pages ou qualquer hospedagem estatica, usando `index.html` como entrada.

## Repositorio

GitHub: <https://github.com/Maykesantos98/devlib>
