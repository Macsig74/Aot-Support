const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require('discord.js');
const { ORANGE, TICKET_TYPES } = require('../config');
const storage = require('../utils/storage');
const { log } = require('../utils/logger');

function buildClosedButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_transcript').setLabel('Transcript').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('ticket_reopen').setLabel('Réouvrir').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('ticket_delete').setLabel('Supprimer').setStyle(ButtonStyle.Danger),
  );
}

async function handleTicketButton(interaction) {
  const typeKey = interaction.customId.replace('ticket_open_', '');
  const ticketType = TICKET_TYPES[typeKey];
  if (!ticketType) return;

  const modal = new ModalBuilder()
    .setCustomId(`modal_ticket_${typeKey}`)
    .setTitle(ticketType.label);

  const rows = ticketType.fields.map(field => {
    const input = new TextInputBuilder()
      .setCustomId(field.customId)
      .setLabel(field.label)
      .setStyle(field.style === 1 ? TextInputStyle.Short : TextInputStyle.Paragraph)
      .setRequired(field.required);
    if (field.placeholder) input.setPlaceholder(field.placeholder);
    return new ActionRowBuilder().addComponents(input);
  });

  modal.addComponents(...rows);
  await interaction.showModal(modal);
}

async function handleTicketModalSubmit(interaction) {
  const typeKey = interaction.customId.replace('modal_ticket_', '');
  const ticketType = TICKET_TYPES[typeKey];
  if (!ticketType) return;

  await interaction.deferReply({ ephemeral: true });

  const config = storage.get(interaction.guildId);

  if (!config.highStaffCategoryId || !config.lowStaffCategoryId) {
    return interaction.editReply({ content: 'Le système de tickets n\'est pas configuré. Contactez un administrateur.' });
  }

  const categoryId = ticketType.staffLevel === 'high'
    ? config.highStaffCategoryId
    : config.lowStaffCategoryId;

  const existingTicket = interaction.guild.channels.cache.find(
    c => c.topic?.startsWith(`ticket:${interaction.user.id}:`) &&
      (c.parentId === categoryId || c.parentId === config.closeCategoryId)
  );

  if (existingTicket) {
    return interaction.editReply({
      content: `Vous avez déjà un ticket ouvert ou en attente : ${existingTicket}`,
    });
  }

  const ticketCount = (config.ticketCount || 0) + 1;
  storage.set(interaction.guildId, { ticketCount });

  const staffRoleId = ticketType.staffLevel === 'high'
    ? config.highStaffRoleId
    : config.lowStaffRoleId;

  const pseudo = interaction.fields.getTextInputValue('pseudo') || interaction.user.username;
  const sanitizedPseudo = pseudo.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'joueur';
  const channelName = `ticket-${String(ticketCount).padStart(4, '0')}-${sanitizedPseudo}`;

  const permissionOverwrites = [
    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
  ];

  if (staffRoleId) {
    permissionOverwrites.push({
      id: staffRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ManageMessages,
      ],
    });
  }

  const channel = await interaction.guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: categoryId,
    topic: `ticket:${interaction.user.id}:${typeKey}`,
    permissionOverwrites,
  });

  const embedFields = ticketType.fields.map(field => ({
    name: field.label,
    value: interaction.fields.getTextInputValue(field.customId) || '*Non renseigné*',
  }));

  const embed = new EmbedBuilder()
    .setColor(ORANGE)
    .setTitle(ticketType.label)
    .setDescription(`Ticket soumis par ${interaction.user}`)
    .addFields(embedFields)
    .setTimestamp()
    .setFooter({ text: `Ticket #${String(ticketCount).padStart(4, '0')}` });

  const closeButton = new ButtonBuilder()
    .setCustomId('ticket_close')
    .setLabel('Fermer le ticket')
    .setStyle(ButtonStyle.Danger);

  await channel.send({
    content: staffRoleId ? `<@&${staffRoleId}>` : undefined,
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(closeButton)],
  });

  await log(interaction.client, interaction.guildId, 'OPEN', [
    { name: 'Salon', value: `${channel}`, inline: true },
    { name: 'Ouvert par', value: `${interaction.user}`, inline: true },
    { name: 'Catégorie', value: ticketType.label, inline: true },
  ]);

  await interaction.editReply({ content: `Votre ticket a été créé : ${channel}` });
}

async function showCloseModal(interaction) {
  const config = storage.get(interaction.guildId);

  const isOpenTicket =
    interaction.channel.parentId === config.highStaffCategoryId ||
    interaction.channel.parentId === config.lowStaffCategoryId;

  if (!isOpenTicket) {
    return interaction.reply({
      content: 'Cette action n\'est disponible que dans un ticket ouvert.',
      ephemeral: true,
    });
  }

  const modal = new ModalBuilder()
    .setCustomId('modal_close_reason')
    .setTitle('Fermeture du ticket');

  const reasonInput = new TextInputBuilder()
    .setCustomId('reason')
    .setLabel('Raison de la fermeture')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder('Expliquez la raison de la fermeture');

  modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
  await interaction.showModal(modal);
}

