package com.example.avance_n2.repository;

import com.example.avance_n2.models.Producto;
import com.example.avance_n2.models.ProductoVariacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductoVariacionRepository
        extends JpaRepository<ProductoVariacion, Integer> {

    List<ProductoVariacion> findByProducto_IdProducto(Integer idProducto);

    List<ProductoVariacion>
    findByProducto_EstadoProdAndStockGreaterThanOrderByTallaAscColorPvAsc(
        Producto.EstadoProducto estadoProd,
        Integer stock
    );

    Optional<ProductoVariacion>
    findByProducto_IdProductoAndTallaIgnoreCaseAndColorPvIgnoreCase(
        Integer idProducto,
        String talla,
        String colorPv
    );
}