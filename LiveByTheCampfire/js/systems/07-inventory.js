const INVENTARIO_SLOTS = 27;
const HOTBAR_SLOTS = 9;
const MAX_ITEMS_POR_TIPO = 15;

let inventarioAbierto = false;

//! Por ahora están vacíos.
//! Más adelante acá van a vivir los items.

const inventario = new Array(INVENTARIO_SLOTS).fill(null);

const hotbar = new Array(HOTBAR_SLOTS).fill(null);

const inventarioOverlay =
    document.getElementById('inventario-overlay');

const inventarioSlots =
    document.getElementById('inventario-slots');

const inventarioHotbar =
    document.getElementById('inventario-hotbar');

function crearSlotInventario(indice, tipo) {
    const slot = document.createElement('div');
    slot.className = 'slot'; // Ajustado a .slot para coincidir con el CSS y selectores
    slot.dataset.index = indice;
    slot.dataset.tipo = tipo;

    // Escuchadores de arrastre fijos en la casilla
    slot.addEventListener('dragover', e => e.preventDefault());
    slot.addEventListener('drop', manejarDrop);
    slot.addEventListener('click', () => seleccionarSlotInventario(indice, tipo));

    return slot;
}

for (let i = 0; i < INVENTARIO_SLOTS; i++) {

    inventarioSlots.appendChild(
        crearSlotInventario(i, 'inventario')
    );

}


for (let i = 0; i < HOTBAR_SLOTS; i++) {

    inventarioHotbar.appendChild(
        crearSlotInventario(i, 'hotbar')
    );

}

function actualizarInventario() {
    const slots = inventarioSlots.querySelectorAll('.slot');
    slots.forEach((slot, indice) => {
        actualizarSlotVisual(slot, inventario[indice], 'inventario', indice);
    });

    const slotsHotbar = inventarioHotbar.querySelectorAll('.slot');
    slotsHotbar.forEach((slot, indice) => {
        actualizarSlotVisual(slot, hotbar[indice], 'hotbar', indice);
    });

    // LÍNEA AÑADIDA:
    actualizarHotbarHUD();
}

function obtenerIconoItem(item) {
    if (item.id === 'Madera') {
        return '<img class="icono-item-imagen" src="img/tronco-hotbar.png" alt="Madera">';
    }
    if (item.id === 'Muslo') {
        return '<img class="icono-item-imagen icono-muslo" src="img/muslo-sprite.png" alt="Muslo">';
    }
    if (item.id === 'MusloCocido') {
        return '<img class="icono-item-imagen icono-muslo" src="img/muslo-cocido-sprite.png" alt="Muslo de pollo cocido">';
    }
    return item.icono;
}

function actualizarSlotVisual(element, item, tipo, index) {
    element.innerHTML = '';
    element.dataset.tipo = tipo;
    element.dataset.index = index;

    if (item) {
        element.draggable = !dispositivoTactil;
        element.innerHTML = `<div class="inventario-item">${obtenerIconoItem(item)}</div><div class="inventario-cantidad">${item.cantidad}</div>`;
        element.ondragstart = dispositivoTactil ? null : manejarDragStart;
    } else {
        element.draggable = false;
        element.ondragstart = null;
    }
}

let slotOrigen = null;

function manejarDragStart(e) {
    const slot = e.currentTarget;
    slotOrigen = {
        tipo: slot.dataset.tipo,
        index: parseInt(slot.dataset.index)
    };

    e.dataTransfer.setData('text/plain', ''); // Requerido para activar Drag in HTML5
}

