const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data.json');

function load() {
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify({}));
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return {};
  }
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function get(guildId) {
  return load()[guildId] || {};
}

function set(guildId, partial) {
  const data = load();
  data[guildId] = { ...data[guildId], ...partial };
  save(data);
}

module.exports = { get, set };
