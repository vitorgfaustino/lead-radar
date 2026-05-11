# LeadRadar

Aplicacao web estatica para prospeccao de empresas com Google Places API, evoluindo para um CRM local-first sem backend.

## Demonstração Online

Quer testar a ferramenta online antes de usar localmente? Acesse a versão estática no GitHub Pages pela URL de demonstração abaixo:

[https://vitorgfaustino.github.io/lead-radar/](https://vitorgfaustino.github.io/lead-radar/)

Este projeto não envia nem guarda dados em servidor próprio. Tudo roda apenas no navegador de quem acessa a página, com armazenamento local para histórico, leads, backups e preferências. Isso significa que a demonstração é estática: ela serve para testar a interface e o fluxo, mas os dados ficam no navegador do visitante e podem ser exportados/importados conforme os recursos da aplicação.

Versao atual: 1.0.0 (definida em `src/js/version.js`)

Licenca: GNU AGPL-3.0. Uso comercial permitido. Se voce modificar e distribuir este projeto, ou disponibilizar uma versao modificada por rede, deve oferecer o codigo-fonte correspondente sob os termos da AGPL-3.0.

## Documentos Publicos Do Repositorio

Para manter o projeto pronto para publicacao e manutencao aberta no GitHub, o repositorio preserva estes documentos como fontes de verdade complementares:

- `README.md`: comportamento atual do produto, arquitetura estatica, fluxos principais e limitacoes conhecidas.
- `CHANGELOG.md`: historico das mudancas relevantes para releases futuras.
- `SECURITY.md`: expectativas, mitigacoes atuais e limites reais de seguranca do modelo client-side.
- `CONTRIBUTING.md`: politica de contribuicoes e suporte do LeadRadar, com orientacoes para Issues e manutencao da linha oficial do projeto.
- `AGENTS.md`: restricoes tecnicas obrigatorias para IA e manutencao do projeto.
- `LICENSE`: termos da GNU AGPL-3.0 aplicaveis ao codigo e a redistribuicao.

## Visao Geral

## Contribuicoes e Suporte

Este repositorio esta publico para estudo, uso como referencia e adaptacao conforme a licenca do projeto, mas nao aceita Pull Requests externos neste momento.

Essa decisao existe para preservar a visao autoral, manter consistencia tecnica e concentrar a manutencao em um fluxo unico.

Se voce encontrar um bug, tiver uma duvida ou quiser sugerir uma melhoria, abra uma Issue. Issues sao o canal oficial e bem-vindo para feedback, suporte e relato de problemas.

Pull Requests abertos por terceiros podem ser fechados automaticamente com uma mensagem explicativa.

O LeadRadar roda inteiramente no navegador. O projeto foi desenhado para funcionar abrindo o arquivo `index.html` diretamente ou por um servidor estatico simples em `localhost`, sem `npm`, sem build step e sem infraestrutura externa propria.

O bootstrap do LeadRadar agora fica centralizado em `src/js/app.js` e nos modulos carregados por `index.html`. A pagina principal deve permanecer como casca estatica de layout, modais e marcadores de DOM, evitando reintroduzir grandes blocos de runtime inline que dupliquem a logica dos modulos.

O foco atual do produto e:

- Buscar empresas por termo e localizacao.
- Salvar historico, leads, notas, scores, templates e sequencias localmente.
- Exportar e restaurar snapshots completos em JSON.
- Oferecer backup seguro com senha de instalação.
- Preparar a base para um CRM estatico, local-first e sempre exportavel/importavel.

Ao abrir o sistema pela primeira vez, uma tela introdutoria bloqueia o acesso ate que a chave da API seja informada ou um backup anterior seja restaurado.

Se o navegador ja possuir dados locais salvos, a mesma tela passa a oferecer um desbloqueio por senha para reabrir a instalacao sem obrigar uma nova configuracao da API.

Essa opcao so aparece quando o navegador realmente possui estado local desbloqueavel vinculado a instalacao, como vault da API ou dados locais protegidos pelo verificador da senha. Chaves tecnicas, preferencias padrao e metadados operacionais isolados nao devem liberar esse caminho. Em um navegador limpo, ela nao e exibida e nao libera o sistema por PIN sozinho.

A chave da API continua sendo solicitada apenas quando o usuario estiver em um primeiro uso ou quando for necessario voltar a executar buscas no Google Places.

A mesma tela tambem aparece quando a sessao da chave expira, para manter o acesso bloqueado ate que a senha seja informada novamente.

Historico e Kanban permanecem bloqueados ate o cofre ser desbloqueado. Se o usuario tentar abrir essas paginas por URL direta ou navegar ate elas pela ajuda, o sistema redireciona de volta para o Radar.

Para reduzir mistura visual entre versoes antigas e novas, o `Service Worker` agora prioriza rede para HTML, CSS e JavaScript da propria aplicacao, usando cache apenas como apoio para imagens locais.

Nos fluxos mais recentes, a interface tambem passou a reforcar seguranca visual e clareza operacional:

- A API verificada nao expõe mais a chave completa na tela.
- As senhas passam por um dialog mascarado reutilizavel, inclusive com confirmacao quando necessario.
- A mesma senha de instalação segue sendo a base para API, desbloqueio local e backup seguro.
- O estado de dados locais encontrados agora ganha destaque visual no onboarding.
- O menu de backup alterna entre ativar e desativar o auto backup conforme o estado atual.

## Regra de Ouro

Este projeto e estritamente estatico.

- Sem backend.
- Sem banco de dados externo obrigatorio.
- Sem bundlers ou build step.
- Sem dependencia de Node.js para executar.
- Tudo precisa continuar funcional em arquivo local ou `localhost`.

Qualquer evolucao deve preservar isso.

## Estado Atual

Recursos ja disponiveis:

- Busca avancada por localizacao e termo usando Google Places API.
- Campo `Onde buscar` com `Autocomplete Data (Places New)` em um `input` nativo, permitindo padrao visual proprio e fallback para digitacao manual + geocoding quando nao houver selecao.
- Visualizacao em lista e grade.
- A lista e a grade agora paginam localmente dentro do runtime principal, sem depender de patch script separado.
- Historico de buscas e empresas encontradas.
- Gestao local de leads, notas e status.
- Score de leads.
- Templates de email e sequencias de contato.
- Exportacao e restauracao de snapshot JSON completo.
- Backup seguro criptografado por senha de instalação.
- Vault da API key criptografado por senha de instalação, com desbloqueio de sessao.
- A visualizacao de API verificada mostra a chave mascarada, evitando exposicao acidental na interface.
- Fluxo de desbloqueio local por senha quando a instalacao ja possui dados persistidos.
- O desbloqueio local por PIN so e liberado quando houver vault da API ou dados locais vinculados ao verificador da instalacao; persistencias tecnicas e defaults locais nao contam como instalacao desbloqueavel.
- Auto backup local em `IndexedDB`, criptografado por senha, para recuperar o sistema caso o `localStorage` seja perdido.
- `Service Worker` com estrategia de rede prioritaria para arquivos criticos da UI, reduzindo telas misturadas por cache antigo.
- Modal de backup com rotulos consolidados para `Backup > Manual > Exporte seu Backup` e `Backup > AUTO Local > Snapshot local`.
- Os campos de senha nas telas de onboarding, backup e API agora usam entrada mascarada para evitar exibicao do segredo enquanto o usuario digita.
- Interface principal redesenhada como cockpit dark de Places/CRM, com destaque visual em `#45D9FF`, cards de metricas locais, radar de empresas, filtros de qualificacao e workspace de lead.
- `index.html` voltou a carregar o LeadRadar pelo runtime modular (`src/js/app.js`, servicos e patches externos), mantendo o onboarding, a central de configuracoes e a busca principal fora de blocos inline gigantes.
- Historico e Kanban so podem ser abertos com o cofre desbloqueado; acessos diretos por URL redirecionam para o Radar.
- `ajuda.html` permanece publica, mas agora segue a mesma base de CSP estatica das paginas principais.
- O Historico deixou de expor o objeto completo da empresa em atributos do DOM e passou a resolver a ficha por `placeId` em memoria durante a sessao.
- As renderizacoes do Historico, da paginação auxiliar, do PDF e do `InfoWindow` do mapa agora escapam texto dinamico e validam links externos antes de inseri-los no HTML.
- O fluxo de `Primeiro uso` agora avanca no mesmo carregamento depois de salvar a chave e a senha local, sem depender apenas de `reload()` para liberar a interface.
- As paginas principais passaram a compartilhar `src/js/tailwind-config.js`, removendo os blocos inline duplicados de configuracao do Tailwind.
- O bootstrap apos `Primeiro uso`, restauracao e desbloqueio local agora usa reinicio com cache-buster na URL para reduzir travamentos por assets antigos em `file://`.
- As paginas principais passaram a carregar assets locais versionados com `?v=1.0.0`, reduzindo o risco de scripts e estilos desatualizados ficarem presos em cache do navegador.
- O onboarding agora retoma o bootstrap da aplicacao imediatamente apos validacao bem-sucedida, sem depender apenas da navegacao de refresh.
- O overlay de onboarding agora some de fato ao ser ocultado, evitando que uma camada invisivel continue bloqueando cliques na interface principal.
- Historico e Kanban agora reconhecem corretamente a sessao desbloqueada quando a API ja foi liberada no navegador, sem rejeitar a navegacao por esperar um valor fixo diferente do vault real em sessao.
- A central de Configuracoes passou a rolar corretamente em telas pequenas, evitando corte das secoes inferiores do modal.
- O fluxo de senha da instalacao na tela principal agora usa dialogo mascarado em vez de `prompt()` do navegador, ocultando a digitacao ao destravar API, backup e acoes protegidas.
- Ao abrir a API pelas Configuracoes, a senha da instalacao agora e solicitada uma unica vez por operacao e continua sendo a mesma senha do cofre e do vault da API.
- O desbloqueio do cofre local agora libera a consulta do Radar, Historico e Kanban mesmo sem API ativa na sessao. A API continua obrigatoria apenas para novas extracoes e recursos conectados.
- Cards do Kanban em `Sem status` agora podem ser movidos normalmente para outras colunas, mesmo quando o lead ainda nao possuia registro persistido em `leads`.
- O modal de senha do cofre foi reduzido e centralizado, e a tecla Enter confirma a senha diretamente no dialogo.
- Os filtros dropdown do Historico receberam acabamento visual para ficar mais legiveis e consistentes com o restante da interface.
- O menu `Exportar` do Historico agora abre ancorado no proprio botao, no mesmo ponto da acao, com sobreposicao correta sobre a interface; os filtros tambem ganharam setas visiveis para reforcar que sao dropdowns.
- O workspace compartilhado do lead agora pagina a timeline de atividades com rolagem interna, sem deixar o modal crescer indefinidamente, padroniza melhor as superficies dos campos, chips de score e destaques da ficha extraida, organiza Resumo, Etiquetas, Notas e Atividades em blocos expansíveis, reabre esses blocos no mesmo estado em que o usuario os deixou na ultima interacao, mostra um resumo compacto de acompanhamento e serve como fluxo unico de detalhes no Radar, Historico e Kanban.

## Comportamento Atual Da Extracao E Da API

O projeto hoje mistura dois caminhos modernos do ecossistema Google Maps/Places:

- a busca principal de empresas e os detalhes usam `places.googleapis.com/v1`, isto é, Places API (New)
- o campo `Onde buscar` do Radar agora usa `Autocomplete Data`, tambem alinhado a Places API (New)
- o carregamento da Maps JavaScript API ainda usa script direto com `callback`, mas agora com `loading=async`

Na pratica, isso significa que a camada mais critica da busca ja saiu do legado. O warning estrutural que ainda resta no console do Google esta ligado ao uso de `google.maps.Marker` no mapa de resultados e nao mais ao autocomplete de localizacao.

Hoje o fluxo de extracao funciona em duas etapas separadas:

1. A busca envia para a Google Places API apenas o termo, a localizacao, o raio e a quantidade maxima pedida.
2. Depois que o lote bruto volta, a interface aplica filtros locais para exibir um subconjunto na tela.

Na implementacao atual:

- `com website`, `sem website`, `com telefone`, `4+ estrelas` e `50+ avaliacoes` funcionam como pos-filtro local.
- esses filtros nao entram como regra nativa da requisicao enviada para a Google Places API.
- por isso, eles nao reduzem diretamente a quantidade de chamadas da busca inicial.
- o comportamento atual do Historico ainda grava o lote bruto retornado pela busca antes desses filtros locais de qualificacao.
- na pratica, pedir `10 empresas sem website` pode mostrar menos correspondencias na tela, mas a sessao salva ainda pode conter empresas fora desse criterio.

O unico ajuste operacional relacionado a midia e o chip de fotos, que altera a preparacao do resultado para exibir foto quando ela vier disponivel no retorno. Ainda assim, a busca continua baseada no mesmo termo, localizacao, raio e limite informado.

Limitacao importante atual:

- os filtros de qualificacao ajudam a triagem visual do lote retornado, mas hoje nao funcionam como garantia estrita do que entra no Historico.
- por isso, a documentacao da Ajuda e da interface deve ser lida como comportamento atual do produto, nao como promessa de filtro duro na coleta.

Observacoes operacionais recentes:

- ao abrir a aplicacao por `file://`, o `Service Worker` e desativado de proposito; use `http://localhost` para validar cache offline
- o aviso do CDN do Tailwind ainda e esperado enquanto a migracao para CSS local/estatico nao for feita
- navegadores podem aplicar restricoes extras de origem unica em alguns anchors ou navegacoes internas quando a pagina roda em `file://`
- o hardening atual prioriza reduzir XSS e exposicao de dados no browser antes de qualquer migracao ampla de Tailwind ou CSP mais rigida
- a validacao da chave continua sendo remota; quando a API for recusada, a UI agora mostra mensagens mais proximas do erro real devolvido pelo Google Places
- se o navegador insistir em exibir uma versao antiga em `file://`, o projeto agora tenta furar esse cache com query string de boot e versionamento dos assets locais

## Onda CRM Atual

A implementacao em andamento prioriza um CRM leve, local-first e de baixo impacto tecnico.

Nesta primeira onda:

- o mesmo objeto `leads` passa a concentrar a base de CRM leve
- os campos novos entram com compatibilidade retroativa
- a primeira UI-alvo sera o CRM em `historico.html`
- o pipeline inicial reaproveita os status atuais do lead
- o historico fica dedicado a listagem e filtros, enquanto o Kanban ganhou uma pagina propria
- multiusuario, sincronizacao remota e colaboracao em tempo real ficam fora do escopo por enquanto

Campos adicionados na base do lead para esta onda:

- `tags`
- `activities`
- `nextActionAt`
- `lastContactAt`
- `ownerLabel`
- `kanbanOrder`

Esses campos continuam dentro da mesma chave persistida `leads`, sem criar um segundo modelo paralelo de CRM nesta etapa.

Entrega atual desta onda no CRM:

- modal do lead com notas, tags, proxima acao e timeline local de atividades
- workspace compartilhado do lead com campos visuais padronizados, destaque suave por etapa/score, timeline recente paginada, resumo compacto de acompanhamento, secoes expansíveis para Resumo, Etiquetas, Notas e Atividades, preservando o ultimo estado aberto/fechado durante o uso e unificando a abertura de detalhes entre Radar, Historico e Kanban
- board kanban leve em `kanban.html`
- modal de detalhes e edicao direta do lead dentro do Kanban
- movimentacao de cards por drag and drop nativo entre colunas e por botoes de estagio
- carregamento sob demanda para a coluna `Sem status`, para evitar listas extensas de uma vez
- reordenacao dos cards dentro da mesma coluna, persistida em `kanbanOrder`
- lista tradicional mantida em `historico.html` como fallback e leitura detalhada do mesmo conjunto filtrado
- textos principais revisados em Radar, Historico e Kanban com linguagem mais direta para o usuario
- explicacoes por hover nativo nos principais campos, filtros e acoes operacionais
- `ajuda.html` redesenhada como guia de aprendizado, com passo a passo de uso, leitura do score e simulacao de custo para 1000 fichas sem fotos

Também foram reduzidos usos de `innerHTML` em toasts e banners que exibem texto derivado de busca ou estado do usuário.

O modal de histórico também passou a montar o filtro de sessões com nós DOM em vez de concatenar opções em HTML.

A paginação dos resultados também reduziu `innerHTML` em estados vazios e botões de navegação, usando nós DOM para esses trechos.

A visualização principal de lista também passou a reutilizar o mesmo estado vazio seguro por DOM.

Os cards principais de lista e grade passaram a ser montados com nós DOM, reduzindo a última interpolação grande de resultados nessa tela.

O estado vazio compartilhado da área de resultados também passou a ser montado com nós DOM e reutilizado pela visualização ativa.

As limpezas de container da área de resultados também passaram a usar `replaceChildren()`, deixando `src/js/app.js` sem escrita de `innerHTML` nesse fluxo.

O histórico de consultas também avançou: a lista de sessões passou a ser montada com nós DOM em vez de string HTML concatenada.

A visualização por termo do histórico também passou a ser montada com nós DOM.

A lista de empresas do histórico também foi convertida para nós DOM, incluindo o resumo e os itens exibidos.

Os botões simples de paginação e os estados da validação da API key também passaram a trocar ícones e textos por nós DOM.

O modal de detalhes passou a escapar campos de texto e usar URL segura para imagem, website e notas.

Os cards principais de lista e grade também passaram a escapar campos de empresa e a usar URL segura com `rel="noopener noreferrer"`.

As notas do modal de detalhes passaram a ser renderizadas como nós DOM para evitar interpolação de texto do usuário em HTML.

O conteúdo principal do modal de detalhes também passou a ser montado com nós DOM, reduzindo a superfície restante de `innerHTML` nessa tela.

As ações rápidas do modal de detalhes passaram a normalizar os textos usados em WhatsApp e cópia para a área de transferência.

A confirmação de cópia do modal passou a reutilizar o toast interno do app, em vez de `alert()`.

A ação de e-mail do modal também passou a normalizar o nome da empresa antes de gerar assunto e corpo.

Alguns controles simples do topo da interface passaram a trocar ícones e textos via nós DOM em vez de `innerHTML`.

O botão da API key também passou a montar seu estado verificado por nós DOM na inicialização.

O botão de validação da API key passou a alternar seu estado de carregamento com nós DOM em vez de `innerHTML`.

## Arquitetura de Dados

O armazenamento principal atual ainda usa `localStorage`, mas o projeto agora trata esse estado como um snapshot completo versionado.

Leituras e gravações de preferencia de visualizacao, status de prospeccao e dos principais modulos de CRM passaram a usar um facade central em `StorageManager`, para reduzir acessos diretos espalhados pelos scripts.

Modulos persistidos atualmente:

- `googlePlacesApiKey`
- `_securityKey`
- `preferredView`
- `prospectedPlaces`
- `leads`
- `leadNotes`
- `searchHistory`
- `userPreferences`
- `emailTemplates`
- `contactSequences`
- `scheduledActions`
- `leadScores`
- `leadScoreConfig`
- `autoBackupSettings`
- `autoBackupStatus`

O manifesto de persistencia esta centralizado em src/js/export-import.js.

## Seguranca e Privacidade

### Limite real do modelo client-side

Como o projeto nao tem backend, nao existe segredo inviolavel no navegador. A seguranca aqui e de reducao de risco, nao de sigilo absoluto.

### API key do Google

- A chave deve ser restringida por `HTTP referrer` no Google Cloud Console.
- A chave agora e persistida em vault criptografado com o PIN unico da instalacao e Web Crypto.
- O desbloqueio da chave ocorre por sessao no navegador; ao reiniciar, o mesmo PIN unico precisa ser informado novamente.
- A troca da chave API nao apaga leads, historico ou backups; o sistema valida a nova chave e regrava apenas o vault da API quando a validacao passa.
- Se a instalacao ja estiver destravada, a troca reutiliza o PIN da sessao atual para manter a mesma protecao criptografica.
- O mesmo PIN unico agora tambem e validado por um verificador criptografado da instalacao, usado para desbloqueio local e para os fluxos de backup seguro.
- Nunca assuma que uma chave guardada no navegador esta protegida contra um ambiente comprometido.

### Primeira abertura

Na tela introdutoria, voce pode escolher entre:

- `Novo uso`: informar a API, criar um PIN e começar do zero.
- `Restaurar backup`: carregar um snapshot anterior e destravar a instalacao com o mesmo PIN unico.
- `Desbloquear instalação`: usar o PIN unico de uma instalacao local ja configurada.

O PIN unico protege a API e os backups locais. Ele e necessario para recuperar a instalacao depois e deve ter pelo menos 4 caracteres. Para gerar a API, acesse a pagina de credenciais do Google Cloud em [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials), crie a chave, restrinja por `HTTP referrer` e habilite as APIs usadas pelo projeto.

Se voce restaurar um backup que contenha a chave da API, a tela introdutoria vai pedir o mesmo PIN unico para liberar o sistema imediatamente.

### Backup seguro por PIN unico

O projeto agora possui uma base de criptografia local com:

- `PBKDF2` para derivacao do PIN unico da instalacao.
- `AES-GCM` para criptografia autenticada.
- `salt` e `iv` aleatorios via Web Crypto.

Implementacao-base em [src/js/services/SecurityService.js](src/js/services/SecurityService.js).

### Auto backup local

O auto backup foi iniciado com a seguinte estrategia:

- Os snapshots automaticos sao gravados em `IndexedDB`, nao no `localStorage`.
- O payload e criptografado pelo mesmo PIN unico da instalacao.
- Isso permite restaurar o sistema se o `localStorage` se perder, desde que o `IndexedDB` da origem ainda exista.
- O navegador controla fisicamente onde o `IndexedDB` fica salvo no computador. Por seguranca, uma aplicacao web estatica nao pode escolher uma pasta arbitraria para salvar backups automaticos sem acao explicita do usuario.
- Para escolher um local no computador, use a exportacao manual de backup JSON ou backup seguro e selecione a pasta no download do navegador.

Limite importante:

- Se o navegador limpar todo o armazenamento do site, `localStorage` e `IndexedDB` podem ser perdidos juntos.
- Por isso o fluxo recomendado continua incluindo exportacao manual de backup seguro em arquivo JSON.

### Privacidade

Direcao do projeto:

- Reduzir CSP permissiva ao minimo necessario.
- Minimizar `innerHTML` com dados dinamicos.
- Remover logs sensiveis de producao.

## Backup e Restauracao

O modal de backup da pagina principal agora diferencia tres fluxos:

1. `Exportar Backup`
   Gera um snapshot JSON completo do estado atual.

2. `Exportar Backup Seguro`
   Gera um snapshot JSON criptografado por PIN.

3. `Ativar Auto Backup Seguro`
   Cria snapshots automaticos criptografados em `IndexedDB` para ajudar na recuperacao se o `localStorage` for perdido.

4. `Restaurar Ultimo Auto Backup`
   Restaura o snapshot automatico mais recente usando o PIN correto.

5. `Alterar senha de criptografia`
   Permite informar a senha atual e definir uma nova senha para recriptografar o vault da API e atualizar a instalacao.

Observacoes importantes:

- A senha nao e persistida. A automacao continua apenas enquanto a senha estiver liberada na sessao atual.
- O auto backup atual e um primeiro passo. A evolucao prevista inclui retomar a automacao apos desbloqueio da sessao e ampliar observabilidade de saude do backup.
- A API key tambem usa o mesmo principio: vault persistente criptografado, chave destravada apenas na sessao atual.
- Snapshots exportados passam a registrar checksum quando Web Crypto estiver disponivel, e a importacao valida essa integridade antes de sobrescrever dados locais.

## Politica de Rollback Local

Antes de cada fase relevante de evolucao do CRM:

- gerar um pacote local dos arquivos tocados em `.rollback/`
- gerar um snapshot local do estado persistido atual
- manter nomeacao por fase para facilitar reversao de codigo e dados

Exemplo atual:

- `.rollback/phase-01-crm-foundation-20260510T1335/`
- `.rollback/phase-02-kanban-lite-20260510T1400/`
- `.rollback/phase-03-kanban-dragdrop-20260510T1420/`

Esse processo nao substitui o backup do usuario. Ele existe para rollback tecnico durante manutencao e evolucao do produto.

## Observacao Sobre Resultado Exibido X Resultado Salvo

Enquanto o fluxo atual permanecer assim, existe uma diferenca entre o que a tela pode mostrar depois dos filtros locais e o que a sessao original da busca pode registrar no Historico.

- Resultado exibido: subconjunto filtrado localmente sobre o lote retornado.
- Resultado salvo no Historico: lote bruto retornado pela busca atual.

Isso explica por que alguns filtros aparentam "nao valer como regra" da extracao, mesmo quando ajudam a leitura imediata na tela.

## Estrutura do Projeto

```text
/
├── index.html
├── ajuda.html
├── sw.js
├── README.md
├── AGENTS.md
├── CHANGELOG.md
└── src/
    ├── assets/
    ├── css/
    └── js/
        ├── app.js
        ├── export-import.js
        └── services/
            ├── ApiKeyService.js
            ├── EmailTemplateService.js
            ├── LeadManager.js
            ├── LeadScoreService.js
            ├── PlacesService.js
            ├── SearchHistoryService.js
            ├── SecurityService.js
            └── SequenceService.js
```

## Como Usar

1. Baixe ou clone o repositorio.
2. Abra `index.html` em um navegador moderno ou rode via servidor estatico simples.
3. Configure a chave da Google Places API.
4. Execute buscas por termo e localizacao.
5. Salve leads, notas e acompanhe o historico.
6. Gere backups JSON regulares.
7. Se quiser maior resiliencia local, ative o auto backup seguro e use uma senha.

## Compatibilidade

Requisitos minimos:

- Navegador moderno com suporte a ES6+.
- `localStorage` habilitado.
- `IndexedDB` para auto backup local resiliente.
- `Web Crypto API` para backup seguro por PIN unico.

Se `IndexedDB` ou `Web Crypto` nao estiverem disponiveis, o app continua operando, mas recursos de backup seguro e auto backup ficam limitados.

## Roadmap em Etapas

### Etapa 1 — Documentacao, contrato de seguranca e superficie publica

- Alinhar README, AGENTS e ajuda.
- Remover analytics externo por padrao.
- Formalizar modelo de seguranca realista para app client-side.

### Etapa 2 — Registro central de persistencia

- Consolidar manifest de dados locais.
- Eliminar acessos diretos espalhados ao `localStorage`.
- Versionar schemas e preparar migracoes.

### Etapa 3 — Vault da API key

- Persistencia da chave com PIN unico obrigatorio.
- Web Crypto como base.
- Estado destravado apenas na sessao atual.

### Etapa 4 — Snapshot completo e restauracao robusta

- Backup versionado com checksum.
- Importacao com validacao e rollback.
- Compatibilidade com snapshots legados.

### Etapa 5 — Auto backup resiliente

- Snapshot criptografado em `IndexedDB`.
- Rotacao de snapshots.
- Restore do ultimo backup automatico.
- Evolucao futura para experiencia de destravamento por sessao mais clara.

### Etapa 6 — Hardening de privacidade e integridade

- Reduzir `unsafe-inline`.
- Revisar pontos com `innerHTML`.
- Remover logs sensiveis.

### Etapa 7 — Modelo CRM local-first

- Empresa, contatos, tags, atividades, pipeline e proxima acao.
- Tudo exportavel/importavel em JSON.
- Multiusuario continua fora do escopo desta etapa inicial.

### Etapa 8 — Interface CRM

- Pipeline/Kanban.
- Workspace do lead.
- Timeline de follow-up.
- Gestao de tags.
- Lista e kanban devem coexistir enquanto o pipeline ainda for progressivo.
- Historico e Kanban devem seguir separados, com o historico priorizando listagem/filtros e o Kanban priorizando operacao visual.
- O Kanban pode reorganizar prioridade dentro da coluna sem alterar o status do lead.
- Sem colaboracao em tempo real nesta onda.

### Etapa 9 — Relatorios e publicacao futura

- Dashboard local.
- Changelog estruturado.
- Preparacao para futura abertura do projeto.

## Desenvolvimento

Antes de mudar o projeto, leia [AGENTS.md](AGENTS.md).

Diretrizes principais:

- Tudo novo deve continuar estatico.
- Todo dado persistido novo deve nascer exportavel/importavel.
- Mudancas de storage exigem cuidado com migracao e restore.
- Evite prometer seguranca maior do que a arquitetura realmente pode entregar.

## Licenca e uso

Este projeto e distribuido sob a GNU Affero General Public License v3.0 (AGPL-3.0).

- Uso comercial e permitido.
- Qualquer versao modificada distribuida ou oferecida por rede precisa disponibilizar o codigo-fonte correspondente sob AGPL-3.0.
- O software e entregue "como esta", sem garantias de qualquer tipo, na medida permitida pela lei aplicavel.
- O autor nao assume responsabilidade por danos, perdas ou resultados imprecisos produzidos por saidas de IA ou por uso incorreto do sistema.
- O link de codigo-fonte publico deve permanecer visivel no rodape da interface.
