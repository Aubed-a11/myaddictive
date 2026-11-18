package bj.myaddictive.app;

import bj.myaddictive.live.domain.Billet;
import bj.myaddictive.live.domain.Evenement;
import bj.myaddictive.live.repository.BilletRepository;
import bj.myaddictive.live.repository.EvenementRepository;
import bj.myaddictive.votes.domain.Candidat;
import bj.myaddictive.votes.domain.Competition;
import bj.myaddictive.votes.domain.Vote;
import bj.myaddictive.votes.repository.CandidatRepository;
import bj.myaddictive.votes.repository.CompetitionRepository;
import bj.myaddictive.votes.repository.VoteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Supprime les donnees de demonstration ("[DEMO]") creees par d'anciennes
 * versions : evenements (et leurs billets), competitions de votes (candidats
 * et votes compris). Seule la boutique conserve ses produits d'exemple.
 * Idempotent : ne fait rien une fois la base nettoyee.
 */
@Component
@Order(1)
public class NettoyageDonneesDemo implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(NettoyageDonneesDemo.class);
    private static final String MARQUEUR = "[DEMO]";

    private final EvenementRepository evenements;
    private final BilletRepository billets;
    private final CompetitionRepository competitions;
    private final CandidatRepository candidats;
    private final VoteRepository votes;

    public NettoyageDonneesDemo(EvenementRepository evenements, BilletRepository billets,
                                CompetitionRepository competitions, CandidatRepository candidats,
                                VoteRepository votes) {
        this.evenements = evenements;
        this.billets = billets;
        this.competitions = competitions;
        this.candidats = candidats;
        this.votes = votes;
    }

    @Override
    public void run(String... args) {
        List<Evenement> evtDemo = evenements.findAll().stream()
                .filter(e -> e.getTitre() != null && e.getTitre().startsWith(MARQUEUR)).toList();
        if (!evtDemo.isEmpty()) {
            Set<Long> ids = new HashSet<>();
            evtDemo.forEach(e -> ids.add(e.getId()));
            List<Billet> bil = billets.findAll().stream().filter(b -> ids.contains(b.getEvenementId())).toList();
            billets.deleteAll(bil);
            evenements.deleteAll(evtDemo);
            log.info("Evenements de demonstration supprimes : {} (billets associes : {}).", evtDemo.size(), bil.size());
        }

        List<Competition> compDemo = competitions.findAll().stream()
                .filter(c -> c.getNom() != null && c.getNom().startsWith(MARQUEUR)).toList();
        if (!compDemo.isEmpty()) {
            Set<Long> ids = new HashSet<>();
            compDemo.forEach(c -> ids.add(c.getId()));
            List<Vote> v = votes.findAll().stream().filter(x -> ids.contains(x.getCompetitionId())).toList();
            votes.deleteAll(v);
            List<Candidat> cand = candidats.findAll().stream().filter(x -> ids.contains(x.getCompetitionId())).toList();
            candidats.deleteAll(cand);
            competitions.deleteAll(compDemo);
            log.info("Competitions de demonstration supprimees : {} ({} candidats, {} votes).", compDemo.size(), cand.size(), v.size());
        }
    }
}
