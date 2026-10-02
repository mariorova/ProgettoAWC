/* ==========================================================================
   File per gestire utenti, profilo, condivisioni e commenti.
   Fatto da Diego.
   ========================================================================== */

// Qui ci siamo salvati un po' di artisti famosi per ogni genere 
// così l'utente fa prima a sceglierli durante la registrazione
const artistiConsigliatiPerGenere = {
    "Rap": ["Marracash", "Guè", "Fabri Fibra", "Salmo", "Noyz Narcos", "Kanye West", "2Pac"],
    "Trap": ["Sfera Ebbasta", "Lazza", "Shiva", "Geolier", "Tony Effe", "Travis Scott", "Metro Boomin"],
    "Rock": ["Queen", "AC/DC", "Nirvana", "Pink Floyd", "The Rolling Stones"],
    "Pop": ["Michael Jackson", "Dua Lipa", "Coldplay", "Ed Sheeran", "Taylor Swift"],
    "Hip Hop": ["Eminem", "Drake", "Kendrick Lamar", "Jay-Z", "Caparezza"],
    "Classica": ["Ludwig van Beethoven", "W.A. Mozart", "J.S. Bach", "Ennio Morricone"],
    "Electronic": ["Daft Punk", "David Guetta", "Avicii", "Calvin Harris"],
    "Indie": ["Arctic Monkeys", "The Strokes", "Florence + The Machine", "Calcutta"]
};

// Aspettiamo che la pagina sia caricata per collegare i bottoni alle funzioni
document.addEventListener('DOMContentLoaded', () => {

    // Nascondiamo il login e mostriamo la registrazione 
    // e.preventDefault() serve per non far ricaricare la pagina quando clicchiamo il link
    document.getElementById('go-to-register').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-box').style.display = 'none';
        document.getElementById('register-box').style.display = 'block';
    });

    document.getElementById('go-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-box').style.display = 'none';
        document.getElementById('login-box').style.display = 'block';
    });

    // Apre e chiude il menu a tendina quando clicchi sull'avatar in alto a destra
    document.getElementById('avatar-btn').addEventListener('click', () => {
        const dropdown = document.getElementById('profile-dropdown');
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    // Controlliamo quando l'utente clicca sulle checkbox per suggerirgli gli artisti
    const regCheckboxes = document.querySelectorAll('input[name="reg-genere"]');
    regCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            aggiornaSuggerimentiArtisti('reg-genere', 'artisti-suggeriti-container', 'reg-artisti');
        });
    });

    // Stessa cosa di sopra, ma per quando si modifica il profilo dopo il login
    const editCheckboxes = document.querySelectorAll('input[name="edit-genere"]');
    editCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            aggiornaSuggerimentiArtisti('edit-genere', 'edit-artisti-suggeriti-container', 'edit-artisti');
        });
    });

    // Colleghiamo i bottoni HTML alle nostre funzioni Javascript
    document.getElementById('btn-register').addEventListener('click', registraUtente);
    document.getElementById('btn-login').addEventListener('click', effettuaLogin);
    document.getElementById('btn-logout').addEventListener('click', effettuaLogout);
    document.getElementById('btn-update-profile').addEventListener('click', aggiornaProfilo);
    document.getElementById('btn-delete-account').addEventListener('click', eliminaAccount);
    document.getElementById('btn-crea-comunita').addEventListener('click', creaComunita);
    document.getElementById('btn-carica-comunita').addEventListener('click', mostraComunita);
    document.getElementById('btn-condividi').addEventListener('click', condividiPlaylist);
    document.getElementById('btn-cerca-condivise').addEventListener('click', mostraPlaylistCondivise);

    // All'avvio controlliamo subito se c'è già un utente loggato nel localStorage
    verificaSessione();
});

// Funzione con espressione regolare per verificare che l'email sia scritta bene (con chiocciola, dominio ed estensione)
function validaEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// Funzione per controllare che la password sia sicura: almeno 8 caratteri, una maiuscola, una minuscola, un numero e un simbolo speciale
function validaPassword(password) {
    const minLunghezza = password.length >= 8;
    const haMaiuscola = /[A-Z]/.test(password);
    const haMinuscola = /[a-z]/.test(password);
    const haNumero = /[0-9]/.test(password);
    const haSpeciale = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return minLunghezza && haMaiuscola && haMinuscola && haNumero && haSpeciale;
}

