// -----------------------------
// GLOBAL STATE
// -----------------------------
let allMeals = [];
let baseMeals = [];
let initialMeals = [];
let isGlobalMode = false;
let measurementType = "imperial"; // "imperial" or "metric"
const defaultCount = 12;

// -----------------------------
// DOM ELEMENTS
// -----------------------------
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const randomBtn = document.getElementById("randomBtn");
const resetBtn = document.getElementById("resetBtn");
const resultsEl = document.getElementById("results");
const mealDetailsEl = document.getElementById("mealDetails");
const resultsInfoEl = document.getElementById("resultsInfo");
const categorySelect = document.getElementById("categorySelect");
const areaSelect = document.getElementById("areaSelect");
const ingredientSelect = document.getElementById("ingredientSelect");

// -----------------------------
// MEASUREMENT CONVERSION
// -----------------------------
function convertMeasurement(measure) {
  if (!measure) return "";

  let m = measure.trim();

  // Insert space between number and letters if missing (e.g., 300g → 300 g)
  m = m.replace(/^([\d/.]+)([a-zA-Z]+)/, "$1 $2");

  // Split into number/unit and ingredient name
  const parts = m.split(" ");
  const numPart = parts[0];
  let unitPart = parts[1] || "";
  const rest = parts.slice(2).join(" ");

  const parseNumber = str => {
    if (!str) return NaN;
    if (str.includes("/")) {
      const [n, d] = str.split("/");
      return parseFloat(n) / parseFloat(d);
    }
    return parseFloat(str);
  };

  const formatNumber = num => (num % 1 === 0 ? num : +num.toFixed(2));

  const formatImperialWeight = oz => {
    if (oz < 16) return `${formatNumber(oz)} oz`;
    const lbs = Math.floor(oz / 16);
    const remainingOz = Math.round(oz % 16);
    return remainingOz === 0 ? `${lbs} lb` : `${lbs} lb ${remainingOz} oz`;
  };

  // Normalize units
  unitPart = unitPart.toLowerCase()
    .replace(/\bgrams?\b/, "g")
    .replace(/\bkilograms?\b/, "kg")
    .replace(/\bmilliliters?\b/, "ml")
    .replace(/\bliters?\b/, "l")
    .replace(/\bteaspoons?\b/, "tsp")
    .replace(/\btablespoons?\b/, "tbsp")
    .replace(/\bcups?\b/, "cup");

  const value = parseNumber(numPart);
  if (isNaN(value)) return measure;

  if (measurementType === "imperial") {
    switch (unitPart) {
      case "g": return `${formatImperialWeight(value / 28)} ${rest}`;
      case "kg": return `${formatImperialWeight(value * 35.274)} ${rest}`;
      case "ml": return `${formatNumber(value / 240)} cup ${rest}`;
      case "l": return `${formatNumber(value * 4.167)} cup ${rest}`;
      case "tsp": return `${formatNumber(value)} tsp ${rest}`;
      case "tbsp": return `${formatNumber(value)} tbsp ${rest}`;
      case "cup": return `${formatNumber(value)} cup ${rest}`;
      case "oz": return `${formatImperialWeight(value)} ${rest}`;
      case "lb": return `${formatNumber(value)} lb ${rest}`;
      default: return measure;
    }
  }

  if (measurementType === "metric") {
    switch (unitPart) {
      case "oz": return `${formatNumber(value * 28)} g ${rest}`;
      case "lb": return `${formatNumber(value * 454)} g ${rest}`;
      case "tsp": return `${formatNumber(value * 5)} ml ${rest}`;
      case "tbsp": return `${formatNumber(value * 15)} ml ${rest}`;
      case "cup": return `${formatNumber(value * 240)} ml ${rest}`;
      case "l": return `${formatNumber(value * 1000)} ml ${rest}`;
      default: return measure;
    }
  }

  return measure;
}

// -----------------------------
// DROPDOWN POPULATION
// -----------------------------
function populateSelect(selectEl, items) {
  selectEl.innerHTML = `<option value="">-- Any --</option>`;
  items.forEach(item => {
    const value = item.strCategory || item.strArea || item.strIngredient;
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    selectEl.appendChild(opt);
  });
}

