import { useState, useMemo, useRef } from 'react';
import Overview from './pages/Overview';
import Analysis from './pages/Analysis';
import Predictor from './pages/Predictor';
import About from './pages/About';
import { getPortCalls, getDataSource, loadCsv, resetToGenerated } from './data/dataService';

const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'predictor', label: 'Predictor' },
  { id: 'about', label: 'About' },
];

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(() => getPortCalls());
  const [dataSource, setDataSource] = useState(() => getDataSource());
  const [csvError, setCsvError] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const fileInputRef = useRef(null);

  function refresh() {
    setData(getPortCalls());
    setDataSource(getDataSource());
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCsvError(null);
    setCsvLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        loadCsv(evt.target.result);
        refresh();
        setCsvLoading(false);
      } catch (err) {
        setCsvError(err.message);
        setCsvLoading(false);
      }
    };
    reader.onerror = () => {
      setCsvError('Could not read the file.');
      setCsvLoading(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleReset() {
    resetToGenerated();
    setCsvError(null);
    refresh();
  }

  function navTo(id) {
    setActiveTab(id);
    setMobileNavOpen(false);
  }

  return (
    <div className="min-h-screen flex bg-canvas">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-60 bg-navy-900 flex flex-col z-30 transition-transform duration-200 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-500 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                <path d="M3 18h18M3 18l2-9h14l2 9M5 18v2M19 18v2M9 9V5h6v4" />
              </svg>
            </div>
            <div className="leading-tight">
              <div className="text-white text-sm font-semibold">Vessel Turnaround</div>
              <div className="text-slate-400 text-xs font-normal">Predictor</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => navTo(item.id)}
              className={`w-full text-left px-5 py-2.5 text-sm font-medium border-l-2 transition-colors ${
                activeTab === item.id
                  ? 'border-teal-400 text-white bg-white/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/10 space-y-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={csvLoading}
            className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-medium px-3 py-2 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            {csvLoading ? 'Loading…' : 'Upload CSV'}
          </button>
          {dataSource === 'csv' && (
            <button
              onClick={handleReset}
              className="w-full text-center text-slate-400 hover:text-slate-200 text-xs font-medium py-1.5 transition-colors"
            >
              Reset to generated data
            </button>
          )}
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setMobileNavOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile bar */}
        <div className="lg:hidden flex items-center justify-between bg-navy-900 px-4 py-3 sticky top-0 z-10">
          <button onClick={() => setMobileNavOpen(true)} className="text-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <span className="text-white text-sm font-semibold">Vessel Turnaround Predictor</span>
          <div className="w-6" />
        </div>

        {csvError && (
          <div className="mx-6 lg:mx-8 mt-4">
            <div className="bg-signal-50 border border-signal-500/30 text-signal-600 px-4 py-3 text-sm flex items-center justify-between">
              <span>{csvError}</span>
              <button onClick={() => setCsvError(null)} className="text-signal-500 hover:text-signal-600 font-bold ml-3 text-lg leading-none">×</button>
            </div>
          </div>
        )}

        <main className="flex-1 px-6 lg:px-8 py-6" key={activeTab}>
          {activeTab === 'overview' && <Overview data={data} />}
          {activeTab === 'analysis' && <Analysis data={data} />}
          {activeTab === 'predictor' && <Predictor data={data} />}
          {activeTab === 'about' && <About />}
        </main>
      </div>
    </div>
  );
}

export default App;
