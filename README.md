# Monitor Formazione Apprendistato

Applicazione desktop sviluppata con **Electron + React** per monitorare il percorso formativo degli apprendisti del CERDD. I dati sono persistiti su **Supabase** (PostgreSQL cloud) e l'autenticazione avviene tramite credenziali gestite direttamente nella tabella `users`.

---

## Ruoli

| Ruolo | Permessi |
|---|---|
| `student` | Aggiornamento progresso, commenti, impostazioni personali, cambio password |
| `trainer` | Monitoraggio e validazione degli apprendisti assegnati, approvazione obiettivi |
| `inspector` | Accesso in sola lettura agli apprendisti collegati |
| `admin` | Gestione utenti completa, supervisione globale, reset password, assegnazioni bulk |

---

## Funzionalità principali

- **Autenticazione Supabase** con password hashate bcrypt. Al primo accesso con password predefinita (`Abc123!`) viene forzato il cambio password prima di accedere alla dashboard.
- **Restore sessione sicuro**: al refresh la sessione viene verificata direttamente sul DB per controllare il flag `must_change_password`.
- **Dashboard** con riepilogo progresso, statistiche e grafici trend per studente.
- **Piano formativo a 3 step** per ogni obiettivo: **Spiegato → Esercitato → Autonomo**. Completamento automatico se tutti e 3 i passi sono selezionati oppure se `Autonomo` è attivo.
- **Sezione obiettivi**: commenti, allegati file, stato, dettagli avanzamento, toolbar con ricerca/filtri/ordinamento e azioni bulk.
- **Ricerca avanzata** su obiettivi, commenti e notifiche con filtri per stato, campo, livello Bloom e anno.
- **Sistema notifiche**: categorie, ricerca, filtro per tipo, badge non lette, segna tutte lette, elimina lette, approvazione trainer.
- **Inbox** con gestione in blocco e interfaccia per ruolo.
- **Export report**: PDF (tabelle formattate con colonne 3 step), Excel multi-sheet e CSV con statistiche complete.
- **Gestione valutazioni materie**: il pulsante "Aggiungi Valutazione" sui moduli apre il form specifico per materia e voto.
- **Impostazioni personalizzate**: lingua, tema chiaro/scuro, vista iniziale, modalità compatta, riduzione animazioni, memoria ultimo studente selezionato.
- **Cambio password** con checklist requisiti in tempo reale (10–20 caratteri, maiuscole, minuscole, numero, simbolo speciale `! $ # _`).
- **Accessibilità WCAG**: navigazione da tastiera, supporto screen reader, contrasto potenziato, riduzione motion.
- **Performance**: debounce, throttle, memoization, cache con TTL, virtual scrolling.
- **Interfaccia multilingua**: Italiano, English, Deutsch, Français.
- **Session timeout**: logout automatico dopo 5 minuti di inattività con dialog di avviso 30 s prima.
- **Versioning automatico**: `npm run version:bump` aggiorna `package.json`, `src/appVersion.js` e questo README.

---

## Gestione utenti (admin)

- Creazione, modifica, eliminazione utenti.
- Ricerca e filtro per ruolo.
- Reset password → reimposta a `Abc123!` e setta `must_change_password = true` sul DB: al prossimo login l'utente sarà obbligato a cambiarla.
- Promozione anno di formazione e assegnazioni bulk trainer/inspector.
- **Badge ⚠️ arancione** accanto al nome: utente che usa ancora la password predefinita.
- **Badge ⚠️ rosso** accanto al nome: apprendista con periodo di apprendistato scaduto (data fine < oggi) — da eliminare o aggiornare.

---

## Stack tecnologico

| Libreria | Versione | Uso |
|---|---|---|
| React | 18 | UI renderer |
| Electron | 40 | Desktop wrapper |
| Material UI | 7 | Componenti UI |
| Framer Motion | 12 | Animazioni |
| Lucide React | 0.294 | Icone |
| Recharts | 3 | Grafici trend |
| jsPDF + AutoTable | 4 / 5 | Export PDF |
| XLSX | 0.18 | Export Excel |
| React Window | 2 | Virtualizzazione liste |
| Supabase JS | 2 | Database cloud |
| bcryptjs | 3 | Hashing password |

