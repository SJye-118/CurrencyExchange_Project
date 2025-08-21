
// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for Chart.js to load
    setTimeout(() => {
        window.currencyExchangeApp = new CurrencyExchange();
    }, 500);
});

// Also initialize when Chart.js loads (fallback)
window.addEventListener('load', () => {
    if (typeof Chart !== 'undefined' && !window.currencyExchangeApp) {
        window.currencyExchangeApp = new CurrencyExchange();
    }
});

document.addEventListener('DOMContentLoaded', function() {
      // Wait for the main CurrencyExchange class to be loaded
      setTimeout(() => {
        // Ensure swap button works
        const swapBtn = document.getElementById('swapBtn');
        const fromCurrency = document.getElementById('fromCurrency');
        const toCurrency = document.getElementById('toCurrency');
        const fromAmount = document.getElementById('fromAmount');
        
        if (swapBtn) {
          swapBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Add visual feedback
            swapBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
              swapBtn.style.transform = 'scale(1)';
            }, 150);
            
            // Perform the swap
            const tempValue = fromCurrency.value;
            fromCurrency.value = toCurrency.value;
            toCurrency.value = tempValue;
            
            // Trigger conversion after swap
            if (window.currencyExchangeApp && typeof window.currencyExchangeApp.convertCurrency === 'function') {
              window.currencyExchangeApp.convertCurrency();
            }
            
            // Alternative: trigger change events
            fromCurrency.dispatchEvent(new Event('change'));
            toCurrency.dispatchEvent(new Event('change'));
          });
        }
        
        // Auto-convert on page load if amount is set
        if (fromAmount && fromAmount.value && window.currencyExchangeApp) {
          window.currencyExchangeApp.convertCurrency();
        }
        
        // Enhanced input handling
        if (fromAmount) {
          fromAmount.addEventListener('input', function() {
            if (this.value && this.value > 0) {
              if (window.currencyExchangeApp) {
                window.currencyExchangeApp.convertCurrency();
              }
            } else {
              // Show default message when no amount
              document.getElementById('result').innerHTML = `
                <div class="default-result">
                  Enter an amount to see the conversion result
                </div>
              `;
            }
          });
        }
        
        // Auto-convert when currencies change
        [fromCurrency, toCurrency].forEach(select => {
          if (select) {
            select.addEventListener('change', function() {
              if (fromAmount.value && fromAmount.value > 0 && window.currencyExchangeApp) {
                window.currencyExchangeApp.convertCurrency();
              }
            });
          }
        });
      }, 1000);
    });
    
class CurrencyExchange {
    constructor() {
        this.baseUrl = 'https://api.frankfurter.app';
        this.chart = null;
        this.currentChartType = 'line';
        this.currentPeriod = 7;
        this.init();
    }

    init() {
        this.loadAvailableCurrencies();
        this.loadLatestRates();
        this.bindEvents();
        this.initializeChartControls();
        // Auto-load chart after a short delay to ensure everything is initialized
        setTimeout(() => {
            this.updateChart();
        }, 1500);
    }

    bindEvents() {
        document.getElementById('convertBtn').addEventListener('click', () => this.convertCurrency());
        document.getElementById('swapBtn').addEventListener('click', () => this.swapCurrencies());
        document.getElementById('fromAmount').addEventListener('input', () => this.convertCurrency());
        document.getElementById('fromCurrency').addEventListener('change', () => this.convertCurrency());
        document.getElementById('toCurrency').addEventListener('change', () => this.convertCurrency());
    }

