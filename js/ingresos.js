document.addEventListener("DOMContentLoaded", () => {
    console.log("[ALTOMIX ingresos.js] DOM listo");

    const formVenta = document.getElementById("formVenta");
    if (!formVenta) return;

    if (typeof Auth === "undefined") console.error("[ALTOMIX] Auth no definido. ¿Cargaste js/auth.js?");
    if (typeof Storage === "undefined") console.error("[ALTOMIX] Storage no definido. ¿Cargaste js/storage.js?");

    if (typeof Storage !== "undefined" && !Storage.disponible()) {
        alert("⚠️ El almacenamiento local está bloqueado.\n" +
              "Abre el proyecto con Live Server (http://localhost) para que se guarden los datos.");
    }

    formVenta.addEventListener("submit", (e) => {
        e.preventDefault();
        console.log("[ALTOMIX ingresos.js] submit capturado");

        const formaPago = document.getElementById("formaPagoVenta").value;
        const concepto = document.getElementById("conceptoVenta").value.trim();
        let monto = parseFloat(document.getElementById("montoVenta").value);

        if (!concepto) {
            alert("Por favor ingrese un concepto o producto vendido.");
            document.getElementById("conceptoVenta").focus();
            return;
        }
        if (isNaN(monto) || monto <= 0) {
            alert("Ingrese un monto de venta válido.");
            document.getElementById("montoVenta").focus();
            return;
        }
        monto = parseFloat(monto.toFixed(2));

        const sesion = (typeof Auth !== "undefined") ? Auth.sesionActual() : null;
        const nuevaVenta = {
            id: Date.now(),
            tipo: "venta",
            formaPago,
            concepto,
            monto,
            tarjeta: null,
            usuario: sesion ? sesion.usuario : "—",
            fecha: obtenerFechaHoraActual()
        };

        const resultado = Storage.agregarMovimiento(nuevaVenta);
        if (resultado === null) return;

        formVenta.reset();
        document.getElementById("formaPagoVenta").value = "Efectivo";

        const btn = formVenta.querySelector("button");
        const originalText = btn.textContent;
        btn.textContent = "✓ Venta registrada";
        setTimeout(() => btn.textContent = originalText, 1500);

        console.log("[ALTOMIX ingresos.js] venta registrada");
    });
});