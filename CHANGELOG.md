# Changelog

Todas as mudanças relevantes deste projeto devem ser registradas aqui.

O formato segue a ideia de `Keep a Changelog`, adaptado ao contexto atual do repositório e preparado para futura publicação open source.

## [Unreleased]

### Added

- Primeira base de CRM leve sobre a mesma chave `leads`, com suporte retrocompatível a `tags`, `activities`, `nextActionAt`, `lastContactAt`, `ownerLabel` e `kanbanOrder` em `LeadManager`.
- Processo local de rollback por fase iniciado com pacote de arquivos em `.rollback/` e snapshot local do estado persistido antes da primeira onda de CRM.
- Kanban leve em `historico.html`, com colunas baseadas no status manual do lead e cards com tags e próxima ação.
- Visualização separada de Kanban em `kanban.html`, com drag and drop nativo entre colunas de status.
- Reordenação intra-coluna no Kanban, usando `kanbanOrder` para ajustar a prioridade visual dos cards.
- Modal de detalhes e edição direta do lead dentro do Kanban, com status, tags, notas, responsável e datas de acompanhamento.
- Coluna `Sem status` passou a carregar sob demanda para evitar listas extensas na primeira renderização.
- Hovers nativos de explicação foram adicionados aos principais campos e ações em Radar, Histórico e Kanban.
- `ajuda.html` foi redesenhada como guia operacional, com trilha de aprendizado, orientações de segurança e simulação de custo para 1000 fichas sem fotos.

### Changed

