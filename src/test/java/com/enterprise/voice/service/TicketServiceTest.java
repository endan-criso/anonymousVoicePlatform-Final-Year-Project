package com.enterprise.voice.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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

/**
 * Unit tests for TicketService
 * Tests ticket creation, assignment, and status validation
 */
@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TicketService ticketService;

    private User customer;
    private User agent;
    private Product product;
    private Ticket ticket;

    @BeforeEach
    void setUp() {
        // Setup customer
        customer = new User();
        customer.setId(1L);
        customer.setUsername("customer1");
        customer.setAnonymousId("CUST-12345678");
        customer.setRole(Role.CUSTOMER);

        // Setup agent
        agent = new User();
        agent.setId(2L);
        agent.setUsername("agent1");
        agent.setAnonymousId("AGENT-87654321");
        agent.setRole(Role.COMPANY_AGENT);

        // Setup product
        product = new Product();
        product.setId(1L);
        product.setProductId("PROD-001");
        product.setProductName("Test Product");
        product.setCustomer(customer);

        // Setup ticket
        ticket = new Ticket();
        ticket.setId(1L);
        ticket.setTicketId("TICK-20260125120000-0001");
        ticket.setSubject("Test Issue");
        ticket.setDescription("Test Description");
        ticket.setStatus(TicketStatus.ACTIVE);
        ticket.setCustomer(customer);
        ticket.setProduct(product);
    }

    @Test
    void testCreateTicket_Success() {
        // Arrange
        TicketRequest request = new TicketRequest();
        request.setSubject("Test Issue");
        request.setDescription("Test Description");
        request.setProductId(1L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(ticket);
        when(ticketRepository.count()).thenReturn(0L);

        // Act
        TicketResponse response = ticketService.createTicket(request, 1L);

        // Assert
        assertNotNull(response);
        assertEquals("Test Issue", response.getSubject());
        assertEquals("Test Description", response.getDescription());
        assertEquals("ACTIVE", response.getStatus());
        assertEquals("CUST-12345678", response.getCustomerAnonymousId());
        assertEquals("PROD-001", response.getProductId());

        verify(ticketRepository, times(1)).save(any(Ticket.class));
    }

    @Test
    void testCreateTicket_CustomerNotFound() {
        // Arrange
        TicketRequest request = new TicketRequest();
        request.setSubject("Test Issue");
        request.setDescription("Test Description");
        request.setProductId(1L);

        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            ticketService.createTicket(request, 1L);
        });

        verify(ticketRepository, never()).save(any(Ticket.class));
    }

    @Test
    void testCreateTicket_OnlyCustomersCanCreate() {
        // Arrange
        User nonCustomer = new User();
        nonCustomer.setId(3L);
        nonCustomer.setRole(Role.COMPANY_AGENT);

        TicketRequest request = new TicketRequest();
        request.setSubject("Test Issue");
        request.setDescription("Test Description");
        request.setProductId(1L);

        when(userRepository.findById(3L)).thenReturn(Optional.of(nonCustomer));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            ticketService.createTicket(request, 3L);
        });

        assertEquals("Only customers can create tickets", exception.getMessage());
        verify(ticketRepository, never()).save(any(Ticket.class));
    }

    @Test
    void testCreateTicket_ProductNotFound() {
        // Arrange
        TicketRequest request = new TicketRequest();
        request.setSubject("Test Issue");
        request.setDescription("Test Description");
        request.setProductId(999L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            ticketService.createTicket(request, 1L);
        });

        verify(ticketRepository, never()).save(any(Ticket.class));
    }

    @Test
    void testAssignTicket_Success() {
        // Arrange
        AssignTicketRequest request = new AssignTicketRequest();
        request.setAgentId(2L);

        Ticket assignedTicket = new Ticket();
        assignedTicket.setId(1L);
        assignedTicket.setTicketId("TICK-20260125120000-0001");
        assignedTicket.setSubject("Test Issue");
        assignedTicket.setStatus(TicketStatus.IN_PROGRESS);
        assignedTicket.setCustomer(customer);
        assignedTicket.setProduct(product);
        assignedTicket.setAssignedAgent(agent);

        when(ticketRepository.findByTicketId("TICK-20260125120000-0001")).thenReturn(Optional.of(ticket));
        when(userRepository.findById(2L)).thenReturn(Optional.of(agent));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(assignedTicket);

        // Act
        TicketResponse response = ticketService.assignTicket("TICK-20260125120000-0001", request);

        // Assert
        assertNotNull(response);
        assertEquals("IN_PROGRESS", response.getStatus());
        assertEquals("AGENT-87654321", response.getAssignedAgentAnonymousId());

        verify(ticketRepository, times(1)).save(any(Ticket.class));
    }

    @Test
    void testAssignTicket_OnlyAgentsCanBeAssigned() {
        // Arrange
        User nonAgent = new User();
        nonAgent.setId(3L);
        nonAgent.setRole(Role.CUSTOMER);

        AssignTicketRequest request = new AssignTicketRequest();
        request.setAgentId(3L);

        when(ticketRepository.findByTicketId("TICK-20260125120000-0001")).thenReturn(Optional.of(ticket));
        when(userRepository.findById(3L)).thenReturn(Optional.of(nonAgent));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            ticketService.assignTicket("TICK-20260125120000-0001", request);
        });

        assertEquals("User is not a company agent", exception.getMessage());
        verify(ticketRepository, never()).save(any(Ticket.class));
    }

    @Test
    void testCloseTicket_Success() {
        // Arrange
        Ticket closedTicket = new Ticket();
        closedTicket.setId(1L);
        closedTicket.setTicketId("TICK-20260125120000-0001");
        closedTicket.setSubject("Test Issue");
        closedTicket.setStatus(TicketStatus.CLOSED);
        closedTicket.setCustomer(customer);
        closedTicket.setProduct(product);

        when(ticketRepository.findByTicketId("TICK-20260125120000-0001")).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(closedTicket);

        // Act
        TicketResponse response = ticketService.closeTicket("TICK-20260125120000-0001");

        // Assert
        assertNotNull(response);
        assertEquals("CLOSED", response.getStatus());

        verify(ticketRepository, times(1)).save(any(Ticket.class));
    }

    @Test
    void testCloseTicket_TicketNotFound() {
        // Arrange
        when(ticketRepository.findByTicketId("INVALID-TICKET")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            ticketService.closeTicket("INVALID-TICKET");
        });

        verify(ticketRepository, never()).save(any(Ticket.class));
    }

    @Test
    void testGetTicketById_Success() {
        // Arrange
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));

        // Act
        TicketResponse response = ticketService.getTicketById(1L);

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("TICK-20260125120000-0001", response.getTicketId());
        assertEquals("Test Issue", response.getSubject());
    }

    @Test
    void testGetTicketById_NotFound() {
        // Arrange
        when(ticketRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            ticketService.getTicketById(999L);
        });
    }

    @Test
    void testTicketStatusValidation() {
        // Test that ticket starts with ACTIVE status
        assertEquals(TicketStatus.ACTIVE, ticket.getStatus());

        // Test status transitions
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        assertEquals(TicketStatus.IN_PROGRESS, ticket.getStatus());

        ticket.setStatus(TicketStatus.CLOSED);
        assertEquals(TicketStatus.CLOSED, ticket.getStatus());
    }
}
