from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

@app.route('/registrar', methods=['POST'])
def registrar():
    dados = request.json 
    
    try:
        con = sqlite3.connect("agentes.db")
        cursor = con.cursor()
        
        cursor.execute("""
            INSERT INTO agentes (nome, email, senha, classe) 
            VALUES (?, ?, ?, ?)
        """, (dados['nome'], dados['email'], dados['senha'], dados['classe']))
        
        con.commit()
        con.close()
        return jsonify({"mensagem": "Agente recrutado com sucesso!"}), 201
    except Exception as e:
        return jsonify({"mensagem": f"Falha na missão: {str(e)}"}), 400

if __name__ == '__main__':
    app.run(debug=True)