package com.enterprise.voice.service;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.enterprise.voice.dto.AuthResponse;
import com.enterprise.voice.dto.LoginRequest;
import com.enterprise.voice.dto.RegisterRequest;
import com.enterprise.voice.model.Role;
import com.enterprise.voice.model.User;
import com.enterprise.voice.repository.UserRepository;
import com.enterprise.voice.security.JwtTokenProvider;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        logger.info("Registration attempt for username: {}, role: {}", request.getUsername(), request.getRole());

        // Check if username exists
        if (userRepository.existsByUsername(request.getUsername())) {
            logger.warn("Registration failed: Username {} already taken", request.getUsername());
            throw new RuntimeException("Username is already taken");
        }

        // Check if email exists
        if (userRepository.existsByEmail(request.getEmail())) {
            logger.warn("Registration failed: Email {} already in use", request.getEmail());
            throw new RuntimeException("Email is already in use");
        }

        // Create new user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setIsActive(true);

        // Generate anonymous ID
        user.setAnonymousId(generateAnonymousId(request.getRole()));

        userRepository.save(user);
        logger.info("User registered successfully: {} with anonymous ID: {}", request.getUsername(),
                user.getAnonymousId());

        // Generate JWT token
        String token = tokenProvider.generateTokenFromUsername(user.getUsername());

        return new AuthResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getAnonymousId());
    }

    public AuthResponse login(LoginRequest request) {
        logger.info("Login attempt for username: {}", request.getUsername());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        logger.info("User logged in successfully: {} ({})", request.getUsername(), user.getAnonymousId());

        return new AuthResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getAnonymousId());
    }

    private String generateAnonymousId(Role role) {
        String prefix = switch (role) {
            case CUSTOMER -> "CUST";
            case COMPANY_AGENT -> "AGENT";
            case ADMIN -> "ADMIN";
        };

        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
