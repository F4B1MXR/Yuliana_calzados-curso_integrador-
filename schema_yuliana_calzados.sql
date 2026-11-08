CREATE TABLE IF NOT EXISTS Usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    correo_usu VARCHAR(100) NOT NULL UNIQUE,
    contraseña_usu VARCHAR(255) NOT NULL,
    estado_usu ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo'
);

CREATE TABLE IF NOT EXISTS Cliente (
    id_cliente INT PRIMARY KEY,
    nombre_cli VARCHAR(100) NOT NULL,
    apellido_cli VARCHAR(100),
    telefono_cli VARCHAR(9),
    CONSTRAINT fk_cliente_usuario
        FOREIGN KEY (id_cliente)
        REFERENCES Usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Trabajador (
    id_trabajador INT PRIMARY KEY,
    nombre_tra VARCHAR(100) NOT NULL,
    apellido_tra VARCHAR(100),
    telefono_tra VARCHAR(9),
    cargo_tra ENUM('Administrador', 'Vendedor') NOT NULL,
    CONSTRAINT fk_trabajador_usuario
        FOREIGN KEY (id_trabajador)
        REFERENCES Usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre_cat VARCHAR(100) NOT NULL,
    descripcion_cat VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    modelo_prod VARCHAR(50) NOT NULL,
    descripcion_prod VARCHAR(500),
    imagen_prod VARCHAR(255) NULL,
    estado_prod ENUM('Activo', 'Descontinuado') NOT NULL DEFAULT 'Activo',
    precio_prod DECIMAL(10,2) NOT NULL,
    id_categoria INT NOT NULL,
    CONSTRAINT chk_producto_precio CHECK (precio_prod > 0),
    CONSTRAINT fk_producto_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES categorias(id_categoria)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS producto_variacion (
    id_variacion INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    talla VARCHAR(10) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    color_pv VARCHAR(50) NOT NULL DEFAULT 'Único',
    CONSTRAINT uq_producto_talla_color
        UNIQUE (id_producto, talla, color_pv),
    CONSTRAINT chk_stock_no_negativo CHECK (stock >= 0),
    CONSTRAINT fk_variacion_producto
        FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Carrito (
    id_carrito INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    estado_carrito ENUM('Activo', 'Finalizado')
        NOT NULL DEFAULT 'Activo',
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_carrito_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES Usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Detalle_Carrito (
    id_detalle_carrito INT AUTO_INCREMENT PRIMARY KEY,
    id_carrito INT NOT NULL,
    id_variacion INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    CONSTRAINT uq_carrito_variacion
        UNIQUE (id_carrito, id_variacion),
    CONSTRAINT chk_detalle_carrito_cantidad CHECK (cantidad >= 1),
    CONSTRAINT fk_detalle_carrito_carrito
        FOREIGN KEY (id_carrito)
        REFERENCES Carrito(id_carrito)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_detalle_carrito_variacion
        FOREIGN KEY (id_variacion)
        REFERENCES producto_variacion(id_variacion)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS caja (
    id_caja INT AUTO_INCREMENT PRIMARY KEY,
    id_vendedor INT NOT NULL,
    fecha_apertura_caja DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre_caja DATETIME NULL,
    monto_inicial_caja DECIMAL(10,2) NOT NULL,
    monto_final_caja DECIMAL(10,2) NULL,
    estado_caja ENUM('Abierta', 'Cerrada') NOT NULL DEFAULT 'Abierta',
    CONSTRAINT chk_caja_monto_inicial CHECK (monto_inicial_caja >= 0),
    CONSTRAINT chk_caja_monto_final
        CHECK (monto_final_caja IS NULL OR monto_final_caja >= 0),
    CONSTRAINT fk_caja_trabajador
        FOREIGN KEY (id_vendedor)
        REFERENCES Trabajador(id_trabajador)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS venta_fisica (
    id_venta_fisica INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NULL,
    id_vendedor INT NOT NULL,
    id_caja INT NOT NULL,
    fecha_vent_fis DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metodo_pago_fis ENUM(
        'Tarjeta', 'Yape_Plin', 'Transferencia', 'Efectivo'
    ) NOT NULL,
    estado_pago_fis ENUM(
        'Pendiente', 'Pagado', 'Reembolsado', 'Fallido'
    ) NOT NULL DEFAULT 'Pendiente',
    estado_vent_fis ENUM(
        'Completada', 'Cancelada', 'Anulada'
    ) NOT NULL DEFAULT 'Completada',
    total_vent_fis DECIMAL(10,2) NOT NULL,
    CONSTRAINT chk_venta_fisica_total CHECK (total_vent_fis >= 0),
    CONSTRAINT fk_venta_fisica_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES Cliente(id_cliente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_venta_fisica_trabajador
        FOREIGN KEY (id_vendedor)
        REFERENCES Trabajador(id_trabajador)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_venta_fisica_caja
        FOREIGN KEY (id_caja)
        REFERENCES caja(id_caja)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS venta_web (
    id_venta_web INT AUTO_INCREMENT PRIMARY KEY,
    id_carrito INT NOT NULL UNIQUE,
    fecha_vent_web DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    direccion_envio_web VARCHAR(255) NOT NULL,
    metodo_pago_web ENUM(
        'Tarjeta', 'Yape_Plin', 'Transferencia'
    ) NOT NULL,
    estado_pago_web ENUM(
        'Pendiente', 'Pagado', 'Reembolsado', 'Fallido'
    ) NOT NULL DEFAULT 'Pendiente',
    estado_vent_web ENUM(
        'Pendiente', 'En preparación', 'Enviado',
        'Entregado', 'Cancelado', 'Anulado'
    ) NOT NULL DEFAULT 'Pendiente',
    total_vent_web DECIMAL(10,2) NOT NULL,
    CONSTRAINT chk_venta_web_total CHECK (total_vent_web >= 0),
    CONSTRAINT fk_venta_web_carrito
        FOREIGN KEY (id_carrito)
        REFERENCES Carrito(id_carrito)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS detalle_venta_fisica (
    id_detalle_fis INT AUTO_INCREMENT PRIMARY KEY,
    id_venta_fisica INT NOT NULL,
    id_variacion INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT chk_detalle_fis_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_detalle_fis_precio CHECK (precio_unitario >= 0),
    CONSTRAINT chk_detalle_fis_subtotal CHECK (subtotal >= 0),
    CONSTRAINT fk_detalle_fis_venta
        FOREIGN KEY (id_venta_fisica)
        REFERENCES venta_fisica(id_venta_fisica)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_detalle_fis_variacion
        FOREIGN KEY (id_variacion)
        REFERENCES producto_variacion(id_variacion)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS detalle_venta_web (
    id_detalle_web INT AUTO_INCREMENT PRIMARY KEY,
    id_venta_web INT NOT NULL,
    id_variacion INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT chk_detalle_web_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_detalle_web_precio CHECK (precio_unitario >= 0),
    CONSTRAINT chk_detalle_web_subtotal CHECK (subtotal >= 0),
    CONSTRAINT fk_detalle_web_venta
        FOREIGN KEY (id_venta_web)
        REFERENCES venta_web(id_venta_web)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_detalle_web_variacion
        FOREIGN KEY (id_variacion)
        REFERENCES producto_variacion(id_variacion)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);
