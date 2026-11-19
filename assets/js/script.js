class Libro {
  static contatore = 0;

  constructor(titolo, autore, anno) {
    this.id = ++Libro.contatore;
    this.titolo = titolo;
    this.autore = autore;
    this.anno = anno;
    this.letto = false;
  }

  segnaComeLetto() {
    this.letto = true;
  }

  formato() {
    return "cartaceo";
  }

  static fromJSON(d) {
    return Object.assign(new this(d.titolo, d.autore, d.anno), d);
  }
}

class LibroDigitale extends Libro {
  constructor(titolo, autore, anno, dimensioneMb) {
    super(titolo, autore, anno);
    this.dimensioneMb = dimensioneMb;
  }

  formato() {
    return `digitale (${this.dimensioneMb} MB)`;
  }
}

const STORAGE_KEY = "libri";
let libri = caricaLibri();
let controller;
let timeoutId;

async function getJSON(url, opzioni) {
  const r = await fetch(url, opzioni);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();  
}

async function cerca(query) {
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;
  mostraSpinner();

  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", 10);

  try {
    const dati = await getJSON(url, { signal });
    renderRisultati(dati.docs);
  } catch (err) {
    if (err.name !== "AbortError") {
      mostraErrore(`Errore durante la ricerca: ${err.message}`);
    }
  } finally {
    if (!signal.aborted) {
      nascondiSpinner();
    }
  }
}

async function login(username, password) {
  const r = await fetch("https://dummyjson.com/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!r.ok) throw new Error("Credenziali non valide");
  const dati = await r.json();
  localStorage.setItem("auth.token", dati.accessToken);
  localStorage.setItem("auth.user", JSON.stringify(dati));
  return dati;
}

async function caricaProfilo() {
  const token = getToken();
  if (!token) return null;

  return getJSON("https://dummyjson.com/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function gestisciLogin(e) {
  e.preventDefault();
  const { username, password } = Object.fromEntries(new FormData(e.target));

  try {
    await login(username, password);
    renderAuthBox();
    await mostraProfilo();
  } catch (err) {
    alert(err.message);
  }
}

async function mostraProfilo() {
  if (!getToken()) return;

  try {
    const profilo = await caricaProfilo();
    if (!profilo) return;

    const img = document.createElement("img");
    img.src = profilo.image;
    img.alt = `${profilo.firstName} ${profilo.lastName}`;

    const info = document.createElement("div");
    info.className = "info";
    info.textContent = `${profilo.firstName} ${profilo.lastName} (@${profilo.username}) — ${profilo.email}`;

    document.getElementById("profilo").replaceChildren(img, info);
    document.getElementById("profilo-section").hidden = false;
  } catch (err) {
    logout();
  }
}

async function avvio() {
  renderLibri();
  renderAuthBox();
  await mostraProfilo();
}

avvio();

function getToken() {
  return localStorage.getItem("auth.token");
}

function getUtente() {
  return JSON.parse(localStorage.getItem("auth.user") ?? "null");
}

function logout() {
  localStorage.removeItem("auth.token");
  localStorage.removeItem("auth.user");
  document.getElementById("profilo-section").hidden = true; 
  renderAuthBox();
}

function renderAuthBox() {
  const box = document.getElementById("auth-box");
  const utente = getUtente();

  if (utente) {
    const saluto = document.createElement("span");
    saluto.className = "saluto";
    saluto.textContent = `Ciao ${utente.firstName}`;

    const esci = document.createElement("button");
    esci.type = "button";
    esci.textContent = "Esci";
    esci.addEventListener("click", logout);

    box.replaceChildren(saluto, esci);
  }else {
    box.innerHTML = `
      <form id="form-login" class="form-login">
        <input type="text" name="username" value="emilys" required>
        <input type="password" name="password" value="emilyspass" required>
        <button type="submit">Accedi</button>
      </form>
    `;
    document
      .getElementById("form-login")
      .addEventListener("submit", gestisciLogin);
  }
}

function renderRisultati(docs) {
  const listaRisultati = document.getElementById("risultati");
  docs = docs.filter((d) => d.author_name);

  if (docs.length === 0) {
    const liVuoto = document.createElement("li");
    liVuoto.textContent = "Nessun risultato.";
    listaRisultati.replaceChildren(liVuoto);
    return;
  }

  const righe = docs.map((d) => {
    const titolo = d.title ?? "Titolo sconosciuto";
    const autore = d.author_name?.[0] ?? "Autore sconosciuto";
    const anno = d.first_publish_year ?? "?";

    const li = document.createElement("li");
    const divInfo = document.createElement("div");
    divInfo.className = "info";

    const spanTitolo = document.createElement("span");
    spanTitolo.className = "titolo";
    spanTitolo.textContent = titolo;

    const divMeta = document.createElement("div");
    divMeta.className = "meta";
    divMeta.textContent = `${autore} — ${anno}`;
    divInfo.append(spanTitolo, divMeta);

    const btnAggiungi = document.createElement("button");
    btnAggiungi.textContent = "Aggiungi";
    btnAggiungi.dataset.titolo = titolo;
    btnAggiungi.dataset.autore = autore;
    btnAggiungi.dataset.anno = anno;

    li.append(divInfo, btnAggiungi);
    return li;
  });

  listaRisultati.replaceChildren(...righe);
}

function mostraSpinner() {
  document.getElementById("spinner").removeAttribute("hidden");
  document.getElementById("errore").setAttribute("hidden", "");
}

function nascondiSpinner() {
  document.getElementById("spinner").setAttribute("hidden", "");
}

function mostraErrore(msg) {
  const elErrore = document.getElementById("errore");
  elErrore.textContent = msg;
  elErrore.removeAttribute("hidden");
}

function salvaLibri() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(libri));
}

