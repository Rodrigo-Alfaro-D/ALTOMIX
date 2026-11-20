document.addEventListener("DOMContentLoaded", () => {
    const tbody = document.getElementById("tbodyMovimientos");
    if (!tbody) return;

    let movimientos = Storage.obtenerMovimientos();

    // Migrar movimientos sin fecha
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
    const periodoInfo = document.getElementById("periodoInfo");

    let periodoActivo = "todos";
    let rangoActivo = { desde: null, hasta: null, etiqueta: "Todo el historial" };

    // ===== Filtros rápidos =====
    document.querySelectorAll(".filtro-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".filtro-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            periodoActivo = btn.dataset.periodo;
            calcularRangoPorPeriodo(periodoActivo);
            renderizar();
        });
    });

    function calcularRangoPorPeriodo(periodo) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (periodo === "todos") {
            rangoActivo = { desde: null, hasta: null, etiqueta: "Todo el historial" };
            filtroDesde.value = "";
            filtroHasta.value = "";
            return;
        }

        if (periodo === "diario") {
            rangoActivo = { desde: hoy.getTime(), hasta: hoy.getTime() + 86400000, etiqueta: "Hoy" };
        } else if (periodo === "semanal") {
            const desde = new Date(hoy.getTime() - 6 * 86400000);
            rangoActivo = { desde: desde.getTime(), hasta: hoy.getTime() + 86400000, etiqueta: "Últimos 7 días" };
        } else if (periodo === "mensual") {
            const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
            rangoActivo = {
                desde: desde.getTime(),
                hasta: hasta.getTime(),
                etiqueta: `Mes actual (${nombreMes(hoy.getMonth())} ${hoy.getFullYear()})`
            };
        } else if (periodo === "mes-anterior") {
            const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
            const hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            rangoActivo = {
                desde: desde.getTime(),
                hasta: hasta.getTime(),
                etiqueta: `Mes anterior (${nombreMes(desde.getMonth())} ${desde.getFullYear()})`
            };
        }

        // Sincronizar los inputs de fecha
        if (rangoActivo.desde !== null) {
            filtroDesde.value = aInputDate(new Date(rangoActivo.desde));
        }
        if (rangoActivo.hasta !== null) {
            // El input hasta es inclusivo: le restamos 1 día al límite
            filtroHasta.value = aInputDate(new Date(rangoActivo.hasta - 86400000));
        }
    }

    function nombreMes(idx) {
        return ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][idx];
    }

    function aInputDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    // ===== Filtros manuales =====
    filtroDesde?.addEventListener("change", () => {
        periodoActivo = "personalizado";
        marcarFiltroPersonalizado();
        renderizar();
    });
    filtroHasta?.addEventListener("change", () => {
        periodoActivo = "personalizado";
        marcarFiltroPersonalizado();
        renderizar();
    });

    function marcarFiltroPersonalizado() {
        document.querySelectorAll(".filtro-btn").forEach(b => b.classList.remove("active"));
        const desde = filtroDesde.value ? new Date(filtroDesde.value).getTime() : null;
        const hasta = filtroHasta.value ? new Date(filtroHasta.value).getTime() + 86400000 : null;
        rangoActivo = {
            desde,
            hasta,
            etiqueta: `Rango personalizado${desde ? " desde " + filtroDesde.value : ""}${hasta ? " hasta " + filtroHasta.value : ""}`
        };
    }

    // ===== Aplicar filtros =====
    function aplicarFiltros() {
        let lista = ordenarPorFechaDesc(movimientos);
        const tipo = filtroTipo?.value || "todos";
        if (tipo !== "todos") lista = lista.filter(m => m.tipo === tipo);

        if (rangoActivo.desde !== null) {
            lista = lista.filter(m => parseFecha(m.fecha) >= rangoActivo.desde);
        }
        if (rangoActivo.hasta !== null) {
            lista = lista.filter(m => parseFecha(m.fecha) < rangoActivo.hasta);
        }
        return lista;
    }

    // ===== Renderizar tabla =====
    function renderizar() {
        movimientos = Storage.obtenerMovimientos();
        const lista = aplicarFiltros();

        periodoInfo.innerText = `📌 Período: ${rangoActivo.etiqueta} — ${lista.length} movimiento(s)`;

        if (lista.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Sin movimientos en este período</td></tr>`;
            actualizarResumen(lista);
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

            row.insertCell(6).innerText = mov.usuario || '—';

            const montoCell = row.insertCell(7);
            montoCell.innerText = formatearMonto(mov.monto);
            montoCell.style.fontWeight = 'bold';
            montoCell.style.color = mov.tipo === 'compra' ? '#b91c1c' : '#15803d';

            const acc = row.insertCell(8);
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

        actualizarResumen(lista);
    }

    function actualizarResumen(lista) {
        const { totalCompras, totalVentas, balance } = Storage.calcularTotales(lista);
        document.getElementById("totalCompras").innerText = formatearMonto(totalCompras);
        document.getElementById("totalVentas").innerText = formatearMonto(totalVentas);
        const b = document.getElementById("balance");
        b.innerText = formatearMonto(balance);
        b.style.color = balance >= 0 ? "#2b7a62" : "#b91c1c";
        document.getElementById("cantidadMovs").innerText = lista.length;
    }

    // ===== Exportar a Excel =====
    document.getElementById("btnExportarExcel")?.addEventListener("click", () => {
        const lista = aplicarFiltros();
        if (lista.length === 0) {
            alert("No hay movimientos en el período seleccionado para exportar.");
            return;
        }

        const workbook = XLSX.utils.book_new();

        // ---- Hoja 1: Movimientos detallados ----
        const filas = lista.map(m => ({
            "Fecha/Hora": m.fecha || "",
            "Tipo": m.tipo === "compra" ? "COMPRA" : "VENTA",
            "Documento": m.tipo === "compra" ? (m.documento || "") : "",
            "Forma de pago": m.formaPago || "",
            "Tarjeta": m.tarjeta || "",
            "Destino/Concepto": m.tipo === "compra"
                ? `${m.destino || ""}${m.descripcion ? ` (${m.descripcion})` : ""}`
                : (m.concepto || ""),
            "Usuario": m.usuario || "",
            "Monto": m.monto,
            "Tipo Movimiento": m.tipo
        }));
        const wsDetalle = XLSX.utils.json_to_sheet(filas);
        wsDetalle["!cols"] = [
            { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 16 },
            { wch: 15 }, { wch: 35 }, { wch: 12 }, { wch: 14 }, { wch: 14 }
        ];
        XLSX.utils.book_append_sheet(workbook, wsDetalle, "Movimientos");

        // ---- Hoja 2: Resumen por período ----
        const { totalCompras, totalVentas, balance } = Storage.calcularTotales(lista);
        const filasResumen = [
            { "Concepto": "Período", "Valor": rangoActivo.etiqueta },
            { "Concepto": "Desde", "Valor": filtroDesde.value || "—" },
            { "Concepto": "Hasta", "Valor": filtroHasta.value || "—" },
            { "Concepto": "Cantidad de movimientos", "Valor": lista.length },
            { "Concepto": "Total Compras", "Valor": totalCompras },
            { "Concepto": "Total Ventas", "Valor": totalVentas },
            { "Concepto": "Balance (Ventas - Compras)", "Valor": balance },
            { "Concepto": "Generado por", "Valor": (Auth.sesionActual() || {}).usuario || "—" },
            { "Concepto": "Fecha de exportación", "Valor": obtenerFechaHoraActual() }
        ];
        const wsResumen = XLSX.utils.json_to_sheet(filasResumen);
        wsResumen["!cols"] = [{ wch: 30 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(workbook, wsResumen, "Resumen");

        // ---- Hoja 3: Resumen mensual (agrupado) ----
        const porMes = {};
        lista.forEach(m => {
            const fecha = m.fecha.split(" ")[0];
            const [dia, mes, anio] = fecha.split("/");
            const clave = `${anio}-${mes}`;
            if (!porMes[clave]) {
                porMes[clave] = {
                    mes: `${nombreMes(parseInt(mes, 10) - 1)} ${anio}`,
                    compras: 0,
                    ventas: 0,
                    cantidad: 0
                };
            }
            if (m.tipo === "compra") porMes[clave].compras += m.monto;
            else porMes[clave].ventas += m.monto;
            porMes[clave].cantidad += 1;
        });
        const filasMes = Object.values(porMes)
            .sort((a, b) => a.mes.localeCompare(b.mes))
            .map(x => ({
                "Mes": x.mes,
                "Cantidad": x.cantidad,
                "Compras": x.compras,
                "Ventas": x.ventas,
                "Balance": x.ventas - x.compras
            }));
        const wsMes = XLSX.utils.json_to_sheet(filasMes);
        wsMes["!cols"] = [{ wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
        XLSX.utils.book_append_sheet(workbook, wsMes, "Resumen Mensual");

        // ---- Nombre del archivo ----
        const sufijo = periodoActivo === "todos" ? "historial" :
                      periodoActivo === "personalizado" ? "rango" : periodoActivo;
        const nombreArchivo = `ALTOMIX_Informe_${sufijo}_${aInputDate(new Date())}.xlsx`;

        XLSX.writeFile(workbook, nombreArchivo);
        console.log("[ALTOMIX] Excel exportado:", nombreArchivo);
    });

    // ===== Limpiar todo =====
    document.getElementById("limpiarTodoBtn")?.addEventListener("click", () => {
        if (confirm("¿Eliminar TODOS los registros de compras y ventas de ALTOMIX?")) {
            Storage.limpiarTodo();
            movimientos = [];
            renderizar();
        }
    });

    // ===== Refresco al volver a la pestaña =====
    window.addEventListener("focus", () => renderizar());

    // ===== Estado inicial =====
    calcularRangoPorPeriodo("todos");
    renderizar();
});
