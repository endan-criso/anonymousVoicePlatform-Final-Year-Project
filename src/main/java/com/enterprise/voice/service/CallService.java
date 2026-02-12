package com.enterprise.voice.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.enterprise.voice.dto.CallLogResponse;
import com.enterprise.voice.dto.CallPermissionRequest;
import com.enterprise.voice.dto.CallPermissionResponse;
import com.enterprise.voice.model.CallLog;
import com.enterprise.voice.model.Ticket;
import com.enterprise.voice.model.User;
import com.enterprise.voice.repository.CallLogRepository;
import com.enterprise.voice.repository.TicketRepository;
import com.enterprise.voice.repository.UserRepository;
import com.enterprise.voice.security.JwtTokenProvider;

@Service
public class CallService {

    private static final Logger logger = LoggerFactory.getLogger(CallService.class);

    @Autowired
    private CallLogRepository callLogRepository;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    public CallPermissionResponse validateCallPermission(CallPermissionRequest request) {
        logger.debug("Validating call permission for ticket ID: {}, caller ID: {}, receiver ID: {}",
                request.getTicketId(), request.getCallerId(), request.getReceiverId());

        try {
            Ticket ticket = ticketRepository.findById(request.getTicketId())
                    .orElseThrow(() -> new RuntimeException("Ticket not found"));

            User caller = userRepository.findById(request.getCallerId())
                    .orElseThrow(() -> new RuntimeException("Caller not found"));

            User receiver = userRepository.findById(request.getReceiverId())
                    .orElseThrow(() -> new RuntimeException("Receiver not found"));

            // Validation checks
            if (!ticket.isCallAllowed()) {
                logger.warn(
                        "Call permission denied for ticket {}: Ticket is not in active state or not assigned to agent",
                        ticket.getTicketId());
                return new CallPermissionResponse(false, "Ticket is not in active state or not assigned to agent", null,
                        null);
            }

            // Verify participants are related to the ticket
            boolean isCallerValid = ticket.getCustomer().getId().equals(caller.getId())
                    || (ticket.getAssignedAgent() != null && ticket.getAssignedAgent().getId().equals(caller.getId()));

            boolean isReceiverValid = ticket.getCustomer().getId().equals(receiver.getId())
                    || (ticket.getAssignedAgent() != null
                            && ticket.getAssignedAgent().getId().equals(receiver.getId()));

            if (!isCallerValid || !isReceiverValid) {
                logger.warn("Call permission denied for ticket {}: Participants not associated with ticket",
                        ticket.getTicketId());
                return new CallPermissionResponse(false, "Call participants are not associated with this ticket", null,
                        null);
            }

            // Ensure customer and agent are calling each other (not customer-to-customer or
            // agent-to-agent)
            boolean isCustomerToAgent = (caller.getRole() == com.enterprise.voice.model.Role.CUSTOMER
                    && receiver.getRole() == com.enterprise.voice.model.Role.COMPANY_AGENT)
                    || (caller.getRole() == com.enterprise.voice.model.Role.COMPANY_AGENT
                            && receiver.getRole() == com.enterprise.voice.model.Role.CUSTOMER);

            if (!isCustomerToAgent) {
                logger.warn("Call permission denied for ticket {}: Calls only allowed between customer and agent",
                        ticket.getTicketId());
                return new CallPermissionResponse(false, "Calls are only allowed between customer and agent", null,
                        null);
            }

            // Generate session token for WebRTC
            String sessionToken = tokenProvider
                    .generateTokenFromUsername(caller.getUsername() + "_" + System.currentTimeMillis());

            logger.info("Call permission granted for ticket {} between {} and {}",
                    ticket.getTicketId(), caller.getAnonymousId(), receiver.getAnonymousId());
            return new CallPermissionResponse(true, "Call allowed", ticket.getTicketId(), sessionToken);

        } catch (Exception e) {
            logger.error("Error validating call permission: {}", e.getMessage(), e);
            return new CallPermissionResponse(false, "Error validating call permission: " + e.getMessage(), null, null);
        }
    }

    @Transactional
    public CallLog initiateCall(Long ticketId, Long callerId, Long receiverId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User caller = userRepository.findById(callerId)
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        CallLog callLog = new CallLog();
        callLog.setTicket(ticket);
        callLog.setCaller(caller);
        callLog.setReceiver(receiver);
        callLog.setWasSuccessful(false);

        return callLogRepository.save(callLog);
    }

    @Transactional
    public CallLog endCall(Long callLogId, boolean wasSuccessful, String notes) {
        CallLog callLog = callLogRepository.findById(callLogId)
                .orElseThrow(() -> new RuntimeException("Call log not found"));

        callLog.setEndTime(LocalDateTime.now());
        callLog.setWasSuccessful(wasSuccessful);
        callLog.setNotes(notes);
        callLog.calculateDuration();

        return callLogRepository.save(callLog);
    }

    public List<CallLogResponse> getCallLogsByTicket(Long ticketId) {
        List<CallLog> callLogs = callLogRepository.findByTicketIdOrderByStartTimeDesc(ticketId);
        return callLogs.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CallLogResponse> getCallLogsByUser(Long userId) {
        List<CallLog> callLogs = callLogRepository.findByCallerIdOrReceiverId(userId, userId);
        return callLogs.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private CallLogResponse mapToResponse(CallLog callLog) {
        CallLogResponse response = new CallLogResponse();
        response.setId(callLog.getId());
        response.setTicketId(callLog.getTicket().getTicketId());
        response.setCallerAnonymousId(callLog.getCaller().getAnonymousId());
        response.setReceiverAnonymousId(callLog.getReceiver().getAnonymousId());
        response.setStartTime(callLog.getStartTime());
        response.setEndTime(callLog.getEndTime());
        response.setDuration(callLog.getDuration());
        response.setWasSuccessful(callLog.getWasSuccessful());
        return response;
    }
}