// Funzione per far apparire i bottoncini con i nomi degli artisti consigliati
function aggiornaSuggerimentiArtisti(inputName, containerId, inputArtistiId) {
    // Prendo solo le checkbox che l'utente ha spuntato
    const checkboxes = document.querySelectorAll(`input[name="${inputName}"]:checked`);
    const container = document.getElementById(containerId);

    // Prendo i valori delle checkbox selezionate e li metto in un array
    const generiSelezionati = Array.from(checkboxes).map(cb => cb.value);

    // Pulisco i suggerimenti vecchi
    container.innerHTML = "";

    // Se l'utente toglie tutte le spunte, mostro un messaggio normale
    if (generiSelezionati.length === 0) {
        container.innerHTML = "<small class='text-muted'>Seleziona i generi sopra per vedere i consigli</small>";
        return;
    }

    // Usiamo Set così non ci sono artisti doppi se l'utente sceglie più generi che hanno lo stesso artista
    let suggerimenti = new Set();

    generiSelezionati.forEach(genere => {
        if (artistiConsigliatiPerGenere[genere]) {
            artistiConsigliatiPerGenere[genere].forEach(artista => suggerimenti.add(artista));
        }
    });

    // Per ogni artista suggerito creo un bottoncino (badge)
    suggerimenti.forEach(artista => {
        const badge = document.createElement("span");
        badge.className = "artist-tag";
        badge.innerText = "+ " + artista;

        // Se clicchi sul suggerimento, lo aggiungiamo alla casella di testo
        badge.addEventListener('click', () => {
            const input = document.getElementById(inputArtistiId);
            // Dividiamo gli artisti già scritti togliendo gli spazi
            let attuali = input.value.split(',').map(s => s.trim()).filter(s => s !== "");

            // Controlliamo che l'artista non sia già stato aggiunto
            if (!attuali.includes(artista)) {
                attuali.push(artista);
                input.value = attuali.join(', '); // Ricreo la stringa separata da virgole
            }
        });

        // Metto il bottone nella pagina
        container.appendChild(badge);
    });
}

// Funzione per registrare un nuovo utente salvandolo nel localStorage
function registraUtente() {
    // Prendiamo i dati e togliamo gli spazi all'inizio e alla fine con trim()
    const username = document.getElementById('reg-username').value.trim();
    // Mettiamo l'email tutta in minuscolo per evitare errori di battitura
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;

    const checkedGeneri = document.querySelectorAll('input[name="reg-genere"]:checked');
    const generi = Array.from(checkedGeneri).map(cb => cb.value).join(', ');
    const artisti = document.getElementById('reg-artisti').value.trim();

    // Controlliamo che l'utente non abbia lasciato campi vuoti
    if (!username || !email || !password) {
        alert("Inserisci Nome Utente, Email e Password.");
        return;
    }

    // Controlliamo che l'email sia valida con la regex
    if (!validaEmail(email)) {
        alert("Formato Email non valido. Inserisci un'email corretta (es. nome@dominio.it).");
        return;
    }

    // Controlliamo che la password rispetti i vincoli di sicurezza richiesti
    if (!validaPassword(password)) {
        alert("Password non sicura!\nLa password deve contenere:\n- Almeno 8 caratteri\n- Almeno una lettera maiuscola\n- Almeno una lettera minuscola\n- Almeno un numero\n- Almeno un carattere speciale (es. !@#$%^&*)");
        return;
    }

    let utenti = JSON.parse(localStorage.getItem('sn4m_utenti')) || [];

    // Usiamo some() per vedere se l'email è già stata usata da un altro utente
    if (utenti.some(u => u.email === email)) {
        alert("Esiste già un account con questa email.");
        return;
    }

    // Creiamo l'oggetto utente da salvare
    const nuovoUtente = {
        username: username,
        email: email,
        password: password, // Salviamo la password in chiaro (il prof ha detto che va bene così per questo progetto)
        preferenze: { generi: generi, artisti: artisti },
        comunitaIscritte: []
    };

    utenti.push(nuovoUtente);
    localStorage.setItem('sn4m_utenti', JSON.stringify(utenti));

    alert("Registrazione completata. Ora puoi accedere.");

    // Cambiamo schermata nascondendo la registrazione e mostrando il login
    document.getElementById('register-box').style.display = 'none';
    document.getElementById('login-box').style.display = 'block';
}

