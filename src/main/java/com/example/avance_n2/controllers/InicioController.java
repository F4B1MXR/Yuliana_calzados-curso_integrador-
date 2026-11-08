package com.example.avance_n2.controllers;

import com.example.avance_n2.models.Producto;
import com.example.avance_n2.repository.ProductoVariacionRepository;

import org.springframework.ui.Model;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller 
public class InicioController {

    private final ProductoVariacionRepository variacionRepository;

    public InicioController(ProductoVariacionRepository variacionRepository) {
        this.variacionRepository = variacionRepository;
    }

    @GetMapping("/index")
    public String index(Model model) {
        model.addAttribute(
            "variaciones",
            variacionRepository
                .findByProducto_EstadoProdAndStockGreaterThanOrderByTallaAscColorPvAsc(
                    Producto.EstadoProducto.Activo,
                    0
                )
        );
        return "index";
    }

    @GetMapping("/contacto")
    public String contacto() {
        return "contacto";
    }
}