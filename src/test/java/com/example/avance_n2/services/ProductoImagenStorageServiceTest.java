package com.example.avance_n2.services;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

class ProductoImagenStorageServiceTest {

    @TempDir
    Path tempDirectory;

    @Test
    void storesValidJpegWithGeneratedName() throws Exception {
        ProductoImagenStorageService service =
            new ProductoImagenStorageService(tempDirectory.toString());
        MockMultipartFile image = new MockMultipartFile(
            "imagen",
            "producto.jpg",
            "image/jpeg",
            new byte[] {
                (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00
            }
        );

        String publicPath = service.guardar(image);
        Path storedFile = tempDirectory.resolve(
            publicPath.substring("/uploads/productos/".length())
        );

        assertTrue(publicPath.startsWith("/uploads/productos/"));
        assertTrue(publicPath.endsWith(".jpg"));
        assertTrue(Files.exists(storedFile));
    }

    @Test
    void rejectsFilesThatAreNotSupportedImages() {
        ProductoImagenStorageService service =
            new ProductoImagenStorageService(tempDirectory.toString());
        MockMultipartFile image = new MockMultipartFile(
            "imagen",
            "producto.jpg",
            "image/jpeg",
            "not an image".getBytes()
        );

        assertThrows(IllegalArgumentException.class, () -> service.guardar(image));
    }
}