function manejarDrop(e) {
    e.preventDefault();
    if (!slotOrigen) return;

    // e.currentTarget garantiza obtener la casilla (.slot) y no el elemento hijo
    const casillaDestino = e.currentTarget;

    const slotDestino = {
        tipo: casillaDestino.dataset.tipo,
        index: parseInt(casillaDestino.dataset.index)
    };

    // Si se suelta en la misma casilla de origen, no hace nada
    if (slotOrigen.tipo === slotDestino.tipo && slotOrigen.index === slotDestino.index) {
        return;
    }

    // Obtener los arrays correspondientes
    const arrayOrigen = slotOrigen.tipo === 'hotbar' ? hotbar : inventario;
    const arrayDestino = slotDestino.tipo === 'hotbar' ? hotbar : inventario;

    // Intercambio de ítems (funciona si la casilla destino está vacía o tiene otro ítem)
    const temp = arrayOrigen[slotOrigen.index];
    arrayOrigen[slotOrigen.index] = arrayDestino[slotDestino.index];
    arrayDestino[slotDestino.index] = temp;

    // Limpiar variable y redibujar
    slotOrigen = null;
    actualizarInventario();
}

//? Ej agregarItemAlInventario('Madera', '🪵', 15);

function agregarItemAlInventario(id, icono, cantidad = 1) {
    const cantidadExistente = [...hotbar, ...inventario]
        .reduce((total, item) => total + (item && item.id === id ? item.cantidad : 0), 0);

    if (cantidadExistente >= MAX_ITEMS_POR_TIPO) {
        return false;
    }

    // No permite superar el máximo total para este tipo de ítem.
    cantidad = Math.min(cantidad, MAX_ITEMS_POR_TIPO - cantidadExistente);

    // Busca si ya existe en la Hotbar para apilarlo
    for (let i = 0; i < hotbar.length; i++) {
        if (hotbar[i] && hotbar[i].id === id) {
            hotbar[i].cantidad += cantidad;
            actualizarInventario();
            return true;
        }
    }
    // Si no existe, busca un slot libre en la Hotbar
    for (let i = 0; i < hotbar.length; i++) {
        if (!hotbar[i]) {
            hotbar[i] = { id: id, icono: icono, cantidad: cantidad };
            actualizarInventario();
            return true;
        }
    }

    // Si la Hotbar está llena, busca apilarlo en el Inventario principal
    for (let i = 0; i < inventario.length; i++) {
        if (inventario[i] && inventario[i].id === id) {
            inventario[i].cantidad += cantidad;
            actualizarInventario();
            return true;
        }
    }
    // Si no existe en el inventario, busca un slot libre en el Inventario
    for (let i = 0; i < inventario.length; i++) {
        if (!inventario[i]) {
            inventario[i] = { id: id, icono: icono, cantidad: cantidad };
            actualizarInventario();
            return true;
        }
    }

    console.warn("¡Inventario lleno! No se pudo añadir el ítem.");
    return false;
}

function actualizarProgresoFogataHUD() {
    const hud = document.getElementById('hud-progreso-fogata');
    if (!hud) return;

    if (nivelFogata >= 3) {
        hud.textContent = 'Fogata nivel 3 · Máximo alcanzado';
        return;
    }

    const maderaNecesaria = nivelFogata === 1 ? 10 : 30;
    const estado = nivelFogata === 1 ? 'Apagada' : `Nivel ${nivelFogata}`;
    hud.textContent = `Fogata ${estado} · Próximo nivel: ${maderaAportadaFogata}/${maderaNecesaria} madera`;
}

actualizarProgresoFogataHUD();