async function loadFilters() {
  try {
    const [catRes, areaRes, ingRes] = await Promise.all([
      fetch("https://www.themealdb.com/api/json/v1/1/list.php?c=list"),
      fetch("https://www.themealdb.com/api/json/v1/1/list.php?a=list"),
      fetch("https://www.themealdb.com/api/json/v1/1/list.php?i=list")
    ]);
    const [catData, areaData, ingData] = await Promise.all([
      catRes.json(),
      areaRes.json(),
      ingRes.json()
    ]);
    populateSelect(categorySelect, catData.meals);
    populateSelect(areaSelect, areaData.meals);
    populateSelect(ingredientSelect, ingData.meals);
  } catch (err) {
    console.error("Error loading filters:", err);
  }
}

// -----------------------------
// LOAD RANDOM MEALS
// -----------------------------
async function loadRandomMeals(count = 12) {
  mealDetailsEl.style.display = "none";
  document.querySelector(".search").style.display = "flex";
  document.querySelector(".filters").style.display = "flex";
  resultsEl.style.display = "flex";

  resultsEl.innerHTML = "Loading meals...";
  resultsInfoEl.textContent = "";
  isGlobalMode = false;

  try {
    const meals = [];
    while (meals.length < count) {
      const res = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
      const data = await res.json();
      meals.push(...data.meals);
    }

    initialMeals = meals.slice(0, count);
    baseMeals = initialMeals;
    allMeals = baseMeals;

    displayMeals(allMeals);
    updateResultsInfo();
  } catch (err) {
    console.error("Error loading meals:", err);
    resultsEl.innerHTML = "Failed to load meals.";
    resultsInfoEl.textContent = "";
  }
}

// -----------------------------
// UPDATE RESULTS INFO
// -----------------------------
function updateResultsInfo() {
  if (resultsEl.style.display === "none") {
    resultsInfoEl.textContent = "";
    return;
  }

  if (!allMeals || allMeals.length === 0) {
    resultsInfoEl.textContent = "";
    return;
  }

  resultsInfoEl.textContent = !isGlobalMode
    ? "Showing random recipes for inspiration."
    : `Showing ${allMeals.length} recipes.`;
}

// -----------------------------
// FULL DATABASE SEARCH
// -----------------------------
async function searchMealsGlobal() {
  const query = searchInput.value.trim();
  if (!query) return;

  resultsEl.innerHTML = "Searching full database...";
  mealDetailsEl.innerHTML = "";
  mealDetailsEl.style.display = "none";
  document.querySelector(".search").style.display = "flex";
  document.querySelector(".filters").style.display = "flex";
  resultsEl.style.display = "flex";

  isGlobalMode = true;

  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
    const data = await res.json();
    baseMeals = data.meals || [];
    allMeals = baseMeals;
    updateResultsInfo();
    displayMeals(allMeals);
  } catch (err) {
    console.error("Search error:", err);
    resultsEl.innerHTML = "Search failed.";
  }
}

// -----------------------------
// LOAD FILTER RESULTS
// -----------------------------
async function loadByFilter(type, value) {
  if (!value) return;

  resultsEl.innerHTML = "Loading filtered results...";
  mealDetailsEl.innerHTML = "";
  mealDetailsEl.style.display = "none";
  document.querySelector(".search").style.display = "flex";
  document.querySelector(".filters").style.display = "flex";
  resultsEl.style.display = "flex";

  isGlobalMode = true;

  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?${type}=${value}`);
    const data = await res.json();

    if (!data.meals) {
      baseMeals = [];
      allMeals = [];
      updateResultsInfo();
      displayMeals(allMeals);
      return;
    }

    const fullMeals = await Promise.all(
      data.meals.map(async meal => {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);
        const data = await res.json();
        return data.meals[0];
      })
    );

    baseMeals = fullMeals;
    allMeals = baseMeals;
    updateResultsInfo();
    displayMeals(allMeals);
  } catch (err) {
    console.error("Filter load error:", err);
    resultsEl.innerHTML = "Failed to load filtered meals.";
  }
}

// -----------------------------
// DISPLAY MEALS GRID
// -----------------------------
function displayMeals(meals) {
  resultsEl.innerHTML = "";
  if (!meals.length) {
    resultsEl.innerHTML = "<p class='empty-state'>No meals found.</p>";
    return;
  }

  meals.forEach(meal => {
    const card = document.createElement("div");
    card.className = "meal-card";
    card.innerHTML = `
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
      <h3>${meal.strMeal}</h3>
    `;
    card.addEventListener("click", () => {
      window.location.hash = `#meal=${meal.idMeal}`;
    });
    resultsEl.appendChild(card);
  });
}

