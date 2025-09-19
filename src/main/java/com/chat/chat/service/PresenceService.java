package com.chat.chat.service;

import com.chat.chat.dto.PresenceEvent;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceService {

    private final Map<Long, PresenceEvent> presence = new ConcurrentHashMap<>();
    private final Map<Long, Set<Long>> typingByConversation = new ConcurrentHashMap<>();

    public PresenceEvent setOnline(Long userId, boolean online, String statusMessage) {
        PresenceEvent event = PresenceEvent.builder()
                .userId(String.valueOf(userId))
                .online(online)
                .statusMessage(statusMessage)
                .build();
        presence.put(userId, event);
        return event;
    }

    public PresenceEvent getPresence(Long userId) {
        return presence.get(userId);
    }

    public Set<Long> setTyping(Long conversationId, Long userId, boolean typing) {
        typingByConversation.computeIfAbsent(conversationId, k -> ConcurrentHashMap.newKeySet());
        Set<Long> set = typingByConversation.get(conversationId);
        if (typing) set.add(userId); else set.remove(userId);
        return set;
    }
}