- O menu das páginas principais agora é global e consistente, com configurações centralizadas em um único ponto e rodapé compartilhado com ano dinâmico e versão vinda de `src/js/version.js`.
- O antigo atalho de backup do topo foi convertido em central de configurações no Radar, reunindo API, ajuda, backup, restauração e segurança na mesma tela.
- O site agora exibe um alerta visual quando a API do Google ainda não está configurada ou destravada na sessão atual.
- O fluxo de `Primeiro uso` agora atualiza o alerta de conexão da API imediatamente após salvar a chave, sem exigir recarga manual da página para reconhecer a sessão.
- O dropdown `Exportar` do Histórico agora abre acima dos cards de métricas, permitindo clicar normalmente em CSV, JSON e PDF sem o menu ficar encoberto pela seção de estatísticas.
- O relatório preparado para PDF no Histórico foi redesenhado com identidade azul-escura, resumo executivo, campos do CRM por lead e bloco final com ano, versão, licença e link do repositório.
- O workspace compartilhado do lead agora abre com `Resumo` fechado por padrão, remove o score duplicado dessa seção, move `Ações rápidas` para o fim da coluna direita e força o date picker dos campos de acompanhamento a respeitar o tema escuro.
- O resumo do lead deixou de repetir a ficha do Google, e os indicadores do Histórico passaram a usar badges compactos com fundo suave no padrão visual do restante da interface.
- O painel `AUTO Local` passou a usar destaque azul do tema quando o auto backup está ativo, reduzindo ambiguidade visual no modal de configurações.
- O carregamento da Maps JavaScript API passou a usar `loading=async`, reduzindo o warning de bootstrap síncrono no console.
- O registro do `Service Worker` agora é ignorado em `file://`, evitando erro de runtime fora de `http/https` e deixando claro que cache offline deve ser testado em `localhost`.
- O campo `Onde buscar` foi migrado do widget legado `google.maps.places.Autocomplete` para `Autocomplete Data (Places New)` com lista de sugestões própria, mantendo o estilo nativo do formulário e controle total da UX.
- O autocomplete de localização no Radar agora usa um `input` HTML normal com dropdown customizado, eliminando a borda azul interna do widget e preservando a seleção de lugares em Places API (New).
- Notas adicionadas ao lead agora também podem alimentar a timeline local de atividades sem criar um segundo armazenamento de CRM.
- A onda atual de CRM passa a excluir explicitamente multiusuário, sincronização remota e colaboração em tempo real; esse tema fica adiado para uma discussão futura.
- O onboarding agora exibe a opção de desbloqueio apenas quando existe estado local realmente desbloqueável, ignorando chaves técnicas e configurações padrão gravadas pelo bootstrap.
- O repositório foi preparado para publicação pública em AGPL-3.0, com `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, link de código-fonte na interface e cabeçalhos de copyright/licença nos arquivos de código.
- O `index.html` do Radar voltou a carregar header, onboarding, modal de API e runtime principal por módulos externos, com o bloco inline legado desativado para evitar nova divergência entre HTML e `src/js/app.js`.
- A paginação da lista e da grade foi absorvida por `src/js/app.js`, permitindo remover o patch `pagination-fix.js` da página principal.
- README e Ajuda agora documentam explicitamente o comportamento atual da extração: filtros de website, telefone, avaliação e volume de reviews atuam como pós-filtro local, não como regra nativa da busca, e o Histórico ainda reflete o lote bruto retornado pela API.
- O CRM histórico agora permite mover leads entre colunas de pipeline sem criar persistência paralela ao modelo atual de `leads`.
- A fase 2 de CRM também recebeu rollback local próprio em `.rollback/phase-02-kanban-lite-20260510T1400/`.
- O Histórico voltou a concentrar listagem e filtros, enquanto o Kanban passou a ficar em uma página própria.
- A fase 3 de CRM recebeu rollback local próprio em `.rollback/phase-03-kanban-dragdrop-20260510T1420/`.
- O Kanban agora suporta reordenação dos cards dentro da mesma coluna com persistência local da ordem.
- Textos técnicos e genéricos da interface foram substituídos por copy orientada ao usuário final, com reforço de explicações de contexto e operação.
- O Histórico passou a resolver empresas por `placeId` em memória durante a sessão, em vez de serializar o objeto completo em atributos `data-*` do DOM.
- A paginação auxiliar voltou a usar escape consistente de texto e validação de links/URLs de imagem nas visões de lista e grade.
- `ajuda.html` passou a declarar CSP explícita alinhada ao runtime estático atual, sem deixar de ser uma página pública.
- `index.html`, `historico.html` e `kanban.html` passaram a compartilhar `src/js/tailwind-config.js`, removendo blocos inline repetidos de configuração do Tailwind.
- As páginas principais passaram a carregar assets locais com query string versionada para reduzir cache antigo em execuções por `file://`.
- O onboarding passou a retomar o bootstrap do app no mesmo carregamento após validação, restore e desbloqueio local, com refresh apenas como fallback.
- Corrigido um conflito de CSS em que o gate de onboarding permanecia interceptando cliques mesmo com classe `hidden`, deixando a interface aparentemente liberada, mas sem resposta.
- Corrigido o guard de Histórico e Kanban para aceitar a sessão real da API destravada, restaurando a navegação interna após liberar o cofre.
- A central de Configurações ficou rolável em telas pequenas e o modal de backup deixou de cortar seções inferiores fora da viewport.
- O fluxo protegido por senha na página principal passou a usar diálogo mascarado no lugar do `prompt()` nativo do navegador.
- A atualização ou destravamento da API pelas Configurações agora pede a senha da instalação apenas uma vez por operação e reutiliza o mesmo segredo do cofre.
- O Radar passou a exibir dados locais normalmente quando o cofre da instalação está desbloqueado, sem forçar destravamento imediato da API ou abertura do modal de conexão.
- O Kanban passou a criar o registro de lead sob demanda quando um card sai de `Sem status`, corrigindo o drag-and-drop de empresas ainda não persistidas em `leads`.
- O modal de senha do cofre ficou menor e centralizado, com confirmação via tecla Enter no próprio diálogo.
- Os dropdowns de filtro do Histórico receberam um refinamento visual para melhorar leitura e consistência.
- O dropdown `Exportar` do Histórico passou a abrir ancorado no próprio botão, mantendo a sobreposição correta sobre a interface sem se deslocar para outro ponto da tela.
- O workspace compartilhado do lead passou a paginar a timeline de atividades com rolagem interna, mantendo o modal estável mesmo quando o histórico cresce.
- O modal compartilhado do lead recebeu superfícies de campo padronizadas e destaques visuais leves para etapa, score e pontos-chave da ficha extraída.
- O modal compartilhado do lead passou a abrir `Detalhes` e `Atividades` em blocos expansíveis fechados por padrão, mantendo `Resumo` mais direto e removendo `Etapa atual` desse bloco.
- Etiquetas e Notas agora seguem o mesmo padrão expansível do modal compartilhado do lead, e o workspace lembra o último estado aberto ou fechado desses blocos enquanto a página permanece em uso.
- Histórico e Kanban passaram a delegar integralmente para o modal compartilhado do lead, removendo os fallbacks locais que duplicavam a interface e a lógica de edição.
- A área de acompanhamento do modal compartilhado ganhou um resumo compacto de responsável, próximo passo e último contato, deixando a leitura do topo mais direta antes da edição.
- O bloco `Detalhes` saiu do modal compartilhado do lead, e a `Categoria` passou a aparecer diretamente no `Resumo` da empresa.
- O README passou a mapear explicitamente `README`, `CHANGELOG`, `SECURITY`, `CONTRIBUTING`, `AGENTS` e `LICENSE` como estrutura pública do repositório.

