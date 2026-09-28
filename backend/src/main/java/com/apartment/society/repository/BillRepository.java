package com.apartment.society.repository;

import com.apartment.society.model.MaintenanceBill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface BillRepository extends JpaRepository<MaintenanceBill, Long> {

    List<MaintenanceBill> findByFlatId(Long flatId);

}
