document.addEventListener("DOMContentLoaded", () => {
    console.log("[ALTOMIX gastos.js] DOM listo");

    const formCompra = document.getElementById("formCompra");
    if (!formCompra) return;

    if (typeof Auth === "undefined") console.error("[ALTOMIX] Auth no definido. ¿Cargaste js/auth.js?");
    if (typeof Storage === "undefined") console.error("[ALTOMIX] Storage no definido. ¿Cargaste js/storage.js?");

    if (typeof Storage !== "undefined" && !Storage.disponible()) {
        alert("⚠️ El almacenamiento local está bloqueado.\n" +
              "Abre el proyecto con Live Server (http://localhost) para que se guarden los datos.");
    }

    const formaPagoSelect = document.getElementById("formaPagoCompra");
    const tarjetaContainer = document.getElementById("tarjetaContainerCompra");
    const tarjetaInput = document.getElementById("tarjetaCompra");

    if (!formaPagoSelect || !tarjetaContainer || !tarjetaInput) {
        console.error("[ALTOMIX gastos.js] Faltan elementos del formulario de tarjeta");
        return;
    }

    function toggleTarjeta() {
        const valor = formaPagoSelect.value;
        const usaTarjeta = (valor === "Credito" || valor === "Debito");
        tarjetaContainer.style.display = usaTarjeta ? "block" : "none";
        tarjetaInput.required = usaTarjeta;
        if (!usaTarjeta) tarjetaInput.value = "";
        console.log("[ALTOMIX gastos.js] toggleTarjeta →", valor, "| required:", tarjetaInput.required);
    }

    formaPagoSelect.addEventListener("change", toggleTarjeta);
    toggleTarjeta();

    formCompra.addEventListener("submit", (e) => {
        e.preventDefault();
        console.log("[ALTOMIX gastos.js] submit capturado");

        const documento = document.getElementById("tipoDocumento").value;
        const formaPago = formaPagoSelect.value;

        let tarjeta = null;
        if (formaPago === "Credito" || formaPago === "Debito") {
            tarjeta = tarjetaInput.value.trim();
            if (tarjeta === "") {
                alert("Por favor, indique con qué tarjeta fue pagada la compra");
                tarjetaInput.focus();
                return;
            }
        }

        const destino = document.getElementById("destinoCompra").value;
        let monto = parseFloat(document.getElementById("montoCompra").value);
        const descripcion = document.getElementById("descCompra").value.trim() || "Sin detalle";

        if (isNaN(monto) || monto <= 0) {
            alert("Ingrese un monto válido mayor a cero.");
            document.getElementById("montoCompra").focus();
            return;
        }
        monto = parseFloat(monto.toFixed(2));

        const sesion = (typeof Auth !== "undefined") ? Auth.sesionActual() : null;
        const nuevaCompra = {
            id: Date.now(),
            tipo: "compra",
            documento,
            formaPago,
            tarjeta,
            destino,
            monto,
            descripcion,
            usuario: sesion ? sesion.usuario : "—",
            fecha: obtenerFechaHoraActual()
        };

        const resultado = Storage.agregarMovimiento(nuevaCompra);
        if (resultado === null) return;

        formCompra.reset();
        document.getElementById("tipoDocumento").value = "Boleta";
        formaPagoSelect.value = "Efectivo";
        toggleTarjeta();
        document.getElementById("destinoCompra").value = "Negocio";

        const btn = formCompra.querySelector("button");
        const originalText = btn.textContent;
        btn.textContent = "✓ Compra registrada";
        setTimeout(() => btn.textContent = originalText, 1500);

        console.log("[ALTOMIX gastos.js] compra registrada");
    });
});