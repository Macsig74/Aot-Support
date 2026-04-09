from flask import Flask, request, jsonify, send_from_directory
from datetime import datetime
import os

app = Flask(__name__, static_folder='.')

SAVE_DIR = os.path.expanduser("~/textes")
os.makedirs(SAVE_DIR, exist_ok=True)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/save', methods=['POST'])
def save():
    data = request.get_json()
    texte = data.get('texte', '').strip()
    nom = data.get('nom', '').strip()

    if not texte:
        return jsonify({'ok': False, 'msg': 'Texte vide'}), 400

    if not nom:
        nom = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')

    nom_fichier = nom if nom.endswith('.txt') else nom + '.txt'
    chemin = os.path.join(SAVE_DIR, nom_fichier)

    with open(chemin, 'w', encoding='utf-8') as f:
        f.write(texte)

    return jsonify({'ok': True, 'fichier': chemin})

@app.route('/liste', methods=['GET'])
def liste():
    fichiers = sorted(os.listdir(SAVE_DIR), reverse=True)
    return jsonify(fichiers)

if __name__ == '__main__':
    print(f"Serveur démarré → http://0.0.0.0:5000")
    print(f"Fichiers sauvegardés dans : {SAVE_DIR}")
    app.run(host='0.0.0.0', port=5000, debug=False)