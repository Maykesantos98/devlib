# DEVLIB — plano de evolução

Este documento organiza a melhoria do DEVLIB em entregas pequenas, verificáveis e sem reescrever o projeto antes de entender o que realmente gera valor.

## Objetivo do produto

Transformar o DEVLIB em um catálogo rápido, confiável e fácil de manter para descobrir ferramentas de desenvolvimento, com navegação clara, busca útil e conteúdo atualizado.

## Diagnóstico inicial

- Site estático em HTML, CSS e JavaScript, sem dependências ou etapa de build.
- Catálogo principal com 165 itens e nove categorias.
- Busca, filtros, command palette, atalhos e página de jogos já existem.
- `index.html` e `Dev2.html` têm atualmente o mesmo tamanho e precisam de uma fonte única de verdade.
- O conteúdo do catálogo está misturado à marcação, o que torna contagens, links e atualizações trabalhosos.
- Não há testes automatizados, validação de links ou pipeline de qualidade documentado.

## Prioridades

### P0 — estabilizar a base

- [x] Confirmar o papel de `Dev2.html`; a cópia idêntica foi removida e permanece recuperável pelo Git.
- [ ] Fazer inventário de links, IDs, categorias e contadores; corrigir inconsistências.
- [ ] Validar HTML e executar uma auditoria de acessibilidade por teclado e leitor de tela.
- [x] Verificar busca, filtros, command palette, navegação móvel e página de jogos.
- [x] Criar uma verificação automática mínima para metadados, JavaScript e jornadas críticas.
- [ ] Documentar publicação, domínio oficial e procedimento de rollback.

**Critério de saída:** nenhuma rota quebrada, nenhum erro de console, navegação completa por teclado e contagens consistentes.

### P1 — separar conteúdo da interface

- [x] Extrair os 165 itens para uma fonte de dados única e validável.
- [x] Definir campos estáveis: nome, URL, descrição, categoria, tags, tom e layout.
- [x] Gerar os cards estáticos a partir dessa fonte.
- [x] Adicionar verificador de URLs externas e relatório de links inativos.
- [ ] Definir processo editorial para inclusão, revisão e remoção de ferramentas.

**Critério de saída:** um item é adicionado em um único lugar e todo o site se atualiza sem edição manual de contadores.

### P2 — experiência e identidade

- [ ] Simplificar o primeiro bloco da página e deixar a proposta de valor imediata.
- [ ] Melhorar busca com correspondência por nome, descrição, categoria e tags.
- [x] Exibir estado vazio, quantidade de resultados e opção de limpar a busca.
- [x] Revisar hierarquia visual, contraste, foco, alvos de toque e responsividade.
- [x] Respeitar `prefers-reduced-motion` em todas as animações.
- [ ] Criar páginas ou painéis de detalhe apenas se ajudarem a decisão do usuário.

**Critério de saída:** tarefas principais funcionam bem em celular, teclado e desktop, sem excesso de movimento ou informação.

### P3 — desempenho, SEO e compartilhamento

- [ ] Medir LCP, INP e CLS antes de otimizar.
- [ ] Reduzir CSS/JavaScript não utilizado e custo de efeitos visuais.
- [x] Remover fontes externas e auto-hospedar o runtime GSAP.
- [x] Completar canonical URL, Open Graph, Twitter cards, sitemap e dados estruturados.
- [ ] Otimizar imagens e definir dimensões explícitas.
- [x] Configurar CSP estática; os cabeçalhos HTTP completos entram na imagem Nginx da VPS.

**Critério de saída:** metas de Core Web Vitals atendidas em mobile e metadados válidos nas páginas públicas.

### P4 — qualidade contínua

- [x] Adicionar testes dos fluxos críticos com Playwright.
- [x] Criar CI para catálogo, links, contrato estático e testes de interface em navegador.
- [ ] Incluir auditorias periódicas de acessibilidade e dependências, caso uma toolchain seja adotada.
- [ ] Definir checklist de release e versionamento.
- [ ] Registrar métricas úteis sem coleta invasiva: buscas sem resultado, cliques e categorias visitadas.

**Critério de saída:** toda mudança passa por verificações automáticas e a publicação é reproduzível.

## Ordem recomendada de execução

1. Auditoria funcional e correção de defeitos P0.
2. Fonte única do catálogo e remoção de duplicação.
3. Busca, filtros, acessibilidade e experiência móvel.
4. Performance, SEO e segurança da entrega.
5. Testes, CI e processo editorial contínuo.
6. Empacotamento, implantação e operação segura em VPS.

## P5 — implantação em VPS

- [x] Servir os arquivos estáticos com Nginx em imagem Docker mínima e não privilegiada.
- [x] Definir cache de assets, compressão e cabeçalhos de segurança.
- [x] Adicionar healthcheck local e verificação pós-deploy.
- [x] Criar configuração por domínio sem credenciais no repositório.
- [x] Documentar deploy inicial, atualização, logs e rollback.
- [x] Validar a imagem em container antes de acessar a VPS.

**Critério de saída:** uma VPS limpa consegue publicar o site com passos documentados, healthcheck verde e rollback testável.

## Decisões que devem ser confirmadas

- URL pública e plataforma de hospedagem.
- Se `Dev2.html` ainda tem alguma finalidade.
- Público principal: iniciantes, profissionais ou equipes que montam stacks.
- Papel da área de jogos dentro da marca DEVLIB.
- Se o projeto continuará vanilla ou adotará uma geração estática leve após a extração dos dados.

## Regra de escopo

Cada fase deve começar com uma medição e terminar com evidência: relatório, teste ou comparação. Mudanças visuais grandes entram depois da estabilização, evitando esconder falhas estruturais sob um redesign.
# Fase 6 — API e MCP para agentes na VPS

- [x] API JSON pública, `llms.txt` e OpenAPI 3.1
- [x] MCP com busca, inspeção, categorias e recomendação fundamentada
- [x] container isolado, proxy HTTPS e autenticação externa
- [x] testes de sincronização e de recomendações
