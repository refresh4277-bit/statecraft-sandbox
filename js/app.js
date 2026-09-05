(function () {
  const SEATS = 13;
  const STORAGE = "statecraft-sandbox-v1";
  const PALETTE = ["#4ecdc4", "#e06c75", "#5b8def", "#e8b86d", "#b07cc6", "#7dcea0", "#f0b27a", "#74b9ff", "#fd79a8", "#55efc4"];
  const TIER_LABELS = ["major", "minor", "independent"];
  const TIER_NAMES = ["Major", "Minor", "Independent"];
  const DEFAULT_MINISTRIES = [
    { key: "defence", name: "Defence", ideal: 8, happy: 0.12, lobby: -0.42, savings: false },
    { key: "foreign", name: "Foreign affairs", ideal: 3, happy: 0.08, lobby: -0.1, savings: false },
    { key: "treasury", name: "Treasury (savings)", ideal: 5, happy: 0.05, lobby: -0.18, savings: true },
    { key: "home", name: "Home affairs", ideal: 6, happy: 0.16, lobby: 0.05, savings: false },
    { key: "judicial", name: "Judicial affairs", ideal: 4, happy: 0.14, lobby: 0.04, savings: false },
    { key: "social", name: "Social services", ideal: 12, happy: 0.48, lobby: 0.32, savings: false },
    { key: "education", name: "Education", ideal: 9, happy: 0.38, lobby: 0.12, savings: false },
    { key: "agriculture", name: "Agriculture and wildlife", ideal: 5, happy: 0.18, lobby: -0.12, savings: false },
    { key: "labour", name: "Labour affairs", ideal: 5, happy: 0.28, lobby: 0.36, savings: false },
    { key: "infra", name: "Infrastructure and transport", ideal: 10, happy: 0.3, lobby: -0.22, savings: false },
    { key: "trade", name: "Trade", ideal: 4, happy: 0.1, lobby: -0.34, savings: false },
    { key: "health", name: "Health and human rights", ideal: 14, happy: 0.52, lobby: 0.18, savings: false },
    { key: "housing", name: "Housing", ideal: 7, happy: 0.44, lobby: 0.22, savings: false },
    { key: "electorate", name: "Electorate Treasury", ideal: 8, happy: 0.36, lobby: 0.12, savings: false }
  ];

  const MINISTRY_BRIEFS = {
    defence: "Armed forces, bases, equipment, and veterans. Plans for conflict and keeps the country able to deter or fight.",
    foreign: "Embassies, treaties, consular help for citizens abroad, and the day-to-day work of diplomacy.",
    treasury: "Holds unspent revenue as a reserve. This is savings, not a spending programme — a buffer against shocks and deficits.",
    home: "Borders, immigration, policing policy, civil emergencies, and domestic security.",
    judicial: "Courts, prosecutors, legal aid, prisons, and the machinery that makes the law real.",
    social: "Pensions, unemployment support, family payments, and the welfare safety net.",
    education: "Early childhood, schools, universities, vocational training, and the teachers who staff them.",
    agriculture: "Farms, biosecurity, fisheries, forests, national parks, and the care of native wildlife.",
    labour: "Workplace law, wages, occupational safety, industrial relations, and jobs programmes.",
    infra: "Roads, rail, ports, airports, public transport, and major public works.",
    trade: "Exports, imports, tariffs, trade missions, and the deals that open or close markets.",
    health: "Hospitals, public health, medicines, disability services, and the rights the state is meant to guarantee.",
    housing: "Public housing, homelessness, rental policy, planning, and the supply of homes.",
    electorate: "A pool of grants and local works. Cabinet sets the size; each electorate then takes a share through its own funding slider."
  };

  const BASE_ECONOMY = {
    income: 480,
    company: 165,
    exports: 95,
    gst: 310
  };

  const TAX_META = [
    { key: "income", name: "Income tax", min: 0, max: 55, hint: "Hits households. Higher rates cool happiness; firms barely notice." },
    { key: "company", name: "Company tax", min: 0, max: 50, hint: "Firms lobby hard against rises. The public likes seeing corporations pay." },
    { key: "exports", name: "Exports tax", min: 0, max: 40, hint: "Exporters and trade groups turn up the pressure when this climbs." },
    { key: "gst", name: "Goods and services tax", min: 0, max: 25, hint: "A consumption tax is felt at the checkout more than in the boardroom." }
  ];

  function defaultElectorates() {
    return [
      { id: "el-harbour", name: "Harbour North", brief: "Dense inner harbour: flats, ferries, and a loud professional vote.", alloc: 17 },
      { id: "el-riverlands", name: "Riverlands", brief: "Irrigation country and market towns. Agriculture sets the weather and the mood.", alloc: 16 },
      { id: "el-coal", name: "Coal Coast", brief: "Yards, smelters, and shift work. Labour politics run deep.", alloc: 17 },
      { id: "el-highveld", name: "Highveld", brief: "Mortgage-belt suburbs. Schools, trains, and housing set the argument.", alloc: 17 },
      { id: "el-redridge", name: "Redridge", brief: "Mining and dry hinterland. Sparse, sceptical, and expensive to serve.", alloc: 16 },
      { id: "el-lakeside", name: "Lakeside", brief: "Coastal tourism and weekenders. Hospitality wants visitors; locals want quiet.", alloc: 17 }
    ].map((e) => Object.assign({
      wheelAngle: -Math.PI / 2,
      dominatesId: null,
      lastElection: null
    }, e));
  }

  function uid(prefix) {
    return prefix + "-" + Math.random().toString(36).slice(2, 9);
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function defaultState() {
    return {
      parties: [
        { id: "p-civic", name: "Civic Forum", leader: "Avery Lang", ideologies: ["Centrist", "Liberal"], color: "#4ecdc4", inOffice: true, tier: "major", homeElectorate: "" },
        { id: "p-labour", name: "Labour Front", leader: "Sam Okonkwo", ideologies: ["Social democrat", "Progressive"], color: "#e06c75", inOffice: false, tier: "major", homeElectorate: "" },
        { id: "p-commerce", name: "Commerce League", leader: "Morgan Hale", ideologies: ["Conservative", "Free market"], color: "#5b8def", inOffice: false, tier: "major", homeElectorate: "" }
      ],
      taxes: { income: 32, company: 30, exports: 5, gst: 10 },
      ministries: DEFAULT_MINISTRIES.map((m) => ({
        id: m.key,
        name: m.name,
        alloc: m.ideal,
        custom: false,
        locked: m.key === "electorate",
        impact: "preset",
        happy: m.happy,
        lobby: m.lobby,
        ideal: m.ideal,
        savings: m.savings
      })),
      economy: 1,
      eventHappiness: 0,
      eventLobbying: 0,
      supportEvents: {},
      terms: [],
      budgetHistory: [],
      eventLog: [],
      lastEvent: null,
      lastElection: null,
      wheelAngle: -Math.PI / 2,
      projects: [],
      lastEstimate: null,
      chamber: null,
      electorates: defaultElectorates(),
      selectedElectorateId: "el-harbour"
    };
  }

  let state = load() || defaultState();
  let wheelSpinning = false;
  let budgetTimer = null;
  let editingPartyId = null;
  let editingMinistryId = null;
  let editingElectorateId = null;
  let elWheelSpinning = false;

  const $ = (id) => document.getElementById(id);

  function migrate(data) {
    if (!Array.isArray(data.projects)) data.projects = [];
    if (!Array.isArray(data.chamber) || data.chamber.length !== SEATS) data.chamber = null;
    (data.parties || []).forEach((p) => {
      if (!p.tier) p.tier = "major";
      if (p.homeElectorate == null) p.homeElectorate = "";
    });
    if (!Array.isArray(data.ministries)) data.ministries = [];
    if (!data.ministries.some((m) => m.id === "electorate")) {
      data.ministries.push({
        id: "electorate",
        name: "Electorate Treasury",
        alloc: 8,
        custom: false,
        locked: true,
        impact: "preset",
        happy: 0.36,
        lobby: 0.12,
        ideal: 8,
        savings: false
      });
    } else {
      const pool = data.ministries.find((m) => m.id === "electorate");
      if (pool) pool.locked = true;
    }
    if (!Array.isArray(data.electorates) || !data.electorates.length) data.electorates = defaultElectorates();
    data.electorates.forEach((e) => {
      if (typeof e.alloc !== "number") e.alloc = 10;
      if (typeof e.wheelAngle !== "number") e.wheelAngle = -Math.PI / 2;
      if (!e.dominatesId) e.dominatesId = null;
    });
    if (!data.selectedElectorateId && data.electorates[0]) data.selectedElectorateId = data.electorates[0].id;
    return data;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (!raw) return null;
      return migrate(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(state));
    } catch {
      /* ignore quota */
    }
  }

  function ideologyLean(p) {
    const text = (p.ideologies || []).join(" ").toLowerCase();
    let n = 0;
    ["social democrat", "socialist", "progressive", "green", "labour", "labor", "left", "welfare", "equal", "climate"].forEach((k) => {
      if (text.includes(k)) n -= 1;
    });
    ["conservative", "free market", "libertarian", "enterprise", "capital", "nationalist", "commerce", "business"].forEach((k) => {
      if (text.includes(k)) n += 1;
    });
    if (/\bliberal\b/.test(text) && n === 0) n += 0.2;
    if (/\bcentrist\b/.test(text)) n *= 0.35;
    return clamp(n, -2, 2) / 2;
  }

  function partyTier(p) {
    return TIER_LABELS.includes(p.tier) ? p.tier : "major";
  }

  function tierWeight(p) {
    const t = partyTier(p);
    if (t === "minor") return 0.48;
    if (t === "independent") return 0.16;
    return 1;
  }

  function tierName(p) {
    const i = TIER_LABELS.indexOf(partyTier(p));
    return TIER_NAMES[i] || "Major";
  }

  function hash01(s) {
    let h = 2166136261;
    const str = String(s || "");
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return ((h >>> 0) % 1000) / 1000;
  }

  function governmentVoteShare(happy) {
    return clamp(12 + Number(happy) * 0.76, 8, 92);
  }

  function supportReason(p, mood) {
    const lean = ideologyLean(p);
    const govPct = governmentVoteShare(mood.happy);
    const bits = [];
    if (p.inOffice) {
      bits.push("Cabinet support is " + govPct.toFixed(0) + "% because happiness is " + Math.round(mood.happy) + "%");
    } else {
      bits.push(mood.happy >= 55
        ? "High happiness is keeping the opposition squeezed"
        : mood.happy <= 45
          ? "Low happiness is feeding the opposition"
          : "Opposition share is whatever cabinet support does not take");
    }
    if (mood.lobby >= 48) {
      bits.push(lean > 0.2 ? "Heavy lobbying is lifting this party inside its bench" : lean < -0.2 ? "Corporate pressure is squeezing this party inside its bench" : "Lobbying is loud but this party sits near the centre");
    } else if (mood.lobby <= 28) {
      bits.push(lean < -0.2 ? "Quiet boardrooms leave room for people-aligned parties" : lean > 0.2 ? "Low lobbying starves business-aligned campaigns" : "Lobbying is quiet");
    } else {
      bits.push("Lobbying only shuffles parties, not the cabinet’s total");
    }
    return bits.join(". ");
  }

  function benchSplit(parties, benchPct, mood) {
    if (!parties.length || benchPct <= 0) return [];
    const raw = parties.map((p) => {
      let w = 12 * tierWeight(p);
      w += (mood.lobby - 32) * 0.42 * ideologyLean(p);
      w += state.supportEvents[p.id] || 0;
      return Math.max(0.35, w);
    });
    const sum = raw.reduce((n, x) => n + x, 0) || 1;
    return parties.map((p, i) => ({
      party: p,
      support: raw[i],
      pct: (raw[i] / sum) * benchPct
    }));
  }

  function pollShares() {
    const mood = derivedMood();
    const gov = state.parties.filter((p) => p.inOffice);
    const opp = state.parties.filter((p) => !p.inOffice);
    if (!state.parties.length) return [];
    if (!gov.length) return benchSplit(opp, 100, mood);
    if (!opp.length) return benchSplit(gov, 100, mood);
    const govPct = governmentVoteShare(mood.happy);
    return benchSplit(gov, govPct, mood).concat(benchSplit(opp, 100 - govPct, mood));
  }

  function electorateTreasury() {
    const m = (state.ministries || []).find((x) => x.id === "electorate");
    const pool = m ? ministrySpend(m, revenue()) : 0;
    return { ministry: m || null, pool };
  }

  function electorateFunding() {
    const allocated = (state.electorates || []).reduce((n, e) => n + Number(e.alloc || 0), 0);
    const { pool } = electorateTreasury();
    const spent = pool * Math.min(allocated, 100) / 100;
    const left = pool * Math.max(0, 100 - allocated) / 100;
    return { allocated, pool, spent, left };
  }

  function selectedElectorate() {
    return (state.electorates || []).find((e) => e.id === state.selectedElectorateId) || null;
  }

  function localHappy(el) {
    const mood = derivedMood();
    const n = Math.max(1, (state.electorates || []).length);
    const equal = 100 / n;
    let h = mood.happy;
    h += ((el.alloc || 0) - equal) * 0.38;
    h += (hash01(el.id) - 0.5) * 10;
    const { pool } = electorateTreasury();
    if (pool < 0.4) h -= 6;
    return clamp(h, 0, 100);
  }

  function electoratePolls(el) {
    const mood = derivedMood();
    const happy = localHappy(el);
    const gov = state.parties.filter((p) => p.inOffice);
    const opp = state.parties.filter((p) => !p.inOffice);
    const boost = function (parties, benchPct) {
      if (!parties.length || benchPct <= 0) return [];
      const raw = parties.map((p) => {
        let w = 12 * tierWeight(p);
        w += (mood.lobby - 32) * 0.35 * ideologyLean(p);
        w += (hash01(el.id + "|" + p.id) - 0.5) * 14;
        w += state.supportEvents[p.id] || 0;
        if (partyTier(p) === "independent" && p.homeElectorate === el.id) w *= 6;
        else if (p.homeElectorate === el.id) w *= 1.35;
        return Math.max(0.25, w);
      });
      const sum = raw.reduce((n, x) => n + x, 0) || 1;
      return parties.map((p, i) => ({
        party: p,
        support: raw[i],
        pct: (raw[i] / sum) * benchPct
      }));
    };
    if (!state.parties.length) return [];
    if (!gov.length) return boost(opp, 100);
    if (!opp.length) return boost(gov, 100);
    const govPct = governmentVoteShare(happy);
    return boost(gov, govPct).concat(boost(opp, 100 - govPct));
  }

  function electorateDominator(el) {
    if (el.dominatesId) {
      const held = state.parties.find((p) => p.id === el.dominatesId);
      if (held) {
        const share = electoratePolls(el).find((s) => s.party.id === held.id);
        return { party: held, pct: share ? share.pct : 0, seated: true };
      }
    }
    const polls = electoratePolls(el);
    if (!polls.length) return null;
    const top = [...polls].sort((a, b) => b.pct - a.pct)[0];
    return { party: top.party, pct: top.pct, seated: false };
  }

  function allocateSeats() {
    const shares = pollShares();
    const rows = shares.map((s) => {
      const exact = (s.pct / 100) * SEATS;
      const seats = Math.floor(exact);
      return { ...s, exact, seats, rem: exact - seats };
    });
    let left = SEATS - rows.reduce((n, r) => n + r.seats, 0);
    [...rows].sort((a, b) => b.rem - a.rem).forEach((r) => {
      if (left > 0) {
        r.seats += 1;
        left -= 1;
      }
    });
    return rows;
  }

  function extraMemberName(party, idx) {
    const first = ["Blair", "Cameron", "Devon", "Ellis", "Finley", "Hadley", "Indigo", "Jules", "Kit", "Lake", "Marlow", "Noel", "Oakley", "Pax", "Quinn", "Reeve", "Shay"];
    const last = ["Nash", "Voss", "Keene", "Daley", "Crowe", "Pritchard", "Ng", "Iyer", "Berg", "Santos", "Wade", "Kaur"];
    let h = 0;
    const seed = party.id + "|" + party.leader;
    for (let i = 0; i < seed.length; i++) h = Math.imul(h, 31) + seed.charCodeAt(i);
    h = Math.abs(h + idx * 17);
    return first[h % first.length] + " " + last[(h >> 3) % last.length];
  }

  function heldSeats(partyId) {
    return (state.chamber || []).filter((s) => !s.vacant && s.partyId === partyId).length;
  }

  function govSeatCount() {
    return (state.chamber || []).filter((s) => {
      if (s.vacant || !s.partyId) return false;
      const p = state.parties.find((x) => x.id === s.partyId);
      return !!(p && p.inOffice);
    }).length;
  }

  function syncChamberParties() {
    (state.chamber || []).forEach((s) => {
      if (!s.vacant && s.partyId && !state.parties.some((p) => p.id === s.partyId)) {
        s.vacant = true;
        s.partyId = null;
        s.member = "Vacant";
        s.leader = false;
      }
    });
  }

  function seatTheHouse() {
    const seated = allocateSeats().slice().sort((a, b) => {
      if (a.party.inOffice !== b.party.inOffice) return a.party.inOffice ? -1 : 1;
      return b.seats - a.seats;
    });
    const chamber = [];
    seated.forEach((s) => {
      for (let i = 0; i < s.seats; i++) {
        chamber.push({
          partyId: s.party.id,
          member: i === 0 ? s.party.leader : extraMemberName(s.party, i),
          leader: i === 0,
          vacant: false
        });
      }
    });
    while (chamber.length < SEATS) {
      chamber.push({ partyId: null, member: "Vacant", leader: false, vacant: true });
    }
    state.chamber = chamber.slice(0, SEATS);
  }

  function ensureChamber() {
    if (!Array.isArray(state.chamber) || state.chamber.length !== SEATS) seatTheHouse();
    else syncChamberParties();
  }

  function resignMember(who) {
    const sitting = (state.chamber || []).filter((s) => !s.vacant && s.partyId);
    if (!sitting.length) return null;
    const inOffice = (slot) => {
      const p = state.parties.find((x) => x.id === slot.partyId);
      return !!(p && p.inOffice);
    };
    let pool = sitting;
    if (who === "gov") pool = sitting.filter(inOffice);
    if (who === "opp") pool = sitting.filter((s) => !inOffice(s));
    if (!pool.length) pool = sitting;
    const nonLeaders = pool.filter((s) => !s.leader);
    const pickFrom = nonLeaders.length ? nonLeaders : pool;
    const pick = pickFrom[Math.floor(Math.random() * pickFrom.length)];
    const party = state.parties.find((p) => p.id === pick.partyId);
    const left = {
      member: pick.member,
      partyName: party ? party.name : "Independent",
      leader: !!pick.leader
    };
    pick.vacant = true;
    pick.partyId = null;
    pick.member = "Vacant";
    pick.leader = false;
    return left;
  }

  function vacateParty(partyId) {
    (state.chamber || []).forEach((s) => {
      if (s.partyId === partyId) {
        s.vacant = true;
        s.partyId = null;
        s.member = "Vacant";
        s.leader = false;
      }
    });
  }

  function taxTake(key, rate) {
    const base = BASE_ECONOMY[key] * state.economy;
    const dead = Math.max(0, (rate - 12) / 220);
    return base * (rate / 100) * (1 - dead);
  }

  function revenue() {
    return TAX_META.reduce((n, t) => n + taxTake(t.key, state.taxes[t.key]), 0);
  }

  function ministrySpend(m, rev) {
    return rev * (m.alloc / 100);
  }

  function budget() {
    const rev = revenue();
    const savingsMin = state.ministries.filter((m) => m.savings);
    const program = state.ministries.filter((m) => !m.savings);
    const spending = program.reduce((n, m) => n + ministrySpend(m, rev), 0);
    const savings = savingsMin.reduce((n, m) => n + ministrySpend(m, rev), 0);
    const allocated = state.ministries.reduce((n, m) => n + m.alloc, 0);
    const unallocatedPct = Math.max(0, 100 - allocated);
    const unallocated = rev * (unallocatedPct / 100);
    const surplus = rev - spending;
    return { rev, spending, savings, allocated, unallocatedPct, unallocated, surplus };
  }

  function derivedMood() {
    const b = budget();
    let happy = 52;
    let lobby = 18;

    happy -= (state.taxes.income - 25) * 0.38;
    lobby += (state.taxes.income - 25) * 0.06;
    happy += (state.taxes.company - 28) * 0.14;
    lobby += (state.taxes.company - 28) * 0.58;
    happy -= (state.taxes.exports - 8) * 0.1;
    lobby += (state.taxes.exports - 8) * 0.48;
    happy -= (state.taxes.gst - 10) * 0.62;
    lobby += (state.taxes.gst - 10) * 0.16;

    state.ministries.forEach((m) => {
      const delta = m.alloc - (m.ideal || 6);
      if (m.impact === "people") {
        happy += delta * 0.4;
        lobby += delta * 0.28;
      } else if (m.impact === "business") {
        happy += delta * 0.06;
        lobby -= delta * 0.4;
      } else if (m.impact === "neutral") {
        happy += delta * 0.14;
        lobby += delta * 0.05;
      } else {
        happy += delta * m.happy;
        lobby += delta * m.lobby;
      }
    });

    if (b.surplus < 0) happy -= Math.min(14, Math.abs(b.surplus) * 0.12);
    else happy += Math.min(6, b.surplus * 0.04);

    happy += state.eventHappiness;
    lobby += state.eventLobbying;

    lobby = clamp(lobby, 0, 100);
    happy -= Math.max(0, lobby - 42) * 0.16;
    happy = clamp(happy, 0, 100);

    return { happy, lobby, budget: b };
  }

  function preferred() {
    const seats = allocateSeats();
    if (!seats.length) return null;
    return [...seats].sort((a, b) => b.pct - a.pct || b.seats - a.seats)[0];
  }

  function money(n) {
    const sign = n < 0 ? "-" : "";
    return sign + "$" + Math.abs(n).toFixed(1) + "bn";
  }

  function moneySmart(n) {
    const sign = n < 0 ? "-" : "";
    const abs = Math.abs(n);
    if (abs < 1) return sign + "$" + (abs * 1000).toFixed(0) + "m";
    return sign + "$" + abs.toFixed(1) + "bn";
  }

  function renderKpis() {
    const mood = derivedMood();
    const pref = preferred();
    const govSeats = govSeatCount();

    $("kpi-happiness").textContent = Math.round(mood.happy) + "%";
    $("kpi-happiness-note").textContent = mood.happy >= 62 ? "Content" : mood.happy >= 45 ? "Uneasy" : "Restive";
    $("kpi-lobbying").textContent = Math.round(mood.lobby) + "%";
    $("kpi-lobbying-note").textContent = mood.lobby >= 55 ? "Heavy corporate pressure" : mood.lobby >= 32 ? "Active but contained" : "Quiet boardrooms";
    $("kpi-preferred").textContent = pref ? pref.party.name : "—";
    $("kpi-preferred-note").textContent = pref ? pref.pct.toFixed(1) + "% support" : "Add a party";
    $("kpi-gov-seats").textContent = govSeats + " / " + SEATS;
    $("kpi-majority").textContent = govSeats >= 7 ? "Majority government" : "Minority or caretaker";

    $("kpi-revenue").textContent = money(mood.budget.rev);
    $("kpi-spending").textContent = money(mood.budget.spending);
    $("kpi-savings").textContent = money(mood.budget.savings);
    const pos = $("kpi-position");
    const wrap = $("position-kpi");
    pos.textContent = money(mood.budget.surplus);
    $("kpi-position-note").textContent = mood.budget.surplus >= 0 ? "Surplus (revenue − programme spend)" : "Deficit (borrowing implied)";
    wrap.classList.toggle("is-surplus", mood.budget.surplus >= 0);
    wrap.classList.toggle("is-deficit", mood.budget.surplus < 0);

    $("happy-explain").textContent =
      "Taxes, ministry mix, events, the budget, and high lobbying all feed this. Cabinet support then follows happiness.";
    const note = $("gov-support-note");
    if (note) {
      const govPct = governmentVoteShare(mood.happy);
      note.textContent = state.parties.some((p) => p.inOffice)
        ? "Cabinet support is " + govPct.toFixed(0) + "% because national happiness is " + Math.round(mood.happy) + "%."
        : "No party is in office, so happiness has no cabinet to back.";
    }
    $("lobby-explain").textContent =
      "Rises when cabinet hurts profits (company tax, welfare, labour). Falls when defence, trade, and infrastructure are well fed.";
  }

  function renderParties() {
    const box = $("party-list");
    if (!state.parties.length) {
      box.innerHTML = '<p class="empty-note">No parties. Add one, then spin the wheel to seat the chamber.</p>';
      return;
    }
    const mood = derivedMood();
    const polls = pollShares();
    box.innerHTML = state.parties.map((p) => {
      const share = polls.find((s) => s.party.id === p.id);
      const pct = share ? share.pct : 0;
      const seats = heldSeats(p.id);
      return `<article class="party-card" style="--accent:${p.color}">
        <h3>${escapeHtml(p.name)}</h3>
        <p class="leader">Leader · ${escapeHtml(p.leader)}</p>
        <div class="chips">${p.ideologies.map((i) => `<span class="chip">${escapeHtml(i)}</span>`).join("") || '<span class="chip">No ideology set</span>'}<span class="chip tier">${escapeHtml(tierName(p))}</span></div>
        <div class="support-readout">
          <div class="support-bar"><i style="width:${Math.min(100, pct)}%"></i></div>
          <strong>${pct.toFixed(1)}%</strong>
        </div>
        <p class="hint">${escapeHtml(supportReason(p, mood))} · ${seats} seat${seats === 1 ? "" : "s"} held until the next election</p>
        <div class="row-actions">
          <button type="button" class="tiny ${p.inOffice ? "on" : ""}" data-office="${p.id}">${p.inOffice ? "In office" : "Opposition"}</button>
          <button type="button" class="tiny" data-edit-party="${p.id}">Edit</button>
          <button type="button" class="tiny danger" data-remove="${p.id}">Remove</button>
        </div>
      </article>`;
    }).join("");
  }

  function fillTaxTable() {
    const rows = TAX_META.map((t) => {
      const take = taxTake(t.key, state.taxes[t.key]);
      return `<div><span>${t.name}</span><b>${money(take)}</b></div>`;
    }).join("");
    $("tax-table").innerHTML = rows + `<div><span>Total estimated income</span><b>${money(revenue())}</b></div>`;
  }

  function renderTaxes() {
    $("tax-sliders").innerHTML = TAX_META.map((t) => `
      <div class="tax-block">
        <label>${t.name}
          <div class="slider-row">
            <input type="range" min="${t.min}" max="${t.max}" step="0.5" value="${state.taxes[t.key]}" data-tax="${t.key}" />
            <output>${state.taxes[t.key].toFixed(1)}%</output>
          </div>
        </label>
        <p class="hint">${t.hint}</p>
      </div>`).join("");
    fillTaxTable();
  }

  function updateAllocMeter() {
    const b = budget();
    const fill = $("alloc-fill");
    const bar = fill.parentElement;
    fill.style.width = Math.min(100, b.allocated) + "%";
    bar.classList.toggle("over", b.allocated > 100);
    $("alloc-label").textContent = b.allocated.toFixed(1) + "% allocated" + (b.allocated > 100 ? " · overdrawn" : b.unallocatedPct > 0 ? ` · ${b.unallocatedPct.toFixed(1)}% unallocated` : "");
    document.querySelectorAll("[data-alloc]").forEach((input) => {
      const m = state.ministries.find((x) => x.id === input.dataset.alloc);
      if (!m) return;
      const card = input.closest(".min-card");
      if (!card) return;
      const dollars = ministrySpend(m, b.rev);
      const sub = card.querySelector(".sub");
      const spendLabel = m.id === "electorate"
        ? "Pooled for electorates"
        : (m.savings ? "Counted as savings, not programme spend" : "Programme spend");
      if (sub) sub.textContent = `${spendLabel} · ${money(dollars)}`;
      const out = input.parentElement.querySelector("output");
      if (out) out.textContent = m.alloc.toFixed(1) + "%";
    });
  }

  function ministryBrief(m) {
    if (m.brief) return m.brief;
    if (MINISTRY_BRIEFS[m.id]) return MINISTRY_BRIEFS[m.id];
    if (m.impact === "people") return "A custom people-focused portfolio. Spending here usually lifts public happiness; firms may lobby against it.";
    if (m.impact === "business") return "A custom business-focused portfolio. Funding here tends to ease corporate pressure more than it lifts the public mood.";
    return "A custom cabinet portfolio you added. Hover stays generic unless you wrote a brief when creating it.";
  }

  function showMinistryTip(btn) {
    const tip = $("ministry-tip");
    tip.textContent = btn.getAttribute("data-brief") || "";
    tip.hidden = false;
    const r = btn.getBoundingClientRect();
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    let left = r.left;
    let top = r.bottom + 8;
    if (top + th > window.innerHeight - 10) top = r.top - th - 8;
    if (left + tw > window.innerWidth - 10) left = window.innerWidth - tw - 10;
    if (left < 10) left = 10;
    if (top < 10) top = 10;
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }

  function hideMinistryTip() {
    $("ministry-tip").hidden = true;
  }

  function renderMinistries() {
    const b = budget();
    hideMinistryTip();
    $("ministry-list").innerHTML = state.ministries.map((m) => {
      const dollars = ministrySpend(m, b.rev);
      const brief = ministryBrief(m);
      const spendLabel = m.id === "electorate"
        ? "Pooled for electorates"
        : (m.savings ? "Counted as savings, not programme spend" : "Programme spend");
      return `<article class="min-card">
        <header>
          <div>
            <div class="min-title">
              <strong>${escapeHtml(m.name)}</strong>
              <button type="button" class="info-btn" aria-label="What ${escapeHtml(m.name)} is responsible for" data-brief="${escapeHtml(brief)}">i</button>
            </div>
            <div class="sub">${spendLabel} · ${money(dollars)}</div>
          </div>
          <div class="row-actions">
            <button type="button" class="tiny" data-edit-min="${m.id}">Edit</button>
            ${m.custom && !m.locked ? `<button type="button" class="tiny danger" data-remove-min="${m.id}">Remove</button>` : ""}
          </div>
        </header>
        <div class="slider-row">
          <input type="range" min="0" max="40" step="0.5" value="${m.alloc}" data-alloc="${m.id}" aria-label="${escapeHtml(m.name)}" />
          <output>${m.alloc.toFixed(1)}%</output>
        </div>
      </article>`;
    }).join("");
    updateAllocMeter();
  }

  function renderEvents() {
    const cur = $("event-current");
    if (!state.lastEvent) {
      cur.className = "event-card empty";
      cur.textContent = "No event drawn yet.";
    } else {
      const e = state.lastEvent;
      cur.className = "event-card";
      cur.innerHTML = `<span class="tag">${escapeHtml(e.tag)}</span>
        <h3>${escapeHtml(e.title)}</h3>
        <p>${escapeHtml(e.blurb)}</p>
        ${e.resignNote ? `<p class="hint">${escapeHtml(e.resignNote)}</p>` : ""}
        <div class="impacts">${impactChips(e)}</div>`;
    }
    $("event-log").innerHTML = (state.eventLog || []).map((e) =>
      `<li><strong>${escapeHtml(e.title)}</strong><span>${escapeHtml(e.tag)} · ${escapeHtml(e.when)}</span></li>`
    ).join("") || "<li>Nothing drawn yet.</li>";
  }

  function impactChips(e) {
    const bits = [
      ["Happiness", e.happiness],
      ["Lobbying", e.lobbying],
      ["Gov support", e.supportGov],
      ["Opposition", e.supportOpp],
      ["Economy", Math.round((e.economy - 1) * 100)]
    ];
    const chips = bits.map(([label, n]) => {
      const cls = n > 0 ? "up" : n < 0 ? "down" : "";
      const val = label === "Economy" ? (n > 0 ? "+" + n + "%" : n + "%") : (n > 0 ? "+" + n : String(n));
      return `<i class="${cls}">${label} ${val}</i>`;
    });
    if (e.resign) chips.push('<i class="down">Seat vacated</i>');
    return chips.join("");
  }

  function renderWheelResult() {
    const box = $("wheel-result");
    if (!state.lastElection) {
      box.hidden = true;
      return;
    }
    const e = state.lastElection;
    box.hidden = false;
    box.innerHTML = `<strong>${escapeHtml(e.name)}</strong> forms government<br><span class="hint">${escapeHtml(e.leader)} · ${e.pct.toFixed(1)}% chance on the wheel · ${e.majority ? "majority" : "minority"} with ${e.seats} seats</span>`;
  }

  function ensureElectorateWinners() {
    (state.electorates || []).forEach((el) => {
      if (el.dominatesId && state.parties.some((p) => p.id === el.dominatesId)) return;
      const d = electorateDominator(el);
      el.dominatesId = d ? d.party.id : null;
    });
  }

  function updateElectorateMeter() {
    const fund = electorateFunding();
    const fill = $("el-alloc-fill");
    if (!fill) return;
    fill.style.width = Math.min(100, fund.allocated) + "%";
    fill.parentElement.classList.toggle("over", fund.allocated > 100);
    $("el-alloc-label").textContent = fund.allocated.toFixed(1) + "% of the Electorate Treasury pool" +
      (fund.allocated > 100 ? " · overdrawn" : fund.allocated < 99.5 ? ` · ${(100 - fund.allocated).toFixed(1)}% unallocated` : "");
    $("kpi-el-pool").textContent = money(fund.pool);
    $("kpi-el-spent").textContent = money(fund.spent);
    $("kpi-el-spent-note").textContent = fund.allocated.toFixed(1) + "% of the pool assigned";
    $("kpi-el-left").textContent = money(fund.left);
    $("kpi-el-count").textContent = String((state.electorates || []).length);
    const open = selectedElectorate();
    const dom = open ? electorateDominator(open) : null;
    $("kpi-el-dom").textContent = dom ? (dom.party.name + " leads " + open.name) : "Open one for local polls";
    document.querySelectorAll("[data-el-alloc]").forEach((input) => {
      const el = state.electorates.find((x) => x.id === input.dataset.elAlloc);
      if (!el) return;
      const out = input.parentElement.querySelector("output");
      if (out) out.textContent = Number(el.alloc).toFixed(1) + "%";
      const sub = input.closest(".el-card") && input.closest(".el-card").querySelector(".el-dollars");
      if (sub) sub.textContent = money(fund.pool * (el.alloc / 100));
    });
  }

  function renderElectorates() {
    const box = $("electorate-list");
    if (!box) return;
    ensureElectorateWinners();
    const fund = electorateFunding();
    if (!state.electorates.length) {
      box.innerHTML = '<p class="empty-note">No electorates. Add one to start splitting the Electorate Treasury.</p>';
    } else {
      box.innerHTML = state.electorates.map((el) => {
        const dom = electorateDominator(el);
        const open = state.selectedElectorateId === el.id;
        return `<article class="el-card${open ? " is-open" : ""}" data-open-el="${el.id}">
          <h3>${escapeHtml(el.name)}</h3>
          <p class="sub">${escapeHtml(el.brief || "No description")} · ${dom ? escapeHtml(dom.party.name) + " dominates" : "No dominant party"}</p>
          <div class="slider-row">
            <input type="range" min="0" max="40" step="0.5" value="${el.alloc}" data-el-alloc="${el.id}" aria-label="Funding for ${escapeHtml(el.name)}" />
            <output>${Number(el.alloc).toFixed(1)}%</output>
          </div>
          <p class="hint el-dollars">${money(fund.pool * (el.alloc / 100))} from Electorate Treasury</p>
          <div class="row-actions">
            <button type="button" class="tiny" data-edit-el="${el.id}">Edit</button>
            <button type="button" class="tiny danger" data-remove-el="${el.id}">Remove</button>
          </div>
        </article>`;
      }).join("");
    }
    updateElectorateMeter();
    renderElectorateDetail();
  }

  function renderElectorateDetail() {
    const host = $("electorate-detail");
    if (!host) return;
    const el = selectedElectorate();
    if (!el) {
      host.innerHTML = `<article class="panel el-empty">
        <h2>Local overview</h2>
        <p class="hint">Click an electorate to see who it backs, who dominates it, and to spin its own election wheel.</p>
      </article>`;
      return;
    }
    const happy = localHappy(el);
    const polls = electoratePolls(el);
    const dom = electorateDominator(el);
    const fund = electorateFunding();
    const dollars = fund.pool * (el.alloc / 100);
    host.innerHTML = `
      <div class="el-detail-head">
        <div>
          <button type="button" class="ghost el-back" id="el-clear">All electorates</button>
          <h2>${escapeHtml(el.name)}</h2>
          <p class="hint">${escapeHtml(el.brief || "A local race inside the national sandbox.")}</p>
        </div>
      </div>
      <div class="kpi-row">
        <article class="kpi">
          <span>Local happiness</span>
          <strong>${Math.round(happy)}%</strong>
          <em>National mood, plus how well this seat is funded</em>
        </article>
        <article class="kpi">
          <span>Dominating party</span>
          <strong>${dom ? escapeHtml(dom.party.name) : "—"}</strong>
          <em>${dom ? (dom.seated ? "Won the last local spin" : "Leads the local poll") : "Add a party"}</em>
        </article>
        <article class="kpi">
          <span>Local funding</span>
          <strong>${money(dollars)}</strong>
          <em>${Number(el.alloc).toFixed(1)}% of Electorate Treasury</em>
        </article>
        <article class="kpi">
          <span>Preferred here</span>
          <strong>${polls.length ? escapeHtml(polls.slice().sort((a, b) => b.pct - a.pct)[0].party.name) : "—"}</strong>
          <em>${polls.length ? polls.slice().sort((a, b) => b.pct - a.pct)[0].pct.toFixed(1) + "% local support" : "No parties"}</em>
        </article>
      </div>
      <div class="el-mini">
        <aside class="panel">
          <div class="panel-head">
            <div>
              <h2>Parties in ${escapeHtml(el.name)}</h2>
              <p>Local support follows local happiness. Majors travel; independents spike in a home seat.</p>
            </div>
            <button type="button" class="solid" data-el-add-party="${el.id}">Add party</button>
          </div>
          <div class="party-list">${polls.length ? polls.map((s) => {
            const p = s.party;
            const lead = dom && dom.party.id === p.id;
            return `<article class="party-card compact" style="--accent:${p.color}">
              <h3>${escapeHtml(p.name)}${lead ? " · dominates" : ""}</h3>
              <p class="leader">Leader · ${escapeHtml(p.leader)}</p>
              <div class="chips"><span class="chip tier">${escapeHtml(tierName(p))}</span>${p.homeElectorate === el.id ? '<span class="chip">Home seat</span>' : ""}</div>
              <div class="support-readout">
                <div class="support-bar"><i style="width:${Math.min(100, s.pct)}%"></i></div>
                <strong>${s.pct.toFixed(1)}%</strong>
              </div>
            </article>`;
          }).join("") : '<p class="empty-note">No parties on the ballot.</p>'}</div>
        </aside>
        <div class="center-col">
          <article class="panel gauge-card">
            <h2>Local happiness</h2>
            <canvas id="el-happy-gauge" width="220" height="150"></canvas>
            <p class="explain">Underfunding relative to other electorates sours this seat. A fat Electorate Treasury share lifts it.</p>
          </article>
          <article class="panel">
            <h2>Local support</h2>
            <canvas id="el-support-canvas" width="520" height="220" aria-label="Local party support"></canvas>
          </article>
        </div>
        <aside class="panel">
          <div class="panel-head">
            <div>
              <h2>Local election wheel</h2>
              <p>Slice size follows support in this electorate. The spin names who dominates here, not who sits in cabinet.</p>
            </div>
          </div>
          <div class="wheel-wrap">
            <div class="wheel-pointer" aria-hidden="true"></div>
            <canvas id="el-wheel-canvas" width="320" height="320" aria-label="Electorate election wheel"></canvas>
          </div>
          <button type="button" class="solid xl" id="el-spin-wheel">Spin this electorate</button>
          <div id="el-wheel-result" class="wheel-result"${el.lastElection ? "" : " hidden"}>${el.lastElection ? `<strong>${escapeHtml(el.lastElection.name)}</strong> dominates ${escapeHtml(el.name)}<br><span class="hint">${escapeHtml(el.lastElection.leader)} · ${el.lastElection.pct.toFixed(1)}% on the local wheel</span>` : ""}</div>
        </aside>
      </div>`;
    requestAnimationFrame(drawElectorateView);
  }

  function drawElectorateView() {
    const el = selectedElectorate();
    const C = window.StatecraftCharts;
    if (!el || !$("el-support-canvas")) return;
    const polls = electoratePolls(el);
    C.gauge($("el-happy-gauge"), localHappy(el), "#7dcea0", "");
    C.bars($("el-support-canvas"), polls.map((s) => ({
      label: s.party.name,
      value: s.pct,
      color: s.party.color
    })));
    drawWheelOn($("el-wheel-canvas"), polls.filter((s) => s.pct > 0), el.wheelAngle);
  }

  function shortPortfolio(name) {
    return String(name || "")
      .replace(/\s*\(.*\)\s*/g, " ")
      .split(" and ")[0]
      .trim();
  }

  function cabinetMembers() {
    ensureChamber();
    const members = state.chamber.map((slot) => {
      const party = !slot.vacant && slot.partyId
        ? state.parties.find((p) => p.id === slot.partyId)
        : null;
      return {
        party,
        color: party ? party.color : "#3d4a57",
        inOffice: !!(party && party.inOffice),
        leader: !!(slot.leader && party),
        member: party ? slot.member : "Vacant",
        ministries: []
      };
    });
    const sitting = members.filter((m) => m.party);
    sitting.sort((a, b) => Number(b.inOffice) - Number(a.inOffice) || Number(b.leader) - Number(a.leader));
    const portfolios = state.ministries.slice().sort((a, b) => b.alloc - a.alloc);
    if (sitting.length && portfolios.length) {
      portfolios.forEach((min, i) => {
        sitting[i % sitting.length].ministries.push(min);
      });
    }
    const places = [];
    members.forEach((m) => {
      const partyName = m.party ? m.party.name : "Vacant";
      const role = m.party ? (m.inOffice ? "Government" : m.party.name) : "Vacant";
      const held = m.ministries.length ? m.ministries : [null];
      if (!m.party) {
        places.push({
          color: m.color,
          inOffice: false,
          leader: false,
          member: "Vacant",
          party: "Vacant",
          ministry: "Vacant",
          extra: 0,
          extraList: [],
          fullMinistries: [],
          role: "Vacant"
        });
        return;
      }
      held.forEach((min, idx) => {
        places.push({
          color: m.color,
          inOffice: m.inOffice,
          leader: m.leader && idx === 0,
          member: m.member,
          party: partyName,
          ministry: min ? shortPortfolio(min.name) : "No portfolio",
          extra: 0,
          extraList: [],
          fullMinistries: min ? [min.name] : [],
          role: role
        });
      });
    });
    return places;
  }

  function drawAll() {
    const C = window.StatecraftCharts;
    const seated = allocateSeats();
    const table = cabinetMembers();
    C.chamber($("chamber-canvas"), table);
    C.bars($("support-canvas"), seated.map((s) => ({
      label: s.party.name,
      value: s.pct,
      color: s.party.color
    })));
    $("seat-legend").innerHTML = table.map((m) => {
      const mins = m.fullMinistries.length
        ? m.fullMinistries.join(", ")
        : "Vacant seat";
      const who = m.party === "Vacant"
        ? "Vacant until the next election"
        : escapeHtml(m.party) + (m.inOffice ? " · in office" : "");
      return `<div class="table-leg">
        <i class="swatch" style="background:${m.color};margin-top:5px"></i>
        <div>
          <strong>${escapeHtml(m.member)}${m.leader ? " · leader" : ""}</strong>
          <em>${escapeHtml(mins)}</em>
          <span>${who}</span>
        </div>
      </div>`;
    }).join("");

    const termsEmpty = $("terms-empty");
    if (!state.terms.length) {
      termsEmpty.hidden = false;
      C.lines($("terms-canvas"), ["Term"], state.parties.map((p) => ({ color: p.color, values: [0] })));
    } else {
      termsEmpty.hidden = true;
      const labels = state.terms.map((t) => t.label);
      C.lines($("terms-canvas"), labels, state.parties.map((p) => ({
        color: p.color,
        values: state.terms.map((t) => {
          const hit = t.shares.find((s) => s.id === p.id);
          return hit ? hit.pct : 0;
        })
      })));
    }

    const mood = derivedMood();
    C.gauge($("happy-gauge"), mood.happy, "#7dcea0", "");
    C.gauge($("lobby-gauge"), mood.lobby, "#e8b86d", "");

    const slices = pieSlices(mood.budget);
    C.pie($("pie-canvas"), slices);
    $("pie-legend").innerHTML = slices.filter((s) => s.value > 0.15).map((s) =>
      `<span><i class="swatch" style="background:${s.color}"></i>${escapeHtml(s.label)} · ${s.value.toFixed(1)}%</span>`
    ).join("");

    C.grouped($("balance-canvas"), mood.budget.rev, mood.budget.spending);
    C.waterfallHistory($("history-canvas"), state.budgetHistory);

    drawWheel();
    drawEstimatePie();
  }

  function drawEstimatePie() {
    const C = window.StatecraftCharts;
    const est = state.lastEstimate;
    const legend = $("est-pie-legend");
    if (!est) {
      C.pie($("est-pie"), [{ label: "None", value: 1, color: "#2a3542" }]);
      legend.innerHTML = "";
      return;
    }
    const colors = ["#5b8def", "#e8b86d", "#7dcea0", "#b07cc6", "#e06c75"];
    const slices = est.mix.map((m, i) => ({ label: m.label, value: m.value, color: colors[i % colors.length] }));
    C.pie($("est-pie"), slices);
    legend.innerHTML = slices.map((s) =>
      `<span><i class="swatch" style="background:${s.color}"></i>${escapeHtml(s.label)} · ${moneySmart(s.value)}</span>`
    ).join("");
  }

  function pieSlices(b) {
    const colors = ["#4ecdc4", "#5b8def", "#e8b86d", "#e06c75", "#7dcea0", "#b07cc6", "#74b9ff", "#f0b27a", "#55efc4", "#fd79a8", "#81ecec", "#fab1a0", "#a29bfe", "#c4a35a", "#636e72"];
    const slices = state.ministries.map((m, i) => ({
      label: m.name,
      value: Math.max(0, m.alloc),
      color: colors[i % colors.length]
    }));
    if (b.unallocatedPct > 0.05) slices.push({ label: "Unallocated", value: b.unallocatedPct, color: "#3d4a57" });
    return slices;
  }

  function wheelSlices() {
    return pollShares().filter((s) => s.pct > 0);
  }

  function drawWheelOn(canvas, slices, angle) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;
    const css = canvas.clientWidth || 280;
    canvas.width = css * ratio;
    canvas.height = css * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const w = css;
    const cx = w / 2;
    const cy = w / 2;
    const r = w * 0.46;
    ctx.clearRect(0, 0, w, w);
    if (!slices.length) {
      ctx.fillStyle = "#8b9aab";
      ctx.font = "14px Manrope, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Add parties to spin", cx, cy);
      return;
    }
    const total = slices.reduce((n, s) => n + s.pct, 0) || 1;
    let a = angle;
    slices.forEach((s) => {
      const da = (s.pct / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a, a + da);
      ctx.closePath();
      ctx.fillStyle = s.party.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(8,12,16,0.45)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a + da / 2);
      ctx.fillStyle = "#0c1116";
      ctx.font = "600 11px Manrope, sans-serif";
      ctx.textAlign = "right";
      const label = s.party.name.length > 16 ? s.party.name.slice(0, 15) + "…" : s.party.name;
      ctx.fillText(label, r - 12, 4);
      ctx.restore();
      a += da;
    });
    ctx.beginPath();
    ctx.fillStyle = "#171e26";
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f0b27a";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function drawWheel() {
    const canvas = $("wheel-canvas");
    if (!canvas) return;
    drawWheelOn(canvas, wheelSlices(), state.wheelAngle);
  }

  function pointerAngle() {
    return -Math.PI / 2;
  }

  function winnerAtAngle(slices, angle) {
    const list = slices || wheelSlices();
    const ang = angle == null ? state.wheelAngle : angle;
    const total = list.reduce((n, s) => n + s.pct, 0) || 1;
    let a = ((pointerAngle() - ang) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    for (const s of list) {
      const da = (s.pct / total) * Math.PI * 2;
      if (a <= da) return s;
      a -= da;
    }
    return list[list.length - 1];
  }

  function spinWheel() {
    if (wheelSpinning || !state.parties.length) return;
    wheelSpinning = true;
    $("spin-wheel").disabled = true;
    const start = performance.now();
    const duration = 2400 + Math.random() * 900;
    const from = state.wheelAngle;
    const sweep = Math.PI * (9 + Math.random() * 6);
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      state.wheelAngle = from + sweep * ease;
      drawWheel();
      if (t < 1) requestAnimationFrame(tick);
      else {
        wheelSpinning = false;
        $("spin-wheel").disabled = false;
        seatWinner(winnerAtAngle());
      }
    };
    requestAnimationFrame(tick);
  }

  function spinElectorateWheel() {
    const el = selectedElectorate();
    if (elWheelSpinning || !el || !state.parties.length) return;
    elWheelSpinning = true;
    const btn = $("el-spin-wheel");
    if (btn) btn.disabled = true;
    const start = performance.now();
    const duration = 2200 + Math.random() * 800;
    const from = el.wheelAngle;
    const sweep = Math.PI * (8 + Math.random() * 6);
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      el.wheelAngle = from + sweep * ease;
      drawWheelOn($("el-wheel-canvas"), electoratePolls(el).filter((s) => s.pct > 0), el.wheelAngle);
      if (t < 1) requestAnimationFrame(tick);
      else {
        elWheelSpinning = false;
        if (btn) btn.disabled = false;
        const win = winnerAtAngle(electoratePolls(el).filter((s) => s.pct > 0), el.wheelAngle);
        if (win) {
          el.dominatesId = win.party.id;
          el.lastElection = { name: win.party.name, leader: win.party.leader, pct: win.pct };
        }
        render();
      }
    };
    requestAnimationFrame(tick);
  }

  function seatWinner(share) {
    if (!share) return;
    state.parties.forEach((p) => { p.inOffice = p.id === share.party.id; });
    seatTheHouse();
    const won = heldSeats(share.party.id);
    state.lastElection = {
      name: share.party.name,
      leader: share.party.leader,
      pct: share.pct,
      seats: won,
      majority: won >= 7
    };
    recordTerm("Election");
    render();
  }

  function recordTerm(reason) {
    const seated = allocateSeats();
    const pref = preferred();
    state.terms.push({
      label: "T" + (state.terms.length + 1),
      reason: reason || "Snapshot",
      preferred: pref ? pref.party.name : "—",
      shares: seated.map((s) => ({ id: s.party.id, pct: s.pct }))
    });
    if (state.terms.length > 12) state.terms.shift();
  }

  function pushBudgetSnap() {
    const b = budget();
    const last = state.budgetHistory[state.budgetHistory.length - 1];
    const point = {
      label: String(state.budgetHistory.length + 1),
      surplus: b.surplus,
      rev: b.rev,
      spending: b.spending
    };
    if (last && Math.abs(last.surplus - point.surplus) < 0.05 && Math.abs(last.rev - point.rev) < 0.05) return;
    state.budgetHistory.push(point);
    if (state.budgetHistory.length > 12) state.budgetHistory.shift();
    state.budgetHistory.forEach((p, i) => { p.label = String(i + 1); });
  }

  function scheduleBudgetSnap() {
    clearTimeout(budgetTimer);
    budgetTimer = setTimeout(() => {
      pushBudgetSnap();
      save();
      window.StatecraftCharts.waterfallHistory($("history-canvas"), state.budgetHistory);
    }, 700);
  }

  function drawEvent() {
    const pool = window.STATECRAFT_EVENTS;
    let pick = pool[Math.floor(Math.random() * pool.length)];
    if (state.lastEvent && pool.length > 1) {
      let guard = 0;
      while (pick.title === state.lastEvent.title && guard++ < 12) {
        pick = pool[Math.floor(Math.random() * pool.length)];
      }
    }
    applyEvent(pick);
  }

  function applyEvent(e) {
    state.eventHappiness = clamp(state.eventHappiness + e.happiness * 0.55, -28, 28);
    state.eventLobbying = clamp(state.eventLobbying + e.lobbying * 0.55, -24, 40);
    state.economy = clamp(state.economy * e.economy, 0.72, 1.35);
    state.parties.forEach((p) => {
      const cur = state.supportEvents[p.id] || 0;
      state.supportEvents[p.id] = clamp(cur + (p.inOffice ? e.supportGov : e.supportOpp), -22, 22);
    });
    let resignNote = "";
    if (e.resign) {
      const left = resignMember(e.resign);
      if (left) {
        resignNote = left.member + " (" + left.partyName + ") left the chamber. That seat stays vacant until the next election.";
      }
    }
    state.lastEvent = { ...e, resignNote };
    state.eventLog.unshift({
      title: e.title,
      tag: e.tag,
      when: new Date().toLocaleTimeString()
    });
    state.eventLog = state.eventLog.slice(0, 10);
    pushBudgetSnap();
    render();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function render() {
    ensureChamber();
    renderKpis();
    renderParties();
    renderTaxes();
    renderMinistries();
    renderEvents();
    renderWheelResult();
    fillEstimatorMinistries();
    renderEstimator();
    renderElectorates();
    drawAll();
    save();
  }

  function fillEstimatorMinistries() {
    const sel = $("est-ministry");
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = state.ministries.map((m) =>
      `<option value="${m.id}">${escapeHtml(m.name)}</option>`
    ).join("");
    if ([...sel.options].some((o) => o.value === cur)) sel.value = cur;
  }

  function pipelineTotal() {
    return (state.projects || []).reduce((n, p) => n + p.total, 0);
  }

  function renderEstimator() {
    const est = state.lastEstimate;
    const rev = revenue();
    const pipe = pipelineTotal();
    $("kpi-est-pipe").textContent = pipe ? moneySmart(pipe) : "$0";
    if (!est) {
      $("kpi-est-cost").textContent = "—";
      $("kpi-est-range").textContent = "Analyse a brief to price it";
      $("kpi-est-share").textContent = "—";
      $("kpi-est-min").textContent = "—";
      $("kpi-est-min-note").textContent = "Years of that portfolio’s current funding";
      $("est-result").className = "est-result empty";
      $("est-result").textContent = "No brief analysed yet. Pick a ministry and describe the project.";
      $("est-file").disabled = true;
    } else {
      $("kpi-est-cost").textContent = moneySmart(est.total);
      $("kpi-est-range").textContent = moneySmart(est.low) + " – " + moneySmart(est.high);
      $("kpi-est-share").textContent = rev > 0 ? ((est.total / rev) * 100).toFixed(1) + "%" : "—";
      const min = state.ministries.find((m) => m.id === est.ministryId);
      const slice = min ? ministrySpend(min, rev) : 0;
      const yearsOf = slice > 0.05 ? est.total / slice : null;
      $("kpi-est-min").textContent = yearsOf ? yearsOf.toFixed(1) + "×" : "—";
      $("kpi-est-min-note").textContent = min
        ? (yearsOf ? "Times " + min.name + "’s current annual slice" : min.name + " has almost no slice")
        : "No presenting ministry";
      $("est-file").disabled = false;
      const fitLabel = est.alignment === "aligned" ? "Good ministry fit" : est.alignment === "related" ? "Cousin portfolio" : "Poor ministry fit";
      $("est-result").className = "est-result";
      $("est-result").innerHTML = `
        <p class="est-kicker">${escapeHtml(est.ministryName)} presents</p>
        <h3>${escapeHtml(est.title)}</h3>
        <p class="cost-hero">${moneySmart(est.total)}</p>
        <p class="hint">${est.annualProgram ? "Programme cost over " + est.years + " years" : "Capital envelope"} · range ${moneySmart(est.low)} – ${moneySmart(est.high)} · about ${moneySmart(est.annual)} a year</p>
        <div class="chips">
          <span class="chip">${escapeHtml(est.typeName)}</span>
          <span class="chip">${escapeHtml(est.scaleLabel)}</span>
          <span class="chip">${est.years} year${est.years === 1 ? "" : "s"}</span>
          <span class="chip">${fitLabel}</span>
        </div>
        <ul class="est-findings">${est.findings.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul>
        <p class="hint">If funded: happiness ${est.happy >= 0 ? "+" : ""}${est.happy}, lobbying ${est.lobby >= 0 ? "+" : ""}${est.lobby} — shown as a steer, not applied until you change the budget yourself.</p>`;
    }

    const pipeBox = $("est-pipeline");
    if (!(state.projects || []).length) {
      pipeBox.className = "est-pipeline empty";
      pipeBox.textContent = "Nothing filed yet.";
      return;
    }
    pipeBox.className = "est-pipeline";
    pipeBox.innerHTML = state.projects.map((p) => `
      <article class="pipe-card">
        <div>
          <strong>${escapeHtml(p.title)}</strong>
          <span>${escapeHtml(p.ministryName)} · ${escapeHtml(p.typeName)} · ${escapeHtml(p.scaleLabel)}</span>
        </div>
        <b>${moneySmart(p.total)}</b>
        <button type="button" class="tiny danger" data-unfile="${p.id}">Remove</button>
      </article>`).join("");
  }

  function currentEstimateInput() {
    const ministry = state.ministries.find((m) => m.id === $("est-ministry").value);
    return {
      title: $("est-title").value,
      body: $("est-body").value,
      scale: $("est-scale").value,
      years: $("est-years").value,
      ministry,
      economy: state.economy
    };
  }

  function runEstimate() {
    const title = $("est-title").value.trim();
    const body = $("est-body").value.trim();
    if (!title && !body) return;
    state.lastEstimate = window.StatecraftEstimate.analyse(currentEstimateInput());
    renderEstimator();
    drawEstimatePie();
    save();
  }

  function fileEstimate() {
    if (!state.lastEstimate) return;
    const copy = Object.assign({ id: uid("proj") }, state.lastEstimate);
    state.projects.unshift(copy);
    state.projects = state.projects.slice(0, 24);
    renderEstimator();
    save();
  }

  function impactCoef(impact) {
    if (impact === "people") return { happy: 0.4, lobby: 0.28 };
    if (impact === "business") return { happy: 0.06, lobby: -0.4 };
    if (impact === "neutral") return { happy: 0.14, lobby: 0.05 };
    return null;
  }

  function fillPartyHomeSelect(selected) {
    const sel = $("new-party-home");
    if (!sel) return;
    sel.innerHTML = '<option value="">None — contest everywhere</option>' +
      (state.electorates || []).map((e) =>
        `<option value="${e.id}">${escapeHtml(e.name)}</option>`
      ).join("");
    sel.value = selected || "";
  }

  function setPartyTierSlider(tier) {
    const i = Math.max(0, TIER_LABELS.indexOf(tier || "major"));
    $("new-party-tier").value = String(i);
    $("new-party-tier-val").textContent = TIER_NAMES[i];
  }

  function currentPartyTier() {
    return TIER_LABELS[Number($("new-party-tier").value)] || "major";
  }

  function openPartyModal(editId, opts) {
    editingPartyId = editId || null;
    editingMinistryId = null;
    editingElectorateId = null;
    $("modal-root").hidden = false;
    $("party-modal").hidden = false;
    $("ministry-modal").hidden = true;
    $("electorate-modal").hidden = true;
    $("party-modal-title").textContent = editingPartyId ? "Edit party" : "Add a party";
    $("confirm-party").textContent = editingPartyId ? "Save party" : "Add party";
    const homeFromEl = opts && opts.electorateId ? opts.electorateId : "";
    if (editingPartyId) {
      const p = state.parties.find((x) => x.id === editingPartyId);
      if (!p) return;
      $("new-party-name").value = p.name;
      $("new-party-leader").value = p.leader;
      $("new-party-ideo").value = (p.ideologies || []).join(", ");
      $("new-party-color").value = p.color;
      setPartyTierSlider(partyTier(p));
      fillPartyHomeSelect(p.homeElectorate || "");
    } else {
      $("new-party-name").value = "";
      $("new-party-leader").value = "";
      $("new-party-ideo").value = "";
      const unused = PALETTE.find((c) => !state.parties.some((p) => p.color.toLowerCase() === c.toLowerCase()));
      $("new-party-color").value = unused || "#4ecdc4";
      setPartyTierSlider(homeFromEl ? "independent" : "major");
      fillPartyHomeSelect(homeFromEl);
    }
  }

  function openMinistryModal(editId) {
    editingMinistryId = editId || null;
    editingPartyId = null;
    editingElectorateId = null;
    $("modal-root").hidden = false;
    $("party-modal").hidden = true;
    $("ministry-modal").hidden = false;
    $("electorate-modal").hidden = true;
    $("ministry-modal-title").textContent = editingMinistryId ? "Edit ministry" : "Add a ministry";
    $("confirm-ministry").textContent = editingMinistryId ? "Save ministry" : "Add ministry";
    const original = $("min-impact-original");
    original.hidden = true;
    original.disabled = true;
    if (editingMinistryId) {
      const m = state.ministries.find((x) => x.id === editingMinistryId);
      if (!m) return;
      $("new-min-name").value = m.name;
      $("new-min-brief").value = m.brief || (MINISTRY_BRIEFS[m.id] || "");
      $("new-min-savings").checked = !!m.savings;
      if (m.impact === "preset") {
        original.hidden = false;
        original.disabled = false;
        $("new-min-impact").value = "preset";
      } else {
        original.hidden = m.custom;
        original.disabled = m.custom;
        $("new-min-impact").value = m.impact || "neutral";
      }
    } else {
      $("new-min-name").value = "";
      $("new-min-brief").value = "";
      $("new-min-savings").checked = false;
      $("new-min-impact").value = "neutral";
    }
  }

  function closeModal() {
    $("modal-root").hidden = true;
    $("party-modal").hidden = true;
    $("ministry-modal").hidden = true;
    $("electorate-modal").hidden = true;
    editingPartyId = null;
    editingMinistryId = null;
    editingElectorateId = null;
  }

  function saveParty() {
    const name = $("new-party-name").value.trim();
    const leader = $("new-party-leader").value.trim();
    const ideologies = $("new-party-ideo").value.split(",").map((s) => s.trim()).filter(Boolean);
    if (!name || !leader) return;
    const picked = $("new-party-color").value;
    const tier = currentPartyTier();
    const homeElectorate = $("new-party-home").value || "";
    if (editingPartyId) {
      const p = state.parties.find((x) => x.id === editingPartyId);
      if (!p) return;
      const oldLeader = p.leader;
      p.name = name;
      p.leader = leader;
      p.ideologies = ideologies.length ? ideologies : ["Unspecified"];
      p.color = picked;
      p.tier = tier;
      p.homeElectorate = homeElectorate;
      (state.chamber || []).forEach((s) => {
        if (s.partyId === p.id && s.leader) s.member = leader;
        else if (s.partyId === p.id && s.member === oldLeader) s.member = leader;
      });
    } else {
      const used = PALETTE.filter((c) => !state.parties.some((p) => p.color.toLowerCase() === c.toLowerCase()));
      const clash = state.parties.some((p) => p.color.toLowerCase() === picked.toLowerCase());
      state.parties.push({
        id: uid("p"),
        name,
        leader,
        ideologies: ideologies.length ? ideologies : ["Unspecified"],
        color: clash ? (used[0] || picked) : picked,
        inOffice: state.parties.length === 0,
        tier,
        homeElectorate
      });
    }
    $("new-party-name").value = "";
    $("new-party-leader").value = "";
    $("new-party-ideo").value = "";
    closeModal();
    render();
  }

  function openElectorateModal(editId) {
    editingElectorateId = editId || null;
    editingPartyId = null;
    editingMinistryId = null;
    $("modal-root").hidden = false;
    $("party-modal").hidden = true;
    $("ministry-modal").hidden = true;
    $("electorate-modal").hidden = false;
    $("electorate-modal-title").textContent = editingElectorateId ? "Edit electorate" : "Add an electorate";
    $("confirm-electorate").textContent = editingElectorateId ? "Save electorate" : "Add electorate";
    if (editingElectorateId) {
      const el = state.electorates.find((x) => x.id === editingElectorateId);
      if (!el) return;
      $("new-el-name").value = el.name;
      $("new-el-brief").value = el.brief || "";
    } else {
      $("new-el-name").value = "";
      $("new-el-brief").value = "";
    }
  }

  function saveElectorate() {
    const name = $("new-el-name").value.trim();
    if (!name) return;
    const brief = $("new-el-brief").value.trim();
    if (editingElectorateId) {
      const el = state.electorates.find((x) => x.id === editingElectorateId);
      if (!el) return;
      el.name = name;
      el.brief = brief;
    } else {
      const created = {
        id: uid("el"),
        name,
        brief,
        alloc: 8,
        wheelAngle: -Math.PI / 2,
        dominatesId: null,
        lastElection: null
      };
      state.electorates.push(created);
      state.selectedElectorateId = created.id;
    }
    $("new-el-name").value = "";
    $("new-el-brief").value = "";
    closeModal();
    render();
  }

  function saveMinistry() {
    const name = $("new-min-name").value.trim();
    if (!name) return;
    const brief = $("new-min-brief").value.trim();
    const impact = $("new-min-impact").value;
    const savings = $("new-min-savings").checked;
    if (editingMinistryId) {
      const m = state.ministries.find((x) => x.id === editingMinistryId);
      if (!m) return;
      m.name = name;
      m.brief = brief;
      m.savings = savings;
      m.impact = impact;
      const coef = impactCoef(impact);
      if (coef) {
        m.happy = coef.happy;
        m.lobby = coef.lobby;
      }
    } else {
      const coef = impactCoef(impact) || { happy: 0.2, lobby: 0.1 };
      state.ministries.push({
        id: uid("m"),
        name,
        alloc: 3,
        custom: true,
        impact: impact === "preset" ? "neutral" : impact,
        brief,
        happy: coef.happy,
        lobby: coef.lobby,
        ideal: 5,
        savings
      });
    }
    $("new-min-name").value = "";
    $("new-min-brief").value = "";
    $("new-min-savings").checked = false;
    closeModal();
    render();
    scheduleBudgetSnap();
  }

  function bind() {
    document.querySelectorAll(".tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach((b) => {
          b.classList.toggle("is-active", b === btn);
          b.setAttribute("aria-selected", b === btn ? "true" : "false");
        });
        const id = btn.dataset.tab;
        ["overview", "calculator", "estimator", "electorates"].forEach((t) => {
          $("tab-" + t).hidden = id !== t;
          $("tab-" + t).classList.toggle("is-active", id === t);
        });
        requestAnimationFrame(() => {
          drawAll();
          if (id === "electorates") drawElectorateView();
        });
      });
    });

    $("party-list").addEventListener("click", (e) => {
      const office = e.target.dataset.office;
      const remove = e.target.dataset.remove;
      const editParty = e.target.dataset.editParty;
      if (editParty) {
        openPartyModal(editParty);
        return;
      }
      if (office) {
        const p = state.parties.find((x) => x.id === office);
        if (p) p.inOffice = !p.inOffice;
        render();
      }
      if (remove) {
        vacateParty(remove);
        state.parties = state.parties.filter((x) => x.id !== remove);
        delete state.supportEvents[remove];
        (state.electorates || []).forEach((el) => {
          if (el.dominatesId === remove) el.dominatesId = null;
        });
        render();
      }
    });

    $("tax-sliders").addEventListener("input", (e) => {
      const key = e.target.dataset.tax;
      if (!key) return;
      state.taxes[key] = Number(e.target.value);
      e.target.parentElement.querySelector("output").textContent = state.taxes[key].toFixed(1) + "%";
      fillTaxTable();
      updateAllocMeter();
      updateElectorateMeter();
      renderParties();
      renderKpis();
      drawAll();
      save();
      scheduleBudgetSnap();
    });

    $("ministry-list").addEventListener("input", (e) => {
      const id = e.target.dataset.alloc;
      if (!id) return;
      const m = state.ministries.find((x) => x.id === id);
      if (!m) return;
      m.alloc = Number(e.target.value);
      e.target.parentElement.querySelector("output").textContent = m.alloc.toFixed(1) + "%";
      updateAllocMeter();
      updateElectorateMeter();
      renderParties();
      renderKpis();
      drawAll();
      save();
      scheduleBudgetSnap();
    });

    $("ministry-list").addEventListener("click", (e) => {
      const editId = e.target.dataset.editMin;
      if (editId) {
        openMinistryModal(editId);
        return;
      }
      const id = e.target.dataset.removeMin;
      if (!id) return;
      const gone = state.ministries.find((m) => m.id === id);
      if (!gone || gone.locked || gone.id === "electorate") return;
      state.ministries = state.ministries.filter((m) => m.id !== id);
      render();
      scheduleBudgetSnap();
    });

    $("ministry-list").addEventListener("pointerover", (e) => {
      const btn = e.target.closest(".info-btn");
      if (btn) showMinistryTip(btn);
    });
    $("ministry-list").addEventListener("pointerout", (e) => {
      const btn = e.target.closest(".info-btn");
      if (!btn) return;
      const next = e.relatedTarget;
      if (next && (next === btn || btn.contains(next))) return;
      hideMinistryTip();
    });
    $("ministry-list").addEventListener("focusin", (e) => {
      const btn = e.target.closest(".info-btn");
      if (btn) showMinistryTip(btn);
    });
    $("ministry-list").addEventListener("focusout", (e) => {
      if (!e.target.closest(".info-btn")) return;
      hideMinistryTip();
    });
    $("ministry-list").addEventListener("scroll", hideMinistryTip);

    $("open-party-modal").addEventListener("click", () => openPartyModal());
    $("open-ministry-modal").addEventListener("click", () => openMinistryModal());
    $("open-electorate-modal").addEventListener("click", () => openElectorateModal());
    $("confirm-party").addEventListener("click", saveParty);
    $("confirm-ministry").addEventListener("click", saveMinistry);
    $("confirm-electorate").addEventListener("click", saveElectorate);
    $("new-party-tier").addEventListener("input", () => {
      $("new-party-tier-val").textContent = TIER_NAMES[Number($("new-party-tier").value)] || "Major";
    });
    document.querySelectorAll("[data-close-modal]").forEach((b) => b.addEventListener("click", closeModal));
    $("modal-root").addEventListener("click", (e) => { if (e.target === $("modal-root")) closeModal(); });

    $("electorate-list").addEventListener("input", (e) => {
      const id = e.target.dataset.elAlloc;
      if (!id) return;
      const el = state.electorates.find((x) => x.id === id);
      if (!el) return;
      el.alloc = Number(e.target.value);
      updateElectorateMeter();
      save();
    });
    $("electorate-list").addEventListener("click", (e) => {
      const editId = e.target.dataset.editEl;
      if (editId) {
        openElectorateModal(editId);
        return;
      }
      const removeId = e.target.dataset.removeEl;
      if (removeId) {
        state.electorates = state.electorates.filter((x) => x.id !== removeId);
        state.parties.forEach((p) => {
          if (p.homeElectorate === removeId) p.homeElectorate = "";
        });
        if (state.selectedElectorateId === removeId) {
          state.selectedElectorateId = state.electorates[0] ? state.electorates[0].id : null;
        }
        render();
        return;
      }
      const card = e.target.closest("[data-open-el]");
      if (!card) return;
      state.selectedElectorateId = card.dataset.openEl;
      renderElectorates();
      save();
    });
    $("electorate-detail").addEventListener("click", (e) => {
      if (e.target.id === "el-clear") {
        state.selectedElectorateId = null;
        renderElectorates();
        save();
        return;
      }
      if (e.target.id === "el-spin-wheel") {
        spinElectorateWheel();
        return;
      }
      const add = e.target.dataset.elAddParty;
      if (add) openPartyModal(null, { electorateId: add });
    });

    $("spin-wheel").addEventListener("click", spinWheel);
    $("draw-event").addEventListener("click", drawEvent);
    $("est-analyse").addEventListener("click", runEstimate);
    $("est-file").addEventListener("click", fileEstimate);
    $("est-pipeline").addEventListener("click", (e) => {
      const id = e.target.dataset.unfile;
      if (!id) return;
      state.projects = state.projects.filter((p) => p.id !== id);
      renderEstimator();
      save();
    });
    $("snapshot-term").addEventListener("click", () => {
      recordTerm("Manual");
      render();
    });
    $("reset-sandbox").addEventListener("click", () => {
      if (!confirm("Reset the whole sandbox to the starter cabinet?")) return;
      state = defaultState();
      render();
    });

    window.addEventListener("resize", () => requestAnimationFrame(() => {
      drawAll();
      drawElectorateView();
    }));
  }

  bind();
  if (!state.budgetHistory.length) pushBudgetSnap();
  render();
})();
