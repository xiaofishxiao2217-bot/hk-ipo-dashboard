const state = {
  search: "",
  industry: "all",
  status: "all",
  rankMode: "default",
  sortBy: "listedDateDesc",
  rowLimit: 20,
  startDate: "",
  endDate: "",
  selectedCode: ""
};

const elements = {
  startDate: document.querySelector("#startDate"),
  endDate: document.querySelector("#endDate"),
  industryFilter: document.querySelector("#industryFilter"),
  searchInput: document.querySelector("#searchInput"),
  rowLimit: document.querySelector("#rowLimit"),
  sortBy: document.querySelector("#sortBy"),
  resetFilters: document.querySelector("#resetFilters"),
  statusTabs: document.querySelector("#statusTabs"),
  rankTabs: document.querySelector("#rankTabs"),
  dataSourceLabel: document.querySelector("#dataSourceLabel"),
  statsGrid: document.querySelector("#statsGrid"),
  tableBody: document.querySelector("#tableBody"),
  detailTitle: document.querySelector("#detailTitle"),
  detailGrid: document.querySelector("#detailGrid"),
  detailUse: document.querySelector("#detailUse")
};

const formatCurrency = (value) =>
  Number.isFinite(value) ? `HK$${value.toFixed(2)}` : "--";
const formatPercent = (value) =>
  Number.isFinite(value) ? `${value >= 0 ? "+" : ""}${value.toFixed(1)}%` : "--";
const formatMultiple = (value) => (Number.isFinite(value) ? `${value.toFixed(1)}x` : "--");
const formatInteger = (value) => (Number.isFinite(value) ? `${Math.round(value).toLocaleString("zh-CN")}` : "--");
const formatBillions = (value) =>
  Number.isFinite(value) ? `HK$${value.toFixed(1)}B` : "--";
const formatBillionsPlain = (value) => (Number.isFinite(value) ? value.toFixed(1) : "--");
const formatTenThousands = (value) => (Number.isFinite(value) ? (value / 10000).toFixed(2) : "--");
const formatPercentPlain = (value) =>
  Number.isFinite(value) ? `${value >= 0 ? "+" : ""}${value.toFixed(2)}%` : "--";
const formatUrl = (value) => (value ? decodeText(value) : "");
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

function percentValue(part, total) {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total === 0) {
    return null;
  }

  return (part / total) * 100;
}

