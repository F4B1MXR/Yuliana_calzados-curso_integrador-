document.addEventListener("DOMContentLoaded", function () {
    const filtros = document.querySelectorAll(".filtro-categoria");
    const productos = document.querySelectorAll(".tarjeta-producto");

    filtros.forEach(function (filtro) {
        filtro.addEventListener("click", function () {
            const categoriaSeleccionada = filtro.dataset.categoria;

            productos.forEach(function (tarjeta) {
                const mostrarTodas = categoriaSeleccionada === "todas";
                tarjeta.classList.toggle(
                    "d-none",
                    !mostrarTodas
                        && tarjeta.dataset.categoria !== categoriaSeleccionada
                );
            });

            filtros.forEach(function (boton) {
                const seleccionado = boton === filtro;
                boton.classList.toggle("btn-dark", seleccionado);
                boton.classList.toggle("btn-outline-dark", !seleccionado);
                boton.classList.toggle("active", seleccionado);
            });
        });
    });
});
