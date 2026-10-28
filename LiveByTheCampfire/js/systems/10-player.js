const posSpawnSeco = encontrarTierraSeca(0, 0);
let alturaSpawn = obtenerAlturaTerreno(posSpawnSeco.x, posSpawnSeco.z) + 4.0;
controles.getObject().position.set(posSpawnSeco.x, alturaSpawn, posSpawnSeco.z);
actualizarSectoresTerreno(posSpawnSeco.x, posSpawnSeco.z, true);

const teclas = {};
const jugador = {
    velocidadY: 0,
    velocidadMov: 0.08,
    velocidadSprintMultiplicador: 1.8,
    fuerzaSalto: 0.16,
    // NATACIÓN 
    nadando: false,
    sumergido: false,
    velocidadNado: 0.045,
    velocidadNadoSprint: 0.075,
    velocidadVerticalAgua: 0.035,
    gravedadAgua: 0.0010,
    flotacionAgua: 0.0025,
    gravedad: 0.009,
    enSuelo: false,
    ancho: 0.3,
    alturaOjos: 1.2,
    alturaOjosNormal: 1.2,
    alturaOjosAgachado: 0.72,
    alturaObjetivo: 1.2,
    velocidadAgachado: 0.5,
    estaAgachado: false,
    modoEspectador: false,
    bobbingY: 0,
    // SISTEMA DE VIDA Y HAMBRE
    vidaMaxima: 100,
    vidaActual: 100,
    estaMuerto: false,
    hambreMaxima: 100,
    hambreActual: 100,
    // SISTEMA DE OXIGENO
    oxigenoMaximo: 100,
    oxigenoActual: 100,
    // MODIFICACIÓN: CONTROL DE ALTURAS PARA DAÑO POR CAÍDA
    alturaMaximaCaida: alturaSpawn,
    estabaEnSuelo: true
};

let juegoCargado = false;
setTimeout(() => { juegoCargado = true; }, 500);

let ultimoTiempoW = 0;
let tiempoEnAgua = 0;
let sprintActivoPorDobleToque = false;
let tiempoBobbing = 0;

let FOV_BASE = 100;
let FOV_CORRER = 113;

let fovReducido = false;

let fovBaseNormal = FOV_BASE;
let fovCorrerNormal = FOV_CORRER;

let ZOOM_ESCALA = 5;

const ESCALAS_ZOOM = [2, 3, 4];

function establecerEscalaZoom(escala) {

    if (!ESCALAS_ZOOM.includes(escala)) {
        console.warn(`Escala de zoom inválida (${escala}). Se utilizará la escala 2.`);
        ZOOM_ESCALA = 2;
    } else {
        ZOOM_ESCALA = escala;
    }

    if (fovReducido) {
        FOV_BASE = fovBaseNormal / ZOOM_ESCALA;
        FOV_CORRER = fovCorrerNormal / ZOOM_ESCALA;
    }
}

function actualizarBotonZoomTactil() {
    const boton = document.getElementById('boton-zoom-tactil');
    if (!boton) return;
    boton.textContent = fovReducido ? '1×' : '🔍';
    boton.setAttribute('aria-label', fovReducido ? 'Quitar zoom' : 'Activar zoom');
}

function alternarZoom() {
    if (!ESCALAS_ZOOM.includes(ZOOM_ESCALA)) ZOOM_ESCALA = 2;
    fovReducido = !fovReducido;

    if (fovReducido) {
        fovBaseNormal = FOV_BASE;
        fovCorrerNormal = FOV_CORRER;
        FOV_BASE = fovBaseNormal / ZOOM_ESCALA;
        FOV_CORRER = fovCorrerNormal / ZOOM_ESCALA;
    } else {
        FOV_BASE = fovBaseNormal;
        FOV_CORRER = fovCorrerNormal;
    }
    actualizarBotonZoomTactil();
}

function actualizarBotonPantallaCompleta() {
    const boton = document.getElementById('boton-pantalla-completa-tactil');
    if (!boton) return;
    const pantallaCompleta = Boolean(
        document.fullscreenElement
        || document.webkitFullscreenElement
        || window.matchMedia('(display-mode: fullscreen)').matches
    );
    const appInstalada = navigator.standalone === true
        || window.matchMedia('(display-mode: standalone)').matches;
    boton.textContent = pantallaCompleta ? '↙' : (appInstalada ? '✓' : '⛶');
    boton.setAttribute('aria-label', pantallaCompleta
        ? 'Salir de pantalla completa'
        : (appInstalada ? 'Juego abierto como app' : 'Entrar en pantalla completa'));
}

