package bj.myaddictive.media.domain;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "media_album")
public class Album {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    private String artiste;

    @Column(length = 10)
    private String annee;

    private String label;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "source_legacy_id", length = 40)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private String sourceLegacyId;

    /** Renseigne par le service pour le detail d'un album (non persiste ici). */
    @Transient
    private List<PisteAlbum> pistes = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }
    public String getArtiste() { return artiste; }
    public void setArtiste(String artiste) { this.artiste = artiste; }
    public String getAnnee() { return annee; }
    public void setAnnee(String annee) { this.annee = annee; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getSourceLegacyId() { return sourceLegacyId; }
    public void setSourceLegacyId(String sourceLegacyId) { this.sourceLegacyId = sourceLegacyId; }
    public List<PisteAlbum> getPistes() { return pistes; }
    public void setPistes(List<PisteAlbum> pistes) { this.pistes = pistes; }
}
