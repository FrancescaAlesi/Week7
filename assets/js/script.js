import { Libro, LibroDigitale } from "./modelli.js";
import { salvaLibri, caricaLibri, svuotaStorageLibri } from "./storage.js";
import { cercaSuOpenLibrary, login, getToken, rimuoviDatiAuth, caricaProfilo,} from "./api.js";
import { mostraSpinner, nascondiSpinner, mostraErrore, renderLibri, renderRisultati, renderProfilo, renderAuthBox,} from "./ui.js";
let libri = caricaLibri();
let controller;
let timeoutId;

async function eseguiRicerca(query) {
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;
  mostraSpinner();

  try {
    const dati = await cercaSuOpenLibrary(query, signal);
    renderRisultati(docs);
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

function logout() {
  rimuoviDatiAuth();
  document.getElementById("profilo-section").hidden = true;
  renderAuthBox(gestisciLogin, logout);
}

async function gestisciLogin(e) {
  e.preventDefault();
  const { username, password } = Object.fromEntries(new FormData(e.target));

  try {
    await login(username, password);
    renderAuthBox(gestisciLogin, logout);
    await mostraProfiloUtente();
  } catch (err) {
    alert(err.message);
  }
}

async function mostraProfiloUtente() {
  if (!getToken()) return;

  try {
    const profilo = await caricaProfilo();
    if (profilo) {
      renderProfilo(profilo);
    }
  } catch (err) {
    logout();
  }
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
  timeoutId = setTimeout(() => eseguiRicerca(query), 400);
});

document.getElementById("risultati").addEventListener("click", (e) => {
  const bottone = e.target.closest("button[data-titolo]");
  if (!bottone) return;

  const { titolo, autore, anno } = bottone.dataset;
  const nuovoLibro = new Libro(titolo, autore, Number(anno) || 0);

  libri.push(nuovoLibro);
  salvaLibri(libri);
  renderLibri(libri);

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
  salvaLibri(libri);
  renderLibri(libri);
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

  salvaLibri(libri);
  renderLibri(libri);
});

document.getElementById("svuota-tutto").addEventListener("click", () => {
  libri = [];
  localStorage.removeItem(STORAGE_KEY);
  renderLibri(libri);
});

async function avvio() {
  renderLibri(libri);
  renderAuthBox(gestisciLogin, logout);
  await mostraProfiloUtente();
}

avvio();