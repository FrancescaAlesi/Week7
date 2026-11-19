import { getUtente } from "./api.js";

export function mostraSpinner() {
  document.getElementById("spinner").removeAttribute("hidden");
  document.getElementById("errore").setAttribute("hidden", "");
}

export function nascondiSpinner() {
  document.getElementById("spinner").setAttribute("hidden", "");
}

export function mostraErrore(msg) {
  const elErrore = document.getElementById("errore");
  elErrore.textContent = msg;
  elErrore.removeAttribute("hidden");
}

export function renderLibri() {
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

export function renderRisultati(docs) {
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

export function renderProfilo(profilo) {
  const img = document.createElement("img");
  img.src = profilo.image;
  img.alt = `${profilo.firstName} ${profilo.lastName}`;

  const info = document.createElement("div");
  info.className = "info";
  info.textContent = `${profilo.firstName} ${profilo.lastName} (@${profilo.username}) — ${profilo.email}`;

  document.getElementById("profilo").replaceChildren(img, info);
  document.getElementById("profilo-section").hidden = false;
}

export function renderAuthBox(onLoginSubmit, onLogoutClick) {
  const box = document.getElementById("auth-box");
  const utente = getUtente();

  if (utente) {
    const saluto = document.createElement("span");
    saluto.className = "saluto";
    saluto.textContent = `Ciao ${utente.firstName}`;

    const esci = document.createElement("button");
    esci.type = "button";
    esci.textContent = "Esci";
    esci.addEventListener("click", onLogoutClick);

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
      .addEventListener("submit", onLoginSubmit);
  }
}