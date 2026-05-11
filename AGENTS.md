# Diretrizes para Agentes de IA e Desenvolvedores

Este documento define as regras obrigatorias para qualquer manutencao, extensao, hardening ou evolucao do projeto Busca Empresas.

## 1. Regra de Ouro

O sistema e **100% estatico e client-side only**.

Ele deve continuar funcional:

- abrindo `index.html` diretamente no navegador
- ou por um servidor estatico simples em `localhost`

Nada pode ser adicionado se quebrar essa capacidade.

## 2. Proibicoes Estritas

Nao e permitido:

- criar backend em Node.js, Python, PHP, Ruby ou qualquer outra stack de servidor
- exigir `npm`, `yarn`, `pnpm`, bundlers ou qualquer build step para rodar o projeto
- introduzir banco de dados externo como requisito operacional do produto
- refatorar o app para frameworks que dependam de pipeline de compilacao para uso normal
- adicionar recursos que deixem o sistema dependente de servicos proprietarios do proprio projeto para funcionar

## 3. Stack Permitida

E permitido e recomendado:

- JavaScript moderno nativo do navegador
- CSS puro
- ES Modules nativos quando fizer sentido
- `localStorage`, `sessionStorage`, `IndexedDB` e outras APIs nativas do navegador compativeis com o modelo estatico
- `fetch`, Web Crypto API, Notification API e outras APIs web nativas quando houver compatibilidade razoavel

## 4. Regras de Persistencia

Toda nova persistencia precisa obedecer estas regras:

1. Todo dado novo deve nascer com contrato de exportacao e importacao em JSON.
2. Todo dado novo deve ser registrado no manifesto central de persistencia.
3. Mudancas de schema devem prever compatibilidade, migracao ou restauracao segura.
4. Nenhum recurso novo pode depender de um storage invisivel ao mecanismo oficial de backup e restore.
5. Se um modulo for persistido, ele deve ser tratavel em snapshot completo.

Na pratica:

- nao criar novas chaves soltas sem registrar no manifesto central
- nao persistir dados sem pensar em backup, restore e migracao
- nao introduzir estado importante que nao possa ser exportado/importado
- a deteccao de instalacao existente para o fluxo de desbloqueio nao pode considerar chaves tecnicas, defaults locais ou metadados operacionais isolados como prova de dados locais desbloqueaveis

## 5. Regras de Backup e Restore

O projeto agora possui tres conceitos diferentes e eles nao devem ser confundidos:

- `snapshot`: representacao completa do estado persistido da aplicacao
- `backup seguro`: snapshot criptografado por PIN local
- `auto backup`: snapshot seguro salvo fora do `localStorage`, atualmente em `IndexedDB`

Qualquer evolucao nesses fluxos deve respeitar:

1. Restore precisa ser previsivel e validado antes de sobrescrever dados locais.
2. Backup seguro deve usar Web Crypto nativo quando disponivel.
3. O PIN nao deve ser persistido em texto puro.
4. O auto backup deve continuar servindo ao objetivo de recuperar o sistema se o `localStorage` se perder.
5. Se houver limitacao de navegador, ela deve ser documentada explicitamente no README e na UI.
6. A opcao de desbloqueio da instalacao so pode aparecer quando houver vault da API ou dados locais realmente vinculados ao verificador da instalacao.

## 6. Regras de Seguranca

Como nao existe backend, a seguranca do projeto e de reducao de risco, nao de sigilo absoluto.

Portanto:

- nao afirmar protecao total de segredos no navegador
- sempre orientar restricao da API key no Google Cloud Console por `HTTP referrer`
- preferir Web Crypto a algoritmos caseiros sempre que houver suporte nativo
- minimizar `innerHTML` quando houver dados externos ou inseridos pelo usuario
- evitar logs sensiveis em producao
- endurecer CSP gradualmente sem quebrar a execucao estatica

## 7. Regras para Evolucao do CRM

A evolucao para CRM deve continuar local-first.

Todo novo recurso de CRM precisa:

- continuar funcional sem backend
- ser persistivel localmente
- ser exportavel/importavel em JSON
- suportar restauracao por snapshot
- respeitar a base atual de leads, historico, score, templates e sequencias

Isso vale para:

- pipeline e kanban
- contatos
- atividades
- tags
- campanhas
- relatorios
- automacoes locais

## 8. Estrutura Recomendada

Ao adicionar um recurso:

