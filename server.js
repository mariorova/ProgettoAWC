/* ==========================================================================
   File per gestire Spotify e le playlist private.
   Fatto da Mario.
   ========================================================================== */

// Dati che servono per collegarci a Spotify
const client_id = '01e0d05e8a80461997a1d967d990fe39';
// Il prof ha detto che metterla qui non è sicurissimo ma non avendo il backend dobbiamo fare così
const client_secret = '41f89166dae044fda47bdd9f9cba71d4';
const tokenUrl = "https://accounts.spotify.com/api/token";
const searchBaseUrl = "https://api.spotify.com/v1/search";

// Ci salviamo qui i risultati della ricerca di Spotify per usarli dopo quando vogliamo aggiungere il brano
let ultimiRisultatiRicerca = [];

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('btn-cerca').addEventListener('click', eseguiRicerca);

    document.getElementById('btn-mostra').addEventListener('click', mostraPlaylist);

    // Quando clicchiamo su crea playlist
    document.getElementById('btn-crea-playlist').addEventListener('click', () => {
        const nomePlaylist = document.getElementById('nuova-playlist').value.trim();
        const descPlaylist = document.getElementById('nuova-playlist-desc').value.trim();
        const tagPlaylist = document.getElementById('nuova-playlist-tag').value.trim();

        if (!nomePlaylist) {
            alert("Inserisci un nome per la nuova playlist.");
            return;
        }

        const creata = creaPlaylistVuota(nomePlaylist, descPlaylist, tagPlaylist);

        if (creata) {
            document.getElementById('nome-playlist-destinazione').value = nomePlaylist;
            alert(`Playlist '${nomePlaylist}' creata con successo.`);
            mostraPlaylist();
        }
    });
});

// Funzione per chiedere il permesso (token) a Spotify per fare le ricerche
function generaToken() {
    // Usiamo fetch per fare la chiamata
    fetch(tokenUrl, {
        method: "POST",
        headers: {
            // Spotify vuole le chiavi scritte in un formato strano (Base64), btoa() serve a quello
            "Authorization": "Basic " + btoa(`${client_id}:${client_secret}`),
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({ grant_type: "client_credentials" })
    })
        .then(response => response.json())
        .then(data => {
            if (data.access_token) {
                // Salviamo il token di Spotify nel localStorage per usarlo dopo
                localStorage.setItem("spotifyToken", data.access_token);
                console.log("Token Spotify acquisito con successo.");
            }
        })
        .catch(error => {
            console.error("Errore autenticazione Spotify:", error);
        });
}

// Funzione per cercare le canzoni (usiamo async/await perché ci vuole un po' prima che Spotify risponda)
async function eseguiRicerca() {
    const token = localStorage.getItem("spotifyToken");
    const container = document.getElementById("risultati-output");

    if (!token) {
        container.innerHTML = "<p class='text-danger small m-0'>Autenticazione Spotify in corso, riprova tra un attimo...</p>";
        generaToken();
        return;
    }

    const titolo = document.getElementById("titolo").value.trim();
    const autoreInput = document.getElementById("autore");
    const autore = autoreInput ? autoreInput.value.trim() : "";

    if (!titolo && !autore) {
        container.innerHTML = "<p class='text-warning small m-0'>Inserisci almeno il titolo della canzone o il nome dell'artista per cercare.</p>";
        return;
    }

    // Prepariamo il testo da mandare a Spotify per cercare la canzone o l'artista
    let searchQuery = "";
    if (titolo && autore) {
        searchQuery = `track:${titolo} artist:${autore}`;
    } else if (titolo) {
        searchQuery = `track:${titolo}`;
    } else {
        searchQuery = `artist:${autore}`;
    }

    const url = `${searchBaseUrl}?q=${encodeURIComponent(searchQuery)}&type=track&limit=5`;
    container.innerHTML = "<p class='text-muted small m-0'>Ricerca su Spotify in corso...</p>";

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) throw new Error(`Errore HTTP ${response.status}`);

        const searchResults = await response.json();

        if (searchResults.tracks && searchResults.tracks.items.length > 0) {

            // Dobbiamo aspettare che finiscano tutte le richieste per prendere il genere musicale dell'artista
            ultimiRisultatiRicerca = await Promise.all(searchResults.tracks.items.map(async (track) => {

                // Trasformiamo i millisecondi in minuti e secondi usando un po' di matematica
                const minuti = Math.floor(track.duration_ms / 60000);
                const secondi = Math.floor((track.duration_ms % 60000) / 1000);
                const durataFormattata = `${minuti}:${secondi < 10 ? '0' : ''}${secondi}`;

                let generiMusicali = "Non specificato";

                if (track.artists && track.artists.length > 0) {
                    try {
                        const artistResponse = await fetch(track.artists[0].href, {
                            method: "GET",
                            headers: {
                                "Authorization": "Bearer " + token,
                                "Content-Type": "application/json"
                            }
                        });

                        if (artistResponse.ok) {
                            const artistData = await artistResponse.json();
                            if (artistData.genres && artistData.genres.length > 0) {
                                generiMusicali = artistData.genres.join(", ");
                            }
                        }
                    } catch (e) {
                        console.error("Errore recupero genere:", e);
                    }
                }

                // Salviamo le info della canzone per la nostra playlist
                return {
                    titolo: track.name,
                    cantante: track.artists.map(a => a.name).join(", "),
                    genere: generiMusicali,
                    durata: durataFormattata,
                    anno_pubblicazione: track.album.release_date.substring(0, 4)
                };
            }));

            // Stampiamo l'elenco dei risultati
            let html = "<div class='list-group list-group-flush'>";
            ultimiRisultatiRicerca.forEach((brano, idx) => {
                html += `
                    <div class='list-group-item p-2 d-flex justify-content-between align-items-center'>
                        <div>
                            <div class='fw-bold small'>${brano.titolo}</div>
                            <div class='text-muted small'>${brano.cantante} (${brano.durata})</div>
                        </div>
                        <button onclick="aggiungiSingoloBrano(${idx})" class='btn btn-sm btn-outline-success'>+ Aggiungi</button>
                    </div>
                `;
            });
            html += "</div>";

            container.innerHTML = html;

        } else {
            ultimiRisultatiRicerca = [];
            container.innerHTML = "<p class='text-muted small m-0'>Nessun brano trovato con questi criteri.</p>";
        }

    } catch (error) {
        console.error("Errore durante la ricerca:", error);
        container.innerHTML = "<p class='text-danger small m-0'>Errore durante la ricerca su Spotify.</p>";
    }
}

