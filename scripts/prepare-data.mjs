/**
 * Genera src/data/dataset.json a partire dai CSV in /datasets:
 *
 * - ucs_satellites.csv: censimento UCS dei satelliti (chi, cosa, perche).
 * - satcat.csv: catalogo SATCAT di tutti gli oggetti tracciati (dati orbitali,
 *   detriti, stadi, componenti dal 1957 al 2026).
 * - asi.csv: registro spaziale italiano dell'ASI (missioni italiane dal 1964).
 *
 * Lo script non ha dipendenze esterne: si lancia con `npm run data`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const datasetsDir = path.join(root, 'datasets');
const outputFile = path.join(root, 'src', 'data', 'dataset.json');

/** Parser CSV minimale ma corretto (supporta virgola o punto e virgola, virgolette e a capo). */
function parseCsv(text, delimiter = ',') {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const header = rows.shift().map((name) => name.replace(/^\uFEFF/, '').trim());
  return rows
    .filter((cells) => cells.some((cell) => cell.trim() !== ''))
    .map((cells) => Object.fromEntries(header.map((name, index) => [name, cells[index] ?? ''])));
}

function readCsv(fileName, delimiter = ',') {
  const fullPath = path.join(datasetsDir, fileName);
  return parseCsv(fs.readFileSync(fullPath, 'utf8'), delimiter);
}

function text(value) {
  return (value ?? '').trim();
}

function numberOrNull(value) {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).replace(',', '.').replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizePurpose(raw) {
  const value = text(raw);
  if (value.startsWith('Communications')) return 'Comunicazioni';
  if (
    value.startsWith('Earth Observation') ||
    value.startsWith('Earth Science') ||
    value.startsWith('Earth/Space') ||
    value.startsWith('Meteorological')
  ) {
    return 'Osservazione della Terra';
  }
  if (value.startsWith('Navigation') || value.startsWith('Satellite Positioning')) {
    return 'Navigazione';
  }
  if (value.startsWith('Technology') || value.startsWith('Mission Extension')) {
    return 'Tecnologia';
  }
  if (value.startsWith('Space Science') || value.startsWith('Space Observation')) {
    return 'Scienza';
  }
  return 'Altro';
}

function normalizeUsers(raw) {
  const value = text(raw).toLowerCase();
  if (value.startsWith('commercial')) return 'Commerciale';
  if (value.startsWith('military')) return 'Militare';
  if (value.startsWith('government')) return 'Governativa';
  if (value.startsWith('civil')) return 'Civile';
  return 'Altro';
}

function normalizeOrbit(raw) {
  const value = text(raw);
  if (value.toUpperCase() === 'LEO') return 'LEO';
  if (value === 'GEO') return 'GEO';
  if (value === 'MEO') return 'MEO';
  if (value === 'Elliptical') return 'Ellittica';
  return 'Altro';
}

function normalizeStatus(raw) {
  const value = text(raw);
  if (value === 'In Orbit') return { label: 'In orbita', inOrbit: true };
  if (value === 'Decayed' || value === 'Deorbited') return { label: 'Rientrato', inOrbit: false };
  if (value === 'Beyond Earth Orbit') {
    return { label: 'Oltre l\u2019orbita terrestre', inOrbit: false };
  }
  if (value === 'Exploded') return { label: 'Esploso', inOrbit: false };
  return { label: 'Altro', inOrbit: false };
}

function launchYearOf(ucsRow, satcatRow) {
  const rawDate = text(ucsRow.launch_date);
  const leadingYear = /^(\d{4})/.exec(rawDate);
  if (leadingYear) return Number.parseInt(leadingYear[1], 10);
  const anyYear = /(?:19|20)\d{2}/.exec(rawDate);
  if (anyYear) return Number.parseInt(anyYear[0], 10);
  const fromCatalog = Number.parseInt(satcatRow.launch_year, 10);
  return Number.isFinite(fromCatalog) ? fromCatalog : null;
}