// -----------------------------
// SHOW FULL PAGE MEAL
// -----------------------------
async function showMealDetails(id) {
  document.querySelector(".search").style.display = "none";
  document.querySelector(".filters").style.display = "none";
  resultsEl.style.display = "none";

  mealDetailsEl.style.display = "block";
  mealDetailsEl.innerHTML = "Loading...";
  window.scrollTo({ top: 0, behavior: "smooth" });

  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    const data = await res.json();
    const meal = data.meals[0];

    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      let meas = meal[`strMeasure${i}`];
      if (ing && ing.trim()) {
        meas = convertMeasurement(meas); // <-- conversion applied here
        ingredients.push(`${meas} ${ing}`);
      }
    }

    mealDetailsEl.innerHTML = `
      <button class="close-btn" id="closeMealBtn">← Back</button>
      <h2>${meal.strMeal}</h2>
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
      <h3>Ingredients</h3>
      <ul>${ingredients.map(i => `<li>${i}</li>`).join("")}</ul>

      <h3>Instructions</h3>
      <ol class="instructions">
        ${(() => {
          const lines = meal.strInstructions
            .split(/\r?\n/)
            .map(l => l.trim())
            .filter(l => l && !/^serves\s*\d+/i.test(l));

          const steps = [];
          let inNotes = false;
          for (let line of lines) {
            if (/^notes/i.test(line)) { inNotes = true; continue; }
            if (!inNotes) {
              const cleanLine = line.replace(/^(step\s*\d+[\.\)]?\s*|\d+[\.\)]?\s*|[-*]\s*)/i, '').trim();
              if (cleanLine) steps.push(cleanLine);
            }
          }
          return steps.map(s => `<li>${s}</li>`).join('');
        })()}
      </ol>

      ${(() => {
        const lines = meal.strInstructions.split(/\r?\n/).map(l => l.trim()).filter(l => l);
        const notesStart = lines.findIndex(l => /^notes/i.test(l));
        if (notesStart === -1) return '';
        const notesLines = lines.slice(notesStart + 1);
        if (!notesLines.length) return '';
        return `<h3>Notes</h3><p class="notes">${notesLines.join('<br>')}</p>`;
      })()}
    `;

    document.getElementById("closeMealBtn").addEventListener("click", () => {
      window.location.hash = "";
    });
  } catch (err) {
    console.error("Error loading meal:", err);
    mealDetailsEl.innerHTML = "Failed to load meal.";
  }
}

// -----------------------------
// RESET FILTERS
// -----------------------------
function resetFilters() {
  searchInput.value = "";
  categorySelect.value = "";
  areaSelect.value = "";
  ingredientSelect.value = "";
  mealDetailsEl.innerHTML = "";
  mealDetailsEl.style.display = "none";

  document.querySelector(".search").style.display = "flex";
  document.querySelector(".filters").style.display = "flex";
  resultsEl.style.display = "flex";

  isGlobalMode = false;
  allMeals = initialMeals;
  baseMeals = initialMeals;
  updateResultsInfo();
  displayMeals(allMeals);
}

// -----------------------------
// HASH ROUTING
// -----------------------------
window.addEventListener("hashchange", handleHashChange);
window.addEventListener("load", handleHashChange);

function handleHashChange() {
  const hash = window.location.hash;

  if (hash.startsWith("#meal=")) {
    const mealId = hash.replace("#meal=", "");
    showMealDetails(mealId);
    resultsInfoEl.textContent = "";
  } else {
    document.querySelector(".search").style.display = "flex";
    document.querySelector(".filters").style.display = "flex";
    resultsEl.style.display = "flex";
    mealDetailsEl.style.display = "none";

    resultsInfoEl.textContent = !isGlobalMode
      ? "Showing random recipes for inspiration."
      : `Showing ${allMeals.length} recipes.`;

    if (!isGlobalMode) displayMeals(initialMeals);
    else displayMeals(allMeals);
  }
}

// -----------------------------
// EVENT LISTENERS
// -----------------------------
searchBtn.addEventListener("click", searchMealsGlobal);
searchInput.addEventListener("keydown", e => { if (e.key === "Enter") searchMealsGlobal(); });
categorySelect.addEventListener("change", e => loadByFilter("c", e.target.value));
areaSelect.addEventListener("change", e => loadByFilter("a", e.target.value));
ingredientSelect.addEventListener("change", e => loadByFilter("i", e.target.value));
randomBtn.addEventListener("click", () => loadRandomMeals(defaultCount));
resetBtn.addEventListener("click", resetFilters);

// -----------------------------
// INIT
// -----------------------------
loadFilters();
loadRandomMeals(defaultCount);
