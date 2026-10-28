// --- 6. PARÁMETROS DEL JUGADOR ---
const menuInicial = document.getElementById('bloqueo-pantalla');

// Música ambiental: pistas al azar y pausas aleatorias entre canciones.
let musicaActiva = true;
// Este script está en js/systems/; subimos dos niveles hasta music/ en la raíz.
const carpetaMusica = new URL('../../music/', document.currentScript.src);
const listaMusica = ['1.ogg', '2.ogg', '3.ogg', '4.ogg', '5.ogg', '6.ogg'];
const nombresCanciones = [
    'Hogar del sendero',
    'Cielo de cristal',
    'Luz entre árboles',
    'Mapa de luciérnagas',
    'Viento entre pinos',
    'Día de aventura'
];
let ultimaCancion = -1;
let musicaIniciada = false;
let primeraCancionReproducida = false;
let musicaPausadaPorEscape = false;
let temporizadorMusica = null;
const audioMusica = new Audio();
audioMusica.volume = 0.38;
audioMusica.addEventListener('error', () => {
    console.error('No se pudo cargar la pista:', audioMusica.currentSrc, audioMusica.error);
});

const audioAvisoTelefono = new Audio(new URL('aviso.ogg', carpetaMusica).href);
audioAvisoTelefono.preload = 'auto';
audioAvisoTelefono.volume = 0.25;

const audioLluvia = new Audio(new URL('rain.ogg', carpetaMusica).href);
audioLluvia.loop = true;
audioLluvia.preload = 'auto';
audioLluvia.volume = 0.035;
let audioLluviaSolicitado = false;
audioLluvia.addEventListener('error', () => {
    console.error('No se pudo cargar el sonido de lluvia:', audioLluvia.currentSrc, audioLluvia.error);
});

const audioTruenos = new Audio(new URL('truenos.ogg', carpetaMusica).href);
audioTruenos.preload = 'auto';
audioTruenos.volume = 0.3;

function reproducirTrueno() {
    audioTruenos.currentTime = 0;
    audioTruenos.play().catch(error => {
        console.warn('No se pudo reproducir el sonido de trueno:', audioTruenos.currentSrc, error);
    });
}

const audioRayo = new Audio(new URL('rayo.ogg', carpetaMusica).href);
audioRayo.preload = 'auto';
audioRayo.volume = 0.3;

function reproducirSonidoRayo() {
    audioRayo.currentTime = 0;
    audioRayo.play().catch(error => {
        console.warn('No se pudo reproducir el sonido del rayo:', audioRayo.currentSrc, error);
    });
}

function actualizarAudioLluvia() {
    const intensidadLluvia = obtenerIntensidadLluviaVisual();
    const debeReproducirse = !juegoPausado
        && intensidadLluvia > 0.001;
    if (debeReproducirse !== audioLluviaSolicitado) {
        audioLluviaSolicitado = debeReproducirse;
        if (debeReproducirse) {
            audioLluvia.play().catch(error => {
                console.warn('No se pudo reproducir el sonido de lluvia:', error);
            });
        } else {
            audioLluvia.pause();
            audioLluvia.currentTime = 0;
        }
    }
    audioLluvia.volume = 0.035 * intensidadLluvia;
}

function reproducirSiguienteMusica() {
    const opciones = listaMusica.map((_, indice) => indice).filter(indice =>
        indice !== ultimaCancion
        && (primeraCancionReproducida || ![ '1.ogg', '4.ogg', '6.ogg'].includes(listaMusica[indice]))
    );

    ultimaCancion = opciones[Math.floor(Math.random() * opciones.length)];
    audioMusica.src = new URL(listaMusica[ultimaCancion], carpetaMusica).href;
    musicaIniciada = true;
    audioMusica.play().then(() => {
        primeraCancionReproducida = true;
        console.log('Canción reproducida con éxito:', listaMusica[ultimaCancion]);
    }).catch(error => {
        musicaIniciada = false;
        console.warn('No se pudo reproducir la música:', audioMusica.currentSrc, error);
    });
}

function programarSiguienteMusica() {
    if (!musicaActiva || temporizadorMusica !== null) return;
    const esperaMinima = 90 * 1000;
    const esperaMaxima = 5 * 60 * 1000;
    const espera = Math.floor(esperaMinima + Math.random() * (esperaMaxima - esperaMinima + 1));
    temporizadorMusica = setTimeout(() => {
        temporizadorMusica = null;
        reproducirSiguienteMusica();
    }, espera);
}

audioMusica.addEventListener('ended', programarSiguienteMusica);

