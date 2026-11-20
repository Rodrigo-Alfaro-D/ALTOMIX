const STORAGE_KEY = "altomix_movimientos_v1";

const Storage = {
    disponible() {
        try {
            const test = "__test__";
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },

    obtenerMovimientos() {
        if (!this.disponible()) return [];
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        try {
            const data = JSON.parse(stored);
            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.error("Error al leer localStorage:", e);
            return [];
        }
    },

    guardarMovimientos(movimientos) {
        if (!this.disponible()) {
            alert("⚠️ Tu navegador está bloqueando el almacenamiento local.\n\n" +
                  "Abre el proyecto con Live Server (http://localhost) en lugar de doble clic.\n" +
                  "Los datos NO se guardarán entre páginas hasta que lo hagas.");
            return false;
        }
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(movimientos));
            return true;
        } catch (e) {
            console.error("Error al guardar:", e);
            alert("No se pudo guardar. Revisa la consola.");
            return false;
        }
    },

    agregarMovimiento(mov) {
        const movimientos = this.obtenerMovimientos();
        movimientos.push(mov);
        const ok = this.guardarMovimientos(movimientos);
        return ok ? movimientos : null;
    },

    eliminarMovimiento(id) {
        const movimientos = this.obtenerMovimientos().filter(m => m.id !== id);
        this.guardarMovimientos(movimientos);
        return movimientos;
    },

    limpiarTodo() {
        this.guardarMovimientos([]);
    },

    calcularTotales(movimientos) {
        let totalCompras = 0, totalVentas = 0;
        movimientos.forEach(m => {
            if (m.tipo === "compra") totalCompras += m.monto;
            else totalVentas += m.monto;
        });
        return { totalCompras, totalVentas, balance: totalVentas - totalCompras };
    }
};

function obtenerFechaHoraActual() {
    const ahora = new Date();
    const dia = String(ahora.getDate()).padStart(2, '0');
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const anio = ahora.getFullYear();
    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const segundos = String(ahora.getSeconds()).padStart(2, '0');
    return `${dia}/${mes}/${anio} ${horas}:${minutos}:${segundos}`;
}

function formatearMonto(monto) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency', currency: 'CLP', minimumFractionDigits: 0
    }).format(monto);
}

function parseFecha(fechaStr) {
    if (!fechaStr) return 0;
    const [fechaPart, horaPart] = fechaStr.split(' ');
    if (!horaPart) return 0;
    const [dia, mes, anio] = fechaPart.split('/');
    const [horas, minutos, segundos] = horaPart.split(':');
    return new Date(anio, mes - 1, dia, horas, minutos, segundos).getTime();
}

function ordenarPorFechaDesc(movimientos) {
    return [...movimientos].sort((a, b) => parseFecha(b.fecha) - parseFecha(a.fecha));
}