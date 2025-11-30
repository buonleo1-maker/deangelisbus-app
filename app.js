// =====================================================
// DEANGELISBUS – APP.JS V15 (FINALE)
// =====================================================

// BACKEND URL (deployment attivo)
const API = "https://script.google.com/macros/s/AKfycbzN4xKU2C8unmkABdIOFsx7Sp_bir8u7JSpPz5P1veuUrDlImsloyrc30Hlo26LdSHe/exec";

// ACTIONS
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

            // 🔥 Carica turni SOLO ORA → nessun NetworkError
            caricaTurni();

        } else {
            alert("Accesso negato");
        }

    }catch(e){
        alert("Errore di connessione");
        console.error(e);
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
// CAMBIO TIPO → MOSTRA/NASCONDI DESCRIZIONE
// =====================================================
function onChangeTipo(){
    const tipo = document.getElementById("tipo").value;

    const boxTurno   = document.getElementById("descrizione-turno");
    const boxLibero  = document.getElementById("descrizione-libera");

    if(tipo === "Turno"){
        boxTurno.style.display  = "block";
        boxLibero.style.display = "none";
    } else {
        boxTurno.style.display  = "none";
        boxLibero.style.display = "block";
        boxLibero.placeholder = tipo;
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
    let desc;

    if (tipo === "Turno"){
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
        } else {
            alert("Errore salvataggio");
        }

    }catch(e){
        alert("Errore di rete");
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

    const url = `${API}?action=${ACTION_STORICO}&autista=${encodeURIComponent(autistaCorrente)}`;
    const res = await fetch(url);
    const js  = await res.json();

    if(js.status !== "OK"){
        cont.innerHTML = "Errore caricamento storico";
        return;
    }

    const dati = js.dati || [];
    dati.sort((a,b) => new Date(b.data) - new Date(a.data));

    let html = "";

    const colori = {
        "T": "#e0f2fe",
        "N": "#dcfce7",
        "": "#f8fafc"
    };

    dati.forEach(r => {
        const bg = colori[r.tipo] || "#f8fafc";
        const data = formatDataSafe(r.data);

        html += `
<div class="card" id="row-${r.id}" style="background:${bg};margin-bottom:14px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
        <strong>${r.tipo || r.descrizione}</strong>
        <span>📅 ${data}</span>
    </div>

    <div style="margin-top:8px;">
        <strong>Descrizione:</strong><br>
        ${r.descrizione}
    </div>

</div>`;
    });

    cont.innerHTML = html;
}

// =====================================================
// FORMAT DATA
// =====================================================
function formatDataSafe(d){
    if(!d) return "";
    if(/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    if(typeof d === "string" && d.includes("T")) return d.split("T")[0];

    try{
        return new Date(d).toISOString().split("T")[0];
    }catch{
        return d;
    }
}

// =====================================================
// TOAST
// =====================================================
function toast(msg){
    let t = document.createElement("div");
    t.innerHTML = msg;
    t.style.position = "fixed";
    t.style.bottom = "20px";
    t.style.left = "50%";
    t.style.transform = "translateX(-50%)";
    t.style.background = "#333";
    t.style.color = "#fff";
    t.style.padding = "12px 22px";
    t.style.borderRadius = "12px";
    t.style.zIndex = "9999";
    document.body.appendChild(t);
    setTimeout(()=> t.remove(), 2000);
}

// =====================================================
// AUTOLOGIN
// =====================================================
window.onload = () => {
    const saved = localStorage.getItem("autista");
    if(saved){
        autistaCorrente = saved;
        mostraPagina("page-presenza");
        // caricaTurni();  <-- NON QUI
    }
};
