// =====================================================
// DEANGELISBUS – APP.JS V16 (CON LOGICA TURNI/NOL/ALTRI)
// =====================================================

// URL BACKEND
const API = "https://script.google.com/macros/s/AKfycbzM0vZgWDKXrwDthkrnzCKWk3dnTb-u-zR-IvpcZidt-GupAHPwkh6gpPHLmSpd7h-U/exec";

// Azioni API
const ACTION_LOGIN   = "login";
const ACTION_SALVA   = "salvaPresenza";
const ACTION_STORICO = "getStorico";
const ACTION_DELETE  = "deletePresenza";
const ACTION_UPDATE  = "updatePresenza";
const ACTION_TURNI   = "getTurni";

let autistaCorrente = null;
let modificaID = null;


// =====================================================
// FUNZIONE GENERICA API
// =====================================================
async function apiCall(params){
    const url = API + "?" + new URLSearchParams(params);
    const res = await fetch(url);
    return await res.json();
}


// =====================================================
// LOGIN
// =====================================================
async function login(){

    const nome = document.getElementById("login-nome").value.trim();
    const pin  = document.getElementById("login-pin").value.trim();

    if(!nome || !pin){
        alert("Inserisci nome e PIN");
        return;
    }

    try{
        const out = await apiCall({
            action: ACTION_LOGIN,
            nome,
            pin
        });

        if(out.status === "OK"){
            autistaCorrente = nome;
            localStorage.setItem("autista", nome);

            mostraPagina("page-presenza");
            caricaTurni();

        } else {
            alert("Nome o PIN errati");
        }

    } catch(err){
        alert("Errore di rete durante il login");
        console.error(err);
    }
}


// =====================================================
// LOGOUT
// =====================================================
function logout(){
    localStorage.removeItem("autista");
    autistaCorrente = null;
    mostraPagina("page-login");
}


// =====================================================
// CAMBIA PAGINA
// =====================================================
function mostraPagina(id){
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}


// =====================================================
// FORMATTA DATA PER LO STORICO
// =====================================================
function formattaData(d){
    if(!d) return "";
    if(d instanceof Date) return d.toISOString().split("T")[0];
    if(String(d).includes("T")) return d.split("T")[0];
    return d;
}


// =====================================================
// CARICA TURNI
// =====================================================
async function caricaTurni(){
    try{
        const out = await apiCall({ action: ACTION_TURNI });

        const sel = document.getElementById("descrizione-turno");
        sel.innerHTML = "";

        out.data.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t;
            opt.textContent = t;
            sel.appendChild(opt);
        });

    } catch(err){
        console.error("Errore caricamento turni", err);
    }
}


// =====================================================
// CAMBIO TIPO → LOGICA TURNI / NOLEGGIO / ALTRE VOCI
// =====================================================
function aggiornaDescrizione(){

    const tipo = document.getElementById("tipo").value;

    const boxTurni = document.getElementById("box-turni");
    const boxLibero = document.getElementById("box-libero");

    const descTurno = document.getElementById("descrizione-turno");
    const descLibera = document.getElementById("descrizione-libera");

    // reset
    boxTurni.style.display = "none";
    boxLibero.style.display = "none";

    descTurno.value = "";
    descLibera.value = "";
    descLibera.readOnly = false;

    // -------------------------------
    // TIPO = TURNO
    // -------------------------------
    if(tipo === "Turno"){
        boxTurni.style.display = "block";
        boxLibero.style.display = "block";

        descLibera.placeholder = "Cerca un turno o scrivilo liberamente...";
        descLibera.readOnly = false;

        return;
    }

    // -------------------------------
    // TIPO = NOLEGGIO
    // -------------------------------
    if(tipo === "Noleggio"){
        boxLibero.style.display = "block";

        descLibera.placeholder = "Es. Matera – Bari";
        descLibera.readOnly = false;

        return;
    }

    // -------------------------------
    // TUTTI GLI ALTRI TIPI
    // -------------------------------
    boxLibero.style.display = "block";
    descLibera.value = tipo;
    descLibera.readOnly = true;
}


