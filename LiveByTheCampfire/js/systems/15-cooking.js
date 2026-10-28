// --- COCINA EN LA FOGATA ---
const TIEMPO_COCINAR_FOGATA_NIVEL_2_MS = 52 * 1000;
const TIEMPO_COCINAR_FOGATA_NIVEL_3_MS = 47 * 1000;
const TIEMPO_QUEMAR_FOGATA_MS = 60 * 1000;
const MAX_PIEZAS_FOGATA = 7;
const RADIO_INTERACCION_FOGATA = 4;

// Cada receta define su tipo de alimento y el resultado que vuelve al inventario.
// Para añadir otros alimentos basta con registrar su id crudo y su id cocido.
const RECETAS_FOGATA = {
    Muslo: {
        idCocido: 'MusloCocido',
        nombre: 'pollo',
        maximo: MAX_PIEZAS_FOGATA
    }
};

let tandaCoccionFogata = null;
let piezasQuemadasPendientes = 0;

function jugadorEstaCercaFogata() {
    const posicionJugador = controles.getObject().position;
    const distanciaX = posicionJugador.x - fogata.position.x;
    const distanciaZ = posicionJugador.z - fogata.position.z;
    return distanciaX * distanciaX + distanciaZ * distanciaZ <= RADIO_INTERACCION_FOGATA ** 2;
}

function obtenerTiempoCoccionFogata() {
    if (!fogataEncendida || nivelFogata < 2) return null;
    return nivelFogata >= 3
        ? TIEMPO_COCINAR_FOGATA_NIVEL_3_MS
        : TIEMPO_COCINAR_FOGATA_NIVEL_2_MS;
}

function empezarCoccionFogata(itemCrudo, receta, ahora) {
    tandaCoccionFogata = {
        tipo: itemCrudo.id,
        receta,
        inicio: ahora,
        tiempoCoccion: obtenerTiempoCoccionFogata(),
        piezas: [],
        avisoListoMostrado: false
    };
}

function colocarMusloEnFogata(itemCrudo, ahora) {
    const receta = RECETAS_FOGATA[itemCrudo.id];
    if (!receta) return false;

    if (tandaCoccionFogata && tandaCoccionFogata.tipo !== itemCrudo.id) {
        mostrarAvisoGeneral('La fogata ya está cocinando otro alimento.');
        return true;
    }

    if (tandaCoccionFogata && tandaCoccionFogata.piezas.length >= receta.maximo) {
        mostrarAvisoGeneral(`La fogata puede cocinar hasta ${receta.maximo} muslos de pollo a la vez.`);
        return true;
    }

    if (!tandaCoccionFogata) {
        if (!fogataEncendida || nivelFogata < 2) {
            mostrarAvisoGeneral('La fogata está apagada. Necesitas mejorarla al nivel 2 para cocinar.');
            return true;
        }
        empezarCoccionFogata(itemCrudo, receta, ahora);
    }

    itemCrudo.cantidad--;
    if (itemCrudo.cantidad <= 0) hotbar[slotSeleccionado] = null;
    actualizarInventario();

    // Las piezas añadidas comparten el inicio de la tanda: una nueva pieza
    // termina al mismo tiempo que las que ya estaban cocinándose.
    tandaCoccionFogata.piezas.push({});
    piezasQuemadasPendientes = 0;
    return true;
}

function recogerMusloCocidoFogata() {
    if (!tandaCoccionFogata || tandaCoccionFogata.piezas.length === 0) return false;
    if (!agregarItemAlInventario(tandaCoccionFogata.receta.idCocido, '', 1)) {
        mostrarAvisoGeneral('No tienes espacio para recoger el muslo de pollo.');
        return true;
    }

    tandaCoccionFogata.piezas.shift();
    if (tandaCoccionFogata.piezas.length === 0) tandaCoccionFogata = null;
    return true;
}

function interactuarConFogata() {
    if (!jugadorEstaCercaFogata()) return false;

    const ahora = performance.now();
    actualizarCoccionFogata(ahora);

    // Primero recoge lo que ya está listo; así varias piezas se pueden retirar
    // de una en una aunque el jugador aún tenga muslos crudos en la hotbar.
    if (tandaCoccionFogata && ahora - tandaCoccionFogata.inicio >= tandaCoccionFogata.tiempoCoccion) {
        return recogerMusloCocidoFogata();
    }

    const itemSeleccionado = hotbar[slotSeleccionado];
    if (itemSeleccionado && RECETAS_FOGATA[itemSeleccionado.id]) {
        return colocarMusloEnFogata(itemSeleccionado, ahora);
    }

    if (piezasQuemadasPendientes > 0) {
        piezasQuemadasPendientes = 0;
        mostrarAvisoGeneral('Tu pollo se ha quemado.');
        return true;
    }

    return false;
}

function actualizarCoccionFogata(ahora = performance.now()) {
    if (!tandaCoccionFogata) return;

    const tiempoTranscurrido = ahora - tandaCoccionFogata.inicio;
    if (tiempoTranscurrido >= TIEMPO_QUEMAR_FOGATA_MS) {
        piezasQuemadasPendientes += tandaCoccionFogata.piezas.length;
        tandaCoccionFogata = null;
        return;
    }

    if (tiempoTranscurrido >= tandaCoccionFogata.tiempoCoccion) {
        if (!tandaCoccionFogata.avisoListoMostrado) {
            tandaCoccionFogata.avisoListoMostrado = true;
            mostrarAvisoGeneral('Tu muslo de pollo está listo.');
        }
    }
}

function comerMusloCocidoSeleccionado() {
    const item = hotbar[slotSeleccionado];
    if (!item || item.id !== 'MusloCocido') return false;

    if (jugador.hambreActual >= jugador.hambreMaxima) {
        mostrarAvisoGeneral('No tienes hambre.');
        return true;
    }

    item.cantidad--;
    if (item.cantidad <= 0) hotbar[slotSeleccionado] = null;
    jugador.hambreActual = Math.min(jugador.hambreMaxima, jugador.hambreActual + 30);
    actualizarInventario();
    actualizarHUDHambre();
    return true;
}
