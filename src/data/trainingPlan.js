// Piano di Formazione SEFRI - Operatore/Operatrice Informatico AFC
// Ordinanza del 24 novembre 2017 - N. professione 88605

export const trainingPlan = {
  profession: "Operatore/Operatrice Informatico AFC",
  ordinanza: "24 novembre 2017",
  numProfessione: "88605",
  totalHours: 3680,
  
  competenceFields: [
    {
      id: "A",
      name: "Installazione, attivazione e manutenzione di dispositivi ICT",
      description: "Installazione, configurazione e manutenzione di dispositivi ICT e sistemi operativi",
      icon: "Monitor",
      competencies: [
        {
          id: "A1",
          name: "Installare, configurare e manutenere i dispositivi ICT e i relativi sistemi operativi",
          objectives: [
            { id: "A1.1", text: "Spiega i compiti e le funzionalità degli attuali sistemi operativi", level: "C2", modules: ["304", "305"] },
            { id: "A1.2", text: "Installa e configura gli attuali sistemi operativi secondo le direttive", level: "C4", modules: ["304", "305"] },
            { id: "A1.3", text: "Installa e configura le periferiche e le loro estensioni", level: "C3", modules: ["126"] },
            { id: "A1.4", text: "Installa sul posto i dispositivi secondo le specifiche aziendali e dal punto di vista dell'efficienza energetica", level: "C3", modules: ["304"] },
            { id: "A1.5", text: "Mette in atto le prescrizioni e i processi nell'ambito del Product Lifecycle Management", level: "C3", modules: ["437"] },
            { id: "A1.6", text: "Esegue aggiornamenti del firmware secondo le istruzioni dei produttori", level: "C1", modules: ["126"] },
            { id: "A1.7", text: "Utilizza gli attuali comandi specifici dei sistemi operativi", level: "C3", modules: ["304", "305"] },
            { id: "A1.8", text: "Separa i rifiuti e gli apparecchi inutilizzati e li porta ai centri di riciclaggio", level: "C3", modules: [] },
          ]
        },
        {
          id: "A2",
          name: "Installare e configurare applicazioni standard",
          objectives: [
            { id: "A2.1", text: "Installa e configura le applicazioni standard e le amministra", level: "C3", modules: ["304", "305"] },
            { id: "A2.2", text: "Aggiorna il software esistente alle attuali versioni", level: "C2", modules: ["304", "305"] },
            { id: "A2.3", text: "Descrive le differenti varianti di licenza", level: "C3", modules: ["304", "305"] },
            { id: "A2.4", text: "Applica i processi di gestione delle licenze", level: "C3", modules: ["304", "305"] },
          ]
        },
        {
          id: "A3",
          name: "Eseguire e valutare test di funzionamento",
          objectives: [
            { id: "A3.1", text: "Esegue i test di funzionamento secondo le direttive e valuta i risultati", level: "C4", modules: ["304"] },
            { id: "A3.2", text: "Adatta i test di funzionamento esistenti sulla base delle nuove condizioni quadro", level: "C3", modules: ["304"] },
            { id: "A3.3", text: "Esegue e documenta il procedimento dei test di funzionamento", level: "C4", modules: ["260"] },
          ]
        },
        {
          id: "A4",
          name: "Impiegare script di automazione",
          objectives: [
            { id: "A4.1", text: "Applica degli script e controlla la loro esecuzione", level: "C3", modules: ["122"] },
            { id: "A4.2", text: "Esegue delle modifiche alla funzionalità degli script", level: "C4", modules: ["122"] },
            { id: "A4.3", text: "Programma degli script semplici secondo le direttive", level: "C3", modules: ["122"] },
          ]
        }
      ]
    },
    {
      id: "B",
      name: "Garanzia del funzionamento dei dispositivi ICT connessi in rete",
      description: "Garanzia del funzionamento e della sicurezza dei dispositivi ICT in infrastrutture di rete",
      icon: "Network",
      competencies: [
        {
          id: "B1",
          name: "Connettere le periferiche e i relativi servizi alle infrastrutture di rete",
          objectives: [
            { id: "B1.1", text: "Spiega i compiti e le funzionalità di ogni singolo componente di una rete (Switch, Router, Firewall, Server, NAS, WLAN Access Point)", level: "C2", modules: ["117", "129", "261"] },
            { id: "B1.2", text: "Integra i dispositivi ICT in un ambiente di rete esistente", level: "C4", modules: ["126", "261"] },
            { id: "B1.3", text: "Riconosce i malfunzionamenti e li sa circoscrivere all'interno dell'ambiente di rete", level: "C4", modules: ["129", "261"] },
            { id: "B1.4", text: "Istruisce gli utenti nell'installazione e nell'utilizzo di applicazioni e servizi Cloud", level: "C2", modules: ["214", "437", "261"] },
          ]
        },
        {
          id: "B2",
          name: "Connettere i dispositivi ICT ai servizi dei server",
          objectives: [
            { id: "B2.1", text: "Collega i software sui dispositivi ICT ai rispettivi servizi dei server", level: "C3", modules: ["117", "126", "304", "305", "261"] },
            { id: "B2.2", text: "Attribuisce agli attuali servizi dei server (DNS, DHCP, Directory Services, Server Groupware) le loro funzionalità", level: "C2", modules: ["117", "126", "123"] },
            { id: "B2.3", text: "Riconosce negli attuali servizi dei server i malfunzionamenti e li sa risolvere", level: "C4", modules: ["117", "123", "261"] },
            { id: "B2.4", text: "Utilizza e configura i servizi dei server utilizzati in azienda sui dispositivi ICT", level: "C3", modules: ["126", "123", "261"] },
          ]
        },
        {
          id: "B3",
          name: "Garantire la sicurezza dei dispositivi ICT",
          objectives: [
            { id: "B3.1", text: "Descrive le basi della sicurezza IT e le possibili misure di protezione contro le minacce nel campo ICT", level: "C2", modules: ["263"] },
            { id: "B3.2", text: "Installa e configura sui dispositivi ICT gli attuali software di protezione", level: "C3", modules: ["263", "304"] },
            { id: "B3.3", text: "Protegge i dispositivi ICT dagli attuali pericoli sulla base delle direttive aziendali", level: "C3", modules: ["263"] },
            { id: "B3.4", text: "Applica le direttive e i processi di sicurezza interni all'azienda", level: "C3", modules: ["263"] },
            { id: "B3.5", text: "Utilizza le necessarie procedure per riconoscere ed eliminare gli attacchi attraverso software maligni", level: "C3", modules: ["263"] },
          ]
        }
      ]
    },
    {
      id: "C",
      name: "Assistenza agli utenti nell'impiego degli strumenti ICT",
      description: "Istruzione, assistenza e consulenza agli utenti nell'utilizzo di dispositivi e applicazioni ICT",
      icon: "Users",
      competencies: [
        {
          id: "C1",
          name: "Istruire e assistere gli utenti nell'impiego degli strumenti ICT",
          objectives: [
            { id: "C1.1", text: "Descrive gli elementi del contenuto di un'istruzione e li mette in pratica", level: "C3", modules: ["214"] },
            { id: "C1.2", text: "Prepara sistematicamente delle presentazioni e descrive i fattori di successo", level: "C2", modules: ["214", "431"] },
            { id: "C1.3", text: "Applica gli strumenti software adatti per la realizzazione di presentazioni", level: "C3", modules: ["260"] },
            { id: "C1.4", text: "Utilizza diversi media e strumenti d'aiuto come supporto alle presentazioni", level: "C3", modules: ["214", "431", "260"] },
            { id: "C1.5", text: "Mette in atto le istruzioni/presentazioni con tutte le misure necessarie", level: "C3", modules: ["214", "431"] },
          ]
        },
        {
          id: "C2",
          name: "Redigere e aggiornare istruzioni e liste di controllo per gli utenti",
          objectives: [
            { id: "C2.1", text: "Formula degli obiettivi semplici e chiari e sa interpretare degli obiettivi predefiniti", level: "C3", modules: ["431"] },
            { id: "C2.2", text: "Applica le direttive e i modelli di documentazione aziendale", level: "C3", modules: ["214", "260"] },
            { id: "C2.3", text: "Si procura con i mezzi a sua disposizione le informazioni necessarie", level: "C3", modules: ["431"] },
            { id: "C2.4", text: "Smista l'essenziale e l'irrilevante e fissa correttamente le priorità", level: "C4", modules: ["431"] },
            { id: "C2.5", text: "Redige delle guide comprensibili e strutturate in modo chiaro", level: "C3", modules: ["214", "260"] },
            { id: "C2.6", text: "Utilizza delle tecniche di visualizzazione appropriate per rappresentare le affermazioni", level: "C3", modules: ["431", "260"] },
            { id: "C2.7", text: "Applica gli strumenti software appropriati per realizzare la documentazione", level: "C3", modules: ["260"] },
          ]
        },
        {
          id: "C3",
          name: "Fornire consulenza e assistenza ai clienti nell'acquisto di dispositivi ICT",
          objectives: [
            { id: "C3.1", text: "Analizza le esigenze del cliente e le circostanze della situazione", level: "C3", modules: ["431", "262"] },
            { id: "C3.2", text: "Acquisisce dalla parte del cliente e dagli oggetti da acquistare i dati importanti", level: "C3", modules: ["431", "262"] },
            { id: "C3.3", text: "Paragona i dati acquisiti e confronta i vantaggi e gli svantaggi dei diversi prodotti", level: "C4", modules: ["431", "262"] },
            { id: "C3.4", text: "Presenta al cliente delle raccomandazioni in forma orale o scritta e le motiva", level: "C3", modules: ["431", "262", "260"] },
            { id: "C3.5", text: "Sbriga le attività amministrative di un processo di acquisto", level: "C3", modules: ["262"] },
          ]
        }
      ]
    },
    {
      id: "D",
      name: "Svolgimento di attività di supporto ICT",
      description: "First level e second level support, gestione dei progetti ICT e comunicazione con utenti e team",
      icon: "Headphones",
      competencies: [
        {
          id: "D1",
          name: "Elaborare le richieste dei clienti nel first level support e nel second level support",
          objectives: [
            { id: "D1.1", text: "Prende nota delle richieste o dei bisogni dei clienti e identifica la problematica", level: "C2", modules: ["214", "437"] },
            { id: "D1.2", text: "Circoscrive velocemente la problematica ed è in condizione di risolverla", level: "C4", modules: ["214", "437"] },
            { id: "D1.3", text: "Esegue i preparativi per evadere le richieste e stima l'investimento", level: "C3", modules: ["214", "437"] },
            { id: "D1.4", text: "Mette in atto efficacemente e in maniera strutturata i mandati", level: "C3", modules: ["214", "437"] },
            { id: "D1.5", text: "Documenta lo svolgimento in modo che il team possa seguire lo stato dei lavori", level: "C3", modules: ["214", "437"] },
            { id: "D1.6", text: "Informa i clienti in modo adeguato sullo stato dei lavori", level: "C2", modules: ["214", "437"] },
            { id: "D1.7", text: "Applica correttamente i termini tecnici nella comunicazione con il team e i clienti", level: "C3", modules: ["214", "437"] },
          ]
        },
        {
          id: "D2",
          name: "Comportarsi in maniera adeguata nei confronti dei clienti e all'interno del team",
          objectives: [
            { id: "D2.1", text: "Applica differenti tecniche di comunicazione per trattare le problematiche in modo mirato", level: "C3", modules: ["214", "437"] },
            { id: "D2.2", text: "Applica dei modelli di comunicazione nella collaborazione con i clienti e con il proprio team", level: "C3", modules: ["214", "437"] },
            { id: "D2.3", text: "Utilizza i feedback per migliorarsi e fornire un contributo per il successo del team", level: "C3", modules: ["214", "437"] },
            { id: "D2.4", text: "Spiega il processo dinamico di gruppo (ruoli e norme) e le fasi di sviluppo del team", level: "C2", modules: ["214", "437"] },
            { id: "D2.5", text: "Descrive le cause e la dinamica dei conflitti", level: "C2", modules: ["214", "437"] },
            { id: "D2.6", text: "Riconosce per tempo le situazioni di conflitto e intraprende le necessarie misure", level: "C4", modules: ["214", "437"] },
          ]
        },
        {
          id: "D3",
          name: "Svolgere le attività del settore ICT secondo metodi predefiniti e collaborare ai progetti",
          objectives: [
            { id: "D3.1", text: "Applica un modello (ad esempio IPERKA, modello 6 fasi) per l'attuazione di un'intera azione", level: "C3", modules: ["431"] },
            { id: "D3.2", text: "Descrive come i progetti sono pianificati, strutturati, iniziati, eseguiti e terminati", level: "C2", modules: ["431"] },
            { id: "D3.3", text: "Elabora dei piani per uno svolgimento sistematico di mandati", level: "C3", modules: ["431", "260"] },
            { id: "D3.4", text: "Utilizza in maniera mirata le fonti d'informazioni disponibili", level: "C3", modules: ["431"] },
            { id: "D3.5", text: "Applica metodi e principi per il miglioramento dell'efficacia e dell'efficienza del lavoro", level: "C3", modules: ["437"] },
          ]
        }
      ]
    }
  ]
};

