# Security Policy

Este projeto e static client-side software. O navegador nao oferece sigilo absoluto; qualquer protecao aqui e reducao de risco, nao garantia de confidencialidade.

## Reporting vulnerabilities

- Use GitHub Security Advisories quando o repositório estiver publico.
- Se nao for possivel, abra uma issue com o minimo de detalhes sensiveis necessario para reproduzir o problema.
- Nunca publique chaves de API, backups, PINs ou dumps completos de storage em canais publicos.

## What to include

- Navegador e versao.
- Se o problema ocorre em `file://` ou em `localhost`.
- Passos para reproduzir.
- Se envolve `localStorage`, `sessionStorage`, `IndexedDB` ou o fluxo de backup/importacao.
- Se a falha afeta a exibicao do cofre da API, o desbloqueio local ou o auto backup.

## Security expectations

- A chave da Google Places API deve ser restrita por `HTTP referrer` no Google Cloud Console.
- O software e fornecido "as is", sem garantias de qualquer tipo, na medida permitida pela lei aplicavel.
- O autor nao assume responsabilidade por perdas, danos ou resultados incorretos produzidos por uso indevido, falhas de ambiente ou saidas imprecisas de recursos de IA.

## Current mitigations

- O cofre da API e os backups seguros usam PIN de instalacao com Web Crypto (`PBKDF2` + `AES-GCM`) quando o navegador oferece suporte.
- `historico.html` e `kanban.html` exigem sessao desbloqueada; acesso direto por URL redireciona para `index.html`.
- `ajuda.html` continua publica por desenho, mas agora declara CSP explicita para reduzir divergencia entre superficies publicas e internas.
- O Historico nao expoe mais o objeto inteiro da empresa em `data-*`; a pagina resolve a ficha por `placeId` em memoria durante a sessao.
- O modal local do Historico, a paginação auxiliar da tela principal, a exportacao de PDF e o `InfoWindow` do mapa escapam texto dinamico e validam links externos antes de inserir HTML.
- O workspace compartilhado do lead tambem escapa textos dinamicos, normaliza URLs externas com `safeUrl` e usa `rel="noopener noreferrer"` nos links abertos em nova aba.
- Links externos da interface devem ficar restritos a `http(s)` e `tel:` quando aplicavel, sempre com `rel="noopener noreferrer"` em novas abas.
- O onboarding de `Primeiro uso` agora conclui a liberacao da sessao no mesmo carregamento quando a chave e aceita, reduzindo risco de bloqueio visual apos o salvamento.
- A validacao da API no onboarding agora preserva o motivo real do erro devolvido pelo Google sempre que possivel, incluindo orientacao melhor para cenarios de referrer bloqueado.
- O bootstrap apos salvar/desbloquear a instalacao agora usa cache-buster na URL e assets locais versionados, reduzindo risco de executar scripts antigos em `file://`.
- O gate de onboarding agora e removido de forma efetiva da camada interativa quando a instalacao e liberada, evitando uma sobreposicao invisivel que bloqueava a operacao da UI principal.
- O fluxo protegido por senha na tela principal deixou de depender do `prompt()` do navegador quando o dialogo local esta disponivel, reduzindo exposicao visual do segredo durante digitacao.
- O guard das paginas internas agora considera a presenca real da sessao destravada da API, evitando falsos bloqueios apos a liberacao do cofre.
- O desbloqueio do cofre local e agora o requisito suficiente para consultar dados ja extraidos. A API continua separada como dependencia apenas para novas extracoes e integracoes conectadas.
- A timeline recente do workspace do lead agora fica paginada e com rolagem interna, evitando crescimento descontrolado do modal e mantendo a leitura local previsivel mesmo com muitos registros.

## Current limitations

- O projeto ainda usa `cdn.tailwindcss.com` e CSP com `unsafe-inline` em partes do runtime; o endurecimento adicional da politica depende de remover configuracoes inline e outras dependencias residuais.
- Embora o `tailwind.config` inline tenha sido removido das paginas principais, o projeto ainda depende do CDN do Tailwind e de outros trechos inline antes de uma CSP mais rigida.
- `MapService` ainda depende de `google.maps.Marker`, que segue com aviso de depreciacao ate a migracao para `AdvancedMarkerElement`.
- `EmailTemplateService` e `SequenceService` ainda usam uma trilha legada de cifragem XOR; a migracao completa para AES-GCM com compatibilidade retroativa ainda esta em andamento.
- Como o produto roda 100% no navegador, qualquer pessoa com controle do ambiente local do usuario ainda pode inspecionar memoria, storage e trafego do browser.
- Query strings de versionamento e `boot=` ajudam contra cache agressivo do navegador, mas nao eliminam completamente as particularidades de cache e origem unica de todos os browsers em `file://`.
