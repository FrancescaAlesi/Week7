import { Libro, LibroDigitale } from "./modelli.js";
const STORAGE_KEY = "libri";

export function salvaLibri(libri) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(libri));
}

export function caricaLibri() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]").map((d) =>
    d.dimensioneMb !== undefined
      ? LibroDigitale.fromJSON(d)
      : Libro.fromJSON(d),
  );
}

export function svuotaStorageLibri() {
  localStorage.removeItem(STORAGE_KEY);
}