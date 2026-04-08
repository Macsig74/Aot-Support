const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require('discord.js');
const { ORANGE } = require('../config');

async function showEmbedModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('modal_embed')
    .setTitle('Créateur d\'embed');

  const titleInput = new TextInputBuilder()
    .setCustomId('title')
    .setLabel('Titre')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(256);

  const descriptionInput = new TextInputBuilder()
    .setCustomId('description')
    .setLabel('Description')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setMaxLength(4000);

  const colorInput = new TextInputBuilder()
    .setCustomId('color')
    .setLabel('Couleur hexadécimale')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder('#FF6600');

  const footerInput = new TextInputBuilder()
    .setCustomId('footer')
    .setLabel('Texte du footer')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(2048);

  const imageInput = new TextInputBuilder()
    .setCustomId('image')
    .setLabel('URL de l\'image')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descriptionInput),
    new ActionRowBuilder().addComponents(colorInput),
    new ActionRowBuilder().addComponents(footerInput),
    new ActionRowBuilder().addComponents(imageInput),
  );

  await interaction.showModal(modal);
}

async function handleEmbedModalSubmit(interaction) {
  const title = interaction.fields.getTextInputValue('title');
  const description = interaction.fields.getTextInputValue('description');
  const colorRaw = interaction.fields.getTextInputValue('color');
  const footer = interaction.fields.getTextInputValue('footer');
  const image = interaction.fields.getTextInputValue('image');

  let color = ORANGE;
  if (colorRaw) {
    const hex = colorRaw.replace('#', '').trim();
    const parsed = parseInt(hex, 16);
    if (!isNaN(parsed) && hex.length >= 3) color = parsed;
  }

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title);

  if (description) embed.setDescription(description);
  if (footer) embed.setFooter({ text: footer });
  if (image) embed.setImage(image);

  await interaction.reply({ embeds: [embed] });
}

module.exports = { showEmbedModal, handleEmbedModalSubmit };
