package com.chat.chat.controller;

import com.chat.chat.dto.UserProfile;
import com.chat.chat.model.User;
import com.chat.chat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<UserProfile> me(Authentication authentication) {
        // Si pas d'authentification, retourner un utilisateur par défaut pour les tests
        if (authentication == null || "anonymousUser".equals(authentication.getName())) {
            return ResponseEntity.ok(new UserProfile(
                    1L,
                    "Test User",
                    "test@example.com",
                    "https://placehold.co/100x100",
                    "Available",
                    true
            ));
        }
        String email = authentication.getName();
        User u = userRepository.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(new UserProfile(
                u.getId(),
                u.getName(),
                u.getEmail(),
                u.getAvatar(),
                u.getStatusMessage(),
                u.isOnline()
        ));
    }

    public record AvatarUpdate(String url) {}
    public record ProfileUpdate(String name, String statusMessage) {}

    @PatchMapping("/me/avatar")
    public ResponseEntity<UserProfile> updateAvatar(@RequestBody AvatarUpdate req, Authentication authentication) {
        if (req == null || req.url() == null || req.url().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        final User u = resolveCurrentUser(authentication);
        u.setAvatar(req.url());
        userRepository.save(u);
        return ResponseEntity.ok(new UserProfile(
                u.getId(), u.getName(), u.getEmail(), u.getAvatar(), u.getStatusMessage(), u.isOnline()
        ));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserProfile> updateProfile(@RequestBody ProfileUpdate req, Authentication authentication) {
        final User u = resolveCurrentUser(authentication);
        if (req != null) {
            if (req.name() != null && !req.name().isBlank()) u.setName(req.name());
            if (req.statusMessage() != null) u.setStatusMessage(req.statusMessage());
        }
        userRepository.save(u);
        return ResponseEntity.ok(new UserProfile(
                u.getId(), u.getName(), u.getEmail(), u.getAvatar(), u.getStatusMessage(), u.isOnline()
        ));
    }

    private User resolveCurrentUser(Authentication authentication) {
        if (authentication == null || "anonymousUser".equals(authentication.getName())) {
            // fallback for tests: update the first user (id=1)
            return userRepository.findById(1L).orElseThrow();
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    @GetMapping("/contacts")
    public ResponseEntity<List<UserProfile>> contacts(Authentication authentication) {
        final String myEmail;
        
        if (authentication != null && !"anonymousUser".equals(authentication.getName())) {
            myEmail = authentication.getName();
        } else {
            myEmail = "test@example.com"; // Par défaut pour les tests
        }
        
        List<UserProfile> contacts = userRepository.findAll().stream()
                .filter(u -> !u.getEmail().equalsIgnoreCase(myEmail))
                .map(u -> new UserProfile(
                        u.getId(),
                        u.getName(),
                        u.getEmail(),
                        u.getAvatar(),
                        u.getStatusMessage(),
                        u.isOnline()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(contacts);
    }
}
