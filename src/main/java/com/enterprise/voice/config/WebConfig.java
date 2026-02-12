package com.enterprise.voice.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web configuration for CORS and other web-related settings
 * Note: CORS is now configured centrally in SecurityConfig to avoid conflicts
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
        // CORS configuration has been moved to SecurityConfig.corsConfigurationSource()
        // to ensure a single consistent CORS policy across the application
}