function mostrarMensajePantallaCompleta(mensaje) {
    const elemento = document.getElementById('mensaje-pantalla-completa');
    if (!elemento) return;
    elemento.textContent = mensaje;
    elemento.classList.add('visible');
    clearTimeout(elemento.temporizadorOcultar);
    elemento.temporizadorOcultar = setTimeout(() => elemento.classList.remove('visible'), 6000);
}

const consolaComandos = document.getElementById('consola-comandos');
const entradaComandos = document.getElementById('entrada-comandos');
let consolaComandosAbierta = false;

function cerrarConsolaComandos() {
    consolaComandosAbierta = false;
    consolaComandos.classList.remove('visible');
    consolaComandos.setAttribute('aria-hidden', 'true');
    entradaComandos.blur();
}

function ejecutarComandoJugador(comando) {
    const partes = comando.trim().split(/\s+/);
    if (partes.length !== 3 || partes[0].toLowerCase() !== 'tp') return;

    const x = Number(partes[1]);
    const z = Number(partes[2]);
    if (!Number.isInteger(x) || !Number.isInteger(z)) return;
    if (Math.abs(x) > tamañoMapa || Math.abs(z) > tamañoMapa) return;
    if (colaExtensionMapa) return;

    const altura = Math.max(obtenerAlturaTerreno(x, z) + 2.5, NIVEL_AGUA + 2.5);
    controles.getObject().position.set(x, altura, z);
    jugador.velocidadY = 0;
    jugador.enSuelo = false;
    jugador.estabaEnSuelo = false;
    jugador.alturaMaximaCaida = altura;
    actualizarSectoresTerreno(
        x,
        z,
        true,
        pollos.filter(pollo => pollo.vivo).map(pollo => pollo.grupo.position)
    );
}

entradaComandos.addEventListener('keydown', event => {
    event.stopPropagation();
    if (event.code === 'Enter') {
        event.preventDefault();
        ejecutarComandoJugador(entradaComandos.value);
        cerrarConsolaComandos();
    } else if (event.code === 'Escape') {
        event.preventDefault();
        cerrarConsolaComandos();
    }
});

async function alternarPantallaCompleta() {
    const elementoPantallaCompleta = document.fullscreenElement || document.webkitFullscreenElement;
    const salir = document.exitFullscreen || document.webkitExitFullscreen;
    const raiz = document.documentElement;
    const elementoEntrada = raiz.requestFullscreen || raiz.webkitRequestFullscreen
        ? raiz
        : document.body;
    const entrar = elementoEntrada.requestFullscreen || elementoEntrada.webkitRequestFullscreen;

    try {
        if (elementoPantallaCompleta) {
            if (salir) await salir.call(document);
            if (screen.orientation && typeof screen.orientation.unlock === 'function') {
                screen.orientation.unlock();
            }
            return;
        }

        if (navigator.standalone === true
            || window.matchMedia('(display-mode: standalone)').matches
            || window.matchMedia('(display-mode: fullscreen)').matches) {
            mostrarMensajePantallaCompleta('El juego ya está abierto como app y ocupa la pantalla disponible.');
            return;
        }

        if (!entrar) {
            const esIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            mostrarMensajePantallaCompleta(esIOS
                ? 'En iPhone o iPad, usa Compartir → Añadir a pantalla de inicio y abre el juego desde su icono para jugar a pantalla completa.'
                : 'Este navegador no permite activar pantalla completa para esta página.');
            return;
        }

        await entrar.call(elementoEntrada);
        if (screen.orientation && typeof screen.orientation.lock === 'function') {
            try {
                await screen.orientation.lock('landscape');
            } catch (_) {
                // Algunos navegadores no permiten bloquear la orientación aunque concedan pantalla completa.
            }
        }
    } catch (error) {
        console.warn('No se pudo cambiar a pantalla completa:', error);
        const esIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
            || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        mostrarMensajePantallaCompleta(esIOS
            ? 'En iPhone o iPad, añade el juego a la pantalla de inicio y ábrelo desde su icono para jugar a pantalla completa.'
            : 'El navegador no permitió cambiar a pantalla completa.');
    } finally {
        actualizarBotonPantallaCompleta();
    }
}

