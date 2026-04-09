const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require('discord.js');

const ALLOWED_USERS = (process.env.SETUP_USERS || '').split(',').map(id => id.trim()).filter(Boolean);
const { ORANGE, TICKET_TYPES } = require('../config');
const storage = require('../utils/storage');

const data = new SlashCommandBuilder()
  .setName('setup-tickets')
  .setDescription('Configure le panel de tickets dans un salon')
  .addChannelOption(opt =>
    opt
      .setName('salon')
      .setDescription('Salon où afficher le panel de tickets')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .addRoleOption(opt =>
    opt
      .setName('role_high_staff')
      .setDescription('Rôle du staff haut niveau (ban/mute appel, recrutement)')
      .setRequired(true)
  )
  .addRoleOption(opt =>
    opt
      .setName('role_low_staff')
      .setDescription('Rôle du staff bas niveau (bugs, autres)')
      .setRequired(true)
  )
  .addChannelOption(opt =>
    opt
      .setName('categorie_high_staff')
      .setDescription('Catégorie Discord pour les tickets high staff')
      .addChannelTypes(ChannelType.GuildCategory)
      .setRequired(true)
  )
  .addChannelOption(opt =>
    opt
      .setName('categorie_low_staff')
      .setDescription('Catégorie Discord pour les tickets low staff')
      .addChannelTypes(ChannelType.GuildCategory)
      .setRequired(true)
  )
  .addChannelOption(opt =>
    opt
      .setName('categorie_close')
      .setDescription('Catégorie Discord pour les tickets fermés')
      .addChannelTypes(ChannelType.GuildCategory)
      .setRequired(true)
  )
  .addChannelOption(opt =>
    opt
      .setName('logs')
      .setDescription('Salon pour les logs des tickets')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt
      .setName('image')
      .setDescription('URL de l\'image affichée dans le panel')
      .setRequired(false)
  );

async function execute(interaction) {
  if (!ALLOWED_USERS.includes(interaction.user.id)) {
    return interaction.reply({ content: 'Vous n\'êtes pas autorisé à utiliser cette commande.', ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.options.getChannel('salon');
  const highStaffRole = interaction.options.getRole('role_high_staff');
  const lowStaffRole = interaction.options.getRole('role_low_staff');
  const highStaffCategory = interaction.options.getChannel('categorie_high_staff');
  const lowStaffCategory = interaction.options.getChannel('categorie_low_staff');
  const closeCategory = interaction.options.getChannel('categorie_close');
  const logsChannel = interaction.options.getChannel('logs');
  const image = interaction.options.getString('image');

  storage.set(interaction.guildId, {
    highStaffCategoryId: highStaffCategory.id,
    lowStaffCategoryId: lowStaffCategory.id,
    closeCategoryId: closeCategory.id,
    highStaffRoleId: highStaffRole.id,
    lowStaffRoleId: lowStaffRole.id,
    logChannelId: logsChannel.id,
  });

  const embed = new EmbedBuilder()
    .setColor(ORANGE)
    .setTitle('Support — AotSmp ')
    .setDescription(
      'Bienvenue sur le support du serveur **Attack on Titan**.\n\n' +
      'Sélectionnez la catégorie correspondant à votre situation en cliquant sur le bouton approprié ci-dessous.\n\n' +
      '**Appel Ban / Mute** — Contester une sanction reçue\n' +
      '**Signalement de bug** — Signaler un problème technique\n' +
      '**Autres** — Toute autre demande'
    )
    .setTimestamp();

  if (image) embed.setImage(image);

  const buttons = Object.entries(TICKET_TYPES).map(([key, type]) =>
    new ButtonBuilder()
      .setCustomId(`ticket_open_${key}`)
      .setLabel(type.label)
      .setStyle(ButtonStyle.Secondary)
  );

  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
  }

  await channel.send({ embeds: [embed], components: rows });
  await interaction.editReply({ content: `Panel de tickets publié dans ${channel}.` });
}

module.exports = { data, execute };
