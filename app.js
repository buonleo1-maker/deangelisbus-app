// =====================================================
// DEANGELISBUS – APP.JS V15 DEFINITIVO
// Tutte le richieste sono GET → niente CORS, niente errori
// =====================================================

// 🔗 URL BACKEND (metti il tuo!)
const API = "https://script.google.com/macros/s/AKfycbxZhtmRJMAMn8auYc1Z2A9TJ2x9N81_PS7Ez_kfTYlvcKb3b4tOafN4WUEFEw6bwN_5/exec";

// 🔧 Azioni
const ACTION_LOGIN   = "login";
const ACTION_SALVA   = "salvaPresenza";
const ACTION_STORICO = "getStorico";
const ACTION_DELETE  = "deletePresenza";
const ACTION_UPDATE  = "updatePresenza";
const ACTION_TURNI   = "getTurni";

let autistaCorrente = null;

// =====================================================
// SHOW/HIDE PAGINE
// =====================================================
function mostraPagina(id){
    document.querySelectorAll(".pagina").forEach(p => p.classList.remove("attivo"));
    document.getElementById(id).classList.add("attivo");
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

    const url = API + `?action=${ACTION_LOGIN}&nome=${encodeURIComponent(nome)}&pin=${encodeURIComponent(pin)}`;

    try{
        const res = await fetch(url);
        const js = await res.json();

        if(js.status === "OK"){
            autistaCorrente = nome;
            localStorage.setItem("autista", nome);

            mostraPagina("page-presenza");
            caricaTurni();
        } else {
            alert("PIN errato");
        }

    }catch(err){
        console.error("Login error:", err);
        alert("Errore di connessione");
    }
}

// =====================================================
// LOGOUT
// =====================================================
function logout(){
    localStorage.removeItem("autista");
    autistaCorrente = null;
    mostraPagina("page-accesso");
}

// =====================================================
// CARICA TURNI
// GET SEMPLICE SENZA HEADER → nessun errore CORS
// =====================================================
async function caricaTurni(){
    try{
        const url = API + `?action=${ACTION_TURNI}`;
        const res = await fetch(url);
        const js = await res.json();

        if(js.status === "OK"){
            const sel = document.getElementById("descrizione-turno");
            sel.innerHTML = "";

            js.data.forEach(t => {
                const opt = document.createElement("option");
                opt.value = t;
                opt.textContent = t;
                sel.appendChild(opt);
            });
        }
    }catch(err){
        console.error("Errore caricamento turni:", err);
    }
}

// =====================================================
// CAMBIO TIPO → mostra/nasconde descrizione
// =====================================================
function onChangeTipo(){
    const tipo = document.getElementById("tipo").value;

    if(tipo === "Turno"){
        document.getElementById("descrizione-turno").style.display = "block";
        document.getElementById("descrizione-libera").style.display = "none";
    } else {
        document.getElementById("descrizione-turno").style.display = "none";
        document.getElementById("descrizione-libera").style.display = "block";
    }
}

// =====================================================
// SALVA PRESENZA
// =====================================================
async function salvaPresenza(){

    const tipo = document.getElementById("tipo").value;
    const desc = document.getElementById("descrizione-turno").value || 
                 document.getElementById("descrizione-libera").value;

    const data = document.getElementById("data").value;
    const ini  = document.getElementById("oraInizio").value;
    const fin  = document.getElementById("oraFine").value;
    const note = document.getElementById("nota").value;

    const url = API 
        + `?action=${ACTION_SALVA}`
        + `&autista=${encodeURIComponent(autistaCorrente)}`
        + `&tipo=${encodeURIComponent(tipo)}`
        + `&descrizione=${encodeURIComponent(desc)}`
        + `&data=${encodeURIComponent(data)}`
        + `&oraInizio=${encodeURIComponent(ini)}`
        + `&oraFine=${encodeURIComponent(fin)}`
        + `&note=${encodeURIComponent(note)}`;

    try{
        const res = await fetch(url);
        const js = await res.json();

        if(js.status === "OK"){
            alert("Presenza salvata!");
        } else {
            alert("Errore: " + js.message);
        }
    }catch(err){
        console.error("Errore salvataggio:", err);
        alert("Errore di rete");
    }
}

// =====================================================
// MOSTRA STORICO
// =====================================================
async function vaiStorico(){
    mostraPagina("page-storico");

    const url = API + `?action=${ACTION_STORICO}&autista=${encodeURIComponent(autistaCorrente)}`;

    try{
        const res = await fetch(url);
        const js = await res.json();

        const div = document.getElementById("contenitore-storico");
        div.innerHTML = "";

        if(js.status === "OK"){
            js.dati.forEach(r => {
                const box = document.createElement("div");
                box.className = "rigaStorico";
                box.innerHTML = `
                    <b>${r.data}</b> — ${r.tipo} — ${r.descrizione}<br>
                    ${r.oraInizio} → ${r.oraFine}<br>
                    <button onclick="duplica(${r.id})">Duplica</button>
                    <button onclick="cancella(${r.id})">Elimina</button>
                `;
                div.appendChild(box);
            });
        }

    }catch(err){
        console.error("Errore storico:", err);
    }
}

// =====================================================
// CANCELLA PRESENZA
// =====================================================
async function cancella(id){
    if(!confirm("Cancellare presenza?")) return;

    const url = API + `?action=${ACTION_DELETE}&id=${id}`;

    try{
        await fetch(url);
        vaiStorico();
    }catch(err){
        console.error(err);
    }
}

// =====================================================
// DUPLICA (precompila i campi)
// =====================================================
async function duplica(id){
    mostraPagina("page-presenza");
}

// =====================================================
// AUTO LOGIN SE PRESENTE
// =====================================================
window.onload = () => {
    const saved = localStorage.getItem("autista");
    if(saved){
        autistaCorrente = saved;
        mostraPagina("page-presenza");
        caricaTurni();
    }
};
