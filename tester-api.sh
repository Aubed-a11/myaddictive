#!/usr/bin/env bash
# Test rapide du VRAI backend (a lancer une fois `mvn spring-boot:run` demarre).
# Usage : ./tester-api.sh [http://localhost:8080]
B="${1:-http://localhost:8080}"; ECHECS=0
verif() { # description  code_attendu  code_obtenu
  if [ "$2" = "$3" ]; then echo "OK   $1 ($3)"; else echo "FAIL $1 (attendu $2, obtenu $3)"; ECHECS=$((ECHECS+1)); fi; }
code() { curl -s -o /dev/null -w "%{http_code}" "$@"; }

verif "sante"                                   200 "$(code $B/actuator/health)"
verif "articles (public)"                       200 "$(code "$B/api/media/articles?page=0&size=3")"
verif "evenements (public)"                     200 "$(code "$B/api/live/evenements?page=0&size=3")"
verif "produits (public)"                       200 "$(code "$B/api/boutique/produits?page=0&size=3")"
verif "competitions (public)"                   200 "$(code "$B/api/votes/competitions?page=0&size=3")"
verif "profil sans jeton refuse"                401 "$(code $B/api/compte/moi)"
verif "panier sans jeton refuse"                401 "$(code $B/api/boutique/panier)"
verif "/api/interne bloque depuis l'exterieur"  403 "$(code -X POST $B/api/interne/live/paiement-confirme)"
verif "creation transaction externe bloquee"    403 "$(code -X POST -H 'Content-Type: application/json' -d '{}' $B/api/paiement/transactions)"
verif "ancienne rubrique musique supprimee"     404 "$(code $B/api/musique/titres)"

EMAIL="test$(date +%s)@exemple.bj"
REP=$(curl -s -X POST -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"motDePasse\":\"Test1234!\",\"nomComplet\":\"Testeur\"}" $B/api/compte/auth/inscription)
JETON=$(echo "$REP" | sed -n 's/.*"jeton":"\([^"]*\)".*/\1/p')
[ -n "$JETON" ] && verif "inscription" ok ok || verif "inscription" ok "echec: $REP"
verif "profil avec jeton"                       200 "$(code -H "Authorization: Bearer $JETON" $B/api/compte/moi)"
verif "faux X-User-Id ignore (sans jeton)"      401 "$(code -H 'X-User-Id: 1' -H 'X-User-Role: ADMINISTRATEUR' $B/api/compte/moi)"
verif "jeton invalide refuse"                   401 "$(code -H 'Authorization: Bearer abc.def.ghi' $B/api/compte/moi)"
verif "ecriture admin refusee a un simple user" 403 "$(code -X POST -H "Authorization: Bearer $JETON" -H 'Content-Type: application/json' -d '{}' $B/api/boutique/produits/admin)"

echo; [ $ECHECS -eq 0 ] && echo "Tout est OK." || { echo "$ECHECS test(s) en echec."; exit 1; }