function actualizarBotonMusicaTactil() {
    const boton = document.getElementById('boton-musica-tactil');
    if (!boton) return;
    boton.textContent = musicaActiva ? '♫' : '🔇';
    boton.setAttribute('aria-label', musicaActiva ? 'Desactivar música' : 'Activar música');
}

function reanudarMusicaPausada() {
    if (!musicaActiva || !musicaPausadaPorEscape) return;
    musicaPausadaPorEscape = false;
    if (!musicaIniciada || audioMusica.ended || !audioMusica.src) {
        reproducirSiguienteMusica();
        return;
    }
    audioMusica.play().catch(error => {
        console.warn('No se pudo reanudar la música:', audioMusica.currentSrc, error);
    });
}

function alternarMusicaTactil() {
    musicaActiva = !musicaActiva;
    if (!musicaActiva) {
        if (temporizadorMusica !== null) {
            clearTimeout(temporizadorMusica);
            temporizadorMusica = null;
        }
        audioMusica.pause();
        musicaPausadaPorEscape = false;
    } else if (juegoPausado || inventarioAbierto) {
        musicaPausadaPorEscape = true;
    } else if (!musicaIniciada || audioMusica.ended) {
        reproducirSiguienteMusica();
    } else {
        audioMusica.play().catch(error => {
            console.warn('No se pudo reanudar la música:', audioMusica.currentSrc, error);
        });
    }
    actualizarBotonMusicaTactil();
}

actualizarBotonMusicaTactil();

document.addEventListener('keydown', event => {
    if (event.key.toLowerCase() !== 'ñ' || event.repeat || !musicaActiva) return;
    musicaActiva = false;
    if (temporizadorMusica !== null) {
        clearTimeout(temporizadorMusica);
        temporizadorMusica = null;
    }
    audioMusica.pause();
    musicaPausadaPorEscape = false;
    actualizarBotonMusicaTactil();
    console.log('Música desactivada con la tecla ñ');
});
const fpsElemento = document.getElementById('fps-counter');
const hudModo = document.getElementById('hud-modo');
const contenedorOxigeno = document.querySelector('.contenedor-oxigeno');

const controles = new THREE.PointerLockControls(camera, document.body);
const raycasterInteraccion = new THREE.Raycaster();
const centroPantalla = new THREE.Vector2(0, 0);
const avisoTelefono = document.getElementById('aviso-telefono');
let temporizadorAvisoTelefono = null;

function mostrarAvisoGeneral(mensaje) {
    if (!avisoTelefono) return;
    const textoAviso = document.getElementById('texto-aviso');
    if (textoAviso) textoAviso.textContent = mensaje;
    avisoTelefono.classList.add('visible');
    avisoTelefono.setAttribute('aria-hidden', 'false');
    audioAvisoTelefono.currentTime = 0;
    audioAvisoTelefono.play().catch(error => {
        console.warn('No se pudo reproducir el aviso del teléfono:', error);
    });
    clearTimeout(temporizadorAvisoTelefono);
    temporizadorAvisoTelefono = setTimeout(() => {
        avisoTelefono.classList.remove('visible');
        avisoTelefono.setAttribute('aria-hidden', 'true');
    }, 2800);
}

function mostrarAvisoTelefono() {
    mostrarAvisoGeneral('No deberías revisar ese teléfono.');
}

function interactuarConObjetivoEnMira() {
    raycasterInteraccion.setFromCamera(centroPantalla, camera);
    const objetosInteractuables = pinosManuales
        .filter(pino => !pino.talado)
        .flatMap(pino => [pino.tronco, pino.copa]);
    if (celularCabanaInteractuable) objetosInteractuables.push(celularCabanaInteractuable);
    for (const pollo of pollos) {
        if (pollo.vivo) objetosInteractuables.push(...pollo.grupo.children);
    }
    const impacto = raycasterInteraccion.intersectObjects(
        objetosInteractuables,
        false
    )[0];
    if (!impacto || impacto.distance > 5) return false;

    if (impacto.object === celularCabanaInteractuable) {
        const posicionCelular = celularCabanaInteractuable.getWorldPosition(new THREE.Vector3());
        const posicionJugador = controles.getObject().position;
        if (Math.hypot(posicionJugador.x - posicionCelular.x, posicionJugador.z - posicionCelular.z) <= 3.5) {
            mostrarAvisoTelefono();
        }
        return true;
    }

    const polloGolpeado = pollos.find(pollo => pollo.vivo && impacto.object.parent === pollo.grupo);
    if (polloGolpeado) {
        polloGolpeado.golpes++;
        polloGolpeado.saltoVelocidad = Math.max(polloGolpeado.saltoVelocidad, 2.1);
        emitirParticulasGolpe('pluma', impacto.point, 2 + Math.floor(Math.random() * 2));
        if (polloGolpeado.golpes >= 7) {
            polloGolpeado.vivo = false;
            scene.remove(polloGolpeado.grupo);
            agregarItemAlInventario('Muslo', '', 1 + Math.floor(Math.random() * 2));
        }
        return true;
    }

    const pinoGolpeado = pinosManuales.find(pino =>
        pino.tronco === impacto.object || pino.copa === impacto.object
    );
    if (!pinoGolpeado) return false;

    pinoGolpeado.golpes++;
    pinoGolpeado.sacudida = 0.38;
    emitirParticulasGolpe('hoja', impacto.point, 3 + Math.floor(Math.random() * 2));
    if (pinoGolpeado.golpes >= GOLPES_PARA_TALAR_PINO) {
        pinoGolpeado.talado = true;
        scene.remove(pinoGolpeado.tronco, pinoGolpeado.copa);
        agregarItemAlInventario('Madera', '🪵', 1);
    }
    return true;
}

