# Politica de privacidade

## Escopo

O GitHub Conector permite que o Microsoft 365 Copilot consulte dados de leitura
do GitHub autorizados pelo usuario e pela GitHub App instalada.

## Dados processados

Consultas podem incluir identidade GitHub, nomes de repositorios, arquivos,
issues, pull requests, comentarios e metadados que o usuario ja pode acessar.
O conjunto exato depende das permissoes do usuario e da instalacao da GitHub
App.

## Armazenamento e compartilhamento

Este projeto e um kit estatico de configuracao e nao opera banco de dados,
backend proprio ou armazenamento de tokens. O Microsoft 365 Copilot e o GitHub
processam autenticacao e chamadas ao servidor MCP segundo suas politicas e
configuracoes aplicaveis.

## Seguranca

A integracao usa OAuth 2.0 com PKCE, tokens por usuario e permissoes de leitura
em um repositorio selecionado. Operacoes de escrita sao excluidas pela rota MCP
somente leitura.

## Alteracoes

Alteracoes relevantes nesta politica devem ser revisadas, publicadas neste
documento e comunicadas aos usuarios conforme as obrigacoes aplicaveis.

> Este e um documento operacional inicial e deve receber revisao juridica antes
> da disponibilizacao do conector fora do grupo piloto.
