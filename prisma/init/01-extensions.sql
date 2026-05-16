-- Extensões obrigatórias para a constraint EXCLUDE USING gist
-- Executado automaticamente quando o container Postgres sobe pela primeira vez.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Fuso horário padrão (mas a aplicação sempre converte para America/Sao_Paulo no código)
ALTER DATABASE agenda SET timezone TO 'America/Sao_Paulo';
