package com.example.avance_n2.controllers;

import com.example.avance_n2.models.Cliente;
import com.example.avance_n2.models.SesionUsuario;
import com.example.avance_n2.repository.ClienteRepository;

import jakarta.servlet.http.HttpSession;

import org.springframework.ui.Model;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller 
public class CarritoController {

    private final ClienteRepository clienteRepository;

    public CarritoController(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }
    
    @GetMapping("/carrito")
    public String carrito(){
        return "carrito";
    }

    @GetMapping("/checkout")
    public String checkout(HttpSession session, Model model){
        SesionUsuario usuario =
            (SesionUsuario) session.getAttribute("usuarioSesion");
        boolean clienteRegistrado = usuario != null
            && "Cliente".equals(usuario.getRol());

        model.addAttribute("clienteRegistrado", clienteRegistrado);
        model.addAttribute(
            "checkoutIdUsuario",
            usuario == null ? "" : usuario.getIdUsuario()
        );

        if (clienteRegistrado) {
            Cliente cliente = clienteRepository.findById(usuario.getIdUsuario())
                .orElseThrow(() ->
                    new IllegalStateException(
                        "La cuenta no tiene un perfil de cliente registrado"
                    )
                );
            String nombreCompleto = cliente.getNombreCli();
            if (cliente.getApellidoCli() != null
                    && !cliente.getApellidoCli().isBlank()) {
                nombreCompleto += " " + cliente.getApellidoCli().trim();
            }

            model.addAttribute("checkoutNombre", nombreCompleto);
            model.addAttribute("checkoutTelefono", cliente.getTelefonoCli());
            model.addAttribute(
                "checkoutCorreo",
                cliente.getUsuario().getCorreoUsu()
            );
        }

        return "checkout";
    }

    @GetMapping("/confirmacion")
    public String confirmacion(){
        return "confirmacion";
    }
}