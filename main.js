// === KONFIGURACJA SUPABASE ===
const SUPABASE_URL = 'https://jqarrtdzdpnvcwgvbvlr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Wbd9Jt7DGhdA1jxpYzZEXg_mo0DRJ82';
window.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// === STAN GLOBALNY (współdzielony przez auth.js i order.js) ===
window.koszyk = JSON.parse(localStorage.getItem('tani_koszyk') || '[]');
window.zalogowanyUzytkownik = null;
window.currentLang = 'pl';

// === SYSTEM JĘZYKOWY ===
function setLang(lang) {
  window.currentLang = lang;
  document.querySelectorAll('[data-lang]').forEach(el => {
    el.classList.toggle('active', el.dataset.lang === lang);
  });
  document.querySelectorAll('[data-lang-inline]').forEach(el => {
    el.classList.toggle('active', el.dataset.langInline === lang);
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim().toLowerCase() === lang);
  });
  document.documentElement.lang = lang === 'ua' ? 'uk' : lang;
  if (typeof ladujProdukty === 'function') ladujProdukty();
}
window.setLang = setLang;

// === PRODUKTY Z SUPABASE ===
const ETYKIETY_KATEGORII = {
  'warzywa':   { pl: '🥬 Warzywa i owoce', ua: '🥬 Овочі та фрукти', en: '🥬 Vegetables & fruit' },
  'nabiał':    { pl: '🥛 Nabiał i jaja', ua: '🥛 Молочні продукти', en: '🥛 Dairy & eggs' },
  'pieczywo':  { pl: '🍞 Pieczywo', ua: '🍞 Хліб і випічка', en: '🍞 Bread & pastry' },
  'chemia':    { pl: '🧴 Chemia domowa', ua: '🧴 Побутова хімія', en: '🧴 Household chemicals' },
  'napoje':    { pl: '🧃 Napoje i przekąski', ua: '🧃 Напої і снеки', en: '🧃 Drinks & snacks' },
  'szkolne':   { pl: '🏫 Artykuły szkolne', ua: '🏫 Шкільне приладдя', en: '🏫 School supplies' },
  'porządki':  { pl: '🧹 Sprzęt porządkowy', ua: '🧹 Засоби для прибирання', en: '🧹 Cleaning tools' },
  'zwierzęta': { pl: '🐾 Karma dla zwierząt', ua: '🐾 Корм для тварин', en: '🐾 Pet food' },
};
function etykietaKat(kat, lang) {
  return ETYKIETY_KATEGORII[(kat||'').toLowerCase().trim()]?.[lang] || kat;
}

async function ladujProdukty() {
  const lang = window.currentLang || 'pl';
  const kontener = document.getElementById('produkty-container');
  if (!kontener) return;

  const { data: produkty, error } = await db.from('produkty').select('*')
    .eq('dostepny', true).order('kategoria').order('nazwa');

  if (error) {
    kontener.innerHTML = `<p class="brak-produktow">Błąd ładowania produktów z bazy danych.</p>`;
    console.error(error);
    return;
  }
  if (!produkty || produkty.length === 0) {
    const komunikat = {
      pl: 'Brak produktów — zajrzyj wkrótce!',
      ua: 'Немає товарів — заходьте незабаром!',
      en: 'No products yet — check back soon!'
    };
    kontener.innerHTML = `<p class="brak-produktow">${komunikat[lang]}</p>`;
    return;
  }

  const kategorie = {};
  produkty.forEach(p => {
    const k = (p.kategoria || 'inne').toLowerCase().trim();
    if (!kategorie[k]) kategorie[k] = [];
    kategorie[k].push(p);
  });

  let html = '';
  for (const [kat, items] of Object.entries(kategorie)) {
    html += `<div class="kat-sekcja"><h3 class="kat-tytul">${etykietaKat(kat, lang)}</h3><div class="produkty-grid">`;
    items.forEach(p => {
      const maP = p.cena_przed_przecena && Number(p.cena_przed_przecena) > Number(p.cena);
      const stara = maP ? `<span class="stara-cena">${Number(p.cena_przed_przecena).toFixed(2)} zł</span>` : '';
      const badge = maP ? `<div class="przecena-badge">PROMOCJA</div>` : '';
      const opis = p.opis ? `<div class="produkt-opis">${p.opis}</div>` : '';
      html += `<div class="produkt-karta${maP?' przecena':''}">
        ${badge}<div class="produkt-nazwa">${p.nazwa}</div>${opis}
        <div class="produkt-cena">${stara}<span class="nowa-cena">${Number(p.cena).toFixed(2)} zł</span></div>
        <button class="btn-dodaj" onclick="dodajDoKoszyka(${p.id},'${p.nazwa.replace(/'/g,"\\'")}',${p.cena})" id="btn-${p.id}">+ Dodaj do koszyka</button>
      </div>`;
    });
    html += `</div></div>`;
  }
  kontener.innerHTML = html;
}
window.ladujProdukty = ladujProdukty;

