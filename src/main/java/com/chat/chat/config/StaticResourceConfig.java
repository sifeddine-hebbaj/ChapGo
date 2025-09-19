package com.chat.chat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    // Absolute Windows path to the uploads directory. You can override this via application.properties
    @Value("${app.upload.dir:c:/Users/sifeddine/Desktop/chat/uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Normalize to ensure it ends with a trailing slash and has the file URI prefix
        String location = uploadDir;
        if (!location.endsWith("/")) {
            location = location + "/";
        }
        // Spring requires the "file:/" (or "file:///" on Windows) prefix
        // Use three slashes for absolute Windows paths
        String fileLocation = location.replace("\\", "/");
        if (!fileLocation.startsWith("file:")) {
            if (!fileLocation.startsWith("/")) {
                // Best effort; ensure absolute-like path
                fileLocation = "/" + fileLocation;
            }
            fileLocation = "file:///" + fileLocation;
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(fileLocation);
    }
}
