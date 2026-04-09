const { SlashCommandBuilder } = require('discord.js');
const storage = require('../utils/storage');

const data = new SlashCommandBuilder()
  .setName('remove')
  .setDescription('Retirer un membre du ticket')
  .addUserOption(opt =>
    opt
      .setName('membre')
      .setDescription('Membre à retirer du ticket')
      .setRequired(true)
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

  const member = interaction.options.getMember('membre');

  if (!member) {
    return interaction.reply({ content: 'Membre introuvable.', ephemeral: true });
  }

  const topic = interaction.channel.topic || '';
  const [, ownerId] = topic.split(':');

  if (member.id === ownerId) {
    return interaction.reply({
      content: 'Impossible de retirer le propriétaire du ticket.',
      ephemeral: true,
    });
  }

  if (member.id === interaction.client.user.id) {
    return interaction.reply({
      content: 'Impossible de me retirer du ticket.',
      ephemeral: true,
    });
  }

  await interaction.channel.permissionOverwrites.edit(member.id, {
    ViewChannel: false,
  });

  await interaction.reply({
    content: `${member} a été retiré du ticket.`,
    ephemeral: true,
  });
}

module.exports = { data, execute };