---

## Requisiti

- Node.js 18+
- npm
- Account Supabase (progetto già configurato)
- Windows 10+ / macOS / Linux

---

## Installazione

```bash
git clone <REPO_URL>
cd progetto-avanzamento-formazione
npm install
```

---

## Avvio in sviluppo

```bash
npm start
```

- `npm run react-start` — avvia React su porta **3003**
- `npm run electron-start` — avvia Electron
- `npm start` — avvia React + Electron insieme (usa `concurrently` + `wait-on`)

---

## Build produzione

```bash
npm run build
```

Esegue in sequenza:
1. build React (`react-scripts build`)
2. copia `main.js` → `build/electron.js`
3. packaging Electron con `electron-builder` (output in `dist/`)

---

## Versioning

Versione corrente: **`1.2.43`**

Regola incremento:
- patch standard: `1.1.0 → 1.1.1`
- rollover a 100: `1.1.99 → 1.2.0`

```bash
npm run version:bump
```

Aggiorna automaticamente `package.json`, `src/appVersion.js` e questo README.

---

## Struttura progetto

```text
.
├── main.js                              # Electron main process
├── package.json
├── electron-builder.json
├── public/
│   ├── index.html
│   └── uploads/                         # Allegati (Electron fs)
├── src/
│   ├── App.js                           # Root: gestione screen, sessione, inattività
│   ├── App.css                          # Stili globali e variabili CSS
│   ├── appVersion.js                    # Versione (auto-aggiornato)
│   ├── i18n.js                          # Traduzioni (it, en, de, fr)
│   ├── supabaseClient.js                # Istanza Supabase
│   ├── theme.js                         # Tema MUI
│   ├── components/
│   │   ├── ForceChangePasswordModal.js  # Modal cambio password obbligatorio
│   │   ├── SideMenu.js                  # Menu laterale e badge notifiche
│   │   ├── ProfileSection.js            # Profilo utente
│   │   ├── ProgressSection.js           # Progresso generale
│   │   ├── ObjectivesSection.js         # Obiettivi di formazione
│   │   ├── ObjectivesToolbar.js         # Toolbar ricerca/filtri obiettivi
│   │   ├── SearchSection.js             # Ricerca full-text
│   │   ├── InboxSection.js              # Notifiche e messaggi
│   │   ├── ExportSection.js             # Export PDF/Excel/CSV
│   │   ├── ManageSection.js             # Gestione utenti (admin)
│   │   ├── GradingSection.js            # Valutazioni materie
│   │   ├── GradingDetailModal.js        # Dettaglio valutazione
│   │   ├── DashboardCustomizeSection.js # Personalizzazione dashboard
│   │   ├── SettingsSection.js           # Impostazioni + cambio password
│   │   ├── ProgressTrendChart.js        # Grafici trend (Recharts)
│   │   └── ThemeProvider.js             # Context tema chiaro/scuro
│   ├── screens/
│   │   ├── LoginScreen.js               # Autenticazione
│   │   ├── DashboardScreen.js           # Orchestratore principale
│   │   ├── HomeScreen.js                # Schermata home
│   │   └── CourseDetailScreen.js        # Dettaglio corso
│   ├── data/
│   │   ├── users.supabase.js            # CRUD utenti, auth bcrypt, flag password
│   │   ├── progress.supabase.js         # Progressi su Supabase
│   │   ├── progress_history.supabase.js # Snapshot storici su Supabase
│   │   ├── grades.supabase.js           # Valutazioni su Supabase
│   │   ├── notifications.supabase.js    # Notifiche su Supabase
│   │   ├── dashboardPreferences.supabase.js
│   │   ├── trainingPlan.js              # Piano formativo (statico)
│   │   ├── exportReports.js             # Generazione PDF/Excel/CSV
│   │   ├── files.js                     # Allegati (Electron fs + fallback)
│   │   └── translations.js              # Stringhe extra i18n
│   ├── hooks/
│   │   ├── accessibility.js             # Tastiera, screen reader, font resize
│   │   └── inactivityTimeout.js         # Logout automatico per inattività
│   └── utils/
├── migrazione_dati/                     # CSV per caricamento iniziale dati
├── migrazione_database/                 # CSV storici precedente versione
├── scripts/
│   └── bump-version.js
└── build/                               # Output build (generato, non committare)
```

