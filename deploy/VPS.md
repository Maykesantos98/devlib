# Implantação do DEVLIB em VPS

Este runbook publica o site com Nginx não privilegiado dentro de Docker e Caddy como proxy HTTPS. Nenhuma credencial fica no repositório.

## Pré-requisitos

- VPS Linux com Docker Engine, plugin Docker Compose e Git.
- Portas TCP 80 e 443 liberadas; UDP 443 é recomendado para HTTP/3.
- Registro DNS `A`/`AAAA` do domínio apontando para a VPS.
- Acesso SSH com usuário sem login direto como root e chave pública configurada.

## Primeiro deploy

```bash
git clone https://github.com/Maykesantos98/devlib.git /opt/devlib
cd /opt/devlib
cp .env.vps.example .env
```

O MCP fica em `https://SEU_DOMINIO/mcp`, aberto e somente leitura, sem usuário nem senha. O que contém abuso é o limite por IP: ajuste `DEVLIB_RATE_LIMIT`, `DEVLIB_RATE_WINDOW` e `DEVLIB_RATE_LIMIT_RECOMMEND` no `.env` se os padrões não servirem.

Edite apenas `.env` e defina `DEVLIB_DOMAIN`. Depois valide e suba:

```bash
python3 scripts/catalog_tool.py check
python3 scripts/check_links.py
docker compose -f compose.yml -f compose.prod.yml config --quiet
docker compose -f compose.yml -f compose.prod.yml up -d --build
```

O Caddy solicita e renova o certificado TLS automaticamente quando DNS e portas estão corretos.

## Healthcheck pós-deploy

```bash
docker compose -f compose.yml -f compose.prod.yml ps
curl --fail --silent --show-error https://SEU_DOMINIO/healthz
curl --fail --silent --show-error --head https://SEU_DOMINIO/
curl --fail --silent --show-error https://SEU_DOMINIO/api/ai/healthz
curl --silent --output /dev/null --write-out '%{http_code}\n' \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json, text/event-stream' \
  --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"deploy-check","version":"1"}}}' \
  https://SEU_DOMINIO/mcp
curl --silent --head --header 'Origin: https://exemplo.invalid' https://SEU_DOMINIO/api/catalog.json | grep -i access-control-allow-origin
```

O resultado esperado de `/healthz` é `ok` e o container `devlib` deve aparecer como `healthy`. O `initialize` do MCP precisa devolver `200`: um `401` significa que o proxy voltou a exigir credencial e nenhum agente consegue conectar. A última chamada precisa imprimir `access-control-allow-origin: *`; sem esse cabeçalho, clientes de navegador são bloqueados mesmo com a API no ar.

## Atualização

Antes de atualizar, registre a revisão atual para rollback:

```bash
cd /opt/devlib
git rev-parse HEAD > .last-deployed-revision
git pull --ff-only origin main
python3 scripts/catalog_tool.py check
docker compose -f compose.yml -f compose.prod.yml up -d --build
docker compose -f compose.yml -f compose.prod.yml restart caddy
```

O `restart caddy` é obrigatório sempre que `deploy/Caddyfile` mudar. O arquivo entra como volume montado, e o Compose não detecta mudança de conteúdo de volume: sem o restart o container segue servindo a configuração antiga e o deploy parece aplicado sem estar.

Repita o healthcheck. Não use `git reset --hard`; o processo preserva alterações locais e para se houver divergência.

## Logs e diagnóstico

```bash
docker compose -f compose.yml -f compose.prod.yml logs --tail=200 devlib
docker compose -f compose.yml -f compose.prod.yml logs --tail=200 caddy
docker compose -f compose.yml -f compose.prod.yml ps
```

## Rollback

Use uma tag/revisão conhecida ou o valor salvo em `.last-deployed-revision`:

```bash
cd /opt/devlib
git switch --detach "$(cat .last-deployed-revision)"
docker compose -f compose.yml -f compose.prod.yml up -d --build
```

Depois do incidente, volte à branch com `git switch main`. Nunca apague os volumes `caddy_data` e `caddy_config` durante rollback; eles guardam certificados e estado TLS.

## Backup e recuperação

O site não tem banco de dados. O repositório Git é o backup do conteúdo. Faça backup periódico dos volumes do Caddy ou permita que ele reemita certificados. Preserve também `.env` fora do Git em armazenamento seguro.

## Firewall mínimo

Permita somente SSH, HTTP e HTTPS. Restrinja SSH ao IP administrativo quando possível. A porta local `${DEVLIB_PORT}` fica vinculada a `127.0.0.1`, portanto não é exposta publicamente.