function interactuarJugador() {
    if (!controles.isLocked || inventarioAbierto || juegoPausado) return false;
    if (interactuarConFogata()) return true;
    if (comerMusloCocidoSeleccionado()) return true;
    if (interactuarConObjetivoEnMira()) return true;
    // Cerca de la fogata primero consume la madera que ya tiene el jugador.
    if (encenderFogataConMadera()) return true;
    return recogerMaderaDePila();
}

document.addEventListener('mousedown', event => {
    if (event.button !== 0 || !controles.isLocked || inventarioAbierto) return;
    interactuarConObjetivoEnMira();
});
let pointerLockFallbackActivo = false;
let intentoPointerLockPendiente = false;
let temporizadorPointerLock = null;

function cancelarEsperaPointerLock() {
    if (temporizadorPointerLock !== null) {
        clearTimeout(temporizadorPointerLock);
        temporizadorPointerLock = null;
    }
}

function activarModoAlternativoDeMirada() {
    cancelarEsperaPointerLock();
    pointerLockFallbackActivo = true;
    intentoPointerLockPendiente = false;
    controles.isLocked = true;
    menuInicial.style.display = 'none';
    juegoPausado = false;
    ultimoFrameTime = performance.now();
    const ayuda = menuInicial.querySelector('p');
    if (ayuda) ayuda.textContent = 'Mantén el botón izquierdo y arrastra para mirar.';
    reanudarMusicaPausada();
}

function manejarErrorPointerLock(event) {
    // El rechazo de la promesa puede activar el fallback antes de que llegue
    // este evento. Hay que frenarlo igualmente para que Three.js no lo duplique.
    event.preventDefault();
    event.stopImmediatePropagation();
    if (intentoPointerLockPendiente) activarModoAlternativoDeMirada();
}

document.addEventListener('pointerlockerror', manejarErrorPointerLock, true);

function solicitarPointerLock() {
    // El menú sigue visible hasta que el navegador confirma el bloqueo.
    // Ignorar clics repetidos evita solicitudes simultáneas y errores en cascada.
    if (intentoPointerLockPendiente) return;

    if (pointerLockFallbackActivo) {
        activarModoAlternativoDeMirada();
        return;
    }

    intentoPointerLockPendiente = true;
    try {
        const elemento = controles.domElement || document.body;
        if (typeof elemento.requestPointerLock !== 'function') {
            activarModoAlternativoDeMirada();
            return;
        }
        const solicitud = elemento.requestPointerLock();
        if (solicitud && typeof solicitud.catch === 'function') {
            solicitud.catch(() => {
                if (intentoPointerLockPendiente) activarModoAlternativoDeMirada();
            });
        }
        // Algunos navegadores antiguos no devuelven promesa ni emiten el evento
        // de error de forma fiable. No dejar la pantalla bloqueada en ese caso.
        temporizadorPointerLock = setTimeout(() => {
            if (intentoPointerLockPendiente) activarModoAlternativoDeMirada();
        }, 1500);
    } catch (error) {
        if (intentoPointerLockPendiente) activarModoAlternativoDeMirada();
    }
}

document.addEventListener('mousemove', event => {
    if (!pointerLockFallbackActivo || !controles.isLocked || inventarioAbierto
        || event.target !== renderer.domElement || (event.buttons & 1) === 0) return;

    controles.getObject().rotation.y -= event.movementX * 0.002;
    camera.rotation.x = THREE.MathUtils.clamp(
        camera.rotation.x - event.movementY * 0.002,
        -Math.PI / 2 + 0.01,
        Math.PI / 2 - 0.01
    );
});
