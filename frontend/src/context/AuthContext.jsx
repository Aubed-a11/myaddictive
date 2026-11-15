import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import client, { definirGestionnaireDeconnexionAutomatique, ecrireStockage, lireStockage, supprimerStockage } from '../api/client';

/**
 * Session de l'utilisateur. Acces libre : on ne force jamais la connexion ; les pages qui en ont
 * besoin utilisent <ExigerConnexion> (voir components/ExigerConnexion.jsx).
 */
const AuthContext = createContext(null);

function lireSession() {
  try {
    const jeton = lireStockage('jeton');
    const utilisateur = JSON.parse(lireStockage('utilisateur') || 'null');
    return jeton && utilisateur ? { jeton, utilisateur } : { jeton: null, utilisateur: null };
  } catch {
    supprimerStockage('jeton', 'utilisateur');
    return { jeton: null, utilisateur: null };
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(lireSession);

  const enregistrerSession = useCallback((reponse) => {
    ecrireStockage('jeton', reponse.jeton);
    ecrireStockage('utilisateur', JSON.stringify(reponse.utilisateur));
    setSession({ jeton: reponse.jeton, utilisateur: reponse.utilisateur });
  }, []);

  const inscrire = useCallback(async (email, motDePasse, nomComplet) => {
    const { data } = await client.post('/api/compte/auth/inscription', { email, motDePasse, nomComplet });
    enregistrerSession(data);
    return data;
  }, [enregistrerSession]);

  const connecter = useCallback(async (email, motDePasse) => {
    const { data } = await client.post('/api/compte/auth/connexion', { email, motDePasse });
    enregistrerSession(data);
    return data;
  }, [enregistrerSession]);

  const connecterAvecGoogle = useCallback(async (idToken) => {
    const { data } = await client.post('/api/compte/auth/connexion-google', { idToken });
    enregistrerSession(data);
    return data;
  }, [enregistrerSession]);

  const demanderReinitialisation = useCallback(async (email) => {
    await client.post('/api/compte/auth/mot-de-passe-oublie', { email });
  }, []);

  const reinitialiserMotDePasse = useCallback(async (email, code, nouveauMotDePasse) => {
    await client.post('/api/compte/auth/reinitialiser-mot-de-passe', { email, code, nouveauMotDePasse });
  }, []);

  const deconnecter = useCallback(() => {
    supprimerStockage('jeton', 'utilisateur');
    setSession({ jeton: null, utilisateur: null });
  }, []);

  useEffect(() => { definirGestionnaireDeconnexionAutomatique(deconnecter); }, [deconnecter]);

  const rafraichirProfil = useCallback(async () => {
    const { data } = await client.get('/api/compte/moi');
    ecrireStockage('utilisateur', JSON.stringify(data));
    setSession((s) => ({ ...s, utilisateur: data }));
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{
      utilisateur: session.utilisateur, jeton: session.jeton, estConnecte: !!session.jeton,
      inscrire, connecter, connecterAvecGoogle, demanderReinitialisation, reinitialiserMotDePasse,
      deconnecter, rafraichirProfil,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit etre utilise a l'interieur de AuthProvider");
  return ctx;
}
