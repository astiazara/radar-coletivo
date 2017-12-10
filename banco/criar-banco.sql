-- phpMyAdmin SQL Dump
-- version 4.0.10.11
-- http://www.phpmyadmin.net
--
-- Servidor: localhost
-- Tempo de Geração: 10/12/2017 às 20:03
-- Versão do servidor: 5.1.73
-- Versão do PHP: 7.0.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- Banco de dados: 'radarcoletivo'
--
CREATE DATABASE IF NOT EXISTS radarcoletivo DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE radarcoletivo;

-- --------------------------------------------------------

--
-- Estrutura para tabela 'linha'
--

CREATE TABLE IF NOT EXISTS linha (
  id varchar(7) NOT NULL,
  nome varchar(50) NOT NULL,
  zona int(11) NOT NULL,
  PRIMARY KEY (id),
  KEY zona (zona)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Estrutura para tabela 'rastro'
--

CREATE TABLE IF NOT EXISTS rastro (
  datahora datetime NOT NULL,
  linha varchar(7) NOT NULL,
  lat varchar(30) NOT NULL,
  lng varchar(30) NOT NULL,
  KEY datahora (datahora)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Estrutura para tabela 'zona'
--

CREATE TABLE IF NOT EXISTS zona (
  id int(11) NOT NULL,
  nome varchar(50) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

DELIMITER $$
--
-- Eventos
--
CREATE EVENT limpeza_rastros ON SCHEDULE EVERY 1 HOUR STARTS '2017-12-10 14:56:47' ON COMPLETION NOT PRESERVE ENABLE DO DELETE FROM rastro WHERE TIMESTAMPDIFF(HOUR, datahora, NOW()) > 12$$

DELIMITER ;
