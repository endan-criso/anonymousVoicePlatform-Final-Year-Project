package com.enterprise.voice.repository;

import com.enterprise.voice.model.CallLog;
import com.enterprise.voice.model.Ticket;
import com.enterprise.voice.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CallLogRepository extends JpaRepository<CallLog, Long> {
    
    List<CallLog> findByTicket(Ticket ticket);
    
    List<CallLog> findByTicketId(Long ticketId);
    
    List<CallLog> findByCaller(User caller);
    
    List<CallLog> findByReceiver(User receiver);
    
    List<CallLog> findByCallerIdOrReceiverId(Long callerId, Long receiverId);
    
    @Query("SELECT c FROM CallLog c WHERE c.ticket.id = :ticketId ORDER BY c.startTime DESC")
    List<CallLog> findByTicketIdOrderByStartTimeDesc(@Param("ticketId") Long ticketId);
    
    @Query("SELECT c FROM CallLog c WHERE (c.caller.id = :userId OR c.receiver.id = :userId) " +
           "AND c.startTime BETWEEN :startDate AND :endDate")
    List<CallLog> findCallsByUserAndDateRange(
        @Param("userId") Long userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
}

