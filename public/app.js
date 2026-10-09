let TYPES = [];

async function loadTypes() {
  const res = await fetch("/api/types");
  TYPES = await res.json();
}

function showResult(el, message, variant) {
  el.textContent = message;
  el.className = `result ${variant}`;
  el.classList.remove("hidden");
}

document.getElementById("note-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const sprint = document.getElementById("sprint").value.trim();
  const noteText = document.getElementById("note-text").value.trim();
  const resultEl = document.getElementById("note-result");
  const submitBtn = e.target.querySelector("button");

  submitBtn.disabled = true;
  submitBtn.textContent = "Bezig met classificeren...";

  try {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteText, sprint }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Onbekende fout");

    if (data.reviewed) {
      showResult(
        resultEl,
        `Opgeslagen als "${data.type}" (confidence: ${data.confidence}%)`,
        "success"
      );
    } else {
      showResult(
        resultEl,
        `Voorstel "${data.type}" heeft lage confidence (${data.confidence}%) — staat nu in de review-wachtrij hieronder.`,
        "pending"
      );
    }

    document.getElementById("note-text").value = "";
    loadPending();
    loadOverview();
  } catch (err) {
    showResult(resultEl, `Fout: ${err.message}`, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Classificeren & opslaan";
  }
});

async function loadPending() {
  const res = await fetch("/api/pending");
  const pending = await res.json();
  const listEl = document.getElementById("pending-list");
  const countEl = document.getElementById("pending-count");

  countEl.textContent = pending.length;

  if (pending.length === 0) {
    listEl.innerHTML = `<p class="empty">Niets te reviewen.</p>`;
    return;
  }

  listEl.innerHTML = "";
  for (const note of pending) {
    const item = document.createElement("div");
    item.className = "pending-item";

    const typeOptions = TYPES.map(
      (t) => `<option value="${t}" ${t === note.type ? "selected" : ""}>${t}</option>`
    ).join("");

    item.innerHTML = `
      <div class="meta">${note.sprint} · voorstel: <strong>${note.type}</strong> (${note.confidence}%) — ${note.reasoning}</div>
      <div class="text">${note.title}: ${note.originalText.slice(0, 150)}${note.originalText.length > 150 ? "..." : ""}</div>
      <div class="actions">
        <select data-id="${note.id}">${typeOptions}</select>
        <button class="secondary" data-id="${note.id}">Bevestigen</button>
      </div>
    `;

    item.querySelector("button").addEventListener("click", async () => {
      const select = item.querySelector("select");
      await fetch(`/api/notes/${note.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: select.value }),
      });
      loadPending();
      loadOverview();
    });

    listEl.appendChild(item);
  }
}

async function loadOverview() {
  const res = await fetch("/api/overview");
  const bySprint = await res.json();
  const el = document.getElementById("overview");
  const sprints = Object.keys(bySprint).sort();

  if (sprints.length === 0) {
    el.innerHTML = `<p class="empty">Nog geen bevestigde notities.</p>`;
    return;
  }

  el.innerHTML = sprints
    .map((sprint) => {
      const byType = bySprint[sprint];
      const typesHtml = Object.keys(byType)
        .sort()
        .map((type) => {
          const notes = byType[type];
          const items = notes
            .map((n) => `<li>${n.createdAt.slice(0, 10)} — ${n.title}</li>`)
            .join("");
          return `<div class="overview-type"><h4>${type} (${notes.length})</h4><ul>${items}</ul></div>`;
        })
        .join("");
      return `<div class="overview-sprint"><h3>${sprint}</h3>${typesHtml}</div>`;
    })
    .join("");
}

(async function init() {
  await loadTypes();
  await loadPending();
  await loadOverview();
})();
