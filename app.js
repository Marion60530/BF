function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

// Extrait quantité / unité / nom d'une ligne du type "200g de beurre" ou "2 c. à soupe de sucre".
// Si le format n'est pas reconnu, la ligne entière est traitée comme le nom de l'ingrédient.
function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const unitPattern =
    "kg|g|gr|grammes?|ml|cl|l|c\\.?\\s?à\\s?s\\.?|c\\.?\\s?à\\s?c\\.?|" +
    "cuill(?:ère|eres)?s?\\s?à\\s?(?:soupe|café)|tasses?|verres?|pincées?";
  const re = new RegExp(
    `^(\\d+(?:[.,]\\d+)?)\\s*(${unitPattern})?\\s*(?:d[e'’]\\s*)?(.+)$`,
    "i"
  );

  const match = trimmed.match(re);
  if (match) {
    return {
      raw: trimmed,
      qty: parseFloat(match[1].replace(",", ".")),
      unit: match[2] ? match[2].trim() : null,
      name: match[3].trim()
    };
  }
  return { raw: trimmed, qty: null, unit: null, name: trimmed };
}

function findSubstitution(name) {
  const normalizedName = normalize(name);
  for (const entry of SUBSTITUTIONS) {
    for (const keyword of entry.match) {
      if (normalizedName.includes(normalize(keyword))) {
        return entry;
      }
    }
  }
  return null;
}

function formatQty(qty) {
  if (qty === null || qty === undefined) return null;
  const rounded = Math.round(qty * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function buildResult(parsedIngredient) {
  const sub = findSubstitution(parsedIngredient.name);
  if (!sub) {
    return { ingredient: parsedIngredient, substitution: null };
  }

  let adjustedQtyText = null;
  if (parsedIngredient.qty !== null) {
    const adjustedQty = formatQty(parsedIngredient.qty * sub.ratio);
    adjustedQtyText = `${adjustedQty}${parsedIngredient.unit ? " " + parsedIngredient.unit : ""}`;
  }

  return { ingredient: parsedIngredient, substitution: sub, adjustedQtyText };
}

function categoryLabel(category) {
  return category === "gras" ? "Moins de gras" : "Moins de sucre";
}

function renderResults(results) {
  const container = document.getElementById("results");
  const summary = document.getElementById("summary");
  container.innerHTML = "";

  const matched = results.filter((r) => r.substitution);
  const categoriesTouched = new Set(matched.map((r) => r.substitution.category));

  if (results.length === 0) {
    summary.textContent = "";
    return;
  }

  if (matched.length === 0) {
    summary.textContent =
      "Aucun ingrédient de la liste ne correspond à une substitution répertoriée pour l'instant.";
  } else {
    const parts = [];
    if (categoriesTouched.has("gras")) parts.push("gras");
    if (categoriesTouched.has("sucre")) parts.push("sucre");
    summary.textContent = `${matched.length} ingrédient(s) sur ${results.length} peuvent être remplacés pour réduire : ${parts.join(" et ")}.`;
  }

  results.forEach((result) => {
    const card = document.createElement("div");
    card.className = "card";

    if (!result.substitution) {
      card.classList.add("card--neutral");
      card.innerHTML = `
        <div class="card__original">${escapeHtml(result.ingredient.raw)}</div>
        <div class="card__note">Aucune alternative répertoriée pour cet ingrédient.</div>
      `;
      container.appendChild(card);
      return;
    }

    const sub = result.substitution;
    const badges = sub.impact
      .map(
        (cat) =>
          `<span class="badge badge--${cat}">${categoryLabel(cat)}</span>`
      )
      .join("");

    const adjustmentsHtml = sub.adjustments
      .map((a) => `<li>${escapeHtml(a)}</li>`)
      .join("");

    card.innerHTML = `
      <div class="card__badges">${badges}</div>
      <div class="card__original">${escapeHtml(result.ingredient.raw)}</div>
      <div class="card__arrow">→</div>
      <div class="card__substitute">
        ${result.adjustedQtyText ? escapeHtml(result.adjustedQtyText) + " " : ""}${escapeHtml(sub.substitute)}
      </div>
      <ul class="card__adjustments">${adjustmentsHtml}</ul>
      ${sub.caveat ? `<div class="card__caveat">⚠️ ${escapeHtml(sub.caveat)}</div>` : ""}
    `;
    container.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById("transform-btn").addEventListener("click", () => {
  const input = document.getElementById("ingredients-input").value;
  const lines = input.split("\n").map((l) => l.trim()).filter(Boolean);
  const results = lines.map(parseLine).map(buildResult);
  renderResults(results);
});
