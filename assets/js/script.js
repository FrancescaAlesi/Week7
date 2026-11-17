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

let libri = caricaLibri();

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
