import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

/** Petites notifications en bas de l'ecran (remplace les alert() du navigateur). */
const NotifContext = createContext(() => {});

export function NotificationsProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const compteur = useRef(0);

  const notifier = useCallback((texte, type = 'info') => {
    const id = ++compteur.current;
    setMessages((m) => [...m, { id, texte, type }]);
    setTimeout(() => setMessages((m) => m.filter((x) => x.id !== id)), 4500);
  }, []);

  return (
    <NotifContext.Provider value={notifier}>
      {children}
      <div className="notifications" role="status" aria-live="polite">
        {messages.map((m) => <div key={m.id} className={`notification ${m.type}`}>{m.texte}</div>)}
      </div>
    </NotifContext.Provider>
  );
}

export const useNotifier = () => useContext(NotifContext);
