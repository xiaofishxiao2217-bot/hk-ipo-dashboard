const state = {
  search: "",
  industry: "all",
  performance: "all",
  sortBy: "listedDateDesc",
  startDate: "",
  endDate: ""
};

const elements = {
  startDate: document.querySelector("#startDate"),
  endDate: document.querySelector("#endDate"),
  industryFilter: document.querySelector("#industryFilter"),
  performanceFilter: document.querySelector("#performanceFilter"),
  searchInput: document.querySelector("#searchInput"),
  sortBy: document.querySelector("#sortBy"),
  resetFilters: document.querySelector("#resetFilters"),
  dataSourceLabel: document.querySelector("#dataSourceLabel"),
  statsGrid: document.querySelector("#statsGrid"),
  tableBody: document.querySelector("#tableBody")
};

const formatCurrency = (value) =>
  Number.isFinite(value) ? `HK$${value.toFixed(2)}` : "--";
const formatPercent = (value) =>
  Number.isFinite(value) ? `${value >= 0 ? "+" : ""}${value.toFixed(1)}%` : "--";
const formatMultiple = (value) => (Number.isFinite(value) ? `${value.toFixed(1)}x` : "--");
const formatDate = (value) =>
  new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));

function getPillClass(value) {
  if (!Number.isFinite(value)) {
    return "neutral";
  }

  return value >= 0 ? "positive" : "negative";
}

