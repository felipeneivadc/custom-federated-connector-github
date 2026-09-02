# Configuracao

## GitHub App

Crie uma GitHub App com:

| Campo | Valor |
| --- | --- |
| Nome | `Neiva GitHub Conector` |
| Homepage | URL deste repositorio |
| Callback URL | `https://teams.microsoft.com/api/platform/v1.0/oAuthRedirect` |
| Webhook | Desabilitado |
| Token expiration | Habilitado |
| Installation target | Only on this account |
| Repository access | Only select repositories |

Conceda somente estas permissoes de repositorio:

| Permissao | Nivel |
| --- | --- |
| Contents | Read-only |
| Issues | Read-only |
| Metadata | Read-only |
| Pull requests | Read-only |

Gere client secret apenas quando o Teams Developer Portal estiver aberto e
cole-o diretamente nele. Nao salve client secret, private key ou token neste
repositorio.

## Teams Developer Portal

Em **Tools** > **OAuth client registration**, crie um registro com:

| Campo | Valor |
| --- | --- |
| Registration name | `GitHub Conector OAuth` |
| Base URL | `https://api.githubcopilot.com/mcp/readonly` |
| Restrict usage by organization | My organization only |
| Restrict usage by Teams app | Any Teams app |
| Authorization endpoint | `https://github.com/login/oauth/authorize` |
| Token endpoint | `https://github.com/login/oauth/access_token` |
| Refresh endpoint | `https://github.com/login/oauth/access_token` |
| Scope | Vazio |
| PKCE | Habilitado |
| Client password authentication | Request body parameters |

Use o Client ID e o client secret da GitHub App. Copie o OAuth client
registration ID para o proximo passo, mas nao o versione.

## Microsoft 365 Admin Center

Em **Copilot** > **Connectors** > **Gallery**, crie um conector personalizado
por **Connect to MCP server**:

| Campo | Valor |
| --- | --- |
| Display name | `GitHub Conector` |
| MCP endpoint | `https://api.githubcopilot.com/mcp/readonly` |
| Authentication | OAuth 2.0 |
| Reference ID | OAuth client registration ID do Teams |
| Developer name | `Felipe Neiva` |
| Website | `https://github.com/felipeneivadc/custom-federated-connector-github` |
| Privacy policy | `https://github.com/felipeneivadc/custom-federated-connector-github/blob/main/docs/privacy-policy.md` |
| Terms of use | `https://github.com/felipeneivadc/custom-federated-connector-github/blob/main/docs/terms-of-use.md` |

Clique em **Authorize** e conclua o consentimento GitHub no pop-up. Se o
navegador bloquear a janela, permita pop-ups para `admin.microsoft.com` e
repita a autorizacao.

Use staged rollout para validar com um usuario ou grupo antes de liberar o
conector para toda a organizacao.
