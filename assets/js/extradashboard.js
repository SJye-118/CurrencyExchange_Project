const API_KEY = "fc4d8c669d-af277e8402-t0rqs9"; // Replace with your actual key

// Fetch exchange rate from FastForex API
async function fetchExchangeRate(from, to, elementId) {
    try {
        const res = await fetch(`https://api.fastforex.io/fetch-one?from=${from}&to=${to}&api_key=${API_KEY}`);
        const data = await res.json();
        if (data && data.result && data.result[to]) {
            document.getElementById(elementId).textContent = data.result[to].toFixed(2);
        } else {
            document.getElementById(elementId).textContent = "Error";
        }
    } catch (error) {
        console.error("Error fetching exchange rate:", error);
        document.getElementById(elementId).textContent = "Error";
    }
}

async function fetchHistoricalData() {
    let labels = [];
    let values = [];

    // Example: last 7 days
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split("T")[0];

        try {
            const res = await fetch(`https://api.fastforex.io/historical?date=${dateString}&from=USD&to=MYR&api_key=${API_KEY}`);
            const data = await res.json();
            labels.push(dateString);
            values.push(data.results.MYR);
        } catch (error) {
            console.error("Error fetching historical data:", error);
        }
    }

    return { labels, values };
}

// ----------- BAR CHART (Commodity Prices) -----------
async function fetchCommodityPrices() {
    try {
        // Example using FastForex free endpoint for multiple commodities (simulate here)
        return {
            labels: ["Gold", "Silver", "Oil", "Copper", "Wheat"],
            prices: [1920, 24, 85, 3.6, 240]
        };
    } catch (error) {
        console.error("Error fetching commodity prices:", error);
        return { labels: [], prices: [] };
    }
}

// ----------- INITIALIZE CHARTS -----------
async function initCharts() {
    // Line Chart
    const historicalData = await fetchHistoricalData();
    const lineCtx = document.getElementById("lineChart").getContext("2d");
    new Chart(lineCtx, {
        type: "line",
        data: {
            labels: historicalData.labels,
            datasets: [{
                label: "USD to MYR",
                data: historicalData.values,
                borderColor: "#007bff",
                backgroundColor: "rgba(0, 123, 255, 0.2)",
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true } }
        }
    });

    // Bar Chart
    const commodityData = await fetchCommodityPrices();
    const barCtx = document.getElementById("barChart").getContext("2d");
    new Chart(barCtx, {
        type: "bar",
        data: {
            labels: commodityData.labels,
            datasets: [{
                label: "Price (USD)",
                data: commodityData.prices,
                backgroundColor: ["#ff6384", "#36a2eb", "#ffce56", "#4bc0c0", "#9966ff"]
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });
}

// Simulate GDP & Inflation updates (random values)
function updateFakeData() {
    const gdpGrowth = (Math.random() * 5).toFixed(2) + "%";
    const inflationRate = (Math.random() * 3).toFixed(2) + "%";
    document.getElementById("gdp").textContent = gdpGrowth;
    document.getElementById("inflation").textContent = inflationRate;
}

// Update all KPIs every 5 seconds
function updateDashboard() {
    updateFakeData();
    fetchExchangeRate("USD", "MYR", "usd-myr");
    fetchExchangeRate("EUR", "MYR", "eur-myr");
}

// Run every 5 seconds
updateDashboard();
setInterval(updateDashboard, 5000);

initCharts();
setInterval(initCharts, 3600000);