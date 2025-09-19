package com.chat.chat.controller;

import com.chat.chat.model.User;
import com.chat.chat.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    private final UserRepository userRepository;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    public UserProfileController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping(value = "/{userId}/profile/qr", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getUserProfileQrCode(@PathVariable Long userId) {
        try {
            Optional<User> userOptional = userRepository.findById(userId);
            if (userOptional.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            User user = userOptional.get();
            
            // Création d'un contenu structuré pour le QR code
            String qrContent = String.format(
                "BEGIN:VCARD\n" +
                "VERSION:3.0\n" +
                "FN:%s\n" +
                "%s" +  // Numéro de téléphone conditionnel
                "EMAIL;TYPE=work:%s\n" +
                "URL:%s/api/users/%d/profile\n" +
                "END:VCARD",
                user.getName(),
                user.getPhoneNumber() != null && !user.getPhoneNumber().isEmpty() ? 
                    "TEL;TYPE=cell:" + user.getPhoneNumber() + "\n" : "",
                user.getEmail(),
                baseUrl,
                userId
            );

            
            // Configuration des en-têtes pour le cache et le téléchargement
            HttpHeaders headers = new HttpHeaders();
            headers.setCacheControl(CacheControl.noCache().getHeaderValue());
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setContentDisposition(
                ContentDisposition.builder("attachment")
                    .filename(String.format("profile_qr_%s.png", user.getName().replaceAll("\\s+", "_")))
                    .build()
            );
            
            return new ResponseEntity<>(headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{userId}/profile")
    public ResponseEntity<Map<String, Object>> getUserProfile(@PathVariable Long userId) {
        return userRepository.findById(userId)
            .map(user -> {
                Map<String, Object> response = new HashMap<>();
                response.put("id", user.getId());
                response.put("name", user.getName());
                response.put("email", user.getEmail());
                response.put("phoneNumber", user.getPhoneNumber() != null ? user.getPhoneNumber() : "");
                response.put("profileUrl", String.format("%s/api/users/%d/profile", baseUrl, user.getId()));
                response.put("qrCodeUrl", String.format("%s/api/users/%d/profile/qr", baseUrl, user.getId()));
                return ResponseEntity.ok(response);
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
