const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const randomBtn = document.getElementById("randomBtn");
const resultsEl = document.getElementById("results");
const mealDetailsEl = document.getElementById("mealDetails");

const categorySelect = document.getElementById("categorySelect");
const areaSelect = document.getElementById("areaSelect");
const ingredientSelect = document.getElementById("ingredientSelect");

// Helper to create dropdown options
function populateSelect(selectEl, items) {
  selectEl.innerHTML = `<option value="">-- Select --</option>`;
  items.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.strCategory || item.strArea || item.strIngredient;
    opt.textContent = opt.value;
    selectEl.appendChild(opt);
  });
}

// Fetch dropdown data
async function loadFilters() {
  try {
    const [catRes, areaRes, ingRes] = await Promise.all([
      fetch("https://www.themealdb.com/api/json/v1/1/list.php?c=list"),
      fetch("https://www.themealdb.com/api/json/v1/1/list.php?a=list"),
      fetch("https://www.themealdb.com/api/json/v1/1/list.php?i=list")
    ]);
    const [catData, areaData, ingData] = await Promise.all([catRes.json(), areaRes.json(), ingRes.json()]);
    populateSelect(categorySelect, catData.meals);
    populateSelect(areaSelect, areaData.meals);
    populateSelect(ingredientSelect, ingData.meals);
  } catch (err) {
    console.error("Error loading filters:", err);
  }
}

// Fetch meals by name
async function searchMeals(query) {
  resultsEl.innerHTML = "Loading...";
  mealDetailsEl.innerHTML = "";
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
    const data = await res.json();
    displayMeals(data.meals || []);
  } catch (err) {
    console.error("Error searching meals:", err);
    resultsEl.innerHTML = "Failed to load meals.";
  }
}

// Fetch random meal
async function randomMeal() {
  resultsEl.innerHTML = "Loading...";
  mealDetailsEl.innerHTML = "";
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/random.php`);
    const data = await res.json();
    displayMeals(data.meals);
  } catch (err) {
    console.error("Error fetching random meal:", err);
    resultsEl.innerHTML = "Failed to load meal.";
  }
}

// Display meals grid
function displayMeals(meals) {
  resultsEl.innerHTML = "";
  if (meals.length === 0) {
    resultsEl.innerHTML = "No meals found.";
    return;
  }
  meals.forEach(meal => {
    const card = document.createElement("div");
    card.className = "meal-card";
    card.innerHTML = `
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
      <h3>${meal.strMeal}</h3>
    `;
    card.addEventListener("click", () => showMealDetails(meal.idMeal));
    resultsEl.appendChild(card);
  });
}

// Show meal details
async function showMealDetails(id) {
  mealDetailsEl.innerHTML = "Loading...";
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    const data = await res.json();
    const meal = data.meals[0];
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      const meas = meal[`strMeasure${i}`];
      if (ing) ingredients.push(`${meas} ${ing}`);
    }
    mealDetailsEl.innerHTML = `
      <h2>${meal.strMeal}</h2>
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
      <h3>Ingredients:</h3>
      <ul>${ingredients.map(i=>`<li>${i}</li>`).join("")}</ul>
      <h3>Instructions:</h3>
      <p>${meal.strInstructions}</p>
    `;
  } catch (err) {
    console.error("Error loading meal details:", err);
    mealDetailsEl.innerHTML = "Failed to load meal details.";
  }
}

// Event listeners
searchBtn.addEventListener("click", () => {
  const query = searchInput.value.trim();
  if(query) searchMeals(query);
});

randomBtn.addEventListener("click", randomMeal);

categorySelect.addEventListener("change", () => {
  const val = categorySelect.value;
  if(val) searchMeals(val);
});

areaSelect.addEventListener("change", () => {
  const val = areaSelect.value;
  if(val) searchMeals(val);
});

ingredientSelect.addEventListener("change", () => {
  const val = ingredientSelect.value;
  if(val) searchMeals(val);
});

// Initialize
loadFilters();
