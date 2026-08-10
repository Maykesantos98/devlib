# DEVLIB — plano de evolução

Este documento organiza a melhoria do DEVLIB em entregas pequenas, verificáveis e sem reescrever o projeto antes de entender o que realmente gera valor.

## Objetivo do produto

Transformar o DEVLIB em um catálogo rápido, confiável e fácil de manter para descobrir ferramentas de desenvolvimento, com navegação clara, busca útil e conteúdo atualizado.

## Diagnóstico inicial

- Site estático em HTML, CSS e JavaScript, sem dependências ou etapa de build.
- Catálogo principal com 133 itens e nove categorias.
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

- [ ] Extrair os 133 itens para uma fonte de dados única e validável.
- [ ] Definir campos estáveis: nome, URL, descrição, categoria, tags, destaque e data de revisão.
- [ ] Gerar cards, índice, filtros e contadores a partir dessa fonte.
- [ ] Adicionar verificador de URLs externas e relatório de links inativos.
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
- [ ] Hospedar ou aplicar fallback adequado às fontes externas.
- [x] Completar canonical URL, Open Graph, Twitter cards e sitemap.
- [ ] Otimizar imagens e definir dimensões explícitas.
- [ ] Configurar cabeçalhos de segurança compatíveis com hospedagem estática.

**Critério de saída:** metas de Core Web Vitals atendidas em mobile e metadados válidos nas páginas públicas.

### P4 — qualidade contínua

- [x] Adicionar testes dos fluxos críticos com Playwright.
- [x] Criar CI para testes de interface em navegador.
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

## Decisões que devem ser confirmadas

- URL pública e plataforma de hospedagem.
- Se `Dev2.html` ainda tem alguma finalidade.
- Público principal: iniciantes, profissionais ou equipes que montam stacks.
- Papel da área de jogos dentro da marca DEVLIB.
- Se o projeto continuará vanilla ou adotará uma geração estática leve após a extração dos dados.

## Regra de escopo

Cada fase deve começar com uma medição e terminar com evidência: relatório, teste ou comparação. Mudanças visuais grandes entram depois da estabilização, evitando esconder falhas estruturais sob um redesign.