---

## Database Supabase — Schema tabella `users`

| Colonna | Tipo | Note |
|---|---|---|
| `id` | `int8` PK | Auto-increment |
| `nome` | `text` | |
| `cognome` | `text` | |
| `email` | `text` | |
| `ruolo` | `text` | `student` / `trainer` / `inspector` / `admin` |
| `password_hash` | `text` | Hash bcrypt |
| `must_change_password` | `boolean` | `true` = forzato cambio al prossimo login |
| `trainer_id` | `int8` FK | Formatore assegnato (solo studenti) |
| `inspector_id` | `int8` FK | Ispettore assegnato (solo studenti) |
| `numero_studente` | `text` | |
| `anno_formazione` | `int4` | |
| `data_inizio_apprendistato` | `date` | |
| `data_fine_apprendistato` | `date` | |
| `stato` | `text` | |

> **Importante**: se si ricrea il DB, aggiungere la colonna:
> ```sql
> ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
> ```

---

## Architettura

### Layer

1. **Electron (main process)** — `main.js`: crea finestra, carica React (dev `http://localhost:3003`, prod `build/index.html`).
2. **React (renderer)** — gestisce login, stato utente, lingua, routing interno tra schermate.

### Navigazione interna

Non usa React Router. La vista è gestita con stato:

- `currentScreen`: `login` / `forceChangePassword` / `dashboard`
- `currentView` (in dashboard): `dashboard`, `objectives`, `search`, `statistics`, `export`, `inbox`, `manage`, `settings`

### Flusso login

```
LoginScreen
  → authenticateUser (users.supabase.js)
      → verifica bcrypt
      → migrazione trasparente password plain → bcrypt
      → controlla must_change_password (DB) o password === 'Abc123!'
  → App.js: handleLogin
      → mustChangePassword? → ForceChangePasswordModal (blocca accesso)
      → altrimenti → DashboardScreen + salva sessione in localStorage
```

### Restore sessione al refresh

```
App.js useEffect
  → legge localStorage
  → chiama getUserById(id) su Supabase
      → must_change_password true? → forceChangePassword screen
      → false? → dashboard (sessione ripristinata)
      → errore DB? → fallback dati cache localStorage
```

### Cambio password obbligatorio

1. Admin crea utente → `must_change_password = true`, password = `Abc123!` hashata.
2. Admin fa reset password → stessa cosa.
3. Al login, se flag attivo **oppure** password inserita è `Abc123!` → modal bloccante.
4. Modal: checklist requisiti in tempo reale, nessuna possibilità di chiudere senza completare.
5. `updateUserPassword` → salva hash bcrypt + setta `must_change_password = false`.

---

## Flussi principali runtime

### Aggiornamento obiettivi

- 3 step per obiettivo: `spiegato`, `esercitato`, `autonomo`.
- Completato se `autonomo = true` **oppure** tutti e 3 i step sono `true`.
- Salvato su Supabase via `progress.supabase.js`.

### Notifiche

- Alla transizione a completato di un obiettivo studente → notifica per il trainer.
- Salvate su Supabase via `notifications.supabase.js`.
- `SideMenu` mostra badge con contatore non lette.

### Assegnazioni apprendista

- Ogni studente ha `trainerId` e `inspectorId`.
- Il trainer vede solo i propri apprendisti.
- L'ispettore vede solo gli apprendisti con il proprio `inspectorId`.

### Trend storico

