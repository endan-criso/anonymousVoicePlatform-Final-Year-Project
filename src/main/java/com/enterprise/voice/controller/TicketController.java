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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.enterprise.voice.dto.AssignTicketRequest;
import com.enterprise.voice.dto.TicketRequest;
import com.enterprise.voice.dto.TicketResponse;
import com.enterprise.voice.security.UserPrincipal;
import com.enterprise.voice.service.TicketService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*", maxAge = 3600)
public class TicketController {

    @Autowired
    private TicketService ticketService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> createTicket(
            @Valid @RequestBody TicketRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            TicketResponse response = ticketService.createTicket(request, currentUser.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{ticketId}/assign")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPANY_AGENT')")
    public ResponseEntity<?> assignTicket(
            @PathVariable String ticketId,
            @Valid @RequestBody AssignTicketRequest request) {
        try {
            TicketResponse response = ticketService.assignTicket(ticketId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{ticketId}/close")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPANY_AGENT')")
    public ResponseEntity<?> closeTicket(@PathVariable String ticketId) {
        try {
            TicketResponse response = ticketService.closeTicket(ticketId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'COMPANY_AGENT', 'ADMIN')")
    public ResponseEntity<?> getTicketById(@PathVariable Long id) {
        try {
            TicketResponse response = ticketService.getTicketById(id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/ticket-id/{ticketId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'COMPANY_AGENT', 'ADMIN')")
    public ResponseEntity<?> getTicketByTicketId(@PathVariable String ticketId) {
        try {
            TicketResponse response = ticketService.getTicketByTicketId(ticketId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/my-tickets")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> getMyTickets(@AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            List<TicketResponse> response = ticketService.getTicketsByCustomer(currentUser.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/assigned-to-me")
    @PreAuthorize("hasRole('COMPANY_AGENT')")
    public ResponseEntity<?> getMyAssignedTickets(@AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            List<TicketResponse> response = ticketService.getTicketsByAgent(currentUser.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPANY_AGENT')")
    public ResponseEntity<?> getTicketsByCustomer(@PathVariable Long customerId) {
        try {
            List<TicketResponse> response = ticketService.getTicketsByCustomer(customerId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPANY_AGENT')")
    public ResponseEntity<?> getActiveTickets() {
        try {
            List<TicketResponse> response = ticketService.getActiveTickets();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllTickets() {
        try {
            List<TicketResponse> response = ticketService.getAllTickets();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
