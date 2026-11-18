package bj.myaddictive.media.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "media_piste_album")
public class PisteAlbum {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "album_id", nullable = false)
    private Long albumId;

    @Column(nullable = false)
    private String titre;

    @Column(length = 20)
    private String duree;

    private String collaboration;

    /** Lien YouTube (embed) du clip, s'il existe. */
    @Column(name = "video_url")
    private String videoUrl;

    private Integer ordre;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getAlbumId() { return albumId; }
    public void setAlbumId(Long albumId) { this.albumId = albumId; }
    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }
    public String getDuree() { return duree; }
    public void setDuree(String duree) { this.duree = duree; }
    public String getCollaboration() { return collaboration; }
    public void setCollaboration(String collaboration) { this.collaboration = collaboration; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    public Integer getOrdre() { return ordre; }
    public void setOrdre(Integer ordre) { this.ordre = ordre; }
}
