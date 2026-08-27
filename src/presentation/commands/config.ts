/**
 * `/config` — administradores personalizam o bot por servidor.
 * As alterações vão para o MySQL e valem imediatamente.
 */
import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { ResolvedGuildSettings } from '../../domain/guild/GuildSettings.js';
import type { AppDependencies } from '../../container.js';
import { AppError, MissingPermissionError, NotInGuildError } from '../../shared/errors.js';
import { errorEmbed, infoEmbed } from '../embeds.js';
import type { Command } from './Command.js';

export const configCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configurações do bot neste servidor.')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) => sub.setName('ver').setDescription('Mostra as configurações atuais.'))
    .addSubcommand((sub) =>
      sub
        .setName('ia')
        .setDescription('Liga ou desliga a IA neste servidor.')
        .addBooleanOption((option) =>
          option.setName('ativado').setDescription('A IA deve responder neste servidor?').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('mencoes')
        .setDescription('Liga ou desliga respostas quando o bot é mencionado.')
        .addBooleanOption((option) =>
          option.setName('ativado').setDescription('Responder a menções?').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('prompt')
        .setDescription('Define o prompt de sistema da IA neste servidor.')
        .addStringOption((option) =>
          option
            .setName('texto')
            .setDescription('Instruções para a IA. Deixe no padrão do .env com /config restaurar.')
            .setRequired(true)
            .setMaxLength(2000),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('modelo')
        .setDescription('Define o modelo de IA deste servidor.')
        .addStringOption((option) =>
          option.setName('nome').setDescription('Ex.: gpt-4o-mini').setRequired(true).setMaxLength(100),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('canal')
        .setDescription('Restringe a IA a um canal. Sem canal, libera todos.')
        .addChannelOption((option) =>
          option
            .setName('destino')
            .setDescription('Canal permitido. Omita para permitir todos.')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('cooldown')
        .setDescription('Intervalo mínimo entre perguntas, em milissegundos.')
        .addIntegerOption((option) =>
          option
            .setName('ms')
            .setDescription('0 desliga o cooldown. Máximo: 60000.')
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(60_000),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('historico')
        .setDescription('Quantas mensagens de contexto a IA guarda por conversa.')
        .addIntegerOption((option) =>
          option.setName('quantidade').setDescription('De 1 a 50.').setRequired(true).setMinValue(1).setMaxValue(50),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName('restaurar').setDescription('Apaga as configurações deste servidor e volta aos padrões globais.'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('ticket-ia')
        .setDescription('Liga ou desliga a IA automática nos canais de ticket.')
        .addBooleanOption((option) =>
          option.setName('ativado').setDescription('A IA deve responder sozinha nos tickets?').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('palavras')
        .setDescription('Lista extra de palavras proibidas neste servidor (além do Detoxify).')
        .addStringOption((option) =>
          option
            .setName('lista')
            .setDescription('Separadas por vírgula. Omita para ver. Envie um espaço para limpar.')
            .setMaxLength(1500),
        ),
    )
    .addSubcommandGroup((group) =>
      group
        .setName('contexto')
        .setDescription('Blocos extras anexados ao prompt da IA (regras, FAQ, tom…).')
        .addSubcommand((sub) =>
          sub
            .setName('adicionar')
            .setDescription('Adiciona um bloco de contexto. Mesmo título atualiza o texto.')
            .addStringOption((option) =>
              option.setName('titulo').setDescription('Nome curto deste bloco.').setRequired(true).setMaxLength(80),
            )
            .addStringOption((option) =>
              option
                .setName('texto')
                .setDescription('Conteúdo que a IA deve considerar.')
                .setRequired(true)
                .setMaxLength(1500),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName('remover')
            .setDescription('Remove um bloco pelo ID (/config contexto listar).')
            .addIntegerOption((option) =>
              option.setName('id').setDescription('ID do contexto.').setRequired(true).setMinValue(1),
            ),
        )
        .addSubcommand((sub) =>
          sub.setName('listar').setDescription('Lista os blocos extras deste servidor.'),
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction, deps: AppDependencies) {
    const guildId = interaction.guildId;

    if (!guildId) {
      await interaction.reply({ embeds: [errorEmbed(new NotInGuildError().userMessage)], ephemeral: true });
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({
        embeds: [errorEmbed(new MissingPermissionError().userMessage)],
        ephemeral: true,
      });
      return;
    }

    const group = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand();

    try {
      if (group === 'contexto') {
        await handleContexto(interaction, guildId, deps, subcommand);
        return;
      }

      if (subcommand === 'ver') {
        const settings = await deps.getGuildSettings.execute(guildId);
        await interaction.reply({ embeds: [settingsEmbed(settings)], ephemeral: true });
        return;
      }

      if (subcommand === 'palavras') {
        const lista = interaction.options.getString('lista');
        if (lista === null) {
          const settings = await deps.getGuildSettings.execute(guildId);
          await interaction.reply({
            embeds: [infoEmbed('Palavras proibidas', formatBlockedWords(settings.blockedWords))],
            ephemeral: true,
          });
          return;
        }

        const updated = await deps.updateGuildSettings.execute(guildId, {
          blockedWords: lista.trim().length === 0 ? null : lista.trim(),
        });
        await interaction.reply({
          embeds: [infoEmbed('Palavras atualizadas', formatBlockedWords(updated.blockedWords))],
          ephemeral: true,
        });
        return;
      }

      if (subcommand === 'restaurar') {
        await deps.resetGuildSettings.execute(guildId);
        const settings = await deps.getGuildSettings.execute(guildId);
        await interaction.reply({
          embeds: [infoEmbed('Configurações restauradas', 'Este servidor voltou aos padrões globais. Os contextos extras do prompt também foram apagados.')],
          ephemeral: true,
        });
        await interaction.followUp({ embeds: [settingsEmbed(settings)], ephemeral: true });
        return;
      }

      const updated = await applySubcommand(interaction, guildId, deps, subcommand);
      await interaction.reply({
        embeds: [infoEmbed('Configuração salva', 'A alteração já vale neste servidor.')],
        ephemeral: true,
      });
      await interaction.followUp({ embeds: [settingsEmbed(updated)], ephemeral: true });
    } catch (error) {
      const message = error instanceof AppError ? error.userMessage : 'Não consegui salvar a configuração.';
      deps.logger.error('Falha no comando /config', {
        error: error instanceof Error ? error.message : String(error),
        group,
        subcommand,
      });

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed(message)], ephemeral: true });
        return;
      }

      await interaction.reply({ embeds: [errorEmbed(message)], ephemeral: true });
    }
  },
};

async function applySubcommand(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  deps: AppDependencies,
  subcommand: string,
): Promise<ResolvedGuildSettings> {
  switch (subcommand) {
    case 'ia':
      return deps.updateGuildSettings.execute(guildId, {
        aiEnabled: interaction.options.getBoolean('ativado', true),
      });
    case 'mencoes':
      return deps.updateGuildSettings.execute(guildId, {
        mentionEnabled: interaction.options.getBoolean('ativado', true),
      });
    case 'prompt': {
      const texto = interaction.options.getString('texto', true).trim();
      if (texto.length === 0) {
        throw new AppError('Prompt vazio', 'O prompt não pode ser vazio.');
      }
      return deps.updateGuildSettings.execute(guildId, { systemPrompt: texto });
    }
    case 'modelo': {
      const nome = interaction.options.getString('nome', true).trim();
      if (nome.length === 0) {
        throw new AppError('Modelo vazio', 'Informe o nome do modelo.');
      }
      return deps.updateGuildSettings.execute(guildId, { model: nome });
    }
    case 'canal': {
      const channel = interaction.options.getChannel('destino');
      return deps.updateGuildSettings.execute(guildId, {
        allowedChannelId: channel?.id ?? null,
      });
    }
    case 'cooldown':
      return deps.updateGuildSettings.execute(guildId, {
        cooldownMs: interaction.options.getInteger('ms', true),
      });
    case 'historico':
      return deps.updateGuildSettings.execute(guildId, {
        maxHistoryMessages: interaction.options.getInteger('quantidade', true),
      });
    case 'ticket-ia':
      return deps.updateGuildSettings.execute(guildId, {
        ticketAiEnabled: interaction.options.getBoolean('ativado', true),
      });
    default:
      throw new Error(`Subcomando desconhecido: ${subcommand}`);
  }
}

async function handleContexto(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  deps: AppDependencies,
  subcommand: string,
): Promise<void> {
  if (subcommand === 'listar') {
    const settings = await deps.getGuildSettings.execute(guildId);
    await interaction.reply({
      embeds: [infoEmbed('Contextos do prompt', formatPromptContexts(settings.promptContexts))],
      ephemeral: true,
    });
    return;
  }

  if (subcommand === 'adicionar') {
    const titulo = interaction.options.getString('titulo', true);
    const texto = interaction.options.getString('texto', true);
    const result = await deps.addPromptContext.execute({ guildId, title: titulo, content: texto });
    const verb = result.updated ? 'atualizado' : 'adicionado';
    await interaction.reply({
      embeds: [
        infoEmbed(
          `Contexto ${verb}`,
          `**#${result.context.id} · ${result.context.title}**\nA IA já considera este bloco no prompt (chat e tickets).`,
        ),
      ],
      ephemeral: true,
    });
    return;
  }

  if (subcommand === 'remover') {
    const id = interaction.options.getInteger('id', true);
    const removed = await deps.removePromptContext.execute(id, guildId);
    await interaction.reply({
      embeds: [infoEmbed('Contexto removido', `**#${removed.id} · ${removed.title}** não entra mais no prompt.`)],
      ephemeral: true,
    });
    return;
  }

  throw new Error(`Subcomando de contexto desconhecido: ${subcommand}`);
}

function settingsEmbed(settings: ResolvedGuildSettings) {
  const promptPreview =
    settings.systemPrompt.length > 400 ? `${settings.systemPrompt.slice(0, 397)}...` : settings.systemPrompt;
  const contextTitles =
    settings.promptContexts.length === 0
      ? 'nenhum'
      : settings.promptContexts.map((item) => `#${item.id} ${item.title}`).join(', ');

  const description = [
    `**IA:** ${onOff(settings.aiEnabled)}`,
    `**Menções:** ${onOff(settings.mentionEnabled)}`,
    `**IA nos tickets:** ${onOff(settings.ticketAiEnabled)}`,
    `**Palavras proibidas (servidor):** ${settings.blockedWords.length} termo(s)`,
    `**Contextos extras:** ${settings.promptContexts.length} — ${contextTitles}`,
    `**Modelo:** \`${settings.model}\`${settings.usingDefaultModel ? ' *(padrão global)*' : ''}`,
    `**Canal:** ${settings.allowedChannelId ? `<#${settings.allowedChannelId}>` : 'todos'}`,
    `**Cooldown:** ${settings.cooldownMs}ms${settings.usingDefaultCooldown ? ' *(padrão global)*' : ''}`,
    `**Histórico:** ${settings.maxHistoryMessages} mensagens${settings.usingDefaultHistory ? ' *(padrão global)*' : ''}`,
    `**Prompt:**${settings.usingDefaultPrompt ? ' *(padrão global)*' : ''}`,
    promptPreview,
  ].join('\n');

  return infoEmbed('Configurações do servidor', description);
}

function onOff(value: boolean): string {
  return value ? 'ligada' : 'desligada';
}

function formatBlockedWords(words: string[]): string {
  if (words.length === 0) {
    return 'Nenhuma palavra extra neste servidor. Ainda valem a lista global (`BLOCKED_WORDS`) e o Detoxify.';
  }

  return words.map((word) => `\`${word}\``).join(', ');
}

function formatPromptContexts(contexts: ResolvedGuildSettings['promptContexts']): string {
  if (contexts.length === 0) {
    return 'Nenhum contexto extra. Use `/config contexto adicionar` para anexar regras, FAQ ou tom ao prompt, sem substituir o `/config prompt`.';
  }

  return contexts
    .map((item) => {
      const preview = item.content.length > 180 ? `${item.content.slice(0, 177)}...` : item.content;
      return `**#${item.id} · ${item.title}**\n${preview}`;
    })
    .join('\n\n');
}
