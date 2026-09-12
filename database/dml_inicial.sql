-- ---------------------------------------------------------------------------
-- dml_inicial.sql — livros de exemplo para demonstrar o sistema.
--
-- Execute depois do ddl.sql:
--     mysql -u root -p < database/dml_inicial.sql
-- ---------------------------------------------------------------------------

USE biblioteca;

INSERT INTO livros (titulo, autor, genero, ano_lancamento, resumo, data_cadastro) VALUES
    ('Dom Casmurro', 'Machado de Assis', 'Realismo', 1899,
     'Bentinho relembra a juventude e o casamento com Capitu, tentando provar a si mesmo uma traição que nunca fica clara.',
     CURRENT_DATE),
    ('Grande Sertão: Veredas', 'João Guimarães Rosa', 'Modernismo', 1956,
     'O ex-jagunço Riobaldo narra suas andanças pelo sertão, as guerras entre bandos e o amor proibido por Diadorim.',
     CURRENT_DATE),
    ('Vidas Secas', 'Graciliano Ramos', 'Regionalismo', 1938,
     'Fabiano, Sinhá Vitória, os filhos e a cachorra Baleia fogem da seca e enfrentam a miséria e a injustiça no sertão nordestino.',
     CURRENT_DATE),
    ('Memórias Póstumas de Brás Cubas', 'Machado de Assis', 'Realismo', 1881,
     'Depois de morto, Brás Cubas conta a própria vida com ironia, expondo a vaidade e a hipocrisia da elite do século XIX.',
     CURRENT_DATE),
    ('O Cortiço', 'Aluísio Azevedo', 'Naturalismo', 1890,
     'A vida em um cortiço do Rio de Janeiro mostra como o meio e a ambição moldam o destino dos moradores e do dono, João Romão.',
     CURRENT_DATE);
