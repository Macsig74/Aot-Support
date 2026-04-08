const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const storage = require('../utils/storage');
const { log } = require('../utils/logger');

const data = new SlashCommandBuilder()
  .setName('rename')
  .setDescription('Renommer le ticket actuel')
  .addStringOption(opt =>
    opt
      .setName('nom')
      .setDescription('Nouveau nom du ticket')
      .setRequired(true)
      .setMaxLength(50)
  );

async function execute(interaction) {
  const config = storage.get(interaction.guildId);

  const isTicketChannel =
    interaction.channel.parentId === config.highStaffCategoryId ||
    interaction.channel.parentId === config.lowStaffCategoryId ||
    interaction.channel.parentId === config.closeCategoryId;

  if (!isTicketChannel) {
    return interaction.reply({
      content: 'Cette commande ne peut être utilisée que dans un ticket.',
      ephemeral: true,
    });
  }

  const nom = interaction.options.getString('nom');
  const sanitized = nom
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);

  const oldName = interaction.channel.name;
  await interaction.channel.setName(sanitized);

  await log(interaction.client, interaction.guildId, 'RENAME', [
    { name: 'Ancien nom', value: oldName, inline: true },
    { name: 'Nouveau nom', value: sanitized, inline: true },
    { name: 'Par', value: `${interaction.user}`, inline: true },
  ]);

  await interaction.reply({ content: `Ticket renommé en \`${sanitized}\`.`, ephemeral: true });
}

module.exports = { data, execute };
