---
name: leadradar-operations
description: Guide LeadRadar maintenance, updates, local setup, static deployment checks, and repository handoff from natural-language prompts such as "iniciar o projeto", "atualizar o projeto", "validar acesso local", "publicar estático", or "verificar deploy".
argument-hint: "[pedido operacional em linguagem natural]"
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion
---

<objective>
Transforma pedidos operacionais em um fluxo guiado para manter o LeadRadar em operação.

Use esta skill quando o usuário quiser iniciar o projeto, atualizar uma instalação já existente, continuar um setup interrompido, validar acesso local, revisar a publicação estática ou checar o comportamento do deploy.

Use o contexto do repositório como fonte de verdade e preserve a regra do projeto: tudo precisa continuar estático, client-side e funcional em `file://` ou `localhost`.
</objective>

<execution_context>
@../../../README.md
@../../../AGENTS.md
@../../../CONTRIBUTING.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
1. Leia primeiro `README.md` para entender o comportamento atual, a arquitetura e as restrições públicas do projeto.
2. Leia `AGENTS.md` para respeitar as obrigações técnicas obrigatórias.
3. Leia `CONTRIBUTING.md` para entender a política pública de feedback e PRs.
4. Mapeie o pedido do usuário para a intenção mais próxima dentro da operação local-first do LeadRadar.
5. Se faltar algum dado indispensável, faça uma pergunta por vez.
6. Mantenha as alterações pequenas, estáticas e reversíveis; nunca introduza backend, build step ou dependência operacional nova.
7. Finalize com validação objetiva do que foi alterado.
</process>