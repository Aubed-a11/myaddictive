#!/usr/bin/env bash
# Copie le dossier "actualites" de l'ancien site (Infomaniak) vers le VPS.
# A lancer SUR LE VPS, en root :  bash copier-actualites.sh
set -e
DEST=/opt/myaddictive/medias/actualites
FTP_HOTE=pedj.ftp.infomaniak.com
read -rp "Utilisateur FTP [pedj_ftpmyaddictive] : " FTP_USER; FTP_USER=${FTP_USER:-pedj_ftpmyaddictive}
read -rsp "Mot de passe FTP (non affiche) : " FTP_PASS; echo
# Chemin du dossier sur le FTP (voir Web FTP : .../themes/mya/assets/images/actualites)
read -rp "Chemin du dossier actualites sur le FTP [/sites/myaddictive.com/wp-content/themes/mya/assets/images/actualites] : " SRC
SRC=${SRC:-/sites/myaddictive.com/wp-content/themes/mya/assets/images/actualites}
command -v lftp >/dev/null || apt-get install -y lftp
mkdir -p "$DEST"
lftp -u "$FTP_USER","$FTP_PASS" -e "set ftp:ssl-allow yes; set ssl:verify-certificate no; mirror --verbose --parallel=4 --only-missing '$SRC' '$DEST'; bye" "$FTP_HOTE"
chown -R myaddictive:myaddictive /opt/myaddictive/medias
echo "Fichiers copies : $(ls "$DEST" | wc -l)  ->  $DEST"