### Fixed

- Corrigido o erro de sintaxe introduzido em `SequenceService`, que quebrava a inicialização do app em algumas execuções locais.
- Corrigida a ordem de execução do bloco `tailwind.config` em `index.html`, removendo o erro `tailwind is not defined` do bootstrap inicial.
- Histórico e Kanban agora exigem cofre desbloqueado para abrir; acesso direto por URL ou navegação vinda da ajuda redireciona para o Radar quando a sessão não está liberada.
- O modal local do Histórico agora escapa campos de empresa e notas e valida links de website antes de renderizar HTML.
- A exportação de PDF passou a escapar os campos dinâmicos antes de gerar a página imprimível.
- O `InfoWindow` do mapa passou a escapar texto e validar links `http(s)` e `tel:` antes de inseri-los no balão.
- O fluxo de `Primeiro uso` voltou a liberar a aplicação logo após salvar a chave e a senha local, sem depender apenas de recarregar a página.
- A validação da API no onboarding passou a expor mensagens mais específicas quando a chave é recusada por formato, serviço ou restrição de referrer.
- Os fluxos de `Primeiro uso`, restore e desbloqueio local agora reiniciam a shell com cache-buster na URL, reduzindo estados travados por scripts antigos em cache.

### Known Limitations

- O aviso do CDN do Tailwind continua esperado enquanto o projeto ainda usar `cdn.tailwindcss.com`; isso não bloqueia a execução, mas segue inadequado para distribuição final.
- O console ainda exibe o aviso de deprecação de `google.maps.Marker`; a migração para `google.maps.marker.AdvancedMarkerElement` ainda não foi concluída em `MapService`.
- Em `file://`, navegadores tratam alguns anchors e navegações internas com restrições extras de origem única; o fluxo principal do app continua suportado, mas testes de cache e alguns comportamentos de navegação devem ser validados em `http://localhost`.
- `EmailTemplateService` e `SequenceService` ainda carregam uma trilha legada de cifragem XOR; a migração completa para AES-GCM continua pendente.

## [1.0.0] - 2026-05-09

### Added

- Base de criptografia local por senha de instalação em `SecurityService` com Web Crypto (`PBKDF2` + `AES-GCM`).
- Novo fluxo de snapshot completo do estado local em `export-import.js`.
- Camada visual premium em `src/css/premium-redesign.css`, com tema dark, destaque `#45D9FF` e microinterações para o conceito Places/CRM.
- Painel local de métricas em `src/js/premium-dashboard.js`, lendo apenas dados persistidos já registrados no manifesto.
- Exportação de backup seguro criptografado por senha de instalação.
- Vault da API key protegido por senha de instalação com desbloqueio por sessão.
- Auto backup inicial em `IndexedDB`, criptografado por senha de instalação, para ajudar a recuperar o sistema quando o `localStorage` for perdido.
- Restore do último auto backup seguro pela interface principal.
- Documentação atualizada para arquitetura estática/local-first, persistência, backup e roadmap.
- `CHANGELOG.md` inicial para preparação de futuras releases públicas.

### Changed