function compareNullableNumbers(a, b) {
  const aValid = Number.isFinite(a);
  const bValid = Number.isFinite(b);

  if (aValid && bValid) {
    return b - a;
  }

  if (aValid) {
    return -1;
  }

  if (bValid) {
    return 1;
  }

  return 0;
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "" || value === "N/A" || value === "NaN") {
    return null;
  }

  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDate(value) {
  if (!value) {
    return "";
  }

  return value.replace(/\//g, "-");
}

function decodeText(value) {
  if (!value) {
    return "";
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeRecord(item) {
  const issuePrice = parseNumber(item.issuePrice ?? item.IPOPricing ?? item.Price_Floor);
  const currentPrice = parseNumber(item.currentPrice);
  const cumulativeReturn =
    Number.isFinite(issuePrice) && Number.isFinite(currentPrice) && issuePrice !== 0
      ? ((currentPrice - issuePrice) / issuePrice) * 100
      : null;

  return {
    code: item.code ?? item.Symbol ?? "",
    name: item.name ?? item.ShortName ?? "",
    industry: item.industry ?? item.Industry ?? "未分类",
    listedDate: normalizeDate(item.listedDate ?? item.ListedDate),
    issuePrice,
    currentPrice,
    subscriptionMultiple: parseNumber(item.subscriptionMultiple ?? item.Subscribed),
    fundraisingHKD:
      parseNumber(item.fundraisingHKD) ??
      (Number.isFinite(parseNumber(item.RaiseMoney)) ? parseNumber(item.RaiseMoney) / 10000 : null),
    notes:
      item.notes ??
      decodeText(item.Prospectuses ? `招股期 ${item.Prospectuses}` : item.Use || "真实 IPO 快照"),
    cumulativeReturn,
    priceRange: item.priceRange ?? item.Price ?? "",
    startDate: normalizeDate(item.startDate ?? item.Startdate),
    endDate: normalizeDate(item.endDate ?? item.Enddate),
    firstDayChg: parseNumber(item.firstDayChg ?? item.FirstDayChg),
    grayPriceChg: parseNumber(item.grayPriceChg ?? item.GrayPriceChg)
  };
}

const liveSnapshot = window.iqdiiIpoSnapshot?.records ?? [];
const sourceLabel = liveSnapshot.length
  ? `真实快照 ${window.iqdiiIpoSnapshot.generatedAt || ""}`.trim()
  : "示例数据";

const withDerivedFields = (liveSnapshot.length ? liveSnapshot : ipoData).map((item) => {
  const normalized = normalizeRecord(item);

  return {
    ...normalized
  };
});

function initializeFilters() {
  const industries = [...new Set(withDerivedFields.map((item) => item.industry))];
  elements.industryFilter.innerHTML = [
    '<option value="all">全部行业</option>',
    ...industries.map((industry) => `<option value="${industry}">${industry}</option>`)
  ].join("");

  const listedDates = withDerivedFields.map((item) => item.listedDate).sort();
  elements.startDate.value = listedDates[0];
  elements.endDate.value = listedDates[listedDates.length - 1];
  state.startDate = elements.startDate.value;
  state.endDate = elements.endDate.value;
  elements.dataSourceLabel.textContent = sourceLabel;
}

function matchesFilters(item) {
  const inDateRange =
    (!state.startDate || item.listedDate >= state.startDate) &&
    (!state.endDate || item.listedDate <= state.endDate);
  const inIndustry = state.industry === "all" || item.industry === state.industry;
  const inPerformance =
    state.performance === "all" ||
    (state.performance === "positive" && item.cumulativeReturn >= 0) ||
    (state.performance === "negative" && item.cumulativeReturn < 0);
  const keyword = state.search.trim().toLowerCase();
  const inSearch =
    !keyword ||
    item.name.toLowerCase().includes(keyword) ||
    item.code.toLowerCase().includes(keyword) ||
    item.industry.toLowerCase().includes(keyword);

  return inDateRange && inIndustry && inPerformance && inSearch;
}

function sortItems(items) {
  const sorters = {
    listedDateDesc: (a, b) => b.listedDate.localeCompare(a.listedDate),
    listedDateAsc: (a, b) => a.listedDate.localeCompare(b.listedDate),
    returnDesc: (a, b) => compareNullableNumbers(a.cumulativeReturn, b.cumulativeReturn),
    subscriptionDesc: (a, b) => compareNullableNumbers(a.subscriptionMultiple, b.subscriptionMultiple)
  };

  return [...items].sort(sorters[state.sortBy]);
}

function renderStats(items) {
  const total = items.length;
  const availableReturns = items.filter((item) => Number.isFinite(item.cumulativeReturn));
  const avgReturn = availableReturns.length
    ? availableReturns.reduce((sum, item) => sum + item.cumulativeReturn, 0) / availableReturns.length
    : 0;
  const availableSubscriptions = items.filter((item) => Number.isFinite(item.subscriptionMultiple));
  const avgSubscription = availableSubscriptions.length
    ? availableSubscriptions.reduce((sum, item) => sum + item.subscriptionMultiple, 0) /
      availableSubscriptions.length
    : 0;
  const winners = availableReturns.filter((item) => item.cumulativeReturn >= 0).length;
  const fundraisingItems = items.filter((item) => Number.isFinite(item.fundraisingHKD));
  const totalFundraising = fundraisingItems.length
    ? fundraisingItems.reduce((sum, item) => sum + item.fundraisingHKD, 0)
    : 0;

  const stats = [
    {
      label: "时间范围内上市数",
      value: `${total}`,
      footnote: "按当前筛选条件实时更新"
    },
    {
      label: "平均累计涨跌幅",
      value: availableReturns.length ? formatPercent(avgReturn) : "--",
      footnote: availableReturns.length
        ? `可计算项目 ${availableReturns.length}，上涨 ${winners}`
        : "当前真实源未提供现价"
    },
    {
      label: "平均认购倍数",
      value: availableSubscriptions.length ? formatMultiple(avgSubscription) : "--",
      footnote: "可用来观察发行阶段热度"
    },
    {
      label: "合计募资额",
      value: `HK$${totalFundraising.toFixed(1)}B`,
      footnote: "真实源单位已换算为十亿港元"
    }
  ];

  elements.statsGrid.innerHTML = stats
    .map(
      (stat) => `
        <article class="panel stat-card">
          <p class="stat-label">${stat.label}</p>
          <p class="stat-value">${stat.value}</p>
          <p class="stat-footnote">${stat.footnote}</p>
        </article>
      `
    )
    .join("");
}

function renderTable(items) {
  if (!items.length) {
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="11" class="empty-state">当前筛选条件下没有匹配的 IPO 项目。</td>
      </tr>
    `;
    return;
  }

  elements.tableBody.innerHTML = items
    .map(
      (item) => `
        <tr>
          <td><span class="ticker">${item.code}</span></td>
          <td class="company-cell">
            <strong>${item.name}</strong>
            <small>${item.notes}</small>
          </td>
          <td>${item.industry}</td>
          <td>${formatDate(item.listedDate)}</td>
          <td>${item.priceRange || formatCurrency(item.issuePrice)}</td>
          <td>${formatCurrency(item.currentPrice)}</td>
          <td>
            <span class="pill ${getPillClass(item.cumulativeReturn)}">
              ${formatPercent(item.cumulativeReturn)}
            </span>
          </td>
          <td>${formatMultiple(item.subscriptionMultiple)}</td>
          <td>
            <span class="pill ${getPillClass(item.grayPriceChg)}">
              ${formatPercent(item.grayPriceChg)}
            </span>
          </td>
          <td>
            <span class="pill ${getPillClass(item.firstDayChg)}">
              ${formatPercent(item.firstDayChg)}
            </span>
          </td>
          <td>${Number.isFinite(item.fundraisingHKD) ? `HK$${item.fundraisingHKD.toFixed(1)}B` : "--"}</td>
        </tr>
      `
    )
    .join("");
}

function render() {
  const filtered = withDerivedFields.filter(matchesFilters);
  const sorted = sortItems(filtered);
  renderStats(sorted);
  renderTable(sorted);
}

function bindEvents() {
  elements.startDate.addEventListener("input", (event) => {
    state.startDate = event.target.value;
    render();
  });

  elements.endDate.addEventListener("input", (event) => {
    state.endDate = event.target.value;
    render();
  });

  elements.industryFilter.addEventListener("change", (event) => {
    state.industry = event.target.value;
    render();
  });

  elements.performanceFilter.addEventListener("change", (event) => {
    state.performance = event.target.value;
    render();
  });

  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    render();
  });

  elements.sortBy.addEventListener("change", (event) => {
    state.sortBy = event.target.value;
    render();
  });

  elements.resetFilters.addEventListener("click", () => {
    initializeFilters();
    state.search = "";
    state.industry = "all";
    state.performance = "all";
    state.sortBy = "listedDateDesc";

    elements.searchInput.value = "";
    elements.performanceFilter.value = "all";
    elements.sortBy.value = "listedDateDesc";
    render();
  });
}

initializeFilters();
bindEvents();
render();
