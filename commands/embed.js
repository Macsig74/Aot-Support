const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { showEmbedModal } = require('../handlers/embedHandler');

const data = new SlashCommandBuilder()
  .setName('embed')
  .setDescription('Créer un embed personnalisé')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

async function execute(interaction) {
  await showEmbedModal(interaction);
}

module.exports = { data, execute };
