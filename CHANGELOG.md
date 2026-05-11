# Changelog

Todas as mudancas relevantes deste projeto devem ser registradas aqui.

O formato segue a ideia de `Keep a Changelog`, adaptado ao contexto atual do repositorio e preparado para futura publicacao open source.

## [Unreleased]

### Added

- Primeira base de CRM leve sobre a mesma chave `leads`, com suporte retrocompativel a `tags`, `activities`, `nextActionAt`, `lastContactAt`, `ownerLabel` e `kanbanOrder` em `LeadManager`.
- Processo local de rollback por fase iniciado com pacote de arquivos em `.rollback/` e snapshot local do estado persistido antes da primeira onda de CRM.
- Kanban leve em `historico.html`, com colunas baseadas no status manual do lead e cards com tags e proxima acao.
- Visualizacao separada de Kanban em `kanban.html`, com drag and drop nativo entre colunas de status.
- Reordenacao intra-coluna no Kanban, usando `kanbanOrder` para ajustar a prioridade visual dos cards.
- Modal de detalhes e edicao direta do lead dentro do Kanban, com status, tags, notas, responsavel e datas de acompanhamento.
- Coluna `Sem status` passou a carregar sob demanda para evitar listas extensas na primeira renderizacao.
- Hovers nativos de explicacao foram adicionados aos principais campos e acoes em Radar, Historico e Kanban.
- `ajuda.html` foi redesenhada como guia operacional, com trilha de aprendizado, orientacoes de seguranca e simulacao de custo para 1000 fichas sem fotos.

### Changed

