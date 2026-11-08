package com.example.avance_n2.controllers;

import com.example.avance_n2.models.Producto;
import com.example.avance_n2.models.Categoria;
import com.example.avance_n2.repository.ProductoRepository;
import com.example.avance_n2.repository.ProductoVariacionRepository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller 
public class ColeccionController {

    private final ProductoRepository productoRepository;
    private final ProductoVariacionRepository variacionRepository;

    public ColeccionController(
            ProductoRepository productoRepository,
            ProductoVariacionRepository variacionRepository) {
        this.productoRepository = productoRepository;
        this.variacionRepository = variacionRepository;
    }

    @GetMapping("/coleccion")
    public String coleccion(Model model) {
        List<Producto> productos =
            productoRepository.findByEstadoProdOrderByModeloProdAsc(
                Producto.EstadoProducto.Activo
            );
        Map<Integer, Categoria> categorias = new LinkedHashMap<>();

        for (Producto producto : productos) {
            Categoria categoria = producto.getCategoria();
            categorias.putIfAbsent(
                categoria.getIdCategoria(),
                categoria
            );
        }

        model.addAttribute(
            "productos",
            productos
        );
        model.addAttribute("categorias", categorias.values());
        model.addAttribute(
            "variaciones",
            variacionRepository
                .findByProducto_EstadoProdAndStockGreaterThanOrderByTallaAscColorPvAsc(
                    Producto.EstadoProducto.Activo,
                    0
                )
        );
        return "coleccion";
    }
}
