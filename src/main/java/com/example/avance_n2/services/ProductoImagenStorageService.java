package com.example.avance_n2.services;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ProductoImagenStorageService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    private static final String PUBLIC_PATH = "/uploads/productos/";

    private final Path uploadDirectory;

    public ProductoImagenStorageService(
            @Value("${app.uploads.productos-dir:uploads/productos}")
            String uploadDirectory) {
        this.uploadDirectory = Path.of(uploadDirectory)
            .toAbsolutePath()
            .normalize();
    }

    public String guardar(MultipartFile imagen) throws IOException {
        if (imagen == null || imagen.isEmpty()) {
            return null;
        }

        if (imagen.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                "La imagen no puede superar los 5 MB"
            );
        }

        byte[] contenido = imagen.getBytes();
        String extension = detectarExtension(contenido);
        String nombreArchivo = UUID.randomUUID() + extension;

        Files.createDirectories(uploadDirectory);
        Files.write(
            uploadDirectory.resolve(nombreArchivo),
            contenido,
            StandardOpenOption.CREATE_NEW
        );

        return PUBLIC_PATH + nombreArchivo;
    }

    private String detectarExtension(byte[] contenido) {
        if (esPng(contenido)) {
            return ".png";
        }
        if (esJpeg(contenido)) {
            return ".jpg";
        }
        if (esWebp(contenido)) {
            return ".webp";
        }

        throw new IllegalArgumentException(
            "El archivo debe ser una imagen PNG, JPG o WEBP válida"
        );
    }

    private boolean esPng(byte[] contenido) {
        byte[] firma = {
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
        };
        if (contenido.length < firma.length) {
            return false;
        }
        for (int i = 0; i < firma.length; i++) {
            if (contenido[i] != firma[i]) {
                return false;
            }
        }
        return true;
    }

    private boolean esJpeg(byte[] contenido) {
        return contenido.length >= 3
            && (contenido[0] & 0xFF) == 0xFF
            && (contenido[1] & 0xFF) == 0xD8
            && (contenido[2] & 0xFF) == 0xFF;
    }

    private boolean esWebp(byte[] contenido) {
        return contenido.length >= 12
            && contenido[0] == 'R'
            && contenido[1] == 'I'
            && contenido[2] == 'F'
            && contenido[3] == 'F'
            && contenido[8] == 'W'
            && contenido[9] == 'E'
            && contenido[10] == 'B'
            && contenido[11] == 'P';
    }
}
