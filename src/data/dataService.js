import Papa from 'papaparse';
import { generatePortCalls } from './generatePortCalls';

// Required columns for uploaded CSV data
const REQUIRED_COLUMNS = [
  'id', 'vesselName', 'vesselType', 'lengthM', 'cargoTonnes',
  'berth', 'arrivalTime', 'waitHours', 'serviceHours',
  'turnaroundHours', 'queueLengthAtArrival', 'weatherDelay',
];

// In-memory store: starts with generated data, can be replaced by CSV upload.
let currentData = null;
let dataSource = 'generated';

function getGenerated() {
  if (!currentData && dataSource === 'generated') {
    currentData = generatePortCalls();
  }
  return currentData;
}

function getPortCalls() {
  return getGenerated();
}

function getDataSource() {
  return dataSource;
}

// Parse a CSV string and validate columns; throws if required columns are missing.
// Returns the parsed array of port-call records with proper type coercion.
function loadCsv(csvString) {
  const result = Papa.parse(csvString, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  if (result.errors && result.errors.length > 0) {
    throw new Error(`CSV parse error: ${result.errors[0].message}`);
  }

  const rows = result.data;
  if (rows.length === 0) {
    throw new Error('The uploaded CSV file contains no data rows.');
  }

  const present = Object.keys(rows[0]);
  const missing = REQUIRED_COLUMNS.filter((c) => !present.includes(c));
  if (missing.length > 0) {
    throw new Error(
      `Missing required column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`
    );
  }

  const coerced = rows.map((row, idx) => ({
    id: row.id || `CSV-${idx}`,
    vesselName: String(row.vesselName || ''),
    vesselType: String(row.vesselType || ''),
    lengthM: Number(row.lengthM) || 0,
    cargoTonnes: Number(row.cargoTonnes) || 0,
    berth: String(row.berth || ''),
    arrivalTime: String(row.arrivalTime || ''),
    waitHours: Number(row.waitHours) || 0,
    serviceHours: Number(row.serviceHours) || 0,
    turnaroundHours: Number(row.turnaroundHours) || 0,
    queueLengthAtArrival: Number(row.queueLengthAtArrival) || 0,
    weatherDelay: String(row.weatherDelay).toLowerCase() === 'true' || row.weatherDelay === true || row.weatherDelay === 1,
  }));

  currentData = coerced;
  dataSource = 'csv';
  return coerced;
}

function resetToGenerated() {
  currentData = generatePortCalls();
  dataSource = 'generated';
}

export { getPortCalls, getDataSource, loadCsv, resetToGenerated, REQUIRED_COLUMNS };
