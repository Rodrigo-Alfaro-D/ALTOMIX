// ===== Usuarios autorizados ALTOMIX =====
const USUARIOS_VALIDOS = [
    { usuario: "Julia",   clave: "J1234R" },
    { usuario: "Rodrigo", clave: "J1234R" }
];

const SESSION_KEY = "altomix_sesion";

const Auth = {
    login(usuario, clave) {
        const u = USUARIOS_VALIDOS.find(
            x => x.usuario.toLowerCase() === usuario.trim().toLowerCase()
            && x.clave === clave
        );
        if (u) {
            const sesion = {
                usuario: u.usuario,
                inicio: new Date().toISOString()
            };
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
            return true;
        }
        return false;
    },

    sesionActual() {
        const data = sessionStorage.getItem(SESSION_KEY);
        if (!data) return null;
        try { return JSON.parse(data); } catch (e) { return null; }
    },

    estaAutenticado() {
        return this.sesionActual() !== null;
    },

    logout() {
        sessionStorage.removeItem(SESSION_KEY);
        window.location.href = "login.html";
    },

    protegerPagina() {
        if (!this.estaAutenticado()) {
            window.location.href = "login.html";
            return false;
        }
        return true;
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const s = Auth.sesionActual();
    const span = document.getElementById("usuarioActual");
    if (s && span) span.textContent = s.usuario;

    const btnLogout = document.getElementById("btnLogout");
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            if (confirm("¿Cerrar sesión?")) Auth.logout();
        });
    }
});