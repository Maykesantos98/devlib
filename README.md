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
|-- css/                # CSS modular
|-- js/                 # JavaScript principal
|-- tests/              # Jornadas automatizadas no navegador
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
2. Atualize os contadores das secoes quando adicionar ou remover itens.
3. Se alterar estilos ou scripts em `css/*.css` ou `js/*.js`, execute as jornadas automatizadas antes de publicar.

## Testes

Com o Playwright para Python e o Chromium instalados, inicie um servidor na porta 8099 e execute:

```bash
python tests/site.spec.py
```

O GitHub Actions repete essas jornadas em todo push e pull request.

## Deploy

O repositorio pode ser publicado diretamente pelo GitHub Pages ou qualquer hospedagem estatica, usando `index.html` como entrada.

## Repositorio

GitHub: <https://github.com/Maykesantos98/devlib>
