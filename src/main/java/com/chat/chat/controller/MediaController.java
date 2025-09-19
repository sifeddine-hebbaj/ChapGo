package com.chat.chat.controller;

import com.chat.chat.model.Media;
import com.chat.chat.model.User;
import com.chat.chat.repository.MediaRepository;
import com.chat.chat.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.time.LocalDateTime;

@Slf4j
@CrossOrigin(origins = {"*"}, allowedHeaders = "*", exposedHeaders = "Content-Disposition")
@RestController
@RequestMapping("/api/media")
public class MediaController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private final MediaRepository mediaRepository;
    private final UserRepository userRepository;

    @Autowired
    public MediaController(MediaRepository mediaRepository, UserRepository userRepository) {
        this.mediaRepository = mediaRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/test-upload")
    public ResponseEntity<Map<String, Object>> testUpload(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
        try {
            logRequestDetails(request);
            log.info("Test upload received - Filename: {}, Size: {}, ContentType: {}", 
                    file.getOriginalFilename(), file.getSize(), file.getContentType());

            Map<String, Object> response = new HashMap<>();
            response.put("received", true);
            response.put("filename", file.getOriginalFilename());
            response.put("size", file.getSize());
            response.put("contentType", file.getContentType());

            log.info("Test upload successful: {}", response);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Test upload error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to process test upload: " + e.getMessage()));
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request,
            Authentication authentication) {
        try {
            logRequestDetails(request);
            log.info("Upload request received - Filename: {}, Size: {}, Type: {}", 
                    file.getOriginalFilename(), file.getSize(), file.getContentType());

            if (file.isEmpty()) {
                log.warn("Upload failed: File is empty");
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Le fichier est vide"));
            }
            
            // Validate file size (10MB max)
            long maxFileSize = 10 * 1024 * 1024; // 10MB
            if (file.getSize() > maxFileSize) {
                log.warn("Upload failed: File size {} exceeds maximum allowed {}", file.getSize(), maxFileSize);
                return ResponseEntity.badRequest()
                        .body(Map.of(
                            "error", "La taille du fichier dépasse la limite autorisée",
                            "maxSize", maxFileSize
                        ));
            }

            // Déterminer le type de média avec plus de précision
            String contentType = file.getContentType();
            String mediaType = "document";
            if (contentType != null) {
                if (contentType.startsWith("image/")) {
                    mediaType = "image";
                } else if (contentType.startsWith("video/")) {
                    mediaType = "video";
                } else if (contentType.startsWith("audio/")) {
                    mediaType = "audio";
                } else if (contentType.equals("application/pdf")) {
                    mediaType = "pdf";
                } else if (contentType.startsWith("application/") ||
                           contentType.startsWith("text/") ||
                           contentType.equals("application/msword") ||
                           contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
                           contentType.equals("application/vnd.ms-excel") ||
                           contentType.equals("application/vnd.ms-powerpoint") ||
                           contentType.equals("application/vnd.oasis.opendocument.text") ||
                           contentType.equals("application/vnd.oasis.opendocument.spreadsheet") ||
                           contentType.equals("application/vnd.oasis.opendocument.presentation")) {
                    mediaType = "document";
                }
            }

            // Créer le dossier d'upload/type s'il n'existe pas (ex: uploads/audio)
            Path uploadPath = Paths.get(uploadDir, mediaType);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                log.info("[MediaController] Created upload directory: {}", uploadPath);
            }

            // Générer un nom de fichier unique
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";
            String filename = UUID.randomUUID().toString() + extension;

            // Sauvegarder le fichier
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            log.info("[MediaController] File saved: {}", filePath);

            
            // Optionally associate user if authenticated
            User user = null;
            try {
                if (authentication != null && authentication.getName() != null) {
                    String email = authentication.getName();
                    user = userRepository.findByEmail(email).orElse(null);
                }
            } catch (Exception ignored) {}

            // Persist Media entity
            String url = "/api/media/files/" + mediaType + "/" + filename;

            Media media = Media.builder()
                    .originalName(originalFilename)
                    .storedName(filename)
                    .fileType(mediaType)
                    .mimeType(contentType)
                    .size(file.getSize())
                    .url(url)
                    .uploadTime(LocalDateTime.now())
                    .user(user)
                    .build();
            media = mediaRepository.save(media);

            Map<String, Object> response = new HashMap<>();
            response.put("id", media.getId());
            response.put("filename", filename);
            response.put("originalName", originalFilename);
            response.put("url", url);
            response.put("type", mediaType);
            response.put("size", file.getSize());

            log.info("File uploaded and persisted successfully: {}", response);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Upload failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        }
    }

    /**
     * Logs request details for debugging purposes
     */
    private void logRequestDetails(HttpServletRequest request) {
        if (!log.isDebugEnabled()) {
            return;
        }
        
        log.debug("=== Request Details ===");
        log.debug("Method: {} {}", request.getMethod(), request.getRequestURI());
        log.debug("Content-Type: {}", request.getContentType());
        log.debug("Content-Length: {}", request.getHeader(HttpHeaders.CONTENT_LENGTH));
        
        // Log all headers
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            log.debug("Header {}: {}", headerName, request.getHeader(headerName));
        }
        
        // If it's a multipart request, log multipart details
        if (request.getContentType() != null && 
            request.getContentType().startsWith("multipart/")) {
            log.debug("Multipart request detected");
            if (request instanceof MultipartHttpServletRequest) {
                MultipartHttpServletRequest multipartRequest = (MultipartHttpServletRequest) request;
                log.debug("Multipart files: {}", multipartRequest.getFileMap().keySet());
            }
        }
    }

    @GetMapping("/files/{type}/{filename:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String type, @PathVariable String filename) {
        try {
            log.debug("Request to download file: {}", filename);
            
            // Security check to prevent directory traversal
            if (filename.contains("..")) {
                log.warn("Invalid file path requested: {}", filename);
                return ResponseEntity.badRequest().build();
            }
            
            Path filePath = Paths.get(uploadDir).resolve(type).resolve(filename).normalize();
            
            // Additional security check
            if (!filePath.startsWith(Paths.get(uploadDir).resolve(type).normalize())) {
                log.warn("Directory traversal attempt detected: {}", filename);
                return ResponseEntity.badRequest().build();
            }

            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                log.warn("File not found or not readable: {}", filename);
                return ResponseEntity.notFound().build();
            }
            
            // Determine content type
            String contentType;
            try {
                contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    if (filename.endsWith(".pdf")) {
                        contentType = "application/pdf";
                    } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg") || filename.endsWith(".png")) {
                        contentType = "image/jpeg";
                    } else {
                        contentType = "application/octet-stream";
                    }
                }
            } catch (IOException ex) {
                contentType = "application/octet-stream";
            }

            log.debug("Serving file: {} (type: {})", filename, contentType);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                            "inline; filename=\"" + resource.getFilename() + "\"")
                    .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, "Content-Disposition")
                    .body(resource);
                    
        } catch (MalformedURLException e) {
            log.error("Malformed URL for file: {}", filename, e);
            return ResponseEntity.notFound().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
