# Security Policy

Este projeto é static client-side software. O navegador não oferece sigilo absoluto; qualquer proteção aqui é redução de risco, não garantia de confidencialidade.

## Reporting vulnerabilities

- Use GitHub Security Advisories quando o repositório estiver público.
- Se não for possível, abra uma issue com o mínimo de detalhes sensíveis necessário para reproduzir o problema.
- Nunca publique chaves de API, backups, PINs ou dumps completos de storage em canais públicos.

## What to include

- Navegador e versão.
- Se o problema ocorre em `file://` ou em `localhost`.
- Passos para reproduzir.
- Se envolve `localStorage`, `sessionStorage`, `IndexedDB` ou o fluxo de backup/importação.
- Se a falha afeta a exibição do cofre da API, o desbloqueio local ou o auto backup.

## Security expectations

- A chave da Google Places API deve ser restrita por `HTTP referrer` no Google Cloud Console.
- O software é fornecido "as is", sem garantias de qualquer tipo, na medida permitida pela lei aplicável.
- O autor não assume responsabilidade por perdas, danos ou resultados incorretos produzidos por uso indevido, falhas de ambiente ou saídas imprecisas de recursos de IA.

## Current mitigations

- O cofre da API e os backups seguros usam PIN de instalação com Web Crypto (`PBKDF2` + `AES-GCM`) quando o navegador oferece suporte.
- `historico.html` e `kanban.html` exigem sessão desbloqueada; acesso direto por URL redireciona para `index.html`.
- `ajuda.html` continua pública por desenho, mas agora declara CSP explícita para reduzir divergência entre superfícies públicas e internas.
- O Histórico não expõe mais o objeto inteiro da empresa em `data-*`; a página resolve a ficha por `placeId` em memória durante a sessão.
- O modal local do Histórico, a paginação auxiliar da tela principal, a exportação de PDF e o `InfoWindow` do mapa escapam texto dinâmico e validam links externos antes de inserir HTML.
- O workspace compartilhado do lead também escapa textos dinâmicos, normaliza URLs externas com `safeUrl` e usa `rel="noopener noreferrer"` nos links abertos em nova aba.
- Links externos da interface devem ficar restritos a `http(s)` e `tel:` quando aplicável, sempre com `rel="noopener noreferrer"` em novas abas.
- O onboarding de `Primeiro uso` agora conclui a liberação da sessão no mesmo carregamento quando a chave é aceita, reduzindo risco de bloqueio visual após o salvamento.
- A validação da API no onboarding agora preserva o motivo real do erro devolvido pelo Google sempre que possível, incluindo orientação melhor para cenários de referrer bloqueado.
- O bootstrap após salvar/desbloquear a instalação agora usa cache-buster na URL e assets locais versionados, reduzindo risco de executar scripts antigos em `file://`.
- O gate de onboarding agora é removido de forma efetiva da camada interativa quando a instalação é liberada, evitando uma sobreposição invisível que bloqueava a operação da UI principal.
- O fluxo protegido por senha na tela principal deixou de depender do `prompt()` do navegador quando o diálogo local está disponível, reduzindo exposição visual do segredo durante digitação.
- O guard das páginas internas agora considera a presença real da sessão destravada da API, evitando falsos bloqueios após a liberação do cofre.
- O desbloqueio do cofre local é agora o requisito suficiente para consultar dados já extraídos. A API continua separada como dependência apenas para novas extrações e integrações conectadas.
- A timeline recente do workspace do lead agora fica paginada e com rolagem interna, evitando crescimento descontrolado do modal e mantendo a leitura local previsível mesmo com muitos registros.

## Current limitations

- O projeto ainda usa `cdn.tailwindcss.com` e CSP com `unsafe-inline` em partes do runtime; o endurecimento adicional da política depende de remover configurações inline e outras dependências residuais.
- Embora o `tailwind.config` inline tenha sido removido das páginas principais, o projeto ainda depende do CDN do Tailwind e de outros trechos inline antes de uma CSP mais rígida.
- `MapService` ainda depende de `google.maps.Marker`, que segue com aviso de deprecação até a migração para `AdvancedMarkerElement`.
- `EmailTemplateService` e `SequenceService` ainda usam uma trilha legada de cifragem XOR; a migração completa para AES-GCM com compatibilidade retroativa ainda está em andamento.
- Como o produto roda 100% no navegador, qualquer pessoa com controle do ambiente local do usuário ainda pode inspecionar memória, storage e tráfego do browser.
- Query strings de versionamento e `boot=` ajudam contra cache agressivo do navegador, mas não eliminam completamente as particularidades de cache e origem única de todos os browsers em `file://`.