- O menu das paginas principais agora e global e consistente, com configuracoes centralizadas em um unico ponto e rodape compartilhado com ano dinamico e versao vinda de `src/js/version.js`.
- O antigo atalho de backup do topo foi convertido em central de configuracoes no Radar, reunindo API, ajuda, backup, restauracao e seguranca na mesma tela.
- O site agora exibe um alerta visual quando a API do Google ainda nao esta configurada ou destravada na sessao atual.
- O painel `AUTO Local` passou a usar destaque azul do tema quando o auto backup esta ativo, reduzindo ambiguidade visual no modal de configuracoes.
- O carregamento da Maps JavaScript API passou a usar `loading=async`, reduzindo o warning de bootstrap sincrono no console.
- O registro do `Service Worker` agora e ignorado em `file://`, evitando erro de runtime fora de `http/https` e deixando claro que cache offline deve ser testado em `localhost`.
- O campo `Onde buscar` foi migrado do widget legado `google.maps.places.Autocomplete` para `Autocomplete Data (Places New)` com lista de sugestoes propria, mantendo o estilo nativo do formulario e controle total da UX.
- O autocomplete de localizacao no Radar agora usa um `input` HTML normal com dropdown customizado, eliminando a borda azul interna do widget e preservando a selecao de lugares em Places API (New).
- Notas adicionadas ao lead agora tambem podem alimentar a timeline local de atividades sem criar um segundo armazenamento de CRM.
- A onda atual de CRM passa a excluir explicitamente multiusuario, sincronizacao remota e colaboracao em tempo real; esse tema fica adiado para uma discussao futura.
- O onboarding agora exibe a opcao de desbloqueio apenas quando existe estado local realmente desbloqueavel, ignorando chaves tecnicas e configuracoes padrao gravadas pelo bootstrap.
- O repositorio foi preparado para publicacao publica em AGPL-3.0, com `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, link de codigo-fonte na interface e cabecalhos de copyright/licenca nos arquivos de codigo.
- O `index.html` do Radar voltou a carregar header, onboarding, modal de API e runtime principal por modulos externos, com o bloco inline legado desativado para evitar nova divergencia entre HTML e `src/js/app.js`.
- A paginação da lista e da grade foi absorvida por `src/js/app.js`, permitindo remover o patch `pagination-fix.js` da pagina principal.
- README e Ajuda agora documentam explicitamente o comportamento atual da extracao: filtros de website, telefone, avaliacao e volume de reviews atuam como pos-filtro local, nao como regra nativa da busca, e o Historico ainda reflete o lote bruto retornado pela API.
- O CRM historico agora permite mover leads entre colunas de pipeline sem criar persistencia paralela ao modelo atual de `leads`.
- A fase 2 de CRM tambem recebeu rollback local proprio em `.rollback/phase-02-kanban-lite-20260510T1400/`.
- O Historico voltou a concentrar listagem e filtros, enquanto o Kanban passou a ficar em uma pagina propria.
- A fase 3 de CRM recebeu rollback local proprio em `.rollback/phase-03-kanban-dragdrop-20260510T1420/`.
- O Kanban agora suporta reordenacao dos cards dentro da mesma coluna com persistencia local da ordem.
- Textos tecnicos e genericos da interface foram substituidos por copy orientada ao usuario final, com reforco de explicacoes de contexto e operacao.
- O Historico passou a resolver empresas por `placeId` em memoria durante a sessao, em vez de serializar o objeto completo em atributos `data-*` do DOM.
- A paginação auxiliar voltou a usar escape consistente de texto e validacao de links/URLs de imagem nas visoes de lista e grade.
- `ajuda.html` passou a declarar CSP explicita alinhada ao runtime estatico atual, sem deixar de ser uma pagina publica.
- `index.html`, `historico.html` e `kanban.html` passaram a compartilhar `src/js/tailwind-config.js`, removendo blocos inline repetidos de configuracao do Tailwind.
- As paginas principais passaram a carregar assets locais com query string versionada para reduzir cache antigo em execucoes por `file://`.
- O onboarding passou a retomar o bootstrap do app no mesmo carregamento apos validacao, restore e desbloqueio local, com refresh apenas como fallback.
- Corrigido um conflito de CSS em que o gate de onboarding permanecia interceptando cliques mesmo com classe `hidden`, deixando a interface aparentemente liberada, mas sem resposta.
- Corrigido o guard de Historico e Kanban para aceitar a sessao real da API destravada, restaurando a navegacao interna apos liberar o cofre.
- A central de Configuracoes ficou rolavel em telas pequenas e o modal de backup deixou de cortar secoes inferiores fora da viewport.
- O fluxo protegido por senha na pagina principal passou a usar dialogo mascarado no lugar do `prompt()` nativo do navegador.
- A atualizacao ou destravamento da API pelas Configuracoes agora pede a senha da instalacao apenas uma vez por operacao e reutiliza o mesmo segredo do cofre.
- O Radar passou a exibir dados locais normalmente quando o cofre da instalacao esta desbloqueado, sem forcar destravamento imediato da API ou abertura do modal de conexao.
- O Kanban passou a criar o registro de lead sob demanda quando um card sai de `Sem status`, corrigindo o drag-and-drop de empresas ainda nao persistidas em `leads`.
- O modal de senha do cofre ficou menor e centralizado, com confirmacao via tecla Enter no proprio dialogo.
- Os dropdowns de filtro do Historico receberam um refinamento visual para melhorar leitura e consistencia.
- O dropdown `Exportar` do Historico passou a abrir ancorado no proprio botao, mantendo a sobreposicao correta sobre a interface sem se deslocar para outro ponto da tela.
- O workspace compartilhado do lead passou a paginar a timeline de atividades com rolagem interna, mantendo o modal estavel mesmo quando o historico cresce.
- O modal compartilhado do lead recebeu superfícies de campo padronizadas e destaques visuais leves para etapa, score e pontos-chave da ficha extraida.
- O modal compartilhado do lead passou a abrir `Detalhes` e `Atividades` em blocos expansíveis fechados por padrão, mantendo `Resumo` mais direto e removendo `Etapa atual` desse bloco.
- Etiquetas e Notas agora seguem o mesmo padrao expansível do modal compartilhado do lead, e o workspace lembra o ultimo estado aberto ou fechado desses blocos enquanto a pagina permanece em uso.
- Historico e Kanban passaram a delegar integralmente para o modal compartilhado do lead, removendo os fallbacks locais que duplicavam a interface e a logica de edicao.
- A area de acompanhamento do modal compartilhado ganhou um resumo compacto de responsavel, proximo passo e ultimo contato, deixando a leitura do topo mais direta antes da edicao.
- O bloco `Detalhes` saiu do modal compartilhado do lead, e a `Categoria` passou a aparecer diretamente no `Resumo` da empresa.
- O README passou a mapear explicitamente `README`, `CHANGELOG`, `SECURITY`, `CONTRIBUTING`, `AGENTS` e `LICENSE` como estrutura publica do repositorio.

### Fixed