    initializeChartControls() {
        // Chart type buttons
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentChartType = e.target.dataset.type;
                this.updateChart(); // Auto-update on chart type change
            });
        });

        // Period buttons
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentPeriod = parseInt(e.target.dataset.period);
                this.updateChart(); // Auto-update on period change
            });
        });

        // Currency dropdowns
        document.getElementById('chartBaseCurrency').addEventListener('change', () => this.updateChart());
        document.getElementById('chartTargetCurrency').addEventListener('change', () => this.updateChart());
    }

    swapCurrencies() {
        const fromCurrency = document.getElementById('fromCurrency');
        const toCurrency = document.getElementById('toCurrency');
        
        const tempValue = fromCurrency.value;
        fromCurrency.value = toCurrency.value;
        toCurrency.value = tempValue;
        
        // Trigger conversion after swap
        this.convertCurrency();
    }

    async loadAvailableCurrencies() {
        try {
            const response = await fetch(`${this.baseUrl}/currencies`);
            const currencies = await response.json();
            this.populateCurrencySelects(currencies);
        } catch (error) {
            console.error('Error loading currencies:', error);
        }
    }

    populateCurrencySelects(currencies) {
        const fromSelect = document.getElementById('fromCurrency');
        const toSelect = document.getElementById('toCurrency');
        const chartBaseSelect = document.getElementById('chartBaseCurrency');
        const chartTargetSelect = document.getElementById('chartTargetCurrency');
        
        // Clear existing options
        [fromSelect, toSelect, chartBaseSelect, chartTargetSelect].forEach(select => {
            select.innerHTML = '';
        });

        // Add currency options
        Object.entries(currencies).forEach(([code, name]) => {
            [fromSelect, toSelect, chartBaseSelect, chartTargetSelect].forEach(select => {
                const option = new Option(`${code} - ${name}`, code);
                select.add(option);
            });
        });

        // Set default values
        fromSelect.value = 'MYR';
        toSelect.value = 'EUR';
        chartBaseSelect.value = 'MYR';
        chartTargetSelect.value = 'USD';
    }

    async loadLatestRates() {
        try {
            const response = await fetch(`${this.baseUrl}/latest?from=MYR`);
            const data = await response.json();
            this.displayRates(data);
        } catch (error) {
            this.displayError('Failed to load exchange rates');
        }
    }

    displayRates(data) {
        const container = document.getElementById('ratesContainer');
        const rates = data.rates;
        
        if (!rates) {
            container.innerHTML = '<div class="error">No rates available</div>';
            return;
        }

        const ratesHTML = Object.entries(rates)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([currency, rate]) => `
                <div class="rate-card">
                    <div class="currency-code">${currency}</div>
                    <div class="rate-value">${rate.toFixed(4)}</div>
                </div>
            `).join('');

        container.innerHTML = `<div class="rates-grid">${ratesHTML}</div>`;
        
        document.getElementById('lastUpdated').textContent = 
            `Last updated: ${new Date(data.date).toLocaleDateString()}`;
    }

    displayError(message) {
        document.getElementById('result').innerHTML = `
            <div class="alert alert-danger">${message}</div>
        `;
    }

    async convertCurrency() {
        const amount = parseFloat(document.getElementById('fromAmount').value);
        const fromCurrency = document.getElementById('fromCurrency').value;
        const toCurrency = document.getElementById('toCurrency').value;

        if (!amount || amount <= 0) {
            document.getElementById('toAmount').value = '';
            document.getElementById('result').innerHTML = `
                <div class="default-result">
                    Enter an amount to see the conversion result
                </div>
            `;
            return;
        }

        if (fromCurrency === toCurrency) {
            document.getElementById('toAmount').value = amount.toFixed(2);
            this.displayConversionResult(amount, fromCurrency, amount, toCurrency, 1);
            return;
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/latest?from=${fromCurrency}&to=${toCurrency}`
            );
            const data = await response.json();
            
            if (data.rates && data.rates[toCurrency]) {
                const convertedAmount = amount * data.rates[toCurrency];
                document.getElementById('toAmount').value = convertedAmount.toFixed(2);
                
                this.displayConversionResult(amount, fromCurrency, convertedAmount, toCurrency, data.rates[toCurrency]);
            }
        } catch (error) {
            this.displayError('Conversion failed. Please try again.');
        }
    }

    displayConversionResult(fromAmount, fromCurrency, toAmount, toCurrency, rate) {
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = `
            <div class="result-card">
                <div class="result-amount">${toAmount.toFixed(2)} ${toCurrency}</div>
                <div class="result-info">
                    ${fromAmount} ${fromCurrency} = ${toAmount.toFixed(2)} ${toCurrency}<br>
                    Rate: 1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}
                </div>
            </div>
        `;
        resultDiv.style.display = 'block';
    }

    async updateChart() {
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            this.displayChartError('Chart library is loading... Please wait a moment and try again.');
            // Try to reload Chart.js
            setTimeout(() => {
                if (typeof Chart !== 'undefined') {
                    this.updateChart();
                }
            }, 1500);
            return;
        }

        const baseCurrency = document.getElementById('chartBaseCurrency').value;
        const targetCurrency = document.getElementById('chartTargetCurrency').value;
        
        if (baseCurrency === targetCurrency) {
            this.displayChartError('Please select different currencies for comparison');
            return;
        }

        this.showChartLoading();

        try {
            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - this.currentPeriod);

            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];

            // Use the correct Frankfurter API format for historical data
            const url = `${this.baseUrl}/${startDateStr}..${endDateStr}?from=${baseCurrency}&to=${targetCurrency}`;
            console.log('Fetching from URL:', url);

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Historical data received:', data);

            if (!data.rates || Object.keys(data.rates).length === 0) {
                throw new Error('No historical data available for this period');
            }

            this.renderChart(data, baseCurrency, targetCurrency);

        } catch (error) {
            console.error('Chart update error:', error);
            
            // More specific error messages
            let errorMessage = 'Failed to load historical data. ';
            if (error.message.includes('404')) {
                errorMessage += 'Historical data not available for this currency pair.';
            } else if (error.message.includes('No historical data')) {
                errorMessage += 'No data available for the selected time period.';
            } else {
                errorMessage += 'Please check your internet connection and try again.';
            }
            
            this.displayChartError(errorMessage);
        }
    }

    showChartLoading() {
        const container = document.getElementById('chartContainer');
        container.innerHTML = '<div class="chart-loading">📈 Loading historical data...</div>';
    }

    displayChartError(message) {
        const container = document.getElementById('chartContainer');
        container.innerHTML = `<div class="chart-loading" style="color: #c53030; padding: 40px; text-align: center; font-size: 1.1rem;">⚠️ ${message}</div>`;
    }

    renderChart(data, baseCurrency, targetCurrency) {
        const container = document.getElementById('chartContainer');
        container.innerHTML = '<canvas id="exchangeChart"></canvas>';

        const ctx = document.getElementById('exchangeChart').getContext('2d');

        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }

        // Process the historical data
        const dates = Object.keys(data.rates).sort();
        const rates = dates.map(date => {
            const dayRates = data.rates[date];
            return dayRates[targetCurrency] || 0;
        });

        // Filter out any zero rates
        const validData = dates.map((date, index) => ({
            date,
            rate: rates[index]
        })).filter(item => item.rate > 0);

        if (validData.length === 0) {
            this.displayChartError('No valid data points found for this currency pair and time period.');
            return;
        }

        let chartData, config;

        if (this.currentChartType === 'candlestick') {
            // Create candlestick data
            const candlestickData = this.createCandlestickData(data, targetCurrency);
            
            chartData = {
                datasets: [{
                    label: `${baseCurrency} to ${targetCurrency}`,
                    data: candlestickData,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                }]
            };

            config = {
                type: 'candlestick',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `${baseCurrency} to ${targetCurrency} Exchange Rate - Candlestick (${this.currentPeriod} days)`,
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'day'
                            },
                            title: {
                                display: true,
                                text: 'Date'
                            }
                        },
                        y: {
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: `Rate (${targetCurrency})`
                            }
                        }
                    }
                }
            };
        } else {
            // Regular line or bar chart
            chartData = {
                labels: validData.map(item => new Date(item.date).toLocaleDateString()),
                datasets: [{
                    label: `${baseCurrency} to ${targetCurrency}`,
                    data: validData.map(item => item.rate),
                    borderColor: '#667eea',
                    backgroundColor: this.currentChartType === 'line' 
                        ? 'rgba(102, 126, 234, 0.1)'
                        : 'rgba(102, 126, 234, 0.8)',
                    borderWidth: 3,
                    fill: this.currentChartType === 'line',
                    tension: 0.4
                }]
            };

            config = {
                type: this.currentChartType,
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `${baseCurrency} to ${targetCurrency} Exchange Rate (${this.currentPeriod} days)`,
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: `Rate (${targetCurrency})`
                            },
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Date'
                            },
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            }
                        }
                    },
                    elements: {
                        point: {
                            radius: this.currentChartType === 'line' ? 4 : 0,
                            hoverRadius: 6
                        }
                    }
                }
            };
        }

        this.chart = new Chart(ctx, config);

        // Add chart statistics
        this.displayChartStats(validData.map(item => item.rate), baseCurrency, targetCurrency);
    }

    displayChartStats(rates, baseCurrency, targetCurrency) {
        const minRate = Math.min(...rates);
        const maxRate = Math.max(...rates);
        const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;
        const currentRate = rates[rates.length - 1];
        const previousRate = rates[0];
        const change = ((currentRate - previousRate) / previousRate * 100);

        const statsContainer = document.createElement('div');
        statsContainer.style.cssText = `
            margin-top: 20px;
            padding: 20px;
            background: #f8f9ff;
            border-radius: 12px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
            text-align: center;
        `;

        statsContainer.innerHTML = `
            <div>
                <div style="font-size: 0.9rem; color: #666; margin-bottom: 5px;">Current</div>
                <div style="font-size: 1.2rem; font-weight: bold; color: #333;">${currentRate.toFixed(4)}</div>
            </div>
            <div>
                <div style="font-size: 0.9rem; color: #666; margin-bottom: 5px;">Average</div>
                <div style="font-size: 1.2rem; font-weight: bold; color: #333;">${avgRate.toFixed(4)}</div>
            </div>
            <div>
                <div style="font-size: 0.9rem; color: #666; margin-bottom: 5px;">High</div>
                <div style="font-size: 1.2rem; font-weight: bold; color: #27ae60;">${maxRate.toFixed(4)}</div>
            </div>
            <div>
                <div style="font-size: 0.9rem; color: #666; margin-bottom: 5px;">Low</div>
                <div style="font-size: 1.2rem; font-weight: bold; color: #e74c3c;">${minRate.toFixed(4)}</div>
            </div>
            <div>
                <div style="font-size: 0.9rem; color: #666; margin-bottom: 5px;">Change</div>
                <div style="font-size: 1.2rem; font-weight: bold; color: ${change >= 0 ? '#27ae60' : '#e74c3c'};">
                    ${change >= 0 ? '+' : ''}${change.toFixed(2)}%
                </div>
            </div>
        `;

        document.getElementById('chartContainer').appendChild(statsContainer);
    }
}
