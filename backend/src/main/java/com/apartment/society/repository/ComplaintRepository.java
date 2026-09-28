package com.apartment.society.repository;

import com.apartment.society.model.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findByResidentId(Long residentId);

}
