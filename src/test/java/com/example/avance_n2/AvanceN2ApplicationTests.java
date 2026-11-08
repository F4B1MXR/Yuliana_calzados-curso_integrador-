package com.example.avance_n2;

import com.example.avance_n2.models.SesionUsuario;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AvanceN2ApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void contextLoads() {
	}

	@Test
	void sellerAccountLinkReturnsToSalesView() throws Exception {
		MockHttpSession session = new MockHttpSession();
		session.setAttribute(
			"usuarioSesion",
			new SesionUsuario(1, "vendedor@ejemplo.com", "Vendedor", "Vendedor")
		);

		mockMvc.perform(get("/index").session(session))
			.andExpect(status().isOk())
			.andExpect(content().string(containsString(
				"href=\"/ventas-fisicas\""
			)));
	}

	@Test
	void collectionExposesSignedInUserIdForCartRequests() throws Exception {
		MockHttpSession session = new MockHttpSession();
		session.setAttribute(
			"usuarioSesion",
			new SesionUsuario(42, "cliente@ejemplo.com", "Cliente", "Cliente")
		);

		mockMvc.perform(get("/coleccion").session(session))
			.andExpect(status().isOk())
			.andExpect(content().string(containsString(
				"data-id-usuario=\"42\""
			)));
	}

	@Test
	void registrationViewRendersClientFields() throws Exception {
		mockMvc.perform(get("/registro"))
			.andExpect(status().isOk())
			.andExpect(content().string(containsString("name=\"correo\"")))
			.andExpect(content().string(containsString("name=\"contrasena\"")))
			.andExpect(content().string(containsString("name=\"nombre\"")))
			.andExpect(content().string(containsString("name=\"apellido\"")))
			.andExpect(content().string(containsString("name=\"telefono\"")));
	}

	@Test
	void loginOffersRegistrationLink() throws Exception {
		mockMvc.perform(get("/login"))
			.andExpect(status().isOk())
			.andExpect(content().string(containsString("href=\"/registro\"")));
	}
}
