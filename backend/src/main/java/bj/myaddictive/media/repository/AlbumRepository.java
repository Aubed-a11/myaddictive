package bj.myaddictive.media.repository;

import bj.myaddictive.media.domain.Album;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlbumRepository extends JpaRepository<Album, Long> {
    List<Album> findAllByOrderByAnneeDescIdDesc();
}