1. Interface: atualizar `index.html`, `historico.html`, `ajuda.html` ou pagina equivalente.
2. Estilo: atualizar os arquivos de `src/css/` necessarios.
3. Logica: criar ou atualizar modulos em `src/js/` ou `src/js/services/`.
4. Layout global: paginas da navegacao principal devem usar `data-global-header`, `data-global-footer` e `src/js/global-layout.js` em vez de duplicar menu e rodape manualmente.
5. Bootstrap do Radar: `index.html` deve carregar a logica principal por `src/js/app.js` e scripts externos relacionados; nao reintroduzir grandes blocos inline que dupliquem runtime, onboarding, busca, filtros ou modais ja modularizados.
6. Persistencia: registrar o novo modulo no manifesto central e garantir export/import.
7. Documentacao: atualizar `README.md` quando o comportamento do produto mudar.
8. Historico: atualizar `CHANGELOG.md` quando a mudanca for relevante ao produto.
7. Acesso a paginas internas: `historico.html` e `kanban.html` devem bloquear entrada direta quando o cofre nao estiver desbloqueado, redirecionando para `index.html`.

## 8.1 Regra de Versao e Metadados Visiveis

Quando a versao do produto mudar:

1. Atualizar `src/js/version.js`.
2. Nao hardcodar ano ou versao no HTML das paginas principais; o rodape global deve continuar lendo esses valores dinamicamente.
3. Se uma pagina nova entrar na navegacao principal, ela deve usar `src/js/global-layout.js` para exibir a mesma versao e o mesmo rodape global.

## 9. Regras de Documentacao

Sempre documentar quando houver alteracao material em:

- arquitetura
- seguranca
- persistencia
- backup e restore
- compatibilidade de navegador
- limitacoes conhecidas
- roadmap de produto
- linguagem da interface, explicacoes de ajuda e textos de orientacao ao usuario

`README.md` descreve o comportamento do produto.

`AGENTS.md` descreve as restricoes e obrigacoes tecnicas para quem altera o codigo.

`CHANGELOG.md` registra mudancas relevantes pensando em release futura.

O repositorio publico deve manter `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md` e cabecalho AGPL com copyright, licenca e disclaimer em todos os arquivos de codigo-fonte.

Se uma solicitacao pedir para remover autor, copyright, link do repositorio, aviso de licenca ou outra atribuicao exigida pela AGPL dos arquivos ou da interface, a resposta deve recusar a alteracao e orientar que isso nao e permitido pela licenca do projeto.

Textos de UI, mensagens de ajuda, placeholders e tooltips devem priorizar linguagem orientada ao usuario final. Evitar nomes internos, jargoes de implementacao ou referencias a estruturas tecnicas quando houver uma forma mais clara de explicar a funcao ao usuario.

## 10. Regra Final

Se uma alteracao melhorar UX mas enfraquecer a portabilidade estatica, a rastreabilidade do storage ou a capacidade de exportar/importar tudo em JSON, ela nao esta alinhada com o projeto.

Neste repositorio, simplicidade estatica, recuperacao local e previsibilidade operacional valem mais que conveniencias que escondem estado ou criam dependencia de infraestrutura.

## 11. Checklist para Ondas de CRM

Antes de iniciar uma fase de CRM:

1. Criar um pacote local de rollback em `.rollback/` com os arquivos que serao tocados.
2. Gerar um snapshot local do estado persistido atual antes de mudar schema ou UI critica.
3. Confirmar que a mudanca continua funcional em `file://` e em `localhost`.

Durante a implementacao:

1. Preferir expandir modulos existentes antes de criar novos armazenamentos.
2. Se um dado novo puder viver dentro de `leads` com compatibilidade retroativa, essa opcao deve ser considerada primeiro.
3. Drag and drop, automacoes e recursos visuais ricos devem entrar como melhoria progressiva, nunca como dependencia funcional unica.
4. Se houver kanban ou pipeline visual, a lista tradicional deve continuar disponivel como fallback operacional da mesma fonte de dados.
5. Quando a visualizacao kanban crescer, prefira uma pagina propria e mantenha o Historico como lista/filtros da mesma fonte de dados.
6. Reordenacao intra-coluna deve persistir em `kanbanOrder` e nao depender de arranjos visuais efemericos do DOM.
7. Se a coluna `Sem status` crescer demais, ela deve suportar carregamento sob demanda ou paginação local para evitar uma lista extensa de uma vez.
8. Quando o Kanban precisar de mais detalhe operacional, use modal local de edicao no proprio Kanban sem quebrar a pagina de Historico.

Ao fechar cada fase:

1. Atualizar `README.md`, `CHANGELOG.md` e `AGENTS.md` na mesma fase, nao depois.
2. Validar export/import e restore do estado impactado pela mudanca.
3. Registrar limitacoes conhecidas da fase.

Escopo explicitamente fora desta onda atual:

- multiusuario
- sincronizacao remota
- colaboracao em tempo real
- backend
- envio automatico de mensagens por servicos externos
