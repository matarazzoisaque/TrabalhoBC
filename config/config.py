"""Configurações centrais do projeto.

Reúne em um único lugar os dados de acesso ao MySQL e o endereço do
servidor HTTP local. Ajuste os valores conforme o seu ambiente.
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

# --- Banco em memória (temporário) ---
# True: os livros ficam na memória do servidor e somem ao reiniciar.
# Troque para False quando o MySQL estiver instalado e o ddl.sql tiver rodado.
USAR_BANCO_MEMORIA = True
