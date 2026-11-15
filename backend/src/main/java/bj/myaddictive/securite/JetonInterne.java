package bj.myaddictive.securite;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Secret aleatoire genere a chaque demarrage, jamais ecrit ni affiche. Il prouve qu'une requete
 * vient de l'application elle-meme (appel d'un domaine a un autre, ex. boutique -> paiement) et non
 * d'un client externe. Un client ne peut pas le deviner : sans lui, les en-tetes X-User-Id / X-User-Role
 * qu'il enverrait sont supprimes et les routes /api/interne/** lui sont fermees.
 */
public final class JetonInterne {
    public static final String ENTETE = "X-Appel-Interne";

    private static final String VALEUR;
    static {
        byte[] octets = new byte[32];
        new SecureRandom().nextBytes(octets);
        VALEUR = Base64.getUrlEncoder().withoutPadding().encodeToString(octets);
    }

    private JetonInterne() {}

    public static String valeur() {
        return VALEUR;
    }

    public static boolean estValide(String candidat) {
        if (candidat == null) return false;
        return MessageDigest.isEqual(VALEUR.getBytes(StandardCharsets.UTF_8), candidat.getBytes(StandardCharsets.UTF_8));
    }
}