// Questa funzione aggiunge la canzone cercata dentro la playlist scelta
window.aggiungiSingoloBrano = function (index) {
    const nomePlaylist = document.getElementById('nome-playlist-destinazione').value.trim();
    const utenteLoggato = JSON.parse(localStorage.getItem("sn4m_utenteLoggato"));

    if (!nomePlaylist) {
        alert("Specifica prima il nome della playlist di destinazione!");
        return;
    }
    if (!utenteLoggato) return;

    // Prendiamo il brano giusto dall'array dei risultati
    const branoSelezionato = ultimiRisultatiRicerca[index];
    if (!branoSelezionato) return;

    let playlistData = JSON.parse(localStorage.getItem("sn4m_playlists")) || [];

    // Cerchiamo la playlist dell'utente
    let p = playlistData.find(pl => pl.nome.toLowerCase() === nomePlaylist.toLowerCase() && pl.proprietario === utenteLoggato.email);

    if (!p) {
        alert(`La tua playlist '${nomePlaylist}' non esiste! Creala prima usando il campo 'Crea Playlist'.`);
        return;
    }

    // Mettiamo la canzone nell'array della playlist
    p.canzoni.push(branoSelezionato);

    localStorage.setItem("sn4m_playlists", JSON.stringify(playlistData));
    alert(`'${branoSelezionato.titolo}' aggiunto a '${p.nome}'!`);

    mostraPlaylist();
};

// Creiamo una nuova playlist salvandola nel localStorage
function creaPlaylistVuota(nomePlaylist, descrizione, tag) {
    let playlistData = JSON.parse(localStorage.getItem("sn4m_playlists")) || [];
    let utenteLoggato = JSON.parse(localStorage.getItem("sn4m_utenteLoggato"));

    if (playlistData.some(p => p.nome.toLowerCase() === nomePlaylist.toLowerCase() && p.proprietario === utenteLoggato.email)) {
        alert("Hai già una playlist con questo nome.");
        return false;
    }

    playlistData.push({
        nome: nomePlaylist,
        descrizione: descrizione || "Nessuna descrizione",
        tag: tag || "generale",
        proprietario: utenteLoggato.email, // Salviamo di chi è la playlist
        canzoni: [] // Partiamo con zero canzoni
    });

    localStorage.setItem("sn4m_playlists", JSON.stringify(playlistData));
    return true;
}