function caricaLibri() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]").map((d) =>
    d.dimensioneMb !== undefined
      ? LibroDigitale.fromJSON(d)
      : Libro.fromJSON(d),
  );
}

function renderLibri() {
  const lista = document.getElementById("lista-libri");
  const html = libri
    .map(
      (l) => `
    <li class="${l.letto ? "letto" : ""}" data-id="${l.id}">
      <div class="info">
        <span class="titolo">${l.titolo}</span>
        <span class="badge-formato">${l.formato()}</span>
        <div class="meta">${l.autore} — ${l.anno}</div>
      </div>
      <div class="azioni">
        ${l.letto ? "✓ letto" : '<button data-azione="leggi">Segna come letto</button>'}
      </div>
    </li>`,
    )
    .join("");

  lista.innerHTML = html;

  lista.querySelectorAll(".azioni").forEach((divAzioni) => {
    const btnRimuovi = document.createElement("button");
    btnRimuovi.dataset.azione = "rimuovi";
    btnRimuovi.textContent = "Rimuovi";
    divAzioni.appendChild(btnRimuovi);
  });

  document.getElementById("contatore").textContent = libri.length;
}

document.getElementById("cerca").addEventListener("input", (e) => {
  const query = e.target.value.trim();

  clearTimeout(timeoutId);

  if (query.length < 3) {
    controller?.abort();
    nascondiSpinner();
    document.getElementById("errore").setAttribute("hidden", "");
    document.getElementById("risultati").innerHTML = "";
    return;
  }
  timeoutId = setTimeout(() => cerca(query), 400);
});

document.getElementById("risultati").addEventListener("click", (e) => {
  const bottone = e.target.closest("button[data-titolo]");
  if (!bottone) return;

  const { titolo, autore, anno } = bottone.dataset;
  const nuovoLibro = new Libro(titolo, autore, Number(anno) || 0);

  libri.push(nuovoLibro);
  salvaLibri();
  renderLibri();

  bottone.textContent = "✓ Aggiunto";
  bottone.disabled = true;
});

document.getElementById("formato").addEventListener("change", (e) => {
  const campo = document.getElementById("campo-dimensione");
  if (e.target.value === "digitale") {
    campo.removeAttribute("hidden");
  } else {
    campo.setAttribute("hidden", "");
  }
});

document.getElementById("aggiungi-libro").addEventListener("submit", (e) => {
  e.preventDefault();

  const titolo = document.getElementById("titolo").value;
  const autore = document.getElementById("autore").value;
  const anno = parseInt(document.getElementById("anno").value);
  const formato = document.getElementById("formato").value;

  let nuovo;
  if (formato === "digitale") {
    const dim = parseFloat(document.getElementById("dimensione").value) || 0;
    nuovo = new LibroDigitale(titolo, autore, anno, dim);
  } else {
    nuovo = new Libro(titolo, autore, anno);
  }

  libri.push(nuovo);
  salvaLibri();
  renderLibri();
  e.target.reset();
  document.getElementById("campo-dimensione").setAttribute("hidden", "");
});

document.getElementById("lista-libri").addEventListener("click", (e) => {
  const bottone = e.target.closest("[data-azione]");
  if (!bottone) return;

  const azione = bottone.dataset.azione;
  const id = parseInt(bottone.closest("li").dataset.id);

  if (azione === "leggi") {
    const libro = libri.find((l) => l.id === id);
    if (libro) libro.segnaComeLetto();
  } else if (azione === "rimuovi") {
    libri = libri.filter((l) => l.id !== id);
  }

  salvaLibri();
  renderLibri();
});

document.getElementById("svuota-tutto").addEventListener("click", () => {
  libri = [];
  localStorage.removeItem(STORAGE_KEY);
  renderLibri();
});

renderLibri();