function booleanLabel(value) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return value > 0 ? "是" : "否";
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
  const today = new Date().toISOString().slice(0, 10);
  const issuePrice = parseNumber(item.issuePrice ?? item.IPOPricing ?? item.Price_Floor);
  const currentPrice = parseNumber(item.currentPrice);
  const cumulativeReturn =
    Number.isFinite(issuePrice) && Number.isFinite(currentPrice) && issuePrice !== 0
      ? ((currentPrice - issuePrice) / issuePrice) * 100
      : null;
  const listedDate = normalizeDate(item.listedDate ?? item.ListedDate);
  const startDate = normalizeDate(item.startDate ?? item.Startdate);
  const endDate = normalizeDate(item.endDate ?? item.Enddate);
  let statusCategory = "pending";

  if (listedDate && listedDate <= today) {
    statusCategory = "listed";
  } else if (endDate && endDate >= today) {
    statusCategory = "subscription";
  }

  return {
    code: item.code ?? item.Symbol ?? "",
    name: item.name ?? item.ShortName ?? "",
    institutionName: decodeText(item.institutionName ?? item.InstitutionName ?? ""),
    industry: item.industry ?? item.Industry ?? "未分类",
    listedMode: decodeText(item.listedMode ?? item.ListedMode ?? ""),
    sector: decodeText(item.sector ?? item.Sector ?? ""),
    listingYear: listedDate ? listedDate.slice(0, 4) : "--",
    newStockType: decodeText(item.newStockType ?? item.Sector ?? item.ListedMode ?? ""),
    ahDiscount: parseNumber(item.ahDiscount),
    listedDate,
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
    statusCategory,
    priceRange: item.priceRange ?? item.Price ?? "",
    startDate,
    endDate,
    resultDate: normalizeDate(item.resultDate ?? item.ResultDate),
    firstDayChg: parseNumber(item.firstDayChg ?? item.FirstDayChg),
    firstDayOpen: parseNumber(item.firstDayOpen ?? item.FirstDayOpen),
    grayPrice: parseNumber(item.grayPrice ?? item.GrayPrice),
    grayPriceChg: parseNumber(item.grayPriceChg ?? item.GrayPriceChg),
    issueLotSize: parseNumber(item.issueLotSize ?? item.Shares),
    issueNumber: parseNumber(item.issueNumber ?? item.IssueNumber),
    issueNumberHK: parseNumber(item.issueNumberHK ?? item.IssueNumber_HK),
    issueNumberIntl: parseNumber(item.issueNumberIntl ?? item.IssueNumber_Other),
    stockSumCount: parseNumber(item.stockSumCount ?? item.StockSumCount),
    minimumCapital: parseNumber(item.minimumCapital ?? item.MinimumCapital),
    codesRate: parseNumber(item.codesRate ?? item.CodesRate),
    currency: decodeText(item.currency ?? item.Currency ?? "HKD"),
    sponsors: decodeText(item.sponsors ?? item.Sponsors ?? ""),
    coordinator: decodeText(item.coordinator ?? item.Coordinator ?? ""),
    ledAgent: decodeText(item.ledAgent ?? item.LedAgent ?? ""),
    coLeadAgent: decodeText(item.coLeadAgent ?? item.Co_LeadAgent ?? ""),
    coSponsors: decodeText(item.coSponsors ?? item.Co_Sponsors ?? ""),
    coCoordinator: decodeText(item.coCoordinator ?? item.Co_Coordinator ?? ""),
    bookrunners: decodeText(item.bookrunners ?? item.Bookrunners ?? ""),
    prospectusRange: decodeText(item.prospectusRange ?? item.Prospectuses ?? ""),
    subscribedDate: decodeText(item.subscribedDate ?? item.SubscribedDate ?? ""),
    prospectusUrl: formatUrl(item.prospectusUrl ?? item.Link),
    useOfProceeds: decodeText(item.useOfProceeds ?? item.Use ?? "")
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
  elements.startDate.value = "2026-01-01";
  elements.endDate.value = listedDates[listedDates.length - 1];
  state.startDate = elements.startDate.value;
  state.endDate = elements.endDate.value;
  state.selectedCode = withDerivedFields[0]?.code ?? "";
  elements.dataSourceLabel.textContent = sourceLabel;
}

function matchesFilters(item) {
  const inDateRange =
    (!state.startDate || item.listedDate >= state.startDate) &&
    (!state.endDate || item.listedDate <= state.endDate);
  const inIndustry = state.industry === "all" || item.industry === state.industry;
  const inStatus = state.status === "all" || item.statusCategory === state.status;
  const keyword = state.search.trim().toLowerCase();
  const inSearch =
    !keyword ||
    item.name.toLowerCase().includes(keyword) ||
    item.code.toLowerCase().includes(keyword) ||
    item.industry.toLowerCase().includes(keyword);

  return inDateRange && inIndustry && inStatus && inSearch;
}

