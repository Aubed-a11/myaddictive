import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Evenements from './pages/Evenements';
import Competitions from './pages/Competitions';
import Articles from './pages/Articles';
import Boutique from './pages/Boutique';
import Vendeurs from './pages/Vendeurs';
import Utilisateurs from './pages/Utilisateurs';
import Chaines from './pages/Chaines';
import Podcasts from './pages/Podcasts';
import Paiements from './pages/Paiements';
import ScannerBillets from './pages/ScannerBillets';
import Commandes from './pages/Commandes';

function MiseEnPage({ children }) {
  const [menuOuvert, setMenuOuvert] = useState(false);
  return (
    <div className="mise-en-page">
      {/* Barre du haut visible uniquement sur telephone / petite tablette */}
      <div className="barre-mobile">
        <button className="bouton-menu" aria-label="Menu" onClick={() => setMenuOuvert((o) => !o)}>
          {menuOuvert ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span className="logo-admin"><span className="bleu">My</span> <span className="or">Q</span><span className="bleu">ddictive</span></span>
      </div>
      <Sidebar ouverte={menuOuvert} onNavigation={() => setMenuOuvert(false)} />
      {menuOuvert && <div className="voile-menu" onClick={() => setMenuOuvert(false)} />}
      <div className="zone-contenu">{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/connexion" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><MiseEnPage><Dashboard /></MiseEnPage></ProtectedRoute>} />
          <Route path="/evenements" element={<ProtectedRoute><MiseEnPage><Evenements /></MiseEnPage></ProtectedRoute>} />
          <Route path="/competitions" element={<ProtectedRoute><MiseEnPage><Competitions /></MiseEnPage></ProtectedRoute>} />
          <Route path="/articles" element={<ProtectedRoute><MiseEnPage><Articles /></MiseEnPage></ProtectedRoute>} />
          <Route path="/boutique" element={<ProtectedRoute><MiseEnPage><Boutique /></MiseEnPage></ProtectedRoute>} />
          <Route path="/vendeurs" element={<ProtectedRoute><MiseEnPage><Vendeurs /></MiseEnPage></ProtectedRoute>} />
          <Route path="/utilisateurs" element={<ProtectedRoute><MiseEnPage><Utilisateurs /></MiseEnPage></ProtectedRoute>} />
          <Route path="/chaines" element={<ProtectedRoute><MiseEnPage><Chaines /></MiseEnPage></ProtectedRoute>} />
          <Route path="/podcasts" element={<ProtectedRoute><MiseEnPage><Podcasts /></MiseEnPage></ProtectedRoute>} />
          <Route path="/paiements" element={<ProtectedRoute><MiseEnPage><Paiements /></MiseEnPage></ProtectedRoute>} />
          <Route path="/scanner-billets" element={<ProtectedRoute><MiseEnPage><ScannerBillets /></MiseEnPage></ProtectedRoute>} />
          <Route path="/commandes" element={<ProtectedRoute><MiseEnPage><Commandes /></MiseEnPage></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
