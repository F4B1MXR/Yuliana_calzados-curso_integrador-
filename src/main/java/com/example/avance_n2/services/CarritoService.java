package com.example.avance_n2.services;

import com.example.avance_n2.models.Carrito;
import com.example.avance_n2.models.DetalleCarrito;
import com.example.avance_n2.models.ProductoVariacion;
import com.example.avance_n2.models.Usuario;

import com.example.avance_n2.repository.CarritoRepository;
import com.example.avance_n2.repository.DetalleCarritoRepository;
import com.example.avance_n2.repository.ProductoVariacionRepository;
import com.example.avance_n2.repository.UsuarioRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class CarritoService {

    private final CarritoRepository carritoRepository;
    private final DetalleCarritoRepository detalleRepository;
    private final ProductoVariacionRepository variacionRepository;
    private final UsuarioRepository usuarioRepository;

    public CarritoService(
            CarritoRepository carritoRepository,
            DetalleCarritoRepository detalleRepository,
            ProductoVariacionRepository variacionRepository,
            UsuarioRepository usuarioRepository) {

        this.carritoRepository = carritoRepository;
        this.detalleRepository = detalleRepository;
        this.variacionRepository = variacionRepository;
        this.usuarioRepository = usuarioRepository;
    }

    // Obtener el carrito activo o crear uno nuevo
    public Carrito obtenerOCrearCarrito(Integer idUsuario) {

        return carritoRepository
            .findByUsuario_IdUsuarioAndEstadoCarrito(
                idUsuario,
                Carrito.EstadoCarrito.Activo
            )
            .orElseGet(() -> {

                Usuario usuario = usuarioRepository
                    .findById(idUsuario)
                    .orElseThrow(() ->
                        new IllegalArgumentException(
                            "El usuario no existe"
                        )
                    );

                Carrito carrito = new Carrito();
                carrito.setUsuario(usuario);
                carrito.setEstadoCarrito(
                    Carrito.EstadoCarrito.Activo
                );

                return carritoRepository.save(carrito);
            });
    }

    // Mantiene el formato actual del API y persiste la variación identificada.
    public Carrito agregarProducto(
            Integer idUsuario,
            Integer idProducto,
            Integer cantidad,
            String talla,
            String color) {

        // Validar cantidad
        if (cantidad == null || cantidad < 1) {
            throw new IllegalArgumentException(
                "La cantidad debe ser como mínimo 1"
            );
        }

        // Validar talla
        if (talla == null || talla.isBlank()) {
            throw new IllegalArgumentException(
                "Debes seleccionar una talla"
            );
        }

        talla = talla.trim();

        if (talla.length() > 10) {
            throw new IllegalArgumentException(
                "La talla no puede superar los 10 caracteres"
            );
        }

        // Validar color
        if (color == null || color.isBlank()) {
            throw new IllegalArgumentException(
                "Debes seleccionar un color"
            );
        }

        color = color.trim();

        if (color.length() > 50) {
            throw new IllegalArgumentException(
                "El color no puede superar los 50 caracteres"
            );
        }

        // Resolver la combinación recibida a una variación existente.
        ProductoVariacion variacion = variacionRepository
            .findByProducto_IdProductoAndTallaIgnoreCaseAndColorPvIgnoreCase(
                idProducto,
                talla,
                color
            )
            .orElseThrow(() ->
                new IllegalArgumentException(
                    "La talla y el color seleccionados no existen para este producto"
                )
            );

        // Obtener o crear el carrito activo
        Carrito carrito = obtenerOCrearCarrito(idUsuario);

        // La identidad del artículo en el carrito es su variación.
        DetalleCarrito detalle = detalleRepository
            .findByCarrito_IdCarritoAndVariacion_IdVariacion(
                carrito.getIdCarrito(),
                variacion.getIdVariacion()
            )
            .orElse(null);

        int cantidadActual = detalle == null ? 0 : detalle.getCantidad();
        if (cantidadActual + cantidad > variacion.getStock()) {
            throw new IllegalArgumentException(
                "Stock insuficiente para la talla y el color seleccionados. "
                    + "Disponible: "
                    + Math.max(variacion.getStock() - cantidadActual, 0)
            );
        }

        if (detalle == null) {
            detalle = new DetalleCarrito();
            detalle.setCarrito(carrito);
            detalle.setVariacion(variacion);
            detalle.setCantidad(0);
        }

        detalle.setCantidad(cantidadActual + cantidad);
        detalleRepository.save(detalle);

        return carrito;
    }

    // Consultar los productos del carrito
    @Transactional(readOnly = true)
    public List<DetalleCarrito> listarDetalles(
            Integer idUsuario) {

        return carritoRepository
            .findByUsuario_IdUsuarioAndEstadoCarrito(
                idUsuario,
                Carrito.EstadoCarrito.Activo
            )
            .map(carrito ->
                detalleRepository.findByCarrito_IdCarrito(
                    carrito.getIdCarrito()
                )
            )
            .orElse(List.of());
    }

    // Cambiar la cantidad de un producto
    public void actualizarCantidad(
            Integer idUsuario,
            Integer idDetalle,
            Integer nuevaCantidad) {

        if (nuevaCantidad == null || nuevaCantidad < 1) {
            throw new IllegalArgumentException(
                "La cantidad debe ser como mínimo 1"
            );
        }

        Carrito carrito = obtenerCarritoActivo(idUsuario);

        DetalleCarrito detalle = detalleRepository
            .findById(idDetalle)
            .orElseThrow(() ->
                new IllegalArgumentException(
                    "El detalle del carrito no existe"
                )
            );

        if (!detalle.getCarrito().getIdCarrito()
                .equals(carrito.getIdCarrito())) {

            throw new IllegalArgumentException(
                "El producto no pertenece a este carrito"
            );
        }

        if (nuevaCantidad > detalle.getVariacion().getStock()) {
            throw new IllegalArgumentException(
                "La cantidad supera el stock disponible: "
                    + detalle.getVariacion().getStock()
            );
        }

        detalle.setCantidad(nuevaCantidad);
        detalleRepository.save(detalle);
    }

    // Eliminar un producto del carrito
    public void eliminarProducto(
            Integer idUsuario,
            Integer idDetalle) {

        Carrito carrito = obtenerCarritoActivo(idUsuario);

        DetalleCarrito detalle = detalleRepository
            .findById(idDetalle)
            .orElseThrow(() ->
                new IllegalArgumentException(
                    "El detalle del carrito no existe"
                )
            );

        if (!detalle.getCarrito().getIdCarrito()
                .equals(carrito.getIdCarrito())) {

            throw new IllegalArgumentException(
                "El producto no pertenece a este carrito"
            );
        }

        detalleRepository.delete(detalle);
    }

    // Calcular el total actual del carrito
    @Transactional(readOnly = true)
    public BigDecimal calcularTotal(Integer idUsuario) {

        List<DetalleCarrito> detalles =
            listarDetalles(idUsuario);

        BigDecimal total = BigDecimal.ZERO;

        for (DetalleCarrito detalle : detalles) {

            BigDecimal precio =
                detalle.getVariacion().getProducto().getPrecioProd();

            BigDecimal subtotal = precio.multiply(
                BigDecimal.valueOf(detalle.getCantidad())
            );

            total = total.add(subtotal);
        }

        return total;
    }

    // Buscar el carrito activo del usuario
    private Carrito obtenerCarritoActivo(Integer idUsuario) {

        return carritoRepository
            .findByUsuario_IdUsuarioAndEstadoCarrito(
                idUsuario,
                Carrito.EstadoCarrito.Activo
            )
            .orElseThrow(() ->
                new IllegalArgumentException(
                    "El usuario todavía no tiene un carrito activo"
                )
            );
    }
}