// === KOSZYK ===
function zapiszKoszyk() { localStorage.setItem('tani_koszyk', JSON.stringify(window.koszyk)); }
window.zapiszKoszyk = zapiszKoszyk;

function dodajDoKoszyka(id, nazwa, cena) {
  const idx = window.koszyk.findIndex(x => x.id === id);
  if (idx >= 0) window.koszyk[idx].qty++;
  else window.koszyk.push({ id, nazwa, cena: Number(cena), qty: 1 });
  zapiszKoszyk(); aktualizujLicznik(); renderKoszyk();
  const btn = document.getElementById(`btn-${id}`);
  if (btn) {
    btn.classList.add('dodano'); btn.textContent = '✓ Dodano!';
    setTimeout(() => { btn.classList.remove('dodano'); btn.textContent = '+ Dodaj do koszyka'; }, 1500);
  }
}
window.dodajDoKoszyka = dodajDoKoszyka;

function zmienIlosc(id, delta) {
  const idx = window.koszyk.findIndex(x => x.id === id);
  if (idx < 0) return;
  window.koszyk[idx].qty += delta;
  if (window.koszyk[idx].qty <= 0) window.koszyk.splice(idx, 1);
  zapiszKoszyk(); aktualizujLicznik(); renderKoszyk();
}
window.zmienIlosc = zmienIlosc;

function aktualizujLicznik() {
  const n = window.koszyk.reduce((s, x) => s + x.qty, 0);
  const el = document.getElementById('koszykLicznik');
  if (el) { el.textContent = n; el.classList.toggle('widoczny', n > 0); }
  const btnZ = document.getElementById('btnZamow');
  if (btnZ) btnZ.disabled = n === 0;
}
window.aktualizujLicznik = aktualizujLicznik;

function renderKoszyk() {
  const lista = document.getElementById('koszykLista');
  if (!lista) return;
  const suma = window.koszyk.reduce((s, x) => s + x.cena * x.qty, 0);
  document.getElementById('koszykSuma').textContent = suma.toFixed(2) + ' zł';
  if (!window.koszyk.length) { lista.innerHTML = '<div class="koszyk-pusty">🛒 Koszyk jest pusty</div>'; return; }
  lista.innerHTML = window.koszyk.map(p => `
    <div class="koszyk-pozycja">
      <div class="koszyk-poz-nazwa">${p.nazwa}</div>
      <div class="koszyk-qty">
        <button class="qty-btn" onclick="zmienIlosc(${p.id},-1)">−</button>
        <span class="qty-num">${p.qty}</span>
        <button class="qty-btn" onclick="zmienIlosc(${p.id},1)">+</button>
      </div>
      <div class="koszyk-poz-cena">${(p.cena*p.qty).toFixed(2)} zł</div>
    </div>`).join('');
}
window.renderKoszyk = renderKoszyk;

function otworzKoszyk() {
  document.getElementById('koszykPanel').classList.add('otwarty');
  document.getElementById('koszykOverlay').classList.add('otwarty');
  renderKoszyk();
}
function zamknijKoszyk() {
  document.getElementById('koszykPanel').classList.remove('otwarty');
  document.getElementById('koszykOverlay').classList.remove('otwarty');
}
window.otworzKoszyk = otworzKoszyk;
window.zamknijKoszyk = zamknijKoszyk;

// === FORMULARZ KONTAKTOWY ===
function handleSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const message = form.message.value.trim();
  const L = window.currentLang;
  if (!name || !email || !message) {
    alert(L === 'pl' ? 'Proszę wypełnić wszystkie pola.' : L === 'ua' ? 'Будь ласка, заповніть усі поля.' : 'Please fill in all fields.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert(L === 'pl' ? 'Nieprawidłowy adres e-mail.' : L === 'ua' ? 'Некоректна адреса електронної пошти.' : 'Invalid email address.');
    return;
  }
  form.style.display = 'none';
  success.style.display = 'block';
  setLang(L);
}
window.handleSubmit = handleSubmit;

// === INIT ===
document.addEventListener('DOMContentLoaded', async () => {
  setLang('pl');
  aktualizujLicznik();
  ladujProdukty();

  const { data: { session }, error } = await db.auth.getSession();
  if (!error && session?.user) ustawZalogowanego(session.user);
  else ustawWylogowanego();

  db.auth.onAuthStateChange((_e, session) => {
    if (session?.user) ustawZalogowanego(session.user);
    else ustawWylogowanego();
  });
});
