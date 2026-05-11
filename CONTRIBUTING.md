# Contribuindo

Obrigado pelo interesse neste projeto.

Este repositório está em modo de colaboração somente leitura + feedback.

Isso significa:

- Issues são bem-vindas para bugs, dúvidas e sugestões.
- Pull Requests externos não são aceitos no momento.
- PRs enviados por terceiros podem ser fechados automaticamente ou permanecer sem revisão.

O objetivo dessa política é preservar a visão autoral do projeto, manter a evolução técnica centralizada e evitar divergência de direção em um repositório que também funciona como portfólio.

## Como ajudar de forma útil

Se você quiser colaborar, use Issues.

Os melhores relatos costumam incluir:

- um título claro e direto
- contexto do problema
- passos para reproduzir
- comportamento esperado
- comportamento atual
- ambiente utilizado, como navegador, sistema operacional e modo local ou deploy
- logs, prints ou trechos de resposta relevantes

Nunca inclua segredos, tokens, `API_KEY`, valores reais de `TEAM_DOMAIN`, `POLICY_AUD` ou qualquer credencial em uma Issue.

## O que pode virar Issue

- bug reproduzível
- dúvida de uso ou configuração
- sugestão de melhoria
- problema de documentação
- problema de experiência do admin

## Antes de abrir uma Issue

- verifique se o problema já não foi relatado
- confirme se você removeu dados sensíveis do texto
- revise a documentação em `README.md` e `docs/`

## Resumo da política deste repositório

- Código: sem aceitação de PRs externos no momento
- Feedback: Issues abertas e incentivadas
- Segurança: nunca publicar segredos
- Uso próprio: faça no seu fork, respeitando a licença

---

Versão 1.0.0
Criado por Vitor Faustino - vitorfaustino.com.br

## Contributing

Este projeto é licenciado sob AGPL-3.0. Ao contribuir, você concorda que suas mudanças podem ser distribuídas sob os mesmos termos.

## Regras do projeto

- O sistema precisa continuar 100% estático e client-side only.
- Não adicione backend, pipeline de build obrigatório, dependências de servidor ou qualquer requisito que impeça abrir `index.html` diretamente.
- Preserve exportação e importação em JSON para qualquer dado persistido novo.
- Sempre atualize a documentação quando a mudança afetar persistência, segurança, backup, restore, navegador suportado ou comportamento visível ao usuário.
- Mantenha o cabeçalho AGPL de copyright e disclaimer no topo dos arquivos de código-fonte.

## Como contribuir

1. Faça um fork ou branch de trabalho.
2. Edite o código preservando a estrutura estaticamente executável.
3. Valide em `file://` e em um servidor estático simples em `localhost`.
4. Verifique se a alteração não quebra exportação, importação, backup seguro ou auto backup.
5. Atualize README, CHANGELOG e demais docs afetados.

## Padrão de revisão

- Mantenha mudanças pequenas e focadas.
- Prefira APIs nativas do navegador.
- Evite segredos no código-fonte e mantenha a chave da API restrita por `HTTP referrer` no Google Cloud Console.
- Se alterar dados persistidos, confirme compatibilidade retroativa ou migração segura.

## Uso comercial

O uso comercial é permitido sob AGPL-3.0. Se você distribuir uma versão modificada ou a oferecer para uso por rede, precisa disponibilizar o código-fonte correspondente sob os termos da AGPL.