function normalizeAsiDate(raw, fallbackYear = null, fallbackDate = null) {
  if (!raw || raw === 'N/A' || raw === 'N7A') {
    return { date: fallbackDate, year: fallbackYear };
  }
  const s = raw.trim().replace('.', '/');
  const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const dd = m[1].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    const yyyy = m[3];
    return { date: `${yyyy}-${mm}-${dd}`, year: Number.parseInt(yyyy, 10) };
  }
  const ym = s.match(/(\d{1,2})\/(\d{4})/);
  if (ym) {
    const mm = ym[1].padStart(2, '0');
    const yyyy = ym[2];
    return { date: `${yyyy}-${mm}`, year: Number.parseInt(yyyy, 10) };
  }
  return { date: fallbackDate, year: fallbackYear };
}

function parseAltitudes(raw) {
  if (!raw || raw === 'N/A') return { perigeeKm: null, apogeeKm: null };
  const parts = raw.split('x').map((p) => numberOrNull(p.trim()));
  if (parts.length === 2) {
    return { perigeeKm: parts[0], apogeeKm: parts[1] };
  }
  return { perigeeKm: null, apogeeKm: null };
}

function normalizeAsiPurpose(raw) {
  const v = text(raw).toLowerCase();
  if (v.includes('terra')) return 'Osservazione della Terra';
  if (v.includes('scienz') || v.includes('esplorazione') || v.includes('scientifico')) {
    return 'Scienza ed Esplorazione';
  }
  if (v.includes('telecom')) return 'Telecomunicazioni';
  if (v.includes('didattic')) return 'Didattica & Università';
  if (v.includes('comm') || v.includes('operaz')) return 'Servizi Commerciali / OTV';
  if (v.includes('tecnol') || v.includes('dimostraz') || v.includes('release')) {
    return 'Tecnologia & Dimostratori';
  }
  if (v.includes('propulsivo') || v.includes('dispositivo')) return 'Stadi & Dispositivi';
  return 'Altro';
}

function normalizeAsiOperator(raw) {
  const v = text(raw);
  const lower = v.toLowerCase();
  if (lower.includes('d-orbit')) {
    return { operator: 'D-Orbit', category: 'Commerciale / New Space' };
  }
  if (lower.includes('apogeo')) {
    return { operator: 'Apogeo Space', category: 'Commerciale / New Space' };
  }
  if (lower.includes('gauss')) {
    return { operator: 'GAUSS S.r.l.', category: 'Commerciale / New Space' };
  }
  if (lower.includes('ministero della difesa') && !lower.includes('asi')) {
    return { operator: 'Ministero della Difesa', category: 'Difesa & Governativo' };
  }
  if (lower.includes('asi/ ministero') || lower.includes('asi e ministero')) {
    return { operator: 'ASI / Ministero della Difesa', category: 'ASI & Nazionale' };
  }
  if (lower.includes('asi') || lower.includes('agenzia spaziale')) {
    return { operator: 'ASI', category: 'ASI & Nazionale' };
  }
  if (lower.includes('crs/cnr') || lower.includes('consiglio nazionale delle ricerche')) {
    return { operator: 'CNR / CRS', category: 'Ricerca & Università' };
  }
  if (
    lower.includes('sapienza') ||
    lower.includes('politecnico') ||
    lower.includes('università') ||
    lower.includes('amsat')
  ) {
    return { operator: v, category: 'Ricerca & Università' };
  }
  return { operator: v, category: 'Commerciale / New Space' };
}

function normalizeAsiLaunchSite(raw) {
  const v = text(raw).toLowerCase();
  if (v.includes('kenya') || v.includes('san marco')) return 'San Marco (Malindi, Kenya)';
  if (v.includes('kourou') || v.includes('guyana') || v.includes('csg')) {
    return 'Kourou (Guyana Francese)';
  }
  if (v.includes('canaveral') || v.includes('kennedy')) return 'Cape Canaveral / KSC (USA)';
  if (v.includes('vandenberg')) return 'Vandenberg Space Force Base (USA)';
  if (v.includes('wallops')) return 'Wallops Island (USA)';
  if (v.includes('baikonur') || v.includes('tyuratam')) return 'Baikonur (Kazakistan)';
  if (
    v.includes('yasny') ||
    v.includes('plesetsk') ||
    v.includes('dombarovsk') ||
    v.includes('kapustin')
  ) {
    return 'Cosmodromi Russi (Plesetsk/Yasny)';
  }
  if (v.includes('dhawan') || v.includes('sriharikota') || v.includes('india')) {
    return 'Satish Dhawan (India)';
  }
  if (v.includes('odyssey') || v.includes('sea launch')) {
    return 'Piattaforma Marina Odyssey';
  }
  return text(raw) || 'Altro';
}

