class UsageRenderer {
  constructor() {
    this.currentPeriod = 'month';
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadInitialData();
  }

  setupEventListeners() {

    const refreshBtn = document.getElementById('refresh-btn');
    refreshBtn?.addEventListener('click', () => this.refreshData());


    const periodButtons = document.querySelectorAll('.period-btn');
    periodButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.setPeriod(e.target.dataset.period));
    });


    window.electronAPI.onUpdateUsage((usage) => {
      this.renderUsageData(usage);
    });
  }

  async loadInitialData() {
    try {
      const initialUsage = await window.electronAPI.getInitialUsage();
      this.renderUsageData(initialUsage);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      this.showError('Failed to load initial usage data');
    }
  }

  setPeriod(period) {
    if (this.currentPeriod === period) return;

    this.currentPeriod = period;


    document.querySelectorAll('.period-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.period === period);
    });


    this.showLoading('Loading usage data...');


    window.electronAPI.setPeriod(period);
  }

  refreshData() {
    this.showLoading('Refreshing usage data...');
    window.electronAPI.refreshUsage();
  }

  showLoading(message = 'Loading usage data...') {
    const content = document.getElementById('content');
    content.innerHTML = `
            <div class="loading">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px; animation: spin 1s linear infinite;">
                    <circle cx="12" cy="12" r="10" fill="#ff6b35"/>
                    <text x="12" y="16" font-family="Arial" font-size="10" font-weight="bold" text-anchor="middle" fill="white">C</text>
                </svg>
                <div>${message}</div>
            </div>
        `;
  }

  showError(message) {
    const content = document.getElementById('content');
    content.innerHTML = `
            <div class="error">
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
  }

  renderUsageData(usage) {
    const content = document.getElementById('content');

    if (!usage) {
      content.innerHTML = `
                <div class="no-data">
                    <h3>No Data Available</h3>
                    <p>Waiting for usage data...</p>
                </div>
            `;
      return;
    }

    if (usage.error) {
      this.showError(usage.error);
      return;
    }

    const summaryHtml = this.renderSummaryCards(usage);
    const tableHtml = this.renderUsageTable(usage);

    content.innerHTML = summaryHtml + tableHtml;
  }

  renderSummaryCards(usage) {
    const burnRateHtml = usage.burnRate?.costPerHour ? `
            <div class="burn-rate">
                🔥 Current burn rate: $${this.formatCurrency(usage.burnRate.costPerHour)}/hour
                ${usage.projection ? ` | Projected total: $${this.formatCurrency(usage.projection.totalCost)}` : ''}
            </div>
        ` : '';

    return `
            <div class="summary-cards">
                <div class="summary-card">
                    <h3>Total Cost</h3>
                    <div class="value">$${this.formatCurrency(usage.total_cost)}</div>
                    <div class="subvalue">${usage.days || 0} blocks</div>
                </div>
                <div class="summary-card">
                    <h3>Input Tokens</h3>
                    <div class="value">${this.formatTokens(usage.total_input_tokens)}</div>
                </div>
                <div class="summary-card">
                    <h3>Output Tokens</h3>
                    <div class="value">${this.formatTokens(usage.total_output_tokens)}</div>
                </div>
                <div class="summary-card">
                    <h3>Cache Tokens</h3>
                    <div class="value">${this.formatTokens((usage.total_cache_creation || 0) + (usage.total_cache_read || 0))}</div>
                    <div class="subvalue">${this.formatTokens(usage.total_cache_creation || 0)} create + ${this.formatTokens(usage.total_cache_read || 0)} read</div>
                </div>
            </div>
            ${burnRateHtml}
        `;
  }

  renderUsageTable(usage) {
    if (!usage.blocks || usage.blocks.length === 0) {
      return '<div class="no-data"><p>No usage blocks found for the selected period.</p></div>';
    }

    const rows = usage.blocks.map(block => `
            <tr>
                <td class="date-cell">${this.formatDate(block.startTime)}</td>
                <td class="tokens-cell">${this.formatTokens(block.tokenCounts?.inputTokens || 0)}</td>
                <td class="tokens-cell">${this.formatTokens(block.tokenCounts?.outputTokens || 0)}</td>
                <td class="tokens-cell">${this.formatTokens(block.tokenCounts?.cacheCreationInputTokens || 0)}</td>
                <td class="tokens-cell">${this.formatTokens(block.tokenCounts?.cacheReadInputTokens || 0)}</td>
                <td class="tokens-cell">${this.formatTokens((block.tokenCounts?.inputTokens || 0) + (block.tokenCounts?.outputTokens || 0))}</td>
                <td class="cost-cell">$${this.formatCurrency(block.costUSD || 0)}</td>
                <td>${(block.models || []).map(m => `<span class="model-tag">${m}</span>`).join(' ')}</td>
            </tr>
        `).join('');

    return `
            <div class="table-container">
                <div class="table-header">Usage Blocks (${usage.blocks.length} total)</div>
                <table class="usage-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Input</th>
                            <th>Output</th>
                            <th>Cache Create</th>
                            <th>Cache Read</th>
                            <th>Total Tokens</th>
                            <th>Cost (USD)</th>
                            <th>Models</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
  }

  formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return '0.00';
    return amount.toFixed(2);
  }

  formatTokens(tokens) {
    if (typeof tokens !== 'number' || isNaN(tokens)) return '0';
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toLocaleString();
  }

  formatDate(dateStr) {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Invalid Date';

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }
}


document.addEventListener('DOMContentLoaded', () => {
  new UsageRenderer();
});
