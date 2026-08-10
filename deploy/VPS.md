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

Gere o hash da senha do MCP com `docker run --rm caddy:2.10.2-alpine caddy hash-password --plaintext SUA_SENHA` e preencha `DEVLIB_MCP_PASSWORD_HASH`. O endpoint será `https://SEU_DOMINIO/mcp`, usando o usuário `devlib`.

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
```

O resultado esperado de `/healthz` é `ok` e o container `devlib` deve aparecer como `healthy`.

## Atualização

Antes de atualizar, registre a revisão atual para rollback:

```bash
cd /opt/devlib
git rev-parse HEAD > .last-deployed-revision
git pull --ff-only origin main
python3 scripts/catalog_tool.py check
docker compose -f compose.yml -f compose.prod.yml up -d --build
```

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
