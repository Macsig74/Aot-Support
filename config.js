const ORANGE = 0xFF6600;

const TICKET_TYPES = {
  ban_mute: {
    label: 'Appel Ban / Mute',
    staffLevel: 'high',
    fields: [
      { customId: 'pseudo', label: 'Pseudo Minecraft', style: 1, required: true, placeholder: 'Votre pseudo exact sur le serveur' },
      { customId: 'sanction', label: 'Sanction reçue', style: 1, required: true, placeholder: 'Ban temporaire / Ban définitif / Mute' },
      { customId: 'raison', label: 'Motif de votre appel', style: 2, required: true, placeholder: 'Expliquez pourquoi vous contestez cette sanction' },
      { customId: 'preuves', label: 'Preuves disponibles', style: 2, required: false, placeholder: 'Liens, captures d\'écran (facultatif)' },
    ],
  },
  bugs: {
    label: 'Signalement de bug',
    staffLevel: 'low',
    fields: [
      { customId: 'pseudo', label: 'Pseudo Minecraft', style: 1, required: true, placeholder: 'Votre pseudo exact sur le serveur' },
      { customId: 'description', label: 'Description du bug', style: 2, required: true, placeholder: 'Décrivez le bug observé' },
      { customId: 'reproduction', label: 'Étapes pour reproduire', style: 2, required: true, placeholder: 'Comment reproduire ce bug' },
      { customId: 'version', label: 'Version Minecraft', style: 1, required: true, placeholder: 'Ex : 1.20.1' },
    ],
  },
  autres: {
    label: 'Autres',
    staffLevel: 'low',
    fields: [
      { customId: 'pseudo', label: 'Pseudo Minecraft', style: 1, required: true, placeholder: 'Votre pseudo exact sur le serveur' },
      { customId: 'sujet', label: 'Sujet de votre demande', style: 1, required: true, placeholder: 'Résumé en quelques mots' },
      { customId: 'description', label: 'Description', style: 2, required: true, placeholder: 'Décrivez votre demande en détail' },
    ],
  },
};

module.exports = { ORANGE, TICKET_TYPES };
