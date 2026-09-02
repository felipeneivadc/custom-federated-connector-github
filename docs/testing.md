# Testes

```powershell
npm run check
```

Esse comando valida tipos, configuracao e testes unitarios sem rede ou
credenciais.

Para testar o contrato remoto, use um fine-grained token temporario, somente
leitura e limitado ao repositorio de teste:

```powershell
$env:GITHUB_MCP_TEST_TOKEN = "<token temporario>"
npm run test:contract
Remove-Item Env:\GITHUB_MCP_TEST_TOKEN
```

O teste de contrato executa apenas `initialize`, `notifications/initialized` e
`tools/list`. Ele falha se uma ferramenta de leitura obrigatoria ou um schema
protegido mudar, ou se uma ferramenta mutavel for exposta.

Nunca adicione o token a arquivos, variaveis persistentes, issues ou chat.
