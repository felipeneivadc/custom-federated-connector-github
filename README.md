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
