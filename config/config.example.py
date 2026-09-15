"""Configuracao de exemplo para a aplicacao.

Copie este arquivo como config.py e preencha as credenciais locais do MySQL.
"""

# --- Banco de dados MySQL ---
DB_HOST = "localhost"
DB_PORT = 3306
DB_USER = "root"
DB_PASSWORD = ""
DB_NAME = "biblioteca"

# --- Servidor HTTP local ---
SERVIDOR_HOST = "127.0.0.1"
SERVIDOR_PORTA = 8000

# False: usa o MySQL configurado acima. Execute os scripts em database/ antes de iniciar.
USAR_BANCO_MEMORIA = False
