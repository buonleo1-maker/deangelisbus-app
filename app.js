// =====================================================
// DEANGELISBUS – APP.JS V16 DEFINITIVO
// Tutte le richieste sono GET → zero CORS, zero errori
// =====================================================

// 🔗 URL BACKEND
const API = "https://script.google.com/macros/s/AKfycbzM0vZgWDKXrwDthkrnzCKWk3dnTb-u-zR-IvpcZidt-GupAHPwkh6gpPHLmSpd7h-U/exec";

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
// =====================================================
// SHOW/HIDE PAGINE
// =====================================================
function mostraPagina(id){
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
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
// LOGIN
// =====================================================
async function login(){
    const nome = document.getElementById("login-nome").value.trim();
    const pin  = document.getElementById("login-pin").value.trim();

    if(!nome || !pin){
        alert("Inserisci nome e PIN");
        return;
    }

    const url = API + `?action=login&nome=${encodeURIComponent(nome)}&pin=${encodeURIComponent(pin)}`;

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
    mostraPagina("page-login");
}


// =====================================================
// CARICA TURNI
// =====================================================
async function caricaTurni(){
    try{
        const r = await fetch(`${API}?action=${ACTION_TURNI}`);
        const js = await r.json();

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
        console.error("Errore turni:", err);
    }
}

// =====================================================
// CAMBIO TIPO (turno / testo libero)
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
    const note = document.getElementById("note").value;

    const url =
        `${API}?action=${ACTION_SALVA}`
        + `&autista=${encodeURIComponent(autistaCorrente)}`
        + `&tipo=${encodeURIComponent(tipo)}`
        + `&descrizione=${encodeURIComponent(desc)}`
        + `&data=${encodeURIComponent(data)}`
        + `&oraInizio=${encodeURIComponent(ini)}`
        + `&oraFine=${encodeURIComponent(fin)}`
        + `&note=${encodeURIComponent(note)}`;

    try{
        const r = await fetch(url);
        const js = await r.json();

        if(js.status === "OK"){
            alert("Presenza salvata!");
        } else {
            alert("Errore: " + js.message);
        }

    }catch(err){
        console.error(err);
        alert("Errore salvataggio");
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

        const div = document.getElementById("storico-container");
        div.innerHTML = "";

        if(js.status === "OK"){
            js.dati.forEach(r => {

                // FORMATTA DATA IN MODO PULITO
                let d = r.data;
                if(d.includes("-")){
                    const p = d.split("-");
                    d = `${p[2]}/${p[1]}/${p[0]}`;
                }

                const box = document.createElement("div");
                box.className = "rigaStorico";
                box.style.cssText = `
                    background:white;
                    border-radius:14px;
                    padding:16px;
                    margin-bottom:14px;
                    box-shadow:0 4px 12px rgba(0,0,0,.12);
                    font-size:15px;
                    line-height:1.4em;
                `;

                box.innerHTML = `
                    <b>${d}</b><br>
                    <span style="color:#1e3a8a">${r.tipo}</span> — ${r.descrizione}<br>
                    ${r.oraInizio || ""} ${r.oraFine ? "→ " + r.oraFine : ""}

                    <div style="margin-top:10px; display:flex; gap:10px;">
                        <button onclick="duplica(${r.id})"
                            style="flex:1; padding:10px; border-radius:10px; background:#0284c7; color:white; border:none;">
                            Duplica
                        </button>
                        <button onclick="cancella(${r.id})"
                            style="flex:1; padding:10px; border-radius:10px; background:#dc2626; color:white; border:none;">
                            Elimina
                        </button>
                    </div>
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
    if(!confirm("Confermi eliminazione?")) return;

    await fetch(`${API}?action=${ACTION_DELETE}&id=${id}`);
    vaiStorico();
}

// =====================================================
// DUPLICA → apre solo la pagina
// =====================================================
function duplica(id){
    mostraPagina("page-presenza");
}

// =====================================================
// AUTOLOGIN
// =====================================================
window.onload = () => {
    const saved = localStorage.getItem("autista");
    if(saved){
        autistaCorrente = saved;
        mostraPagina("page-presenza");
        caricaTurni();
    } else {
        mostraPagina("page-login");
    }
};