- Corrigido o erro de sintaxe introduzido em `SequenceService`, que quebrava a inicializacao do app em algumas execucoes locais.
- Corrigida a ordem de execucao do bloco `tailwind.config` em `index.html`, removendo o erro `tailwind is not defined` do bootstrap inicial.
- Historico e Kanban agora exigem cofre desbloqueado para abrir; acesso direto por URL ou navegação vinda da ajuda redireciona para o Radar quando a sessao nao esta liberada.
- O modal local do Historico agora escapa campos de empresa e notas e valida links de website antes de renderizar HTML.
- A exportacao de PDF passou a escapar os campos dinamicos antes de gerar a pagina imprimivel.
- O `InfoWindow` do mapa passou a escapar texto e validar links `http(s)` e `tel:` antes de inseri-los no balao.
- O fluxo de `Primeiro uso` voltou a liberar a aplicacao logo apos salvar a chave e a senha local, sem depender apenas de recarregar a pagina.
- A validacao da API no onboarding passou a expor mensagens mais especificas quando a chave e recusada por formato, servico ou restricao de referrer.
- Os fluxos de `Primeiro uso`, restore e desbloqueio local agora reiniciam a shell com cache-buster na URL, reduzindo estados travados por scripts antigos em cache.

### Known Limitations

- O aviso do CDN do Tailwind continua esperado enquanto o projeto ainda usar `cdn.tailwindcss.com`; isso nao bloqueia a execucao, mas segue inadequado para distribuicao final.
- O console ainda exibe o aviso de deprecacao de `google.maps.Marker`; a migracao para `google.maps.marker.AdvancedMarkerElement` ainda nao foi concluida em `MapService`.
- Em `file://`, navegadores tratam alguns anchors e navegacoes internas com restricoes extras de origem unica; o fluxo principal do app continua suportado, mas testes de cache e alguns comportamentos de navegacao devem ser validados em `http://localhost`.
- `EmailTemplateService` e `SequenceService` ainda carregam uma trilha legada de cifragem XOR; a migracao completa para AES-GCM continua pendente.

## [1.0.0] - 2026-05-09

### Added

- Base de criptografia local por senha de instalação em `SecurityService` com Web Crypto (`PBKDF2` + `AES-GCM`).
- Novo fluxo de snapshot completo do estado local em `export-import.js`.
- Camada visual premium em `src/css/premium-redesign.css`, com tema dark, destaque `#45D9FF` e microinteracoes para o conceito Places/CRM.
- Painel local de metricas em `src/js/premium-dashboard.js`, lendo apenas dados persistidos ja registrados no manifesto.
- Exportacao de backup seguro criptografado por senha de instalação.
- Vault da API key protegido por senha de instalação com desbloqueio por sessao.
- Auto backup inicial em `IndexedDB`, criptografado por senha de instalação, para ajudar a recuperar o sistema quando o `localStorage` for perdido.
- Restore do ultimo auto backup seguro pela interface principal.
- Documentacao atualizada para arquitetura estatico/local-first, persistencia, backup e roadmap.
- `CHANGELOG.md` inicial para preparacao de futuras releases publicas.

### Changed

