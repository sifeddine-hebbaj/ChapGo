package com.chat.chat.repository;

import com.chat.chat.model.Conversation;
import com.chat.chat.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByConversationIdOrderByTimestampAsc(Long conversationId);
    Optional<Message> findTopByConversationOrderByTimestampDesc(Conversation conversation);
}
