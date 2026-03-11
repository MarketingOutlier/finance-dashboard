import Chart from 'chart.js/auto';

// ===== CONFIG =====
const WEBHOOK_URL = '/api/webhook';

// ===== DOM ELEMENTS =====
const uploadScreen = document.getElementById('uploadScreen');
const loadingScreen = document.getElementById('loadingScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const btnBrowse = document.getElementById('btnBrowse');
const btnAnalyze = document.getElementById('btnAnalyze');
const btnRemove = document.getElementById('btnRemove');
const btnNewAnalysis = document.getElementById('btnNewAnalysis');
const fileSelected = document.getElementById('fileSelected');
const fileName = document.getElementById('fileName');
const errorModal = document.getElementById('errorModal');
const errorMessage = document.getElementById('errorMessage');

let selectedFile = null;
let chartCategoria = null;
let chartTipo = null;

// ===== CATEGORY COLORS =====
const CATEGORY_COLORS = {
  'Alimentação': '#f97316',
  'Mercado': '#84cc16',
  'Transporte': '#3b82f6',
  'Combustível': '#ef4444',
  'Farmácia': '#10b981',
  'Saúde': '#06b6d4',
  'Entretenimento': '#a855f7',
  'Moradia': '#f59e0b',
  'Educação': '#6366f1',
  'Compras': '#ec4899',
  'Serviços Bancários': '#64748b',
  'Transferência Pessoal': '#8b5cf6',
  'Outros': '#6b7280'
};

const CATEGORY_ICONS = {
  'Alimentação': '🍽️',
  'Mercado': '🛒',
  'Transporte': '🚗',
  'Combustível': '⛽',
  'Farmácia': '💊',
  'Saúde': '🏥',
  'Entretenimento': '🎬',
  'Moradia': '🏠',
  'Educação': '📚',
  'Compras': '🛍️',
  'Serviços Bancários': '🏦',
  'Transferência Pessoal': '👤',
  'Outros': '📌'
};

const TYPE_COLORS = {
  'PIX': '#7c3aed',
  'Débito': '#ef4444',
  'Crédito': '#3b82f6',
  'Transferência': '#06b6d4',
  'Boleto': '#f59e0b',
  'Outros': '#6b7280'
};

// ===== FILE HANDLING =====
btnBrowse.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});

dropZone.addEventListener('click', () => {
  if (!selectedFile) fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    setFile(e.target.files[0]);
  }
});

// Drag & drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  if (e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file.name.endsWith('.csv')) {
      setFile(file);
    } else {
      showError('Por favor, selecione um arquivo CSV.');
    }
  }
});

btnRemove.addEventListener('click', (e) => {
  e.stopPropagation();
  clearFile();
});

btnNewAnalysis.addEventListener('click', () => {
  showScreen('upload');
  clearFile();
});

function setFile(file) {
  selectedFile = file;
  fileName.textContent = file.name;
  document.querySelector('.drop-zone-content').style.display = 'none';
  fileSelected.style.display = 'flex';
  btnAnalyze.disabled = false;
}

function clearFile() {
  selectedFile = null;
  fileInput.value = '';
  document.querySelector('.drop-zone-content').style.display = 'flex';
  fileSelected.style.display = 'none';
  btnAnalyze.disabled = true;
}

// ===== SCREEN MANAGEMENT =====
function showScreen(screen) {
  uploadScreen.style.display = 'none';
  loadingScreen.style.display = 'none';
  dashboardScreen.style.display = 'none';
  btnNewAnalysis.style.display = 'none';

  switch (screen) {
    case 'upload':
      uploadScreen.style.display = 'flex';
      break;
    case 'loading':
      loadingScreen.style.display = 'flex';
      startLoadingAnimation();
      break;
    case 'dashboard':
      dashboardScreen.style.display = 'block';
      btnNewAnalysis.style.display = 'flex';
      break;
  }
}

// ===== LOADING ANIMATION =====
function startLoadingAnimation() {
  const steps = ['step1', 'step2', 'step3', 'step4'];
  let current = 0;

  // Reset all steps
  steps.forEach(id => {
    const el = document.getElementById(id);
    el.className = 'step';
  });
  document.getElementById('step1').classList.add('active');

  const interval = setInterval(() => {
    if (current < steps.length) {
      document.getElementById(steps[current]).classList.remove('active');
      document.getElementById(steps[current]).classList.add('done');
      current++;
      if (current < steps.length) {
        document.getElementById(steps[current]).classList.add('active');
      }
    } else {
      clearInterval(interval);
    }
  }, 3000);

  // Store interval for cleanup
  window._loadingInterval = interval;
}

