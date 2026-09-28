package com.apartment.society.repository;

import com.apartment.society.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

}