// =====================================================
// SALVA PRESENZA
// =====================================================
async function salvaPresenza(){

    const tipo = document.getElementById("tipo").value;

    // Descrizione = turno o testo libero
    let descrizione = document.getElementById("descrizione-libera").value.trim();
    const turnoSel = document.getElementById("descrizione-turno").value;

    if(tipo === "Turno"){
        // Se inserito manualmente → usa testo libero
        // Se selezionato → sovrascrive
        if(turnoSel) descrizione = turnoSel;
    }

    const data = document.getElementById("data").value;
    const ini  = document.getElementById("oraInizio").value;
    const fin  = document.getElementById("oraFine").value;
    const note = document.getElementById("note").value;

    if(!autistaCorrente){
        alert("Devi rifare l’accesso");
        return;
    }

    // Tipo colonna foglio
    let tipoColonna = "";
    if(tipo === "Turno") tipoColonna = "T";
    else if(tipo === "Noleggio") tipoColonna = "N";

    const params = {
        action: ACTION_SALVA,
        autista: autistaCorrente,
        tipo: tipoColonna,
        descrizione,
        data,
        oraInizio: ini,
        oraFine: fin,
        durata: "",
        note
    };

    try{
        const out = await apiCall(params);
        if(out.status === "OK"){
            alert("Presenza salvata");
            vaiStorico();
        }
    }
    catch(err){
        alert("Errore salvataggio presenza");
        console.error(err);
    }
}


// =====================================================
// DUPLICA
// =====================================================
function duplicaPresenza(id){
    modificaID = null;

    const b = document.querySelector(`[data-id="${id}"]`);

    document.getElementById("tipo").value         = b.dataset.tipo;
    document.getElementById("descrizione-libera").value = b.dataset.descrizione;
    document.getElementById("data").value         = b.dataset.data;
    document.getElementById("oraInizio").value    = b.dataset.oraInizio;
    document.getElementById("oraFine").value      = b.dataset.oraFine;
    document.getElementById("note").value         = b.dataset.note;

    aggiornaDescrizione();
    mostraPagina("page-presenza");
}


// =====================================================
// MODIFICA
// =====================================================
function modificaPresenza(id){

    modificaID = id;

    const b = document.querySelector(`[data-id="${id}"]`);

    document.getElementById("tipo").value         = b.dataset.tipo;
    document.getElementById("descrizione-libera").value = b.dataset.descrizione;
    document.getElementById("data").value         = b.dataset.data;
    document.getElementById("oraInizio").value    = b.dataset.oraInizio;
    document.getElementById("oraFine").value      = b.dataset.oraFine;
    document.getElementById("note").value         = b.dataset.note;

    aggiornaDescrizione();
    mostraPagina("page-presenza");
}


// =====================================================
// ELIMINA
// =====================================================
async function eliminaPresenza(id){

    if(!confirm("Sicuro di eliminare?")) return;

    const out = await apiCall({
        action: ACTION_DELETE,
        id
    });

    if(out.status === "OK"){
        vaiStorico();
    }
}


// =====================================================
// CARICA STORICO
// =====================================================
async function vaiStorico(){

    mostraPagina("page-storico");

    const container = document.getElementById("contenitore-storico");
    container.innerHTML = "Caricamento...";

    try{

        const out = await apiCall({
            action: ACTION_STORICO,
            autista: autistaCorrente
        });

        container.innerHTML = "";

        out.dati.forEach(item => {

            const card = document.createElement("div");
            card.className = "scheda";

            card.dataset.id        = item.id;
            card.dataset.tipo      = item.tipo;
            card.dataset.descrizione = item.descrizione;
            card.dataset.data      = item.data;
            card.dataset.oraInizio = item.oraInizio;
            card.dataset.oraFine   = item.oraFine;
            card.dataset.note      = item.note;

            card.innerHTML = `
                <h3>${formattaData(item.data)}</h3>

                <p><b>${item.tipo || ""}</b> — ${item.descrizione || ""}</p>
                <p>${item.oraInizio || "--:--"} → ${item.oraFine || "--:--"}</p>

                <div class="rigaBottoni">
                    <button onclick="duplicaPresenza(${item.id})" class="btn blu">Duplica</button>
                    <button onclick="modificaPresenza(${item.id})" class="btn arancione">Modifica</button>
                    <button onclick="eliminaPresenza(${item.id})" class="btn rosso">Elimina</button>
                </div>
            `;

            container.appendChild(card);
        });

    } catch(err){
        container.innerHTML = "Errore caricamento storico";
        console.error(err);
    }
}


// =====================================================
// AUTOCARICAMENTO LOGIN
// =====================================================
window.onload = () => {
    const saved = localStorage.getItem("autista");
    if(saved){
        autistaCorrente = saved;
        mostraPagina("page-presenza");
        caricaTurni();
    }
};
