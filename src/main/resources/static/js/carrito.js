document.addEventListener("DOMContentLoaded", function () {

    // ============================================
    // 1. CONFIGURACIÓN DE LA API
    // ============================================

    const checkoutForm = document.getElementById("formCheckout");
    const navbar = document.querySelector(".navbar[data-id-usuario]");
    const checkoutUsuarioId = Number(
        checkoutForm ? checkoutForm.dataset.idUsuario : navbar?.dataset.idUsuario
    );
    const ID_USUARIO = Number.isInteger(checkoutUsuarioId)
        && checkoutUsuarioId > 0
        ? checkoutUsuarioId
        : 2;
    const API_CARRITO = "/api/carrito/" + ID_USUARIO;
    const COSTO_ENVIO = 15;

    // Los productos se mantienen en memoria.
    // La fuente principal de datos es Spring Boot y MySQL.
    let carritoActual = [];
    let productoSeleccionado = null;

    // Guardamos las imágenes de los productos de la colección.
    const imagenesProductos = {
        "1": "/img/stilleto_clasico.jpeg",
        "2": "/img/sandalia_glam.jpeg",
        "3": "/img/sneaker_urbana.jpeg",
        "4": "/img/botin_cafe.jpeg",
        "5": "/img/mocasin.jpeg",
        "6": "/img/botin_cafe.avif",
        "7": "/img/sandalia_siena.jpeg",
        "8": "/img/stilleto_verona.jpeg",
        "9": "/img/mule_paris.jpeg",
        "10": "/img/tacon_victoria.jpeg",
        "11": "/img/sandalia_glamour.jpeg",
        "12": "/img/tacon_elegance.jpeg",
        "13": "/img/loafer_classic.jpeg",
        "14": "/img/sneaker_bloom.jpeg",
        "15": "/img/ballerina_soft.jpeg",
        "16": "/img/mocasin_comfort.jpeg",
        "17": "/img/sandalia_breeze.jpeg",
        "18": "/img/plataforma_street.jpeg"
    };

    // ============================================
    // 2. FUNCIONES GENERALES
    // ============================================

    function formatearPrecio(valor) {
        return "S/ " + Number(valor || 0).toFixed(2);
    }

    function escaparHTML(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, function (caracter) {
            const equivalencias = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return equivalencias[caracter];
        });
    }

    function calcularSubtotal(carrito) {
        return carrito.reduce(function (total, producto) {
            return total + Number(producto.precio) * Number(producto.cantidad);
        }, 0);
    }

    async function procesarRespuesta(respuesta) {
        if (!respuesta.ok) {
            let mensaje = "Ocurrió un error al comunicarse con el servidor.";

            try {
                const error = await respuesta.json();
                mensaje = error.message || error.mensaje || error.detail || mensaje;
            } catch (e) {
                // La respuesta de error podría no contener JSON.
            }

            throw new Error(mensaje);
        }

        if (respuesta.status === 204) {
            return null;
        }

        return respuesta.json();
    }

    function mostrarError(error) {
        console.error("Error en el carrito:", error);
        alert(error.message || "No se pudo completar la operación.");
    }

    function agregarOpcion(select, valor, texto, seleccionada) {
        const opcion = document.createElement("option");
        opcion.value = valor;
        opcion.textContent = texto;
        opcion.selected = seleccionada;
        select.appendChild(opcion);
    }

    function renderizarOpciones(container, valores, seleccionado, alSeleccionar) {
        container.replaceChildren();

        valores.forEach(function (valor) {
            const boton = document.createElement("button");
            boton.type = "button";
            boton.className = valor === seleccionado
                ? "btn btn-sm btn-dark variant-choice"
                : "btn btn-sm btn-outline-secondary variant-choice";
            boton.textContent = valor;
            boton.setAttribute("aria-pressed", String(valor === seleccionado));
            boton.addEventListener("click", function () {
                alSeleccionar(valor);
            });
            container.appendChild(boton);
        });
    }

    function actualizarDisponibilidad() {
        const variacion = productoSeleccionado
            && (productoSeleccionado.variaciones || []).find(
                function (opcion) {
                    return opcion.talla === selectorTalla.value
                        && opcion.color === selectorColor.value;
                }
            );
        const disponibilidad =
            document.getElementById("disponibilidadVariacion");
        const cantidad = document.getElementById("cantidadProducto");
        const botonAgregar = document.getElementById("btnAgregarCarrito");

        if (!variacion) {
            cantidad.value = "1";
            cantidad.max = "1";
            if (disponibilidad) {
                disponibilidad.textContent = "Elige una talla y un color.";
                disponibilidad.className = "small text-secondary";
            }
            botonAgregar.disabled = true;
            return;
        }

        cantidad.max = String(variacion.stock);
        if (Number(cantidad.value) > variacion.stock) {
            cantidad.value = String(variacion.stock);
        }
        if (Number(cantidad.value) < 1) {
            cantidad.value = "1";
        }

        if (disponibilidad) {
            disponibilidad.textContent =
                "Disponible: " + variacion.stock + " unidad(es).";
            disponibilidad.className = "small text-success";
        }
        botonAgregar.disabled = Number(cantidad.value) > variacion.stock;
    }

    function cargarVariacionesDelProducto(idProducto) {
        const catalogo = document.getElementById("variacionesCatalogo");

        if (!catalogo) {
            return;
        }

        const selectTalla = document.getElementById("selectTalla");
        const selectColor = document.getElementById("selectColor");
        const cantidad = document.getElementById("cantidadProducto");
        const botonAgregar = document.getElementById("btnAgregarCarrito");
        const disponibilidad = document.getElementById("disponibilidadVariacion");
        const opcionesTalla = document.getElementById("opcionesTalla");
        const opcionesColor = document.getElementById("opcionesColor");

        productoSeleccionado.variaciones = Array.from(
            catalogo.querySelectorAll("[data-producto-id]")
        )
            .filter(function (elemento) {
                return elemento.dataset.productoId === String(idProducto);
            })
            .map(function (elemento) {
                return {
                    talla: elemento.dataset.talla,
                    color: elemento.dataset.color,
                    stock: Number(elemento.dataset.stock)
                };
            });

        selectTalla.replaceChildren();
        agregarOpcion(selectTalla, "", "Elige una talla", true);
        const tallas = Array.from(new Set(productoSeleccionado.variaciones.map(function (variacion) {
            return variacion.talla;
        })));
        tallas.forEach(function (talla) {
            agregarOpcion(selectTalla, talla, talla, false);
        });

        selectColor.replaceChildren();
        agregarOpcion(selectColor, "", "Elige un color", true);
        selectColor.disabled = true;
        opcionesColor.replaceChildren();
        renderizarOpciones(opcionesTalla, tallas, "", function (talla) {
            selectTalla.value = talla;
            selectTalla.dispatchEvent(new Event("change"));
        });
        cantidad.value = "1";
        cantidad.max = "1";
        selectTalla.disabled = productoSeleccionado.variaciones.length === 0;
        botonAgregar.disabled = productoSeleccionado.variaciones.length === 0;

        if (disponibilidad) {
            disponibilidad.textContent = productoSeleccionado.variaciones.length
                ? "Elige una talla y un color."
                : "Este producto no tiene variaciones con stock disponible.";
            disponibilidad.className = productoSeleccionado.variaciones.length
                ? "small text-secondary"
                : "small text-danger";
        }
    }

    const selectorTalla = document.getElementById("selectTalla");
    const selectorColor = document.getElementById("selectColor");

    if (selectorTalla && selectorColor
            && document.getElementById("variacionesCatalogo")) {
        selectorTalla.addEventListener("change", function () {
            const variaciones = productoSeleccionado
                ? productoSeleccionado.variaciones || []
                : [];
            const colores = Array.from(new Set(
                variaciones
                    .filter(function (variacion) {
                        return variacion.talla === selectorTalla.value;
                    })
                    .map(function (variacion) {
                        return variacion.color;
                    })
            ));

            selectorColor.replaceChildren();
            agregarOpcion(
                selectorColor,
                "",
                colores.length ? "Elige un color" : "No hay colores disponibles",
                true
            );
            colores.forEach(function (color) {
                agregarOpcion(selectorColor, color, color, false);
            });
            selectorColor.disabled = colores.length === 0;

            renderizarOpciones(
                document.getElementById("opcionesColor"),
                colores,
                "",
                function (color) {
                    selectorColor.value = color;
                    selectorColor.dispatchEvent(new Event("change"));
                }
            );
            renderizarOpciones(
                document.getElementById("opcionesTalla"),
                Array.from(new Set(variaciones.map(function (opcion) {
                    return opcion.talla;
                }))),
                selectorTalla.value,
                function (talla) {
                    selectorTalla.value = talla;
                    selectorTalla.dispatchEvent(new Event("change"));
                }
            );
            actualizarDisponibilidad();
        });

        selectorColor.addEventListener("change", function () {
            const colores = Array.from(new Set(
                (productoSeleccionado.variaciones || [])
                    .filter(function (opcion) {
                        return opcion.talla === selectorTalla.value;
                    })
                    .map(function (opcion) {
                        return opcion.color;
                    })
            ));
            renderizarOpciones(
                document.getElementById("opcionesColor"),
                colores,
                selectorColor.value,
                function (color) {
                    selectorColor.value = color;
                    selectorColor.dispatchEvent(new Event("change"));
                }
            );
            actualizarDisponibilidad();
        });
    }

    const cantidadProducto = document.getElementById("cantidadProducto");
    const restarCantidadProducto =
        document.getElementById("restarCantidadProducto");
    const sumarCantidadProducto =
        document.getElementById("sumarCantidadProducto");

    if (cantidadProducto) {
        cantidadProducto.addEventListener("input", function () {
            const minimo = Number(cantidadProducto.min);
            const maximo = Number(cantidadProducto.max);
            let cantidad = Number(cantidadProducto.value);

            if (!cantidadProducto.value) {
                document.getElementById("btnAgregarCarrito").disabled = true;
                return;
            }

            if (Number.isFinite(cantidad) && cantidad > 0) {
                cantidad = Math.min(Math.floor(cantidad), maximo);
                cantidadProducto.value = String(cantidad);
            }
            actualizarDisponibilidad();
            document.getElementById("btnAgregarCarrito").disabled =
                !Number.isFinite(cantidad) || cantidad < minimo
                || cantidad > maximo || !selectorColor.value;
        });
    }

    if (restarCantidadProducto && cantidadProducto) {
        restarCantidadProducto.addEventListener("click", function () {
            cantidadProducto.value = String(Math.max(
                Number(cantidadProducto.min),
                Number(cantidadProducto.value) - 1
            ));
            cantidadProducto.dispatchEvent(new Event("input"));
        });
    }

    if (sumarCantidadProducto && cantidadProducto) {
        sumarCantidadProducto.addEventListener("click", function () {
            cantidadProducto.value = String(Math.min(
                Number(cantidadProducto.max),
                Number(cantidadProducto.value) + 1
            ));
            cantidadProducto.dispatchEvent(new Event("input"));
        });
    }

    // ============================================
    // 3. CONSULTAR EL CARRITO EN SPRING BOOT
    // ============================================

    async function cargarCarrito() {
        try {
            const respuesta = await fetch(API_CARRITO);
            const detalles = await procesarRespuesta(respuesta);

            // Adaptamos los nombres de la respuesta de Java
            // a los que utiliza la interfaz de la página.
            carritoActual = detalles.map(function (detalle) {
                return {
                    idDetalle: detalle.idDetalle,
                    id: detalle.idProducto,
                    nombre: detalle.modelo,
                    precio: Number(detalle.precio),
                    imagen: detalle.imagen
                        || imagenesProductos[String(detalle.idProducto)]
                        || "",
                    talla: detalle.talla,
                    color: detalle.color,
                    cantidad: Number(detalle.cantidad),
                    subtotal: Number(detalle.subtotal)
                };
            });

            renderizarCarrito();
            renderizarOffcanvas();
            renderizarCheckout();

        } catch (error) {
            mostrarError(error);
        }
    }

    // ============================================
    // 4. AGREGAR PRODUCTOS
    // ============================================


    async function agregarAlCarrito(producto) {
        try {
            const respuesta = await fetch(API_CARRITO + "/productos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    idProducto: Number(producto.id),
                    cantidad: Number(producto.cantidad),
                    talla: producto.talla,
                    color: producto.color
                })
            });

            await procesarRespuesta(respuesta);

            await cargarCarrito();

            const mensaje = document.getElementById("mensajeCarrito");

            if (mensaje) {
                mensaje.textContent = "✓ Añadido al carrito";

                setTimeout(function () {
                    mensaje.textContent = "";
                }, 2000);
            }

        } catch (error) {
            mostrarError(error);
        }
    }


    // ============================================
    // 5. CAMBIAR CANTIDAD
    // ============================================

    async function cambiarCantidad(idDetalle, cambio) {
        const producto = carritoActual.find(function (item) {
            return String(item.idDetalle) === String(idDetalle);
        });

        if (!producto) {
            return;
        }

        const nuevaCantidad = producto.cantidad + cambio;

        try {
            // Si la cantidad llega a cero, eliminamos el detalle.
            if (nuevaCantidad <= 0) {
                await eliminarProducto(idDetalle);
                return;
            }

            const respuesta = await fetch(
                API_CARRITO + "/productos/" +
                encodeURIComponent(idDetalle) +
                "?cantidad=" + nuevaCantidad,
                {
                    method: "PUT"
                }
            );

            await procesarRespuesta(respuesta);
            await cargarCarrito();

        } catch (error) {
            mostrarError(error);
        }
    }

    // ============================================
    // 6. ELIMINAR PRODUCTOS
    // ============================================

    async function eliminarProducto(idDetalle) {
        try {
            const respuesta = await fetch(
                API_CARRITO + "/productos/" +
                encodeURIComponent(idDetalle),
                {
                    method: "DELETE"
                }
            );

            await procesarRespuesta(respuesta);
            await cargarCarrito();

        } catch (error) {
            mostrarError(error);
        }
    }

    // ============================================
    // 7. ACTUALIZAR RESUMEN DEL CARRITO
    // ============================================

    function actualizarResumenCarrito(subtotal) {
        const envio = subtotal > 0 ? COSTO_ENVIO : 0;
        const total = subtotal + envio;

        const subtotalElemento = document.getElementById("subtotalCarrito");
        const envioElemento = document.getElementById("envioCarrito");
        const totalElemento = document.getElementById("totalCarrito");

        if (subtotalElemento) {
            subtotalElemento.textContent = formatearPrecio(subtotal);
        }

        if (envioElemento) {
            envioElemento.textContent = formatearPrecio(envio);
        }

        if (totalElemento) {
            totalElemento.textContent = formatearPrecio(total);
        }
    }

    // ============================================
    // 8. MOSTRAR CARRITO PRINCIPAL
    // ============================================

    function renderizarCarrito() {
        const contenedor = document.getElementById("listaCarrito");

        if (!contenedor) {
            return;
        }

        if (carritoActual.length === 0) {
            contenedor.innerHTML = `
                <div class="alert text-center">
                    <i class="bi bi-cart-x fs-1"></i>
                    <p class="mt-2 mb-3">Tu carrito está vacío.</p>
                    <a href="/coleccion" class="btn btn-dark">
                        Ver colección
                    </a>
                </div>
            `;

            actualizarResumenCarrito(0);
            return;
        }

        contenedor.innerHTML = carritoActual.map(function (producto) {
            const imagen = escaparHTML(producto.imagen);
            const nombre = escaparHTML(producto.nombre);
            const talla = escaparHTML(producto.talla);
            const idDetalle = escaparHTML(producto.idDetalle);

            return `
                <div class="card mb-3 shadow-sm border-0">
                    <div class="row g-0 align-items-center">

                        <div class="col-4 col-md-3">
                            ${imagen
                    ? `<img src="${imagen}"
                                           class="img-fluid rounded-start w-100 h-100"
                                           style="object-fit: cover;"
                                           alt="${nombre}">`
                    : ""
                }
                        </div>

                        <div class="col-8 col-md-9">
                            <div class="card-body">

                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h5 class="card-title fw-bold mb-1">
                                            ${nombre}
                                        </h5>

                                        <p class="card-text text-muted small mb-2">
                                            Talla: ${talla}
                                        </p>
                                    </div>

                                    <button type="button"
                                            class="btn btn-danger btn-sm text-white"
                                            data-accion="eliminar"
                                            data-id="${idDetalle}">
                                        <i class="bi bi-trash p-0 fs-6 text-white"></i>
                                    </button>
                                </div>

                                <div class="d-flex justify-content-between align-items-center mt-3">

                                    <div class="input-group" style="max-width: 130px;">
                                        <button type="button"
                                                class="input-group-text bg-light"
                                                data-accion="restar"
                                                data-id="${idDetalle}">
                                            -
                                        </button>

                                        <input type="text"
                                               class="form-control text-center bg-white"
                                               value="${producto.cantidad}"
                                               readonly>

                                        <button type="button"
                                                class="input-group-text bg-light"
                                                data-accion="sumar"
                                                data-id="${idDetalle}">
                                            +
                                        </button>
                                    </div>

                                    <div class="text-end">
                                        <span class="precio-actual">
                                            ${formatearPrecio(
                    producto.precio * producto.cantidad
                )}
                                        </span>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join("");

        actualizarResumenCarrito(calcularSubtotal(carritoActual));
    }

    // ============================================
    // 9. MOSTRAR CARRITO LATERAL (OFFCANVAS)
    // ============================================

    function renderizarOffcanvas() {
        const contenedor = document.getElementById("listaCarritoOffcanvas");
        const totalElemento = document.getElementById("totalOffcanvas");

        if (!contenedor) {
            return;
        }

        if (carritoActual.length === 0) {
            contenedor.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-cart-x fs-1"></i>
                    <p class="mt-2">Tu carrito está vacío.</p>
                </div>
            `;

            if (totalElemento) {
                totalElemento.textContent = "S/ 0.00";
            }

            return;
        }

        contenedor.innerHTML = carritoActual.map(function (producto) {
            const nombre = escaparHTML(producto.nombre);
            const talla = escaparHTML(producto.talla);
            const idDetalle = escaparHTML(producto.idDetalle);

            return `
                <div class="border-bottom pb-3 mb-3">

                    <div class="d-flex justify-content-between">
                        <div>
                            <h6 class="mb-1">${nombre}</h6>
                            <small class="text-muted">Talla: ${talla}</small>
                        </div>

                        <button type="button"
                                class="btn btn-sm btn-outline-danger"
                                data-accion="eliminar"
                                data-id="${idDetalle}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>

                    <div class="d-flex justify-content-between align-items-center mt-2">

                        <div class="input-group input-group-sm" style="max-width: 110px;">
                            <button type="button"
                                    class="input-group-text"
                                    data-accion="restar"
                                    data-id="${idDetalle}">
                                -
                            </button>

                            <span class="form-control text-center">
                                ${producto.cantidad}
                            </span>

                            <button type="button"
                                    class="input-group-text"
                                    data-accion="sumar"
                                    data-id="${idDetalle}">
                                +
                            </button>
                        </div>

                        <strong>
                            ${formatearPrecio(
                producto.precio * producto.cantidad
            )}
                        </strong>
                    </div>
                </div>
            `;
        }).join("");

        if (totalElemento) {
            totalElemento.textContent =
                formatearPrecio(calcularSubtotal(carritoActual));
        }
    }

    // ============================================
    // 10. DETECTAR BOTONES +, - Y ELIMINAR
    // ============================================

    document.addEventListener("click", function (evento) {
        const boton = evento.target.closest("[data-accion]");

        if (!boton) {
            return;
        }

        const accion = boton.dataset.accion;
        const idDetalle = boton.dataset.id;

        if (accion === "sumar") {
            cambiarCantidad(idDetalle, 1);
        }

        if (accion === "restar") {
            cambiarCantidad(idDetalle, -1);
        }

        if (accion === "eliminar") {
            eliminarProducto(idDetalle);
        }
    });

    // ============================================
    // 11. SELECCIONAR PRODUCTO EN LA COLECCIÓN
    // ============================================

    document.querySelectorAll(".btn-detalle").forEach(function (boton) {
        boton.addEventListener("click", function () {
            const tarjeta = boton.closest(".card");
            const descripcionTarjeta = tarjeta
                && tarjeta.querySelector(".card-text");
            const categoriaTarjeta = tarjeta
                && tarjeta.querySelector(".badge");
            productoSeleccionado = {
                id: boton.dataset.id,
                nombre: boton.dataset.producto,
                precio: Number(boton.dataset.precio),
                imagen: boton.dataset.imagen || "",
                descripcion: boton.dataset.descripcion
                    || (descripcionTarjeta
                        ? descripcionTarjeta.textContent.trim()
                        : "Consulta los detalles y opciones disponibles."),
                categoria: boton.dataset.categoria
                    || (categoriaTarjeta
                        ? categoriaTarjeta.textContent.trim()
                        : "")
            };

            const titulo = document.getElementById("modalDetalleLabel");
            const descripcion =
                document.getElementById("detalleProductoDescripcion");
            const categoria =
                document.getElementById("detalleProductoCategoria");
            const precio =
                document.getElementById("detalleProductoPrecio");
            const imagen =
                document.getElementById("detalleProductoImagen");

            if (titulo) {
                titulo.textContent = productoSeleccionado.nombre;
            }
            if (descripcion) {
                descripcion.textContent = productoSeleccionado.descripcion;
            }
            if (categoria) {
                categoria.textContent = productoSeleccionado.categoria;
                categoria.classList.toggle(
                    "d-none",
                    !productoSeleccionado.categoria
                );
            }
            if (precio) {
                precio.textContent = formatearPrecio(productoSeleccionado.precio);
            }
            if (imagen) {
                imagen.src = productoSeleccionado.imagen
                    || "/img/banner-coleccion.png";
                imagen.alt = productoSeleccionado.nombre;
            }

            cargarVariacionesDelProducto(productoSeleccionado.id);
        });
    });

    // ============================================
    // 12. BOTÓN AÑADIR AL CARRITO
    // ============================================

    const btnAgregar = document.getElementById("btnAgregarCarrito");

    if (btnAgregar) {
        btnAgregar.addEventListener("click", async function () {
            if (!productoSeleccionado) {
                alert("Primero selecciona un producto.");
                return;
            }

            const selectTalla = document.getElementById("selectTalla");
            const selectColor = document.getElementById("selectColor");
            const cantidad = Number(
                document.getElementById("cantidadProducto").value
            );

            if (!selectTalla || !selectTalla.value) {
                alert("Debes seleccionar una talla.");
                return;
            }

            if (!selectColor || !selectColor.value) {
                alert("Debes seleccionar un color.");
                return;
            }

            await agregarAlCarrito({
                id: productoSeleccionado.id,
                nombre: productoSeleccionado.nombre,
                precio: productoSeleccionado.precio,
                imagen: productoSeleccionado.imagen,
                talla: selectTalla.value,
                color: selectColor.value,
                cantidad: cantidad
            });
        });
    }

    // ============================================
    // 13. MOSTRAR RESUMEN EN EL CHECKOUT
    // ============================================

    function renderizarCheckout() {
        const contenedor = document.getElementById("resumenCheckout");

        if (!contenedor) {
            return;
        }

        if (carritoActual.length === 0) {
            contenedor.innerHTML = `
                <div class="alert text-center">
                    <i class="bi bi-cart-x fs-1"></i>
                    <p class="mt-2">Tu carrito está vacío.</p>
                    <a href="/coleccion" class="btn btn-dark">
                        Ver colección
                    </a>
                </div>
            `;

            actualizarTotalesCheckout(0);
            return;
        }

        contenedor.innerHTML = carritoActual.map(function (producto) {
            const nombre = escaparHTML(producto.nombre);
            const imagen = escaparHTML(producto.imagen);
            const talla = escaparHTML(producto.talla);

            return `
                <div class="d-flex align-items-center mb-3">

                    ${imagen
                    ? `<img src="${imagen}"
                                   class="rounded me-3"
                                   style="width: 60px; height: 60px; object-fit: cover;"
                                   alt="${nombre}">`
                    : ""
                }

                    <div class="flex-grow-1">
                        <h6 class="mb-0 fw-semibold">${nombre}</h6>
                        <small class="text-muted">
                            Cant: ${producto.cantidad} | Talla: ${talla}
                        </small>
                    </div>

                    <span class="fw-bold">
                        ${formatearPrecio(
                    producto.precio * producto.cantidad
                )}
                    </span>
                </div>
            `;
        }).join("");

        actualizarTotalesCheckout(calcularSubtotal(carritoActual));
    }

    function actualizarTotalesCheckout(subtotal) {
        const envio = subtotal > 0 ? COSTO_ENVIO : 0;
        const total = subtotal + envio;

        const subtotalElemento = document.getElementById("subtotalCheckout");
        const envioElemento = document.getElementById("envioCheckout");
        const totalElemento = document.getElementById("totalCheckout");

        if (subtotalElemento) {
            subtotalElemento.textContent = formatearPrecio(subtotal);
        }

        if (envioElemento) {
            envioElemento.textContent = formatearPrecio(envio);
        }

        if (totalElemento) {
            totalElemento.textContent = formatearPrecio(total);
        }
    }

    // ============================================
    // 14. CONFIRMAR PEDIDO (FLUJO ACTUAL TEMPORAL)
    // ============================================

    const formularioCheckout = document.getElementById("formCheckout");

    if (formularioCheckout) {
        formularioCheckout.addEventListener("submit", async function (evento) {
            evento.preventDefault();

            if (!formularioCheckout.checkValidity()) {
                formularioCheckout.reportValidity();
                return;
            }

            const botonConfirmar =
                document.getElementById("btnConfirmarPedido");

            try {
                // Evitar que se envíe dos veces mientras se procesa
                if (botonConfirmar) {
                    botonConfirmar.disabled = true;
                    botonConfirmar.textContent = "Procesando compra...";
                }

                // Obtener los productos actuales desde Spring Boot
                const respuestaCarrito = await fetch(API_CARRITO);
                const detalles = await procesarRespuesta(respuestaCarrito);

                if (!detalles || detalles.length === 0) {
                    alert("No hay productos en el carrito.");
                    await cargarCarrito();
                    return;
                }

                const productosPedido = detalles.map(function (detalle) {
                    return {
                        id: detalle.idProducto,
                        idDetalle: detalle.idDetalle,
                        nombre: detalle.modelo,
                        precio: Number(detalle.precio),
                        imagen: detalle.imagen
                            || imagenesProductos[String(detalle.idProducto)]
                            || "",
                        talla: detalle.talla,
                        color: detalle.color,
                        cantidad: Number(detalle.cantidad)
                    };
                });

                // Obtener los datos del formulario
                const nombre =
                    document.getElementById("nombreCliente").value.trim();

                const telefono =
                    document.getElementById("telefonoCliente").value.trim();

                const correo =
                    document.getElementById("correoCliente").value.trim();

                const departamento =
                    document.getElementById("departamentoCliente").value;

                const direccion =
                    document.getElementById("direccionCliente").value.trim();

                const referencia =
                    document.getElementById("referenciaCliente").value.trim();

                const opcionPago = document.querySelector(
                    'input[name="metodoPagoCheckout"]:checked'
                );

                if (!opcionPago) {
                    alert("Selecciona un método de pago.");
                    return;
                }

                // Enviar la compra al controlador de Spring Boot
                const respuestaCompra = await fetch(
                    "/ventas-web/comprar/" + ID_USUARIO,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            direccion: direccion,
                            departamento: departamento,
                            referencia: referencia,
                            metodoPago: opcionPago.value
                        })
                    }
                );

                const resultado = await procesarRespuesta(respuestaCompra);

                // Solo llegamos aquí si Spring Boot registró la compra
                const subtotal = calcularSubtotal(productosPedido);
                const envio = subtotal > 0 ? COSTO_ENVIO : 0;

                const pedido = {
                    numero: "YUL-" + resultado.idVentaWeb,
                    idVentaWeb: resultado.idVentaWeb,
                    fecha: new Date().toISOString(),
                    nombre: nombre,
                    telefono: telefono,
                    correo: correo,
                    departamento: departamento,
                    direccion: direccion,
                    referencia: referencia,
                    metodoPago: opcionPago.value,
                    productos: productosPedido,
                    subtotal: subtotal,
                    envio: envio,
                    total: Number(resultado.total)
                };

                // Guardar los datos para mostrar la página de confirmación
                localStorage.setItem(
                    "pedidoConfirmado",
                    JSON.stringify(pedido)
                );

                // Ir a la confirmación después del registro real
                window.location.href = "/confirmacion";

            } catch (error) {
                mostrarError(error);

            } finally {
                if (botonConfirmar) {
                    botonConfirmar.disabled = false;
                    botonConfirmar.textContent = "Realizar Pedido";
                }
            }
        });
    }

    // ============================================
    // 15. MOSTRAR LA CONFIRMACIÓN DEL PEDIDO
    // ============================================

    function renderizarConfirmacion() {
        const numeroPedido = document.getElementById("numeroPedido");

        if (!numeroPedido) {
            return;
        }

        const pedidoGuardado = localStorage.getItem("pedidoConfirmado");

        if (!pedidoGuardado) {
            numeroPedido.textContent = "---";
            return;
        }

        try {
            const pedido = JSON.parse(pedidoGuardado);

            numeroPedido.textContent = "#" + pedido.numero;

            const contenedorProductos =
                document.getElementById("productosConfirmacion");

            if (contenedorProductos) {
                contenedorProductos.innerHTML = pedido.productos.map(
                    function (producto) {
                        const nombre = escaparHTML(producto.nombre);
                        const imagen = escaparHTML(producto.imagen);
                        const talla = escaparHTML(producto.talla);

                        return `
                            <div class="list-group-item d-flex justify-content-between align-items-center bg-transparent px-0 py-3">

                                <div class="d-flex align-items-center">

                                    ${imagen
                                ? `<img src="${imagen}"
                                                   class="rounded me-3"
                                                   style="width: 65px; height: 65px; object-fit: cover;"
                                                   alt="${nombre}">`
                                : ""
                            }

                                    <div>
                                        <h6 class="mb-1 fw-semibold">
                                            ${nombre}
                                        </h6>

                                        <small class="text-muted d-block">
                                            Talla: ${talla}
                                        </small>

                                        <small class="text-muted d-block">
                                            Color: ${escaparHTML(producto.color || "No especificado")}
                                        </small>

                                        <small class="text-muted">
                                            Cantidad: ${producto.cantidad}
                                        </small>
                                    </div>
                                </div>

                                <span class="fw-bold fs-6">
                                    ${formatearPrecio(
                                producto.precio * producto.cantidad
                            )}
                                </span>
                            </div>
                        `;
                    }
                ).join("");
            }

            const subtotalElemento =
                document.getElementById("subtotalConfirmacion");
            const envioElemento =
                document.getElementById("envioConfirmacion");
            const totalElemento =
                document.getElementById("totalConfirmacion");
            const datosCliente =
                document.getElementById("datosCliente");
            const direccionEntrega =
                document.getElementById("direccionEntrega");
            const metodoPago =
                document.getElementById("metodoPagoConfirmacion");

            if (subtotalElemento) {
                subtotalElemento.textContent =
                    formatearPrecio(pedido.subtotal);
            }

            if (envioElemento) {
                envioElemento.textContent = formatearPrecio(pedido.envio);
            }

            if (totalElemento) {
                totalElemento.textContent = formatearPrecio(pedido.total);
            }

            if (datosCliente) {
                datosCliente.textContent =
                    pedido.nombre + " — " + pedido.telefono;
            }

            if (direccionEntrega) {
                direccionEntrega.textContent =
                    pedido.direccion + ", " + pedido.departamento;
            }

            if (metodoPago) {
                metodoPago.textContent = pedido.metodoPago;
            }

        } catch (error) {
            console.error("No se pudo mostrar la confirmación:", error);
            numeroPedido.textContent = "---";
        }
    }

    // ============================================
    // 16. INICIAR LA PÁGINA
    // ============================================

    renderizarConfirmacion();
    cargarCarrito();

});