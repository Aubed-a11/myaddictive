/**
 * Paiement Mobile Money par FedaPay.
 *
 * Le serveur cree la transaction FedaPay (le montant est fixe cote serveur, jamais par le navigateur)
 * et renvoie l'adresse de la page de paiement (transaction.urlPaiement). On y envoie le client ; une fois
 * le paiement fait (ou annule), FedaPay le ramene sur /paiement/retour/{id}, qui verifie le vrai statut
 * aupres du serveur. Le retour du navigateur ne confirme jamais un paiement a lui seul.
 */
export function payerAvecFedapay(transaction) {
  if (!transaction || !transaction.urlPaiement) {
    throw new Error("Le paiement n'a pas pu etre prepare. Reessayez dans un instant.");
  }
  window.location.assign(transaction.urlPaiement);
}
