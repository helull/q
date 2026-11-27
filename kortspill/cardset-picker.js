export async function initCardsetPicker(db, collection, getDocs) {
  const input = document.getElementById("gameId");
  const wrap = document.createElement("div");
  wrap.className = "cardset-picker";
  const select = document.createElement("select");
  select.setAttribute("aria-label", "Velg kortstokk");
  const status = document.createElement("small");
  status.setAttribute("role", "status");
  select.add(new Option("Henter kortstokker …", ""));
  select.disabled = true;
  input.before(wrap);
  wrap.append(select, input, status);
  input.placeholder = "Eller skriv spill-ID";
  input.removeAttribute("list");
  input.setAttribute("aria-label", "Spill-ID");
  select.addEventListener("change", () => { if (select.value) input.value = select.value; });
  input.addEventListener("input", () => { select.value = input.value.trim().toLowerCase(); if (select.selectedIndex < 0) select.selectedIndex = 0; });
  try {
    const snapshot = await getDocs(collection(db, "cardsets"));
    const items = [];
    snapshot.forEach(d => { const title = String(d.data().title || "").trim(); items.push({id:d.id,title:title || d.id}); });
    items.sort((a,b) => a.title.localeCompare(b.title,"nb") || a.id.localeCompare(b.id,"nb"));
    select.replaceChildren(new Option(items.length ? "Velg kortstokk" : "Ingen kortstokker funnet", ""));
    for (const item of items) select.add(new Option(item.title === item.id ? item.id : item.title + " (" + item.id + ")",item.id));
    select.disabled = !items.length;
    select.value = input.value.trim().toLowerCase();
    if (select.selectedIndex < 0) select.selectedIndex = 0;
  } catch (error) {
    select.replaceChildren(new Option("Kunne ikke hente kortstokker", ""));
    status.textContent = "Skriv spill-ID manuelt.";
    console.warn("Kortstokkliste:", error);
  }
}
