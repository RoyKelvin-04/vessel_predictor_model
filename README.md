# Vessel Turnaround Predictor

A browser-based dashboard that analyses vessel port calls and predicts vessel turnaround time (hours from arrival at port to departure) for a generic seaport. 

## Tech Stack

- **React** (JavaScript / JSX)
- **Vite** — dev server & build tool
- **Tailwind CSS v4** — styling
- **Recharts** — charts
- **PapaParse** — CSV parsing

No backend, no database, no authentication. Everything runs in the browser.

## Getting Started

```bash
# install dependencies
npm install

# start the dev server
npm run dev

# build for production
npm run build
```

The app runs on the Vite dev server (default: http://localhost:5173).

## Features

### Overview tab
KPI cards (average turnaround, wait, service, total port calls), a monthly trend line chart, and a bar chart of average turnaround by vessel type.

### Analysis tab
Filters by date range, vessel type, and berth. Charts include turnaround vs cargo (scatter), wait time by queue length (bar), berth performance comparison, and a turnaround histogram. A sortable, paginated data table appears below.

### Predictor tab
A form where you enter vessel type, length, cargo tonnes, berth, queue length, and weather delay. The app predicts turnaround time split into wait and service components, with a plain-language explanation of which inputs pushed the estimate up or down. Model performance (MAE and R²) is shown from an 80/20 hold-out split.

### About tab
Project description, data field reference, and model approach & limitations.

## Data

On first load, the app generates ~600 synthetic port calls with a seeded random generator (`src/data/generatePortCalls.js`), so results are identical on every reload. The data encodes realistic relationships:

- Larger cargo and longer vessels → longer service time
- Tankers and Bulk Carriers have longer service than Ro-Ro
- Longer queue at arrival → longer wait
- Weather delays add extra hours to both wait and service

All data access goes through `src/data/dataService.js` via `getPortCalls()`, so the data source can be swapped without touching the UI.

### Uploading your own CSV

Click **Upload CSV** in the header to load real port-call data. The file must be a CSV with these exact column names:

```
id,vesselName,vesselType,lengthM,cargoTonnes,berth,arrivalTime,waitHours,serviceHours,turnaroundHours,queueLengthAtArrival,weatherDelay
```

- `vesselType`: one of `Container`, `Bulk Carrier`, `Tanker`, `General Cargo`, `Ro-Ro`
- `berth`: `B1`–`B6`
- `weatherDelay`: `true` or `false`
- `arrivalTime`: ISO 8601 datetime string

If any required column is missing, a clear error message is shown. Click **Reset data** to return to the generated dataset.

## Prediction Model

The model (`src/model/predict.js`) uses ordinary least-squares multiple linear regression, fitted in the browser via normal equations. Categorical variables (vessel type, berth) are one-hot encoded. Two separate regressions are trained — one for wait time, one for service time — and the final turnaround prediction is their sum.

The model object is self-contained (weights + feature schema), so it can be replaced later by a pre-trained model or API with the same interface: a `predict(input, model)` function returning predicted wait, service, and turnaround hours.

## Project Structure

```
src/
  components/        Reusable UI components
    KpiCard.jsx
    ChartCard.jsx
    FilterBar.jsx
    DataTable.jsx
    PredictorForm.jsx
  data/
    generatePortCalls.js   Synthetic data generator (seeded)
    dataService.js         Data access layer (generated or CSV)
  model/
    predict.js             Linear regression model
  pages/
    Overview.jsx
    Analysis.jsx
    Predictor.jsx
    About.jsx
  App.jsx                 Tab navigation & layout
  main.jsx
  index.css
```