// Funzione per fare il login
function effettuaLogin() {
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    // Controlliamo che non abbia lasciato i campi vuoti
    if (!email || !password) {
        alert("Inserisci sia email che password.");
        return;
    }

    // Controlliamo che l'email abbia un formato valido
    if (!validaEmail(email)) {
        alert("Inserisci un formato email valido per accedere.");
        return;
    }

    let utenti = JSON.parse(localStorage.getItem('sn4m_utenti')) || [];

    // Cerchiamo l'utente con l'email e la password giuste
    let utenteTrovato = utenti.find(u => u.email === email && u.password === password);

    if (!utenteTrovato) {
        alert("Credenziali non valide.");
        return;
    }

    // Salviamo l'utente loggato in una variabile apposta del localStorage per ricordarci di lui
    localStorage.setItem('sn4m_utenteLoggato', JSON.stringify(utenteTrovato));

    // Aggiorniamo l'interfaccia
    verificaSessione();
}

// Questa funzione decide se mostrare la pagina di login o la dashboard principale
function verificaSessione() {
    const utenteLoggato = JSON.parse(localStorage.getItem('sn4m_utenteLoggato'));

    if (utenteLoggato) {
        // Nascondiamo il login e mostriamo l'app
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('app-content').style.display = 'block';

        const userMenu = document.getElementById('user-menu-container');
        if (userMenu) userMenu.style.setProperty('display', 'flex', 'important');

        // Mettiamo l'iniziale del nome utente nel tondino dell'avatar
        document.getElementById('avatar-initial').innerText = utenteLoggato.username.charAt(0).toUpperCase();

        caricaDatiProfilo(utenteLoggato);

        // Diciamo alla parte di Mario di caricare subito il token Spotify e le playlist
        if (typeof generaToken === 'function') {
            generaToken();
        }
        if (typeof mostraPlaylist === 'function') {
            mostraPlaylist();
        }
    } else {
        // Se non c'è utente, mostriamo di nuovo il form di login
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('app-content').style.display = 'none';

        const userMenu = document.getElementById('user-menu-container');
        if (userMenu) userMenu.style.setProperty('display', 'none', 'important');
    }
}

// Funzione per uscire dall'account
function effettuaLogout() {
    localStorage.removeItem('sn4m_utenteLoggato');

    // Ricarichiamo la pagina per pulire tutto ed evitare che l'utente dopo 
    // veda dati vecchi rimasti nella memoria del browser
    window.location.reload();
}

// Mostra i dati dell'utente nel menu a tendina del profilo
function caricaDatiProfilo(utente) {
    const box = document.getElementById('profile-info');
    box.innerHTML = `
        <p class="mb-1"><strong>Utente:</strong> ${utente.username}</p>
        <p class="mb-1"><strong>Email:</strong> ${utente.email}</p>
        <p class="mb-1"><strong>Generi:</strong> ${utente.preferenze.generi || 'Nessuno'}</p>
        <p class="mb-0"><strong>Artisti:</strong> ${utente.preferenze.artisti || 'Nessuno'}</p>
    `;
}

// Salva le modifiche ai generi e artisti preferiti
function aggiornaProfilo() {
    let utenteLoggato = JSON.parse(localStorage.getItem('sn4m_utenteLoggato'));
    if (!utenteLoggato) return;

    // Vedo cosa ha cliccato di nuovo
    const checkedGeneri = document.querySelectorAll('input[name="edit-genere"]:checked');
    const nuoviGeneri = Array.from(checkedGeneri).map(cb => cb.value).join(', ');
    const nuoviArtisti = document.getElementById('edit-artisti').value.trim();

    if (nuoviGeneri) utenteLoggato.preferenze.generi = nuoviGeneri;
    if (nuoviArtisti) utenteLoggato.preferenze.artisti = nuoviArtisti;

    // Aggiorno l'utente loggato
    localStorage.setItem('sn4m_utenteLoggato', JSON.stringify(utenteLoggato));

    // Devo aggiornare anche l'array generale con tutti gli utenti per non perdere il dato
    let utenti = JSON.parse(localStorage.getItem('sn4m_utenti')) || [];
    let idx = utenti.findIndex(u => u.email === utenteLoggato.email);
    if (idx !== -1) {
        utenti[idx] = utenteLoggato;
        localStorage.setItem('sn4m_utenti', JSON.stringify(utenti));
    }

    alert("Profilo aggiornato.");
    caricaDatiProfilo(utenteLoggato);
}

