# TANI — Sklep Osiedlowy

Strona internetowa sklepu osiedlowego **TANI** w Rabce-Zdroju i Skawie.  
Projekt stworzony dla rodziny Stolarczyków — działają nieprzerwanie od 1999 roku.

## Funkcje

- **Trzy języki** — polski, ukraiński, angielski
- **Oferta produktów** — pobierana dynamicznie z bazy Supabase
- **Koszyk zakupowy** — zapisany w localStorage
- **Logowanie / rejestracja** — z imieniem i nazwiskiem (Supabase Auth)
- **Składanie zamówień** — wybór odbioru: Rabka-Zdrój, Skawa lub dostawa
- **Panel użytkownika** — historia zamówień
- **Formularz kontaktowy** — z walidacją
- **Mapa Google** — lokalizacja sklepów
- **Link do Allegro** — sklep internetowy

## Struktura plików

| Plik | Opis |
|------|------|
| `index.html` | Główna strona (HTML + struktura) |
| `styles.css` | Wszystkie style CSS |
| `main.js` | Konfiguracja Supabase, produkty, koszyk, formularz kontaktowy |
| `auth.js` | Logowanie, rejestracja, panel użytkownika |
| `order.js` | Formularz zamówienia i zapis do bazy |

## Backend

Baza danych i autentykacja: **Supabase**  
Tabele: `produkty`, `zamowienia`

> Klucz w pliku `main.js` to klucz publiczny (publishable) — jest bezpieczny do umieszczenia w kodzie frontendowym.

## Uruchomienie lokalne

Strona jest czystym HTML/CSS/JS — wystarczy otworzyć `index.html` w przeglądarce lub użyć prostego serwera:

```bash
npx serve .
# lub
python3 -m http.server 8000
```

> Ze względu na CORS przy pobieraniu produktów z Supabase, zalecane jest uruchomienie przez serwer (nie bezpośrednio z dysku).

## GitHub Pages

Projekt jest skonfigurowany do automatycznego deployu na **GitHub Pages** po każdym pushu do gałęzi `main`.  
Wystarczy wrzucić repozytorium na GitHub i włączyć Pages w ustawieniach (lub workflow samo to zrobi jeśli masz uprawnienia).

## Autor

Stworzone z ❤️ dla rodziców.