// ===== ANALYZE =====
btnAnalyze.addEventListener('click', async () => {
  if (!selectedFile) return;

  showScreen('loading');

  try {
    const formData = new FormData();
    formData.append('file', selectedFile);

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (window._loadingInterval) clearInterval(window._loadingInterval);

    // Mark all steps as done
    ['step1', 'step2', 'step3', 'step4'].forEach(id => {
      const el = document.getElementById(id);
      el.className = 'step done';
    });

    setTimeout(() => {
      renderDashboard(data);
      showScreen('dashboard');
    }, 500);

  } catch (err) {
    if (window._loadingInterval) clearInterval(window._loadingInterval);
    showScreen('upload');
    showError(err.message || 'Não foi possível processar seu arquivo. Verifique o formato CSV e tente novamente.');
  }
});

// ===== ERROR =====
function showError(message) {
  errorMessage.textContent = message;
  errorModal.style.display = 'flex';
}

// ===== FORMAT CURRENCY =====
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// ===== RENDER DASHBOARD =====
function renderDashboard(data) {
  // Date
  const date = data.resumo?.dataAnalise ? new Date(data.resumo.dataAnalise) : new Date();
  document.getElementById('dashDate').textContent = `Análise gerada em ${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  // Encontrar os totais de Entrada e Saída
  let totalEntradas = 0;
  let totalSaidas = 0;
  
  if (data.totaisPorTipo && data.totaisPorTipo.length > 0) {
    const entradaA = data.totaisPorTipo.find(t => t.tipo === 'Entrada');
    const saidaA = data.totaisPorTipo.find(t => t.tipo === 'Saída');
    if (entradaA) totalEntradas = entradaA.total;
    if (saidaA) totalSaidas = saidaA.total;
  }

  // Summary cards w/ counter animation
  animateValue('totalGeral', data.resumo?.totalGeral || 0, true);
  animateValue('totalEntradas', totalEntradas, true);
  animateValue('totalSaidas', totalSaidas, true);

  // Maior gasto
  const maiorGasto = data.top3MaioresGastos?.[0]?.valor || 0;
  animateValue('maiorGasto', maiorGasto, true);

  // Charts
  renderCategoryChart(data.gastosPorCategoria || []);
  renderTypeChart(data.totaisPorTipo || []);

  // Top 3
  renderTopGastos(data.top3MaioresGastos || []);

  // Dicas
  renderDicas(data.gastosPorCategoria || [], data.resumo || {});

  // Transactions table
  renderTransactions(data.transacoes || [], data.gastosPorCategoria || []);
}

// ===== ANIMATE VALUES =====
function animateValue(elementId, finalValue, isCurrency) {
  const el = document.getElementById(elementId);
  const duration = 1500;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = finalValue * eased;

    if (isCurrency) {
      el.textContent = formatCurrency(current);
    } else {
      el.textContent = Math.round(current).toLocaleString('pt-BR');
    }

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// ===== CATEGORY CHART =====
function renderCategoryChart(categorias) {
  const ctx = document.getElementById('chartCategoria');

  if (chartCategoria) chartCategoria.destroy();

  const labels = categorias.map(c => c.categoria);
  const values = categorias.map(c => c.total);
  const colors = labels.map(l => CATEGORY_COLORS[l] || '#6b7280');

  chartCategoria = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: 'rgba(10, 10, 26, 0.8)',
        borderWidth: 3,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#a0a0c0',
            font: { family: "'Inter'", size: 11, weight: '500' },
            padding: 12,
            usePointStyle: true,
            pointStyleWidth: 10
          }
        },
        tooltip: {
          backgroundColor: 'rgba(17, 17, 40, 0.95)',
          borderColor: 'rgba(124, 58, 237, 0.2)',
          borderWidth: 1,
          titleFont: { family: "'Inter'", size: 13, weight: '600' },
          bodyFont: { family: "'Inter'", size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((ctx.parsed / total) * 100).toFixed(1);
              return `${formatCurrency(ctx.parsed)} (${pct}%)`;
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1200,
        easing: 'easeOutQuart'
      }
    }
  });
}

// ===== TYPE CHART =====
function renderTypeChart(tipos) {
  const ctx = document.getElementById('chartTipo');

  if (chartTipo) chartTipo.destroy();

  const labels = tipos.map(t => t.tipo);
  const values = tipos.map(t => t.total);
  const colors = labels.map(l => TYPE_COLORS[l] || '#6b7280');

  chartTipo = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors.map(c => c + '40'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17, 17, 40, 0.95)',
          borderColor: 'rgba(124, 58, 237, 0.2)',
          borderWidth: 1,
          titleFont: { family: "'Inter'", size: 13, weight: '600' },
          bodyFont: { family: "'Inter'", size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => formatCurrency(ctx.parsed.x)
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(124, 58, 237, 0.06)' },
          ticks: {
            color: '#6b6b8d',
            font: { family: "'Inter'", size: 11 },
            callback: (v) => formatCurrency(v)
          }
        },
        y: {
          grid: { display: false },
          ticks: {
            color: '#a0a0c0',
            font: { family: "'Inter'", size: 12, weight: '500' }
          }
        }
      },
      animation: {
        duration: 1200,
        easing: 'easeOutQuart'
      }
    }
  });
}

// ===== TOP 3 =====
function renderTopGastos(top3) {
  const container = document.getElementById('topGastos');
  container.innerHTML = top3.map((item, i) => `
    <div class="top-card fade-in fade-in-delay-${i + 1}">
      <div class="top-rank">#${i + 1}</div>
      <div class="top-card-value">${formatCurrency(item.valor)}</div>
      <div class="top-card-desc">${item.descricao}</div>
      <span class="top-card-cat">${CATEGORY_ICONS[item.categoria] || '📌'} ${item.categoria}</span>
    </div>
  `).join('');
}

// ===== DICAS DE MELHORIA =====
function renderDicas(categorias, resumo) {
  const container = document.getElementById('dicasGrid');
  const dicas = generateDicas(categorias, resumo);

  container.innerHTML = dicas.map(dica => `
    <div class="dica-card">
      <div class="dica-icon dica-severity-${dica.severity}">${dica.icon}</div>
      <div class="dica-content">
        <div class="dica-title">${dica.title}</div>
        <div class="dica-text">${dica.text}</div>
      </div>
    </div>
  `).join('');
}

function generateDicas(categorias, resumo) {
  const dicas = [];
  const total = resumo.totalGeral || 1;

  categorias.forEach(cat => {
    const pct = (cat.total / total) * 100;

    if (cat.categoria === 'Alimentação' && pct > 25) {
      dicas.push({
        icon: '🍽️', severity: 'high',
        title: `Alimentação = ${pct.toFixed(0)}% dos gastos`,
        text: `Você gastou ${formatCurrency(cat.total)} com alimentação. Considere preparar refeições em casa (meal prep), levar marmita e reduzir pedidos por delivery. Uma economia de 30% aqui significaria ${formatCurrency(cat.total * 0.3)} a menos.`
      });
    }

    if (cat.categoria === 'Mercado' && pct > 20) {
      dicas.push({
        icon: '🛒', severity: 'med',
        title: `Mercado = ${pct.toFixed(0)}% dos gastos`,
        text: `${formatCurrency(cat.total)} em mercado. Faça listas antes de ir às compras, compare preços entre mercados e evite compras por impulso. Atacadistas podem reduzir custos em até 25%.`
      });
    }

    if (cat.categoria === 'Transporte' && pct > 15) {
      dicas.push({
        icon: '🚗', severity: 'high',
        title: `Transporte = ${pct.toFixed(0)}% dos gastos`,
        text: `${formatCurrency(cat.total)} com transporte. Avalie substituir apps de transporte por transporte público, carona solidária ou bicicleta. Consolidar viagens também ajuda.`
      });
    }

    if (cat.categoria === 'Combustível' && pct > 10) {
      dicas.push({
        icon: '⛽', severity: 'med',
        title: `Combustível = ${pct.toFixed(0)}% dos gastos`,
        text: `${formatCurrency(cat.total)} em combustível. Use apps como Waze para achar postos mais baratos. Etanol geralmente compensa quando até 70% do preço da gasolina.`
      });
    }

    if (cat.categoria === 'Entretenimento' && pct > 10) {
      dicas.push({
        icon: '🎬', severity: 'med',
        title: `Entretenimento = ${pct.toFixed(0)}% dos gastos`,
        text: `${formatCurrency(cat.total)} com entretenimento. Revise suas assinaturas de streaming — talvez esteja pagando por serviços que não usa. Busque opções gratuitas de lazer.`
      });
    }

    if (cat.categoria === 'Compras' && pct > 15) {
      dicas.push({
        icon: '🛍️', severity: 'high',
        title: `Compras = ${pct.toFixed(0)}% dos gastos`,
        text: `${formatCurrency(cat.total)} em compras. Aplique a regra das 48h: espere 2 dias antes de compras não essenciais. Muitos impulsos passam nesse período.`
      });
    }

    if (cat.categoria === 'Serviços Bancários' && pct > 5) {
      dicas.push({
        icon: '🏦', severity: 'med',
        title: `Taxas Bancárias = ${pct.toFixed(0)}% dos gastos`,
        text: `${formatCurrency(cat.total)} em serviços bancários. Considere migrar para um banco digital sem taxas. Nubank, Inter e C6 oferecem contas sem tarifas.`
      });
    }

    if (cat.categoria === 'Farmácia' && pct > 8) {
      dicas.push({
        icon: '💊', severity: 'low',
        title: `Farmácia = ${pct.toFixed(0)}% dos gastos`,
        text: `${formatCurrency(cat.total)} em farmácia. Compare preços em apps como Consulta Remédios e considere genéricos que podem custar até 60% menos.`
      });
    }

    if (cat.categoria === 'Moradia' && pct > 35) {
      dicas.push({
        icon: '🏠', severity: 'high',
        title: `Moradia = ${pct.toFixed(0)}% dos gastos`,
        text: `${formatCurrency(cat.total)} com moradia. O ideal é que moradia não ultrapasse 30% da renda. Avalie renegociar aluguel, dividir moradia ou mudar para região mais acessível.`
      });
    }

    if (cat.categoria === 'Transferência Pessoal' && pct > 20) {
      dicas.push({
        icon: '👤', severity: 'low',
        title: `Transferências Pessoais = ${pct.toFixed(0)}%`,
        text: `${formatCurrency(cat.total)} transferido para pessoas físicas. Certifique-se de que empréstimos a terceiros não estejam comprometendo seu orçamento.`
      });
    }
  });

  // Dicas gerais
  if (resumo.mediaGastosPorTransacao > 200) {
    dicas.push({
      icon: '📊', severity: 'med',
      title: 'Média alta por transação',
      text: `Sua média é ${formatCurrency(resumo.mediaGastosPorTransacao)} por transação. Tente fazer compras menores e mais frequentes para ter mais controle sobre os gastos.`
    });
  }

  // Sempre incluir dica de reserva de emergência
  dicas.push({
    icon: '🛡️', severity: 'low',
    title: 'Monte sua reserva de emergência',
    text: `Mantenha de 3 a 6 meses de gastos guardados. Com base nos seus gastos, sua reserva ideal seria entre ${formatCurrency(total * 3)} e ${formatCurrency(total * 6)}. Comece com 10% da sua renda.`
  });

  return dicas.slice(0, 6); // Max 6 dicas
}

// ===== TRANSACTIONS TABLE =====
let allTransactions = [];

function renderTransactions(transacoes, categorias) {
  allTransactions = transacoes;

  // Populate filter dropdown
  const filterCategoria = document.getElementById('filterCategoria');
  const existingCats = [...new Set(transacoes.map(t => t.categoria))].sort();
  filterCategoria.innerHTML = '<option value="">Todas as Categorias</option>' +
    existingCats.map(cat => `<option value="${cat}">${CATEGORY_ICONS[cat] || '📌'} ${cat}</option>`).join('');

  // Event listeners
  filterCategoria.addEventListener('change', () => applyFilters());
  document.getElementById('filterOrdem').addEventListener('change', () => applyFilters());

  applyFilters();
}

function applyFilters() {
  const catFilter = document.getElementById('filterCategoria').value;
  const orderFilter = document.getElementById('filterOrdem').value;

  let filtered = [...allTransactions];

  if (catFilter) {
    filtered = filtered.filter(t => t.categoria === catFilter);
  }

  switch (orderFilter) {
    case 'valor-desc':
      filtered.sort((a, b) => b.valor - a.valor);
      break;
    case 'valor-asc':
      filtered.sort((a, b) => a.valor - b.valor);
      break;
    case 'data-desc':
      filtered.sort((a, b) => parseDate(b.data) - parseDate(a.data));
      break;
    case 'data-asc':
      filtered.sort((a, b) => parseDate(a.data) - parseDate(b.data));
      break;
  }

  const tbody = document.getElementById('transactionsBody');
  tbody.innerHTML = filtered.map(t => {
    const valorClass = (t.valorOriginal || t.valor) < 0 ? 'valor-negativo' : 'valor-positivo';
    const tipoBadge = getBadgeClass(t.tipo);

    return `
      <tr>
        <td>${t.data || '—'}</td>
        <td>${t.descricao || '—'}</td>
        <td class="${valorClass}">${formatCurrency(t.valor)}</td>
        <td><span class="badge ${tipoBadge}">${t.tipo}</span></td>
        <td><span class="cat-badge" style="background: ${(CATEGORY_COLORS[t.categoria] || '#6b7280')}20; color: ${CATEGORY_COLORS[t.categoria] || '#6b7280'}">${CATEGORY_ICONS[t.categoria] || '📌'} ${t.categoria}</span></td>
      </tr>
    `;
  }).join('');
}

function parseDate(dateStr) {
  if (!dateStr) return 0;
  // Handle dd/mm/yyyy
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
  }
  return new Date(dateStr).getTime() || 0;
}

function getBadgeClass(tipo) {
  const t = (tipo || '').toLowerCase();
  if (t.includes('pix')) return 'badge-pix';
  if (t.includes('déb') || t.includes('deb')) return 'badge-debito';
  if (t.includes('créd') || t.includes('cred')) return 'badge-credito';
  if (t.includes('transf')) return 'badge-transferencia';
  if (t.includes('boleto')) return 'badge-boleto';
  return 'badge-outros';
}
