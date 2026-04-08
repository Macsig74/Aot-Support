const { SlashCommandBuilder } = require('discord.js');
const { showCloseModal } = require('../handlers/ticketHandler');

const data = new SlashCommandBuilder()
  .setName('close')
  .setDescription('Fermer le ticket actuel');

async function execute(interaction) {
  await showCloseModal(interaction);
}

module.exports = { data, execute };
