window.StatecraftEstimate = (function () {
  const CATALOG = [
    { id: "hospital", name: "Hospital / health campus", keys: ["hospital", "health campus", "icu", "infirmar", "medical centre", "medical center", "emergency department", "a&e", "surgical"], base: 1.45, annual: false, ministries: ["health"], happy: 9, lobby: 2 },
    { id: "clinic", name: "Clinic or GP super-clinic", keys: ["clinic", "gp ", "day surgery", "community health", "mental health hub"], base: 0.22, annual: false, ministries: ["health"], happy: 6, lobby: 1 },
    { id: "pharma", name: "Medicines / vaccine programme", keys: ["vaccine", "pharma", "drug subsidy", "pbs", "medicine"], base: 1.1, annual: true, ministries: ["health"], happy: 7, lobby: 5 },
    { id: "school", name: "School build or rebuild", keys: ["school", "classroom", "primary school", "high school", "kindergarten", "early childhood"], base: 0.085, annual: false, ministries: ["education"], happy: 6, lobby: 1 },
    { id: "uni", name: "University or TAFE campus", keys: ["university", "campus", "tafe", "college", "lecture hall"], base: 0.72, annual: false, ministries: ["education"], happy: 5, lobby: 2 },
    { id: "highway", name: "Highway / motorway", keys: ["highway", "motorway", "freeway", "bypass", "ring road", "duplication"], base: 2.4, annual: false, ministries: ["infra"], happy: 4, lobby: -3 },
    { id: "metro", name: "Metro, light rail or heavy rail", keys: ["metro", "subway", "light rail", "tram", "underground", "rail line", "train line", "high speed"], base: 8.8, annual: false, ministries: ["infra"], happy: 7, lobby: -2 },
    { id: "airport", name: "Airport or runway", keys: ["airport", "runway", "terminal", "airfield"], base: 3.1, annual: false, ministries: ["infra", "trade"], happy: 3, lobby: -4 },
    { id: "port", name: "Port or freight terminal", keys: ["seaport", "container port", "harbour", "harbor", "docklands"], base: 2.2, annual: false, ministries: ["infra", "trade"], happy: 2, lobby: -5 },
    { id: "housing", name: "Housing supply", keys: ["housing", "homes", "dwellings", "apartments", "social housing", "public housing", "build-to-rent"], base: 1.35, annual: false, ministries: ["housing"], happy: 8, lobby: 3 },
    { id: "homeless", name: "Homelessness response", keys: ["homeless", "rough sleep", "shelter", "crisis accom"], base: 0.45, annual: true, ministries: ["housing", "social"], happy: 7, lobby: 1 },
    { id: "naval", name: "Naval ships or submarines", keys: ["submarine", "frigate", "destroyer", "naval", "warship", "aukus"], base: 14, annual: false, ministries: ["defence"], happy: 1, lobby: -6 },
    { id: "airforce", name: "Combat aircraft or drones", keys: ["fighter", "f-35", "aircraft", "drone fleet", "air force", "helicopter"], base: 6.5, annual: false, ministries: ["defence"], happy: 0, lobby: -5 },
    { id: "barracks", name: "Bases and barracks", keys: ["barracks", "base upgrade", "defence estate", "armoury"], base: 0.9, annual: false, ministries: ["defence"], happy: 1, lobby: -3 },
    { id: "embassy", name: "Embassy or consulate", keys: ["embassy", "consulate", "high commission", "diplomatic"], base: 0.16, annual: false, ministries: ["foreign"], happy: 2, lobby: -1 },
    { id: "aid", name: "Overseas aid package", keys: ["foreign aid", "aid package", "development assistance", "humanitarian"], base: 0.55, annual: true, ministries: ["foreign"], happy: 3, lobby: 2 },
    { id: "prison", name: "Prison or detention", keys: ["prison", "jail", "correctional", "detention centre", "detention center"], base: 0.85, annual: false, ministries: ["judicial", "home"], happy: -1, lobby: 1 },
    { id: "court", name: "Courthouse or legal aid", keys: ["courthouse", "court complex", "legal aid", "tribunal"], base: 0.38, annual: false, ministries: ["judicial"], happy: 3, lobby: 0 },
    { id: "border", name: "Borders and policing", keys: ["border", "customs", "immigration centre", "police station", "surveillance"], base: 0.7, annual: false, ministries: ["home"], happy: 2, lobby: 1 },
    { id: "welfare", name: "Welfare or pension expansion", keys: ["welfare", "pension", "jobseeker", "centrelink", "family payment", "universal basic"], base: 3.4, annual: true, ministries: ["social"], happy: 8, lobby: 6 },
    { id: "park", name: "National park or wildlife", keys: ["national park", "wildlife corridor", "rewild", "sanctuary", "conservation"], base: 0.28, annual: false, ministries: ["agriculture"], happy: 5, lobby: 2 },
    { id: "farm", name: "Farm, drought or irrigation", keys: ["irrigation", "drought", "dam", "silo", "farm subsidy", "biosecurity", "agri"], base: 0.95, annual: false, ministries: ["agriculture"], happy: 3, lobby: -2 },
    { id: "jobs", name: "Jobs and training scheme", keys: ["job program", "job programme", "apprentice", "retrain", "unemployment scheme", "wage subsidy"], base: 0.62, annual: true, ministries: ["labour", "education"], happy: 6, lobby: 4 },
    { id: "trade", name: "Trade mission or export deal", keys: ["trade mission", "export deal", "free trade", "tariff", "market access"], base: 0.12, annual: false, ministries: ["trade"], happy: 2, lobby: -4 },
    { id: "renewable", name: "Renewables or grid", keys: ["solar", "wind farm", "renewable", "battery", "grid", "transmission", "hydrogen", "nuclear"], base: 4.2, annual: false, ministries: ["infra", "trade"], happy: 5, lobby: 3 },
    { id: "stadium", name: "Stadium or arena", keys: ["stadium", "arena", "olympic", "sport precinct"], base: 1.6, annual: false, ministries: ["infra"], happy: 4, lobby: -1 },
    { id: "digital", name: "Digital network or data", keys: ["broadband", "nbn", "fibre", "fiber", "data centre", "data center", "cyber"], base: 2.8, annual: false, ministries: ["infra", "home"], happy: 4, lobby: -2 },
    { id: "flood", name: "Flood, fire or disaster works", keys: ["flood", "levee", "bushfire", "disaster recovery", "rebuild after", "cyclone"], base: 1.15, annual: false, ministries: ["home", "infra"], happy: 6, lobby: 1 },
    { id: "grants", name: "Electorate grants package", keys: ["electorate grant", "local grant", "community grant", "main street", "town hall upgrade"], base: 0.35, annual: true, ministries: ["electorate", "infra"], happy: 5, lobby: 1 },
    { id: "lab", name: "Research laboratory", keys: ["laboratory", "research institute", "csiro", "science hub"], base: 0.48, annual: false, ministries: ["education", "health"], happy: 4, lobby: 1 }
  ];

  const SCALE = {
    local: { label: "Local / suburb", mult: 0.32 },
    city: { label: "City", mult: 1 },
    state: { label: "Statewide / regional", mult: 2.55 },
    national: { label: "National", mult: 4.7 }
  };

  function hash01(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return ((h >>> 0) % 1000) / 1000;
  }

  function hits(text, keys) {
    return keys.filter((k) => text.includes(k)).length;
  }

  function pickType(text) {
    let best = null;
    let score = 0;
    CATALOG.forEach((c) => {
      const n = hits(text, c.keys);
      const weighted = n * 2 + (c.keys.some((k) => text.includes(k) && k.length > 8) ? 1 : 0);
      if (weighted > score) {
        score = weighted;
        best = c;
      }
    });
    return { type: best, score };
  }

  function detectScale(text, chosen) {
    if (chosen && SCALE[chosen]) return chosen;
    if (/\b(national|nationwide|whole country|federally)\b/.test(text)) return "national";
    if (/\b(statewide|state-wide|regional|province)\b/.test(text)) return "state";
    if (/\b(suburb|local|village|town|single site)\b/.test(text)) return "local";
    return "city";
  }

  function countBoost(text, type) {
    let mult = 1;
    const nUnits = text.match(/(\d[\d,]*)\s*(hospital|school|clinic|prison|campus|station|submarine|frigate|jet|tower)/);
    if (nUnits) {
      const n = Number(nUnits[1].replace(/,/g, ""));
      if (n > 1 && n < 80) mult *= Math.min(12, 0.72 + n * 0.55);
    }
    const km = text.match(/(\d[\d,]*)\s*(km|kilometre|kilometer)/);
    if (km && (type.id === "highway" || type.id === "metro" || type.id === "digital")) {
      const n = Number(km[1].replace(/,/g, ""));
      mult *= Math.max(0.4, Math.min(8, n / (type.id === "metro" ? 18 : 40)));
    }
    const homes = text.match(/(\d[\d,]*)\s*(homes|houses|dwellings|apartments|units)/);
    if (homes && (type.id === "housing" || type.id === "homeless")) {
      const n = Number(homes[1].replace(/,/g, ""));
      const per = type.id === "homeless" ? 0.00008 : 0.00042;
      return { mult: 1, override: Math.max(0.12, n * per) };
    }
    return { mult, override: null };
  }

  function fit(ministry, type) {
    if (!ministry) return "unknown";
    if (type.ministries.includes(ministry.id)) return "aligned";
    const name = (ministry.name || "").toLowerCase();
    if (type.keys.some((k) => name.includes(k))) return "aligned";
    if (type.ministries.some((id) => name.includes(id))) return "related";
    return "stretch";
  }

  function analyse(input) {
    const title = (input.title || "").trim();
    const body = (input.body || "").trim();
    const text = (title + " " + body).toLowerCase();
    const years = Math.max(1, Math.min(20, Number(input.years) || 4));
    const ministry = input.ministry;
    const picked = pickType(text);
    const generic = {
      id: "generic",
      name: "Unclassified public project",
      keys: [],
      base: 0.55,
      annual: false,
      ministries: ministry ? [ministry.id] : [],
      happy: 3,
      lobby: 1
    };
    const type = picked.type || generic;
    const scaleKey = detectScale(text, input.scale);
    const scale = SCALE[scaleKey];
    const counts = countBoost(text, type);
    const site = 0.93 + hash01(title + "|" + body + "|" + (ministry && ministry.id)) * 0.14;
    let economy = Number(input.economy) || 1;

    let capital = type.base * scale.mult * counts.mult * site * economy;
    if (counts.override != null) capital = counts.override * scale.mult * site * economy;

    if (/\b(pilot|trial|prototype|demo)\b/.test(text)) capital *= 0.38;
    if (/\b(upgrade|refurbish|retrofit|maintenance)\b/.test(text)) capital *= 0.62;
    if (/\b(new build|from scratch|greenfield)\b/.test(text)) capital *= 1.12;
    if (/\b(emergency|urgent|fast-track|immediately)\b/.test(text)) capital *= 1.16;
    if (/\b(underground|tunnel|subsea)\b/.test(text)) capital *= 1.35;
    if (/\b(luxury|iconic|world-class|flagship)\b/.test(text)) capital *= 1.22;
    if (/\b(modular|prefab|off-the-shelf)\b/.test(text)) capital *= 0.84;

    const alignment = fit(ministry, type);
    let stretch = 1;
    if (alignment === "stretch") stretch = 1.18;
    if (alignment === "related") stretch = 1.06;
    capital *= stretch;

    if (!type.annual) capital *= Math.pow(1.035, Math.max(0, years - 3));

    const total = type.annual ? capital * years : capital;
    const annual = type.annual ? capital : total / years;
    const low = total * 0.82;
    const high = total * 1.28;

    const works = type.annual ? 0.12 : 0.44;
    const labour = type.annual ? 0.48 : 0.27;
    const land = type.annual ? 0.04 : 0.11;
    const kit = type.annual ? 0.22 : 0.1;
    const contingency = 1 - works - labour - land - kit;

    const findings = [];
    if (!picked.type) findings.push("No close match in the catalogue — priced as a generic public project for this ministry.");
    else findings.push("Read as: " + type.name + ".");
    findings.push("Scale applied: " + scale.label + " (×" + scale.mult + ").");
    if (type.annual) findings.push("This looks like an ongoing programme. Cost is annual outlay times the delivery window.");
    else findings.push("This looks like capital works. Total is spread across " + years + " delivery year" + (years === 1 ? "" : "s") + ".");
    if (alignment === "aligned") findings.push((ministry ? ministry.name : "This ministry") + " is a natural home for the work, so the estimate assumes normal procurement.");
    if (alignment === "related") findings.push("The presenting ministry is only a cousin of this work. A modest coordination premium is in the price.");
    if (alignment === "stretch") findings.push("The presenting ministry is a poor fit. A stretch premium is included for dual-agency overhead and rework.");
    if (/\b(pilot|trial)\b/.test(text)) findings.push("Pilot language cut the envelope sharply. A full rollout would be several times this.");
    if (counts.override) findings.push("A dwelling or unit count in the brief was used to size the envelope.");
    if (text.length < 40) findings.push("The brief is thin. A longer specification would tighten the range.");

    return {
      title: title || "Untitled project",
      body,
      ministryId: ministry ? ministry.id : "",
      ministryName: ministry ? ministry.name : "Unassigned",
      typeId: type.id,
      typeName: type.name,
      scale: scaleKey,
      scaleLabel: scale.label,
      years,
      annualProgram: type.annual,
      total,
      annual,
      low,
      high,
      alignment,
      happy: type.happy,
      lobby: type.lobby,
      findings,
      mix: [
        { label: "Works / construction", value: total * works, share: works },
        { label: "Labour", value: total * labour, share: labour },
        { label: "Land & planning", value: total * land, share: land },
        { label: "Equipment & systems", value: total * kit, share: kit },
        { label: "Contingency", value: total * contingency, share: contingency }
      ]
    };
  }

  return { analyse, SCALE };
})();
