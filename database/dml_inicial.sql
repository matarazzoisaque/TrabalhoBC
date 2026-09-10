-- ---------------------------------------------------------------------------
-- dml_inicial.sql — livros de exemplo para demonstrar o sistema.
--
-- Execute depois do ddl.sql:
--     mysql -u root -p < database/dml_inicial.sql
-- ---------------------------------------------------------------------------

USE biblioteca;

INSERT INTO livros (titulo, autor, ano_publicacao) VALUES
    ('Dom Casmurro',            'Machado de Assis',   1899),
    ('Grande Sertão: Veredas',  'João Guimarães Rosa', 1956),
    ('Vidas Secas',             'Graciliano Ramos',   1938),
    ('Memórias Póstumas de Brás Cubas', 'Machado de Assis', 1881),
    ('O Cortiço',               'Aluísio Azevedo',    1890);
