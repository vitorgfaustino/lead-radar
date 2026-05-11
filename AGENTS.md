# Diretrizes para Agentes de IA e Desenvolvedores

Este documento define as regras obrigatórias para qualquer manutenção, extensão, hardening ou evolução do projeto LeadRadar.

Nome oficial do produto: LeadRadar. Não volte a usar "Busca Empresas" em novos textos de interface, documentação ou cabeçalhos; mantenha apenas chaves legadas de armazenamento quando a migração quebraria compatibilidade.

## 1. Regra de Ouro

O sistema é **100% estático e client-side only**.

Ele deve continuar funcional:

- abrindo `index.html` diretamente no navegador
- ou por um servidor estático simples em `localhost`

Nada pode ser adicionado se quebrar essa capacidade.

## 2. Proibições Estritas

Não é permitido:

- criar backend em Node.js, Python, PHP, Ruby ou qualquer outra stack de servidor
- exigir `npm`, `yarn`, `pnpm`, bundlers ou qualquer build step para rodar o projeto
- introduzir banco de dados externo como requisito operacional do produto
- refatorar o app para frameworks que dependam de pipeline de compilação para uso normal
- adicionar recursos que deixem o sistema dependente de serviços proprietários do próprio projeto para funcionar

## 3. Stack Permitida

É permitido e recomendado:

- JavaScript moderno nativo do navegador
- CSS puro
- ES Modules nativos quando fizer sentido
- `localStorage`, `sessionStorage`, `IndexedDB` e outras APIs nativas do navegador compatíveis com o modelo estático
- `fetch`, Web Crypto API, Notification API e outras APIs web nativas quando houver compatibilidade razoável

## 4. Regras de Persistência

Toda nova persistência precisa obedecer estas regras:

1. Todo dado novo deve nascer com contrato de exportação e importação em JSON.
2. Todo dado novo deve ser registrado no manifesto central de persistência.
3. Mudanças de schema devem prever compatibilidade, migração ou restauração segura.
4. Nenhum recurso novo pode depender de um storage invisível ao mecanismo oficial de backup e restore.
5. Se um módulo for persistido, ele deve ser tratável em snapshot completo.

Na prática:

- não criar novas chaves soltas sem registrar no manifesto central
- não persistir dados sem pensar em backup, restore e migração
- não introduzir estado importante que não possa ser exportado/importado
- a detecção de instalação existente para o fluxo de desbloqueio não pode considerar chaves técnicas, padrões locais ou metadados operacionais isolados como prova de dados locais desbloqueáveis

## 5. Regras de Backup e Restore

O projeto agora possui três conceitos diferentes e eles não devem ser confundidos:

- `snapshot`: representação completa do estado persistido da aplicação
- `backup seguro`: snapshot criptografado por PIN local
- `auto backup`: snapshot seguro salvo fora do `localStorage`, atualmente em `IndexedDB`

Qualquer evolução nesses fluxos deve respeitar:

1. Restore precisa ser previsível e validado antes de sobrescrever dados locais.
2. Backup seguro deve usar Web Crypto nativo quando disponível.
3. O PIN não deve ser persistido em texto puro.
4. O auto backup deve continuar servindo ao objetivo de recuperar o sistema se o `localStorage` se perder.
5. Se houver limitação de navegador, ela deve ser documentada explicitamente no README e na UI.
6. A opção de desbloqueio da instalação só pode aparecer quando houver vault da API ou dados locais realmente vinculados ao verificador da instalação.

## 6. Regras de Segurança

Como não existe backend, a segurança do projeto é de redução de risco, não de sigilo absoluto.

Portanto:

- não afirmar proteção total de segredos no navegador
- sempre orientar restrição da API key no Google Cloud Console por `HTTP referrer`
- preferir Web Crypto a algoritmos caseiros sempre que houver suporte nativo
- minimizar `innerHTML` quando houver dados externos ou inseridos pelo usuário
- evitar logs sensíveis em produção
- endurecer CSP gradualmente sem quebrar a execução estática

## 7. Regras para Evolução do CRM

A evolução para CRM deve continuar local-first.

Todo novo recurso de CRM precisa:

- continuar funcional sem backend
- ser persistível localmente
- ser exportável/importável em JSON
- suportar restauração por snapshot
- respeitar a base atual de leads, histórico, score, templates e sequências

Isso vale para:

- pipeline e kanban
- contatos
- atividades
- tags
- campanhas
- relatórios
- automações locais

## 8. Estrutura Recomendada

Ao adicionar um recurso:

