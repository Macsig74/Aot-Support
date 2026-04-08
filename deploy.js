require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const { data } = require(path.join(__dirname, 'commands', file));
  commands.push(data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    const clientId = Buffer.from(process.env.TOKEN.split('.')[0], 'base64').toString();
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log(`${commands.length} commande(s) déployée(s) : ${commands.map(c => c.name).join(', ')}`);
  } catch (err) {
    console.error(err);
  }
})();
