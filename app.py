import json
import logging
import os
from datetime import timedelta

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash

from models import Agente, db

load_dotenv()

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

app = Flask(__name__)

environment = os.getenv("NODE_ENV", os.getenv("FLASK_ENV", "development")).lower()
is_production = environment in {"production", "prod"}

secret_key = os.getenv("SECRET_KEY")
jwt_secret_key = os.getenv("JWT_SECRET_KEY")

if is_production and (not secret_key or not jwt_secret_key):
    raise RuntimeError("SECRET_KEY e JWT_SECRET_KEY são obrigatórias em produção.")

app.config["SECRET_KEY"] = secret_key or "local-development-secret-change-me"
app.config["JWT_SECRET_KEY"] = jwt_secret_key or "local-development-jwt-secret-change-me"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(
    hours=int(os.getenv("JWT_EXPIRES_HOURS", "12"))
)

db_url = os.getenv("DATABASE_URL")
if not db_url:
    if is_production:
        raise RuntimeError("DATABASE_URL é obrigatória em produção.")
    db_url = "sqlite:///agentes_orm.db"
    logger.warning("DATABASE_URL ausente: usando SQLite apenas para desenvolvimento.")

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = db_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_pre_ping": True,
    "pool_recycle": 300,
}

cors_origins = os.getenv("CORS_ORIGINS", "").strip()
if cors_origins:
    CORS(app, origins=[origin.strip() for origin in cors_origins.split(",") if origin.strip()])
else:
    # A aplicação serve o próprio frontend; CORS aberto não é necessário por padrão.
    CORS(app)

db.init_app(app)
jwt = JWTManager(app)


def initialize_database():
    with app.app_context():
        try:
            db.create_all()
            logger.info("Banco de dados inicializado com sucesso.")
        except Exception:
            logger.exception("Falha ao inicializar o banco de dados.")
            if is_production:
                raise


initialize_database()


@app.get("/health")
def health():
    return jsonify({"status": "ok"}), 200


@app.get("/")
def index():
    return render_template("login.html")


@app.get("/pagina_cadastro")
def abrir_cadastro():
    return render_template("cadastro.html")


@app.get("/dashboard")
def dashboard():
    return render_template("dashboard.html")


def get_json_payload():
    return request.get_json(silent=True) or {}


def normalize_email(value):
    return str(value or "").strip().lower()


@app.post("/registrar")
def registrar():
    dados = get_json_payload()
    nome = str(dados.get("nome") or "").strip()
    email = normalize_email(dados.get("email"))
    senha = str(dados.get("senha") or "")
    classe = str(dados.get("classe") or "").strip().lower()

    classes_validas = {"combatante", "especialista", "ocultista"}
    if not nome or not email or not senha or classe not in classes_validas:
        return jsonify({"mensagem": "Nome, e-mail, senha e classe são obrigatórios."}), 400

    if len(senha) < 6:
        return jsonify({"mensagem": "A senha deve ter pelo menos 6 caracteres."}), 400

    try:
        if Agente.query.filter_by(email=email).first():
            return jsonify({"mensagem": "Este e-mail já está na base!"}), 409

        novo_agente = Agente(
            nome=nome,
            email=email,
            senha=generate_password_hash(senha),
            classe=classe,
        )
        db.session.add(novo_agente)
        db.session.commit()
        return jsonify({"mensagem": "Agente registrado com sucesso!"}), 201
    except Exception:
        db.session.rollback()
        logger.exception("Erro ao registrar agente.")
        return jsonify({"mensagem": "Erro interno no servidor."}), 500


@app.post("/login")
def login():
    dados = get_json_payload()
    email = normalize_email(dados.get("email"))
    senha = str(dados.get("senha") or "")

    if not email or not senha:
        return jsonify({"mensagem": "E-mail e senha são obrigatórios."}), 400

    agente = Agente.query.filter_by(email=email).first()

    if not agente or not check_password_hash(agente.senha, senha):
        return jsonify({"mensagem": "E-mail ou senha inválidos."}), 401

    try:
        dados_ficha = json.loads(agente.ficha_json) if agente.ficha_json else {}
    except (TypeError, json.JSONDecodeError):
        logger.warning("ficha_json inválido para o agente %s.", agente.email)
        dados_ficha = {}

    access_token = create_access_token(identity=agente.email)

    return jsonify(
        {
            "mensagem": "Acesso autorizado!",
            "token": access_token,
            "agente": {
                "nome": agente.nome,
                "email": agente.email,
                "classe": agente.classe,
                "dados_salvos": dados_ficha,
            },
        }
    ), 200


@app.post("/salvar_ficha")
@jwt_required()
def salvar_ficha():
    email_logado = normalize_email(get_jwt_identity())
    dados = get_json_payload()

    agente = Agente.query.filter_by(email=email_logado).first()
    if not agente:
        return jsonify({"mensagem": "Agente não encontrado na base de dados!"}), 404

    # O proprietário da ficha vem exclusivamente do token JWT.
    dados["email_dono"] = email_logado

    try:
        agente.ficha_json = json.dumps(dados, ensure_ascii=False)
        # Mantém a classe principal coerente com a ficha salva.
        classe = str(dados.get("classe") or "").strip().lower()
        if classe in {"combatante", "especialista", "ocultista"}:
            agente.classe = classe

        db.session.commit()
        return jsonify({"mensagem": "Ficha sincronizada com a Ordem!"}), 200
    except Exception:
        db.session.rollback()
        logger.exception("Erro ao salvar a ficha do agente %s.", email_logado)
        return jsonify({"mensagem": "Erro interno ao salvar a ficha."}), 500


@jwt.unauthorized_loader
def unauthorized_callback(message):
    return jsonify({"mensagem": "Autenticação necessária."}), 401


@jwt.invalid_token_loader
def invalid_token_callback(message):
    return jsonify({"mensagem": "Token de autenticação inválido."}), 401


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({"mensagem": "Sessão expirada. Faça login novamente."}), 401


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port)