// Funzione per cancellare definitivamente il profilo
function eliminaAccount() {
    let utenteLoggato = JSON.parse(localStorage.getItem('sn4m_utenteLoggato'));
    if (!utenteLoggato) return;

    if (confirm("Sei sicuro di voler eliminare definitivamente il tuo profilo?")) {
        let utenti = JSON.parse(localStorage.getItem('sn4m_utenti')) || [];

        // Togliamo l'utente dall'array usando filter() ricreando un array senza di lui
        utenti = utenti.filter(u => u.email !== utenteLoggato.email);

        localStorage.setItem('sn4m_utenti', JSON.stringify(utenti));

        // Rimuoviamo la sessione e disconnettiamo
        localStorage.removeItem('sn4m_utenteLoggato');
        alert("Account eliminato con successo.");

        verificaSessione();
    }
}

// Funzione per creare un nuovo gruppo (comunità)
function creaComunita() {
    const titolo = document.getElementById('comm-titolo').value.trim();
    const desc = document.getElementById('comm-desc').value.trim();
    const tag = document.getElementById('comm-tag').value.trim();
    const utenteLoggato = JSON.parse(localStorage.getItem('sn4m_utenteLoggato'));

    if (!titolo || !desc) {
        alert("Inserisci titolo e descrizione per la comunità.");
        return;
    }

    let comunita = JSON.parse(localStorage.getItem('sn4m_comunita')) || [];

    // Controllo che non esista già una comunità col nome uguale
    if (comunita.some(c => c.titolo.toLowerCase() === titolo.toLowerCase())) {
        alert("Esiste già una comunità con questo titolo.");
        return;
    }

    // Prepariamo l'oggetto comunità da salvare
    const nuovaComm = {
        titolo: titolo,
        descrizione: desc,
        tag: tag || "generale",
        creatore: utenteLoggato.email, // Ci salviamo chi l'ha creata per fargliela eliminare in futuro
        membri: [utenteLoggato.email]  // Chi la crea è iscritto in automatico
    };

    comunita.push(nuovaComm);
    localStorage.setItem('sn4m_comunita', JSON.stringify(comunita));

    // Aggiungo il gruppo alla lista delle comunità a cui l'utente è iscritto
    if (!utenteLoggato.comunitaIscritte.includes(titolo)) {
        utenteLoggato.comunitaIscritte.push(titolo);
        localStorage.setItem('sn4m_utenteLoggato', JSON.stringify(utenteLoggato));

        // FIX: Sincronizziamo l'array generale di tutti gli utenti, sennò al prossimo login si perde il dato!
        let utenti = JSON.parse(localStorage.getItem('sn4m_utenti')) || [];
        let idx = utenti.findIndex(u => u.email === utenteLoggato.email);
        if (idx !== -1) {
            utenti[idx] = utenteLoggato;
            localStorage.setItem('sn4m_utenti', JSON.stringify(utenti));
        }
    }

    alert("Comunità creata con successo.");
    mostraComunita();
}

// Mostra l'elenco dei gruppi e i pulsanti giusti (Unisciti, Abbandona o Elimina)
function mostraComunita() {
    let comunita = JSON.parse(localStorage.getItem('sn4m_comunita')) || [];
    let utenteLoggato = JSON.parse(localStorage.getItem('sn4m_utenteLoggato'));
    const container = document.getElementById('comunita-lista');

    if (comunita.length === 0) {
        container.innerHTML = "<p class='text-muted small'>Nessuna comunità creata.</p>";
        return;
    }

    let html = "<div class='list-group list-group-flush'>";
    for (let i = 0; i < comunita.length; i++) {
        let c = comunita[i];

        // Capiamo se l'utente fa parte della comunità o se l'ha creata lui
        let giaIscritto = c.membri.includes(utenteLoggato.email);
        let eCreatore = c.creatore === utenteLoggato.email;

        html += `
            <div class='list-group-item px-0'>
                <div class='d-flex justify-content-between align-items-center'>
                    <div class='fw-bold'>${c.titolo}</div>
                    <!-- Mostriamo il tasto elimina solo a chi ha creato il gruppo -->
                    ${eCreatore ? `<button onclick="eliminaComunita('${c.titolo}')" class='btn btn-link btn-sm text-danger p-0'>Elimina</button>` : ''}
                </div>
                <div class='small text-muted'>${c.descrizione}</div>
                <div class='small text-secondary'>Tag: ${c.tag} | Membri: ${c.membri.length}</div>
        `;

        if (!giaIscritto) {
            // L'utente non è dentro, mostriamo "Unisciti"
            html += `<button onclick="uniscitiAComunita('${c.titolo}')" class="btn btn-sm btn-success mt-2">Unisciti</button>`;
        } else {
            // L'utente è dentro, mostriamo "Abbandona"
            html += `<div class="d-flex align-items-center gap-2 mt-2">
                        <span class="badge bg-secondary">Iscritto</span>
                        <button onclick="abbandonaComunita('${c.titolo}')" class="btn btn-sm btn-outline-danger py-0 px-2" style="font-size: 0.75em;">Abbandona</button>
                     </div>`;
        }

        html += `</div>`;
    }
    html += "</div>";

    container.innerHTML = html;
}

