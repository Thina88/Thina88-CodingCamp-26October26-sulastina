(function () {
  const KEY = 'pencatat-pengeluaran';
  const COLORS = { Makanan: '#f59e0b', Transportasi: '#3b82f6', Hiburan: '#ec4899' };

  const form = document.getElementById('form');
  const nameEl = document.getElementById('name');
  const amountEl = document.getElementById('amount');
  const catEl = document.getElementById('category');
  const errorEl = document.getElementById('error');
  const listEl = document.getElementById('list');
  const emptyEl = document.getElementById('empty');
  const totalEl = document.getElementById('total');
  const expenseEl = document.getElementById('expense');
  const chartEmpty = document.getElementById('chart-empty');
  const canvas = document.getElementById('chart');

  const rupiah = n => 'Rp ' + Number(n).toLocaleString('id-ID');

  const root = document.documentElement;
  const themeBtn = document.getElementById('theme-toggle');
  let chart = null;

  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    themeBtn.textContent = t === 'dark' ? '☀️ Terang' : '🌙 Gelap';
    const textColor = getComputedStyle(root).getPropertyValue('--text').trim();
    const cardColor = getComputedStyle(root).getPropertyValue('--card').trim();
    if (window.Chart) Chart.defaults.color = textColor;
    if (chart) {
      chart.options.plugins.legend.labels.color = textColor;
      chart.data.datasets[0].borderColor = cardColor;
      chart.update();
    }
  }
  themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('pencatat-tema', next); } catch (e) {}
    applyTheme(next);
  });

  let items = [];
  try { items = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { items = []; }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
  }

  function renderList() {
    listEl.innerHTML = '';
    items.forEach(it => {
      const li = document.createElement('li');
      const info = document.createElement('div');
      info.className = 'item-info';
      const n = document.createElement('div');
      n.className = 'item-name';
      n.textContent = it.name;
      const c = document.createElement('div');
      c.className = 'item-cat';
      c.textContent = it.category;
      info.append(n, c);
      const a = document.createElement('div');
      a.className = 'item-amount';
      const inc = it.category === 'Gaji';
      a.className = 'item-amount' + (inc ? ' income' : '');
      a.textContent = (inc ? '+ ' : '- ') + rupiah(it.amount);
      const d = document.createElement('button');
      d.className = 'del';
      d.type = 'button';
      d.textContent = 'Hapus';
      d.setAttribute('aria-label', 'Hapus ' + it.name);
      d.addEventListener('click', () => remove(it.id));
      li.append(info, a, d);
      listEl.appendChild(li);
    });
    emptyEl.style.display = items.length ? 'none' : 'block';
  }

  function renderTotal() {
    const income = items.filter(i => i.category === 'Gaji').reduce((s, i) => s + i.amount, 0);
    const expense = items.filter(i => i.category !== 'Gaji').reduce((s, i) => s + i.amount, 0);
    const saldo = income - expense;
    totalEl.textContent = (saldo < 0 ? '-' : '') + rupiah(Math.abs(saldo));
    expenseEl.textContent = rupiah(expense);
  }

  function renderChart() {
    const cats = Object.keys(COLORS);
    const data = cats.map(c => items.filter(i => i.category === c).reduce((s, i) => s + i.amount, 0));
    const has = data.some(v => v > 0);
    chartEmpty.style.display = has ? 'none' : 'block';
    canvas.style.display = has ? 'block' : 'none';
    if (!window.Chart) { chartEmpty.style.display = 'block'; chartEmpty.textContent = 'Chart.js gagal dimuat (cek koneksi internet).'; return; }
    if (!chart) {
      chart = new Chart(canvas, {
        type: 'pie',
        data: { labels: cats, datasets: [{ data, backgroundColor: cats.map(c => COLORS[c]), borderColor: getComputedStyle(root).getPropertyValue('--card').trim() }] },
        options: {
          plugins: {
            legend: { position: 'bottom', labels: { color: getComputedStyle(root).getPropertyValue('--text').trim() } },
            tooltip: { callbacks: { label: ctx => ' ' + ctx.label + ': ' + rupiah(ctx.parsed) } }
          }
        }
      });
    } else {
      chart.data.datasets[0].data = data;
      chart.update();
    }
  }

  function render() { renderList(); renderTotal(); renderChart(); }

  function remove(id) {
    items = items.filter(i => i.id !== id);
    save(); render();
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = nameEl.value.trim();
    const amount = parseFloat(amountEl.value);
    const category = catEl.value;
    if (!name || !amountEl.value || !category) {
      errorEl.textContent = 'Semua kolom harus diisi.';
      return;
    }
    if (!(amount > 0)) {
      errorEl.textContent = 'Jumlah harus lebih dari 0.';
      return;
    }
    errorEl.textContent = '';
    items.unshift({ id: Date.now() + Math.random(), name, amount, category });
    save(); render();
    form.reset();
    nameEl.focus();
  });

  applyTheme(root.getAttribute('data-theme') || 'light');
  render();
})();
