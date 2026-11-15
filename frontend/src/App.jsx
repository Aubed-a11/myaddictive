import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationsProvider } from './context/Notifications';
import BarriereErreur from './components/BarriereErreur';
import Layout from './components/Layout';

import Hub from './pages/Hub';
import Connexion from './pages/Connexion';
import Inscription from './pages/Inscription';
import MotDePasseOublie from './pages/MotDePasseOublie';
import ReinitialiserMotDePasse from './pages/ReinitialiserMotDePasse';
import Media from './pages/Media';
import Article from './pages/Article';
import OffresPromotion from './pages/OffresPromotion';
import Billetterie from './pages/Billetterie';
import EvenementDetail from './pages/EvenementDetail';
import ChatLive from './pages/ChatLive';
import CreerEvenement from './pages/CreerEvenement';
import MesBillets from './pages/MesBillets';
import Livestream from './pages/Livestream';
import Chaines from './pages/Chaines';
import ChaineDetail from './pages/ChaineDetail';
import Podcasts from './pages/Podcasts';
import Competitions from './pages/Competitions';
import Candidats from './pages/Candidats';
import CandidatDetail from './pages/CandidatDetail';
import Portefeuille from './pages/Portefeuille';
import HistoriqueVotes from './pages/HistoriqueVotes';
import Boutique from './pages/Boutique';
import Produit from './pages/Produit';
import BoutiqueVendeur from './pages/BoutiqueVendeur';
import Panier from './pages/Panier';
import MesCommandes from './pages/MesCommandes';
import DevenirVendeur from './pages/DevenirVendeur';
import Compte from './pages/Compte';
import Favoris from './pages/Favoris';
import Parametres from './pages/Parametres';
import Transactions from './pages/Transactions';
import Badges from './pages/Badges';

/** Remonte en haut de page à chaque changement d'écran. */
function RemonterEnHaut() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BarriereErreur>
      <BrowserRouter>
        <NotificationsProvider>
          <AuthProvider>
            <RemonterEnHaut />
            <Routes>
              {/* Pages d'authentification : plein écran, sans en-tête */}
              <Route path="/connexion" element={<Connexion />} />
              <Route path="/inscription" element={<Inscription />} />
              <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
              <Route path="/reinitialiser-mot-de-passe" element={<ReinitialiserMotDePasse />} />

              <Route element={<Layout />}>
                <Route path="/" element={<Hub />} />

                <Route path="/media" element={<Media />} />
                <Route path="/media/articles/:id" element={<Article />} />
                <Route path="/offres-promotion" element={<OffresPromotion />} />

                <Route path="/billetterie" element={<Billetterie />} />
                <Route path="/evenements/nouveau" element={<CreerEvenement />} />
                <Route path="/evenements/:id" element={<EvenementDetail />} />
                <Route path="/evenements/:id/chat" element={<ChatLive />} />
                <Route path="/mes-billets" element={<MesBillets />} />

                <Route path="/live" element={<Livestream />} />
                <Route path="/chaines" element={<Chaines />} />
                <Route path="/chaines/:id" element={<ChaineDetail />} />
                <Route path="/podcasts" element={<Podcasts />} />

                <Route path="/votes" element={<Competitions />} />
                <Route path="/votes/:competitionId" element={<Candidats />} />
                <Route path="/candidats/:id" element={<CandidatDetail />} />
                <Route path="/portefeuille" element={<Portefeuille />} />
                <Route path="/historique-votes" element={<HistoriqueVotes />} />

                <Route path="/boutique" element={<Boutique />} />
                <Route path="/boutique/produits/:id" element={<Produit />} />
                <Route path="/boutique/vendeurs/:vendeurId" element={<BoutiqueVendeur />} />
                <Route path="/panier" element={<Panier />} />
                <Route path="/mes-commandes" element={<MesCommandes />} />
                <Route path="/devenir-vendeur" element={<DevenirVendeur />} />

                <Route path="/compte" element={<Compte />} />
                <Route path="/favoris" element={<Favoris />} />
                <Route path="/parametres" element={<Parametres />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/badges" element={<Badges />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </AuthProvider>
        </NotificationsProvider>
      </BrowserRouter>
    </BarriereErreur>
  );
}