function main() {
  const satcat = readCsv('satcat.csv');
  const ucs = readCsv('ucs_satellites.csv');

  const satcatByNorad = new Map();
  for (const row of satcat) {
    const id = text(row.satcat).replace(/^0+(?=\d)/, '');
    if (id && !satcatByNorad.has(id)) satcatByNorad.set(id, row);
  }

  // Unisce le varianti dello stesso operatore (es. "SpaceX" e "Spacex").
  const operatorVariants = new Map();
  for (const row of ucs) {
    const name = text(row.operator);
    if (!name) continue;
    const key = name.toLowerCase();
    const entry = operatorVariants.get(key) ?? { display: name, count: 0 };
    entry.count += 1;
    if (name.length < entry.display.length) entry.display = name;
    operatorVariants.set(key, entry);
  }

  const satellites = [];
  const seenNorad = new Set();

  for (const row of ucs) {
    const norad = text(row.norad_id).replace(/^0+(?=\d)/, '');
    if (!norad || seenNorad.has(norad)) continue;

    const catalogRow = satcatByNorad.get(norad);
    if (!catalogRow) continue;

    seenNorad.add(norad);

    const status = normalizeStatus(catalogRow.status);
    const operatorKey = text(row.operator).toLowerCase();
    const operator = operatorKey
      ? operatorVariants.get(operatorKey).display
      : 'Operatore non indicato';

    satellites.push({
      id: Number.parseInt(norad, 10),
      name: text(row.satellite_name) || text(catalogRow.name),
      operator,
      country: text(row.operator_country) || 'Non indicato',
      purpose: normalizePurpose(row.purpose),
      users: normalizeUsers(row.users),
      orbit: normalizeOrbit(row.orbit_class),
      year: launchYearOf(row, catalogRow),
      status: status.label,
      inOrbit: status.inOrbit,
      massKg: numberOrNull(row.launch_mass_kg),
    });
  }

  satellites.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.name.localeCompare(b.name));

  // Statistiche del catalogo completo (non filtrato): alimentano la sezione Detriti.
  const inOrbitObjects = satcat.filter((row) => text(row.status) === 'In Orbit');
  const typeOrder = ['Payload', 'Debris', 'Rocket Body', 'Component', 'Unknown'];
  const typeLabels = {
    Payload: 'Satelliti (payload)',
    Debris: 'Detriti',
    'Rocket Body': 'Stadi di razzo',
    Component: 'Componenti',
    Unknown: 'Non classificati',
  };
  const byType = typeOrder
    .map((type) => ({
      label: typeLabels[type],
      value: inOrbitObjects.filter((row) => text(row.object_type) === type).length,
    }))
    .filter((item) => item.value > 0);

  const eraBuckets = [
    { label: 'Prima del 2000', min: 0, max: 1999 },
    { label: '2000\u20132009', min: 2000, max: 2009 },
    { label: '2010\u20132019', min: 2010, max: 2019 },
    { label: '2020\u20132026', min: 2020, max: 9999 },
  ];
  const byEra = eraBuckets.map((bucket) => ({
    label: bucket.label,
    value: inOrbitObjects.filter((row) => {
      const year = Number.parseInt(row.launch_year, 10);
      return Number.isFinite(year) && year >= bucket.min && year <= bucket.max;
    }).length,
  }));

  const debrisInOrbit = inOrbitObjects.filter((row) => text(row.object_type) === 'Debris').length;
  const reentered = satcat.filter((row) => {
    const status = text(row.status);
    return status === 'Decayed' || status === 'Deorbited';
  }).length;

  // Timeline storica globale SATCAT (1957–2026) con i 3 grandi picchi.
  const satcatTimelineMap = new Map();
  for (const row of satcat) {
    const yr = Number.parseInt(row.launch_year, 10);
    if (!Number.isFinite(yr) || yr < 1957 || yr > 2026) continue;
    const isPayload = text(row.object_type) === 'Payload';

    if (!satcatTimelineMap.has(yr)) {
      satcatTimelineMap.set(yr, { year: yr, payloads: 0, total: 0 });
    }
    const item = satcatTimelineMap.get(yr);
    item.total += 1;
    if (isPayload) {
      item.payloads += 1;
    }
  }

  const satcatTimeline = Array.from(satcatTimelineMap.values()).sort((a, b) => a.year - b.year);

  // Statistiche e approfondimenti sui dati aggregati del catalogo SATCAT
  let payloadInOrbitCount = 0;
  let rocketBodyInOrbitCount = 0;
  let componentInOrbitCount = 0;
  let post2020PayloadsInOrbit = 0;

  for (const row of satcat) {
    const status = text(row.status);
    const type = text(row.object_type);
    const yr = Number.parseInt(row.launch_year, 10);

    if (status === 'In Orbit') {
      if (type === 'Payload') {
        payloadInOrbitCount += 1;
        if (Number.isFinite(yr) && yr >= 2020) {
          post2020PayloadsInOrbit += 1;
        }
      } else if (type === 'Rocket Body') {
        rocketBodyInOrbitCount += 1;
      } else if (type === 'Component') {
        componentInOrbitCount += 1;
      }
    }
  }

  const spentHardwareInOrbit = rocketBodyInOrbitCount + componentInOrbitCount;
  const totalJunkInOrbit = debrisInOrbit + spentHardwareInOrbit;
  const totalJunkShare = Number(((totalJunkInOrbit / inOrbitObjects.length) * 100).toFixed(1));
  const post2020Share = Number(((post2020PayloadsInOrbit / payloadInOrbitCount) * 100).toFixed(1));
  const payloadsShare = Number(((payloadInOrbitCount / inOrbitObjects.length) * 100).toFixed(1));
  const reenteredShare = Number(((reentered / satcat.length) * 100).toFixed(1));

  const satcatInsights = {
    post2020PayloadsInOrbit,
    post2020Share,
    payloadsInOrbit: payloadInOrbitCount,
    payloadsShare,
    debrisFragmentsInOrbit: debrisInOrbit,
    spentHardwareInOrbit,
    totalJunkInOrbit,
    totalJunkShare,
    totalReentered: reentered,
    reenteredShare,
  };

  // Elaborazione dataset italiano (datasets/asi.csv) e incrocio dati.
  const asi = readCsv('asi.csv', ';');
  const asiRecords = asi.map((row, index) => {
    const rawName = text(row['Denominazione']);
    const categoryState = text(row['Categoria e stato']);
    const isSD = categoryState.startsWith('S/D');
    const isRB = categoryState.startsWith('R/B');
    const isMRO = categoryState.startsWith('MRO');
    const active = categoryState.includes('(A)');

    let category = 'Satellite (Payload)';
    if (isSD) category = 'Dispenser / Vettore OTV';
    else if (isRB) category = 'Stadio propulsivo';
    else if (isMRO) category = 'Dispositivo di missione';

    const launchFallback = rawName.includes('LAS R/B')
      ? { date: '1992-10-22', year: 1992 }
      : rawName.includes('ASTROBIO')
        ? { date: '2022-07-13', year: 2022 }
        : { date: null, year: null };

    const launchInfo = normalizeAsiDate(row['Data di Lancio'], launchFallback.year, launchFallback.date);
    const reentryInfo = normalizeAsiDate(row['Data di Rientro']);

    let status = active ? 'In orbita (Attivo)' : 'Inattivo';
    if (reentryInfo.date) {
      status = 'Rientrato';
    }

    const altitudes = parseAltitudes(row['Altezze Perigeo x Apogeo (km)']);
    const opInfo = normalizeAsiOperator(row['Operatore Spaziale']);
    const unRegText = text(row['Registro ONU']).toLowerCase();

    return {
      id: index + 1,
      name: rawName,
      categoryState,
      category,
      active,
      status,
      cospar: text(row['Denominazione COSPAR']),
      orbitAlt: text(row['Altezze Perigeo x Apogeo (km)']),
      perigeeKm: altitudes.perigeeKm,
      apogeeKm: altitudes.apogeeKm,
      launchDate: launchInfo.date || text(row['Data di Lancio']),
      launchYear: launchInfo.year,
      reentryDate: reentryInfo.date,
      inclinationDeg: numberOrNull(row['Inclinazione (gradi)']),
      periodMin: numberOrNull(row['Periodo orbitale (minuti)']),
      purpose: normalizeAsiPurpose(row['Funzione principale']),
      purposeRaw: text(row['Funzione principale']),
      operator: opInfo.operator,
      operatorCategory: opInfo.category,
      launchSite: text(row['Luogo di lancio']),
      launchSiteClean: normalizeAsiLaunchSite(row['Luogo di lancio']),
      unRegistered: unRegText.startsWith('si') || unRegText === 'sì',
    };
  });

  const satcatItalianCount = satcat.filter((row) => text(row.state) === 'I').length;

  const countByField = (items, getter) => {
    const map = new Map();
    for (const item of items) {
      const key = getter(item);
      if (key) map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  };

  const italyByPurpose = countByField(asiRecords, (r) => r.purpose);
  const italyByOperatorCategory = countByField(asiRecords, (r) => r.operatorCategory);
  const italyByLaunchSite = countByField(asiRecords, (r) => r.launchSiteClean);

  const italyYearsMap = new Map();
  for (const r of asiRecords) {
    if (r.launchYear) {
      italyYearsMap.set(r.launchYear, (italyYearsMap.get(r.launchYear) ?? 0) + 1);
    }
  }

  const minItalyYear = Math.min(...Array.from(italyYearsMap.keys()));
  const maxItalyYear = Math.max(...Array.from(italyYearsMap.keys()));
  const italyTimeline = [];
  for (let y = minItalyYear; y <= maxItalyYear; y += 1) {
    italyTimeline.push({
      year: y,
      count: italyYearsMap.get(y) ?? 0,
    });
  }

  const uniqueItalyOperators = new Set(asiRecords.map((r) => r.operator.toLowerCase()));

  const italy = {
    stats: {
      totalObjects: asiRecords.length,
      activeCount: asiRecords.filter((r) => r.active).length,
      reenteredCount: asiRecords.filter((r) => r.status === 'Rientrato').length,
      satcatItalianCount,
      operatorsCount: uniqueItalyOperators.size,
      firstLaunchYear: minItalyYear,
      byPurpose: italyByPurpose,
      byOperatorCategory: italyByOperatorCategory,
      byLaunchSite: italyByLaunchSite,
      timeline: italyTimeline,
    },
    records: asiRecords,
  };

  const operators = new Set(satellites.map((satellite) => satellite.operator.toLowerCase()));
  const countries = new Set(
    satellites.map((satellite) => satellite.country).filter((country) => country !== 'Non indicato')
  );

  const dataset = {
    meta: {
      generatedAt: new Date().toISOString(),
      ucsSnapshot: '2023-04-27',
      timelineStart: 1974,
      timelineEnd: 2022,
      satelliteCount: satellites.length,
      inOrbitCount: satellites.filter((satellite) => satellite.inOrbit).length,
      operatorCount: operators.size,
      countryCount: countries.size,
      catalog: {
        totalObjects: satcat.length,
        inOrbit: inOrbitObjects.length,
        reentered,
        debrisInOrbit,
        debrisShare: Number(((debrisInOrbit / inOrbitObjects.length) * 100).toFixed(1)),
        payloadsInOrbit: payloadInOrbitCount,
        payloadsShare,
        byType,
        byEra,
        timeline: satcatTimeline,
        insights: satcatInsights,
      },
    },
    satellites,
    italy,
  };

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(dataset)}\n`, 'utf8');

  const sizeMb = (fs.statSync(outputFile).size / 1024 / 1024).toFixed(2);
  console.log(`Scritto ${path.relative(root, outputFile)} (${sizeMb} MB)`);
  console.log(
    `Satelliti: ${dataset.meta.satelliteCount} · in orbita: ${dataset.meta.inOrbitCount} · ` +
      `operatori: ${dataset.meta.operatorCount} · paesi: ${dataset.meta.countryCount}`
  );
  console.log(
    `Catalogo: ${dataset.meta.catalog.totalObjects} oggetti · ` +
      `${dataset.meta.catalog.inOrbit} in orbita · ${dataset.meta.catalog.reentered} rientrati`
  );
}

main();
