# Discord Bot IA

Bot de Discord com inteligência artificial, escrito em TypeScript. O código segue Clean Architecture: regras de negócio não conhecem Discord.js nem a API da OpenAI.

Você pode perguntar via slash command (`/ask`) ou mencionando o bot em qualquer canal.

## Funcionalidades

- `/ask` — pergunta à IA, com histórico por usuário e canal
- Menção (`@bot sua pergunta`) — mesmo fluxo, sem slash command
- `/reset` — apaga o contexto da conversa neste canal
- `/ping` — latência da API e do WebSocket
- `/help` — instruções de uso
- Compatível com qualquer API no formato Chat Completions (OpenAI, Groq, OpenRouter, Ollama)
- Cooldown por usuário para evitar spam
- Mensagens longas são fatiadas no limite de 2000 caracteres do Discord

## Pré-requisitos

- Node.js 20 ou superior
- Uma aplicação no [Discord Developer Portal](https://discord.com/developers/applications)
- Uma chave de API de um provedor de IA (OpenAI ou compatível)

## Configuração no Discord

1. Crie uma aplicação em **Applications**.
2. Em **Bot**, crie o bot e copie o token.
3. Ative os Privileged Gateway Intents:
   - **Message Content Intent** (obrigatório para responder a menções)
4. Em **OAuth2 → URL Generator**, marque:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Send Messages`, `Read Message History`, `Embed Links`, `Use Slash Commands`
5. Abra a URL gerada e convide o bot para o servidor.
6. Copie o **Application ID** (General Information) e, se quiser registro instantâneo de comandos, o **ID do servidor** (modo desenvolvedor no Discord → clique direito no servidor → Copiar ID).

## Instalação

```bash
npm install
cp .env.example .env
```

No Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

Preencha o `.env`:

```env
DISCORD_TOKEN=seu_token
DISCORD_CLIENT_ID=id_da_aplicacao
DISCORD_GUILD_ID=id_do_servidor          # opcional, mas recomendado em desenvolvimento
OPENAI_API_KEY=sua_chave
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

### Outros provedores

| Provedor   | `OPENAI_BASE_URL`                         | Exemplo de modelo        |
|------------|-------------------------------------------|--------------------------|
| OpenAI     | `https://api.openai.com/v1`               | `gpt-4o-mini`            |
| Groq       | `https://api.groq.com/openai/v1`          | `llama-3.3-70b-versatile`|
| OpenRouter | `https://openrouter.ai/api/v1`            | `openai/gpt-4o-mini`     |
| Ollama     | `http://localhost:11434/v1`               | `llama3.2`               |

## Como rodar

Desenvolvimento (recarrega ao salvar):

```bash
npm run dev
```

Produção:

```bash
npm run build
npm start
```

Os slash commands são registrados na inicialização. Com `DISCORD_GUILD_ID`, aparecem na hora. Sem ele, o Discord pode levar até uma hora para sincronizar comandos globais.

## Comandos

| Comando  | Descrição                                              |
|----------|--------------------------------------------------------|
| `/ask`   | Envia uma pergunta à IA                                |
| `/reset` | Limpa o histórico da sua conversa no canal atual       |
| `/ping`  | Mostra latência                                        |
| `/help`  | Explica como usar o bot                                |

O histórico é por **usuário + canal** e fica em memória. Reiniciar o processo zera as conversas.

## Arquitetura

A estrutura está descrita em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Resumo:

```
src/
  domain/           Contratos (IA, histórico) — sem Discord, sem HTTP
  application/      Casos de uso (perguntar, resetar)
  infrastructure/   OpenAI, memória, cliente Discord
  presentation/     Comandos, eventos, embeds
  config/           Variáveis de ambiente
  shared/           Logger, erros, cooldown
  app.ts            Composition root (liga tudo)
  index.ts          Ponto de entrada
```

## Como adicionar um comando

1. Crie um arquivo em `src/presentation/commands/` implementando a interface `Command`.
2. Exporte-o no array de `src/presentation/commands/registry.ts`.
3. Reinicie o bot para republicar os slash commands.

## Como trocar o provedor de IA

Implemente `AiProvider` (`src/domain/ai/AiProvider.ts`) e substitua `OpenAiCompatibleProvider` em `src/app.ts`. Nada em `application/` ou `presentation/` precisa mudar.

## Scripts

| Script            | Função                          |
|-------------------|---------------------------------|
| `npm run dev`     | Sobe com hot reload (`tsx`)     |
| `npm run build`   | Compila para `dist/`            |
| `npm start`       | Executa o build                 |
| `npm run typecheck` | Verifica tipos sem emitir JS  |

## Licença

MIT
