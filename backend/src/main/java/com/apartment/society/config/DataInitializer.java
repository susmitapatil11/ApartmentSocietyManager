package com.apartment.society.config;

import com.apartment.society.model.AppUser;
import com.apartment.society.model.Flat;
import com.apartment.society.model.MaintenanceBill;
import com.apartment.society.model.PaymentStatus;
import com.apartment.society.model.Role;
import com.apartment.society.repository.BillRepository;
import com.apartment.society.repository.FlatRepository;
import com.apartment.society.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedData(
            FlatRepository flatRepository,
            UserRepository userRepository,
            BillRepository billRepository,
            PasswordEncoder encoder) {

        return args -> {



            Flat flat = flatRepository.findAll()
                    .stream()
                    .findFirst()
                    .orElse(null);

            if (flat == null) {

                flat = flatRepository.save(
                        new Flat("A-101", "A", 1, "2 BHK")
                );

                flatRepository.save(
                        new Flat("A-102", "A", 1, "2 BHK")
                );

                flatRepository.save(
                        new Flat("B-201", "B", 2, "3 BHK")
                );
            }



            if (userRepository.findByEmail("admin@society.com").isEmpty()) {

                AppUser admin = new AppUser(
                        "Society Admin",
                        "admin@society.com",
                        encoder.encode("admin123"),
                        Role.ADMIN,
                        null
                );

                userRepository.save(admin);
            }


            if (userRepository.findByEmail("resident@society.com").isEmpty()) {

                AppUser resident = new AppUser(
                        "Demo Resident",
                        "resident@society.com",
                        encoder.encode("resident123"),
                        Role.RESIDENT,
                        flat
                );

                userRepository.save(resident);
            }


            if (billRepository.count() == 0) {

                MaintenanceBill bill = new MaintenanceBill();

                bill.setFlat(flat);
                bill.setMonth("September 2026");
                bill.setAmount(new BigDecimal("2500"));
                bill.setDueDate(LocalDate.of(2026, 9, 30));
                bill.setStatus(PaymentStatus.PENDING);

                billRepository.save(bill);
            }
        };
    }
}