// Mostra le playlist dell'utente loggato
function mostraPlaylist() {
    const container = document.getElementById("playlist-output");

    const playlistData = JSON.parse(localStorage.getItem("sn4m_playlists")) || [];
    const utenteLoggato = JSON.parse(localStorage.getItem("sn4m_utenteLoggato"));

    const haPlaylist = playlistData.some(p => utenteLoggato && p.proprietario === utenteLoggato.email);

    if (!haPlaylist) {
        container.innerHTML = "<p class='text-muted small m-0'>Nessuna playlist salvata.</p>";
        return;
    }

    let html = "";

    playlistData.forEach((p, pIdx) => {
        // Controlliamo che la playlist sia proprio di questo utente, sennò non la mostriamo
        if (utenteLoggato && p.proprietario !== utenteLoggato.email) return;

        html += `
            <div class='border rounded-3 p-2 mb-2 bg-white shadow-sm'>
                <div class='d-flex justify-content-between align-items-center mb-1'>
                    <span class='fw-bold text-dark'>${p.nome}</span>
                    <div>
                        <button onclick="modificaPlaylist(${pIdx})" class='btn btn-sm btn-link p-0 me-2 text-secondary'>Modifica</button>
                        <button onclick="cancellaInteraPlaylist(${pIdx})" class='btn btn-sm btn-link p-0 text-danger'>Elimina</button>
                    </div>
                </div>
                <div class='small text-muted mb-2'>${p.descrizione} <br> <span class='badge bg-light text-dark border'>Tag: ${p.tag}</span></div>
                
                <div class='small fw-semibold text-secondary mb-1'>Canzoni (${p.canzoni.length}):</div>
        `;

        if (p.canzoni.length === 0) {
            html += "<p class='text-muted small fst-italic mb-1'>Nessun brano aggiunto.</p>";
        } else {
            html += "<ul class='list-unstyled mb-0'>";

            p.canzoni.forEach((c, cIdx) => {
                html += `
                    <li class='d-flex justify-content-between align-items-center py-1 border-bottom small'>
                        <span><strong>${c.titolo}</strong> - ${c.cantante}</span>
                        <button onclick="cancellaBranoDaPlaylist(${pIdx}, ${cIdx})" class='btn btn-sm btn-outline-danger py-0 px-1' style='font-size:0.75em;'>Rimuovi</button>
                    </li>
                `;
            });
            html += "</ul>";
        }

        html += "</div>";
    });

    container.innerHTML = html;
}

// Cambia la descrizione della playlist usando la finestrella del browser (prompt)
window.modificaPlaylist = function (pIdx) {
    let playlistData = JSON.parse(localStorage.getItem("sn4m_playlists")) || [];
    let p = playlistData[pIdx];
    if (!p) return;

    let nuovaDesc = prompt("Modifica la descrizione della playlist:", p.descrizione);

    if (nuovaDesc !== null) {
        p.descrizione = nuovaDesc.trim();
        localStorage.setItem("sn4m_playlists", JSON.stringify(playlistData));
        mostraPlaylist();
    }
};

// Toglie una canzone dalla playlist
window.cancellaBranoDaPlaylist = function (pIdx, cIdx) {
    let playlistData = JSON.parse(localStorage.getItem("sn4m_playlists")) || [];

    if (playlistData[pIdx] && playlistData[pIdx].canzoni[cIdx]) {
        // splice serve per togliere esattamente quell'elemento dall'array
        playlistData[pIdx].canzoni.splice(cIdx, 1);

        localStorage.setItem("sn4m_playlists", JSON.stringify(playlistData));
        mostraPlaylist();
    }
};

// Cancella tutta la playlist dal localStorage
window.cancellaInteraPlaylist = function (pIdx) {
    let playlistData = JSON.parse(localStorage.getItem("sn4m_playlists")) || [];

    if (confirm(`Sei sicuro di voler eliminare la playlist '${playlistData[pIdx].nome}'?`)) {
        playlistData.splice(pIdx, 1);

        localStorage.setItem("sn4m_playlists", JSON.stringify(playlistData));
        mostraPlaylist();
    }
};