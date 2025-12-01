/******************************************************
 *  DEANGELISBUS – APP.JS (VERSIONE FINALE V15)
 ******************************************************/

// URL BACKEND (usa quello che funziona con ping)
const API = "https://script.google.com/macros/s/AKfycbxZhtmRJMAMn8auYc1Z2A9TJ2x9N81_PS7Ez_kfTYlvcKb3b4tOafN4WUEFEw6bwN_5/exec";

// Variabili globali
let autistaCorrente = null;
let storicoGlobale = [];
let idInModifica = null;

/******************************************************
 * TOAST
 ******************************************************/
function toast(msg) {
    const t = document.getElementById("toast");
    t.innerText = msg;
    t.style.display = "block";
    setTimeout(() => t.style.display = "none", 3000);
}

/******************************************************
 * CAMBIO PAGINA
 ******************************************************/
function mostraPagina(id) {
    document.querySelectorAll(".pagina").forEach(p => p.style.display = "none");
    document.getElementById(id).style.display = "block";
}

/******************************************************
 * LOGIN
 ******************************************************/
async function login() {

    const nome = document.getElementById("login-autista").value.trim();
    const pin = document.getElementById("login-pin").value.trim();

    if (!nome || !pin) {
        toast("Inserisci nome e PIN");
        return;
    }

    const url = `${API}?action=login&nome=${encodeURIComponent(nome)}&pin=${encodeURIComponent(pin)}`;

    try {
        const res = await fetch(url);
        const js = await res.json();

        if (js.status === "OK") {
            autistaCorrente = nome;
            localStorage.setItem("autista", nome);

            mostraPagina("page-presenza");
            caricaTurni();
        } else {
            toast("PIN errato");
        }
    } catch (err) {
        toast("Errore di rete");
        console.error(err);
    }
}

/******************************************************
 * LOGOUT
 ******************************************************/
function logout() {
    localStorage.removeItem("autista");
    autistaCorrente = null;
    mostraPagina("page-login");
}

/******************************************************
 * CARICA TURNI
 ******************************************************/
async function caricaTurni() {
    try {
        const res = await fetch(`${API}?action=getTurni`);
        const js = await res.json();

        if (js.status === "OK") {
            const sel = document.getElementById("descrizione");
            sel.innerHTML = "";

            js.data.forEach(t => {
                const opt = document.createElement("option");
                opt.value = t;
                opt.innerText = t;
                sel.appendChild(opt);
            });
        }
    } catch (err) {
        console.error(err);
        toast("Errore caricamento turni");
    }
}

/******************************************************
 * NUOVA PRESENZA
 ******************************************************/
function nuovaPresenza() {
    idInModifica = null;

    document.getElementById("tipo").value = "";
    document.getElementById("descrizione").value = "";
    document.getElementById("data").value = "";
    document.getElementById("oraInizio").value = "";
    document.getElementById("oraFine").value = "";
    document.getElementById("note").value = "";

    mostraPagina("page-presenza");
}

/******************************************************
 * SALVA PRESENZA (nuova o modificata)
 ******************************************************/
async function salvaPresenza() {

    const tipo = document.getElementById("tipo").value;
    const descrizione = document.getElementById("descrizione").value;
    const data = document.getElementById("data").value;
    const oraInizio = document.getElementById("oraInizio").value;
    const oraFine = document.getElementById("oraFine").value;
    const note = document.getElementById("note").value;

    if (!tipo || !data) {
        toast("Compila tipo e data");
        return;
    }

    let url = "";

    if (idInModifica) {
        // UPDATE
        url = `${API}?action=updatePresenza&id=${idInModifica}&autista=${encodeURIComponent(autistaCorrente)}&tipo=${encodeURIComponent(tipo)}&descrizione=${encodeURIComponent(descrizione)}&data=${data}&oraInizio=${oraInizio}&oraFine=${oraFine}&durata=&note=${encodeURIComponent(note)}`;
    } else {
        // NUOVA
        url = `${API}?action=salvaPresenza&autista=${encodeURIComponent(autistaCorrente)}&tipo=${encodeURIComponent(tipo)}&descrizione=${encodeURIComponent(descrizione)}&data=${data}&oraInizio=${oraInizio}&oraFine=${oraFine}&durata=&note=${encodeURIComponent(note)}`;
    }

    try {
        const res = await fetch(url);
        const js = await res.json();

        if (js.status === "OK") {
            toast("Presenza salvata");
            idInModifica = null;
            mostraStorico();
            mostraPagina("page-storico");
        } else {
            toast("Errore: " + js.message);
        }
    } catch (err) {
        toast("Errore di rete");
        console.error(err);
    }
}

/******************************************************
 * MOSTRA STORICO
 ******************************************************/
async function mostraStorico() {
    try {
        const res = await fetch(`${API}?action=getStorico&autista=${encodeURIComponent(autistaCorrente)}`);
        const js = await res.json();

        if (js.status === "OK") {
            storicoGlobale = js.dati;
            renderStorico();
        }
    } catch (err) {
        console.error(err);
        toast("Errore caricamento storico");
    }
}

function renderStorico() {
    const box = document.getElementById("storico-lista");
    box.innerHTML = "";

    storicoGlobale.forEach(r => {

        let card = `
        <div class="card">
            <div class="data">${r.data}</div>
            <div><b>${r.tipo}</b> — ${r.descrizione}</div>
            <div>${r.oraInizio || ""} → ${r.oraFine || ""}</div>

            <div class="azioni">
                <button class="btn blue" onclick="duplicaPresenza(${r.id})">Duplica</button>
                <button class="btn orange" onclick="modificaPresenza(${r.id})">Modifica</button>
                <button class="btn red" onclick="eliminaPresenza(${r.id})">Elimina</button>
            </div>
        </div>
        `;

        box.innerHTML += card;
    });
}

/******************************************************
 * DUPLICA
 ******************************************************/
function duplicaPresenza(id) {
    const p = storicoGlobale.find(x => x.id == id);
    if (!p) return;

    document.getElementById("tipo").value = p.tipo;
    document.getElementById("descrizione").value = p.descrizione;
    document.getElementById("data").value = p.data;
    document.getElementById("oraInizio").value = p.oraInizio;
    document.getElementById("oraFine").value = p.oraFine;
    document.getElementById("note").value = p.note;

    idInModifica = null;
    mostraPagina("page-presenza");
}

/******************************************************
 * MODIFICA
 ******************************************************/
function modificaPresenza(id) {
    const p = storicoGlobale.find(x => x.id == id);
    if (!p) return;

    idInModifica = id;

    document.getElementById("tipo").value = p.tipo;
    document.getElementById("descrizione").value = p.descrizione;
    document.getElementById("data").value = p.data;
    document.getElementById("oraInizio").value = p.oraInizio;
    document.getElementById("oraFine").value = p.oraFine;
    document.getElementById("note").value = p.note;

    mostraPagina("page-presenza");
}

/******************************************************
 * ELIMINA
 ******************************************************/
async function eliminaPresenza(id) {

    if (!confirm("Eliminare la presenza?")) return;

    try {
        const res = await fetch(`${API}?action=deletePresenza&id=${id}`);
        const js = await res.json();

        if (js.status === "OK") {
            toast("Eliminata");
            mostraStorico();
        }
    } catch (err) {
        toast("Errore di rete");
    }
}

/******************************************************
 * AUTO LOGIN SE GIÀ SALVATO
 ******************************************************/
window.onload = () => {
    const saved = localStorage.getItem("autista");
    if (saved) {
        autistaCorrente = saved;
        mostraPagina("page-presenza");
        caricaTurni();
    }
};

