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
     CURRENT_DATE),
    ('The Hobbit', 'J. R. R. Tolkien', 'Fantasia', 1937,
     'Bilbo Bolseiro deixa o Condado para acompanhar uma jornada que busca recuperar um tesouro guardado por um dragao.',
     CURRENT_DATE),
    ('Dune', 'Frank Herbert', 'Ficcao cientifica', 1965,
     'Em um planeta deserto, Paul Atreides enfrenta disputas politicas, profecias e a luta pelo controle da especiaria.',
     CURRENT_DATE),
    ('Frankenstein', 'Mary Shelley', 'Gotico', 1818,
     'Victor Frankenstein cria uma criatura e passa a lidar com as consequencias de abandonar sua propria obra.',
     CURRENT_DATE),
    ('Pride and Prejudice', 'Jane Austen', 'Romance', 1813,
     'Elizabeth Bennet e Fitzwilliam Darcy precisam rever julgamentos e expectativas sociais antes de se aproximarem.',
     CURRENT_DATE),
    ('The Left Hand of Darkness', 'Ursula K. Le Guin', 'Ficcao cientifica', 1969,
     'Um emissario terrestre visita um planeta distante para propor uma alianca entre mundos de culturas muito diferentes.',
     CURRENT_DATE);

INSERT INTO leitores (nome, email, telefone, data_cadastro) VALUES
    ('Joao Silva', 'joao@email.com', '15999990001', CURRENT_DATE),
    ('Maria Santos', 'maria@email.com', '15999990002', CURRENT_DATE),
    ('Ana Costa', 'ana.costa@email.com', '15999990003', CURRENT_DATE),
    ('Bruno Lima', 'bruno.lima@email.com', '15999990004', CURRENT_DATE),
    ('Carla Mendes', 'carla.mendes@email.com', '15999990005', CURRENT_DATE);

INSERT INTO exemplares (id_livro, status) VALUES
    (1, 'DISPONIVEL'),
    (1, 'DISPONIVEL'),
    (2, 'DISPONIVEL'),
    (3, 'DISPONIVEL');
