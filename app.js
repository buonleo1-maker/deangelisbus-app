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
        "":  "#f8fafc"
    };

    dati.forEach(r => {
        const id   = r.id;
        const data = fixData(r.data);
        const bg   = colori[r.tipo] || "#f8fafc";

        html += `
<div class="card" id="row-${id}" style="background:${bg};margin-bottom:14px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
        <strong>${r.tipo}</strong>
        <span>📅 ${data}</span>
    </div>

    <input type="hidden" id="d-${id}" value="${data}">
    <input type="hidden" id="t-${id}" value="${r.tipo}">

    <div style="margin-top:8px;">
        <strong>Descrizione</strong><br>
        <input id="ds-${id}" value="${r.descrizione}">
    </div>

    <div class="row" style="margin-top:8px;">
        <div>
            <strong>Inizio</strong><br>
            <input id="i-${id}" value="${r.oraInizio}">
        </div>
        <div>
            <strong>Fine</strong><br>
            <input id="f-${id}" value="${r.oraFine}">
        </div>
    </div>

    <div style="margin-top:8px;">
        <strong>Durata</strong><br>
        <input id="u-${id}" value="${r.durata||''}">
    </div>

    <div style="margin-top:8px;">
        <strong>Note</strong><br>
        <input id="n-${id}" value="${r.note||''}">
    </div>

    <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;">
        <button onclick="salvaEdit(${id})" class="action-btn save">✏️ Salva</button>
        <button onclick="elimina(${id})" class="action-btn delete">🗑️</button>
        <button onclick="duplica(${id})" class="action-btn" style="background:#0284c7;color:white">📄 Duplica</button>
        <button onclick="duplicaDomani(${id})" class="action-btn" style="background:#0ea5e9;color:white">📆 Domani</button>
        <button onclick="nuovaDaQuesta(${id})" class="action-btn" style="background:#10b981;color:white">🆕 Nuova</button>
    </div>
</div>
        `;
    });

    cont.innerHTML = html;
}

// =====================================================
// HELPERS STORICO
// =====================================================
function fixData(d){
    if (!d) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    if (typeof d === "string" && d.includes("T")) return d.split("T")[0];
    try {
        return new Date(d).toISOString().split("T")[0];
    } catch {
        return d;
    }
}

async function elimina(id){
    if(!confirm("Eliminare questa presenza?")) return;

    const url = `${API}?action=${ACTION_DELETE}&id=${id}`;
    const res = await fetch(url);
    const js  = await res.json();

    if(js.status === "OK"){
        document.getElementById(`row-${id}`).remove();
        toast("Eliminata");
    }
}

async function salvaEdit(id){
    const data = document.getElementById(`d-${id}`).value;
    const tipo = document.getElementById(`t-${id}`).value;
    const desc = document.getElementById(`ds-${id}`).value;
    const ini  = document.getElementById(`i-${id}`).value;
    const fin  = document.getElementById(`f-${id}`).value;
    const dur  = document.getElementById(`u-${id}`).value;
    const note = document.getElementById(`n-${id}`).value;

    const url =
        `${API}?action=${ACTION_UPDATE}`+
        `&id=${id}`+
        `&autista=${encodeURIComponent(autistaCorrente)}`+
        `&data=${encodeURIComponent(data)}`+
        `&tipo=${encodeURIComponent(tipo)}`+
        `&descrizione=${encodeURIComponent(desc)}`+
        `&oraInizio=${encodeURIComponent(ini)}`+
        `&oraFine=${encodeURIComponent(fin)}`+
        `&durata=${encodeURIComponent(dur)}`+
        `&note=${encodeURIComponent(note)}`;

    const res = await fetch(url);
    const js  = await res.json();

    if(js.status === "OK"){
        toast("Aggiornato");
    }
}

async function duplica(id){
    const data = document.getElementById(`d-${id}`).value;
    const tipo = document.getElementById(`t-${id}`).value;
    const desc = document.getElementById(`ds-${id}`).value;
    const ini  = document.getElementById(`i-${id}`).value;
    const fin  = document.getElementById(`f-${id}`).value;
    const dur  = document.getElementById(`u-${id}`).value;
    const note = document.getElementById(`n-${id}`).value;

    const url =
        `${API}?action=${ACTION_SALVA}`+
        `&autista=${encodeURIComponent(autistaCorrente)}`+
        `&tipo=${encodeURIComponent(tipo)}`+
        `&descrizione=${encodeURIComponent(desc)}`+
        `&data=${encodeURIComponent(data)}`+
        `&oraInizio=${encodeURIComponent(ini)}`+
        `&oraFine=${encodeURIComponent(fin)}`+
        `&note=${encodeURIComponent(note)}`+
        `&durata=${encodeURIComponent(dur)}`;

    const res = await fetch(url);
    const js  = await res.json();

    if(js.status === "OK"){
        toast("Duplicata");
        caricaStorico();
    }
}

async function duplicaDomani(id){
    const today = new Date(document.getElementById(`d-${id}`).value);
    const tomorrow = new Date(today.getTime() + 86400000);
    const newDate = tomorrow.toISOString().split("T")[0];

    const tipo = document.getElementById(`t-${id}`).value;
    const desc = document.getElementById(`ds-${id}`).value;
    const ini  = document.getElementById(`i-${id}`).value;
    const fin  = document.getElementById(`f-${id}`).value;
    const dur  = document.getElementById(`u-${id}`).value;
    const note = document.getElementById(`n-${id}`).value;

    const url =
        `${API}?action=${ACTION_SALVA}`+
        `&autista=${encodeURIComponent(autistaCorrente)}`+
        `&tipo=${encodeURIComponent(tipo)}`+
        `&descrizione=${encodeURIComponent(desc)}`+
        `&data=${encodeURIComponent(newDate)}`+
        `&oraInizio=${encodeURIComponent(ini)}`+
        `&oraFine=${encodeURIComponent(fin)}`+
        `&note=${encodeURIComponent(note)}`+
        `&durata=${encodeURIComponent(dur)}`;

    const res = await fetch(url);
    const js  = await res.json();

    if(js.status === "OK"){
        toast("Duplicata a domani");
        caricaStorico();
    }
}

function nuovaDaQuesta(id){
    document.getElementById("tipo").value = document.getElementById(`t-${id}`).value;
    onChangeTipo();

    document.getElementById("descrizione-turno").value = document.getElementById(`ds-${id}`).value;
    document.getElementById("descrizione-libera").value = document.getElementById(`ds-${id}`).value;

    document.getElementById("data").value = document.getElementById(`d-${id}`).value;
    document.getElementById("oraInizio").value = document.getElementById(`i-${id}`).value;
    document.getElementById("oraFine").value   = document.getElementById(`f-${id}`).value;
    document.getElementById("note").value      = document.getElementById(`n-${id}`).value;

    mostraPagina("page-presenza");
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
        // caricaTurni();  ← TOGLIERE QUESTA RIGA
    }
};

