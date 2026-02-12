package com.enterprise.voice.repository;

import com.enterprise.voice.model.Ticket;
import com.enterprise.voice.model.TicketStatus;
import com.enterprise.voice.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    
    Optional<Ticket> findByTicketId(String ticketId);
    
    List<Ticket> findByCustomer(User customer);
    
    List<Ticket> findByCustomerId(Long customerId);
    
    List<Ticket> findByAssignedAgent(User agent);
    
    List<Ticket> findByAssignedAgentId(Long agentId);
    
    List<Ticket> findByStatus(TicketStatus status);
    
    List<Ticket> findByCustomerIdAndStatus(Long customerId, TicketStatus status);
    
    List<Ticket> findByAssignedAgentIdAndStatus(Long agentId, TicketStatus status);
    
    @Query("SELECT t FROM Ticket t WHERE t.status IN ('ACTIVE', 'IN_PROGRESS') AND t.assignedAgent.id = :agentId")
    List<Ticket> findActiveTicketsByAgent(@Param("agentId") Long agentId);
    
    @Query("SELECT t FROM Ticket t WHERE t.status IN ('ACTIVE', 'IN_PROGRESS') AND t.customer.id = :customerId")
    List<Ticket> findActiveTicketsByCustomer(@Param("customerId") Long customerId);
    
    boolean existsByTicketId(String ticketId);
}

