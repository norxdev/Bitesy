// -----------------------------
// GLOBAL STATE
// -----------------------------
let allMeals = [];
let baseMeals = [];
let initialMeals = [];
let isGlobalMode = false;
const defaultCount = 12;
let measurementType = "metric"; // revert to original default

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

// -----------------------------
// LOAD FILTER OPTIONS
// -----------------------------
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
  if (resultsEl.style.display === "none" || !allMeals) return;
  if (!allMeals.length) { resultsInfoEl.textContent = ""; return; }
  resultsInfoEl.textContent = !isGlobalMode
    ? "Showing random recipes for inspiration."
    : `Showing ${allMeals.length} recipes.`;
}

// -----------------------------
// CONVERT MEASUREMENT
// -----------------------------
function convertMeasurement(measure) {
  if (!measure) return "";

  let m = measure.toLowerCase().trim();
  const parseNumber = str => str.includes("/") ? parseFloat(str.split("/")[0])/parseFloat(str.split("/")[1]) : parseFloat(str);
  const match = m.match(/^([\d.\/]+)\s*([a-z]*)/);
  if (!match) return measure;

  const value = parseNumber(match[1]);
  const unit = match[2];

  if (measurementType === "imperial") {
    switch (unit) {
      case "g": {
        const oz = +(value/28).toFixed(2);
        return oz >= 16 ? `${Math.floor(oz/16)} lb ${+(oz%16).toFixed(2)} oz` : `${oz} oz`;
      }
      case "kg": {
        const oz = +(value*35.274).toFixed(2);
        return oz >= 16 ? `${Math.floor(oz/16)} lb ${+(oz%16).toFixed(2)} oz` : `${oz} oz`;
      }
      case "ml": return `${+(value/240).toFixed(2)} cup`;
      case "l": return `${+(value*4.167).toFixed(2)} cup`;
      case "tsp": return `${value} tsp`;
      case "tbsp": return `${value} tbsp`;
      case "cup": return `${value} cup`;
      case "lb": return `${value} lb`;
      default: return measure;
    }
  }

  if (measurementType === "metric") {
    switch (unit) {
      case "oz": return `${+(value*28).toFixed(0)} g`;
      case "lb": return `${+(value*454).toFixed(0)} g`;
      case "tsp": return `${+(value*5).toFixed(0)} ml`;
      case "tbsp": return `${+(value*15).toFixed(0)} ml`;
      case "cup": return `${+(value*240).toFixed(0)} ml`;
      case "l": return `${+(value*1000).toFixed(0)} ml`;
      default: return measure;
    }
  }

  return measure;
}

// -----------------------------
// SEARCH FULL DATABASE
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
    if (!data.meals) { baseMeals=[]; allMeals=[]; updateResultsInfo(); displayMeals(allMeals); return; }

    const fullMeals = await Promise.all(data.meals.map(async meal => {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);
      const data = await res.json();
      return data.meals[0];
    }));

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
  if (!meals.length) { resultsEl.innerHTML = "<p class='empty-state'>No meals found.</p>"; return; }

  meals.forEach(meal => {
    const card = document.createElement("div");
    card.className = "meal-card";
    card.innerHTML = `<img src="${meal.strMealThumb}" alt="${meal.strMeal}"><h3>${meal.strMeal}</h3>`;
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
        meas = convertMeasurement(meas);
        ingredients.push(`${meas} ${ing}`);
      }
    }

    const steps = meal.strInstructions
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l && !/^serves\s*\d+/i.test(l) && !/^notes/i.test(l))
      .map(s => s.replace(/^(step\s*\d+[\.\)]?\s*|\d+[\.\)]?\s*|[-*]\s*)/i,'').trim());

    const notesStart = meal.strInstructions.split(/\r?\n/).findIndex(l => /^notes/i.test(l));
    const notesLines = notesStart > -1 ? meal.strInstructions.split(/\r?\n/).slice(notesStart+1).filter(l => l.trim()) : [];

    mealDetailsEl.innerHTML = `
      <button class="close-btn" id="closeMealBtn">← Back</button>
      <h2>${meal.strMeal}</h2>
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
      <h3>Ingredients</h3>
      <ul>${ingredients.map(i=>`<li>${i}</li>`).join('')}</ul>
      <h3>Instructions</h3>
      <ol class="instructions">${steps.map(s=>`<li>${s}</li>`).join('')}</ol>
      ${notesLines.length ? `<h3>Notes</h3><p class="notes">${notesLines.join('<br>')}</p>` : ''}
    `;

    document.getElementById("closeMealBtn").addEventListener("click", ()=>window.location.hash="");
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
    if (!isGlobalMode) displayMeals(initialMeals);
    else displayMeals(allMeals);
    updateResultsInfo();
  }
}

// -----------------------------
// EVENT LISTENERS
// -----------------------------
searchBtn.addEventListener("click", searchMealsGlobal);
searchInput.addEventListener("keydown", e => { if(e.key==="Enter") searchMealsGlobal(); });
categorySelect.addEventListener("change", e=>loadByFilter("c",e.target.value));
areaSelect.addEventListener("change", e=>loadByFilter("a",e.target.value));
ingredientSelect.addEventListener("change", e=>loadByFilter("i",e.target.value));
randomBtn.addEventListener("click", ()=>loadRandomMeals(defaultCount));
resetBtn.addEventListener("click", resetFilters);

// -----------------------------
// INIT
// -----------------------------
loadFilters();
loadRandomMeals(defaultCount);