// Rimuove l'utente dal gruppo
window.abbandonaComunita = function (titoloComunita) {
    let comunita = JSON.parse(localStorage.getItem('sn4m_comunita')) || [];
    let utenteLoggato = JSON.parse(localStorage.getItem('sn4m_utenteLoggato'));

    let comm = comunita.find(c => c.titolo === titoloComunita);
    if (comm) {
        // Togliamo l'email dall'array dei membri
        comm.membri = comm.membri.filter(email => email !== utenteLoggato.email);
        localStorage.setItem('sn4m_comunita', JSON.stringify(comunita));

        // Togliamo il gruppo dall'array dell'utente
        utenteLoggato.comunitaIscritte = utenteLoggato.comunitaIscritte.filter(t => t !== titoloComunita);
        localStorage.setItem('sn4m_utenteLoggato', JSON.stringify(utenteLoggato));

        // Sincronizziamo anche il DB degli utenti
        let utenti = JSON.parse(localStorage.getItem('sn4m_utenti')) || [];
        let idx = utenti.findIndex(u => u.email === utenteLoggato.email);
        if (idx !== -1) {
            utenti[idx] = utenteLoggato;
            localStorage.setItem('sn4m_utenti', JSON.stringify(utenti));
        }

        alert("Hai abbandonato la comunità: " + titoloComunita);
        mostraComunita();

        // Se abbandoni un gruppo, spariscono anche le playlist di quel gruppo dalla bacheca
        if (typeof mostraPlaylistCondivise === 'function') {
            mostraPlaylistCondivise();
        }
    }
};

// Funzione per il creatore per cancellare la comunità
window.eliminaComunita = function (titoloComunita) {
    let comunita = JSON.parse(localStorage.getItem('sn4m_comunita')) || [];

    if (confirm(`Sei sicuro di voler eliminare la comunità '${titoloComunita}'?`)) {
        // Eliminiamo con filter
        comunita = comunita.filter(c => c.titolo !== titoloComunita);
        localStorage.setItem('sn4m_comunita', JSON.stringify(comunita));

        alert("Comunità eliminata con successo.");
        mostraComunita();
    }
};

// Iscrive l'utente a un gruppo
window.uniscitiAComunita = function (titoloComunita) {
    let comunita = JSON.parse(localStorage.getItem('sn4m_comunita')) || [];
    let utenteLoggato = JSON.parse(localStorage.getItem('sn4m_utenteLoggato'));

    let comm = comunita.find(c => c.titolo === titoloComunita);

    // Controlliamo che esista e che non sia già dentro
    if (comm && !comm.membri.includes(utenteLoggato.email)) {
        comm.membri.push(utenteLoggato.email);
        localStorage.setItem('sn4m_comunita', JSON.stringify(comunita));

        utenteLoggato.comunitaIscritte.push(titoloComunita);
        localStorage.setItem('sn4m_utenteLoggato', JSON.stringify(utenteLoggato));

        // Sincronizziamo il DB degli utenti
        let utenti = JSON.parse(localStorage.getItem('sn4m_utenti')) || [];
        let idx = utenti.findIndex(u => u.email === utenteLoggato.email);
        if (idx !== -1) {
            utenti[idx] = utenteLoggato;
            localStorage.setItem('sn4m_utenti', JSON.stringify(utenti));
        }

        alert("Iscrizione completata alla comunità: " + titoloComunita);
        mostraComunita();
    }
};

