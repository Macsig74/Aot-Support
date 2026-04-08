require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const {
  handleTicketButton,
  handleTicketModalSubmit,
  showCloseModal,
  handleCloseModalSubmit,
  handleTranscript,
  handleReopen,
  handleDeleteTicket,
} = require('./handlers/ticketHandler');
const { handleEmbedModalSubmit } = require('./handlers/embedHandler');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(path.join(__dirname, 'commands', file));
  client.commands.set(command.data.name, command);
}

client.once('ready', async () => {
  console.log(`Connecté en tant que ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  const commands = [...client.commands.values()].map(c => c.data.toJSON());

  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log(`${commands.length} commande(s) slash enregistrée(s).`);
  } catch (err) {
    console.error('Erreur lors de l\'enregistrement des commandes :', err);
  }
});

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (command) await command.execute(interaction);
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId.startsWith('ticket_open_')) {
        await handleTicketButton(interaction);
      } else if (interaction.customId === 'ticket_close') {
        await showCloseModal(interaction);
      } else if (interaction.customId === 'ticket_transcript') {
        await handleTranscript(interaction);
      } else if (interaction.customId === 'ticket_reopen') {
        await handleReopen(interaction);
      } else if (interaction.customId === 'ticket_delete') {
        await handleDeleteTicket(interaction);
      }
      return;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('modal_ticket_')) {
        await handleTicketModalSubmit(interaction);
      } else if (interaction.customId === 'modal_close_reason') {
        await handleCloseModalSubmit(interaction);
      } else if (interaction.customId === 'modal_embed') {
        await handleEmbedModalSubmit(interaction);
      }
      return;
    }
  } catch (err) {
    console.error('Erreur interaction :', err);

    const errorPayload = { content: 'Une erreur est survenue.', ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(errorPayload).catch(() => {});
    } else if (!interaction.isModalSubmit()) {
      await interaction.reply(errorPayload).catch(() => {});
    }
  }
});

client.login(process.env.TOKEN);