document.addEventListener('fullscreenchange', actualizarBotonPantallaCompleta);
document.addEventListener('webkitfullscreenchange', actualizarBotonPantallaCompleta);
actualizarBotonPantallaCompleta();

window.addEventListener('keydown', (e) => {

    if (consolaComandosAbierta) return;

    if (e.code === 'Enter' && !e.repeat && controles.isLocked && !inventarioAbierto) {
        e.preventDefault();
        Object.keys(teclas).forEach(tecla => { teclas[tecla] = false; });
        consolaComandosAbierta = true;
        consolaComandos.classList.add('visible');
        consolaComandos.setAttribute('aria-hidden', 'false');
        entradaComandos.value = '';
        entradaComandos.focus();
        return;
    }

    if (e.code === 'Escape') {
        if (inventarioAbierto) {
            cerrarInventario();
        } else if (pointerLockFallbackActivo && controles.isLocked) {
            controles.isLocked = false;
            juegoPausado = true;
            menuInicial.style.display = 'flex';
            if (!audioMusica.paused) {
                audioMusica.pause();
                musicaPausadaPorEscape = true;
            }
        }
        // El navegador solo permite recuperar el Pointer Lock con un clic del usuario.
        // Para reanudar, haz clic en el menú que aparece al pausar.
        return;
    }

    if (e.code === 'KeyE' && !e.repeat) {
    alternarInventario();
    return;
    }

    if (e.code === 'KeyF' && !e.repeat && controles.isLocked && !inventarioAbierto) {
        if (interactuarConFogata()) return;
        if (comerMusloCocidoSeleccionado()) return;
        if (!recogerMaderaDePila()) encenderFogataConMadera();
        return;
    }

    // Teclas provisionales para probar los climas.
    if (e.code === 'KeyR' && !e.repeat && controles.isLocked && !inventarioAbierto) {
        climaActual = climaActual === 'lluvia' ? 'despejado' : 'lluvia';
        return;
    }
    if (e.code === 'KeyT' && !e.repeat && controles.isLocked && !inventarioAbierto) {
        climaActual = climaActual === 'tormenta' ? 'despejado' : 'tormenta';
        return;
    }
    if (e.code === 'KeyN' && !e.repeat && controles.isLocked && !inventarioAbierto) {
        climaActual = climaActual === 'niebla' ? 'despejado' : 'niebla';
        return;
    }
    if (e.code === 'KeyB' && !e.repeat && controles.isLocked && !inventarioAbierto) {
        climaActual = climaActual === 'nublado' ? 'despejado' : 'nublado';
        return;
    }
    if (e.code === 'KeyG' && !e.repeat && controles.isLocked && !inventarioAbierto) {
        climaActual = climaActual === 'cubierto' ? 'despejado' : 'cubierto';
        return;
    }
    if (e.code === 'KeyH' && !e.repeat && controles.isLocked && !inventarioAbierto) {
        climaActual = climaActual === 'olaCalor' ? 'despejado' : 'olaCalor';
        return;
    }
    if (e.code === 'KeyY' && !e.repeat && controles.isLocked && !inventarioAbierto) {
        climaActual = climaActual === 'nevada' ? 'despejado' : 'nevada';
        return;
    }
    if (e.code === 'KeyK' && !e.repeat && controles.isLocked && !inventarioAbierto) {
        climaActual = climaActual === 'granizado' ? 'despejado' : 'granizado';
        return;
    }

    if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
        e.preventDefault();
    }

    if (e.code === 'KeyW' && !teclas['KeyW']) {

        const ahora = performance.now();

        if (ahora - ultimoTiempoW < 300) {
            sprintActivoPorDobleToque = true;
        }

        ultimoTiempoW = ahora;
    }

    if (e.code === 'KeyC' && !teclas['KeyC']) {
        alternarZoom();
    }

    teclas[e.code] = true;

    if (e.code === 'KeyL' && controles.isLocked) {

        jugador.modoEspectador = !jugador.modoEspectador;
        hudModo.style.display = jugador.modoEspectador ? 'block' : 'none';

    }

});

window.addEventListener('keyup', (e) => {

    teclas[e.code] = false;

    if (e.code === 'KeyW') {
        sprintActivoPorDobleToque = false;
    }

});
