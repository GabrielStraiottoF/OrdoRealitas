import sqlite3

conn = sqlite3.connect("banco.db")
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS usuarios(
id INTEGER PRIMARY KEY AUTOINCREMENT,
nome TEXT,
email TEXT,
senha TEXT,
classe TEXT
)
""")

conn.commit()
conn.close()

print("Banco criado!")