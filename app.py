from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import sqlite3
import json

app = Flask(__name__)
CORS(app)

def criar_tabela():
    con = sqlite3.connect("agentes.db")
    cursor = con.cursor()
    # Criamos a tabela. A coluna ficha_json armazenará o "pacotão" de dados da ficha
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS agentes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            gmail TEXT NOT NULL UNIQUE,
            senha TEXT NOT NULL,
            classe TEXT NOT NULL,
            ficha_json TEXT
        )
    """)
    con.commit()
    con.close()

@app.route('/')
def index():
    return render_template('login.html')

@app.route('/pagina_cadastro')
def abrir_cadastro():
    return render_template('cadastro.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/registrar', methods=['POST'])
def registrar():
    dados = request.json
    try:
        con = sqlite3.connect("agentes.db")
        cursor = con.cursor()
        cursor.execute("INSERT INTO agentes (nome, gmail, senha, classe) VALUES (?, ?, ?, ?)",
                       (dados['nome'], dados['gmail'], dados['senha'], dados['classe']))
        con.commit()
        con.close()
        return jsonify({"mensagem": "Agente Registrado com sucesso!"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"mensagem": "Este e-mail já está na base!"}), 400

@app.route('/login', methods=['POST'])
def login():
    dados = request.json
    con = sqlite3.connect("agentes.db")
    cursor = con.cursor()
    # O email no banco está como 'gmail', mas no login você recebe como 'email'
    cursor.execute("SELECT * FROM agentes WHERE gmail = ? AND senha = ?", (dados['email'], dados['senha']))
    agente = cursor.fetchone()
    con.close()

    if agente:
        # Tenta carregar os dados da ficha. Se estiver vazio (None), retorna um dicionário vazio {}
        try:
            dados_ficha = json.loads(agente[5]) if agente[5] else {}
        except:
            dados_ficha = {}

        return jsonify({
            "mensagem": "Acesso autorizado!",
            "agente": {
                "nome": agente[1], 
                "email": agente[2], 
                "classe": agente[4],
                "dados_salvos": dados_ficha
            }
        }), 200
    return jsonify({"mensagem": "Acesso negado."}), 401

@app.route('/salvar_ficha', methods=['POST'])
def salvar_ficha():
    dados = request.get_json()
    email_agente = dados.get('email_dono')
    
    # Serializa o dicionário da ficha para uma string de texto para salvar no SQLite
    ficha_string = json.dumps(dados)

    try:
        con = sqlite3.connect("agentes.db")
        cursor = con.cursor()
        # Atualiza apenas a ficha do agente dono daquele email
        cursor.execute("UPDATE agentes SET ficha_json = ? WHERE gmail = ?", (ficha_string, email_agente))
        con.commit()
        con.close()
        return jsonify({"mensagem": "Ficha sincronizada com a Ordem!"}), 200
    except Exception as e:
        print(f"Erro ao salvar: {e}")
        return jsonify({"mensagem": f"Erro interno: {str(e)}"}), 500

if __name__ == '__main__':
    criar_tabela()
    app.run(debug=True)