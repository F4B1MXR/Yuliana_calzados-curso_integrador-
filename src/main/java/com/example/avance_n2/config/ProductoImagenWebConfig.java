package com.example.avance_n2.config;

import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class ProductoImagenWebConfig implements WebMvcConfigurer {

    private final String uploadDirectory;

    public ProductoImagenWebConfig(
            @Value("${app.uploads.productos-dir:uploads/productos}")
            String uploadDirectory) {
        String location = Path.of(uploadDirectory)
            .toAbsolutePath()
            .normalize()
            .toUri()
            .toString();
        this.uploadDirectory = location.endsWith("/")
            ? location
            : location + "/";
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/productos/**")
            .addResourceLocations(uploadDirectory);
    }
}
