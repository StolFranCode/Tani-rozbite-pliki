// === AUTH: logowanie, rejestracja, panel użytkownika ===
let aktywnyTab = 'login';

function otworzAuth() { document.getElementById('authModal').classList.add('otwarty'); }
function zamknijAuth() { document.getElementById('authModal').classList.remove('otwarty'); }
window.otworzAuth = otworzAuth;
window.zamknijAuth = zamknijAuth;

function przelaczTab(tab) {
  aktywnyTab = tab;
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
  const showReg = tab === 'register';
  document.getElementById('powtorzHasloGroup').style.display = showReg ? 'flex' : 'none';
  document.getElementById('imieGroup').style.display = showReg ? 'flex' : 'none';
  document.getElementById('nazwiskoGroup').style.display = showReg ? 'flex' : 'none';
  document.getElementById('authSubmitBtn').textContent = showReg ? 'Zarejestruj się →' : 'Zaloguj się →';
  document.getElementById('authError').classList.remove('widoczny');
  document.getElementById('authSukces').classList.remove('widoczny');
}
window.przelaczTab = przelaczTab;

async function handleAuth(e) {
  e.preventDefault();
  const email = document.getElementById('authEmail').value.trim();
  const haslo = document.getElementById('authHaslo').value;
  const err = document.getElementById('authError');
  const suk = document.getElementById('authSukces');
  err.classList.remove('widoczny');
  suk.classList.remove('widoczny');

  if (aktywnyTab === 'register') {
    const imie = document.getElementById('authImie').value.trim();
    const nazwisko = document.getElementById('authNazwisko').value.trim();
    const haslo2 = document.getElementById('authHaslo2').value;
    if (!imie || !nazwisko) { err.textContent = 'Podaj imię i nazwisko.'; err.classList.add('widoczny'); return; }
    if (haslo !== haslo2) { err.textContent = 'Hasła nie są identyczne.'; err.classList.add('widoczny'); return; }
    if (haslo.length < 6) { err.textContent = 'Hasło musi mieć min. 6 znaków.'; err.classList.add('widoczny'); return; }

    const { error } = await db.auth.signUp({
      email,
      password: haslo,
      options: { data: { imie, nazwisko, full_name: `${imie} ${nazwisko}` } }
    });
    if (error) { err.textContent = error.message; err.classList.add('widoczny'); return; }
    suk.textContent = '✅ Konto utworzone! Sprawdź email aby potwierdzić.';
    suk.classList.add('widoczny');
  } else {
    const { error } = await db.auth.signInWithPassword({ email, password: haslo });
    if (error) { err.textContent = 'Nieprawidłowy email lub hasło.'; err.classList.add('widoczny'); return; }
    zamknijAuth();
  }
}
window.handleAuth = handleAuth;

async function wyloguj() { await db.auth.signOut(); zamknijUserPanel(); }
window.wyloguj = wyloguj;

function otworzUserPanel() {
  document.getElementById('userPanel').classList.add('otwarty');
  document.getElementById('userOverlay').classList.add('otwarty');
  ladujZamowienia();
}
function zamknijUserPanel() {
  document.getElementById('userPanel').classList.remove('otwarty');
  document.getElementById('userOverlay').classList.remove('otwarty');
}
window.otworzUserPanel = otworzUserPanel;
window.zamknijUserPanel = zamknijUserPanel;

// Zwraca pełną nazwę użytkownika (imię + nazwisko) lub fallback do emaila
function nazwaUzytkownika(user) {
  const m = user?.user_metadata || {};
  if (m.imie && m.nazwisko) return `${m.imie} ${m.nazwisko}`;
  if (m.full_name) return m.full_name;
  return user.email.split('@')[0];
}

function ustawZalogowanego(user) {
  window.zalogowanyUzytkownik = user;
  const btn = document.getElementById('authNavBtn');
  if (btn) {
    btn.onclick = otworzUserPanel;
    btn.textContent = '👤 ' + nazwaUzytkownika(user);
  }
  const uEmail = document.getElementById('userEmail');
  if (uEmail) uEmail.textContent = nazwaUzytkownika(user);
}
window.ustawZalogowanego = ustawZalogowanego;

function ustawWylogowanego() {
  window.zalogowanyUzytkownik = null;
  const btn = document.getElementById('authNavBtn');
  if (btn) {
    btn.onclick = otworzAuth;
    const lang = window.currentLang || 'pl';
    if (lang === 'ua') btn.textContent = 'Увійти';
    else if (lang === 'en') btn.textContent = 'Log in';
    else btn.textContent = 'Zaloguj się';
  }
}
window.ustawWylogowanego = ustawWylogowanego;

async function ladujZamowienia() {
  const lista = document.getElementById('zamowieniaLista');
  if (!lista) return;
  lista.innerHTML = '<p style="font-size:13px;color:#888;">Ładowanie...</p>';
  if (!window.zalogowanyUzytkownik) {
    lista.innerHTML = '<p style="font-size:13px;color:#888;">Musisz być zalogowany.</p>';
    return;
  }
  const { data, error } = await db.from('zamowienia')
    .select('*')
    .eq('user_id', window.zalogowanyUzytkownik.id)
    .order('created_at', { ascending: false });
  if (error || !data?.length) {
    lista.innerHTML = '<p style="font-size:13px;color:#888;font-family:\'Special Elite\',monospace;">Brak zamówień.</p>';
    return;
  }
  lista.innerHTML = data.map(z => {
    const poz = z.produkty || [];
    const dt = new Date(z.created_at).toLocaleDateString('pl-PL');
    return `<div class="zamowienie-karta">
      <div class="zamowienie-naglowek"><span>${dt}</span><span class="zamowienie-status">${z.status}</span></div>
      <div class="zamowienie-body">
        ${poz.map(p=>`<p>• ${p.nazwa} ×${p.qty} — ${(p.cena*p.qty).toFixed(2)} zł</p>`).join('')}
        <p style="margin-top:8px;font-weight:bold;">Suma: ${Number(z.suma).toFixed(2)} zł</p>
        <p style="font-size:12px;color:#888;">${z.sposob_odbioru==='dostawa'?'🚚 Dostawa: '+z.adres:'🏪 Odbiór: '+z.sklep}</p>
      </div></div>`;
  }).join('');
}
window.ladujZamowienia = ladujZamowienia;
