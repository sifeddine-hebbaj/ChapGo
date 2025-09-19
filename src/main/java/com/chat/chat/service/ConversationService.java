package com.chat.chat.service;

import com.chat.chat.model.Conversation;
import com.chat.chat.model.User;
import com.chat.chat.repository.ConversationRepository;
import com.chat.chat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;

    public Conversation get(Long id) {
        return conversationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
    }

    public List<Conversation> all() {
        return conversationRepository.findAll();
    }

    public Conversation create(String name, List<Long> participantIds) {
        Conversation c = Conversation.builder().name(name).build();
        if (participantIds != null) {
            c.setParticipants(new java.util.HashSet<>(userRepository.findAllById(participantIds)));
        }
        return conversationRepository.save(c);
    }

    public Conversation findOrCreateDirect(Long userAId, Long userBId) {
        // Try both orders
        return conversationRepository.findDirectBetween(userAId, userBId)
                .or(() -> conversationRepository.findDirectBetween(userBId, userAId))
                .orElseGet(() -> {
                    User a = userRepository.findById(userAId)
                            .orElseThrow(() -> new IllegalArgumentException("User A not found"));
                    User b = userRepository.findById(userBId)
                            .orElseThrow(() -> new IllegalArgumentException("User B not found"));
                    Conversation conv = Conversation.builder()
                            .name(a.getName() + " & " + b.getName())
                            .groupChat(false)
                            .participants(Set.copyOf(List.of(a, b)))
                            .build();
                    return conversationRepository.save(conv);
                });
    }
}
