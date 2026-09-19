import os
import tempfile
import unittest

TEST_DB = os.path.join(tempfile.gettempdir(), "ordorealitas_test.db")
if os.path.exists(TEST_DB):
    os.remove(TEST_DB)

os.environ["NODE_ENV"] = "test"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"
os.environ["SECRET_KEY"] = "test-secret"
os.environ["JWT_SECRET_KEY"] = "test-jwt-secret"

from app import app, db


class AppTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config.update(TESTING=True)
        self.client = self.app.test_client()
        with self.app.app_context():
            db.drop_all()
            db.create_all()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_health(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["status"], "ok")

    def test_register_login_and_save_sheet(self):
        response = self.client.post(
            "/registrar",
            json={
                "nome": "Agente Teste",
                "email": "teste@example.com",
                "senha": "senha-segura",
                "classe": "especialista",
            },
        )
        self.assertEqual(response.status_code, 201)

        response = self.client.post(
            "/login",
            json={"email": "TESTE@example.com", "senha": "senha-segura"},
        )
        self.assertEqual(response.status_code, 200)
        token = response.get_json()["token"]

        response = self.client.post(
            "/salvar_ficha",
            headers={"Authorization": f"Bearer {token}"},
            json={"nome_personagem": "Personagem Teste", "classe": "especialista"},
        )
        self.assertEqual(response.status_code, 200)

        response = self.client.post(
            "/salvar_ficha",
            json={"nome_personagem": "Sem Token"},
        )
        self.assertEqual(response.status_code, 401)

    def test_invalid_registration_is_rejected(self):
        response = self.client.post(
            "/registrar",
            json={"nome": "", "email": "", "senha": "", "classe": "invalida"},
        )
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
