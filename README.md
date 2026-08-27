# Discord Bot IA

Bot de Discord com inteligência artificial, escrito em TypeScript. O código segue Clean Architecture: regras de negócio não conhecem Discord.js nem a API da OpenAI.

Você pode perguntar via slash command (`/ask`) ou mencionando o bot em qualquer canal.

## Funcionalidades

- `/ask` — pergunta à IA, com histórico por usuário e canal
- Menção (`@bot sua pergunta`) — mesmo fluxo, sem slash command
- `/reset` — apaga o contexto da conversa neste canal
- `/ping` — latência da API e do WebSocket
- `/help` — instruções de uso
- `/config` — configurações persistidas **por servidor** (prompt, modelo, canal, cooldown…)
- `/ticket` — sistema de tickets configurado pelo **dono do bot** (sala, opção, categoria)
- Compatível com qualquer API no formato Chat Completions (OpenAI, Groq, OpenRouter, Ollama)
- Cooldown por usuário para evitar spam
- Mensagens longas são fatiadas no limite de 2000 caracteres do Discord
- MySQL para guardar as configurações de cada servidor (sobrevive a restarts)

## Pré-requisitos

- Node.js 20 ou superior
- MySQL 5.7 ou 8 (XAMPP, WAMP, Docker, servidor remoto)
- Uma aplicação no [Discord Developer Portal](https://discord.com/developers/applications)
- Uma chave de API de um provedor de IA (OpenAI ou compatível)

## Configuração no Discord

1. Crie uma aplicação em **Applications**.
2. Em **Bot**, crie o bot e copie o token.
3. Ative os Privileged Gateway Intents:
   - **Message Content Intent** (obrigatório para responder a menções)
4. Em **OAuth2 → URL Generator**, marque:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Send Messages`, `Read Message History`, `Embed Links`, `Use Slash Commands`, `Manage Channels`, `Manage Messages`
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
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=discord_bot_ia
# BOT_OWNER_ID=seu_discord_user_id   # opcional; se vazio, usa o dono da aplicação no Discord
```

O bot cria o database `MYSQL_DATABASE` e as tabelas na primeira subida, se ainda não existirem. O servidor MySQL precisa estar rodando e o usuário precisa de permissão para criar database (ou crie o schema antes).

## Filtro de conteúdo (Detoxify)

O Detoxify é um modelo Python. Ele avalia toxicidade (incluindo português, via modelo **multilingual**) e o bot bloqueia:

- a mensagem atual **antes** de ir para a IA
- o **contexto da conversa** (histórico recente + mensagem nova), para pegar intenção tóxica espalhada em várias falas
- a resposta da IA **depois**, se ela vier imprópria

Palavras da lista só olham a mensagem atual; o histórico é avaliado só pelo Detoxify. Se o contexto for bloqueado, o histórico da conversa é apagado — use `/reset` e reformule.

Em um terminal:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r moderation/requirements.txt
npm run moderation
```

A primeira execução baixa os pesos do modelo (pode demorar). Deixe esse processo rodando e suba o bot em outro terminal com `npm run dev`.

Listas de palavras:

- Global: `BLOCKED_WORDS=termo1,termo2` no `.env`
- Por servidor: `/config palavras lista: ofensa1, ofensa2`

`DETOXIFY_THRESHOLD` (padrão `0.7`) é o score mínimo da mensagem isolada. `DETOXIFY_CONTEXT_THRESHOLD` (padrão `0.6`) vale para o transcript — um pouco mais baixo porque o texto maior dilui o score. `DETOXIFY_CONTEXT_MESSAGES` (padrão `10`) limita quantas falas entram nesse transcript. Se o serviço Python estiver fora, o bot só usa a lista de palavras — a menos que `DETOXIFY_FAIL_CLOSED=true`.

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
| `/help`   | Explica como usar o bot                                |
| `/config` | Configurações deste servidor (quem tem Gerenciar Servidor) |
| `/ticket` | Tickets: o dono do bot cadastra opções; usuários abrem pelo menu |

O histórico de conversa é por **usuário + canal** e fica em memória. Reiniciar o processo zera as conversas, mas **não** apaga as configurações do servidor.

### `/ticket`

Só o **dono do bot** (dono da aplicação no Discord, ou `BOT_OWNER_ID` no `.env`) cadastra as opções. Cada opção guarda três coisas: sala do painel, nome no menu e categoria onde o canal será criado.

| Subcomando | Quem usa | Efeito |
|---|---|---|
| `/ticket adicionar` | Dono do bot | Cadastra opção (`sala`, `opcao`, `categoria`) e atualiza o menu |
| `/ticket remover` | Dono do bot | Remove pelo ID (`/ticket listar`) |
| `/ticket listar` | Dono do bot | Lista opções deste servidor |
| `/ticket painel` | Dono do bot | Republica o menu na sala |
| `/ticket fechar` | Quem abriu / moderador | Fecha o ticket do canal atual |
| `/ticket instrucao` | Dono do bot | Vê ou define o texto extra da IA daquela opção |

O membro escolhe a opção no menu da sala. O bot cria um canal privado na categoria daquela opção. **A IA responde sozinha** quem abriu o ticket, usando:

1. o prompt e o modelo do servidor (`/config`)
2. o tipo da opção (Suporte, Denúncia, etc.)
3. instruções extras da opção, se existirem (`/ticket adicionar instrucao:` ou `/ticket instrucao`)

A equipe pode falar no canal sem disparar a IA; o texto entra no contexto. Se a equipe mencionar o bot, ele responde. `/config ticket-ia` liga ou desliga esse modo. `/ask` e `/reset` no canal do ticket usam o mesmo histórico.

### `/config` (por servidor)

Quem tem a permissão **Gerenciar Servidor** pode personalizar o bot. Tudo é gravado no MySQL (tabela `guild_settings`).

| Subcomando        | Efeito                                              |
|-------------------|-----------------------------------------------------|
| `/config ver`     | Mostra a configuração efetiva                       |
| `/config ia`      | Liga/desliga a IA                                   |
| `/config mencoes` | Liga/desliga respostas a `@bot`                     |
| `/config prompt`  | Prompt de sistema                                   |
| `/config modelo`  | Modelo (ex.: `gpt-4o-mini`)                         |
| `/config canal`   | Restringe a IA a um canal; sem canal, libera todos  |
| `/config cooldown`| Intervalo mínimo entre perguntas (ms)               |
| `/config historico` | Tamanho do contexto por conversa                  |
| `/config ticket-ia` | Liga/desliga a IA automática nos tickets       |
| `/config palavras` | Palavras proibidas extras deste servidor         |
| `/config restaurar` | Volta aos padrões globais do `.env`               |

Campos não personalizados herdam `SYSTEM_PROMPT`, `OPENAI_MODEL`, `USER_COOLDOWN_MS` e `MAX_HISTORY_MESSAGES` do `.env`. Se o bot sair do servidor, a linha correspondente é apagada.

## Arquitetura

A estrutura está descrita em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Resumo:

```
src/
  domain/           Contratos (IA, histórico, configurações de servidor)
  application/      Casos de uso (perguntar, resetar, config)
  infrastructure/   OpenAI, MySQL, memória, cliente Discord
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
