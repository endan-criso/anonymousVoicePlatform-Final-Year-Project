package com.enterprise.voice.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import com.enterprise.voice.model.Role;
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
    public ProductResponse createProduct(ProductRequest request, Long agentId) {

        User agent = userRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent not found"));

        if(agent.getRole() != Role.COMPANY_AGENT){
            throw new RuntimeException("Only agents can create products");
        }

        Product product = new Product();
        product.setProductId(generateProductId());
        product.setProductName(request.getProductName());
        product.setDescription(request.getDescription());
        product.setRegisteredAt(LocalDateTime.now());

        product.setAssignedAgent(agent);

        product = productRepository.save(product);

        return mapToResponse(product);
    }

    private String generateProductId() {
        String timestamp = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        long count = productRepository.count() + 1;

        return String.format("PRD-%s-%04d", timestamp, count);
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
