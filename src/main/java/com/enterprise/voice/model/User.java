package com.enterprise.voice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String username;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    // Store anonymized identifier for company agents to see
    @Column(unique = true)
    private String anonymousId;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    // Relationships
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL)
    private Set<Product> products = new HashSet<>();
    
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL)
    private Set<Ticket> createdTickets = new HashSet<>();
    
    @OneToMany(mappedBy = "assignedAgent", cascade = CascadeType.ALL)
    private Set<Ticket> assignedTickets = new HashSet<>();
}

