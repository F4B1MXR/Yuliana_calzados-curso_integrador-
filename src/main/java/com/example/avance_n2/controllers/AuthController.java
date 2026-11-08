package com.example.avance_n2.controllers;

import com.example.avance_n2.models.RegistroClienteForm;
import com.example.avance_n2.models.SesionUsuario;
import com.example.avance_n2.services.AuthService;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/login")
    public String mostrarLogin(HttpSession session) {

        SesionUsuario usuario =
            (SesionUsuario) session.getAttribute("usuarioSesion");

        if (usuario != null) {
            return redirigirPorRol(usuario);
        }

        return "login";
    }

    @GetMapping("/registro")
    public String mostrarRegistro(HttpSession session, Model model) {
        SesionUsuario usuario =
            (SesionUsuario) session.getAttribute("usuarioSesion");

        if (usuario != null) {
            return redirigirPorRol(usuario);
        }

        model.addAttribute("registro", new RegistroClienteForm());
        return "registro";
    }

    @PostMapping("/registro")
    public String registrarCliente(
            @Valid @ModelAttribute("registro") RegistroClienteForm formulario,
            BindingResult resultado,
            HttpSession session) {

        SesionUsuario usuario =
            (SesionUsuario) session.getAttribute("usuarioSesion");
        if (usuario != null) {
            return redirigirPorRol(usuario);
        }

        if (resultado.hasErrors()) {
            return "registro";
        }

        try {
            authService.registrarCliente(formulario);
        } catch (AuthService.CorreoRegistradoException ex) {
            resultado.rejectValue(
                "correo",
                "correo.registrado",
                "Este correo ya tiene una cuenta"
            );
            return "registro";
        }

        return "redirect:/login?registered";
    }

    @PostMapping("/login")
    public String iniciarSesion(
            @RequestParam String correoUsu,
            @RequestParam String contrasenaUsu,
            HttpSession session) {

        SesionUsuario usuario =
            authService.autenticar(correoUsu, contrasenaUsu);

        if (usuario == null) {
            return "redirect:/login?error";
        }

        session.setAttribute("usuarioSesion", usuario);

        return redirigirPorRol(usuario);
    }

    @GetMapping("/logout")
    public String cerrarSesion(HttpSession session) {
        session.invalidate();
        return "redirect:/login?logout";
    }

    private String redirigirPorRol(SesionUsuario usuario) {

        if ("Administrador".equals(usuario.getRol())) {
            return "redirect:/admin";
        }

        if ("Vendedor".equals(usuario.getRol())) {
            return "redirect:/ventas-fisicas";
        }

        return "redirect:/index";
    }
}
