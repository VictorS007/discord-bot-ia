/**
 * `/ticket` — dono do bot configura opções; qualquer um abre pelo painel.
 *
 * Cada opção guarda: ID da sala (painel), nome no menu e ID da categoria
 * onde o canal do ticket será criado.
 */
import {
  ChannelType,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type GuildTextBasedChannel,
} from 'discord.js';
import type { AppDependencies } from '../../container.js';
import { AppError, NotInGuildError } from '../../shared/errors.js';
import { assertBotOwner } from '../botOwner.js';
import { errorEmbed, infoEmbed } from '../embeds.js';
import type { Command } from './Command.js';
import { closeCurrentTicket } from '../tickets/closeCurrentTicket.js';
import { syncTicketPanel } from '../tickets/syncPanel.js';

export const ticketCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Sistema de tickets (configuração só pelo dono do bot).')
    .setDMPermission(false)
    .addSubcommand((sub) =>
      sub
        .setName('adicionar')
        .setDescription('Dono do bot: adiciona uma opção no painel de tickets.')
        .addChannelOption((option) =>
          option
            .setName('sala')
            .setDescription('Canal onde o menu de tickets vai aparecer.')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('opcao')
            .setDescription('Nome que aparece no menu (ex.: Suporte, Denúncia).')
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(100),
        )
        .addChannelOption((option) =>
          option
            .setName('categoria')
            .setDescription('Categoria onde o canal do ticket será criado.')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('instrucao')
            .setDescription('Instruções extras da IA para este tipo de ticket (opcional).')
            .setRequired(false)
            .setMaxLength(2000),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('remover')
        .setDescription('Dono do bot: remove uma opção pelo ID (veja /ticket listar).')
        .addIntegerOption((option) =>
          option.setName('id').setDescription('ID da opção.').setRequired(true).setMinValue(1),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName('listar').setDescription('Dono do bot: lista as opções cadastradas neste servidor.'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('painel')
        .setDescription('Dono do bot: republica o menu de tickets no canal.')
        .addChannelOption((option) =>
          option
            .setName('sala')
            .setDescription('Canal do painel.')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('instrucao')
        .setDescription('Dono do bot: define ou consulta as instruções de IA da opção.')
        .addIntegerOption((option) =>
          option.setName('id').setDescription('ID da opção (/ticket listar).').setRequired(true).setMinValue(1),
        )
        .addStringOption((option) =>
          option
            .setName('texto')
            .setDescription('Nova instrução. Omita para só ver. Envie um espaço para limpar.')
            .setMaxLength(2000),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName('fechar').setDescription('Fecha o ticket deste canal.'),
    ),

  async execute(interaction: ChatInputCommandInteraction, deps: AppDependencies) {
    const guildId = interaction.guildId;

    if (!guildId || !interaction.guild) {
      await interaction.reply({ embeds: [errorEmbed(new NotInGuildError().userMessage)], ephemeral: true });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === 'fechar') {
        await closeCurrentTicket(interaction, deps);
        return;
      }

      await assertBotOwner(interaction.client, interaction.user.id, deps.env.BOT_OWNER_ID);

      if (subcommand === 'adicionar') {
        const sala = interaction.options.getChannel('sala', true);
        const categoria = interaction.options.getChannel('categoria', true);
        const label = interaction.options.getString('opcao', true);

        const created = await deps.addTicketOption.execute({
          guildId,
          panelChannelId: sala.id,
          label,
          categoryId: categoria.id,
          aiInstructions: interaction.options.getString('instrucao')?.trim() || null,
        });

        await refreshPanel(interaction, deps, sala.id);
        await interaction.reply({
          embeds: [
            infoEmbed(
              'Opção de ticket adicionada',
              [
                `**ID:** \`${created.id}\``,
                `**Opção:** ${created.label}`,
                `**Sala do painel:** <#${created.panelChannelId}>`,
                `**Categoria dos tickets:** <#${created.categoryId}>`,
                created.aiInstructions
                  ? `**Instrução de IA:** ${created.aiInstructions.slice(0, 300)}`
                  : '**Instrução de IA:** usa o prompt do servidor',
              ].join('\n'),
            ),
          ],
          ephemeral: true,
        });
        return;
      }

      if (subcommand === 'remover') {
        const id = interaction.options.getInteger('id', true);
        const removed = await deps.removeTicketOption.execute(id, guildId);
        await refreshPanel(interaction, deps, removed.panelChannelId);
        await interaction.reply({
          embeds: [infoEmbed('Opção removida', `A opção **${removed.label}** (ID \`${removed.id}\`) foi apagada.`)],
          ephemeral: true,
        });
        return;
      }

      if (subcommand === 'listar') {
        const options = await deps.listTicketOptions.execute(guildId);

        if (options.length === 0) {
          await interaction.reply({
            embeds: [
              infoEmbed(
                'Tickets',
                'Nenhuma opção cadastrada. Use `/ticket adicionar` com a sala, o nome da opção e a categoria.',
              ),
            ],
            ephemeral: true,
          });
          return;
        }

        const lines = options.map((option) => {
          const ia = option.aiInstructions ? 'IA custom' : 'IA do servidor';
          return `\`${option.id}\` · **${option.label}** · ${ia} · painel <#${option.panelChannelId}> · categoria <#${option.categoryId}>`;
        });

        await interaction.reply({
          embeds: [infoEmbed('Opções de ticket', lines.join('\n'))],
          ephemeral: true,
        });
        return;
      }

      if (subcommand === 'instrucao') {
        const id = interaction.options.getInteger('id', true);
        const texto = interaction.options.getString('texto');

        if (texto === null) {
          const options = await deps.listTicketOptions.execute(guildId);
          const option = options.find((item) => item.id === id);
          if (!option) {
            throw new AppError('Opção de ticket inexistente', 'Não achei essa opção neste servidor.');
          }

          await interaction.reply({
            embeds: [
              infoEmbed(
                `Instrução de IA · ${option.label}`,
                option.aiInstructions ?? 'Nenhuma instrução extra. A IA usa o prompt do servidor + o tipo da opção.',
              ),
            ],
            ephemeral: true,
          });
          return;
        }

        const updated = await deps.updateTicketOptionInstructions.execute(
          id,
          guildId,
          texto.trim().length === 0 ? null : texto.trim(),
        );

        await interaction.reply({
          embeds: [
            infoEmbed(
              'Instrução atualizada',
              updated.aiInstructions
                ? `A opção **${updated.label}** agora tem instrução própria de IA.`
                : `A opção **${updated.label}** voltou a usar só o prompt do servidor.`,
            ),
          ],
          ephemeral: true,
        });
        return;
      }

      if (subcommand === 'painel') {
        const sala = interaction.options.getChannel('sala', true);
        await refreshPanel(interaction, deps, sala.id);
        await interaction.reply({
          embeds: [infoEmbed('Painel atualizado', `Menu republicado em <#${sala.id}>.`)],
          ephemeral: true,
        });
      }
    } catch (error) {
      const message = error instanceof AppError ? error.userMessage : 'Não consegui executar o comando de ticket.';
      deps.logger.error('Falha no comando /ticket', {
        error: error instanceof Error ? error.message : String(error),
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

async function refreshPanel(
  interaction: ChatInputCommandInteraction,
  deps: AppDependencies,
  panelChannelId: string,
): Promise<void> {
  const channel = await interaction.guild?.channels.fetch(panelChannelId);
  if (!channel?.isTextBased() || channel.isDMBased()) {
    throw new AppError('Canal do painel inválido', 'Não consegui acessar a sala do painel para atualizar o menu.');
  }

  const ticketOptions = await deps.listTicketOptions.execute(interaction.guildId ?? '', panelChannelId);
  await syncTicketPanel({
    channel: channel as GuildTextBasedChannel,
    guildId: interaction.guildId ?? '',
    ticketOptions,
    panels: deps.ticketPanels,
  });
}
