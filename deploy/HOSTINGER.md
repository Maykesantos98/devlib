# Integração Hostinger via MCP

O arquivo `hostinger-mcp.json.example` organiza os sete servidores fornecidos sem versionar credenciais.

1. Crie um token com o menor escopo necessário na Hostinger.
2. Defina `HOSTINGER_API_TOKEN` apenas no ambiente local do cliente MCP.
3. Copie a configuração de exemplo para o arquivo de configuração do cliente.
4. Confirme primeiro operações somente de leitura: VPS, domínio e DNS.
5. Só então execute o roteiro de `VPS.md`.

O token não deve entrar em `.env.vps`, Git, Dockerfile, logs ou mensagens. Em Linux/macOS, troque `npx.cmd` por `npx` na configuração do cliente. Os conectores Hostinger administram a infraestrutura; o MCP DEVLIB publicado em `/mcp` atende os agentes que consultam o catálogo.
