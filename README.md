# GitHub Conector

Configuracao e validacao de um conector federado somente leitura entre Microsoft
365 Copilot e o servidor MCP remoto oficial do GitHub.

O conector usa OAuth 2.0 por usuario com uma GitHub App e chama diretamente:

```text
https://api.githubcopilot.com/mcp/readonly
```

Nenhum servidor, token, client secret ou chave privada e hospedado neste
repositorio.

## Conteudo

- `src/connector-profile.ts`: configuracao tipada e validacao de seguranca.
- `src/mcp-client.ts`: cliente usado somente pelos testes de contrato.
- `test/`: testes unitarios e de contrato para o protocolo MCP.
- `docs/setup.md`: configuracao da GitHub App, OAuth no Teams e conector M365.
- `docs/privacy-policy.md` e `docs/terms-of-use.md`: URLs publicas do conector.

## Comandos

```powershell
npm ci
npm run check
npm run render:registration
```

| Comando | Finalidade |
| --- | --- |
| `npm run check` | Type-check, validacao e testes unitarios. |
| `npm run test:contract` | Valida o contrato MCP com token de teste dedicado. |
| `npm run render:registration` | Mostra os valores administrativos sem segredos. |

Leia [docs/setup.md](docs/setup.md) para reproduzir a configuracao e
[docs/testing.md](docs/testing.md) para a suite de contrato.

## Seguranca

- O endpoint `/readonly` bloqueia ferramentas mutaveis.
- A GitHub App recebe apenas permissoes de leitura para Contents, Issues,
  Metadata e Pull requests.
- PKCE e expiracao de user-to-server tokens ficam habilitados.
- O token de teste deve ser temporario, de leitura e limitado ao repositorio de
  teste.

## Referencias oficiais

- [Microsoft: configurar conectores federados personalizados](https://learn.microsoft.com/en-us/microsoft-365/copilot/connectors/set-up-custom-federated-connectors)
- [Microsoft: autenticao OAuth 2.0 para MCP](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/plugin-authentication-oauth)
- [GitHub MCP Server: servidor remoto e toolsets](https://github.com/github/github-mcp-server/blob/main/docs/remote-server.md)
- [GitHub Apps: user access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)
- [MCP: especificacao de autorizacao](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)
