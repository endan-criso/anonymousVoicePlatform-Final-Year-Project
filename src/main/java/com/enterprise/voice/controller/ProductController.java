package com.enterprise.voice.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.enterprise.voice.dto.ProductRequest;
import com.enterprise.voice.dto.ProductResponse;
import com.enterprise.voice.security.UserPrincipal;
import com.enterprise.voice.service.ProductService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProductController {

    @Autowired
    private ProductService productService;

    @PostMapping
    @PreAuthorize("hasRole('COMPANY_AGENT')")
    public ResponseEntity<?> createProduct(
            @Valid @RequestBody ProductRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        try {
            ProductResponse response = productService.createProduct(request, currentUser.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{productId}/bind/{customerId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPANY_AGENT')")
    public ResponseEntity<?> bindProductToCustomer(
            @PathVariable String productId,
            @PathVariable Long customerId) {
        try {
            ProductResponse response = productService.bindProductToCustomer(productId, customerId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'COMPANY_AGENT', 'ADMIN')")
    public ResponseEntity<?> getProductById(@PathVariable Long id) {
        try {
            ProductResponse response = productService.getProductById(id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/product-id/{productId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'COMPANY_AGENT', 'ADMIN')")
    public ResponseEntity<?> getProductByProductId(@PathVariable String productId) {
        try {
            ProductResponse response = productService.getProductByProductId(productId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'COMPANY_AGENT', 'ADMIN')")
    public ResponseEntity<?> getProductsByCustomer(@PathVariable Long customerId) {
        try {
            List<ProductResponse> response = productService.getProductsByCustomer(customerId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/my-products")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> getMyProducts(@AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            List<ProductResponse> response = productService.getProductsByCustomer(currentUser.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'COMPANY_AGENT', 'CUSTOMER')")
    public ResponseEntity<?> getAllProducts() {
        try {
            List<ProductResponse> response = productService.getAllProducts();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
