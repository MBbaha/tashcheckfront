import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import Kvitansiya from './pages/Kvitansiya.jsx';
import ChekRoyxati from './pages/ChekRoyxati.jsx';

export default function App() {
  return (
    <div className="app">
      <header className="topbar no-print">
        <div className="topbar__brand">
          <span className="topbar__logo">R</span>
          <div>
            <strong>Risola Travel Lux</strong>
            <small>Naqd pul kvitansiyalari</small>
          </div>
        </div>
        <nav className="topbar__nav">
          <NavLink to="/kvitansiya">Yangi kvitansiya</NavLink>
          <NavLink to="/chekRoyxati">Cheklar ro'yxati</NavLink>
        </nav>
      </header>

      <main className="page">
        <Routes>
          <Route path="/" element={<Navigate to="/kvitansiya" replace />} />
          <Route path="/kvitansiya" element={<Kvitansiya />} />
          <Route path="/chekRoyxati" element={<ChekRoyxati />} />
          <Route path="*" element={<Navigate to="/kvitansiya" replace />} />
        </Routes>
      </main>
    </div>
  );
}
