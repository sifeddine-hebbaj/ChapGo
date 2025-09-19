package com.chat.chat.repository;

import com.chat.chat.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query("select c from Conversation c join c.participants p1 join c.participants p2 " +
            "where c.groupChat = false and p1.id = :u1 and p2.id = :u2")
    Optional<Conversation> findDirectBetween(@Param("u1") Long user1Id, @Param("u2") Long user2Id);
}
