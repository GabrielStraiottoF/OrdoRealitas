from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Agente(db.Model):
    __tablename__ = 'agentes'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    senha = db.Column(db.String(255), nullable=False)
    classe = db.Column(db.String(50), nullable=False)
    ficha_json = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f'<Agente {self.email}>'
