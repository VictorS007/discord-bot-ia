# Arquitetura

O bot segue **Clean Architecture**: as regras de negócio não dependem de Discord.js, HTTP ou de um provedor de IA específico. Dependências apontam sempre para dentro.

```
presentation  →  application  →  domain
                      ↑
                infrastructure
```

`src/app.ts` é o **composition root**: o único arquivo que instancia classes concretas e injeta as interfaces.

## Camadas

### `domain/`

Contratos estáveis.

- `AiProvider` — “dado um histórico e um modelo, devolva a próxima resposta”
- `ConversationStore` — persistência do histórico
- `conversationId()` — chave estável `canal:usuário`
- `GuildSettings` / `GuildSettingsRepository` — configuração por servidor Discord
- `TicketOption` / `Ticket` / painel — opções de ticket, canais abertos e message ID do menu

Nada nesta pasta importa `discord.js`, `fetch` ou variáveis de ambiente.

### `application/`

Casos de uso orquestram o domínio.

- `AskAiUseCase` — anexa a pergunta ao histórico, chama a IA, grava a resposta
- `ResetConversationUseCase` — apaga o histórico de uma chave
- `GetGuildSettingsUseCase` — mescla a linha do banco com os defaults do `.env`
- `UpdateGuildSettingsUseCase` / `ResetGuildSettingsUseCase` — patch ou restore
- Casos de uso de ticket — cadastrar opção, abrir, fechar, limpar ao sair do servidor

Eles recebem interfaces no construtor. Não sabem se a IA é OpenAI ou se o histórico está em um `Map`.

### `infrastructure/`

Adaptadores para o mundo externo.

| Classe                       | Implementa            | Detalhe                                      |
|------------------------------|-----------------------|----------------------------------------------|
| `OpenAiCompatibleProvider`   | `AiProvider`          | HTTP Chat Completions                        |
| `InMemoryConversationStore`  | `ConversationStore`   | `Map` em processo                            |
| `MysqlGuildSettingsRepository` | `GuildSettingsRepository` | MySQL (`guild_settings`)                 |
| `MysqlTicketOptionRepository`  | `TicketOptionRepository`  | MySQL (`ticket_options`)                 |
| `MysqlTicketRepository`        | `TicketRepository`        | MySQL (`tickets`)                        |
| `MysqlTicketPanelRepository`   | `TicketPanelRepository`   | MySQL (`ticket_panels`)                  |
| `createDiscordClient`        | —                     | Intents e client do discord.js               |
| `registerSlashCommands`      | —                     | Publica comandos na API do Discord           |

O pool MySQL é aberto em `openMysql.ts`. O bot cria o database (se o usuário tiver permissão) e aplica as migrations em `infrastructure/database/migrate.ts`.

### `presentation/`

Tudo que fala a língua do Discord: slash commands, eventos, embeds.

Handlers recebem `AppDependencies` — nunca criam casos de uso. Isso permite testar um comando com um `AskAiUseCase` falso.

Fluxo de uma pergunta:

```
usuário → /ask ou menção
       → presentation (cooldown, defer, split de mensagem)
       → AskAiUseCase
       → ConversationStore + AiProvider
       → resposta no canal
```

### `config/` e `shared/`

- `env.ts` valida o `.env` com Zod na subida do processo
- `Logger`, `AppError`, `Cooldown`, `splitMessage` são utilitários transversais

## Decisões

1. **Sem SDK da OpenAI** — `fetch` nativo cobre qualquer API compatível e reduz dependências.
2. **Histórico de conversa em memória** — simples e previsível. Reiniciar o bot zera o contexto; configurações de servidor **não**.
3. **Configuração por guild no MySQL** — pool `mysql2`, tabela `guild_settings`. Campos `null` herdam o `.env`.
4. **Cooldown por usuário** — a janela vem das settings do servidor.
5. **Slash commands no `ready`** — evita um script separado de deploy. Guild commands para desenvolvimento rápido; globais quando `DISCORD_GUILD_ID` estiver vazio.
6. **TypeScript `strict` + `noUncheckedIndexedAccess`** — falhas de tipo aparecem no compile, não em runtime no Discord.

## Estender

- **Novo comando:** arquivo em `presentation/commands/` + entrada em `registry.ts`.
- **Novo evento:** função em `presentation/events/` + `client.on(...)` em `app.ts`.
- **Novo provedor de IA:** classe que implementa `AiProvider`, substituída em `app.ts`.
- **Persistência de conversas:** classe que implementa `ConversationStore`, substituída em `app.ts`.
