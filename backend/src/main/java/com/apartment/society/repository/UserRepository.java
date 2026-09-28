package com.apartment.society.repository;

import com.apartment.society.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import com.apartment.society.model.Role;
import java.util.*;

public interface UserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmail(String email);
    List<AppUser> findByRole(Role role);

}
