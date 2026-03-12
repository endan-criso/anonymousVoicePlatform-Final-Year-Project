package com.enterprise.voice.model;

import com.enterprise.voice.service.CallStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "call_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CallLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caller_id", nullable = false)
    private User caller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CallStatus callStatus;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime startTime;

    @Column
    private LocalDateTime endTime;

    // Duration in seconds
    @Column
    private Long duration;

    @Column(nullable = false)
    private Boolean wasSuccessful = false;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // Method to calculate and set duration
    public void calculateDuration() {
        if (startTime != null && endTime != null) {
            this.duration = java.time.Duration.between(startTime, endTime).getSeconds();
        }
    }
}