- Backup JSON passou a considerar o estado completo registrado no manifesto central de persistência.
- Troca da API key passou a ser não destrutiva: a nova chave é validada antes do salvamento e falhas não limpam o vault nem os dados locais.
- O modal de backup passou a oferecer troca da senha de criptografia com informação da senha atual e da nova senha, recriptografando o vault da API quando necessário.
- Desbloqueio local e backup seguro agora validam a mesma senha de instalação por meio de um verificador criptografado persistido no manifesto central.
- Service Worker deixou de usar `cache first` para HTML/CSS/JS do app e passou a priorizar rede, reduzindo mistura de telas antigas com assets novos.
- Tela principal passou a abrir como cockpit operacional de prospecção, com hero de CRM, radar de empresas, painel de pipeline e resultados em formato de board.
- Páginas de histórico e ajuda receberam alinhamento visual ao tema Places/CRM premium.
- Página de histórico passou a carregar o facade `StorageManager` antes dos serviços de CRM que dependem dele.
- Histórico/CRM passou a permitir marcar e desmarcar empresas prospectadas, criando o lead local quando necessário.
- Salvamento de status e notas de lead ficou mais resiliente quando o lead ainda não existia no armazenamento local.
- Fluxo de backup auto passou a validar a senha de instalação em vez de induzir criação de uma nova senha.
- Preferência de visualização e estado de prospecção passaram a usar o facade central `StorageManager`, reduzindo acessos diretos dispersos.
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
- Modal de backup em `index.html` foi expandido para incluir exportação segura e operações de auto backup.
- Modal da API key passou a destravar e salvar a chave em vault criptografado por PIN, sem mais persistência direta em texto plano.
- Snapshots agora validam checksum no restore quando Web Crypto está disponível, fechando a integridade do fluxo export/import.
- As notificações do backup passaram a ser montadas com nós DOM em vez de interpolação direta de HTML.
- O conteúdo principal do modal de detalhes passou a ser montado com nós DOM, reduzindo a interpolação de HTML nessa tela.
- Os cards principais de lista e grade passaram a ser montados com nós DOM, reduzindo a interpolação de HTML na área de resultados.
- O estado vazio compartilhado da área de resultados passou a ser montado com nós DOM e reaproveitado pela visualização ativa.
- As limpezas de container da área de resultados passaram a usar `replaceChildren()`, removendo a última escrita de `innerHTML` no fluxo principal de resultados.
- A lista de sessões do modal de histórico passou a ser montada com nós DOM em vez de string HTML concatenada.
- A visualização por termo do modal de histórico passou a ser montada com nós DOM em vez de string HTML concatenada.
- A lista de empresas do modal de histórico passou a ser montada com nós DOM, incluindo o resumo e os itens exibidos.
- Os botões simples de paginação e os estados da validação da API key passaram a trocar ícones e textos por nós DOM.
- A tela introdutória passou a bloquear o sistema até configuração da API, restauração de backup ou desbloqueio de uma instalação existente.
- A tela introdutória passou a explicar a importância da senha e o caminho para criar a API no Google Cloud Console.
- A validação da chave API passou a acontecer antes do salvamento no novo fluxo introdutório e nos modais existentes.
- README reescrito para refletir o estado real do projeto, limites de segurança client-side e roadmap em etapas.
- AGENTS atualizado com regras explícitas para persistência, backup, restore, migração e contribuições futuras.
- O campo da API verificada passou a ser mascarado na interface para evitar exposição visual da chave.
- Os campos de senha passaram a usar um diálogo mascarado reutilizável, substituindo prompts nativos nos fluxos de API e backup.
- O onboarding passou a destacar com mais ênfase quando dados locais existem nesta instalação.
- O modal de backup passou a alternar os controles de auto backup conforme o estado atual, evitando opções redundantes.

### Security

- Geração de material aleatório do `SecurityService` passou a priorizar `crypto.getRandomValues()`.
- Backups seguros agora podem ser protegidos por um PIN único da instalação com payload autenticado.
- A API key deixou de depender de armazenamento direto em texto plano e passou a usar vault criptografado pelo mesmo PIN único.
- Auto backups deixam de depender exclusivamente do `localStorage` como único ponto de recuperação local.

### Known Limitations

- O PIN único da instalação não é persistido; a automação continua apenas enquanto a sessão atual estiver destravada.
- Se o navegador limpar todo o armazenamento do site, `localStorage` e `IndexedDB` podem ser perdidos juntos.
- O mesmo PIN da API key também precisa ser informado novamente quando a sessão expira ou o navegador é reiniciado.
