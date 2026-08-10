# DEVLIB

Acervo curado com 173 bibliotecas, frameworks e ferramentas para desenvolvedores que constroem produtos com agentes de IA.

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
|-- data/catalog.json   # Fonte unica dos 173 itens
|-- css/                # CSS modular
|-- js/                 # JavaScript principal
|-- scripts/            # Geracao e validacao do catalogo
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

1. Edite os itens em `data/catalog.json`.
2. Execute `python scripts/catalog_tool.py build` para atualizar o HTML estatico.
3. Execute `python scripts/catalog_tool.py check` e os testes antes de publicar.

## Testes

Com o Playwright para Python e o Chromium instalados, inicie um servidor na porta 8099 e execute:

```bash
python scripts/verify.py
```

## API e MCP para agentes

O catálogo completo está em `/api/catalog.json`, com descoberta em `/llms.txt`. Na VPS, o MCP remoto usa Streamable HTTP em `/mcp` e oferece busca, inspeção, categorias e recomendação. Toda recomendação é limitada a `data/catalog.json`.

Gere a senha com `docker run --rm caddy:2.10.2-alpine caddy hash-password --plaintext SUA_SENHA` e grave somente o hash no `.env`.

A configuração segura dos sete conectores MCP da Hostinger está em `deploy/hostinger-mcp.json.example`; veja `deploy/HOSTINGER.md`. O token da Hostinger permanece exclusivamente no ambiente local.

Opcionalmente, defina `NVIDIA_API_KEY` apenas no `.env` privado da VPS. A NVIDIA melhora a classificação semântica; timeout, erro ou ausência da chave acionam automaticamente o motor local.

O GitHub Actions repete essas jornadas em todo push e pull request.

Para também consultar os 173 destinos externos e atualizar o relatório:

```bash
python scripts/check_links.py --external
```

## VPS

O projeto inclui imagem Nginx não privilegiada, Docker Compose e Caddy para HTTPS automático. Consulte o runbook completo em `deploy/VPS.md` antes da primeira publicação.

## Deploy

O repositorio pode ser publicado diretamente pelo GitHub Pages ou qualquer hospedagem estatica, usando `index.html` como entrada.

## Repositorio

GitHub: <https://github.com/Maykesantos98/devlib>

## Entrada em lote

Cole URLs HTTPS, uma por linha, em um arquivo de texto e execute:

```bash
python scripts/catalog_intake.py novos-repos.txt
```

As URLs são normalizadas e comparadas com o catálogo e a fila em `data/catalog-intake.json`. Duplicatas, links inseguros e lotes inválidos são recusados antes da curadoria de categoria, descrição e tags.
