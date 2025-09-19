package com.chat.chat.config;

import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;

import jakarta.servlet.MultipartConfigElement;

@Configuration
public class MultipartConfig {
    
    @Bean
    public MultipartConfigElement multipartConfigElement() {
        MultipartConfigFactory factory = new MultipartConfigFactory();
        
        // Set maximum file size (10MB)
        factory.setMaxFileSize(DataSize.ofMegabytes(10));
        
        // Set maximum request size (20MB)
        factory.setMaxRequestSize(DataSize.ofMegabytes(20));
        
        // Set the location where files will be stored temporarily
        factory.setLocation(System.getProperty("java.io.tmpdir"));
        
        return factory.createMultipartConfig();
    }
}
