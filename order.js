// === ZAMÓWIENIE ===
function otworzZamowienie() {
  if (!window.zalogowanyUzytkownik) { zamknijKoszyk(); otworzAuth(); return; }
  zamknijKoszyk();

  // Pre-wypełnienie danych zalogowanego użytkownika
  const u = window.zalogowanyUzytkownik;
  const m = u.user_metadata || {};
  const pelnaNazwa = (m.imie && m.nazwisko) ? `${m.imie} ${m.nazwisko}` : (m.full_name || '');
  const imieInput = document.getElementById('zamImie');
  if (imieInput && !imieInput.value) imieInput.value = pelnaNazwa;
  document.getElementById('zamEmailField').value = u.email;

  const suma = window.koszyk.reduce((s, x) => s + x.cena * x.qty, 0);
  document.getElementById('zamowPodsumowanie').innerHTML =
    window.koszyk.map(p => `<div class="zamow-poz"><span>${p.nazwa} ×${p.qty}</span><span>${(p.cena*p.qty).toFixed(2)} zł</span></div>`).join('') +
    `<div class="zamow-total"><span>Razem</span><span>${suma.toFixed(2)} zł</span></div>`;

  document.getElementById('zamowModal').classList.add('otwarty');
  document.getElementById('zamowError').classList.remove('widoczny');
  document.getElementById('zamowSukces').classList.remove('widoczny');
  document.getElementById('zamowForm').style.display = 'flex';

  document.querySelectorAll('input[name="odbior"]').forEach(r => {
    r.addEventListener('change', () => {
      document.getElementById('adresGroup').style.display = r.value === 'dostawa' ? 'flex' : 'none';
    });
  });
}
window.otworzZamowienie = otworzZamowienie;

function zamknijZamowienie() {
  document.getElementById('zamowModal').classList.remove('otwarty');
}
window.zamknijZamowienie = zamknijZamowienie;

async function zlozZamowienie(e) {
  e.preventDefault();
  const btn = document.getElementById('zamowSubmitBtn');
  const err = document.getElementById('zamowError');
  const suk = document.getElementById('zamowSukces');
  err.classList.remove('widoczny');

  const odbior = document.querySelector('input[name="odbior"]:checked')?.value;
  if (!odbior) { err.textContent = 'Wybierz sposób odbioru.'; err.classList.add('widoczny'); return; }
  const adres = document.getElementById('zamAdres').value.trim();
  if (odbior === 'dostawa' && !adres) { err.textContent = 'Podaj adres dostawy.'; err.classList.add('widoczny'); return; }

  btn.disabled = true; btn.textContent = '⏳ Wysyłam...';
  const suma = window.koszyk.reduce((s, x) => s + x.cena * x.qty, 0);

  const { error } = await db.from('zamowienia').insert({
    user_id: window.zalogowanyUzytkownik.id,
    imie_nazwisko: document.getElementById('zamImie').value.trim(),
    telefon: document.getElementById('zamTel').value.trim(),
    email: document.getElementById('zamEmailField').value.trim(),
    sposob_odbioru: odbior,
    sklep: odbior !== 'dostawa' ? (odbior === 'rabka' ? 'Rabka-Zdrój' : 'Skawa') : null,
    adres: odbior === 'dostawa' ? adres : null,
    uwagi: document.getElementById('zamUwagi').value.trim(),
    produkty: window.koszyk,
    suma: suma,
    status: 'nowe'
  });

  if (error) {
    err.textContent = 'Błąd zapisu. Spróbuj ponownie.'; err.classList.add('widoczny');
    btn.disabled = false; btn.textContent = 'Złóż zamówienie →'; return;
  }
  suk.textContent = '✅ Zamówienie złożone! Skontaktujemy się z Tobą wkrótce.';
  suk.classList.add('widoczny');
  document.getElementById('zamowForm').style.display = 'none';
  window.koszyk = []; zapiszKoszyk(); aktualizujLicznik();
}
window.zlozZamowienie = zlozZamowienie;
