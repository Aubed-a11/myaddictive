import React from 'react';

/** Filet de securite : une erreur d'affichage n'efface plus tout l'ecran. */
export default class BarriereErreur extends React.Component {
  state = { erreur: null };
  static getDerivedStateFromError(erreur) { return { erreur }; }
  componentDidCatch(erreur, info) { console.error("[UI] Erreur d'affichage :", erreur, info?.componentStack); }
  render() {
    if (!this.state.erreur) return this.props.children;
    return (
      <div className="etat" style={{ minHeight: '100dvh', display: 'grid', placeContent: 'center' }}>
        <strong>Oups, une erreur est survenue</strong>
        <span>Rechargez la page pour continuer.</span>
        <div style={{ marginTop: 18 }}><a className="bouton" href="/">Retour a l'accueil</a></div>
      </div>
    );
  }
}
