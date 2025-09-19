package com.chat.chat.service;

import com.chat.chat.model.Conversation;
import com.chat.chat.model.Media;
import com.chat.chat.model.Message;
import com.chat.chat.model.User;
import com.chat.chat.repository.ConversationRepository;
import com.chat.chat.repository.MessageRepository;
import com.chat.chat.repository.MediaRepository;
import com.chat.chat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final MediaRepository mediaRepository;

    @Autowired
    public MessageService(MessageRepository messageRepository, ConversationRepository conversationRepository, UserRepository userRepository, MediaRepository mediaRepository) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.userRepository = userRepository;
        this.mediaRepository = mediaRepository;
    }

    public Message saveMessage(Message message) {
        return messageRepository.save(message);
    }

    @Transactional
    public Message sendMessage(Long conversationId, Long senderId, String text, Message.Type type, String mediaUrl) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Media media = null;
        if (mediaUrl != null) {
            media = mediaRepository.findByUrl(mediaUrl).orElse(null);
            if (media == null) {
                String fileType = type == null ? "document" : switch (type) {
                    case IMAGE -> "image";
                    case VIDEO -> "video";
                    case AUDIO -> "audio";
                    case PDF -> "pdf";
                    default -> "document";
                };

                // Try to extract storedName from the URL path
                String storedName = null;
                int lastSlash = mediaUrl.lastIndexOf('/');
                if (lastSlash >= 0 && lastSlash < mediaUrl.length() - 1) {
                    storedName = mediaUrl.substring(lastSlash + 1);
                }

                media = Media.builder()
                        .url(mediaUrl)
                        .fileType(fileType)
                        .storedName(storedName)
                        .uploadTime(LocalDateTime.now())
                        .user(sender)
                        .build();
                media = mediaRepository.save(media);
            }
        }

        Message message = Message.builder()
                .text(text)
                .sender(sender)
                .conversation(conv)
                .timestamp(Instant.now())
                .status(Message.Status.SENT)
                .type(type == null ? Message.Type.TEXT : type)
                .media(media)
                .build();
        message = saveMessage(message);

        conv.setLastMessageTime(message.getTimestamp());
        conversationRepository.save(conv);

        return message;
    }

    public List<Message> getMessages(Long conversationId) {
        return messageRepository.findByConversationIdOrderByTimestampAsc(conversationId);
    }

    @Transactional
    public void markRead(Long messageId) {
        Message m = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        m.setStatus(Message.Status.READ);
        messageRepository.save(m);
    }
}
