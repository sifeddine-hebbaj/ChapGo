package com.chat.chat.controller;

import com.chat.chat.dto.ConversationSummaryDto;
import com.chat.chat.model.User;
import com.chat.chat.repository.UserRepository;
import com.chat.chat.service.ConversationSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = {"*"})
@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationSummaryService conversationSummaryService;
    private final UserRepository userRepository;

    @GetMapping("/summary")
    public ResponseEntity<List<ConversationSummaryDto>> getConversationSummaries() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Long currentUserId = 1L; // Utilisateur par défaut pour les tests
            
            System.out.println("[ConversationController] Auth: " + (auth != null ? auth.getName() : "null"));
            
            // Si authentifié, utiliser le vrai utilisateur
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
                String email = auth.getName();
                Optional<User> userOpt = userRepository.findByEmail(email);
                
                if (userOpt.isPresent()) {
                    currentUserId = userOpt.get().getId();
                    System.out.println("[ConversationController] Using authenticated user ID: " + currentUserId);
                } else {
                    System.out.println("[ConversationController] User not found for email: " + email);
                }
            } else {
                System.out.println("[ConversationController] Using default user ID: " + currentUserId);
            }

            List<ConversationSummaryDto> summaries = conversationSummaryService.getConversationSummariesForUser(currentUserId);
            System.out.println("[ConversationController] Found " + summaries.size() + " conversations");
            
            return ResponseEntity.ok(summaries);
        } catch (Exception e) {
            System.err.println("[ConversationController] Error: " + e.getMessage());
            e.printStackTrace();
            
            // Retourner une liste vide en cas d'erreur pour éviter le crash
            return ResponseEntity.ok(List.of());
        }
    }
}
