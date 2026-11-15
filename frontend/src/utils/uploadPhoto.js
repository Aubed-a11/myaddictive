/** Construit le FormData d'envoi d'une photo a partir d'un fichier choisi par l'utilisateur. */
export function formDataPhoto(fichier, nomChamp = 'fichier') {
  const formData = new FormData();
  formData.append(nomChamp, fichier, fichier.name || 'photo.jpg');
  return formData;
}
