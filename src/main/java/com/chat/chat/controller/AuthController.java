package com.chat.chat.controller;

import com.chat.chat.dto.AuthResponse;
import com.chat.chat.dto.LoginRequest;
import com.chat.chat.dto.SignupRequest;
import com.chat.chat.dto.GoogleAuthRequest;
import com.chat.chat.model.User;
import com.chat.chat.repository.UserRepository;
import com.chat.chat.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (Exception e) {
            throw new BadCredentialsException("Invalid credentials");
        }
        User u = userRepository.findByEmail(request.getEmail()).orElseThrow();
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", u.getRoles());
        String token = jwtUtil.generateToken(u.getEmail(), claims);
        return ResponseEntity.ok(new AuthResponse(token, u.getId(), u.getName(), u.getEmail(), u.getAvatar()));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already in use"));
        }
        User u = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles("USER")
                .avatar(request.getAvatar())
                .online(true)
                .statusMessage("Disponible pour discuter 💬")
                .build();
        u = userRepository.save(u);

        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", u.getRoles());
        String token = jwtUtil.generateToken(u.getEmail(), claims);
        return ResponseEntity.ok(new AuthResponse(token, u.getId(), u.getName(), u.getEmail(), u.getAvatar()));
    }

    @PostMapping("/google")
    public Mono<ResponseEntity<?>> google(@RequestBody GoogleAuthRequest request) {
        // Vérifier l'id_token côté Google
        WebClient client = WebClient.create("https://oauth2.googleapis.com");
        return client.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/tokeninfo")
                        .queryParam("id_token", request.getIdToken())
                        .build())
                .retrieve()
                .bodyToMono(Map.class)
                .map(body -> {
                    String email = (String) body.get("email");
                    String name = (String) body.getOrDefault("name", "Google User");
                    String picture = (String) body.get("picture");
                    if (email == null) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Invalid Google token"));
                    }
                    User u = userRepository.findByEmail(email).orElseGet(() -> {
                        User nu = User.builder()
                                .name(name)
                                .email(email)
                                .password(passwordEncoder.encode("google-login"))
                                .roles("USER")
                                .avatar(picture)
                                .online(true)
                                .statusMessage("Disponible pour discuter 💬")
                                .build();
                        return userRepository.save(nu);
                    });
                    Map<String, Object> claims = new HashMap<>();
                    claims.put("roles", u.getRoles());
                    String token = jwtUtil.generateToken(u.getEmail(), claims);
                    return ResponseEntity.ok(new AuthResponse(token, u.getId(), u.getName(), u.getEmail(), u.getAvatar()));
                });
    }
}
