# 🏭 Polibalbino CRM — Sistema de Gestão Comercial

> Sistema web de CRM e controle de estoque desenvolvido para a empresa **Polibalbino Termoplásticos**, com foco em gestão de orçamentos, funil de vendas Kanban e controle de resinas plásticas.

---

## 📋 Sumário

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Funcionalidades](#funcionalidades)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Banco de Dados](#banco-de-dados)
- [Instalação e Configuração](#instalação-e-configuração)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Endpoints da API](#endpoints-da-api)
- [Níveis de Acesso](#níveis-de-acesso)
- [Fluxo de Venda](#fluxo-de-venda)

---

## 📌 Sobre o Projeto

O **Polibalbino CRM** é um sistema interno desenvolvido como projeto de TCC, com o objetivo de digitalizar e organizar o processo comercial da Polibalbino Termoplásticos. Ele substitui planilhas manuais por um ambiente integrado que conecta **estoque**, **orçamentos** e **pipeline de vendas** em tempo real.

O sistema permite que vendedores criem e gerenciem propostas comerciais diretamente vinculadas ao estoque de resinas plásticas (linhas **PoliPrime** e **PoliRec**), enquanto administradores têm visão completa sobre o desempenho da equipe.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| React | 19.x | Interface e componentes |
| Vite | 8.x | Bundler e servidor de desenvolvimento |
| Tailwind CSS | 4.x | Estilização utilitária |
| Lucide React | 1.x | Ícones |

### Backend
| Tecnologia | Versão | Uso |
|---|---|---|
| PHP | 8.x | API REST |
| MariaDB / MySQL | 10.4.x | Banco de dados relacional |
| XAMPP | — | Ambiente local (Apache + MySQL) |

### Comunicação
- **REST API** via `fetch` com headers `Authorization: Bearer <token>`
- **JSON** como formato de troca de dados
- **Sessions PHP** para gestão de autenticação stateful

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────┐
│              FRONTEND (React + Vite)         │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Catálogo │  │  Kanban  │  │Dashboard │  │
│  │ Estoque  │  │ Vendas   │  │ (Admin)  │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│         │            │             │        │
│         └────────────┴─────────────┘        │
│                      │                      │
│              authHeaders() + fetch           │
└──────────────────────┼──────────────────────┘
                       │ HTTP/JSON
┌──────────────────────┼──────────────────────┐
│           BACKEND (PHP / Apache)             │
│                      │                      │
│  ┌───────────────────▼──────────────────┐   │
│  │             auth.php                 │   │
│  │   (Valida token via $_SESSION)       │   │
│  └───────────────────┬──────────────────┘   │
│                      │                      │
│  ┌──────┐ ┌────────┐ ┌──────────┐ ┌──────┐ │
│  │login │ │produto │ │orcamento │ │users │ │
│  │.php  │ │s.php   │ │s.php     │ │.php  │ │
│  └──────┘ └────────┘ └──────────┘ └──────┘ │
│                      │                      │
└──────────────────────┼──────────────────────┘
                       │ mysqli
┌──────────────────────┼──────────────────────┐
│              MySQL (polibalbino_db)           │
│                                             │
│  produtos | orcamentos | itens_orcamento    │
│                    usuarios                  │
└─────────────────────────────────────────────┘
```

---

## ✨ Funcionalidades

### 👑 Administrador
- **Gestão de Estoque** — Cadastrar, editar e excluir produtos das linhas PoliPrime e PoliRec com preço por quilo, estoque total e estoque reservado
- **Kanban de Vendas** — Visão completa de todos os orçamentos de toda a equipe em três colunas: *Em Aberto*, *Ganho* e *Perdido*
- **Dashboard Analítico** — Métricas de conversão, taxa de ganho/perda, ranking de vendedores e distribuição por status
- **Gestão de Perfis** — Criar e excluir contas de vendedores e administradores

### 🧑‍💼 Vendedor
- **Kanban Próprio** — Visualiza e gerencia apenas seus próprios cards de venda
- **Criação de Cards** — Cria propostas comerciais com título e nome do cliente
- **Geração de Orçamento** — Seleciona materiais do estoque, informa quantidades, dados do cliente (CNPJ, contato), logística (transportadora, tipo de frete) e condições de pagamento
- **Exportação PDF** — Gera proposta comercial formatada pronta para impressão ou exportação em PDF via navegador
- **Observações** — Registra histórico e notas da negociação no card

### 🔄 Automações
- **Reserva de Estoque Automática** — Ao mover um card para "Ganho", o sistema reserva automaticamente as quantidades dos produtos no banco de dados
- **Devolução de Estoque** — Ao mover um card de "Ganho" para outra coluna, o estoque é devolvido automaticamente
- **Sincronização entre Abas** — O sistema usa `localStorage` events para sincronizar dados entre múltiplas abas do navegador abertas simultaneamente

---

## 📁 Estrutura de Pastas

```
polibalbino-crm/
│
├── public/
│   ├── logo-header.png          # Logo para o cabeçalho
│   └── logo-polibalbino.png     # Logo para o PDF de orçamento
│
├── src/
│   ├── App.jsx                  # Componente raiz — toda a lógica e UI
│   ├── main.jsx                 # Entry point React
│   └── index.css                # Import do Tailwind CSS
│
├── polibalbino-api/             # Backend PHP
│   ├── auth.php                 # Middleware de autenticação por token
│   ├── login.php                # Autenticação e geração de token
│   ├── produtos.php             # CRUD de produtos/estoque
│   ├── orcamentos.php           # CRUD de orçamentos + lógica de status
│   ├── usuarios.php             # CRUD de usuários
│   ├── finalizar_orcamento.php  # Salva itens e dados completos do orçamento
│   ├── atualizar_orcamento.php  # Atualiza observações e dados do card
│   ├── atualizar_status.php     # Move card no Kanban + controla reserva de estoque
│   └── itens_orcamento.php      # Vincula itens a um orçamento
│
├── banco-de-dados/
│   └── polibalbino_db.sql       # Dump completo do banco de dados
│
├── .env                         # Variável de ambiente da URL da API
├── index.html                   # HTML raiz
├── vite.config.js               # Configuração do Vite
├── tailwind.config.js           # Configuração do Tailwind
├── postcss.config.js            # Configuração do PostCSS
└── package.json                 # Dependências e scripts
```

---

## 🗄️ Banco de Dados

**Nome do banco:** `polibalbino_db`

### Tabelas

#### `usuarios`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | INT (PK) | Identificador único |
| nome | VARCHAR(100) | Nome do usuário |
| email | VARCHAR(100) | E-mail de acesso (único) |
| senha | VARCHAR(255) | Hash bcrypt da senha |
| cargo | ENUM | `Admin` ou `Vendedor` |

#### `produtos`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | INT (PK) | Identificador único |
| codigo | VARCHAR(50) | Código do produto (único) |
| descricao | TEXT | Descrição do material |
| quantidade_total | INT | Estoque total em kg |
| quantidade_reservada | INT | Estoque reservado por orçamentos ganhos |
| preco_quilo | DECIMAL(10,2) | Preço de venda por kg |
| linha | VARCHAR(50) | `PoliPrime` ou `PoliRec` |

#### `orcamentos`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | INT (PK) | Identificador único |
| titulo | VARCHAR(150) | Título da negociação |
| cliente | VARCHAR(150) | Nome do cliente |
| cnpj | VARCHAR(20) | CNPJ do cliente |
| contato | VARCHAR(255) | Nome do contato no cliente |
| status | ENUM | `Aberto`, `Ganho` ou `Perdido` |
| observacoes | TEXT | Notas do vendedor |
| valor_total | DECIMAL(15,2) | Valor total calculado |
| usuario_id | INT (FK) | Referência ao vendedor responsável |
| criado_em | TIMESTAMP | Data de criação |
| transportadora | VARCHAR(100) | Nome da transportadora |
| tipo_frete | VARCHAR(50) | `FOB` ou `CIF` |
| local_retirada | VARCHAR(100) | Local de retirada |
| data_vencimento | DATE | Validade da proposta |
| forma_pagamento | VARCHAR(50) | Forma de pagamento |
| parcelamento | VARCHAR(20) | Número de parcelas |

#### `itens_orcamento`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | INT (PK) | Identificador único |
| orcamento_id | INT (FK) | Referência ao orçamento |
| produto_codigo | VARCHAR(50) (FK) | Referência ao produto |
| quantidade | INT | Quantidade em kg |
| preco_unitario | DECIMAL(10,2) | Preço praticado na venda |

---

## 🚀 Instalação e Configuração

### Pré-requisitos
- [XAMPP](https://www.apachefriends.org/) com Apache e MySQL ativos
- [Node.js](https://nodejs.org/) versão 20 ou superior
- [npm](https://www.npmjs.com/)

### Passo a Passo

**1. Clone o repositório**
```bash
git clone https://github.com/seu-usuario/polibalbino-crm.git
cd polibalbino-crm
```

**2. Instale as dependências do frontend**
```bash
npm install
```

**3. Configure o banco de dados**
- Abra o phpMyAdmin em `http://localhost/phpmyadmin`
- Crie um banco chamado `polibalbino_db`
- Importe o arquivo `banco-de-dados/polibalbino_db.sql`

**4. Configure a API PHP**
- Copie a pasta `polibalbino-api/` para dentro do diretório `htdocs` do XAMPP:
  ```
  C:\xampp\htdocs\polibalbino-api\
  ```

**5. Configure as variáveis de ambiente**
- Copie o arquivo `.env.example` para `.env` (ou edite o `.env` existente):
  ```
  VITE_API_BASE=http://localhost/polibalbino-api
  ```

**6. Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

**7. Acesse o sistema**
```
http://localhost:5173
```

### Credenciais padrão (após importar o SQL)
| Usuário | E-mail | Cargo |
|---|---|---|
| Luana Balbino | luana@polibalbino.com.br | Admin |
| Ana | ana@polibalbino.com.br | Vendedor |

> ⚠️ **Atenção:** As senhas estão armazenadas com hash bcrypt. Redefina-as pelo sistema ou contate o administrador para obter as senhas iniciais.

---

## ⚙️ Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `VITE_API_BASE` | URL base da API PHP | `http://localhost/polibalbino-api` |

---

## 🔌 Endpoints da API

Todos os endpoints (exceto `/login.php`) exigem o header:
```
Authorization: Bearer <token>
```

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/login.php` | Autenticação e geração de token |
| GET | `/produtos.php` | Lista todos os produtos com estoque disponível |
| POST | `/produtos.php` | Cadastra novo produto |
| PUT | `/produtos.php` | Atualiza produto existente |
| DELETE | `/produtos.php?id={id}` | Remove produto |
| GET | `/orcamentos.php` | Lista todos os orçamentos |
| POST | `/orcamentos.php` | Cria novo orçamento (card básico) |
| DELETE | `/orcamentos.php` | Exclui orçamento (com devolução de estoque se necessário) |
| POST | `/finalizar_orcamento.php` | Salva orçamento completo com itens e dados financeiros |
| POST | `/atualizar_orcamento.php` | Atualiza observações e dados do card |
| POST | `/atualizar_status.php` | Move card no Kanban e controla reserva de estoque |
| GET | `/usuarios.php` | Lista todos os usuários |
| POST | `/usuarios.php` | Cadastra novo usuário |
| DELETE | `/usuarios.php?id={id}` | Remove usuário |

---

## 👥 Níveis de Acesso

```
Admin
 ├── Acessa: Estoque, Kanban (todos os cards), Perfis, Dashboard
 ├── Pode: Criar/editar/excluir produtos, usuários e qualquer orçamento
 └── Vê: Todos os orçamentos de toda a equipe

Vendedor
 ├── Acessa: Kanban (somente seus cards)
 ├── Pode: Criar cards, gerar orçamentos, mover seus cards no Kanban
 └── Vê: Apenas os orçamentos que criou
```

---

## 🔄 Fluxo de Venda

```
1. CRIAR CARD
   Vendedor clica em "Criar Card Inicial"
   Preenche título e nome do cliente
   Card aparece na coluna "Em Aberto"
         │
         ▼
2. GERAR ORÇAMENTO
   Vendedor clica no card → "Gerar Orçamento Integrado"
   Seleciona materiais do estoque (PoliPrime / PoliRec)
   Informa quantidades, CNPJ, transportadora, frete e pagamento
   Clica em "Finalizar" → dados salvos no banco via finalizar_orcamento.php
         │
         ▼
3. ACOMPANHAR NEGOCIAÇÃO
   Vendedor registra observações no card
   Pode refazer o orçamento a qualquer momento
   Gera PDF da proposta para enviar ao cliente
         │
         ▼
4. FECHAR NEGÓCIO
   Arrastar card para "Ganho"
   → Sistema reserva automaticamente o estoque via atualizar_status.php
   Arrastar card para "Perdido"
   → Nenhuma alteração de estoque
         │
         ▼
5. VISÃO DO ADMIN
   Dashboard mostra métricas consolidadas
   Taxa de conversão, ranking de vendedores, distribuição por status
```

---

## 🧑‍💻 Autores e Desenvolvedores
Este sistema foi idealizado e implementado por:

**Gabriel dos Santos Ribeiro** 

**Victoria Ponciano** 

---

## 📄 Licença

Este projeto foi desenvolvido como trabalho de conclusão de curso (TCC). Todos os direitos reservados à **Polibalbino Termoplásticos**.

---

