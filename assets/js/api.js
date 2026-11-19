export async function getJSON(url, opzioni) {
  const r = await fetch(url, opzioni);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function cercaSuOpenLibrary(query, signal) {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", 10);

  const dati = await getJSON(url, { signal });
  return dati.docs;
}

export async function login(username, password) {
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

export function getToken() {
  return localStorage.getItem("auth.token");
}

export function getUtente() {
  return JSON.parse(localStorage.getItem("auth.user") ?? "null");
}

export function rimuoviDatiAuth() {
  localStorage.removeItem("auth.token");
  localStorage.removeItem("auth.user"); 
}

export async function caricaProfilo() {
  const token = getToken();
  if (!token) return null;

  return getJSON("https://dummyjson.com/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}