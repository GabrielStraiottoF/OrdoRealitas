import os
import json
import logging
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from models import db, Agente

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'fallback-secret-development')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'fallback-jwt-secret-development')

db_url = os.getenv('DATABASE_URL', 'sqlite:///agentes_orm.db')

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
    logger.info("Utilizando banco de dados PostgreSQL persistente.")
elif "sqlite" in db_url:
    logger.warning("ALERTA: Utilizando SQLite. Os dados SERÃO PERDIDOS ao reiniciar no Render!")

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
jwt = JWTManager(app)

with app.app_context():
    try:
        db.create_all()
        logger.info("Banco de dados inicializado com sucesso.")
    except Exception as e:
        logger.error(f"Erro ao inicializar o banco de dados: {e}")

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
    email_logado = get_jwt_identity()
    dados = request.get_json()
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
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)