function encenderFogataConMadera() {
    const posicionJugador = controles.getObject().position;
    const distanciaX = posicionJugador.x - fogata.position.x;
    const distanciaZ = posicionJugador.z - fogata.position.z;
    if (distanciaX * distanciaX + distanciaZ * distanciaZ > 4 * 4) return false;

    if (nivelFogata >= 3) return false;
    const maderaNecesaria = nivelFogata === 1 ? 10 : 30;
    const maderaRestante = maderaNecesaria - maderaAportadaFogata;

    const pilasMadera = [...hotbar, ...inventario].filter(item => item && item.id === 'Madera');
    const totalMadera = pilasMadera.reduce((total, item) => total + item.cantidad, 0);
    if (totalMadera <= 0) return false;
    const maderaPorAportar = Math.min(totalMadera, maderaRestante);
    const completaNivel = maderaPorAportar >= maderaRestante;

    // La primera mejora amplía el mapa inicial; la tercera lleva el mundo a su tamaño máximo.
    if (completaNivel && nivelFogata === 1) iniciarExtensionMapa();

    let maderaPorConsumir = maderaPorAportar;
    for (const contenedor of [hotbar, inventario]) {
        for (let i = 0; i < contenedor.length && maderaPorConsumir > 0; i++) {
            const item = contenedor[i];
            if (!item || item.id !== 'Madera') continue;

            const cantidadConsumida = Math.min(item.cantidad, maderaPorConsumir);
            item.cantidad -= cantidadConsumida;
            maderaPorConsumir -= cantidadConsumida;
            if (item.cantidad <= 0) contenedor[i] = null;
        }
    }

    maderaAportadaFogata += maderaPorAportar;
    if (completaNivel) {
        maderaAportadaFogata = 0;
        nivelFogata++;
        fogataEncendida = true;
        instBrasas.visible = true;
        instFuego.visible = true;
        instHumo.visible = true;
        luzFogata.visible = true;
        luzFogata.intensity = nivelFogata >= 3 ? 2.2 : 1.5;
        luzFogata.distance = nivelFogata >= 3 ? 12 : 8;
        if (nivelFogata === 3) iniciarExtensionMapa(120);
    }
    actualizarProgresoFogataHUD();
    actualizarInventario();
    return true;

}

function limpiarSeleccionSlotsInventario() {
    document.querySelectorAll('#inventario .slot').forEach(slot => {
        slot.classList.remove('seleccionado');
    });
}

function seleccionarSlotInventario(indice, tipo) {
    const contenedor = tipo === 'inventario' ? inventarioSlots : inventarioHotbar;

    if (dispositivoTactil) {
        if (!slotOrigen) {
            limpiarSeleccionSlotsInventario();
            slotOrigen = { tipo, index: indice };
            contenedor.querySelectorAll('.slot')[indice]?.classList.add('seleccionado');
            return;
        }

        if (slotOrigen.tipo === tipo && slotOrigen.index === indice) {
            slotOrigen = null;
            limpiarSeleccionSlotsInventario();
            return;
        }

        const arrayOrigen = slotOrigen.tipo === 'hotbar' ? hotbar : inventario;
        const arrayDestino = tipo === 'hotbar' ? hotbar : inventario;
        const itemTemporal = arrayOrigen[slotOrigen.index];
        arrayOrigen[slotOrigen.index] = arrayDestino[indice];
        arrayDestino[indice] = itemTemporal;
        slotOrigen = null;
        limpiarSeleccionSlotsInventario();
        actualizarInventario();
        return;
    }

    limpiarSeleccionSlotsInventario();
    contenedor.querySelectorAll('.slot')[indice]?.classList.add('seleccionado');
}

function alternarInventario() {

    if (inventarioAbierto) {

        cerrarInventario();

    } else {

        abrirInventario();

    }

}


function abrirInventario() {

    inventarioAbierto = true;
    inventarioOverlay.classList.add('abierto');
    document.getElementById('hotbar-hud').classList.add('oculto');
    actualizarInventario();

    if (controles.isLocked) {
        if (dispositivoTactil) {
            controles.isLocked = false;
            document.body.classList.remove('juego-activo-tactil');
            liberarTeclasTactiles();
        } else if (pointerLockFallbackActivo) {
            controles.isLocked = false;
        } else {
            controles.unlock();
        }
    }

}

function cerrarInventario() {

    inventarioAbierto = false;
    slotOrigen = null;
    limpiarSeleccionSlotsInventario();
    inventarioOverlay.classList.remove('abierto');
    document.getElementById('hotbar-hud').classList.remove('oculto');

    if (!controles.isLocked) {
        if (dispositivoTactil && !juegoPausado) {
            activarJuegoTactil();
        } else if (!dispositivoTactil) {
            // El navegador exige un nuevo clic antes de volver a capturar el ratón.
            juegoPausado = true;
            menuInicial.style.display = 'flex';
            if (!audioMusica.paused) {
                audioMusica.pause();
                musicaPausadaPorEscape = true;
            }
        }
    }

}