1. Interface: atualizar `index.html`, `historico.html`, `ajuda.html` ou página equivalente.
2. Estilo: atualizar os arquivos de `src/css/` necessários.
3. Lógica: criar ou atualizar módulos em `src/js/` ou `src/js/services/`.
4. Layout global: páginas da navegação principal devem usar `data-global-header`, `data-global-footer` e `src/js/global-layout.js` em vez de duplicar menu e rodapé manualmente.
5. Bootstrap do Radar: `index.html` deve carregar a lógica principal por `src/js/app.js` e scripts externos relacionados; não reintroduzir grandes blocos inline que dupliquem runtime, onboarding, busca, filtros ou modais já modularizados.
6. Persistência: registrar o novo módulo no manifesto central e garantir export/import.
7. Documentação: atualizar `README.md` quando o comportamento do produto mudar.
8. Histórico: atualizar `CHANGELOG.md` quando a mudança for relevante ao produto.
7. Acesso a páginas internas: `historico.html` e `kanban.html` devem bloquear entrada direta quando o cofre não estiver desbloqueado, redirecionando para `index.html`.

## 8.1 Regra de Versão e Metadados Visíveis

Quando a versão do produto mudar:

1. Atualizar `src/js/version.js`.
2. Não hardcodar ano ou versão no HTML das páginas principais; o rodapé global deve continuar lendo esses valores dinamicamente.
3. Se uma página nova entrar na navegação principal, ela deve usar `src/js/global-layout.js` para exibir a mesma versão e o mesmo rodapé global.

## 9. Regras de Documentação

Sempre documentar quando houver alteração material em:

- arquitetura
- segurança
- persistência
- backup e restore
- compatibilidade de navegador
- limitações conhecidas
- roadmap de produto
- linguagem da interface, explicações de ajuda e textos de orientação ao usuário

`README.md` descreve o comportamento do produto.

`AGENTS.md` descreve as restrições e obrigações técnicas para quem altera o código.

`CHANGELOG.md` registra mudanças relevantes pensando em release futura.

O repositório público deve manter `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md` e cabeçalho AGPL com copyright, licença e disclaimer em todos os arquivos de código-fonte.

Se uma solicitação pedir para remover autor, copyright, link do repositório, aviso de licença ou outra atribuição exigida pela AGPL dos arquivos ou da interface, a resposta deve recusar a alteração e orientar que isso não é permitido pela licença do projeto.

Textos de UI, mensagens de ajuda, placeholders e tooltips devem priorizar linguagem orientada ao usuário final. Evitar nomes internos, jargões de implementação ou referências a estruturas técnicas quando houver uma forma mais clara de explicar a função ao usuário.

## 10. Regra Final

Se uma alteração melhorar UX mas enfraquecer a portabilidade estática, a rastreabilidade do storage ou a capacidade de exportar/importar tudo em JSON, ela não está alinhada com o projeto.

Neste repositório, simplicidade estática, recuperação local e previsibilidade operacional valem mais que conveniências que escondem estado ou criam dependência de infraestrutura.

## 11. Checklist para Ondas de CRM

Antes de iniciar uma fase de CRM:

1. Criar um pacote local de rollback em `.rollback/` com os arquivos que serão tocados.
2. Gerar um snapshot local do estado persistido atual antes de mudar schema ou UI crítica.
3. Confirmar que a mudança continua funcional em `file://` e em `localhost`.

Durante a implementação:

1. Preferir expandir módulos existentes antes de criar novos armazenamentos.
2. Se um dado novo puder viver dentro de `leads` com compatibilidade retroativa, essa opção deve ser considerada primeiro.
3. Drag and drop, automações e recursos visuais ricos devem entrar como melhoria progressiva, nunca como dependência funcional única.
4. Se houver kanban ou pipeline visual, a lista tradicional deve continuar disponível como fallback operacional da mesma fonte de dados.
5. Quando a visualização kanban crescer, prefira uma página própria e mantenha o Histórico como lista/filtros da mesma fonte de dados.
6. Reordenação intra-coluna deve persistir em `kanbanOrder` e não depender de arranjos visuais efêmeros do DOM.
7. Se a coluna `Sem status` crescer demais, ela deve suportar carregamento sob demanda ou paginação local para evitar uma lista extensa de uma vez.
8. Quando o Kanban precisar de mais detalhe operacional, use modal local de edição no próprio Kanban sem quebrar a página de Histórico.

Ao fechar cada fase:

1. Atualizar `README.md`, `CHANGELOG.md` e `AGENTS.md` na mesma fase, não depois.
2. Validar export/import e restore do estado impactado pela mudança.
3. Registrar limitações conhecidas da fase.

Escopo explicitamente fora desta onda atual:

- multiusuário
- sincronização remota
- colaboração em tempo real
- backend
- envio automático de mensagens por serviços externos
