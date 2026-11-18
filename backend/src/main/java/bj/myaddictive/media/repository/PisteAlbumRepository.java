package bj.myaddictive.media.repository;

import bj.myaddictive.media.domain.PisteAlbum;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PisteAlbumRepository extends JpaRepository<PisteAlbum, Long> {
    List<PisteAlbum> findByAlbumIdOrderByOrdreAsc(Long albumId);
}