// Funzione per pubblicare una playlist in una comunità
function condividiPlaylist() {
    const nomePlaylist = document.getElementById('share-playlist-name').value.trim();
    const titoloComunita = document.getElementById('share-comm-title').value.trim();
    const utenteLoggato = JSON.parse(localStorage.getItem('sn4m_utenteLoggato'));

    let miePlaylist = JSON.parse(localStorage.getItem('sn4m_playlists')) || [];
    // Controllo che la playlist esista e sia proprio di questo utente
    let playlistTrovata = miePlaylist.find(p => p.nome === nomePlaylist && p.proprietario === utenteLoggato.email);

    if (!playlistTrovata) {
        alert("Playlist non trovata tra le tue playlist private.");
        return;
    }

    let comunita = JSON.parse(localStorage.getItem('sn4m_comunita')) || [];
    let commTarget = comunita.find(c => c.titolo.toLowerCase() === titoloComunita.toLowerCase());

    // Per poter condividere, devi prima essere iscritto al gruppo
    if (!commTarget || !commTarget.membri.includes(utenteLoggato.email)) {
        alert("Non sei iscritto a questa comunità o la comunità non esiste.");
        return;
    }

    let condivisioni = JSON.parse(localStorage.getItem('sn4m_condivisioni')) || [];

    // Creiamo una copia della playlist da mettere nei post condivisi
    const nuovaCondivisione = {
        id: Date.now(), // Serve un ID per i commenti
        nomePlaylist: playlistTrovata.nome,
        descrizione: playlistTrovata.descrizione || "Nessuna descrizione",
        tag: playlistTrovata.tag || "",
        canzoni: playlistTrovata.canzoni || [],
        proprietario: utenteLoggato.email,
        comunita: commTarget.titolo,
        commenti: [] // Prepariamo un array vuoto per i commenti
    };

    condivisioni.push(nuovaCondivisione);
    localStorage.setItem('sn4m_condivisioni', JSON.stringify(condivisioni));

    alert("Playlist pubblicata con successo nella comunità " + commTarget.titolo);

    if (typeof mostraPlaylistCondivise === 'function') {
        mostraPlaylistCondivise();
    }
}

