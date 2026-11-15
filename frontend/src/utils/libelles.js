/**
 * Met en forme un libelle technique brut (valeur d'enumeration ou de
 * categorie stockee en base, ex. "EN_LICE", "HIGH_TECH", "A_VENIR") en un
 * texte lisible avec une casse et une ponctuation normales ("En lice",
 * "High-tech", "A venir"), plutot que de l'afficher tel quel a l'ecran.
 */
const LIBELLES_CONNUS = {
  A_VENIR: 'À venir',
  EN_DIRECT: 'En direct',
  TERMINE: 'Terminé',
  REPLAY: 'Replay',
  EN_LICE: 'En lice',
  ELIMINE: 'Éliminé',
  ELIMINATIONS: 'Éliminatoires',
  QUALIFIE: 'Qualifié',
  VAINQUEUR: 'Vainqueur',
  MODE: 'Mode',
  HIGH_TECH: 'High-tech',
  BEAUTE: 'Beauté',
  MAISON: 'Maison',
  ACCESSOIRES: 'Accessoires',
  ACTUALITE: 'Actualité',
  SHOWBIZ: 'Showbiz',
  VIDEO: 'Vidéo',
  EN_ATTENTE: 'En attente',
  CONFIRMEE: 'Confirmée',
  ECHOUEE: 'Échouée',
  ANNULEE: 'Annulée',
  LIVREE: 'Livrée',
  EXPEDIEE: 'Expédiée',
  STANDARD: 'Standard',
  VIP: 'VIP',
};

export function formaterLibelle(valeurBrute) {
  if (!valeurBrute) return '';
  if (LIBELLES_CONNUS[valeurBrute]) return LIBELLES_CONNUS[valeurBrute];
  const texte = valeurBrute.replace(/_/g, ' ').toLowerCase();
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/** Retire toute mention "[DEMO]" d'un texte. */
export function retirerMentionDemo(texte) {
  if (!texte) return texte;
  return texte.replace(/\s*\[DEMO\]\s*/gi, ' ').trim();
}

/** Montant en FCFA avec separateur de milliers : 15000 -> "15 000 FCFA". */
export function fcfa(montant) {
  return `${Number(montant || 0).toLocaleString('fr-FR')} FCFA`;
}

/** Date et heure lisibles en francais. */
export function dateHeure(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) + ' a ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function dateCourte(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
