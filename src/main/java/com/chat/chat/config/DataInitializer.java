package com.chat.chat.config;

import com.chat.chat.model.Conversation;
import com.chat.chat.model.Message;
import com.chat.chat.model.User;
import com.chat.chat.repository.ConversationRepository;
import com.chat.chat.repository.MessageRepository;
import com.chat.chat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    @Bean
    CommandLineRunner init(UserRepository users, ConversationRepository conversations, MessageRepository messages, PasswordEncoder passwordEncoder) {
        return args -> {
            if (users.count() > 0) return;

            String pwd = passwordEncoder.encode("password123");
            User u1 = users.save(User.builder().name("John Doe").email("john@example.com").password(pwd).roles("USER").avatar("https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg").online(true).statusMessage("Disponible pour discuter 💬").build());
            User u2 = users.save(User.builder().name("Marie Dupont").email("marie@example.com").password(pwd).roles("USER").avatar("https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg").online(true).build());
            User u3 = users.save(User.builder().name("Paul Martin").email("paul@example.com").password(pwd).roles("USER").avatar("https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg").online(false).build());

            Conversation c1 = Conversation.builder()
                    .name("John & Marie")
                    .avatar(u2.getAvatar())
                    .participants(Set.copyOf(List.of(u1, u2)))
                    .groupChat(false)
                    .lastMessageTime(Instant.now())
                    .build();
            c1 = conversations.save(c1);

            Message m1 = messages.save(Message.builder().conversation(c1).sender(u2).text("Salut ! Comment ça va ?").timestamp(Instant.now().minusSeconds(3600)).status(Message.Status.READ).type(Message.Type.TEXT).build());
            Message m2 = messages.save(Message.builder().conversation(c1).sender(u1).text("Ça va super bien ! Et toi ?").timestamp(Instant.now().minusSeconds(3000)).status(Message.Status.READ).type(Message.Type.TEXT).build());
            Message m3 = messages.save(Message.builder().conversation(c1).sender(u2).text("Très bien aussi ! Tu es libre pour déjeuner demain ?").timestamp(Instant.now().minusSeconds(1800)).status(Message.Status.READ).type(Message.Type.TEXT).build());
            Message m4 = messages.save(Message.builder().conversation(c1).sender(u1).text("Oui parfait ! Où veux-tu qu'on se retrouve ?").timestamp(Instant.now().minusSeconds(900)).status(Message.Status.DELIVERED).type(Message.Type.TEXT).build());

            c1.setLastMessageTime(m4.getTimestamp());
            conversations.save(c1);
        };
    }
}
