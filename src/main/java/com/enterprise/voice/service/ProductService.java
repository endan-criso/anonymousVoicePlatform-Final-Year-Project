package com.enterprise.voice.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.enterprise.voice.dto.ProductRequest;
import com.enterprise.voice.dto.ProductResponse;
import com.enterprise.voice.model.Product;
import com.enterprise.voice.model.User;
import com.enterprise.voice.repository.ProductRepository;
import com.enterprise.voice.repository.UserRepository;

@Service
public class ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductService.class);

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        logger.info("Creating product: {}", request.getProductId());

        if (productRepository.existsByProductId(request.getProductId())) {
            logger.warn("Product creation failed: Product ID {} already exists", request.getProductId());
            throw new RuntimeException("Product ID already exists");
        }

        Product product = new Product();
        product.setProductId(request.getProductId());
        product.setProductName(request.getProductName());
        product.setDescription(request.getDescription());
        product.setIsActive(true);
        product.setRegisteredAt(LocalDateTime.now());

        if (request.getCustomerId() != null) {
            User customer = userRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new RuntimeException("Customer not found"));
            product.setCustomer(customer);
            logger.info("Product {} created and bound to customer {}", request.getProductId(),
                    customer.getAnonymousId());
        } else {
            logger.info("Product {} created without customer binding", request.getProductId());
        }

        product = productRepository.save(product);
        return mapToResponse(product);
    }

    @Transactional
    public ProductResponse bindProductToCustomer(String productId, Long customerId) {
        logger.info("Binding product {} to customer ID: {}", productId, customerId);

        Product product = productRepository.findByProductId(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (customer.getRole() != com.enterprise.voice.model.Role.CUSTOMER) {
            logger.warn("Product binding failed: User {} is not a customer", customerId);
            throw new RuntimeException("User is not a customer");
        }

        product.setCustomer(customer);
        product.setRegisteredAt(LocalDateTime.now());
        product = productRepository.save(product);

        logger.info("Product {} successfully bound to customer {}", productId, customer.getAnonymousId());
        return mapToResponse(product);
    }

    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        return mapToResponse(product);
    }

    public ProductResponse getProductByProductId(String productId) {
        Product product = productRepository.findByProductId(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        return mapToResponse(product);
    }

    public List<ProductResponse> getProductsByCustomer(Long customerId) {
        List<Product> products = productRepository.findByCustomerId(customerId);
        return products.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ProductResponse mapToResponse(Product product) {
        ProductResponse response = new ProductResponse();
        response.setId(product.getId());
        response.setProductId(product.getProductId());
        response.setProductName(product.getProductName());
        response.setDescription(product.getDescription());
        response.setIsActive(product.getIsActive());
        response.setRegisteredAt(product.getRegisteredAt());
        response.setCreatedAt(product.getCreatedAt());

        if (product.getCustomer() != null) {
            response.setCustomerAnonymousId(product.getCustomer().getAnonymousId());
        }

        return response;
    }
}