- Backup JSON passou a considerar o estado completo registrado no manifesto central de persistencia.
- Troca da API key passou a ser nao destrutiva: a nova chave e validada antes do salvamento e falhas nao limpam o vault nem os dados locais.
- O modal de backup passou a oferecer troca da senha de criptografia com informacao da senha atual e da nova senha, recriptografando o vault da API quando necessario.
- Desbloqueio local e backup seguro agora validam a mesma senha de instalacao por meio de um verificador criptografado persistido no manifesto central.
- Service Worker deixou de usar `cache first` para HTML/CSS/JS do app e passou a priorizar rede, reduzindo mistura de telas antigas com assets novos.
- Tela principal passou a abrir como cockpit operacional de prospeccao, com hero de CRM, radar de empresas, painel de pipeline e resultados em formato de board.
- Paginas de historico e ajuda receberam alinhamento visual ao tema Places/CRM premium.
- Pagina de historico passou a carregar o facade `StorageManager` antes dos servicos de CRM que dependem dele.
- Historico/CRM passou a permitir marcar e desmarcar empresas prospectadas, criando o lead local quando necessario.
- Salvamento de status e notas de lead ficou mais resiliente quando o lead ainda nao existia no armazenamento local.
- Fluxo de backup auto passou a validar a senha de instalacao em vez de induzir criacao de uma nova senha.
- Preferencia de visualizacao e estado de prospeccao passaram a usar o facade central `StorageManager`, reduzindo acessos diretos dispersos.
- LeadManager, histórico de buscas, score de leads, templates e sequências passaram a persistir via `StorageManager` depois da reorganização da ordem de carregamento.
- Rastreamento externo por WA foi removido de `index.html` e `historico.html`; CSP das páginas foi apertada para refletir isso.
- Toasts e banners com conteúdo derivado do usuário passaram a usar montagem de DOM em vez de `innerHTML` direto.
- O filtro de sessões do modal de histórico passou a ser montado com `option` nodes em vez de string HTML concatenada.
- A paginação passou a montar estados vazios e ícones de navegação com nós DOM em vez de HTML direto.
- A visualização principal de lista passou a reutilizar o estado vazio seguro por DOM.
- O modal de detalhes passou a escapar campos de texto e usar URL segura para imagem, website e notas.
- Os cards principais de lista e grade passaram a escapar campos de empresa e a usar URL segura com `rel="noopener noreferrer"`.
- As notas do modal de detalhes passaram a ser renderizadas como nós DOM em vez de string HTML.
- As ações rápidas do modal de detalhes passaram a normalizar os textos usados em WhatsApp e cópia para a área de transferência.
- A confirmação de cópia do modal passou a reutilizar o toast interno do app, em vez de `alert()`.
- A ação de e-mail do modal passou a normalizar o nome da empresa antes de gerar assunto e corpo.
- Alguns controles simples do topo da interface passaram a trocar ícones e textos via nós DOM em vez de `innerHTML`.
- O botão da API key passou a montar seu estado verificado por nós DOM na inicialização.
- O botão de validação da API key passou a alternar seu estado de carregamento com nós DOM em vez de `innerHTML`.
- Modal de backup em `index.html` foi expandido para incluir exportacao segura e operacoes de auto backup.
- Modal da API key passou a destravar e salvar a chave em vault criptografado por PIN, sem mais persistencia direta em texto plano.
- Snapshots agora validam checksum no restore quando Web Crypto esta disponivel, fechando a integridade do fluxo export/import.
- As notificacoes do backup passaram a ser montadas com nós DOM em vez de interpolacao direta de HTML.
- O conteúdo principal do modal de detalhes passou a ser montado com nós DOM, reduzindo a interpolacao de HTML nessa tela.
- Os cards principais de lista e grade passaram a ser montados com nós DOM, reduzindo a interpolacao de HTML na área de resultados.
- O estado vazio compartilhado da área de resultados passou a ser montado com nós DOM e reaproveitado pela visualização ativa.
- As limpezas de container da área de resultados passaram a usar `replaceChildren()`, removendo a última escrita de `innerHTML` no fluxo principal de resultados.
- A lista de sessões do modal de histórico passou a ser montada com nós DOM em vez de string HTML concatenada.
- A visualização por termo do modal de histórico passou a ser montada com nós DOM em vez de string HTML concatenada.
- A lista de empresas do modal de histórico passou a ser montada com nós DOM, incluindo o resumo e os itens exibidos.
- Os botões simples de paginação e os estados da validação da API key passaram a trocar ícones e textos por nós DOM.
- A tela introdutoria passou a bloquear o sistema ate configuracao da API, restauracao de backup ou desbloqueio de uma instalacao existente.
- A tela introdutoria passou a explicar a importancia da senha e o caminho para criar a API no Google Cloud Console.
- A validacao da chave API passou a acontecer antes do salvamento no novo fluxo introdutorio e nos modais existentes.
- README reescrito para refletir o estado real do projeto, limites de seguranca client-side e roadmap em etapas.
- AGENTS atualizado com regras explicitas para persistencia, backup, restore, migracao e contribuicoes futuras.
- O campo da API verificada passou a ser mascarado na interface para evitar exposicao visual da chave.
- Os campos de senha passaram a usar um dialog mascarado reutilizavel, substituindo prompts nativos nos fluxos de API e backup.
- O onboarding passou a destacar com mais enfase quando dados locais existem nesta instalacao.
- O modal de backup passou a alternar os controles de auto backup conforme o estado atual, evitando opcoes redundantes.

### Security

- Geracao de material aleatorio do `SecurityService` passou a priorizar `crypto.getRandomValues()`.
- Backups seguros agora podem ser protegidos por um PIN unico da instalacao com payload autenticado.
- A API key deixou de depender de armazenamento direto em texto plano e passou a usar vault criptografado pelo mesmo PIN unico.
- Auto backups deixam de depender exclusivamente do `localStorage` como unico ponto de recuperacao local.

### Known Limitations

- O PIN unico da instalacao nao e persistido; a automacao continua apenas enquanto a sessao atual estiver destravada.
- Se o navegador limpar todo o armazenamento do site, `localStorage` e `IndexedDB` podem ser perdidos juntos.
- O mesmo PIN da API key tambem precisa ser informado novamente quando a sessao expira ou o navegador e reiniciado.
