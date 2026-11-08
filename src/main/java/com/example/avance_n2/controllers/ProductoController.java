package com.example.avance_n2.controllers;

import com.example.avance_n2.models.Categoria;
import com.example.avance_n2.models.Producto;
import com.example.avance_n2.repository.CategoriaRepository;
import com.example.avance_n2.repository.ProductoRepository;
import com.example.avance_n2.services.ProductoImagenStorageService;
import com.example.avance_n2.validators.ProductoValidator;

import java.io.IOException;

import jakarta.validation.Valid;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Controller
@RequestMapping("/productos")
public class ProductoController {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProductoValidator productoValidator;
    private final ProductoImagenStorageService imagenStorageService;

    public ProductoController(
            ProductoRepository productoRepository,
            CategoriaRepository categoriaRepository,
            ProductoValidator productoValidator,
            ProductoImagenStorageService imagenStorageService) {

        this.productoRepository = productoRepository;
        this.categoriaRepository = categoriaRepository;
        this.productoValidator = productoValidator;
        this.imagenStorageService = imagenStorageService;
    }

    @GetMapping
    public String listar(Model model) {
        model.addAttribute("productos", productoRepository.findAll());
        return "productos/listar";
    }

    @GetMapping("/nuevo")
    public String mostrarFormulario(Model model) {
        model.addAttribute("producto", new Producto());
        cargarCategorias(model);
        return "productos/formulario";
    }

    @PostMapping("/guardar")
    public String guardar(
            @Valid @ModelAttribute("producto") Producto producto,
            BindingResult resultado,
            @RequestParam(name = "imagen", required = false)
            MultipartFile imagen,
            Model model) {

        productoValidator.validate(producto, resultado);
        Producto productoExistente = producto.getIdProducto() == null
            ? null
            : productoRepository.findById(producto.getIdProducto())
                .orElseThrow(() ->
                    new IllegalArgumentException(
                        "Producto no encontrado: " + producto.getIdProducto()
                    )
                );

        if (productoExistente != null) {
            producto.setImagenProd(productoExistente.getImagenProd());
        }

        // Comprobar que la categoría seleccionada exista en la BD.
        if (producto.getCategoria() != null
                && producto.getCategoria().getIdCategoria() != null
                && !categoriaRepository.existsById(
                    producto.getCategoria().getIdCategoria())) {

            if (!resultado.hasFieldErrors("categoria")) {
                resultado.rejectValue(
                    "categoria",
                    "categoria.noexiste",
                    "La categoría seleccionada no existe"
                );
            }
        }

        if (resultado.hasErrors()) {
            cargarCategorias(model);
            return "productos/formulario";
        }

        String rutaImagen = null;
        if (imagen != null && !imagen.isEmpty()) {
            try {
                rutaImagen = imagenStorageService.guardar(imagen);
            } catch (IllegalArgumentException ex) {
                resultado.rejectValue("imagenProd", "imagen.invalida", ex.getMessage());
                cargarCategorias(model);
                model.addAttribute("imagenError", ex.getMessage());
                return "productos/formulario";
            } catch (IOException ex) {
                throw new IllegalStateException(
                    "No se pudo guardar la imagen del producto",
                    ex
                );
            }
        }

        // Asociar una categoría obtenida de la base de datos.
        Integer idCategoria = producto.getCategoria().getIdCategoria();

        Categoria categoria = categoriaRepository.findById(idCategoria)
            .orElseThrow(() ->
                new IllegalArgumentException("Categoría no encontrada")
            );

        Producto productoParaGuardar = productoExistente == null
            ? producto
            : productoExistente;
        productoParaGuardar.setModeloProd(producto.getModeloProd());
        productoParaGuardar.setDescripcionProd(producto.getDescripcionProd());
        productoParaGuardar.setEstadoProd(producto.getEstadoProd());
        productoParaGuardar.setPrecioProd(producto.getPrecioProd());
        productoParaGuardar.setCategoria(categoria);
        if (rutaImagen != null) {
            productoParaGuardar.setImagenProd(rutaImagen);
        }
        productoRepository.save(productoParaGuardar);

        return "redirect:/productos";
    }

    @GetMapping("/editar/{id}")
    public String editar(
            @PathVariable Integer id,
            Model model) {

        Producto producto = productoRepository.findById(id)
            .orElseThrow(() ->
                new IllegalArgumentException(
                    "Producto no encontrado: " + id
                )
            );

        model.addAttribute("producto", producto);
        cargarCategorias(model);

        return "productos/formulario";
    }

    @PostMapping("/eliminar/{id}")
    public String eliminar(@PathVariable Integer id) {
        productoRepository.deleteById(id);
        return "redirect:/productos";
    }

    private void cargarCategorias(Model model) {
        model.addAttribute("categorias", categoriaRepository.findAll());
    }
}