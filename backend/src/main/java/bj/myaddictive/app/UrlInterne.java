package bj.myaddictive.app;

/**
 * Adresse de l'application elle-meme, utilisee pour les appels entre domaines
 * (ex. boutique -> paiement) (ex. boutique -> paiement).
 * Ce sont de simples requetes HTTP sur la boucle locale ; le jeton interne ajoute par
 * securite.ClientInterneConfig les fait reconnaitre par le filtre d'authentification.
 */
public final class UrlInterne {
    private UrlInterne() {}

    public static String base() {
        String port = System.getenv("SERVER_PORT");
        if (port == null || port.isBlank()) port = "8080";
        return "http://localhost:" + port.trim();
    }
}
