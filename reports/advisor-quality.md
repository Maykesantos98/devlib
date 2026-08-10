# Stack Advisor — quality gate

Baseline: `8977e69`

## Rubrica

Cada cenário precisa passar simultaneamente em oito critérios determinísticos:

1. camadas arquiteturais obrigatórias;
2. ausência de camadas proibidas;
3. requisitos explícitos reconhecidos;
4. quantidade mínima de recomendações;
5. todas as ferramentas existentes no catálogo DEVLIB;
6. justificativas específicas, sem texto genérico legado;
7. trade-offs, riscos e perguntas de refinamento;
8. nenhuma camada solicitada sem recomendação.

## Matriz

| Cenário | Resultado |
|---|---:|
| Landing page de pequeno negócio | PASS |
| SaaS B2B multi-tenant | PASS |
| Aplicativo mobile offline-first | PASS |
| API financeira crítica | PASS |
| E-commerce | PASS |
| Assistente RAG | PASS |
| Colaboração em tempo real | PASS |
| CLI Python sem interface web | PASS |
| Dashboard administrativo | PASS |
| Pipeline de dados | PASS |

## Resultado

- Casos: 10/10 aprovados.
- Critérios por execução: 80/80 aprovados.
- Estabilidade: `pass^3 = 100%` (três execuções consecutivas).
- Total observado: 240/240 verificações aprovadas.
- Grader: código determinístico, sem LLM julgando a própria resposta.

Este resultado garante 100% de aprovação **dentro da matriz versionada**, não perfeição universal para qualquer descrição futura. Casos novos ou ambíguos devem ser adicionados à matriz antes de ampliar essa alegação.
