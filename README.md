# LeadRadar

Aplicação web estática para prospecção de empresas com Google Places API, evoluindo para um CRM local-first sem backend.

## Demonstração Online

Quer testar a ferramenta online antes de usar localmente? Acesse a versão estática no GitHub Pages pela URL de demonstração abaixo:

[https://vitorgfaustino.github.io/lead-radar/](https://vitorgfaustino.github.io/lead-radar/)

Este projeto não envia nem guarda dados em servidor próprio. Tudo roda apenas no navegador de quem acessa a página, com armazenamento local para histórico, leads, backups e preferências. Isso significa que a demonstração é estática: ela serve para testar a interface e o fluxo, mas os dados ficam no navegador do visitante e podem ser exportados/importados conforme os recursos da aplicação.

Versão atual: 1.0.0 (definida em `src/js/version.js`)

Licença: GNU AGPL-3.0. Uso comercial permitido. Se você modificar e distribuir este projeto, ou disponibilizar uma versão modificada por rede, deve oferecer o código-fonte correspondente sob os termos da AGPL-3.0.

## Documentos Públicos do Repositório

Para manter o projeto pronto para publicação e manutenção aberta no GitHub, o repositório preserva estes documentos como fontes de verdade complementares:

- `README.md`: comportamento atual do produto, arquitetura estática, fluxos principais e limitações conhecidas.
- `CHANGELOG.md`: histórico das mudanças relevantes para releases futuras.
- `SECURITY.md`: expectativas, mitigações atuais e limites reais de segurança do modelo client-side.
- `CONTRIBUTING.md`: política de contribuições e suporte do LeadRadar, com orientações para Issues e manutenção da linha oficial do projeto.
- `AGENTS.md`: restrições técnicas obrigatórias para IA e manutenção do projeto.
- `LICENSE`: termos da GNU AGPL-3.0 aplicáveis ao código e à redistribuição.

## Visão Geral

## Contribuições e Suporte

Este repositório está público para estudo, uso como referência e adaptação conforme a licença do projeto, mas não aceita Pull Requests externos neste momento.

Essa decisão existe para preservar a visão autoral, manter consistência técnica e concentrar a manutenção em um fluxo único.

Se você encontrar um bug, tiver uma dúvida ou quiser sugerir uma melhoria, abra uma Issue. Issues são o canal oficial e bem-vindo para feedback, suporte e relato de problemas.

Pull Requests abertos por terceiros podem ser fechados automaticamente com uma mensagem explicativa.

O LeadRadar roda inteiramente no navegador. O projeto foi desenhado para funcionar abrindo o arquivo `index.html` diretamente ou por um servidor estático simples em `localhost`, sem `npm`, sem build step e sem infraestrutura externa própria.

O bootstrap do LeadRadar agora fica centralizado em `src/js/app.js` e nos módulos carregados por `index.html`. A página principal deve permanecer como casca estática de layout, modais e marcadores de DOM, evitando reintroduzir grandes blocos de runtime inline que dupliquem a lógica dos módulos.

O foco atual do produto é:

- Buscar empresas por termo e localização.
- Salvar histórico, leads, notas, scores, templates e sequências localmente.
- Exportar e restaurar snapshots completos em JSON.
- Oferecer backup seguro com senha de instalação.
- Preparar a base para um CRM estático, local-first e sempre exportável/importável.

Ao abrir o sistema pela primeira vez, uma tela introdutória bloqueia o acesso até que a chave da API seja informada ou um backup anterior seja restaurado.

Se o navegador já possuir dados locais salvos, a mesma tela passa a oferecer um desbloqueio por senha para reabrir a instalação sem obrigar uma nova configuração da API.

Essa opção só aparece quando o navegador realmente possui estado local desbloqueável vinculado à instalação, como vault da API ou dados locais protegidos pelo verificador da senha. Chaves técnicas, preferências padrão e metadados operacionais isolados não devem liberar esse caminho. Em um navegador limpo, ela não é exibida e não libera o sistema por PIN sozinho.

A chave da API continua sendo solicitada apenas quando o usuário estiver em um primeiro uso ou quando for necessário voltar a executar buscas no Google Places.

A mesma tela também aparece quando a sessão da chave expira, para manter o acesso bloqueado até que a senha seja informada novamente.

Histórico e Kanban permanecem bloqueados até o cofre ser desbloqueado. Se o usuário tentar abrir essas páginas por URL direta ou navegar até elas pela ajuda, o sistema redireciona de volta para o Radar.

Para reduzir mistura visual entre versões antigas e novas, o `Service Worker` agora prioriza rede para HTML, CSS e JavaScript da própria aplicação, usando cache apenas como apoio para imagens locais.

Nos fluxos mais recentes, a interface também passou a reforçar segurança visual e clareza operacional:

- A API verificada não expõe mais a chave completa na tela.
- As senhas passam por um diálogo mascarado reutilizável, inclusive com confirmação quando necessário.
- A mesma senha de instalação segue sendo a base para API, desbloqueio local e backup seguro.
- O estado de dados locais encontrados agora ganha destaque visual no onboarding.
- O menu de backup alterna entre ativar e desativar o auto backup conforme o estado atual.

## Regra de Ouro

Este projeto é estritamente estático.

- Sem backend.
- Sem banco de dados externo obrigatório.
- Sem bundlers ou build step.
- Sem dependência de Node.js para executar.
- Tudo precisa continuar funcional em arquivo local ou `localhost`.

Qualquer evolução deve preservar isso.

## Estado Atual

Recursos já disponíveis:

- Busca avançada por localização e termo usando Google Places API.
- Campo `Onde buscar` com `Autocomplete Data (Places New)` em um `input` nativo, permitindo padrão visual próprio e fallback para digitação manual + geocoding quando não houver seleção.
- Visualização em lista e grade.
- A lista e a grade agora paginam localmente dentro do runtime principal, sem depender de patch script separado.
- Histórico de buscas e empresas encontradas.
- Gestão local de leads, notas e status.
- Score de leads.
- Templates de e-mail e sequências de contato.
- Exportação e restauração de snapshot JSON completo.
- Backup seguro criptografado por senha de instalação.
- Vault da API key criptografado por senha de instalação, com desbloqueio de sessão.
- A visualização de API verificada mostra a chave mascarada, evitando exposição acidental na interface.
- Fluxo de desbloqueio local por senha quando a instalação já possui dados persistidos.
- O desbloqueio local por PIN só é liberado quando houver vault da API ou dados locais vinculados ao verificador da instalação; persistências técnicas e padrões locais não contam como instalação desbloqueável.
- Auto backup local em `IndexedDB`, criptografado por senha, para recuperar o sistema caso o `localStorage` seja perdido.
- `Service Worker` com estratégia de rede prioritária para arquivos críticos da UI, reduzindo telas misturadas por cache antigo.
- Modal de backup com rótulos consolidados para `Backup > Manual > Exporte seu Backup` e `Backup > AUTO Local > Snapshot local`.
- Os campos de senha nas telas de onboarding, backup e API agora usam entrada mascarada para evitar exibição do segredo enquanto o usuário digita.
- Interface principal redesenhada como cockpit dark de Places/CRM, com destaque visual em `#45D9FF`, cards de métricas locais, radar de empresas, filtros de qualificação e workspace de lead.
- `index.html` voltou a carregar o LeadRadar pelo runtime modular (`src/js/app.js`, serviços e patches externos), mantendo o onboarding, a central de configurações e a busca principal fora de blocos inline gigantes.
- Histórico e Kanban só podem ser abertos com o cofre desbloqueado; acessos diretos por URL redirecionam para o Radar.
- `ajuda.html` permanece pública, mas agora segue a mesma base de CSP estática das páginas principais.
- O Histórico deixou de expor o objeto completo da empresa em atributos do DOM e passou a resolver a ficha por `placeId` em memória durante a sessão.
- As renderizações do Histórico, da paginação auxiliar, do PDF e do `InfoWindow` do mapa agora escapam texto dinâmico e validam links externos antes de inseri-los no HTML.
- O fluxo de `Primeiro uso` agora avança no mesmo carregamento depois de salvar a chave e a senha local, sem depender apenas de `reload()` para liberar a interface.
- As páginas principais passaram a compartilhar `src/js/tailwind-config.js`, removendo os blocos inline duplicados de configuração do Tailwind.
- O bootstrap após `Primeiro uso`, restauração e desbloqueio local agora usa reinício com cache-buster na URL para reduzir travamentos por assets antigos em `file://`.
- As páginas principais passaram a carregar assets locais versionados com `?v=1.0.0`, reduzindo o risco de scripts e estilos desatualizados ficarem presos em cache do navegador.
- O onboarding agora retoma o bootstrap da aplicação imediatamente após validação bem-sucedida, sem depender apenas da navegação de refresh.
- O overlay de onboarding agora desaparece de fato ao ser ocultado, evitando que uma camada invisível continue bloqueando cliques na interface principal.
- Histórico e Kanban agora reconhecem corretamente a sessão desbloqueada quando a API já foi liberada no navegador, sem rejeitar a navegação por esperar um valor fixo diferente do vault real em sessão.
- A central de Configurações passou a rolar corretamente em telas pequenas, evitando corte das seções inferiores do modal.
- O fluxo de senha da instalação na tela principal agora usa diálogo mascarado em vez de `prompt()` do navegador, ocultando a digitação ao destravar API, backup e ações protegidas.
- Ao abrir a API pelas Configurações, a senha da instalação agora é solicitada uma única vez por operação e continua sendo a mesma senha do cofre e do vault da API.
- O desbloqueio do cofre local agora libera a consulta do Radar, Histórico e Kanban mesmo sem API ativa na sessão. A API continua obrigatória apenas para novas extrações e recursos conectados.
- Cards do Kanban em `Sem status` agora podem ser movidos normalmente para outras colunas, mesmo quando o lead ainda não possuía registro persistido em `leads`.
- O modal de senha do cofre foi reduzido e centralizado, e a tecla Enter confirma a senha diretamente no diálogo.
- Os filtros dropdown do Histórico receberam acabamento visual para ficar mais legíveis e consistentes com o restante da interface.
- O menu `Exportar` do Histórico agora abre ancorado no próprio botão, no mesmo ponto da ação, com sobreposição correta sobre a interface; os filtros também ganharam setas visíveis para reforçar que são dropdowns, e o relatório preparado para PDF passou a incluir campos do CRM e os metadados visíveis do produto.
- O workspace compartilhado do lead agora pagina a timeline de atividades com rolagem interna, sem deixar o modal crescer indefinidamente, padroniza melhor as superfícies dos campos, chips de score e destaques da ficha extraída, organiza Resumo, Etiquetas, Notas e Atividades em blocos expansíveis, inicia com `Resumo` fechado por padrão, move `Ações rápidas` para o fim da coluna direita, mostra um resumo compacto de acompanhamento e serve como fluxo único de detalhes no Radar, Histórico e Kanban.

## Comportamento Atual da Extração e da API

O projeto hoje mistura dois caminhos modernos do ecossistema Google Maps/Places:

- a busca principal de empresas e os detalhes usam `places.googleapis.com/v1`, isto é, Places API (New)
- o campo `Onde buscar` do Radar agora usa `Autocomplete Data`, também alinhado a Places API (New)
- o carregamento da Maps JavaScript API ainda usa script direto com `callback`, mas agora com `loading=async`

Na prática, isso significa que a camada mais crítica da busca já saiu do legado. O warning estrutural que ainda resta no console do Google está ligado ao uso de `google.maps.Marker` no mapa de resultados e não mais ao autocomplete de localização.

Hoje o fluxo de extração funciona em duas etapas separadas:

1. A busca envia para a Google Places API apenas o termo, a localização, o raio e a quantidade máxima pedida.
2. Depois que o lote bruto volta, a interface aplica filtros locais para exibir um subconjunto na tela.

Na implementação atual:

- `com website`, `sem website`, `com telefone`, `4+ estrelas` e `50+ avaliações` funcionam como pós-filtro local.
- esses filtros não entram como regra nativa da requisição enviada para a Google Places API.
- por isso, eles não reduzem diretamente a quantidade de chamadas da busca inicial.
- o comportamento atual do Histórico ainda grava o lote bruto retornado pela busca antes desses filtros locais de qualificação.
- na prática, pedir `10 empresas sem website` pode mostrar menos correspondências na tela, mas a sessão salva ainda pode conter empresas fora desse critério.

O único ajuste operacional relacionado à mídia é o chip de fotos, que altera a preparação do resultado para exibir foto quando ela vier disponível no retorno. Ainda assim, a busca continua baseada no mesmo termo, localização, raio e limite informado.

Limitação importante atual:

- os filtros de qualificação ajudam a triagem visual do lote retornado, mas hoje não funcionam como garantia estrita do que entra no Histórico.
- por isso, a documentação da Ajuda e da interface deve ser lida como comportamento atual do produto, não como promessa de filtro duro na coleta.

Observações operacionais recentes:

- ao abrir a aplicação por `file://`, o `Service Worker` é desativado de propósito; use `http://localhost` para validar cache offline
- o aviso do CDN do Tailwind ainda é esperado enquanto a migração para CSS local/estático não for feita
- navegadores podem aplicar restrições extras de origem única em alguns anchors ou navegações internas quando a página roda em `file://`
- o hardening atual prioriza reduzir XSS e exposição de dados no browser antes de qualquer migração ampla de Tailwind ou CSP mais rígida
- a validação da chave continua sendo remota; quando a API for recusada, a UI agora mostra mensagens mais próximas do erro real devolvido pelo Google Places
- se o navegador insistir em exibir uma versão antiga em `file://`, o projeto agora tenta furar esse cache com query string de boot e versionamento dos assets locais

## Onda CRM Atual

A implementação em andamento prioriza um CRM leve, local-first e de baixo impacto técnico.

Nesta primeira onda:

- o mesmo objeto `leads` passa a concentrar a base de CRM leve
- os campos novos entram com compatibilidade retroativa
- a primeira UI-alvo será o CRM em `historico.html`
- o pipeline inicial reaproveita os status atuais do lead
- o histórico fica dedicado a listagem e filtros, enquanto o Kanban ganhou uma página própria
- multiusuário, sincronização remota e colaboração em tempo real ficam fora do escopo por enquanto

Campos adicionados na base do lead para esta onda:

- `tags`
- `activities`
- `nextActionAt`
- `lastContactAt`
- `ownerLabel`
- `kanbanOrder`

Esses campos continuam dentro da mesma chave persistida `leads`, sem criar um segundo modelo paralelo de CRM nesta etapa.

Entrega atual desta onda no CRM:

- modal do lead com notas, tags, próxima ação e timeline local de atividades
- workspace compartilhado do lead com campos visuais padronizados, destaque suave por etapa/score, timeline recente paginada, resumo compacto de acompanhamento, seções expansíveis para Resumo, Etiquetas, Notas e Atividades, `Resumo` fechado por padrão, ações rápidas no fim da coluna direita e abertura unificada de detalhes entre Radar, Histórico e Kanban
- board kanban leve em `kanban.html`
- modal de detalhes e edição direta do lead dentro do Kanban
- movimentação de cards por drag and drop nativo entre colunas e por botões de estágio
- carregamento sob demanda para a coluna `Sem status`, para evitar listas extensas de uma vez
- reordenação dos cards dentro da mesma coluna, persistida em `kanbanOrder`
- lista tradicional mantida em `historico.html` como fallback e leitura detalhada do mesmo conjunto filtrado
- textos principais revisados em Radar, Histórico e Kanban com linguagem mais direta para o usuário
- explicações por hover nativo nos principais campos, filtros e ações operacionais
- `ajuda.html` redesenhada como guia de aprendizado, com passo a passo de uso, leitura do score e simulação de custo para 1000 fichas sem fotos

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

Leituras e gravações de preferência de visualização, status de prospecção e dos principais módulos de CRM passaram a usar um facade central em `StorageManager`, para reduzir acessos diretos espalhados pelos scripts.

Módulos persistidos atualmente:

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

O manifesto de persistência está centralizado em src/js/export-import.js.

## Segurança e Privacidade

### Limite real do modelo client-side

Como o projeto não tem backend, não existe segredo inviolável no navegador. A segurança aqui é de redução de risco, não de sigilo absoluto.

### API key do Google

- A chave deve ser restrita por `HTTP referrer` no Google Cloud Console.
- A chave agora é persistida em vault criptografado com o PIN único da instalação e Web Crypto.
- O desbloqueio da chave ocorre por sessão no navegador; ao reiniciar, o mesmo PIN único precisa ser informado novamente.
- A troca da chave API não apaga leads, histórico ou backups; o sistema valida a nova chave e regrava apenas o vault da API quando a validação passa.
- Se a instalação já estiver destravada, a troca reutiliza o PIN da sessão atual para manter a mesma proteção criptográfica.
- O mesmo PIN único agora também é validado por um verificador criptografado da instalação, usado para desbloqueio local e para os fluxos de backup seguro.
- Nunca assuma que uma chave guardada no navegador está protegida contra um ambiente comprometido.

### Primeira abertura

Na tela introdutória, você pode escolher entre:

- `Novo uso`: informar a API, criar um PIN e começar do zero.
- `Restaurar backup`: carregar um snapshot anterior e destravar a instalação com o mesmo PIN único.
- `Desbloquear instalação`: usar o PIN único de uma instalação local já configurada.

O PIN único protege a API e os backups locais. Ele é necessário para recuperar a instalação depois e deve ter pelo menos 4 caracteres. Para gerar a API, acesse a página de credenciais do Google Cloud em [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials), crie a chave, restrinja por `HTTP referrer` e habilite as APIs usadas pelo projeto.

Se você restaurar um backup que contenha a chave da API, a tela introdutória vai pedir o mesmo PIN único para liberar o sistema imediatamente.

Regra importante de migração entre cofres:

- No fluxo atual de backup seguro, o PIN do arquivo exportado precisa coincidir com a senha da instalação que vai receber a importação.
- Se o backup foi exportado com `1234` e a instalação de destino usa `4321`, a restauração segura não conclui diretamente por esse fluxo.
- Quando os cofres usam senhas diferentes, alinhe a senha antes: troque a senha do cofre de origem antes de exportar ou troque a senha do cofre de destino antes de importar.

### Backup seguro por PIN único

O projeto agora possui uma base de criptografia local com:

- `PBKDF2` para derivação do PIN único da instalação.
- `AES-GCM` para criptografia autenticada.
- `salt` e `iv` aleatórios via Web Crypto.

Implementação-base em [src/js/services/SecurityService.js](src/js/services/SecurityService.js).

### Auto backup local

O auto backup foi iniciado com a seguinte estratégia:

- Os snapshots automáticos são gravados em `IndexedDB`, não no `localStorage`.
- O payload é criptografado pelo mesmo PIN único da instalação.
- Isso permite restaurar o sistema se o `localStorage` for perdido, desde que o `IndexedDB` da origem ainda exista.
- O navegador controla fisicamente onde o `IndexedDB` fica salvo no computador. Por segurança, uma aplicação web estática não pode escolher uma pasta arbitrária para salvar backups automáticos sem ação explícita do usuário.
- Para escolher um local no computador, use a exportação manual de backup JSON ou backup seguro e selecione a pasta no download do navegador.

Limite importante:

- Se o navegador limpar todo o armazenamento do site, `localStorage` e `IndexedDB` podem ser perdidos juntos.
- Por isso o fluxo recomendado continua incluindo exportação manual de backup seguro em arquivo JSON.

### Privacidade

Direção do projeto:

- Reduzir CSP permissiva ao mínimo necessário.
- Minimizar `innerHTML` com dados dinâmicos.
- Remover logs sensíveis de produção.

## Backup e Restauração

O modal de backup da página principal agora diferencia três fluxos:

1. `Exportar Backup`
   Gera um snapshot JSON completo do estado atual.

2. `Exportar Backup Seguro`
   Gera um snapshot JSON criptografado por PIN.

   Importante: na restauração segura, o PIN desse arquivo precisa ser o mesmo PIN da instalação que vai receber a importação. Se origem e destino estiverem com senhas diferentes, ajuste uma delas antes da migração.

3. `Ativar Auto Backup Seguro`
   Cria snapshots automáticos criptografados em `IndexedDB` para ajudar na recuperação se o `localStorage` for perdido.

4. `Restaurar Último Auto Backup`
   Restaura o snapshot automático mais recente usando o PIN correto.

5. `Alterar senha de criptografia`
   Permite informar a senha atual e definir uma nova senha para recriptografar o vault da API e atualizar a instalação.

Observações importantes:

- A senha não é persistida. A automação continua apenas enquanto a senha estiver liberada na sessão atual.
- O auto backup atual é um primeiro passo. A evolução prevista inclui retomar a automação após desbloqueio da sessão e ampliar observabilidade de saúde do backup.
- A API key também usa o mesmo princípio: vault persistente criptografado, chave destravada apenas na sessão atual.
- Snapshots exportados passam a registrar checksum quando Web Crypto estiver disponível, e a importação valida essa integridade antes de sobrescrever dados locais.

## Política de Rollback Local

Antes de cada fase relevante de evolução do CRM:

- gerar um pacote local dos arquivos tocados em `.rollback/`
- gerar um snapshot local do estado persistido atual
- manter nomeação por fase para facilitar reversão de código e dados

Exemplo atual:

- `.rollback/phase-01-crm-foundation-20260510T1335/`
- `.rollback/phase-02-kanban-lite-20260510T1400/`
- `.rollback/phase-03-kanban-dragdrop-20260510T1420/`

Esse processo não substitui o backup do usuário. Ele existe para rollback técnico durante manutenção e evolução do produto.

## Observação Sobre Resultado Exibido X Resultado Salvo

Enquanto o fluxo atual permanecer assim, existe uma diferença entre o que a tela pode mostrar depois dos filtros locais e o que a sessão original da busca pode registrar no Histórico.

- Resultado exibido: subconjunto filtrado localmente sobre o lote retornado.
- Resultado salvo no Histórico: lote bruto retornado pela busca atual.

Isso explica por que alguns filtros aparentam "não valer como regra" da extração, mesmo quando ajudam a leitura imediata na tela.

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

1. Baixe ou clone o repositório.
2. Abra `index.html` em um navegador moderno ou rode via servidor estático simples.
3. Configure a chave da Google Places API.
4. Execute buscas por termo e localização.
5. Salve leads, notas e acompanhe o histórico.
6. Gere backups JSON regulares.
7. Se quiser maior resiliência local, ative o auto backup seguro e use uma senha.

## Compatibilidade

Requisitos mínimos:

- Navegador moderno com suporte a ES6+.
- `localStorage` habilitado.
- `IndexedDB` para auto backup local resiliente.
- `Web Crypto API` para backup seguro por PIN único.

Se `IndexedDB` ou `Web Crypto` não estiverem disponíveis, o app continua operando, mas recursos de backup seguro e auto backup ficam limitados.

## Roadmap em Etapas

### Etapa 1 — Documentação, contrato de segurança e superfície pública

- Alinhar README, AGENTS e ajuda.
- Remover analytics externo por padrão.
- Formalizar modelo de segurança realista para app client-side.

### Etapa 2 — Registro central de persistência

- Consolidar manifest de dados locais.
- Eliminar acessos diretos espalhados ao `localStorage`.
- Versionar schemas e preparar migrações.

### Etapa 3 — Vault da API key

- Persistência da chave com PIN único obrigatório.
- Web Crypto como base.
- Estado destravado apenas na sessão atual.

### Etapa 4 — Snapshot completo e restauração robusta

- Backup versionado com checksum.
- Importação com validação e rollback.
- Compatibilidade com snapshots legados.

### Etapa 5 — Auto backup resiliente

- Snapshot criptografado em `IndexedDB`.
- Rotação de snapshots.
- Restore do último backup automático.
- Evolução futura para experiência de destravamento por sessão mais clara.

### Etapa 6 — Hardening de privacidade e integridade

- Reduzir `unsafe-inline`.
- Revisar pontos com `innerHTML`.
- Remover logs sensíveis.

### Etapa 7 — Modelo CRM local-first

- Empresa, contatos, tags, atividades, pipeline e próxima ação.
- Tudo exportável/importável em JSON.
- Multiusuário continua fora do escopo desta etapa inicial.

### Etapa 8 — Interface CRM

- Pipeline/Kanban.
- Workspace do lead.
- Timeline de follow-up.
- Gestão de tags.
- Lista e kanban devem coexistir enquanto o pipeline ainda for progressivo.
- Histórico e Kanban devem seguir separados, com o histórico priorizando listagem/filtros e o Kanban priorizando operação visual.
- O Kanban pode reorganizar prioridade dentro da coluna sem alterar o status do lead.
- Sem colaboração em tempo real nesta onda.

### Etapa 9 — Relatórios e publicação futura

- Dashboard local.
- Changelog estruturado.
- Preparação para futura abertura do projeto.

## Desenvolvimento

Antes de mudar o projeto, leia [AGENTS.md](AGENTS.md).

Diretrizes principais:

- Tudo novo deve continuar estático.
- Todo dado persistido novo deve nascer exportável/importável.
- Mudanças de storage exigem cuidado com migração e restore.
- Evite prometer segurança maior do que a arquitetura realmente pode entregar.

## Licença e uso

Este projeto é distribuído sob a GNU Affero General Public License v3.0 (AGPL-3.0).

- Uso comercial é permitido.
- Qualquer versão modificada distribuída ou oferecida por rede precisa disponibilizar o código-fonte correspondente sob AGPL-3.0.
- O software é entregue "como está", sem garantias de qualquer tipo, na medida permitida pela lei aplicável.
- O autor não assume responsabilidade por danos, perdas ou resultados imprecisos produzidos por saídas de IA ou por uso incorreto do sistema.
- O link de código-fonte público deve permanecer visível no rodapé da interface.
