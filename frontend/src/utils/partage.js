/** Partage un contenu : feuille de partage du navigateur si disponible, sinon copie du lien. Renvoie un message a afficher. */
export async function partagerContenu({ titre, message, url }) {
  const lien = url || window.location.href;
  if (navigator.share) {
    try {
      await navigator.share({ title: titre, text: message, url: lien });
      return null;
    } catch (e) {
      if (e?.name === 'AbortError') return null;
    }
  }
  try {
    await navigator.clipboard.writeText(`${message}\n\n${lien}`);
    return 'Lien copie dans le presse-papiers.';
  } catch {
    return 'Impossible de partager automatiquement sur ce navigateur.';
  }
}
