package com.enterprise.voice.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.enterprise.voice.dto.AssignTicketRequest;
import com.enterprise.voice.dto.TicketRequest;
import com.enterprise.voice.dto.TicketResponse;
import com.enterprise.voice.model.Product;
import com.enterprise.voice.model.Role;
import com.enterprise.voice.model.Ticket;
import com.enterprise.voice.model.TicketStatus;
import com.enterprise.voice.model.User;
import com.enterprise.voice.repository.ProductRepository;
import com.enterprise.voice.repository.TicketRepository;
import com.enterprise.voice.repository.UserRepository;

@Service
public class TicketService {

    private static final Logger logger = LoggerFactory.getLogger(TicketService.class);

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public TicketResponse createTicket(TicketRequest request, Long customerId) {
        logger.info("Creating ticket for customer ID: {}, product ID: {}", customerId, request.getProductId());

        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (customer.getRole() != Role.CUSTOMER) {
            logger.warn("Non-customer user {} attempted to create ticket", customerId);
            throw new RuntimeException("Only customers can create tickets");
        }

        Product product = productRepository.findByProductId(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Verify product belongs to customer
        /*
        if (product.getCustomer() == null || !product.getCustomer().getId().equals(customerId)) {
            logger.warn("Customer {} attempted to create ticket for product {} they don't own", customerId,
                    request.getProductId());
            throw new RuntimeException("Product does not belong to this customer");
        }*/

        Ticket ticket = new Ticket();
        ticket.setTicketId(generateTicketId());
        ticket.setSubject(request.getSubject());
        ticket.setDescription(request.getDescription());
        ticket.setStatus(TicketStatus.ACTIVE);
        ticket.setCustomer(customer);
        ticket.setProduct(product);

        User agent = product.getAssignedAgent();


        if (agent == null) {
            throw new RuntimeException("Product has no assigned agent");
        }

        ticket.setAssignedAgent(agent);

        ticket = ticketRepository.save(ticket);
        logger.info("Ticket created successfully: {} for customer: {}", ticket.getTicketId(),
                customer.getAnonymousId());
        return mapToResponse(ticket);
    }

    @Transactional
    public TicketResponse assignTicket(String ticketId, AssignTicketRequest request) {
        logger.info("Assigning ticket {} to agent ID: {}", ticketId, request.getAgentId());

        Ticket ticket = ticketRepository.findByTicketId(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User agent = userRepository.findById(request.getAgentId())
                .orElseThrow(() -> new RuntimeException("Agent not found"));

        if (agent.getRole() != Role.COMPANY_AGENT) {
            logger.warn("Non-agent user {} attempted to be assigned to ticket {}", request.getAgentId(), ticketId);
            throw new RuntimeException("User is not a company agent");
        }

        ticket.setAssignedAgent(agent);
        ticket.setAssignedAt(LocalDateTime.now());
        ticket.setStatus(TicketStatus.IN_PROGRESS);

        ticket = ticketRepository.save(ticket);
        logger.info("Ticket {} assigned to agent: {}, status changed to IN_PROGRESS", ticketId, agent.getAnonymousId());
        return mapToResponse(ticket);
    }

    @Transactional
    public TicketResponse closeTicket(String ticketId) {
        logger.info("Closing ticket: {}", ticketId);

        Ticket ticket = ticketRepository.findByTicketId(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        ticket.setStatus(TicketStatus.CLOSED);
        ticket.setClosedAt(LocalDateTime.now());

        ticket = ticketRepository.save(ticket);
        logger.info("Ticket {} closed successfully. Call access revoked.", ticketId);
        return mapToResponse(ticket);
    }

    public TicketResponse getTicketById(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        return mapToResponse(ticket);
    }

    public TicketResponse getTicketByTicketId(String ticketId) {
        Ticket ticket = ticketRepository.findByTicketId(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        return mapToResponse(ticket);
    }

    public List<TicketResponse> getTicketsByCustomer(Long customerId) {
        List<Ticket> tickets = ticketRepository.findByCustomerId(customerId);
        return tickets.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<TicketResponse> getTicketsByAgent(Long agentId) {
        List<Ticket> tickets = ticketRepository.findByAssignedAgentId(agentId);
        return tickets.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<TicketResponse> getActiveTickets() {
        List<Ticket> tickets = ticketRepository.findByStatus(TicketStatus.ACTIVE);
        return tickets.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<TicketResponse> getAllTickets() {
        return ticketRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private String generateTicketId() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        long count = ticketRepository.count() + 1;
        return String.format("TICK-%s-%04d", timestamp, count);
    }

    private TicketResponse mapToResponse(Ticket ticket) {
        TicketResponse response = new TicketResponse();
        response.setId(ticket.getId());
        response.setTicketId(ticket.getTicketId());
        response.setSubject(ticket.getSubject());
        response.setDescription(ticket.getDescription());
        response.setStatus(ticket.getStatus().name());
        response.setCreatedAt(ticket.getCreatedAt());
        response.setAssignedAt(ticket.getAssignedAt());
        response.setClosedAt(ticket.getClosedAt());
        response.setCallAllowed(ticket.isCallAllowed());

        if (ticket.getCustomer() != null) {
            response.setCustomerAnonymousId(ticket.getCustomer().getAnonymousId());
        }

        if (ticket.getProduct() != null) {
            response.setProductId(ticket.getProduct().getProductId());
        }

        if (ticket.getAssignedAgent() != null) {
            response.setAssignedAgentAnonymousId(ticket.getAssignedAgent().getAnonymousId());
        }

        return response;
    }
}
