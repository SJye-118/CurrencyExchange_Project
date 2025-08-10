// Fetch currency data from API
async function fetchCurrencyRates() {
    try {
        const res = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=MYR,EUR');
        const data = await res.json();
        
        // USD to MYR
        const usdToMyr = data.rates.MYR.toFixed(2);
        document.getElementById('usd-myr').textContent = usdToMyr;
        document.getElementById('usd-update').textContent = "Updated: " + new Date().toLocaleTimeString();

        // EUR to MYR (via conversion from USD→EUR, then EUR→MYR)
        const usdToEur = data.rates.EUR;
        const eurToMyr = (usdToMyr / usdToEur).toFixed(2);
        document.getElementById('eur-myr').textContent = eurToMyr;
        document.getElementById('eur-update').textContent = "Updated: " + new Date().toLocaleTimeString();

    } catch (error) {
        console.error("Error fetching currency data:", error);
    }
}

// Simulate GDP & Inflation updates
function updateSimulatedData() {
    const gdpGrowth = (Math.random() * 6 - 1).toFixed(2) + "%"; // -1% to +5%
    const inflation = (Math.random() * 4 + 1).toFixed(2) + "%"; // 1% to 5%

    document.getElementById('gdp-growth').textContent = gdpGrowth;
    document.getElementById('inflation-rate').textContent = inflation;

    document.getElementById('gdp-update').textContent = "Updated: " + new Date().toLocaleTimeString();
    document.getElementById('inflation-update').textContent = "Updated: " + new Date().toLocaleTimeString();
}

// Initial load
fetchCurrencyRates();
updateSimulatedData();

// Update every 60 seconds
setInterval(fetchCurrencyRates, 60000);
setInterval(updateSimulatedData, 60000);