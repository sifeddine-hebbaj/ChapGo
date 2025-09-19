package com.chat.chat.service;

import com.chat.chat.dto.ConversationSummaryDto;
import com.chat.chat.dto.MessageSummaryDto;
import com.chat.chat.dto.UserSummaryDto;
import com.chat.chat.model.Conversation;
import com.chat.chat.model.Message;
import com.chat.chat.model.User;
import com.chat.chat.repository.ConversationRepository;
import com.chat.chat.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationSummaryService {
    
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    public List<ConversationSummaryDto> getConversationSummariesForUser(Long currentUserId) {
        try {
            System.out.println("[ConversationSummaryService] Getting conversations for user ID: " + currentUserId);
            
            // Récupérer toutes les conversations où l'utilisateur participe
            List<Conversation> allConversations = conversationRepository.findAll();
            System.out.println("[ConversationSummaryService] Total conversations in DB: " + allConversations.size());
            
            List<Conversation> userConversations = allConversations.stream()
                    .filter(conv -> {
                        boolean hasUser = conv.getParticipants().stream()
                                .anyMatch(user -> user.getId().equals(currentUserId));
                        if (hasUser) {
                            System.out.println("[ConversationSummaryService] Found conversation ID: " + conv.getId());
                        }
                        return hasUser;
                    })
                    .collect(Collectors.toList());
            
            System.out.println("[ConversationSummaryService] User conversations: " + userConversations.size());

            return userConversations.stream()
                    .map(conv -> buildConversationSummary(conv, currentUserId))
                    .filter(summary -> summary != null) // Filtrer les conversations sans contrepartie
                    .sorted((a, b) -> {
                        String aTime = a.getLastActivityAt();
                        String bTime = b.getLastActivityAt();
                        if (aTime == null && bTime == null) return 0;
                        if (aTime == null) return 1;
                        if (bTime == null) return -1;
                        return bTime.compareTo(aTime);
                    }) // Plus récent en premier
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("[ConversationSummaryService] Error: " + e.getMessage());
            e.printStackTrace();
            return List.of(); // Retourner une liste vide en cas d'erreur
        }
    }

    private ConversationSummaryDto buildConversationSummary(Conversation conversation, Long currentUserId) {
        try {
            System.out.println("[ConversationSummaryService] Building summary for conversation ID: " + conversation.getId());
            
            // Trouver la contrepartie (l'autre utilisateur)
            Optional<User> counterpartOpt = conversation.getParticipants().stream()
                    .filter(user -> !user.getId().equals(currentUserId))
                    .findFirst();

            if (counterpartOpt.isEmpty()) {
                System.out.println("[ConversationSummaryService] No counterpart found for conversation ID: " + conversation.getId());
                return null; // Pas de contrepartie trouvée
            }

            User counterpart = counterpartOpt.get();
            UserSummaryDto counterpartDto = new UserSummaryDto(
                    counterpart.getId(),
                    counterpart.getName(),
                    counterpart.getAvatar(),
                    counterpart.isOnline()
            );

            // Récupérer le dernier message
            Optional<Message> lastMessageOpt = messageRepository
                    .findTopByConversationOrderByTimestampDesc(conversation);

            MessageSummaryDto lastMessageDto = null;
            String lastActivityAt = conversation.getLastMessageTime() != null 
                    ? conversation.getLastMessageTime().toString() 
                    : null;

            if (lastMessageOpt.isPresent()) {
                Message lastMessage = lastMessageOpt.get();
                lastMessageDto = new MessageSummaryDto(
                        lastMessage.getId(),
                        lastMessage.getText(),
                        lastMessage.getSender().getId(),
                        lastMessage.getTimestamp().toString()
                );
                lastActivityAt = lastMessage.getTimestamp().toString();
                System.out.println("[ConversationSummaryService] Found last message: " + lastMessage.getText());
            } else {
                System.out.println("[ConversationSummaryService] No messages found for conversation ID: " + conversation.getId());
            }

            // TODO: Calculer le nombre de messages non lus
            Integer unreadCount = 0;

            ConversationSummaryDto summary = new ConversationSummaryDto(
                    conversation.getId(),
                    counterpartDto,
                    lastMessageDto,
                    lastActivityAt,
                    unreadCount
            );
            
            System.out.println("[ConversationSummaryService] Built summary for conversation with " + counterpart.getName());
            return summary;
        } catch (Exception e) {
            System.err.println("[ConversationSummaryService] Error building summary for conversation ID: " + conversation.getId() + " - " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
}
