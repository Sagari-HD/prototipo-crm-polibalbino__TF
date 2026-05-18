import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Plus, Edit2, Trash2, Package, X, AlertCircle,
  Sparkles, Loader2, ShoppingCart, LayoutDashboard, List, User, CheckCircle,
  Clock, XCircle, Bot, DollarSign, ArrowRight, AlignLeft, Paperclip,
  BarChart2, FileText, Upload, Handshake, Inbox, History, LogOut, TrendingUp, PieChart,
  ArrowLeft, Printer, Phone, Truck, CreditCard, Calendar, Leaf, CheckCircle2
} from 'lucide-react';

// --- Componente de Notificação (Toast) ---
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-xl text-white font-semibold shadow-2xl ${colors[type] || colors.info} animate-in slide-in-from-bottom-4 duration-300`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  );
}

// --- Dados Iniciais de Exemplo (Agora com Preços) ---
const INITIAL_DATA = [];

// 🔐 URL base da API — altere aqui se mudar o servidor
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost/polibalbino-api';

// 🔐 Monta os headers com o token de autenticação em todas as requisições
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('polibalbino_token') || ''}`
});



export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    // Busca o usuário na "caixinha" polibalbino_user
    const savedUser = localStorage.getItem('polibalbino_user');
    // Se achar, ele já começa logado. Se não, começa null (tela de login)
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // --- Toast de Notificação ---
  const [toast, setToast] = useState(null); // { message, type }
  const showToast = (message, type = 'success') => setToast({ message, type });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'kanban'
  // PERFIL API
  const [usersList, setUsersList] = useState([]); // Começa vazio.


  const [newUserFormData, setNewUserFormData] = useState({ name: '', email: '', password: '', role: 'Vendedor' });
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [dashboardFilter, setDashboardFilter] = useState('Todos');
  const [extraQuoteData, setExtraQuoteData] = useState({
    cnpj: '',
    contato: '',
    transportadora: '',
    frete: 'FOB (Retira GRU)',
    localRetirada: 'Matriz',
    formaPagamento: 'Cartão de Crédito',
    parcelas: '1x',
    dataEmissao: new Date().toISOString().split('T')[0],
    dataVencimento: ''
  });
  const [inventory, setInventory] = useState();

  // 1. Criar o estado para guardar os orçamentos
  const [quotes, setQuotes] = useState([]);

  // Este estado vai guardar os materiais (PoliRec, PoliPrime, etc.) que o ADM cadastrou
  const [produtosEstoque, setProdutosEstoque] = useState([]);

  // 2. Criar a função que busca os dados no seu orcamentos.php
  const fetchQuotes = async () => {
    try {
      const response = await fetch(`${API_BASE}/orcamentos.php`, { headers: authHeaders() });
      const data = await response.json();
      setQuotes(data); // Isso faz os cards aparecerem na tela
    } catch (error) {
      console.error("Erro ao carregar orçamentos:", error);
    }
  };

  // 3. Mandar o React buscar os dados assim que a página abrir
  useEffect(() => {
    fetchProdutos(); // Se você já tiver essa função para o estoque
    fetchQuotes();   // Adicione esta linha aqui!
  }, []);

  // Função para conectar com o login.php
  const handleLogin = async (e) => {
    e.preventDefault(); // Impede a página de recarregar
    setLoginError(''); // Limpa erros antigos

    try {
      const response = await fetch(`${API_BASE}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      });

      if (response.ok) {
        const user = await response.json();
        // Salva o token separado para uso nas requisições
        localStorage.setItem('polibalbino_token', user.token);
        // Se o PHP validou, a gente salva o usuário no estado e no navegador
        setCurrentUser(user);
        localStorage.setItem('polibalbino_user', JSON.stringify(user));
      } else {
        // Se o PHP deu 401 (Erro), a gente mostra a mensagem
        const errorData = await response.json();
        setLoginError(errorData.error || 'Credenciais inválidas');
      }
    } catch (error) {
      setLoginError('Não foi possível conectar ao servidor. O XAMPP está ligado?');
    }
  };


  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('polibalbino_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('polibalbino_user');
    }
  }, [currentUser]); // Toda vez que o usuário mudar, ele grava ou apaga

  // Sistema de redirecionamento automático por nível de acesso
  useEffect(() => {
    // Se for Vendedor e a aba atual NÃO for o kanban, joga ele pro kanban na hora
    if (currentUser?.role === 'Vendedor' && activeTab !== 'kanban') {
      setActiveTab('kanban');
    }
  }, [currentUser, activeTab]);

  //Sincroniza as abas (Admin vê o que o Vendedor criou)
  useEffect(() => {
    const sincronizarAbas = (e) => {
      // Se a aba do vendedor salvou novos orçamentos...
      if (e.key === 'polibalbino_quotes' && e.newValue) {
        // ...a aba do Admin "ouve" e atualiza a própria lista na hora!
        setQuotes(JSON.parse(e.newValue));
      }
    };

    // Adiciona o "escutador" de eventos de armazenamento
    window.addEventListener('storage', sincronizarAbas);

    // Limpa o escutador quando o componente é fechado
    return () => window.removeEventListener('storage', sincronizarAbas);
  }, []);

  // BUSCA PRODUTOS NO BANCO DE DADOS (XAMPP)
  useEffect(() => {
    fetch(`${API_BASE}/produtos.php`, { headers: authHeaders() })
      .then(response => response.json())
      .then(data => {
        // Coloca os dados do banco dentro do seu estado inventory
        setInventory(data);
      })
      .catch(error => {
        console.error("Erro ao buscar produtos:", error);
      });
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/usuarios.php`, { headers: authHeaders() })
      .then(res => res.json())
      .then(data => {
        // O seu PHP retorna 'nome as name' e 'cargo as role', 
        // então o React vai entender perfeitamente!
        setUsersList(data);
      })
      .catch(err => console.error("Erro ao carregar usuários:", err));
  }, []);



  // --- FUNÇÕES DE GERENCIAMENTO DE USUÁRIOS (ADMIN) ---
  const handleCreateUser = async (e) => {
    e.preventDefault();

    // 1. Verificação: Não deixa criar sem os dados básicos
    if (!newUserFormData.name || !newUserFormData.email || !newUserFormData.password) {
      showToast("Por favor, preencha Nome, E-mail e Senha!", 'warning');
      return;
    }

    try {
      // 2. Manda o POST para o seu PHP
      const response = await fetch(`${API_BASE}/usuarios.php`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: newUserFormData.name,
          email: newUserFormData.email,
          password: newUserFormData.password,
          role: newUserFormData.role
        })
      });

      const result = await response.json();

      if (response.ok) {
        showToast(`Perfil de ${newUserFormData.name} salvo com sucesso!`);

        // 3. Limpa o formulário
        setNewUserFormData({ name: '', email: '', password: '', role: 'Vendedor' });

        // 4. ATUALIZA A TELA: Busca a lista atualizada do MySQL
        const res = await fetch(`${API_BASE}/usuarios.php`, { headers: authHeaders() });
        const data = await res.json();
        setUsersList(data);
      } else {
        showToast("Erro ao salvar: " + result.error, 'error');
      }
    } catch (error) {
      console.error("Erro na conexão:", error);
      showToast("O servidor XAMPP está desligado?", 'error');
    }
  };

  const handleDeleteUser = async (id) => {
    // Proteção: Verifique o ID do seu admin no banco (pode ser 1 em vez de 'u1')
    if (id === 1 || id === '1') {
      return showToast("O administrador principal não pode ser removido.", 'error');
    }

    if (window.confirm("Tem certeza que deseja excluir este acesso? O usuário não poderá mais logar.")) {
      try {
        // 🚩 Chamada DELETE passando o ID na URL
        const response = await fetch(`${API_BASE}/usuarios.php?id=${id}`, {
          method: 'DELETE',
          headers: authHeaders()
        });

        if (response.ok) {
          showToast("Usuário removido do banco de dados!");
          // Atualiza a lista na tela para o usuário sumir na hora
          setUsersList(usersList.filter(u => u.id !== id));
        } else {
          showToast("Erro ao remover do banco.", 'error');
        }
      } catch (error) {
        console.error("Erro ao deletar:", error);
      }
    }
  };

  // Adicionamos o "async" aqui no começo
  const handleDeleteCard = async (cardId) => {
    if (!currentUser) return;

    const cardParaDeletar = quotes.find(q => q.id === cardId);
    if (!cardParaDeletar) return;

    const ehAdmin = currentUser.role === 'Admin';
    const ehDono = cardParaDeletar.createdBy === currentUser.name;

    if (!ehAdmin && !ehDono) {
      showToast("Acesso negado: você não pode excluir este orçamento.", 'error');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir permanentemente o card de ${cardParaDeletar.client}?`)) {
      try {
        // 1. AVISAR O PHP (BANCO DE DADOS)
        const response = await fetch(`${API_BASE}/orcamentos.php`, {
          method: 'DELETE',
          headers: authHeaders(),
          body: JSON.stringify({ id: cardId }) // Mandamos o ID para o PHP
        });

        const resultado = await response.json();

        if (response.ok && !resultado.error) {
          // 2. SÓ APAGAMOS DA TELA SE O BANCO DEIXAR
          const novaListaGeral = quotes.filter(q => q.id !== cardId);
          setQuotes(novaListaGeral);

          // O seu useMemo (visibleQuotes) vai atualizar a tela sozinho aqui!

          if (selectedCard && selectedCard.id === cardId) {
            setSelectedCard(null);
            setIsCardModalOpen(false);
          }


        } else {
          showToast("Erro no banco de dados: " + (resultado.error || "Erro desconhecido"), 'error');
        }
      } catch (error) {
        console.error("Erro na conexão:", error);
        showToast("Falha ao conectar com o servidor Polibalbino.", 'error');
      }
    }
  };

  // --- ESTADOS DE PRODUTOS ---
  const [items, setItems] = useState();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLineFilter, setActiveLineFilter] = useState('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    codigo: '',
    descricao: '',
    quantidade_total: '',
    quantidade_reservada: 0, // Evita o NaN na criação.
    linha: 'PoliPrime',
    preco_quilo: ''
  });
  // --- INTEGRAÇÃO COM A API DE PRODUTOS ---
  const fetchProdutos = async () => {
    try {
      const response = await fetch(`${API_BASE}/produtos.php`, { headers: authHeaders() });
      const data = await response.json();

      // Se o PHP mandou os dados, a gente guarda nas duas variáveis!
      if (Array.isArray(data)) {
        // 1. Mantém o Estoque Principal da Victoria funcionando:
        setItems(data);

        // 2. Alimenta o Modal de Orçamento dos vendedores:
        setProdutosEstoque(data);
      }
    } catch (error) {
      console.error("Erro ao carregar materiais:", error);
    }
  };

  // Esse gatilho roda a busca assim que você abre o sistema
  useEffect(() => {
    if (currentUser) {
      fetchProdutos();
    }
  }, [currentUser]);



  const [cart, setCart] = useState([]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [quoteFormData, setQuoteFormData] = useState({ title: '', client: '' });

  // --- ESTADOS DE CRIAÇÃO NO KANBAN E DETALHES DO CARD (CRM) ---
  const [isKanbanModalOpen, setIsKanbanModalOpen] = useState(false);
  const [kanbanFormData, setKanbanFormData] = useState({
    titulo: '',
    cliente: '',
    status: 'Aberto'
  });

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardStep, setCardStep] = useState('details'); // 'details' | 'create-quote'
  const [cardForm, setCardForm] = useState({ cnpj: '', interestLevel: 'Médio', notes: '' });
  const [kanbanSelectedItem, setKanbanSelectedItem] = useState(null);
  const [quoteQuantity, setQuoteQuantity] = useState('');

  // --- ESTADOS DO HISTÓRICO DE ITENS ---
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedItemHistory, setSelectedItemHistory] = useState(null);



  // --- LÓGICA DE PESQUISA INTELIGENTE (VERSÃO POLIBALBINO) ---
  const filteredItems = useMemo(() => {
    let currentItems = items;

    // 1. FILTRO POR ABA (PoliPrime / PoliRec)
    if (activeLineFilter !== 'Todas') {
      // Trocamos item.line por item.linha
      currentItems = currentItems.filter(item => item.linha === activeLineFilter);
    }

    const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (searchTerms.length === 0) return currentItems;

    // 2. PESQUISA POR TEXTO
    const results = currentItems.map(item => {
      // Trocamos os nomes para bater com o MySQL: codigo, descricao e linha
      const searchableText = `${item.codigo} ${item.descricao} ${item.linha}`.toLowerCase();

      const score = searchTerms.reduce((acc, term) => {
        return acc + (searchableText.includes(term) ? 1 : 0);
      }, 0);

      return { item, score };
    });

    return results
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(result => result.item);
  }, [items, searchQuery, activeLineFilter]);

  // --- FORMATAÇÃO DE MOEDA ---
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // --- LÓGICA DE PRIVACIDADE: ADMIN VÊ TUDO, VENDEDOR VÊ O DELE ---
  const visibleQuotes = useMemo(() => {
    if (!currentUser) return [];

    // 1. Admin sempre vê tudo
    if (currentUser.role === 'Admin') {
      return quotes;
    }

    // 2. Filtro para Vendedor
    return quotes.filter(q => {
      const criadorId = String(q.createdBy || "").trim();
      const usuarioLogadoId = String(currentUser.id || "").trim();

      const nomeNoCard = String(q.createdBy || "").toLowerCase();
      const nomeDaAna = String(currentUser.name || "").toLowerCase();

      return criadorId === usuarioLogadoId || nomeNoCard === nomeDaAna;
    });
  }, [quotes, currentUser]);

  // --- FUNÇÕES DE CRUD DO CATÁLOGO (Apenas Admin) ---
  const handleOpenModal = (item = null) => {
    if (item) {
      // ESTAMOS EDITANDO: Carregamos os dados que vieram do Banco (PHP)
      setEditingItem(item);
      setFormData({
        id: item.id, // CRUCIAL: Sem o ID, o PHP não sabe qual linha atualizar!
        codigo: item.codigo,
        descricao: item.descricao,
        quantidade_total: item.quantidade_total,
        linha: item.linha || 'PoliPrime',
        preco_quilo: item.preco_quilo
      });
    } else {
      // ESTAMOS CRIANDO NOVO: Limpamos tudo
      setEditingItem(null);
      setFormData({
        id: '',
        codigo: '',
        descricao: '',
        quantidade_total: '',
        linha: 'PoliPrime',
        preco_quilo: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    // setGeminiError(''); <--- APAGUE OU COMENTE ESTA LINHA

    // Limpa o formulário para os nomes novos do seu banco
    setFormData({
      id: '',
      codigo: '',
      descricao: '',
      quantidade_total: '',
      linha: 'PoliPrime',
      preco_quilo: ''
    });
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();

    // 1. Preparamos os dados com os nomes exatos do banco
    // e garantimos que números sejam números (parseFloat)
    const produtoDados = {
      id: formData.id, // Se for edição, o ID vai aqui
      codigo: formData.codigo,
      descricao: formData.descricao,
      quantidade_total: parseFloat(formData.quantidade_total) || 0,
      preco_quilo: parseFloat(formData.preco_quilo) || 0,
      linha: formData.linha,
      quantidade_reservada: formData.id ? formData.quantidade_reservada : 0
    };

    try {
      // 2. Decidimos se vamos Criar (POST) ou Editar (PUT)
      const metodo = formData.id ? 'PUT' : 'POST';

      const response = await fetch(`${API_BASE}/produtos.php`, {
        method: metodo,
        headers: authHeaders(),
        body: JSON.stringify(produtoDados)
      });

      if (response.ok) {
        // 3. Se deu certo no banco, atualizamos a tela
        await fetchProdutos(); // Chama a função que busca do banco
        handleCloseModal();    // Fecha o modal e limpa os campos
        showToast(formData.id ? "Produto atualizado!" : "Produto criado com sucesso!");
      } else {
        showToast("Erro ao salvar no banco de dados.", 'error');
      }
    } catch (error) {
      console.error("Erro na conexão com a API:", error);
      showToast("Não foi possível conectar ao servidor XAMPP.", 'error');
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      try {
        const response = await fetch(`${API_BASE}/produtos.php?id=${id}`, {
          method: 'DELETE',
          headers: authHeaders()
        });

        if (response.ok) {
          // Só remove da tela após confirmação do banco
          await fetchProdutos();
        } else {
          const data = await response.json();
          showToast('Erro ao excluir produto: ' + (data.error || 'Erro desconhecido'), 'error');
        }
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        showToast('Não foi possível conectar ao servidor.', 'error');
      }
    }
  };


  // --- FUNÇÕES DE ORÇAMENTO E KANBAN ---
  // --- FUNÇÕES DE ORÇAMENTO E KANBAN ---
  const handleCreateBasicCard = async (e) => {
    if (e) e.preventDefault();

    const newQuote = {
      titulo: kanbanFormData.title || `Orçamento #${quotes.length + 101}`,
      cliente: kanbanFormData.client || 'Cliente Padrão',
      status: 'Aberto',
      valor_total: 0,
      cnpj: '',
      observacoes: '',
      // Enviamos como createdBy para o PHP entender
      createdBy: currentUser?.id
    };

    try {
      const response = await fetch(`${API_BASE}/orcamentos.php`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(newQuote)
      });

      const data = await response.json();

      if (response.ok) {
        await fetchQuotes(); // Atualiza a lista vinda do banco
        setIsKanbanModalOpen(false);
        setKanbanFormData({ title: '', client: '' });

      } else {
        showToast("Erro ao salvar: " + data.error, 'error');
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      showToast("Não foi possível conectar ao servidor.", 'error');
    }
  };

  const openKanbanModal = () => {
    setKanbanFormData({ title: '', client: '' });
    setIsKanbanModalOpen(true);
  };

  const openCardDetails = (quote) => {
    // 1. Criamos as permissões garantindo que os IDs sejam tratados como TEXTO
    const isAdmin = currentUser?.role === 'Admin';

    // 🚩 O PULO DO GATO: Usar String() para evitar erro de tipo (ex: 4 vs "4")
    const isOwner = String(quote.createdBy) === String(currentUser?.id);

    // 2. Verificação de acesso
    if (!isAdmin && !isOwner) {
      showToast("Você não tem permissão para abrir este orçamento.", 'error');
      return;
    }

    // 3. Se chegou aqui, ele abre o modal normalmente
    setSelectedCard(quote);
    setCardForm({
      cnpj: quote.cnpj || '',
      interestLevel: quote.interestLevel || 'Médio',
      notes: quote.notes || ''
    });
    setCardStep('details');
    setIsCardModalOpen(true);
  };

  const saveCardDetails = async () => {
    if (!selectedCard || !selectedCard.id) {
      showToast("Erro: Card não identificado.", 'error');
      return;
    }

    // 🚩 A "FUSÃO" COM TRADUÇÃO DE NOMES:
    const dadosAtualizados = {
      ...selectedCard,    // 1º: Mantém os dados técnicos do banco
      ...cardForm,        // 2º: Pega as edições do formulário
      id: selectedCard.id,
      cnpj: cardForm.cnpj || selectedCard.cnpj,

      // 🚩 O SEGREDO: Aqui a gente mapeia o 'notes' do React para 'observacoes' do PHP
      observacoes: cardForm.notes
    };

    try {
      const response = await fetch(`${API_BASE}/atualizar_orcamento.php`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(dadosAtualizados)
      });

      if (response.ok) {
        // Atualiza o card na memória com os novos dados
        setSelectedCard(dadosAtualizados);

        await fetchQuotes();
        showToast("Dados do cliente salvos com sucesso!");
      }
    } catch (error) {
      console.error("Erro na conexão:", error);
    }
  };

  const handleAddToQuote = (e) => {
    if (e) e.preventDefault();

    if (!kanbanSelectedItem) return showToast("Selecione um item no estoque.", 'warning');

    const qty = Number(quoteQuantity);
    const available = Number(kanbanSelectedItem.quantidade_total || 0) - Number(kanbanSelectedItem.reservedQuantity || 0);

    if (qty <= 0) return showToast("A quantidade deve ser maior que zero.", 'warning');
    if (qty > available) return showToast(`Estoque insuficiente! Disponível: ${available}kg`, 'warning');

    // 1. Criamos o novo item com um ID único para podermos excluir depois se precisar
    const newItem = {
      id: Date.now(),
      item: kanbanSelectedItem,
      quantity: qty
    };

    // 2. Pegamos a lista que já existe ou criamos uma vazia se for o primeiro item
    const currentItems = selectedCard.items || [];

    // 3. Montamos o card atualizado SOMANDO o novo item à lista
    const updatedCard = {
      ...selectedCard,
      items: [...currentItems, newItem],
      cnpj: extraQuoteData.cnpj,
      contato: extraQuoteData.contato,
      transportadora: extraQuoteData.transportadora,
      frete: extraQuoteData.frete,
      localRetirada: extraQuoteData.localRetirada,
      formaPagamento: extraQuoteData.formaPagamento,
      dataVencimento: extraQuoteData.dataVencimento,
      parcelas: extraQuoteData.parcelas
    };




    // 4. Atualizamos o estado global e o card selecionado
    setQuotes(quotes.map(q => q.id === selectedCard.id ? updatedCard : q));
    setSelectedCard(updatedCard);

    // 5. Limpamos a seleção para o vendedor escolher o PRÓXIMO material
    setKanbanSelectedItem(null);
    setQuoteQuantity('');

    // Não mudamos o 'setCardStep' para o usuário continuar na mesma tela adicionando itens
  };


  // --- LÓGICA DO KANBAN E RESERVA DE MATERIAIS AUTOMÁTICA ---
  const handleDragStart = (e, quoteId) => {
    e.dataTransfer.setData('quoteId', quoteId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const quoteId = Number(e.dataTransfer.getData('quoteId'));

    // 1. Localiza o card na sua lista oficial (quotes) para checar o valor
    const quote = quotes.find(q => Number(q.id) === quoteId);

    // 2. REGRA DE NEGÓCIO: Só vai para 'Ganho' se o valor_total for > 0
    // Se for para 'Perdido', geralmente deixamos passar mesmo sem valor.
    if (newStatus === 'Ganho') {
      const temOrcamento = quote && Number(quote.valor_total) > 0;

      if (!temOrcamento) {
        showToast("Não é possível fechar um card sem orçamento gerado.", 'warning');
        return; // Interrompe a função aqui e o card volta para o lugar de origem
      }
    }

    // 3. Se passar na validação (ou se for outra coluna), atualiza normal
    updateQuoteStatus(quoteId, newStatus);
  };

  const updateQuoteStatus = async (quoteId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE}/atualizar_status.php`, {
        method: 'POST', // O seu arquivo atualizar_status usa POST
        headers: authHeaders(),
        body: JSON.stringify({
          id: quoteId,
          status: newStatus
        })
      });

      if (response.ok) {
        await fetchQuotes(); // Recarrega os cards no Kanban

        // Se houver a função de carregar produtos, chama ela para atualizar o estoque na tela
        if (typeof fetchProdutos === 'function') {
          fetchProdutos();
        }
      }
    } catch (error) {
      console.error("Erro ao mover card:", error);
    }
  };

  // const getItemQuoteStats = (itemId) => quotes.filter(q => q.items.some(qi => qi.item.id === itemId));
  const getItemQuoteStats = (productId) => {
    // 1. Se 'quotes' (orçamentos) ainda não carregou ou não é uma lista, retorna vazio
    if (!quotes || !Array.isArray(quotes)) return [];

    return quotes.filter(quote => {
      // 2. Usamos o ?. para garantir que 'items' existe dentro do orçamento
      // E checamos se o item e o id dele existem antes de comparar
      return quote.items?.some(item => item?.id === productId);
    });
  };
  const openHistoryModal = (item) => { setSelectedItemHistory(item); setIsHistoryModalOpen(true); };

  // --- RENDERIZADORES ---
  const renderCatalog = () => (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <div className="relative w-full md:w-3/5 lg:w-1/2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Search size={20} /></div>
          <input type="text" placeholder='Pesquise itens no estoque global...' className="block w-full pl-10 pr-3 py-3 border rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => handleOpenModal()} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-medium shadow-sm transition-colors">
            <Plus size={20} /> Novo Item
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['Todas', 'PoliPrime', 'PoliRec'].map(line => (
          <button key={line} onClick={() => setActiveLineFilter(line)} className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeLineFilter === line ? 'bg-gray-800 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {line === 'Todas' ? 'Todas as Linhas' : `Linha ${line}`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Código</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Descrição & Preço</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Estoque (Disp/Res/Tot)</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Em Orçamentos</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems?.map((item) => {
                // Ajustamos o cálculo para os novos nomes do banco
                const available = Number(item.quantidade_total) - Number(item.quantidade_reservada);
                const relatedQuotes = getItemQuoteStats(item.id);

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-blue-600 font-mono font-bold">
                        {item.codigo}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 line-clamp-2">{item.descricao}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.linha === 'PoliPrime' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                          {item.linha}
                        </span>
                        <span className="text-sm font-bold text-green-700">
                          {/* Se formatCurrency não funcionar, use: R$ {parseFloat(item.preco_quilo).toFixed(2)} */}
                          {formatCurrency(item.preco_quilo)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${available > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {available} Disp
                        </span>
                        <div className="text-xs text-gray-500">
                          <span className="text-orange-600 font-medium">{item.quantidade_reservada} Res</span> / {item.quantidade_total} Tot
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => openHistoryModal(item)} className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 hover:ring-2 hover:ring-indigo-300 transition-all">
                        {relatedQuotes.length} Gerados
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleOpenModal(item)} className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-gray-500 hover:text-red-600 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderKanban = () => {
    const columns = [
      { id: 'Aberto', title: 'Em Aberto', icon: <Clock size={18} />, color: 'bg-yellow-100 border-yellow-200 text-yellow-800' },
      { id: 'Ganho', title: 'Fechado (Ganho)', icon: <CheckCircle size={18} />, color: 'bg-green-100 border-green-200 text-green-800' },
      { id: 'Perdido', title: 'Fechado (Perdido)', icon: <XCircle size={18} />, color: 'bg-red-100 border-red-200 text-red-800' }
    ];

    return (
      <div className="animate-in fade-in duration-300 h-full flex flex-col">
        <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600 text-sm bg-white p-3 rounded-lg border border-gray-200 flex-1 w-full">
            <AlertCircle size={16} className="text-blue-500 flex-shrink-0" />
            <span>Fluxo de Venda: Crie o Card Básico no Kanban. Ao clicar nele, você poderá adicionar histórico, anexos e gerar o orçamento integrado ao estoque.</span>
          </div>
          <button
            onClick={openKanbanModal}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-colors whitespace-nowrap"
          >
            <Plus size={20} /> Criar Card Inicial
          </button>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {columns.map(col => (
            <div key={col.id} className={`flex flex-col rounded-xl border-2 border-dashed ${col.id === 'Aberto' ? 'border-yellow-200 bg-yellow-50/30' : col.id === 'Ganho' ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'} p-3 min-h-[500px] transition-colors`} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)}>

              {/* 1. ALTERADO: Agora o contador usa visibleQuotes */}
              <div className={`flex items-center gap-2 p-2 mb-4 rounded-lg font-bold border ${col.color}`}>
                {col.icon} {col.title} ({visibleQuotes.filter(q => q.status === col.id).length})
              </div>

              <div className="flex flex-col gap-3">
                {/* 2. ALTERADO: Agora o map usa visibleQuotes para ocultar cards de outros */}
                {visibleQuotes.filter(q => q.status === col.id).map(quote => {
                  // Adicionamos o (quote.items || []) para garantir que sempre haja uma lista, mesmo que vazia
                  const valorTotal = (quote.items || []).reduce((acc, curr) => {
                    // 1. Buscamos o preço (usando o nome que está no seu banco)
                    const preco = Number(curr.item?.preco_quilo || 0);

                    // 2. Buscamos a quantidade
                    const qtd = Number(curr.quantity || 0);

                    return acc + (preco * qtd);
                  }, 0);
                  return (
                    <div
                      key={quote.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, quote.id)}

                      // 🚩 MUDANÇA AQUI: Libera o clique para o dono ou para o Admin
                      onClick={() => {
                        const isAdmin = currentUser?.role === 'Admin';
                        // 🚩 Usamos String() nos dois lados para garantir que "4" seja igual a 4
                        const isOwner = String(quote.createdBy) === String(currentUser?.id);

                        if (isAdmin || isOwner) {
                          openCardDetails(quote);
                        } else {
                          showToast("Você só pode abrir seus próprios orçamentos.", 'error');
                        }
                      }}

                      // Mantenha as classes do Tailwind como estão
                      className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-400 transition-all group"
                    >
                      {/* LINHA DO TOPO: Título, ID e Lixeira */}
                      <div className="flex justify-between items-start mb-2">
                        {/* MUDANÇA AQUI: de quote.title para quote.titulo */}
                        <h4
                          className="font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors"
                          title={quote.titulo}
                        >
                          {quote.titulo || "Sem Título"}
                        </h4>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-400">#{quote.id}</span>

                          {/* Verifique se o banco de dados envia 'createdBy' ou 'criado_por' */}
                          {currentUser && (quote.createdBy === currentUser.id || currentUser.role === 'Admin') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCard(quote.id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir orçamento"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 font-medium mb-3">Cli: {quote.cliente}</p>

                      {/* Mudamos a pergunta: Agora ele olha para o valor_total do banco */}
                      {Number(quote.valor_total) > 0 ? (
                        <div className="space-y-1 mb-3 bg-green-50 p-2 rounded border border-green-100">
                          <div className="flex justify-between items-center text-xs text-green-700 font-bold uppercase tracking-wider">
                            <span>Orçamento Gerado</span>
                            <span className="text-sm">
                              {/* Formata o valor para R$ */}
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.valor_total)}
                            </span>
                          </div>

                          {/* Se você quiser tentar mostrar os códigos se eles existirem */}
                          {quote.items && quote.items.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-green-100">
                              {quote.items.map((qi, idx) => (
                                <div key={idx} className="flex justify-between text-[10px] text-green-600">
                                  <span className="truncate">{qi.item?.codigo || qi.produto_codigo}</span>
                                  <span className="font-bold">{qi.quantity || qi.quantidade}x</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mb-3 text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-100 flex items-center gap-1 font-medium">
                          <AlertCircle size={14} /> Sem orçamento gerado
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <User size={12} />
                          {/* A MÁGICA: Ele ignora o texto antigo e busca o nome real e atual na lista de usuários */}
                          {usersList.find(u => u.id === quote.createdBy || u.name === quote.createdBy)?.name || quote.createdBy}
                        </span>

                        {(quote?.items?.length > 0) && (
                          <span className="text-sm font-bold text-green-700">
                            {formatCurrency(valorTotal)}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- ABA DE GERENCIAMENTO DE PERFIS ---
  const renderTabPerfis = () => (
    <div className="animate-in fade-in duration-300 max-w-[1000px] mx-auto py-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gerenciamento de Perfis</h2>
          <p className="text-gray-500 text-sm mt-1">Crie e gerencie os acessos de vendedores e administradores.</p>
        </div>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="bg-[#1E293B] hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <User size={18} /> Novo Usuário
        </button>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500 font-semibold">
              <th className="p-4 pl-6 uppercase">Nome do Usuário</th>
              <th className="p-4 uppercase w-48">Nível de Acesso</th>
              <th className="p-4 uppercase text-center w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usersList.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="p-4 pl-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{user.name}</div>
                    {user.email && <div className="text-xs text-gray-500">{user.email}</div>}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                    }`}>
                    {user.role === 'Admin' ? 'Administrador' : 'Vendedor'}
                  </span>
                </td>
                <td className="p-4">
                  {user.id !== 'u1' && (
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => handleDeleteUser(user.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Excluir Usuário">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Adicionar Usuário */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Adicionar Novo Usuário</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(e) => { handleCreateUser(e); setShowAddUserModal(false); }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input type="text" required value={newUserFormData.name} onChange={(e) => setNewUserFormData({ ...newUserFormData, name: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: João da Silva" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail de Acesso</label>
                <input type="email" required value={newUserFormData.email} onChange={(e) => setNewUserFormData({ ...newUserFormData, email: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: joao@polibalbino.com.br" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha de Acesso</label>
                <input type="password" required value={newUserFormData.password} onChange={(e) => setNewUserFormData({ ...newUserFormData, password: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Acesso</label>
                <select value={newUserFormData.role} onChange={(e) => setNewUserFormData({ ...newUserFormData, role: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="Vendedor">Vendedor</option>
                  <option value="Admin">Administrador</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowAddUserModal(false)} className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-lg font-medium bg-[#1D4ED8] text-white hover:bg-blue-700 transition-colors">Criar Usuário</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );


  // --- TELA DE LOGIN ---
  const renderLoginScreen = () => {

    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-8">
            {/* Logo Centralizada */}
            <img
              src="/logo-header.png"
              alt="Grupo Polibalbino"
              className="h-20 w-auto mx-auto mb-6 object-contain"
              onError={(e) => { e.target.src = "https://via.placeholder.com/250x80?text=POLIBALBINO"; }}
            />
            <h2 className="text-2xl font-bold text-gray-800">Acesso ao Sistema</h2>
            <p className="text-gray-500 text-sm mt-1">Insira suas credenciais para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {loginError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium text-center border border-red-200">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">E-mail corporativo</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full p-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                placeholder="exemplo@polibalbino.com.br"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Senha</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full p-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  };

  const handleLogout = () => {
    setCurrentUser(null);   // Desloga o usuário
    setLoginEmail('');      // Limpa o campo de e-mail
    setLoginPassword('');   // Limpa o campo de senha
    setLoginError('');      // Limpa qualquer mensagem de erro
    localStorage.removeItem('polibalbino_token'); // 🔐 Remove o token de autenticação
  };

  /*DASHBOARD - GRAFICOS*/
  const renderDashboard = () => {
    // 1. Filtrar os orçamentos com base no perfil selecionado
    const filteredQuotes = dashboardFilter === 'Todos'
      ? quotes
      : quotes.filter(q => q.createdBy === dashboardFilter);

    // 2. Cálculos baseados nos dados filtrados
    const total = filteredQuotes.length;
    const ganhos = filteredQuotes.filter(q => q.status === 'Ganho').length;
    const perdidos = filteredQuotes.filter(q => q.status === 'Perdido').length;
    const abertos = filteredQuotes.filter(q => q.status === 'Aberto').length;
    const taxaConversao = total > 0 ? Math.round((ganhos / total) * 100) : 0;

    // 3. Ranking de Vendedores (CORRIGIDO: Agora compara ID com ID)
    const desempenhoVendedores = usersList
      .filter(u => u.role === 'Vendedor')
      .map(vendedor => ({
        name: vendedor.name,
        // Mudamos de q.createdBy === vendedor.name para vendedor.id
        count: quotes.filter(q => q.status === 'Ganho' && q.createdBy === vendedor.id).length
      }))
      .sort((a, b) => b.count - a.count);

    // Lista de vendedores para o Select (Usaremos o ID no value do Select)
    const vendedores = usersList.filter(u => u.role === 'Vendedor');

    return (
      <div className="animate-in fade-in duration-500 space-y-8">
        {/* Cabeçalho */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Painel de Orçamentos (Admin)</h2>
            {/* Ajuste técnico: Se não for 'Todos', procuramos o nome do vendedor na lista pelo ID */}
            <p className="text-slate-500">
              Visão geral de performance {dashboardFilter === 'Todos'
                ? 'da equipe'
                : `de ${usersList.find(u => u.id === dashboardFilter)?.name || 'Vendedor'}`
              }.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase">Filtrar Vendedor:</span>
            <select
              value={dashboardFilter}
              onChange={(e) => setDashboardFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-none pr-4 cursor-pointer"
            >
              <option value="Todos">Todos os Perfis</option>
              {vendedores.map(v => (
                // O SEGREDO: O 'value' agora envia o ID, mas o usuário continua lendo o NOME
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Cards de Métricas Superiores */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border-b-4 border-blue-500 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><Clock size={24} /></div>
              <span className="text-[10px] font-black text-slate-300 uppercase">Total</span>
            </div>
            <h3 className="text-4xl font-black text-slate-800">{total}</h3>
            <p className="text-slate-400 text-sm font-medium mt-1">Orçamentos gerados</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border-b-4 border-green-500 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-green-50 rounded-2xl text-green-600"><CheckCircle size={24} /></div>
              <span className="text-[10px] font-black text-slate-300 uppercase">Fechados</span>
            </div>
            <h3 className="text-4xl font-black text-slate-800">{ganhos}</h3>
            <p className="text-slate-400 text-sm font-medium mt-1">Conversão de sucesso</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border-b-4 border-red-500 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-red-50 rounded-2xl text-red-600"><XCircle size={24} /></div>
              <span className="text-[10px] font-black text-slate-300 uppercase">Perdidos</span>
            </div>
            <h3 className="text-4xl font-black text-slate-800">{perdidos}</h3>
            <p className="text-slate-400 text-sm font-medium mt-1">Sem fechamento</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border-b-4 border-purple-500 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-50 rounded-2xl text-purple-600"><TrendingUp size={24} /></div>
              <span className="text-[10px] font-black text-slate-300 uppercase">Taxa Média</span>
            </div>
            <h3 className="text-4xl font-black text-slate-800">{taxaConversao}%</h3>
            <p className="text-slate-400 text-sm font-medium mt-1">Performance de vendas</p>
          </div>
        </div>

        {/* Área de Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Lado Esquerdo: Distribuição de Status */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <PieChart size={20} className="text-blue-500" /> Distribuição de Status
            </h4>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-slate-600">Ganhos</span>
                  <span className="text-slate-800">{ganhos} ({total > 0 ? Math.round((ganhos / total) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full transition-all duration-1000" style={{ width: `${total > 0 ? (ganhos / total) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-slate-600">Perdidos</span>
                  <span className="text-slate-800">{perdidos} ({total > 0 ? Math.round((perdidos / total) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full transition-all duration-1000" style={{ width: `${total > 0 ? (perdidos / total) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-slate-600">Abertos</span>
                  <span className="text-slate-800">{abertos} ({total > 0 ? Math.round((abertos / total) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${total > 0 ? (abertos / total) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Lado Direito: Só mostra o Ranking se o filtro for "Todos" */}
          {dashboardFilter === 'Todos' ? (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-500" /> Desempenho por Vendedor
              </h4>
              <div className="space-y-5">
                {desempenhoVendedores.map((v, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded-full text-[10px] text-slate-400">{idx + 1}º</span>
                        <span className="text-slate-700">{v.name}</span>
                      </div>
                      <span className="text-slate-800">{v.count} fechados</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      {/* Barra baseada no total de ganhos da equipe para comparação visual */}
                      <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${quotes.filter(q => q.status === 'Ganho').length > 0 ? (v.count / quotes.filter(q => q.status === 'Ganho').length) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Se um vendedor estiver selecionado, mostramos uma mensagem ou um resumo simples */
            <div className="bg-blue-600 p-8 rounded-3xl shadow-lg flex flex-col justify-center items-center text-white text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 border-4 border-white/30">
                <User size={40} />
              </div>
              <h4 className="text-xl font-bold mb-2">
                Perfil: {usersList.find(u => u.id === dashboardFilter)?.name || dashboardFilter}
              </h4>
              <p className="text-blue-100 text-sm">Mostrando resultados individuais de performance e conversão no funil de vendas.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- NOVA TELA DE IMPRESSÃO (NO PRÓPRIO SISTEMA) ---
  const renderPreviewPDF = () => {
    if (!selectedCard) return null;

    // 1. Cálculos: Prioriza o valor_total do banco (importante para o TCC!)
    const totalValue = Number(selectedCard.valor_total) || selectedCard.items?.reduce((acc, curr) =>
      acc + (Number(curr.item?.preco_quilo || curr.preco_unitario || 0) * Number(curr.quantity || curr.quantidade || 0)), 0) || 0;

    const totalVolume = selectedCard.items?.reduce((acc, curr) =>
      acc + Number(curr.quantity || curr.quantidade || 0), 0) || 0;

    // 2. Lógica de Datas (Ajustado para o banco: data_vencimento)
    const emissaoDate = new Date();
    const dataPropostaStr = emissaoDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    const dataVenc = selectedCard.data_vencimento || selectedCard.dataVencimento;
    const validityDateStr = dataVenc ? dataVenc.split('-').reverse().join('/') : 'A combinar';

    // 3. Lógica de Parcelas (O SEGREDO DO CÁLCULO)
    const formaPag = selectedCard.forma_pagamento || selectedCard.formaPagamento || 'Boleto';
    const isVista = formaPag.toUpperCase().includes('PIX') || formaPag.toUpperCase().includes('VISTA');

    // 🛡️ PROTEÇÃO: Se vier "6x", o replace deixa apenas "6" para a conta funcionar
    const parcelasRaw = String(selectedCard.parcelamento || selectedCard.parcelas || "1");
    const numParcelas = isVista ? 1 : (parseInt(parcelasRaw.replace(/\D/g, '')) || 1);

    const parcelaValue = totalValue / numParcelas;

    const installments = isVista
      ? [{ num: 1, date: validityDateStr, value: totalValue }]
      : Array.from({ length: numParcelas }).map((_, index) => {
        const d = new Date(emissaoDate);
        d.setDate(d.getDate() + (30 * (index + 1)));
        return { num: index + 1, date: d.toLocaleDateString('pt-BR'), value: parcelaValue };
      });

    return (
      // O restante do seu layout continua igual aqui abaixo...
      <div className="absolute inset-0 z-50 bg-slate-200 p-4 sm:p-8 font-sans overflow-y-auto">
        <style type="text/css" media="print">
          {`
          @page { size: A4 portrait; margin: 0mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        `}
        </style>

        {/* Controles fora da impressão */}
        <div className="max-w-[1000px] mx-auto mb-6 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-4">
            <button onClick={() => setCardStep('details')} className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium bg-white px-4 py-2 rounded-md shadow-sm">
              <ArrowLeft size={18} /> Voltar ao Card
            </button>
            <h2 className="text-xl font-semibold text-slate-800">Pré-visualização do Orçamento</h2>
          </div>
          <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md font-semibold flex items-center gap-2 shadow-sm transition-colors">
            <FileText size={18} /> Imprimir / Salvar PDF
          </button>
        </div>

        <div className="max-w-[1000px] mx-auto bg-white shadow-2xl print:shadow-none overflow-hidden min-h-[1414px] flex flex-col" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>

          {/* HEADER PRINCIPAL */}
          <div className="bg-[#001529] text-white flex justify-between items-center px-10 py-8 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-1/2 h-full bg-[#001e3b] transform skew-x-[30deg] translate-x-20 origin-top-right z-0"></div>
            <div className="flex items-center gap-4 z-10">
              <img src="/logo-polibalbino.png" alt="Logo Polibalbino" className="h-24 w-auto object-contain" />
            </div>
            <div className="text-right z-10 flex flex-col items-end">
              <p className="text-sm font-medium text-blue-200 mb-1 uppercase tracking-widest">Fale Conosco</p>
              <div className="flex items-center gap-2 text-2xl font-bold">
                <Phone size={24} className="text-blue-400" fill="currentColor" />
                (11) 99462-3844
              </div>
            </div>
          </div>

          {/* SUB-HEADER */}
          <div className="bg-slate-50 px-10 py-3 border-b border-slate-200 flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-[#001529] font-bold">
              <Package size={18} /> COTAÇÃO | PROPOSTA COMERCIAL
            </div>
            <div className="text-blue-600 font-medium">
              Nº {selectedCard.id} | {dataPropostaStr}
            </div>
          </div>

          <div className="p-10 space-y-8">
            <div className="flex gap-6">
              <div className="flex-1 space-y-6">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                  <h3 className="flex items-center gap-2 text-xs font-bold text-[#001529] mb-4 uppercase tracking-widest">
                    <User size={16} /> Dados do Cliente
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-slate-200 border-dashed pb-2">
                      <span className="text-slate-500">Razão Social:</span>
                      {/* Mudança: cliente */}
                      <span className="text-slate-800 font-medium text-right">{selectedCard.cliente || selectedCard.client}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 border-dashed pb-2">
                      <span className="text-slate-500">CNPJ:</span>
                      <span className="text-slate-800 font-medium">{selectedCard.cnpj || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-slate-500">A/C Contato:</span>
                      <span className="text-blue-600 font-bold uppercase">{selectedCard.contato || 'Compras'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                  <h3 className="flex items-center gap-2 text-xs font-bold text-[#001529] mb-4 uppercase tracking-widest">
                    <Truck size={16} /> Informações Logísticas
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-slate-200 border-dashed pb-2">
                      <span className="text-slate-500">Transportadora:</span>
                      <span className="text-slate-800 font-medium">{selectedCard.transportadora || 'A definir'}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-slate-500">Frete / Entrega:</span>
                      {/* Mudança: tipo_frete e local_retirada */}
                      <span className="text-slate-800 font-medium">
                        {(selectedCard.tipo_frete || selectedCard.frete || 'FOB')} - {(selectedCard.local_retirada || selectedCard.localRetirada || 'Matriz')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-[1.2] bg-slate-50 border border-slate-200 rounded-xl p-8 flex flex-col justify-center text-center">
                <p className="text-xs font-bold tracking-wider text-blue-600 mb-2 uppercase">Valor Total da Proposta</p>
                <h2 className="text-[2.75rem] font-black text-[#001529] leading-none mb-8">
                  {formatCurrency(totalValue)}
                </h2>
                <div className="w-full h-px bg-slate-200 mb-6"></div>
                <div className="flex justify-between px-4">
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Volume Total</p>
                    <p className="text-lg font-bold text-slate-800">{totalVolume} kg</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Validade</p>
                    <p className="text-lg font-bold text-[#DC2626]">{validityDateStr}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* TABELA DE PRODUTOS */}
            <div>
              <div className="bg-[#001529] text-white rounded-t-lg px-6 py-4 flex justify-between items-center">
                <h3 className="font-bold text-sm tracking-widest">RELAÇÃO DE PRODUTOS</h3>
                <span className="text-xs text-slate-300 font-medium">MOEDA: REAL (R$)</span>
              </div>
              <div className="border border-slate-200 border-t-0 rounded-b-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-white border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-4 px-6 text-left font-semibold">Produto / Descrição</th>
                      <th className="py-4 px-6 text-center font-semibold w-32">Qnt. (kg)</th>
                      <th className="py-4 px-6 text-right font-semibold w-32">Preço Unit.</th>
                      <th className="py-4 px-6 text-right font-semibold w-40">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedCard?.items?.map((it, index) => {
                      const precoUnitario = Number(it.item?.preco_quilo || it.preco_unitario || 0);
                      const quantidade = Number(it.quantity || it.quantidade || 0);
                      const subtotal = precoUnitario * quantidade;

                      return (
                        <tr key={index} className="bg-white hover:bg-slate-50 transition-colors">
                          <td className="py-5 px-6 font-bold text-[#001529]">
                            {it.item?.codigo || it.produto_codigo || "S/ CÓDIGO"}
                            <span className="font-normal text-slate-500 text-xs block">
                              {it.item?.descricao || it.item?.description || "Material Polibalbino"}
                            </span>
                          </td>
                          <td className="py-5 px-6 text-center text-slate-700 font-medium">{quantidade}</td>
                          <td className="py-5 px-6 text-right text-slate-500">{formatCurrency(precoUnitario)}</td>
                          <td className="py-5 px-6 text-right font-black text-slate-800 text-base">{formatCurrency(subtotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-6 relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="flex items-center gap-2 text-sm font-black text-green-800 uppercase tracking-widest">
                  <TrendingUp size={18} /> CONDIÇÕES DE PAGAMENTO
                </h3>
                <span className="bg-green-200 text-green-900 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
                  {formaPag} {isVista ? '' : `- ${numParcelas}X`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {installments.map((parc) => (
                  <div key={parc.num} className="bg-white border border-green-200 rounded-xl p-5 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-[10px] font-black text-green-600 mb-1 uppercase tracking-widest">Parcela {parc.num}/{numParcelas}</p>
                      <p className="text-sm font-bold text-slate-700">{parc.date}</p>
                    </div>
                    <p className="text-xl font-black text-slate-900">{formatCurrency(parc.value)}</p>
                  </div>
                ))}
              </div>

              <div className="bg-green-800 text-white rounded-xl p-5 flex justify-between items-center shadow-lg">
                <span className="font-black text-xs tracking-widest uppercase opacity-80">{isVista ? 'TOTAL A PAGAR' : 'TOTAL PARCELADO'}</span>
                <span className="text-3xl font-black">{formatCurrency(totalValue)}</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-8 border-t border-slate-100">
              Polibalbino Termoplásticos © {new Date().getFullYear()} - Documento gerado via sistema
            </div>
          </div>
        </div>
      </div>
    );
  };
  const handleAdjustQuantity = (itemCode, amount) => {
    if (!selectedCard) return;

    const updatedItems = selectedCard.items.map(it => {
      if (it.item.code === itemCode) {
        // 1. Buscamos o material no estado 'inventory' (que tem as reservas atualizadas)
        const mat = inventory.find(m => m.code === itemCode);

        // 2. Cálculo da Verdade:
        // O limite não é o total, é: (O que eu já tenho no carrinho) + (O que ainda sobra na prateleira)
        const estoqueTotal = Number(mat?.quantity || 0);
        const reservadoTotal = Number(mat?.reservedQuantity || 0);
        const disponivelAgora = estoqueTotal - reservadoTotal;

        const limiteMaximoDesteCard = it.quantity + disponivelAgora;

        let novaQuantidade = it.quantity + amount;

        // 3. Trava de Segurança
        if (novaQuantidade > limiteMaximoDesteCard) {
          showToast(`Estoque insuficiente! Máximo disponível: ${limiteMaximoDesteCard}kg.`, 'warning');
          novaQuantidade = limiteMaximoDesteCard;
        }

        if (novaQuantidade < 0) novaQuantidade = 0;

        return { ...it, quantity: novaQuantidade };
      }
      return it;
    }).filter(it => it.quantity > 0);

    saveUpdatedItems(updatedItems);
  };
  // 2. Remover item
  const handleRemoveItem = (itemCode) => {
    if (!selectedCard) return;

    const updatedItems = selectedCard.items.filter(it => it.item.code !== itemCode);
    saveUpdatedItems(updatedItems);
  };

  const saveUpdatedItems = (newItems) => {
    const updatedCard = { ...selectedCard, items: newItems };
    setSelectedCard(updatedCard);

    // 1. Atualiza os orçamentos no Kanban
    const newQuotes = quotes.map(q => q.id === selectedCard.id ? updatedCard : q);
    setQuotes(newQuotes);

    // 2. ATUALIZA O INVENTÁRIO (Zerando e contando do zero para não negativar)
    setInventory(prevInventory => prevInventory.map(material => {
      // IMPORTANTE: Só contamos materiais que estão em cards "Abertos" ou "Em Negociação"
      // Se o card for "Perdido", ele não deve reservar estoque!
      const totalReservado = newQuotes.reduce((acc, q) => {
        // Se o orçamento foi "Perdido", não conta no reservado
        if (q.status === 'Perdido') return acc;

        // MUDANÇA AQUI: Adicionado (q.items || []) e trocado .code por .codigo
        const itemNoOrcamento = (q.items || []).find(it => it.item?.codigo === material.codigo);

        // MUDANÇA AQUI: Adicionado || 0 por segurança
        return acc + (itemNoOrcamento ? Number(itemNoOrcamento.quantity || 0) : 0);
      }, 0);

      return {
        ...material,
        reservedQuantity: totalReservado // Aqui ele define o valor real, sem "fantasmas"
      };
    }));
  };
  const handleUpdateCard = async () => {
    const payload = {
      id: selectedCard.id,
      titulo: selectedCard.titulo || selectedCard.title,
      cliente: selectedCard.cliente || selectedCard.client,
      status: selectedCard.status,
      observacoes: selectedCard.observacoes
    };

    try {
      const response = await fetch(`${API_BASE}/atualizar_orcamentos.php`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast("Informações atualizadas!");
        await fetchQuotes(); // Atualiza a lista no Kanban
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans selection:bg-blue-200">

      {/* --- INÍCIO DA TRANCA DE LOGIN --- */}
      {!currentUser ? (
        renderLoginScreen()
      ) : (
        <>
          {/* HEADER - LOGO MAXIMIZADA */}
          <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-24">

                {/* ÁREA DA LOGO (Maior e Estática) */}
                <div className="flex items-center">
                  <img
                    src="/logo-header.png"
                    alt="Grupo Polibalbino"
                    className="h-14 md:h-16 w-auto object-contain"
                    onError={(e) => { e.target.src = "https://via.placeholder.com/250x80?text=POLIBALBINO"; }}
                  />
                </div>

                {/* NAVEGAÇÃO */}
                <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200">
                  {currentUser?.role === 'Admin' && (
                    <button onClick={() => setActiveTab('catalog')} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'catalog' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
                      <List size={18} /> Estoque
                    </button>
                  )}
                  <button onClick={() => setActiveTab('kanban')} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'kanban' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
                    <LayoutDashboard size={18} /> Vendas
                  </button>
                  {/* NOVA ABA DE PERFIS */}
                  {currentUser?.role === 'Admin' && (
                    <button onClick={() => setActiveTab('perfis')} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'perfis' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
                      <User size={18} /> Perfis
                    </button>
                  )}
                  {currentUser?.role === 'Admin' && (
                    <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
                      <BarChart2 size={18} /> Dashboard
                    </button>
                  )}
                </div>


                {/* USUÁRIO E LOGOUT */}
                <div className="flex items-center gap-3">
                  <div className="text-xs text-right hidden sm:block">
                    <p className="text-gray-400 font-medium">Usuário Logado</p>
                    <p className="font-bold text-gray-800">{currentUser?.name}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-bold shadow-md border-2 border-white ${currentUser?.role === 'Admin' ? 'bg-slate-800' : 'bg-blue-600'}`}>
                    {currentUser?.name.charAt(0)}
                  </div>
                  {/* BOTÃO DE SAIR */}
                  <button
                    onClick={handleLogout}
                    className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Sair do Sistema"
                  >
                    <LogOut size={20} />
                  </button>
                </div>

              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* 1. Regra do Estoque */}
            {activeTab === 'catalog' && currentUser?.role === 'Admin' && renderCatalog()}
            {/* 2. Regra das Vendas (Kanban) */}
            {activeTab === 'kanban' && renderKanban()}
            {/* 3. Regra dos Perfis */}
            {activeTab === 'perfis' && currentUser?.role === 'Admin' && renderTabPerfis()}
            {activeTab === 'dashboard' && currentUser?.role === 'Admin' && renderDashboard()}
          </main>

          {/* MODAL DO PRODUTO (CRUD ADMIN) */}
          {isModalOpen && currentUser?.role === 'Admin' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900">{editingItem ? 'Editar Item' : 'Cadastrar Novo Item'}</h3>
                  <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-700"><X size={24} /></button>
                </div>
                <form onSubmit={handleSaveItem} className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        value={formData.codigo} // ANTES: code
                        onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Linha do Produto</label>
                      <select
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                        value={formData.linha} // ANTES: line
                        onChange={(e) => setFormData({ ...formData, linha: e.target.value })}
                      >
                        <option value="PoliPrime">PoliPrime (Virgem)</option>
                        <option value="PoliRec">PoliRec (Reciclado)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                      required
                      rows="2"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      value={formData.descricao} // ANTES: description
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Venda (R$)</label>
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-green-700"
                        value={formData.preco_quilo} // ANTES: price
                        onChange={(e) => setFormData({ ...formData, preco_quilo: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade em Estoque</label>
                      <input
                        type="number"
                        required
                        min="0"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.quantidade_total} // ANTES: quantity
                        onChange={(e) => setFormData({ ...formData, quantidade_total: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={handleCloseModal} className="px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium">Cancelar</button>
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm">Salvar Estoque</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* NOVO: MODAL CRIAÇÃO BÁSICA DO KANBAN */}
          {isKanbanModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-blue-50">
                  <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                    <Handshake size={24} /> Novo Card de Venda
                  </h3>
                  <button onClick={() => setIsKanbanModalOpen(false)} className="text-blue-400 hover:text-blue-700"><X size={24} /></button>
                </div>
                <form onSubmit={handleCreateBasicCard} className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Título do Projeto/Negociação</label>
                    <input type="text" required placeholder="Ex: Negociação Caixa Plástica" value={kanbanFormData.titulo} onChange={(e) => setKanbanFormData({ ...kanbanFormData, title: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Cliente</label>
                    <input type="text" required placeholder="Ex: Indústria XYZ" value={kanbanFormData.cliente} onChange={(e) => setKanbanFormData({ ...kanbanFormData, client: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors" />
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsKanbanModalOpen(false)} className="px-5 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium text-gray-700 transition-colors">Cancelar</button>
                    <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-md transition-all">Criar Card no Quadro</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* NOVO: MODAL DETALHES DO CARD (ESTILO CRM) */}
          {isCardModalOpen && selectedCard && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">

                <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-slate-800 text-white">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <BarChart2 size={24} className="text-blue-400" /> Card: {selectedCard.title}
                  </h3>
                  <button onClick={() => setIsCardModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col md:flex-row">

                  {/* VISTA PRINCIPAL (DETALHES) */}
                  {cardStep === 'details' && (
                    <>
                      <div className="flex-1 p-6 border-r border-gray-200 bg-white">
                        {/* Seção Orçamento */}
                        <div className="mb-8">
                          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <FileText size={16} /> Orçamento / Estoque
                          </h4>

                          {/* MUDANÇA: Agora verifica se existem itens OU se o valor_total no banco é maior que zero */}
                          {(selectedCard.items && selectedCard.items.length > 0) || Number(selectedCard.valor_total) > 0 ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm">

                              {/* Se tiver itens detalhados, mostra a lista. Se não, mostra o resumo do valor */}
                              {selectedCard.items && selectedCard.items.length > 0 ? (
                                <div className="space-y-4">
                                  {selectedCard.items.map((qi, idx) => (
                                    <div key={idx} className="flex justify-between items-center border-b border-blue-100 pb-3 last:border-0 last:pb-0">
                                      <div>
                                        <span className="font-mono font-black text-blue-900 text-lg leading-none">{qi.item?.code || qi.produto_codigo}</span>
                                        <p className="text-[11px] text-gray-500 mt-1 uppercase font-bold">{qi.item?.description || "Material Polibalbino"}</p>
                                      </div>
                                      <div className="text-right">
                                        <span className="block font-black text-lg text-slate-800">{qi.quantity || qi.quantidade} kg</span>
                                        <span className="text-sm font-bold text-green-600">{formatCurrency((qi.item?.preco_quilo || qi.preco_unitario || 0) * (qi.quantity || qi.quantidade))}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 bg-white/50 rounded-lg border border-blue-100">
                                  <p className="text-blue-800 font-black text-lg uppercase">Orçamento Finalizado</p>
                                  <p className="text-2xl font-black text-green-600">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedCard.valor_total)}
                                  </p>
                                </div>
                              )}

                              {/* Resumo de SI (Financeiro e Logística) */}
                              <div className="mt-5 pt-4 border-t border-blue-200 grid grid-cols-2 gap-4 text-xs">
                                <div className="space-y-1">
                                  <p className="text-blue-400 font-black uppercase text-[10px]">Dados de Entrega</p>
                                  <p className="text-slate-700"><strong>CNPJ:</strong> {selectedCard.cnpj || 'Não informado'}</p>
                                  <p className="text-slate-700"><strong>Transp:</strong> {selectedCard.transportadora || 'A definir'}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                  <p className="text-blue-400 font-black uppercase text-[10px]">Financeiro</p>
                                  <p className="text-slate-700"><strong>Pagamento:</strong> {selectedCard.forma_pagamento || selectedCard.formaPagamento || 'Boleto'}</p>
                                  <p className="text-slate-700"><strong>Vencimento:</strong> {selectedCard.data_vencimento || selectedCard.dataVencimento ? new Date(selectedCard.data_vencimento || selectedCard.dataVencimento).toLocaleDateString() : 'A combinar'}</p>
                                </div>
                              </div>

                              {/* Botões de Ação */}
                              <div className="mt-6 flex justify-between items-center gap-3">
                                <button
                                  onClick={() => setCardStep('create-quote')}
                                  className="text-xs font-bold text-blue-600 hover:bg-blue-100 px-4 py-2.5 rounded-xl border border-blue-200 transition-all"
                                >
                                  Refazer Orçamento
                                </button>

                                <button
                                  onClick={() => setCardStep('preview-pdf')}
                                  className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-black text-xs shadow-lg transition-all"
                                >
                                  <FileText size={16} />
                                  GERAR PDF
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
                              <AlertCircle size={32} className="mx-auto text-orange-400 mb-2" />
                              <p className="text-orange-800 font-medium mb-4 text-sm">Nenhum orçamento atrelado. Gere um para oficializar a venda.</p>
                              <button
                                onClick={() => setCardStep('create-quote')}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-black transition-all shadow-md"
                              >
                                Gerar Orçamento Integrado
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Seção Histórico */}
                        <div className="mb-8">
                          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <AlignLeft size={16} /> Observações do Vendedor
                          </h4>
                          <textarea
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[140px] bg-gray-50"
                            placeholder="Registre aqui todo o histórico da negociação..."
                            // MUDANÇA: Puxa do banco (observacoes) ou do formulário (notes)
                            value={cardForm.notes || selectedCard.observacoes || ""}
                            onChange={(e) => setCardForm({ ...cardForm, notes: e.target.value })}
                          />
                        </div>

                        {/* SEÇÃO ANEXOS REMOVIDA AQUI */}
                      </div>

                      {/* SIDEBAR DO CARD (RIGHT) */}
                      <div className="w-full md:w-80 bg-slate-100 p-6 flex flex-col gap-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cliente</label>
                          {/* Ajustado para buscar o nome correto do banco */}
                          <p className="font-bold text-gray-900 text-lg">{selectedCard.cliente || selectedCard.client}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Termômetro de Interesse</label>
                          <select
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none font-bold bg-white shadow-sm"
                            value={cardForm.interestLevel || selectedCard.interestLevel || "Médio"}
                            onChange={(e) => setCardForm({ ...cardForm, interestLevel: e.target.value })}
                          >
                            <option value="Baixo">🟢 Interesse Baixo</option>
                            <option value="Médio">🟡 Interesse Médio</option>
                            <option value="Alto">🔴 Interesse Alto (Quente)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fase do Funil</label>
                          <span className="inline-block px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-bold shadow-sm">{selectedCard.status}</span>
                        </div>

                        <div className="mt-auto pt-6 border-t border-gray-300">
                          <button onClick={saveCardDetails} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-lg">
                            Salvar Informações
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* FLUXO SECUNDÁRIO: GERAR ORÇAMENTO DENTRO DO CARD */}
                  {cardStep === 'create-quote' && (
                    <div className="flex flex-col flex-1 w-full bg-white animate-in slide-in-from-right-8 duration-300">
                      <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-blue-900 text-lg">Gerar Orçamento - {selectedCard.client}</h4>
                          <p className="text-sm text-blue-700">Preencha o CNPJ e selecione o material disponível no estoque.</p>
                        </div>
                        <button onClick={() => { setCardStep('details'); setKanbanSelectedItem(null); }} className="text-sm font-bold text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors">Cancelar & Voltar</button>
                      </div>

                      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                        {/* Lista de Estoque */}
                        <div className="flex-1 border-r border-gray-200 flex flex-col bg-gray-50">
                          <div className="p-4 border-b border-gray-200 bg-white">
                            <div className="relative">
                              <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
                              <input type="text" placeholder='Filtrar material por código ou nome...' className="w-full pl-10 pr-3 py-3 text-sm border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {filteredItems.map(item => {
                              // 1. Pegamos a quantidade total do banco de dados oficial
                              const quantidadeTotal = Number(item.quantidade_total || 0);

                              // 2. CORREÇÃO: Usamos o nome exato da coluna que vem do PHP
                              const quantidadeReservada = Number(item.quantidade_reservada || item.reservedQuantity || 0);
                              const available = quantidadeTotal - quantidadeReservada;

                              const isUnavailable = available <= 0;

                              return (
                                <div
                                  key={item.id}
                                  onClick={() => { if (!isUnavailable) setKanbanSelectedItem(item); }}
                                  className={`p-4 rounded-xl border flex items-center gap-4 transition-all shadow-sm ${isUnavailable
                                    ? 'bg-gray-100 border-gray-200 opacity-50'
                                    : kanbanSelectedItem?.id === item.id
                                      ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500 cursor-pointer'
                                      : 'bg-white border-gray-200 hover:border-blue-300 cursor-pointer'
                                    }`}
                                >
                                  {/* COLUNA 1: Código (Em azul, como na imagem) */}
                                  <div className="w-16 shrink-0">
                                    <span className="font-bold text-blue-600 block text-sm">
                                      {item.codigo || "S/ COD"}
                                    </span>
                                  </div>

                                  {/* COLUNA 2: Descrição, Etiqueta e Preço */}
                                  <div className="flex-1">
                                    {/* Descrição em cima */}
                                    <span className="text-sm text-slate-700 block mb-1">
                                      {item.descricao || "Sem descrição"}
                                    </span>

                                    {/* Linha de baixo: Etiqueta + Preço */}
                                    <div className="flex items-center gap-3">
                                      {/* Lógica das Cores das Etiquetas */}
                                      {item.linha?.toLowerCase() === 'prime' || item.linha?.toLowerCase() === 'poliprime' || item.descricao?.toLowerCase().includes('prime') ? (
                                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-extrabold uppercase tracking-widest">
                                          POLIPRIME
                                        </span>
                                      ) : item.linha?.toLowerCase() === 'polirec' || item.descricao?.toLowerCase().includes('polirec') ? (
                                        <span className="px-2 py-0.5 rounded bg-[#dcfce7] text-[#15803d] text-[10px] font-extrabold uppercase tracking-widest">
                                          POLIREC
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest">
                                          PADRÃO
                                        </span>
                                      )}

                                      {/* Preço Unitário */}
                                      <span className="font-bold text-green-700 text-sm">
                                        {formatCurrency(Number(item.preco_quilo || 0))}
                                      </span>
                                    </div>
                                  </div>

                                  {/* COLUNA 3: Estoque (Exatamente como o seu Admin) */}
                                  <div className="flex flex-col items-end shrink-0">
                                    <div className="flex flex-col items-end gap-0.5">

                                      {/* Disp */}
                                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${isUnavailable ? 'bg-red-100 text-red-700' : 'bg-[#dcfce7] text-[#15803d]'
                                        }`}>
                                        {available} Disp
                                      </span>

                                      {/* Res / Tot */}
                                      <div className="text-[10px] font-medium tracking-tight mt-0.5">
                                        <span className="text-[#f97316]">{quantidadeReservada} Res</span>
                                        <span className="text-slate-400"> / {quantidadeTotal} Tot</span>
                                      </div>

                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Formulário do Orçamento (Direita) - VERSÃO POLIBALBINO MULTI-ITENS */}
                        <div className="w-full md:w-[500px] bg-white flex flex-col shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)] z-10 relative">

                          {/* Área de Rolagem do Formulário */}
                          <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
                            <h3 className="text-xl font-bold text-blue-900 mb-2 flex items-center gap-2">
                              <FileText size={20} /> Detalhes do Orçamento
                            </h3>

                            {/* SEÇÃO 1: CLIENTE & CONTATO */}
                            <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">1. Informações do Cliente</h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-400 ml-1">CNPJ</label>
                                  <input
                                    type="text"
                                    placeholder="00.000.000/0000-00"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    value={extraQuoteData.cnpj}
                                    onChange={(e) => setExtraQuoteData(prev => ({ ...prev, cnpj: e.target.value }))}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-400 ml-1">A/C CONTATO</label>
                                  <input type="text" placeholder="Nome do comprador" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" value={extraQuoteData.contato} onChange={(e) => setExtraQuoteData({ ...extraQuoteData, contato: e.target.value })} />
                                </div>
                              </div>
                            </div>


                            {/* SEÇÃO 2: LOGÍSTICA */}
                            <div className="space-y-4 border-t pt-4">
                              <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">2. Logística & Entrega</h4>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 ml-1">TRANSPORTADORA</label>
                                <input type="text" placeholder="Nome da transportadora" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" value={extraQuoteData.transportadora} onChange={(e) => setExtraQuoteData({ ...extraQuoteData, transportadora: e.target.value })} />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-400 ml-1">TIPO DE FRETE</label>
                                  <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" value={extraQuoteData.frete} onChange={(e) => setExtraQuoteData({ ...extraQuoteData, frete: e.target.value })}>
                                    <option>FOB (Retira GRU)</option>
                                    <option>CIF (Entrega)</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-400 ml-1">LOCAL RETIRADA</label>
                                  <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" value={extraQuoteData.localRetirada} onChange={(e) => setExtraQuoteData({ ...extraQuoteData, localRetirada: e.target.value })} />
                                </div>
                              </div>
                            </div>

                            {/* SEÇÃO 3: ADICIONAR MATERIAL (O que você já tinha, melhorado) */}
                            <div className="space-y-4 border-t pt-4">
                              <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">3. Seleção de Materiais</h4>

                              {kanbanSelectedItem ? (
                                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 animate-in zoom-in-95 duration-200">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <p className="font-mono font-black text-blue-900 text-xl leading-none">{kanbanSelectedItem.code}</p>
                                      <p className="text-[10px] text-blue-600 font-bold mt-1 uppercase">Preço: {formatCurrency(kanbanSelectedItem.preco_quilo)}/kg</p>
                                    </div>
                                    <button onClick={() => setKanbanSelectedItem(null)} className="text-blue-400 hover:text-red-500"><X size={18} /></button>
                                  </div>

                                  <div className="flex gap-3 items-end">
                                    <div className="flex-1">
                                      <label className="text-[10px] font-bold text-blue-400 ml-1">QUANTIDADE (KG)</label>
                                      <input type="number" min="1" className="w-full p-3 bg-white border border-blue-200 rounded-xl font-black text-blue-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: 500" value={quoteQuantity} onChange={(e) => setQuoteQuantity(e.target.value)} />
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation(); // Evita que o clique "atravesse" o botão e bugue o card
                                        handleAddToQuote();  // Nome novo da função que criamos
                                      }}
                                      className="bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
                                    >
                                      <Plus size={20} /> Add
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center">
                                  <p className="text-sm text-gray-400 font-medium italic">Selecione um material no estoque ao lado para adicionar ao orçamento.</p>
                                </div>
                              )}

                              {/* 4. FINANCEIRO & PRAZOS */}
                              <div className="space-y-4 pt-4 border-t border-blue-50">
                                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest pb-1">4. Financeiro & Prazos</h4>

                                <div className="grid grid-cols-2 gap-3">
                                  {/* VENCIMENTO */}
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 ml-1">DATA DE VENCIMENTO</label>
                                    <input
                                      type="date"
                                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                      value={extraQuoteData.dataVencimento}
                                      onChange={(e) => setExtraQuoteData({ ...extraQuoteData, dataVencimento: e.target.value })}
                                    />
                                  </div>

                                  {/* FORMA DE PAGAMENTO */}
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 ml-1">FORMA DE PAGAMENTO</label>
                                    <select
                                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                      value={extraQuoteData.formaPagamento}
                                      onChange={(e) => setExtraQuoteData({ ...extraQuoteData, formaPagamento: e.target.value })}
                                    >
                                      <option value="Boleto 28 dias">Boleto 28 dias</option>
                                      <option value="Boleto 30/60/90">Boleto 30/60/90</option>
                                      <option value="PIX (À vista)">PIX (À vista)</option>
                                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                                      <option value="Transferência Bancária">Transferência Bancária</option>
                                    </select>
                                  </div>
                                </div>
                              </div>

                              {/* SELEÇÃO DE PARCELAS E CÁLCULO DE VALORES */}
                              {(extraQuoteData.formaPagamento === 'Cartão de Crédito' || extraQuoteData.formaPagamento === 'Boleto') && (
                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                                  <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-blue-400 uppercase">Plano de Parcelamento</label>
                                    <select
                                      className="bg-transparent text-sm font-black text-blue-900 outline-none cursor-pointer"
                                      value={extraQuoteData.parcelas}
                                      onChange={(e) => setExtraQuoteData({ ...extraQuoteData, parcelas: e.target.value })}
                                    >
                                      {[1, 2, 3, 4, 5, 6, 10, 12].map(n => (
                                        <option key={n} value={n}>{n}x</option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* CÁLCULO AUTOMÁTICO DO VALOR POR PARCELA */}
                                  <div className="flex justify-between items-center pt-2 border-t border-blue-200/50">
                                    <span className="text-xs text-blue-700 font-medium">Valor por parcela:</span>
                                    <span className="text-lg font-black text-blue-900">
                                      {(() => {
                                        const total = selectedCard?.items?.reduce((acc, curr) => acc + (curr.item.preco_quilo * curr.quantity), 0) || 0;
                                        const numParcelas = parseInt(extraQuoteData.parcelas) || 1;
                                        return formatCurrency(total / numParcelas);
                                      })()}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-blue-400 text-center italic">
                                    * Parcelamento sujeito a aprovação de crédito.
                                  </p>
                                </div>
                              )}

                              {/* LISTA DE ITENS JÁ ADICIONADOS (Importante para multi-itens!) */}
                              {selectedCard?.items?.length > 0 && (
                                <div className="space-y-2 mt-4">
                                  <p className="text-[10px] font-black text-gray-400 uppercase">Itens no Orçamento:</p>
                                  {selectedCard.items.map((it, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-slate-700 text-sm">{it.item.code}</span>
                                          {/* BOTÃO LIXEIRA */}
                                          <button
                                            onClick={() => handleRemoveItem(it.item.code)}
                                            className="text-gray-300 hover:text-red-500 transition-colors"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>

                                        {/* CONTROLES DE QUANTIDADE (+ e -) */}
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => handleAdjustQuantity(it.item.code, -50)}
                                            className="w-5 h-5 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-400 hover:text-red-500"
                                          >
                                            -
                                          </button>
                                          <span className="text-[11px] font-bold text-slate-500">{it.quantity}kg</span>
                                          <button
                                            onClick={() => handleAdjustQuantity(it.item.code, 50)}
                                            className="w-5 h-5 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-400 hover:text-green-500"
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>

                                      <span className="text-sm font-bold text-slate-600">
                                        {formatCurrency(it.item.preco_quilo * it.quantity)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* RODAPÉ FIXO (VALORES TOTAIS) */}
                          <div className="bg-slate-900 p-6 text-white border-t border-slate-700 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
                            <div className="flex justify-between items-end">
                              <div className="space-y-4">
                                <div>
                                  <p className="text-[10px] font-bold uppercase opacity-50">Volume Total</p>
                                  <p className="text-xl font-black">{selectedCard?.items?.reduce((acc, curr) => acc + Number(curr.quantity), 0) || 0} kg</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold uppercase opacity-50">Valor Total</p>
                                  <p className="text-3xl font-black text-green-400">
                                    {formatCurrency(selectedCard?.items?.reduce((acc, curr) => acc + (curr.item.preco_quilo * curr.quantity), 0) || 0)}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={async () => {
                                  // 1. Captura de dados (mantendo sua lógica de fallback)
                                  const cnpjParaEnviar = extraQuoteData.cnpj || selectedCard?.cnpj || "";
                                  const contatoParaEnviar = extraQuoteData.contato || selectedCard?.contato || "";

                                  // 2. Soma dos itens
                                  const totalFinal = (selectedCard.items || []).reduce((acc, it) =>
                                    acc + (Number(it.item?.preco_quilo || 0) * Number(it.quantity || 0)), 0
                                  );

                                  // 3. Montagem do pacote com o ID do card atual
                                  const payload = {
                                    id: selectedCard.id, // CRUCIAL: Adicione o ID aqui para evitar a duplicação
                                    cnpj: cnpjParaEnviar,
                                    contato: contatoParaEnviar,
                                    transportadora: extraQuoteData.transportadora || selectedCard?.transportadora || "",
                                    tipo_frete: extraQuoteData.frete || selectedCard?.tipo_frete || "FOB",
                                    local_retirada: extraQuoteData.localRetirada || selectedCard?.local_retirada || "Matriz",
                                    data_vencimento: extraQuoteData.dataVencimento || selectedCard?.data_vencimento || "",
                                    forma_pagamento: extraQuoteData.formaPagamento || selectedCard?.forma_pagamento || "",
                                    parcelamento: extraQuoteData.parcelas || selectedCard?.parcelamento || "",
                                    valor_total: totalFinal,
                                    itens: (selectedCard.items || []).map(it => ({
                                      codigo: it.item?.codigo || it.item?.code,
                                      quantidade: it.quantity,
                                      preco_vendido: it.item?.preco_quilo
                                    }))
                                  };

                                  if (!payload.cnpj) {
                                    showToast("O CNPJ é obrigatório para finalizar.", 'error');
                                    return;
                                  }

                                  try {
                                    const response = await fetch(`${API_BASE}/finalizar_orcamento.php`, {
                                      method: 'POST', // Ou 'PUT', dependendo de como o seu PHP está configurado
                                      headers: authHeaders(),
                                      body: JSON.stringify(payload)
                                    });

                                    if (response.ok) {
                                      // 🚩 A LINHA MÁGICA: Atualiza o card na memória do sistema NA HORA
                                      // Agora o PDF e a tela de Detalhes vão ler os dados que você acabou de enviar!
                                      setSelectedCard({
                                        ...selectedCard,
                                        ...payload,
                                        status: 'Aberto' // Garante que o status na memória também seja o que o Kanban espera
                                      });

                                      await fetchQuotes(); // Atualiza a lista no fundo
                                      setCardStep('details'); // Volta para a tela de detalhes
                                      showToast("Orçamento atualizado com sucesso!");
                                    }
                                  } catch (e) {
                                    showToast("Erro de conexão com o servidor.", 'error');
                                  }
                                }}
                                className="bg-green-500 hover:bg-green-600 px-8 py-4 rounded-2xl font-black text-white shadow-xl flex items-center gap-2"
                              >
                                <CheckCircle size={20} /> FINALIZAR
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* --- NOVA TELA DE PDF AQUI --- */}
                  {cardStep === 'preview-pdf' && renderPreviewPDF()}

                </div>
              </div>
            </div>
          )}

          {/* --- FIM DA TRANCA DE LOGIN --- */}
        </>
      )}

      {/* Notificação Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

    </div>
  );
}