// Livelli tassonomici di Bloom
export const bloomLevels = {
  C1: { name: "Sapere", description: "Ripetere le nozioni apprese e richiamarne in situazioni simili", color: "#9ca3af" },
  C2: { name: "Comprendere", description: "Spiegare o descrivere le nozioni apprese con parole proprie", color: "#93c5fd" },
  C3: { name: "Applicare", description: "Applicare le capacità/tecnologie apprese in diverse situazioni", color: "#60a5fa" },
  C4: { name: "Analizzare", description: "Analizzare una situazione complessa scomponendo i fatti", color: "#3b82f6" },
  C5: { name: "Sintetizzare", description: "Combinare i singoli elementi per formare un insieme", color: "#1d4ed8" },
  C6: { name: "Valutare", description: "Valutare un fatto in base a determinati criteri", color: "#1e40af" }
};

// Moduli di scuola professionale e corsi interaziendali
export const modules = {
  122: "Automatizzare delle attività attraverso un linguaggio di script",
  123: "Attivare i servizi di un server",
  126: "Installare le periferiche in rete",
  117: "Realizzare infrastruttura informatica e di rete per una piccola azienda",
  129: "Mettere in servizio i componenti di una LAN",
  214: "Istruire gli utenti nell'utilizzo di mezzi informatici",
  260: "Impiegare strumenti Office in modo orientato alla pratica",
  261: "Garantire il funzionamento dei dispositivi ICT nell'infrastruttura di rete",
  262: "Effettuare una valutazione di strumenti ICT",
  263: "Garantire la sicurezza dei dispositivi ICT",
  304: "Mettere in funzione un PC",
  305: "Installare, configurare ed amministrare un sistema operativo",
  431: "Eseguire in modo autonomo dei mandati IT",
  437: "Lavorare nel supporto"
};
