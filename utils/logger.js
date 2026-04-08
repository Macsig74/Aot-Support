const { EmbedBuilder } = require('discord.js');
const { ORANGE } = require('../config');
const storage = require('./storage');

const ACTIONS = {
  OPEN:    { label: 'Ticket ouvert',   color: ORANGE },
  CLOSE:   { label: 'Ticket fermé',    color: 0xE74C3C },
  REOPEN:  { label: 'Ticket réouvert', color: 0x2ECC71 },
  DELETE:  { label: 'Ticket supprimé', color: 0x95A5A6 },
  RENAME:  { label: 'Ticket renommé',  color: ORANGE },
};

async function log(client, guildId, action, fields) {
  const config = storage.get(guildId);
  if (!config.logChannelId) return;

  const logChannel = await client.channels.fetch(config.logChannelId).catch(() => null);
  if (!logChannel) return;

  const def = ACTIONS[action];
  if (!def) return;

  const embed = new EmbedBuilder()
    .setColor(def.color)
    .setTitle(def.label)
    .addFields(fields)
    .setTimestamp();

  await logChannel.send({ embeds: [embed] }).catch(() => {});
}

module.exports = { log };
