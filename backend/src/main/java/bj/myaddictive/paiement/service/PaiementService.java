package bj.myaddictive.paiement.service;

import bj.myaddictive.paiement.domain.MoyenPaiement;
import bj.myaddictive.paiement.domain.StatutTransaction;
import bj.myaddictive.paiement.domain.Transaction;
import bj.myaddictive.paiement.domain.TypeObjetPaiement;
import bj.myaddictive.paiement.dto.InitierPaiementRequest;
import bj.myaddictive.paiement.dto.WebhookRequest;
import bj.myaddictive.paiement.exception.ApiException;
import bj.myaddictive.paiement.messaging.PaiementConfirmeNotifier;
import bj.myaddictive.paiement.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Coeur du socle de paiement (section 10 du CDC fonctionnel, section 21.4 du
 * CDC technique) : initie une transaction aupres de l'agregateur mobile
 * money/carte, puis attend sa confirmation, traitee de facon idempotente,
 * avant d'emettre quoi que ce soit (billet, titre, vote, commande) - jamais
 * l'inverse.
 *
 * Integration reelle MTN Mobile Money (MtnMomoClient) : des que les
 * identifiants marchand sont configures (voir DEPLOIEMENT.md), toute demande
 * de paiement MTN_MOMO passe par le vrai flux asynchrone MTN - invite PIN
 * envoyee sur le telephone du client, confirmation automatique reçue soit
 * par callback MTN (voir /webhooks/mtn-momo/{referenceId}), soit par
 * interrogation periodique de secours (voir PaiementRelanceScheduler) -
 * sans jamais nécessiter de validation manuelle.
 *
 * Mode simulation (developpement, ou moyens de paiement sans integration
 * reelle branchee pour l'instant - Moov Money, Celtiis Cash, carte bancaire) :
 * la transaction est auto-confirmee immediatement, pour permettre de tester
 * la chaine complete sans dependre d'un compte agregateur reel. Le paiement
 * en agence, lui, n'est JAMAIS auto-confirme, meme en simulation : voir
 * confirmerManuellement().
 */
@Service
public class PaiementService {

    private static final Logger log = LoggerFactory.getLogger(PaiementService.class);

    private final TransactionRepository transactionRepository;
    private final PaiementConfirmeNotifier notifier;
    private final MtnMomoClient mtnMomoClient;
    private final FedaPayClient fedaPayClient;
    private final boolean simulationAutorisee;
    private final String urlRetourBase;

    public PaiementService(TransactionRepository transactionRepository,
                            PaiementConfirmeNotifier notifier,
                            MtnMomoClient mtnMomoClient,
                            FedaPayClient fedaPayClient,
                            @org.springframework.beans.factory.annotation.Value("${mobile-money.fedapay.return-base-url:https://myaddictive.com}") String urlRetourBase,
                            @org.springframework.beans.factory.annotation.Value("${paiement.simulation-autorisee:false}") boolean simulationAutorisee) {
        this.simulationAutorisee = simulationAutorisee;
        this.transactionRepository = transactionRepository;
        this.notifier = notifier;
        this.mtnMomoClient = mtnMomoClient;
        this.fedaPayClient = fedaPayClient;
        this.urlRetourBase = urlRetourBase.endsWith("/") ? urlRetourBase.substring(0, urlRetourBase.length() - 1) : urlRetourBase;
    }

    @Transactional
    public Transaction initier(Long utilisateurId, InitierPaiementRequest requete) {
        if (requete.moyenPaiement() == MoyenPaiement.MTN_MOMO && mtnMomoClient.estConfigure()
                && (requete.telephonePayeur() == null || requete.telephonePayeur().isBlank())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le numero de telephone Mobile Money est requis pour ce moyen de paiement.");
        }

        // Seuls FedaPay (Mobile Money) et l'agence (confirmation manuelle admin) sont de vrais moyens
        // de paiement. Les autres se "confirmaient" automatiquement, donc un achat gratuit : refuses
        // sauf si la simulation est explicitement activee (PAIEMENT_SIMULATION=true, dev local).
        boolean moyenReel = requete.moyenPaiement() == MoyenPaiement.FEDAPAY
                || requete.moyenPaiement() == MoyenPaiement.AGENCE
                || (requete.moyenPaiement() == MoyenPaiement.MTN_MOMO && mtnMomoClient.estConfigure());
        if (!moyenReel && !simulationAutorisee) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Ce moyen de paiement n'est pas disponible. Choisissez \"Mobile Money (FedaPay)\".");
        }
        if (requete.moyenPaiement() == MoyenPaiement.FEDAPAY && !fedaPayClient.estConfigure()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Le paiement en ligne n'est pas encore configure. Reessayez plus tard.");
        }

        Transaction transaction = new Transaction();
        transaction.setUtilisateurId(utilisateurId);
        transaction.setMoyenPaiement(requete.moyenPaiement());
        transaction.setMontantFcfa(requete.montantFcfa());
        transaction.setTypeObjet(requete.typeObjet());
        transaction.setReferenceId(requete.referenceId());
        transaction.setStatut(StatutTransaction.EN_ATTENTE);
        transaction = transactionRepository.save(transaction);

        // Integration reelle MTN Mobile Money : demande de paiement envoyee
        // directement au telephone du client, statut confirme plus tard
        // (callback ou interrogation), jamais de maniere synchrone ici.
        if (requete.moyenPaiement() == MoyenPaiement.MTN_MOMO && mtnMomoClient.estConfigure()) {
            String referenceExterne = mtnMomoClient.demanderPaiement(
                    transaction.getMontantFcfa(), requete.telephonePayeur(),
                    "Paiement My Addictive #" + transaction.getId()
            );
            transaction.setIdTransactionExterne(referenceExterne);
            return transactionRepository.save(transaction);
        }

        // Paiement en agence (especes remises en main propre) : aucun agregateur
        // a interroger par nature, jamais de confirmation automatique, meme en
        // simulation - seule une confirmation manuelle explicite par un
        // administrateur peut faire passer cette transaction a REUSSI.
        if (requete.moyenPaiement() == MoyenPaiement.AGENCE) {
            transaction.setIdTransactionExterne("AGENCE-" + UUID.randomUUID());
            return transactionRepository.save(transaction);
        }

        // FedaPay (Mobile Money) : le montant est fixe ICI, cote serveur ; le client est envoye sur la
        // page de paiement FedaPay, puis revient sur /paiement/retour/{id}. La confirmation vient toujours
        // d'une verification serveur aupres de FedaPay (webhook, retour client ou interrogation periodique),
        // jamais du seul retour du navigateur.
        if (requete.moyenPaiement() == MoyenPaiement.FEDAPAY) {
            try {
                FedaPayClient.Paiement paiement = fedaPayClient.creerPaiement(
                        transaction.getMontantFcfa(),
                        "Paiement My Addictive #" + transaction.getId(),
                        urlRetourBase + "/paiement/retour/" + transaction.getId());
                transaction.setIdTransactionExterne(paiement.idExterne());
                transaction = transactionRepository.save(transaction);
                transaction.setUrlPaiement(paiement.url());
                return transaction;
            } catch (RuntimeException e) {
                log.error("Creation du paiement FedaPay impossible pour la transaction {} : {}", transaction.getId(), e.getMessage());
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Le service de paiement est momentanement indisponible. Reessayez dans un instant.");
            }
        }

        // Simulation (developpement, ou moyen de paiement sans integration reelle
        // branchee pour l'instant) : confirmation immediate pour tester la chaine
        // complete sans dependre d'un compte agregateur reel.
        String idSimule = "SIM-" + UUID.randomUUID();
        transaction.setIdTransactionExterne(idSimule);
        transaction = transactionRepository.save(transaction);
        log.warn("[MODE SIMULATION] Aucune integration reelle branchee pour {} : confirmation automatique de la transaction {}",
                requete.moyenPaiement(), transaction.getId());
        traiterWebhook(transaction.getId(), new WebhookRequest(StatutTransaction.REUSSI, idSimule));
        return transactionRepository.findById(transaction.getId()).orElseThrow();
    }

    /**
     * Interroge FedaPay (cote serveur, avec notre cle secrete) sur une transaction FedaPay EN_ATTENTE
     * et la confirme / la rejette selon sa reponse. Un montant different du montant attendu n'est
     * JAMAIS confirme.
     */
    @Transactional
    public Transaction verifierAupresDeFedapay(Transaction transaction) {
        if (transaction.getMoyenPaiement() != MoyenPaiement.FEDAPAY
                || transaction.getStatut() != StatutTransaction.EN_ATTENTE
                || transaction.getIdTransactionExterne() == null
                || !fedaPayClient.estConfigure()) {
            return transaction;
        }
        var verification = fedaPayClient.verifier(transaction.getIdTransactionExterne());
        if (verification.isEmpty()) return transaction;
        var v = verification.get();
        if (v.statut() == StatutTransaction.REUSSI && v.montantFcfa() != null
                && !v.montantFcfa().equals(transaction.getMontantFcfa())) {
            log.error("Montant FedaPay ({}) different du montant attendu ({}) pour la transaction {} : NON confirmee.",
                    v.montantFcfa(), transaction.getMontantFcfa(), transaction.getId());
            return transaction;
        }
        return traiterWebhook(transaction.getId(), new WebhookRequest(v.statut(), transaction.getIdTransactionExterne()));
    }

    /** Appelee par le client au retour de la page FedaPay : verification immediate, reservee au proprietaire. */
    @Transactional
    public Transaction verifierPourUtilisateur(Long utilisateurId, boolean admin, Long transactionId) {
        Transaction transaction = obtenir(transactionId);
        if (!admin && !transaction.getUtilisateurId().equals(utilisateurId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cette transaction ne vous appartient pas.");
        }
        return verifierAupresDeFedapay(transaction);
    }

    /**
     * Webhook FedaPay : on n'accorde AUCUNE confiance au contenu recu. Il sert uniquement de declencheur :
     * on retrouve la transaction par son identifiant FedaPay puis on verifie son vrai statut aupres de
     * FedaPay avec notre cle secrete. Un faux webhook ne peut donc rien confirmer.
     */
    @Transactional
    public void traiterWebhookFedapay(String idExterne) {
        if (idExterne == null || idExterne.isBlank()) return;
        transactionRepository.findByIdTransactionExterne(idExterne)
                .ifPresentOrElse(this::verifierAupresDeFedapay,
                        () -> log.warn("Webhook FedaPay pour une transaction externe inconnue : {}", idExterne));
    }

    public List<Transaction> transactionsFedapayEnAttente() {
        return transactionRepository.findByStatutAndMoyenPaiement(StatutTransaction.EN_ATTENTE, MoyenPaiement.FEDAPAY);
    }

    /**
     * Filet de securite periodique : verifie le statut reel d'un paiement FedaPay en attente. Sans
     * confirmation au bout d'une heure (page fermee, paiement abandonne), il passe en ECHEC, ce qui
     * restitue notamment le stock reserve par une commande boutique.
     */
    @Transactional
    public void relancerFedapay(Transaction transaction) {
        Transaction maj = verifierAupresDeFedapay(transaction);
        if (maj.getStatut() == StatutTransaction.EN_ATTENTE
                && maj.getDateCreation().isBefore(Instant.now().minusSeconds(60 * 60))) {
            log.info("Transaction FedaPay {} sans issue apres 1 h : passee en ECHEC.", maj.getId());
            traiterWebhook(maj.getId(), new WebhookRequest(StatutTransaction.ECHEC, null));
        }
    }

    /**
     * Confirmation manuelle d'un paiement en agence, reservee aux administrateurs
     * (bouton dedie du dashboard) : a utiliser une fois l'espece effectivement
     * receptionnee et verifiee physiquement.
     */
    @Transactional
    public Transaction confirmerManuellement(Long transactionId) {
        Transaction transaction = obtenir(transactionId);
        if (transaction.getMoyenPaiement() != MoyenPaiement.AGENCE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Seuls les paiements en agence necessitent une confirmation manuelle.");
        }
        return traiterWebhook(transactionId, new WebhookRequest(StatutTransaction.REUSSI, transaction.getIdTransactionExterne()));
    }

    /**
     * Traite le callback de l'agregateur (ou l'interrogation periodique de
     * secours). Idempotent : un webhook rejoue pour une transaction deja
     * traitee ne republie pas l'evenement.
     */
    @Transactional
    public Transaction traiterWebhook(Long transactionId, WebhookRequest requete) {
        Transaction transaction = transactionRepository.findByIdForUpdate(transactionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Transaction introuvable."));

        if (transaction.getStatut() != StatutTransaction.EN_ATTENTE) {
            log.info("Webhook recu pour une transaction deja traitee ({}), ignore (idempotence).", transactionId);
            return transaction;
        }

        transaction.setStatut(requete.statut());
        transaction.setDateMaj(Instant.now());
        if (requete.idTransactionExterne() != null) {
            transaction.setIdTransactionExterne(requete.idTransactionExterne());
        }
        if (transaction.getStatut() == StatutTransaction.ECHEC && transaction.getTypeObjet() == TypeObjetPaiement.COMMANDE) {
            // Seule la boutique doit etre prevenue d'un echec (restitution du stock reserve) :
            // la notification est renvoyee tant qu'elle n'est pas recue.
            transaction.setNotificationEnAttente(true);
        }
        if (transaction.getStatut() == StatutTransaction.REUSSI) {
            // Reste "en attente de notification" tant que le service metier n'a pas confirme
            // (voir relancerNotifications) : un redemarrage ne fait plus perdre un billet/titre paye.
            transaction.setNotificationEnAttente(true);
        }
        transaction = transactionRepository.save(transaction);

        if (transaction.getStatut() == StatutTransaction.REUSSI) {
            if (notifier.notifier(transaction)) {
                transaction.setNotificationEnAttente(false);
                transaction = transactionRepository.save(transaction);
            }
        } else if (transaction.getStatut() == StatutTransaction.ECHEC) {
            // Necessaire notamment pour boutique-service, qui reserve le stock des
            // l'initiation de la commande (voir BoutiqueService.initierCommande) :
            // sans cette notification, un stock reserve pour une commande finalement
            // non payee resterait indisponible indefiniment.
            if (transaction.getTypeObjet() == TypeObjetPaiement.COMMANDE) {
                if (notifier.notifierEchec(transaction)) {
                    transaction.setNotificationEnAttente(false);
                    transaction = transactionRepository.save(transaction);
                }
            } else {
                notifier.notifierEchec(transaction);
            }
        }
        return transaction;
    }

    /**
     * Renvoie les notifications de paiement reussi que le service metier n'a pas
     * pu recevoir (indisponible, en cours de redemarrage...). Appelee periodiquement.
     */
    public List<Long> notificationsEnAttente() {
        return transactionRepository.findByNotificationEnAttenteTrue().stream().map(Transaction::getId).toList();
    }

    @Transactional
    public void relancerNotification(Long transactionId) {
        transactionRepository.findByIdForUpdate(transactionId).ifPresent(t -> {
            if (!Boolean.TRUE.equals(t.getNotificationEnAttente())) return;
            boolean envoye;
            if (t.getStatut() == StatutTransaction.REUSSI) envoye = notifier.notifier(t);
            else if (t.getStatut() == StatutTransaction.ECHEC) envoye = notifier.notifierEchec(t);
            else return;
            if (envoye) {
                t.setNotificationEnAttente(false);
                transactionRepository.save(t);
                log.info("Notification de la transaction {} renvoyee avec succes.", t.getId());
            }
        });
    }

    /** Traite un callback MTN MoMo recu via son identifiant de reference externe (pas l'id interne). */
    @Transactional
    public Transaction traiterWebhookParReferenceExterne(String referenceExterne, StatutTransaction statut) {
        Transaction transaction = transactionRepository.findByIdTransactionExterne(referenceExterne)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Transaction introuvable pour cette reference."));
        return traiterWebhook(transaction.getId(), new WebhookRequest(statut, referenceExterne));
    }

    public Transaction obtenir(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Transaction introuvable."));
    }

    public List<Transaction> historique(Long utilisateurId) {
        return transactionRepository.findByUtilisateurIdOrderByDateCreationDesc(utilisateurId);
    }

    public List<Transaction> transactionsEnAttenteMtn() {
        return transactionRepository.findByStatutAndMoyenPaiement(StatutTransaction.EN_ATTENTE, MoyenPaiement.MTN_MOMO);
    }

    public List<Transaction> transactionsAgenceEnAttente() {
        return transactionRepository.findByStatutAndMoyenPaiement(StatutTransaction.EN_ATTENTE, MoyenPaiement.AGENCE);
    }

    public MtnMomoClient client() {
        return mtnMomoClient;
    }
}