function sortItems(items) {
  const sorters = {
    listedDateDesc: (a, b) => b.listedDate.localeCompare(a.listedDate),
    listedDateAsc: (a, b) => a.listedDate.localeCompare(b.listedDate),
    returnDesc: (a, b) => compareNullableNumbers(a.cumulativeReturn, b.cumulativeReturn),
    subscriptionDesc: (a, b) => compareNullableNumbers(a.subscriptionMultiple, b.subscriptionMultiple),
    grayDesc: (a, b) => compareNullableNumbers(a.grayPriceChg, b.grayPriceChg),
    grayAsc: (a, b) => compareNullableNumbers(b.grayPriceChg, a.grayPriceChg),
    firstDayDesc: (a, b) => compareNullableNumbers(a.firstDayChg, b.firstDayChg),
    firstDayAsc: (a, b) => compareNullableNumbers(b.firstDayChg, a.firstDayChg)
  };

  const sorterKey = state.rankMode === "default" ? state.sortBy : state.rankMode;
  return [...items].sort(sorters[sorterKey]);
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
        <td colspan="25" class="empty-state">当前筛选条件下没有匹配的 IPO 项目。</td>
      </tr>
    `;
    return;
  }

  elements.tableBody.innerHTML = items
    .map(
      (item) => {
        const publicRatio = percentValue(item.issueNumberHK, item.issueNumber);
        const internationalRatio = percentValue(item.issueNumberIntl, item.issueNumber);
        const oneHandGrayProfit =
          Number.isFinite(item.grayPrice) && Number.isFinite(item.issuePrice) && Number.isFinite(item.issueLotSize)
            ? (item.grayPrice - item.issuePrice) * item.issueLotSize
            : null;
        const firstDayPrice =
          Number.isFinite(item.issuePrice) && Number.isFinite(item.firstDayChg)
            ? item.issuePrice * (1 + item.firstDayChg / 100)
            : null;
        const oneHandFirstDayProfit =
          Number.isFinite(firstDayPrice) && Number.isFinite(item.issuePrice) && Number.isFinite(item.issueLotSize)
            ? (firstDayPrice - item.issuePrice) * item.issueLotSize
            : null;

        return `
        <tr class="${item.code === state.selectedCode ? "is-selected" : ""}" data-code="${item.code}">
          <td>${item.listingYear}</td>
          <td><span class="ticker">${item.code}</span></td>
          <td class="company-cell">
            <strong>${item.name}</strong>
            <small>${item.institutionName || item.notes}</small>
            <span class="status-chip ${item.statusCategory}">${getStatusLabel(item.statusCategory)}</span>
          </td>
          <td>${item.newStockType || "--"}</td>
          <td>${formatPercentPlain(item.ahDiscount)}</td>
          <td>${item.sponsors || "--"}</td>
          <td>${item.ledAgent || item.coordinator || "--"}</td>
          <td>${item.listedMode || "--"}</td>
          <td>${formatInteger(item.issueLotSize)}</td>
          <td>${formatTenThousands(item.issueNumber)}</td>
          <td>${formatTenThousands(item.stockSumCount)}</td>
          <td>${formatCurrency(item.minimumCapital)}</td>
          <td>${formatPercentPlain(publicRatio)}</td>
          <td>--</td>
          <td>${formatBillionsPlain(item.fundraisingHKD)}</td>
          <td>--</td>
          <td>${formatTenThousands(item.issueNumberIntl)}</td>
          <td>${formatTenThousands(item.issueNumberHK)}</td>
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
          <td>${formatCurrency(oneHandGrayProfit)}</td>
          <td>${formatCurrency(oneHandFirstDayProfit)}</td>
          <td>${booleanLabel(item.grayPriceChg)}</td>
          <td>${booleanLabel(item.firstDayChg)}</td>
        </tr>
      `
      }
    )
    .join("");
}

function renderDetail(item) {
  if (!item) {
    elements.detailTitle.textContent = "主要信息";
    elements.detailGrid.innerHTML = "";
    elements.detailUse.textContent = "选择一个项目后显示";
    return;
  }

  elements.detailTitle.textContent = `${item.name} · ${item.code}`;

  const groups = [
    ["当前分类", getStatusLabel(item.statusCategory)],
    ["上市日期", item.listedDate ? formatDate(item.listedDate) : "--"],
    ["招股价区间", item.priceRange || "--"],
    ["认购倍数", formatMultiple(item.subscriptionMultiple)],
    ["入场费", formatCurrency(item.minimumCapital)],
    ["募资额", formatBillions(item.fundraisingHKD)],
    ["暗盘涨跌幅", formatPercent(item.grayPriceChg)],
    ["首日涨跌幅", formatPercent(item.firstDayChg)],
    ["招股书", item.prospectusUrl ? `<a href="${item.prospectusUrl}" target="_blank" rel="noreferrer">查看原文</a>` : "--"]
  ];

  elements.detailGrid.innerHTML = groups
    .map(
      ([label, value]) => `
        <article class="detail-card">
          <p class="detail-label">${label}</p>
          <div class="detail-value">${value}</div>
        </article>
      `
    )
    .join("");

  elements.detailUse.innerHTML = item.useOfProceeds
    ? item.useOfProceeds.replace(/<br\s*\/?>/gi, "<br>")
    : "暂无披露";
}

function getStatusLabel(statusCategory) {
  const labels = {
    subscription: "认购中",
    pending: "待上市",
    listed: "已上市",
    all: "全部"
  };

  return labels[statusCategory] || "待上市";
}

function render() {
  const filtered = withDerivedFields.filter(matchesFilters);
  const sorted = sortItems(filtered);
  const limited = sorted.slice(0, state.rowLimit);
  if (!limited.some((item) => item.code === state.selectedCode)) {
    state.selectedCode = limited[0]?.code ?? "";
  }
  renderStats(limited);
  renderTable(limited);
  renderDetail(limited.find((item) => item.code === state.selectedCode));
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

  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    render();
  });

  elements.rowLimit.addEventListener("change", (event) => {
    state.rowLimit = Number(event.target.value);
    render();
  });

  elements.sortBy.addEventListener("change", (event) => {
    state.sortBy = event.target.value;
    state.rankMode = "default";
    for (const tab of elements.rankTabs.querySelectorAll("button[data-rank]")) {
      tab.classList.toggle("is-active", tab.dataset.rank === "default");
    }
    render();
  });

  elements.statusTabs.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-status]");
    if (!button) {
      return;
    }

    state.status = button.dataset.status;
    for (const tab of elements.statusTabs.querySelectorAll("button[data-status]")) {
      tab.classList.toggle("is-active", tab.dataset.status === state.status);
    }
    render();
  });

  elements.rankTabs.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-rank]");
    if (!button) {
      return;
    }

    state.rankMode = button.dataset.rank;
    if (state.rankMode !== "default") {
      state.status = "listed";
      for (const tab of elements.statusTabs.querySelectorAll("button[data-status]")) {
        tab.classList.toggle("is-active", tab.dataset.status === "listed");
      }
    }
    for (const tab of elements.rankTabs.querySelectorAll("button[data-rank]")) {
      tab.classList.toggle("is-active", tab.dataset.rank === state.rankMode);
    }
    render();
  });

  elements.tableBody.addEventListener("click", (event) => {
    const row = event.target.closest("tr[data-code]");
    if (!row) {
      return;
    }

    state.selectedCode = row.dataset.code;
    render();
  });

  elements.resetFilters.addEventListener("click", () => {
    initializeFilters();
    state.search = "";
    state.industry = "all";
    state.status = "all";
    state.rankMode = "default";
    state.sortBy = "listedDateDesc";
    state.rowLimit = 20;

    elements.searchInput.value = "";
    elements.rowLimit.value = "20";
    elements.sortBy.value = "listedDateDesc";
    for (const tab of elements.statusTabs.querySelectorAll("button[data-status]")) {
      tab.classList.toggle("is-active", tab.dataset.status === "all");
    }
    for (const tab of elements.rankTabs.querySelectorAll("button[data-rank]")) {
      tab.classList.toggle("is-active", tab.dataset.rank === "default");
    }
    render();
  });
}

initializeFilters();
bindEvents();
render();
