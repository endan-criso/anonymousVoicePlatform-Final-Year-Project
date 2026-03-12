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

    @Autowired private CallLogRepository callLogRepository;
    @Autowired private TicketRepository  ticketRepository;
    @Autowired private UserRepository    userRepository;
    @Autowired private JwtTokenProvider  tokenProvider;

    // ── Validate ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CallPermissionResponse validateCallPermission(
            String ticketId, Long callerId, Long receiverId) {

        logger.debug("Validating call permission for ticket: {}", ticketId);
        try {
            Ticket ticket = ticketRepository.findByTicketId(ticketId)
                    .orElseThrow(() -> new RuntimeException("Ticket not found"));

            User caller   = userRepository.findById(callerId)
                    .orElseThrow(() -> new RuntimeException("Caller not found"));

            User receiver = ticket.getAssignedAgent();

            if (receiver == null)
                return new CallPermissionResponse(false, "No agent assigned to this ticket", null, null);

            if (!ticket.isCallAllowed())
                return new CallPermissionResponse(false, "Calls are not allowed for this ticket", null, null);

            if (!ticket.getCustomer().getId().equals(callerId))
                return new CallPermissionResponse(false, "Only the ticket customer can initiate the call", null, null);

            if (!receiver.getId().equals(receiverId))
                return new CallPermissionResponse(false, "You can only call the assigned agent", null, null);

            if (caller.getRole()  != com.enterprise.voice.model.Role.CUSTOMER ||
                    receiver.getRole() != com.enterprise.voice.model.Role.COMPANY_AGENT)
                return new CallPermissionResponse(false, "Calls only allowed between customer and agent", null, null);

            String sessionToken = tokenProvider.generateTokenFromUsername(
                    caller.getUsername() + "_" + System.currentTimeMillis());

            return new CallPermissionResponse(true, "Call allowed", ticketId, sessionToken);

        } catch (Exception e) {
            logger.error("Error validating call permission", e);
            return new CallPermissionResponse(false, "Error: " + e.getMessage(), null, null);
        }
    }

    // ── Initiate ──────────────────────────────────────────────────────────────

    @Transactional
    public CallLog initiateCall(String ticketId, Long callerId, Long receiverId) {
        Ticket ticket   = ticketRepository.findByTicketId(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        User   caller   = userRepository.findById(callerId)
                .orElseThrow(() -> new RuntimeException("Caller not found"));
        User   receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        CallLog callLog = new CallLog();
        callLog.setTicket(ticket);
        callLog.setCaller(caller);
        callLog.setReceiver(receiver);
        callLog.setCallStatus(CallStatus.RINGING);
        callLog.setWasSuccessful(false);
        return callLogRepository.save(callLog);
    }

    // ── Accept ────────────────────────────────────────────────────────────────

    @Transactional
    public CallLog acceptCall(Long callLogId) {
        CallLog callLog = callLogRepository.findById(callLogId)
                .orElseThrow(() -> new RuntimeException("Call not found"));
        if (callLog.getCallStatus() != CallStatus.RINGING)
            throw new RuntimeException("Call is not RINGING (current: " + callLog.getCallStatus() + ")");
        callLog.setCallStatus(CallStatus.ACTIVE);
        return callLogRepository.save(callLog);
    }

    // ── Reject ────────────────────────────────────────────────────────────────

    @Transactional
    public CallLog rejectCall(Long callLogId) {
        CallLog callLog = callLogRepository.findById(callLogId)
                .orElseThrow(() -> new RuntimeException("Call not found"));
        if (callLog.getCallStatus() != CallStatus.RINGING)
            throw new RuntimeException("Call is not RINGING (current: " + callLog.getCallStatus() + ")");
        callLog.setCallStatus(CallStatus.REJECTED);
        callLog.setEndTime(LocalDateTime.now());
        callLog.setWasSuccessful(false);
        return callLogRepository.save(callLog);
    }

    // ── End ───────────────────────────────────────────────────────────────────

    @Transactional
    public CallLog endCall(Long callLogId, boolean wasSuccessful, String notes) {
        CallLog callLog = callLogRepository.findById(callLogId)
                .orElseThrow(() -> new RuntimeException("Call not found"));
        callLog.setEndTime(LocalDateTime.now());
        callLog.setWasSuccessful(wasSuccessful);
        callLog.setNotes(notes);
        callLog.setCallStatus(CallStatus.ENDED);
        callLog.calculateDuration();
        return callLogRepository.save(callLog);
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CallLogResponse> getCallLogsByTicket(Long ticketDbId) {
        return callLogRepository.findByTicketIdOrderByStartTimeDesc(ticketDbId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CallLogResponse> getCallLogsByUser(Long userId) {
        return callLogRepository.findByCallerIdOrReceiverId(userId, userId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CallLog getCallById(Long callLogId) {
        return callLogRepository.findById(callLogId)
                .orElseThrow(() -> new RuntimeException("Call not found"));
    }

    private CallLogResponse mapToResponse(CallLog callLog) {
        CallLogResponse r = new CallLogResponse();

        r.setId(callLog.getId());
        r.setCallLogId(callLog.getId());   // ← JS reads c.callLogId

        if (callLog.getTicket() != null)
            r.setTicketId(callLog.getTicket().getTicketId());

        if (callLog.getCaller() != null) {
            r.setCallerId(callLog.getCaller().getId());
            r.setCallerAnonymousId(callLog.getCaller().getAnonymousId());
        }

        if (callLog.getReceiver() != null) {
            r.setReceiverId(callLog.getReceiver().getId());                   // ← JS reads c.receiverId
            r.setReceiverAnonymousId(callLog.getReceiver().getAnonymousId());
        }

        r.setStartTime(callLog.getStartTime());
        r.setEndTime(callLog.getEndTime());
        r.setDuration(callLog.getDuration());
        r.setWasSuccessful(callLog.getWasSuccessful());

        if (callLog.getCallStatus() != null)
            r.setCallStatus(callLog.getCallStatus().name());  // ← JS reads c.callStatus

        return r;
    }
}