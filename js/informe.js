document.addEventListener("DOMContentLoaded", () => {
    const tbody = document.getElementById("tbodyMovimientos");
    if (!tbody) return;

    let movimientos = Storage.obtenerMovimientos();

    // Asegurar que cada movimiento tenga fecha
    let actualizado = false;
    movimientos = movimientos.map(m => {
        if (!m.fecha) {
            actualizado = true;
            return { ...m, fecha: obtenerFechaHoraActual() };
        }
        return m;
    });
    if (actualizado) Storage.guardarMovimientos(movimientos);

    const filtroTipo = document.getElementById("filtroTipo");
    const filtroDesde = document.getElementById("filtroDesde");
    const filtroHasta = document.getElementById("filtroHasta");

    function aplicarFiltros() {
        let lista = ordenarPorFechaDesc(movimientos);
        const tipo = filtroTipo?.value || "todos";
        if (tipo !== "todos") lista = lista.filter(m => m.tipo === tipo);

        if (filtroDesde?.value) {
            const desde = new Date(filtroDesde.value).getTime();
            lista = lista.filter(m => parseFecha(m.fecha) >= desde);
        }
        if (filtroHasta?.value) {
            const hasta = new Date(filtroHasta.value).getTime() + 86400000;
            lista = lista.filter(m => parseFecha(m.fecha) <= hasta);
        }
        return lista;
    }

    function renderizar() {
        movimientos = Storage.obtenerMovimientos();

        const lista = aplicarFiltros();
        if (lista.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Sin movimientos registrados</td></tr>`;
            actualizarResumen();
            return;
        }
        tbody.innerHTML = "";
        lista.forEach(mov => {
            const row = tbody.insertRow();
            row.insertCell(0).innerText = mov.fecha || "Sin fecha";
            row.cells[0].className = "fecha-hora";

            const tipoCell = row.insertCell(1);
            const badge = document.createElement("span");
            badge.className = `badge ${mov.tipo === 'compra' ? 'tipo-compra' : 'tipo-venta'}`;
            badge.innerText = mov.tipo === 'compra' ? 'COMPRA' : 'VENTA';
            tipoCell.appendChild(badge);

            row.insertCell(2).innerText = mov.tipo === 'compra' ? (mov.documento || '—') : '—';
            row.insertCell(3).innerText = mov.formaPago || '—';
            row.insertCell(4).innerText = (mov.tarjeta && mov.tarjeta.trim()) ? mov.tarjeta : '—';

            const dc = row.insertCell(5);
            dc.innerText = mov.tipo === 'compra'
                ? `${mov.destino || '?'}${mov.descripcion ? ` (${mov.descripcion})` : ''}`
                : (mov.concepto || 'Venta registrada');

            const montoCell = row.insertCell(6);
            montoCell.innerText = formatearMonto(mov.monto);
            montoCell.style.fontWeight = 'bold';
            montoCell.style.color = mov.tipo === 'compra' ? '#b91c1c' : '#15803d';

            const acc = row.insertCell(7);
            const del = document.createElement("button");
            del.innerHTML = "[X]";
            del.className = "delete-btn";
            del.title = "Eliminar registro";
            del.addEventListener("click", () => {
                if (confirm("¿Eliminar este movimiento?")) {
                    movimientos = Storage.eliminarMovimiento(mov.id);
                    renderizar();
                }
            });
            acc.appendChild(del);
        });
        actualizarResumen();
    }

    function actualizarResumen() {
        const { totalCompras, totalVentas, balance } = Storage.calcularTotales(movimientos);
        document.getElementById("totalCompras").innerText = formatearMonto(totalCompras);
        document.getElementById("totalVentas").innerText = formatearMonto(totalVentas);
        const b = document.getElementById("balance");
        b.innerText = formatearMonto(balance);
        b.style.color = balance >= 0 ? "#2b7a62" : "#b91c1c";
    }

    filtroTipo?.addEventListener("change", renderizar);
    filtroDesde?.addEventListener("change", renderizar);
    filtroHasta?.addEventListener("change", renderizar);

    document.getElementById("limpiarTodoBtn")?.addEventListener("click", () => {
        if (confirm("¿Eliminar TODOS los registros de compras y ventas de ALTOMIX?")) {
            Storage.limpiarTodo();
            movimientos = [];
            renderizar();
        }
    });

    window.addEventListener("focus", () => renderizar());

    renderizar();
});