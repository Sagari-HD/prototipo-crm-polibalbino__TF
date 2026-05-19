-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 19/05/2026 às 04:21
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `polibalbino_db`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `itens_orcamento`
--

CREATE TABLE `itens_orcamento` (
  `id` int(11) NOT NULL,
  `orcamento_id` int(11) DEFAULT NULL,
  `produto_codigo` varchar(50) DEFAULT NULL,
  `quantidade` int(11) DEFAULT NULL,
  `preco_unitario` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `itens_orcamento`
--

INSERT INTO `itens_orcamento` (`id`, `orcamento_id`, `produto_codigo`, `quantidade`, `preco_unitario`) VALUES
(109, 88, '12', 500, 9.00);

-- --------------------------------------------------------

--
-- Estrutura para tabela `orcamentos`
--

CREATE TABLE `orcamentos` (
  `id` int(11) NOT NULL,
  `titulo` varchar(150) DEFAULT NULL,
  `cliente` varchar(150) DEFAULT NULL,
  `cnpj` varchar(20) DEFAULT NULL,
  `contato` varchar(255) DEFAULT NULL,
  `status` enum('Aberto','Ganho','Perdido') DEFAULT 'Aberto',
  `observacoes` text DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `valor_total` decimal(15,2) DEFAULT 0.00,
  `usuario_id` int(11) DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `transportadora` varchar(100) DEFAULT NULL,
  `tipo_frete` varchar(50) DEFAULT NULL,
  `local_retirada` varchar(100) DEFAULT NULL,
  `data_vencimento` date DEFAULT NULL,
  `forma_pagamento` varchar(50) DEFAULT NULL,
  `parcelamento` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `orcamentos`
--

INSERT INTO `orcamentos` (`id`, `titulo`, `cliente`, `cnpj`, `contato`, `status`, `observacoes`, `notas`, `valor_total`, `usuario_id`, `criado_em`, `transportadora`, `tipo_frete`, `local_retirada`, `data_vencimento`, `forma_pagamento`, `parcelamento`) VALUES
(88, 'COMPRAR PP', 'KARINA', '000164646464', 'POLI', 'Aberto', '', NULL, 4500.00, 4, '2026-04-17 02:56:41', 'POLIBALBINO', 'CIF (Entrega)', 'Matriz', '2026-04-18', 'Cartão de Crédito', '5');

-- --------------------------------------------------------

--
-- Estrutura para tabela `produtos`
--

CREATE TABLE `produtos` (
  `id` int(11) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `descricao` text DEFAULT NULL,
  `quantidade_total` int(11) DEFAULT 0,
  `quantidade_reservada` int(11) DEFAULT 0,
  `preco_quilo` decimal(10,2) DEFAULT NULL,
  `linha` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `produtos`
--

INSERT INTO `produtos` (`id`, `codigo`, `descricao`, `quantidade_total`, `quantidade_reservada`, `preco_quilo`, `linha`) VALUES
(2, 'RES-PE-02', 'Resina Plástica PE (Polietileno) Transparente', 300, 0, 18.90, 'PoliPrime'),
(3, 'RES-PS-03', 'Resina Plástica PS (Poliestireno) Cristal', 150, 0, 22.00, 'PoliPrime'),
(4, 'MIX-PP-PE', 'Blenda Especial de Resinas PP e PE de alta densidade', 2000, 0, 12.50, 'PoliRec'),
(5, 'MIX-ALL', 'Mistura Reciclada contendo PP, PE e PS misturados', 10000, 0, 8.90, 'PoliRec'),
(6, 'PP-VD-05', 'pe', 15000, 0, 15.00, 'PoliPrime'),
(8, '316464', '4646464', 64646, 0, 12.00, 'PoliPrime'),
(9, '111', '131313', 20000, 0, 22.00, 'PoliRec'),
(10, 'APE - 001', 'PE', 200000, 0, 12.00, 'PoliRec'),
(11, '12', '1254', 1000, 0, 9.00, 'PoliPrime'),
(12, 'PP UV - SB0', 'PP Anti UV, Cristal, Granulado', 5000, 0, 25.50, 'PoliPrime'),
(13, 'PP UV-C0', 'PP, Anti UV, Preto, Granulado', 2000, 0, 15.50, 'PoliRec');

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `cargo` enum('Admin','Vendedor') DEFAULT 'Vendedor'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `nome`, `email`, `senha`, `cargo`) VALUES
(1, 'Luana Balbino', 'luana@polibalbino.com.br', '$2y$10$BO1mRfvwv/t2J77367Yg.OxQ2lrzF04DaMsTzbFCAyCOFCt7Ef1Au', 'Admin'),
(4, 'ana', 'ana@polibalbino.com.br', '$2y$10$1Jk67d0aOoAIeNNlPCHNEOA5Znnv2Dl1WavLvGe7JoWPiiR8d833e', 'Vendedor'),
(5, 'lua', 'lua@polibalbino.com.br', '$2y$10$WzTWC6zfcTiDid.kkLZL6eIXRZESvCyQV52YKLh9hNn.UC8UTNNF6', 'Vendedor'),
(6, 'joão', 'joao@polibalbino.com.br', '$2y$10$TYpAF3P1zKbL1JLpYju6ae8PiPv3yAv9wESg4LxTXgt8.WcT4.NKK', 'Vendedor');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `itens_orcamento`
--
ALTER TABLE `itens_orcamento`
  ADD PRIMARY KEY (`id`),
  ADD KEY `orcamento_id` (`orcamento_id`),
  ADD KEY `produto_codigo` (`produto_codigo`);

--
-- Índices de tabela `orcamentos`
--
ALTER TABLE `orcamentos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `produtos`
--
ALTER TABLE `produtos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `itens_orcamento`
--
ALTER TABLE `itens_orcamento`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=110;

--
-- AUTO_INCREMENT de tabela `orcamentos`
--
ALTER TABLE `orcamentos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=89;

--
-- AUTO_INCREMENT de tabela `produtos`
--
ALTER TABLE `produtos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `itens_orcamento`
--
ALTER TABLE `itens_orcamento`
  ADD CONSTRAINT `itens_orcamento_ibfk_1` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamentos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `itens_orcamento_ibfk_2` FOREIGN KEY (`produto_codigo`) REFERENCES `produtos` (`codigo`);

--
-- Restrições para tabelas `orcamentos`
--
ALTER TABLE `orcamentos`
  ADD CONSTRAINT `orcamentos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
