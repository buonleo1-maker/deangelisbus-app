// =====================================================
// DEANGELISBUS – APP.JS V14 (FINALE)
// URL BACKEND CORRETTO
// =====================================================

const API = "https://script.google.com/macros/s/AKfycbzN4xKU2C8unmkABdIOFsx7Sp_bir8u7JSpPz5P1veuUrDlImsloyrc30Hlo26LdSHe/exec";

const ACTION_LOGIN   = "login";
const ACTION_SALVA   = "salvaPresenza";
const ACTION_STORICO = "getStorico";
const ACTION_DELETE  = "deletePresenza";
const ACTION_UPDATE  = "updatePresenza";
const ACTION_TURNI   = "getTurni";

let autistaCorrente = "";
let turniCache = [];

// =====================================================
// NAVIGAZIONE
// =====================================================
function mostraPagina(id){
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

function logout(){
    localStorage.removeItem("autista");
    autistaCorrente = "";
    mostraPagina("page-login");
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
        const url = `${API}?action=${ACTION_LOGIN}&nome=${encodeURIComponent(nome)}&pin=${encodeURIComponent(pin)}`;
        const res = await fetch(url);
        const js  = await res.json();

        if(js.status === "OK"){
            autistaCorrente = nome;
            localStorage.setItem("autista", nome);
            mostraPagina("page-presenza");
            caricaTurni();
        } else {
            alert("Accesso negato");
        }

    }catch(e){
        alert("Errore di collegamento");
    }
}

// =====================================================
// CARICA TURNI
// =====================================================
async function caricaTurni(){
    try{
        const url = `${API}?action=${ACTION_TURNI}`;
        const res = await fetch(url);
        const js  = await res.json();

        turniCache = js.data || [];
        let select = document.getElementById("descrizione-turno");
        select.innerHTML = "";

        turniCache.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t;
            opt.innerText = t;
            select.appendChild(opt);
        });

    }catch(e){
        console.error("Errore caricamento turni:", e);
    }
}

// =====================================================
// TIPO CAMBIATO – REGOLA VISIBILITÀ
// =====================================================
function onChangeTipo(){
    const tipo = document.getElementById("tipo").value;

    if (tipo === "Turno") {
        document.getElementById("blocco-turno").style.display = "block";
        document.getElementById("blocco-libero").style.display = "none";
    } else {
        document.getElementById("blocco-turno").style.display = "none";
        document.getElementById("blocco-libero").style.display = "block";
        document.getElementById("descrizione-libera").placeholder = tipo;
    }
}

// =====================================================
// SALVA PRESENZA
// =====================================================
async function salvaPresenza(){
    if(!autistaCorrente){
        alert("Sessione scaduta, rifai login");
        return;
    }

    const tipo = document.getElementById("tipo").value;
    let desc = "";

    if (tipo === "Turno") {
        desc = document.getElementById("descrizione-turno").value;
    } else {
        desc = document.getElementById("descrizione-libera").value;
    }

    const data = document.getElementById("data").value;
    const ini  = document.getElementById("oraInizio").value;
    const fin  = document.getElementById("oraFine").value;
    const note = document.getElementById("note").value;

    if(!data){
        alert("Inserisci una data");
        return;
    }

    const url =
        `${API}?action=${ACTION_SALVA}`+
        `&autista=${encodeURIComponent(autistaCorrente)}`+
        `&tipo=${encodeURIComponent(tipo)}`+
        `&descrizione=${encodeURIComponent(desc)}`+
        `&data=${encodeURIComponent(data)}`+
        `&oraInizio=${encodeURIComponent(ini)}`+
        `&oraFine=${encodeURIComponent(fin)}`+
        `&note=${encodeURIComponent(note)}`;

    try{
        const res = await fetch(url);
        const js  = await res.json();

        if(js.status === "OK"){
            toast("Presenza salvata");
        }else{
            alert("Errore salvataggio");
        }

    }catch(e){
        alert("Errore di collegamento");
    }
}

// =====================================================
// STORICO
// =====================================================
function vaiStorico(){
    caricaStorico();
    mostraPagina("page-storico");
}

async function caricaStorico(){
    const cont = document.getElementById("storico-container");
    cont.innerHTML = "Caricamento...";

    const url = `${API}?action=${ACTION_STORICO}&au_