async function handleCloseModalSubmit(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const config = storage.get(interaction.guildId);

  if (!config.closeCategoryId) {
    return interaction.editReply({ content: 'La catégorie de fermeture n\'est pas configurée.' });
  }

  const reason = interaction.fields.getTextInputValue('reason');
  const topic = interaction.channel.topic || '';
  const [, ownerId] = topic.split(':');

  if (ownerId) {
    const owner = await interaction.client.users.fetch(ownerId).catch(() => null);
    if (owner) {
      const dmEmbed = new EmbedBuilder()
        .setColor(ORANGE)
        .setTitle('Votre ticket a été fermé')
        .setDescription(`Le ticket **${interaction.channel.name}** a été fermé.`)
        .addFields({ name: 'Raison', value: reason })
        .setTimestamp()
        .setFooter({ text: interaction.guild.name });

      await owner.send({ embeds: [dmEmbed] }).catch(() => {});
    }

    await interaction.channel.permissionOverwrites.edit(ownerId, {
      SendMessages: false,
    }).catch(() => {});
  }

  await interaction.channel.setParent(config.closeCategoryId, { lockPermissions: false });

  const closeEmbed = new EmbedBuilder()
    .setColor(ORANGE)
    .setTitle('Ticket fermé')
    .addFields(
      { name: 'Fermé par', value: `${interaction.user}`, inline: true },
      { name: 'Raison', value: reason },
    )
    .setTimestamp();

  await interaction.channel.send({ embeds: [closeEmbed], components: [buildClosedButtons()] });

  await log(interaction.client, interaction.guildId, 'CLOSE', [
    { name: 'Salon', value: interaction.channel.name, inline: true },
    { name: 'Fermé par', value: `${interaction.user}`, inline: true },
    { name: 'Raison', value: reason },
  ]);

  await interaction.editReply({ content: 'Ticket fermé.' });
}

async function handleTranscript(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const messages = [];
  let lastId;

  while (true) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;
    const batch = await interaction.channel.messages.fetch(options);
    if (batch.size === 0) break;
    messages.push(...batch.values());
    lastId = batch.last().id;
    if (batch.size < 100) break;
  }

  messages.reverse();

  const lines = messages.map(msg => {
    const date = msg.createdAt.toISOString().replace('T', ' ').slice(0, 19);
    const extras = [
      msg.embeds.length > 0 ? `[${msg.embeds.length} embed(s)]` : '',
      msg.attachments.size > 0 ? `[${msg.attachments.size} fichier(s)]` : '',
    ].filter(Boolean).join(' ');
    const content = msg.content || (extras ? '' : '[Aucun contenu]');
    return `[${date}] ${msg.author.tag}: ${[content, extras].filter(Boolean).join(' ')}`;
  });

  const text = `Transcript — ${interaction.channel.name}\n${'─'.repeat(60)}\n\n${lines.join('\n')}`;
  const attachment = new AttachmentBuilder(Buffer.from(text, 'utf8'), {
    name: `transcript-${interaction.channel.name}.txt`,
  });

  await interaction.editReply({ files: [attachment] });
}

async function handleReopen(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const config = storage.get(interaction.guildId);
  const topic = interaction.channel.topic || '';
  const [, ownerId, typeKey] = topic.split(':');
  const ticketType = TICKET_TYPES[typeKey];

  if (!ticketType) {
    return interaction.editReply({ content: 'Impossible de déterminer le type de ce ticket.' });
  }

  const categoryId = ticketType.staffLevel === 'high'
    ? config.highStaffCategoryId
    : config.lowStaffCategoryId;

  await interaction.channel.setParent(categoryId, { lockPermissions: false });

  if (ownerId) {
    await interaction.channel.permissionOverwrites.edit(ownerId, {
      SendMessages: true,
    }).catch(() => {});
  }

  const reopenEmbed = new EmbedBuilder()
    .setColor(ORANGE)
    .setDescription(`Ticket réouvert par ${interaction.user}.`)
    .setTimestamp();

  const closeButton = new ButtonBuilder()
    .setCustomId('ticket_close')
    .setLabel('Fermer le ticket')
    .setStyle(ButtonStyle.Danger);

  await interaction.channel.send({
    embeds: [reopenEmbed],
    components: [new ActionRowBuilder().addComponents(closeButton)],
  });

  await log(interaction.client, interaction.guildId, 'REOPEN', [
    { name: 'Salon', value: interaction.channel.name, inline: true },
    { name: 'Réouvert par', value: `${interaction.user}`, inline: true },
  ]);

  await interaction.editReply({ content: 'Ticket réouvert.' });
}

async function handleDeleteTicket(interaction) {
  await interaction.reply({ content: 'Suppression...', ephemeral: true });

  await log(interaction.client, interaction.guildId, 'DELETE', [
    { name: 'Salon', value: interaction.channel.name, inline: true },
    { name: 'Supprimé par', value: `${interaction.user}`, inline: true },
  ]);

  await interaction.channel.delete().catch(() => {});
}

module.exports = {
  handleTicketButton,
  handleTicketModalSubmit,
  showCloseModal,
  handleCloseModalSubmit,
  handleTranscript,
  handleReopen,
  handleDeleteTicket,
};