- Ogni aggiornamento progresso genera snapshot via `progress_history.supabase.js`.
- Il grafico usa questi snapshot per andamento temporale e stima fine percorso.

---

## Sicurezza

Il file `main.js` è configurato in modo permissivo per lo sviluppo (`nodeIntegration: true`, `contextIsolation: false`, `webSecurity: false`).

**Questa versione NON è pronta per il deploy in produzione pubblica.**

Per hardening produzione:
- `contextIsolation: true`
- `nodeIntegration: false`
- `preload` script con API esposte esplicitamente
- Variabili Supabase URL/Key in variabili d'ambiente (`.env`), non nel sorgente
- Rimuovere `webSecurity: false`

---

## Styling e tema

- CSS in `src/App.css` con variabili CSS (`:root`) per colori e superfici.
- `ThemeProvider` sincronizza classe body (`dark-mode`) e tema MUI (`src/theme.js`).
- Supporto tema chiaro/scuro con persistenza in `localStorage`.

---

## Export e reporting

| Formato | Libreria | Contenuto |
|---|---|---|
| PDF | jsPDF + AutoTable | Tabelle formattate con colonne 3 step |
| Excel | XLSX | Multi-sheet con statistiche complete |
| CSV | nativo | Export tabellare |

---

## Allegati

- Salvataggio tramite `saveCommentFile` (`src/data/files.js`).
- In Electron: scrive in `public/uploads` via `fs`.
- In browser: Data URL in memoria (fallback).

---

## Guida sviluppatori

### Dove mettere una modifica

| Tipo | Dove |
|---|---|
| Regola business obiettivi | `src/screens/DashboardScreen.js` + `src/data/progress.supabase.js` |
| Nuova sezione dashboard | Componente in `src/components/` + voce in `SideMenu.js` + switch in `DashboardScreen.js` |
| Nuove traduzioni | `src/i18n.js` (tutte e 4 le lingue) |
| Nuova colonna DB | Aggiornare `normalizeUser` e `denormalizeUser` in `users.supabase.js` |
| Nuovo export | `src/data/exportReports.js` |

### Convenzioni

- Codice sempre role-aware (`student` / `trainer` / `inspector` / `admin`).
- Logica business centralizzata in `src/data/`, non nei componenti.
- Ogni nuova chiave i18n va aggiunta in **tutte e 4 le lingue** (it, en, de, fr).
- Aggiornare questo README quando cambia: flusso login, schema DB, struttura file.

---

## Troubleshooting

| Problema | Soluzione |
|---|---|
| Schermata bianca in Electron | Verificare che React dev server sia attivo su porta `3003` |
| Build non parte | Controllare dipendenze e `npm run react-build` |
| Dati incoerenti dopo test | Pulire `localStorage` del profilo test |
| Traduzioni mancanti | Aggiungere chiave in `i18n.js` per tutte le lingue |
| Modal cambio password loop | Verificare che `updateUserPassword` aggiorni `must_change_password = false` su Supabase |
| Badge warning non appare | Verificare che la colonna `must_change_password` esista nella tabella `users` |

---

## Roadmap — cosa manca

### Alta priorità
- [x] **Variabili d'ambiente**: spostare URL e chiave Supabase in `.env` (ora sono hardcoded in `supabaseClient.js`)
- [x] **Hardening Electron**: `contextIsolation: true`, `nodeIntegration: false`, `preload` script
- [x] **Audit log**: tabella Supabase dedicata per tracciare reset password, creazione/eliminazione utenti, accessi

### Media priorità
- [ ] **Test automatici**: login, obiettivi, notifiche, export (Jest + React Testing Library)
- [x] **Gestione allegati su Supabase Storage**: attualmente i file sono locali (Electron fs)

### Bassa priorità
- [x] **Notifiche push desktop**: via Electron `Notification` API + Supabase Realtime — il trainer riceve notifica push quando uno studente completa un obiettivo; lo studente riceve conferma push locale al completamento
- [x] **Archivio apprendisti**: sezione separata per apprendisti con apprendistato scaduto invece di eliminarli
