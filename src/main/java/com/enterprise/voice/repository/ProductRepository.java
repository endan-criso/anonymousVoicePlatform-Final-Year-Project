package com.enterprise.voice.repository;

import com.enterprise.voice.model.Product;
import com.enterprise.voice.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    Optional<Product> findByProductId(String productId);
    
    List<Product> findByCustomer(User customer);
    
    List<Product> findByCustomerId(Long customerId);
    
    List<Product> findByIsActive(Boolean isActive);
    
    boolean existsByProductId(String productId);
}

