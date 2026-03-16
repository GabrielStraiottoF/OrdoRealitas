from flask import Flask, render_template, request, redirect
import sqlite3

app = Flask(__name__)

@app.route("/")
def login():
    return render_template("login.html")


@app.route("/login", methods=["POST"])
def validar():

    email = request.form["email"]
    senha = request.form["senha"]

    conn = sqlite3.connect("banco.db")
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM usuarios WHERE email=? AND senha=?",
        (email, senha)
    )

    usuario = cursor.fetchone()

    conn.close()

    if usuario:
        return "Login realizado"
    else:
        return "Usuário não encontrado"


@app.route("/cadastro")
def cadastro():
    return render_template("cadastro.html")


@app.route("/registrar", methods=["POST"])
def registrar():

    nome = request.form["nome"]
    email = request.form["email"]
    senha = request.form["senha"]
    classe = request.form["classe"]

    conn = sqlite3.connect("banco.db")
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO usuarios (nome,email,senha,classe) VALUES (?,?,?,?)",
        (nome,email,senha,classe)
    )

    conn.commit()
    conn.close()

    return redirect("/")


if __name__ == "__main__":
    app.run(debug=True)