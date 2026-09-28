package com.apartment.society.repository;

import com.apartment.society.model.Flat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface FlatRepository extends JpaRepository<Flat, Long> {

}
