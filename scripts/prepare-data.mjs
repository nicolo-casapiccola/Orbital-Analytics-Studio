/**
 * Genera src/data/dataset.json a partire dai due CSV in /datasets.
 *
 * - ucs_satellites.csv: censimento UCS dei satelliti (chi, cosa, perche).
 * - satcat.csv: catalogo SATCAT di tutti gli oggetti tracciati (dati orbitali,
 *   detriti, stadi, componenti).
 *
 * I due file vengono incrociati su ucs.norad_id = satcat.satcat.
 * Lo script non ha dipendenze esterne: si lancia con `npm run data`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const datasetsDir = path.join(root, 'datasets');
const outputFile = path.join(root, 'src', 'data', 'dataset.json');

/** Parser CSV minimale ma corretto (gestisce virgolette, virgole e a capo). */
function parseCsv(text) {
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
    } else if (char === ',') {
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

function readCsv(fileName) {
  const fullPath = path.join(datasetsDir, fileName);
  return parseCsv(fs.readFileSync(fullPath, 'utf8'));
}

function text(value) {
  return (value ?? '').trim();
}

function numberOrNull(value) {
  const parsed = Number.parseFloat(value);
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
  // Il censimento UCS e la fonte per l'identita del satellite: usiamo la sua
  // data di lancio. Il catalogo serve da riserva per le date mancanti.
  const rawDate = text(ucsRow.launch_date);
  const leadingYear = /^(\d{4})/.exec(rawDate);
  if (leadingYear) return Number.parseInt(leadingYear[1], 10);
  const anyYear = /(?:19|20)\d{2}/.exec(rawDate);
  if (anyYear) return Number.parseInt(anyYear[0], 10);
  const fromCatalog = Number.parseInt(satcatRow.launch_year, 10);
  return Number.isFinite(fromCatalog) ? fromCatalog : null;
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
        byType,
        byEra,
      },
    },
    satellites,
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
