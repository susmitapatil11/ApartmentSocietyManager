package com.apartment.society.repository;

import com.apartment.society.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByFlatId(Long flatId);

}
