import os
import json
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from models import db, Agente

# Carregar variáveis de ambiente
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configurações usando Variáveis de Ambiente
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'fallback-secret-development')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'fallback-jwt-secret-development')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI', 'sqlite:///agentes_orm.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializar extensões
db.init_app(app)
jwt = JWTManager(app)

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
        # Verificar se o email já existe
        agente_existente = Agente.query.filter_by(email=dados['email']).first()
        if agente_existente:
            return jsonify({"mensagem": "Este e-mail já está na base!"}), 400

        senha_hash = generate_password_hash(dados['senha'])
        novo_agente = Agente(
            nome=dados['nome'],
            email=dados['email'],
            senha=senha_hash,
            classe=dados['classe']
        )
        db.session.add(novo_agente)
        db.session.commit()
        return jsonify({"mensagem": "Agente Registrado com sucesso!"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"mensagem": "Erro interno no servidor."}), 500

@app.route('/login', methods=['POST'])
def login():
    dados = request.json
    agente = Agente.query.filter_by(email=dados['email']).first()

    if agente and check_password_hash(agente.senha, dados['senha']):
        try:
            dados_ficha = json.loads(agente.ficha_json) if agente.ficha_json else {}
        except:
            dados_ficha = {}

        # Criar o token de acesso
        access_token = create_access_token(identity=agente.email)

        return jsonify({
            "mensagem": "Acesso autorizado!",
            "token": access_token,
            "agente": {
                "nome": agente.nome, 
                "email": agente.email, 
                "classe": agente.classe,
                "dados_salvos": dados_ficha
            }
        }), 200
    
    return jsonify({"mensagem": "E-mail ou senha inválidos."}), 401

@app.route('/salvar_ficha', methods=['POST'])
@jwt_required()
def salvar_ficha():
    # O email vem direto do token confiável gerado no login
    email_logado = get_jwt_identity()
    dados = request.get_json()

    # Sobrescreve/Garante que o e-mail no JSON é o do usuário logado
    dados['email_dono'] = email_logado
    ficha_string = json.dumps(dados)

    try:
        agente = Agente.query.filter_by(email=email_logado).first()
        if not agente:
            return jsonify({"mensagem": "Agente não encontrado na base de dados!"}), 404
            
        agente.ficha_json = ficha_string
        db.session.commit()
        
        return jsonify({"mensagem": "Ficha sincronizada com a Ordem!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"mensagem": "Erro interno ao salvar a ficha."}), 500

if __name__ == '__main__':
    # O Gunicorn será usado. Rodando esse arquivo fará um fallback simples.
    with app.app_context():
        # Apenas como utilidade local
        pass
    app.run()