// Mostra i post sulla bacheca e gestisce i filtri di ricerca
function mostraPlaylistCondivise() {
    const utenteLoggato = JSON.parse(localStorage.getItem('sn4m_utenteLoggato'));
    const filtroTag = document.getElementById('search-shared-tag').value.trim().toLowerCase();
    const filtroCanzone = document.getElementById('search-shared-song').value.trim().toLowerCase();

    let condivisioni = JSON.parse(localStorage.getItem('sn4m_condivisioni')) || [];
    const container = document.getElementById('shared-playlist-list');

    // Filtriamo le playlist da mostrare
    // 1. Mostriamo solo quelle dei gruppi a cui sono iscritto
    let visibili = condivisioni.filter(c => utenteLoggato.comunitaIscritte.includes(c.comunita));

    // 2. Filtro per Tag 
    if (filtroTag) {
        visibili = visibili.filter(c => c.tag.toLowerCase().includes(filtroTag));
    }

    // 3. Filtro Canzoni (usiamo some per cercare dentro l'array interno dei brani)
    if (filtroCanzone) {
        visibili = visibili.filter(c =>
            c.canzoni.some(song => song.titolo.toLowerCase().includes(filtroCanzone))
        );
    }

    if (visibili.length === 0) {
        container.innerHTML = "<p class='text-muted small'>Nessuna playlist condivisa disponibile.</p>";
        return;
    }

    let html = "";
    for (let i = 0; i < visibili.length; i++) {
        let item = visibili[i];

        html += `
            <div class="shared-card">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="fw-bold">${item.nomePlaylist} <span class="badge bg-secondary font-monospace">${item.comunita}</span></div>
                    <button onclick="importaPlaylistCondivisa(${item.id})" class="btn btn-sm btn-outline-primary py-0">Importa</button>
                </div>
                <div class="small text-muted">Autore: ${item.proprietario} | Tag: ${item.tag}</div>
                
                <div class="mt-2 text-dark small"><strong>Commenti:</strong></div>
                <div id="comments-box-${item.id}">
        `;

        // Stampiamo i commenti di questa condivisione
        for (let k = 0; k < item.commenti.length; k++) {
            let comm = item.commenti[k];
            html += `<div class="comment-item">
                        <strong>${comm.autore}:</strong> ${comm.testo}`;

            // Controlliamo se il commento è dell'utente loggato, così gli facciamo vedere i tasti Modifica e Elimina
            if (comm.autore === utenteLoggato.email) {
                html += ` <div class="mt-1">
                            <button onclick="modificaCommento(${item.id}, ${comm.id})" class="btn btn-link btn-sm p-0 text-secondary me-2">Modifica</button>
                            <button onclick="eliminaCommento(${item.id}, ${comm.id})" class="btn btn-link btn-sm p-0 text-danger">Elimina</button>
                          </div>`;
            }
            html += `</div>`;
        }

        html += `
                </div>
                <div class="input-group input-group-sm mt-2">
                    <input type="text" id="input-comm-${item.id}" class="form-control" placeholder="Scrivi un commento...">
                    <button onclick="aggiungiCommento(${item.id})" class="btn btn-success">Invia</button>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

// Aggiunge un commento al post
window.aggiungiCommento = function (idCondivisione) {
    const input = document.getElementById(`input-comm-${idCondivisione}`);
    const testo = input.value.trim();
    const utenteLoggato = JSON.parse(localStorage.getItem('sn4m_utenteLoggato'));

    if (!testo) return;

    let condivisioni = JSON.parse(localStorage.getItem('sn4m_condivisioni')) || [];
    let item = condivisioni.find(c => c.id === idCondivisione);

    if (item) {
        // Salviamo il commento mettendo la data come ID
        item.commenti.push({
            id: Date.now(),
            autore: utenteLoggato.email,
            testo: testo
        });

        localStorage.setItem('sn4m_condivisioni', JSON.stringify(condivisioni));
        mostraPlaylistCondivise();
    }
};

// Modifica un commento esistente
window.modificaCommento = function (idCondivisione, idCommento) {
    let condivisioni = JSON.parse(localStorage.getItem('sn4m_condivisioni')) || [];

    let item = condivisioni.find(c => c.id === idCondivisione);

    if (item) {
        let comm = item.commenti.find(c => c.id === idCommento);
        if (comm) {
            // Chiediamo all'utente cosa vuole scrivere usando il prompt
            let nuovoTesto = prompt("Modifica il tuo commento:", comm.testo);
            if (nuovoTesto && nuovoTesto.trim() !== "") {
                comm.testo = nuovoTesto.trim();
                localStorage.setItem('sn4m_condivisioni', JSON.stringify(condivisioni));
                mostraPlaylistCondivise();
            }
        }
    }
};

// Cancella un commento
window.eliminaCommento = function (idCondivisione, idCommento) {
    let condivisioni = JSON.parse(localStorage.getItem('sn4m_condivisioni')) || [];
    let item = condivisioni.find(c => c.id === idCondivisione);

    if (item) {
        // Togliamo il commento dall'array
        item.commenti = item.commenti.filter(c => c.id !== idCommento);
        localStorage.setItem('sn4m_condivisioni', JSON.stringify(condivisioni));
        mostraPlaylistCondivise();
    }
};

// Permette di copiare una playlist di un altro utente tra le proprie playlist private
window.importaPlaylistCondivisa = function (idCondivisione) {
    let condivisioni = JSON.parse(localStorage.getItem('sn4m_condivisioni')) || [];
    let item = condivisioni.find(c => c.id === idCondivisione);
    let utenteLoggato = JSON.parse(localStorage.getItem('sn4m_utenteLoggato'));

    if (item && utenteLoggato) {
        let miePlaylist = JSON.parse(localStorage.getItem('sn4m_playlists')) || [];

        let nuovoNome = item.nomePlaylist + " (Importata)";

        miePlaylist.push({
            nome: nuovoNome,
            descrizione: item.descrizione,
            tag: item.tag,
            // Cambiamo il proprietario mettendo l'email di chi la sta importando
            proprietario: utenteLoggato.email,
            canzoni: item.canzoni
        });

        localStorage.setItem('sn4m_playlists', JSON.stringify(miePlaylist));
        alert(`La playlist '${item.nomePlaylist}' è stata clonata nelle tue Playlist Private!`);

        // Diciamo alla colonna delle playlist private di aggiornarsi
        if (typeof mostraPlaylist === 'function') {
            mostraPlaylist();
        }
    }
};