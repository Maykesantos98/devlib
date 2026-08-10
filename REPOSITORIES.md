# Organização dos repositórios

Este arquivo será o índice dos projetos enviados para análise. Cada repositório continua independente, com histórico, roadmap e decisões próprios.

## Convenção

- Um diretório por repositório; não misturar arquivos nem históricos Git.
- Nome local igual ao nome do repositório, em minúsculas e sem espaços quando possível.
- Uma branch por iniciativa; não acumular mudanças de projetos diferentes no mesmo commit.
- Cada projeto recebe diagnóstico, prioridades, riscos, verificação e próximo marco.
- Reutilização entre projetos deve virar pacote, template ou documentação explícita — nunca cópia silenciosa.

## Registro

| Projeto | Repositório | Tipo | Estado | Prioridade | Próximo marco |
|---|---|---|---|---|---|
| DEVLIB | https://github.com/Maykesantos98/devlib | Site estático / catálogo | Diagnóstico inicial | Alta | Auditoria funcional P0 |

## Entrada de novos projetos

Ao receber uma URL:

1. Confirmar nome, branch principal e licença.
2. Clonar em diretório próprio.
3. Mapear stack, comandos, deploy, dados sensíveis e estado do Git.
4. Rodar verificações existentes sem alterar o projeto.
5. Classificar: produto ativo, experimento, biblioteca, template ou arquivado.
6. Registrar prioridade, dependências com outros projetos e próximo marco.
7. Criar ou atualizar o roadmap dentro do repositório correspondente.

## Estados usados

- **Entrada:** URL recebida, ainda não inspecionada.
- **Diagnóstico:** estrutura e riscos em avaliação.
- **Planejado:** escopo e ordem aprovados.
- **Em execução:** há uma entrega ativa.
- **Validando:** implementação concluída, em testes/revisão.
- **Estável:** publicado e sem trabalho urgente.
- **Arquivado:** mantido apenas como referência.

## Fila atual

1. DEVLIB — concluir P0 antes de iniciar uma reformulação visual ampla.
