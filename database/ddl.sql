-- ---------------------------------------------------------------------------
-- ddl.sql — criação do banco e das tabelas do sistema.
--
-- Como executar:
--     mysql -u root -p < database/ddl.sql
-- ---------------------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS biblioteca
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE biblioteca;

DROP TABLE IF EXISTS livros;

CREATE TABLE livros (
    id_livro       INT AUTO_INCREMENT,
    titulo         VARCHAR(200) NOT NULL,
    autor          VARCHAR(150) NOT NULL,
    ano_publicacao SMALLINT     NOT NULL,

    CONSTRAINT pk_livros PRIMARY KEY (id_livro),
    CONSTRAINT uq_livros_titulo_autor UNIQUE (titulo, autor),
    CONSTRAINT ck_livros_ano CHECK (ano_publicacao BETWEEN 1450 AND 2100)
) ENGINE = InnoDB;
