package com.hms.repository;

import com.hms.model.User;
import com.hms.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(Role role);

    List<User> findByRoleAndSpecializationContainingIgnoreCase(Role role, String specialization);

    List<User> findByRoleAndNameContainingIgnoreCase(Role role, String name);

    List<User> findByRoleAndDepartmentContainingIgnoreCase(Role role, String department);
}
