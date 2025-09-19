package com.chat.chat.controller;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.util.StringUtils;

/**
 * SignalingController
 *
 * Rôle: relayer les messages de signalisation WebRTC entre pairs via STOMP.
 * - Les clients envoient leurs messages sur la destination \"/app/signal\".
 * - Le serveur les diffuse aux abonnés de la salle spécifique sur \"/topic/signals/{roomId}\".
 *
 * Types de messages attendus (JSON):
 *   {
 *     "type": "offer" | "answer" | "candidate" | "leave",
 *     "sdp": string?,
 *     "candidate": any?,
 *     "roomId": string,
 *     "senderId": string,
 *     "mode": "audio" | "video"?
 *   }
 */
@Slf4j
@Controller
@CrossOrigin(origins = "*")
public class SignalingController {

    private final SimpMessagingTemplate messagingTemplate;

    public SignalingController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Reçoit les messages envoyés par les clients sur /app/signal
     * et les publie sur /topic/signals/{roomId} pour les autres clients de la salle.
     */
    @MessageMapping("/signal")
    public void onSignal(@Payload SignalMessage msg, SimpMessageHeaderAccessor headers) {
        try {
            // Validation des champs obligatoires
            if (!isValidMessage(msg)) {
                log.warn("[Signaling] Invalid message received: {}", msg);
                return;
            }

            // Ajoute des logs utiles au debug côté serveur
            log.info("[Signaling] type={}, roomId={}, senderId={}, mode={}",
                    msg.getType(), msg.getRoomId(), msg.getSenderId(), msg.getMode());

            // Diffusion aux abonnés de la salle spécifique uniquement
            messagingTemplate.convertAndSend("/topic/signals/" + msg.getRoomId(), msg);
        } catch (Exception e) {
            log.error("[Signaling] Failed to relay message: {}", e.getMessage(), e);
        }
    }

    /**
     * Valide les champs obligatoires du message de signalisation
     */
    private boolean isValidMessage(SignalMessage msg) {
        if (msg == null) return false;
        if (!StringUtils.hasText(msg.getType())) return false;
        if (!StringUtils.hasText(msg.getRoomId())) return false;
        if (!StringUtils.hasText(msg.getSenderId())) return false;

        // Types valides
        String[] validTypes = {"offer", "answer", "candidate", "leave", "decline", "cancel", "hangup"};
        if (!java.util.Arrays.asList(validTypes).contains(msg.getType())) return false;

        // Mode valide si présent
        if (msg.getMode() != null && !msg.getMode().equals("audio") && !msg.getMode().equals("video")) {
            return false;
        }

        return true;
    }

    // DTO simple pour transporter les messages de signalisation
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SignalMessage {
        private String type;      // offer, answer, candidate, leave
        private String sdp;       // description SDP si présent
        private Object candidate; // ICE candidate (objet JSON)
        private String roomId;    // identifiant de la salle/appel
        private String senderId;  // identifiant de l'expéditeur
        private String mode;      // audio ou video
    }
}
