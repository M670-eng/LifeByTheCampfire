let juegoPausado = true;
let orientacionVerticalAnterior = false;
const controlesTactiles = document.getElementById('controles-tactiles');
const joystickTactil = document.getElementById('joystick-tactil');
const joystickPunto = document.getElementById('joystick-punto');
let punteroJoystick = null;
let punteroMirada = null;
let ultimaPosicionMirada = null;
const SENSIBILIDAD_MIRADA_TACTIL = 0.006;
let sprintTactilActivo = false;

if (dispositivoTactil) document.body.classList.add('dispositivo-tactil');

function actualizarOrientacionMovil() {
    if (!dispositivoTactil) return;
    const orientacionVertical = window.matchMedia('(orientation: portrait)').matches;
    document.body.classList.toggle('orientacion-vertical', orientacionVertical);

    if (orientacionVertical && !orientacionVerticalAnterior && controles.isLocked) {
        controles.isLocked = false;
        juegoPausado = true;
        menuInicial.style.display = 'flex';
        liberarTeclasTactiles();
        if (!audioMusica.paused) {
            audioMusica.pause();
            musicaPausadaPorEscape = true;
        }
    }

    if (!orientacionVertical && orientacionVerticalAnterior && juegoPausado && !inventarioAbierto) {
        menuInicial.style.display = 'flex';
    }
    orientacionVerticalAnterior = orientacionVertical;
}

actualizarOrientacionMovil();
window.addEventListener('orientationchange', actualizarOrientacionMovil);

function activarJuegoTactil() {
    controles.isLocked = true;
    menuInicial.style.display = 'none';
    juegoPausado = false;
    ultimoFrameTime = performance.now();
    document.body.classList.add('juego-activo-tactil');

    reanudarMusicaPausada();
}

function pausarJuegoTactil() {
    controles.isLocked = false;
    juegoPausado = true;
    menuInicial.style.display = 'flex';
    document.body.classList.remove('juego-activo-tactil');
    liberarTeclasTactiles();

    if (!audioMusica.paused) {
        audioMusica.pause();
        musicaPausadaPorEscape = true;
    }
}

function liberarTeclasTactiles() {
    teclas.KeyW = teclas.KeyA = teclas.KeyS = teclas.KeyD = false;
    teclas.Space = teclas.ShiftLeft = false;
    sprintActivoPorDobleToque = false;
    if (joystickPunto) joystickPunto.style.transform = 'translate(0, 0)';
}

if (dispositivoTactil) {
    const zonaMirada = document.getElementById('zona-mirada');
    const botonSaltar = document.getElementById('boton-saltar-tactil');
    const botonAgacharse = document.getElementById('boton-agacharse-tactil');
    const botonPausa = document.getElementById('boton-pausa-tactil');
    const botonZoom = document.getElementById('boton-zoom-tactil');
    const botonPantallaCompleta = document.getElementById('boton-pantalla-completa-tactil');
    const botonMusica = document.getElementById('boton-musica-tactil');
    const botonInventario = document.getElementById('boton-inventario-tactil');
    const botonCerrarInventario = document.getElementById('boton-cerrar-inventario-tactil');
    const botonInteraccion = document.getElementById('boton-interaccion-tactil');
    const botonCorrer = document.getElementById('boton-correr-tactil');

    joystickTactil.addEventListener('pointerdown', event => {
        if (!controles.isLocked) return;
        event.preventDefault();
        punteroJoystick = event.pointerId;
        joystickTactil.setPointerCapture(event.pointerId);
        moverJoystick(event);
    });

    joystickTactil.addEventListener('pointermove', event => {
        if (event.pointerId === punteroJoystick) moverJoystick(event);
    });

    function moverJoystick(event) {
        const rect = joystickTactil.getBoundingClientRect();
        const radio = rect.width * 0.34;
        let dx = event.clientX - (rect.left + rect.width / 2);
        let dy = event.clientY - (rect.top + rect.height / 2);
        const distancia = Math.hypot(dx, dy);
        if (distancia > radio) {
            dx = dx / distancia * radio;
            dy = dy / distancia * radio;
        }
        joystickPunto.style.transform = `translate(${dx}px, ${dy}px)`;
        const zonaMuerta = radio * 0.22;
        teclas.KeyA = dx < -zonaMuerta;
        teclas.KeyD = dx > zonaMuerta;
        teclas.KeyW = dy < -zonaMuerta;
        teclas.KeyS = dy > zonaMuerta;
    }

    function soltarJoystick(event) {
        if (event.pointerId !== punteroJoystick) return;
        punteroJoystick = null;
        teclas.KeyW = teclas.KeyA = teclas.KeyS = teclas.KeyD = false;
        joystickPunto.style.transform = 'translate(0, 0)';
    }

    joystickTactil.addEventListener('pointerup', soltarJoystick);
    joystickTactil.addEventListener('pointercancel', soltarJoystick);
    joystickTactil.addEventListener('lostpointercapture', soltarJoystick);

    zonaMirada.addEventListener('pointerdown', event => {
        if (!controles.isLocked || event.pointerType === 'mouse') return;
        event.preventDefault();
        punteroMirada = event.pointerId;
        ultimaPosicionMirada = { x: event.clientX, y: event.clientY };
        zonaMirada.setPointerCapture(event.pointerId);
    });

    zonaMirada.addEventListener('pointermove', event => {
        if (event.pointerId !== punteroMirada || !ultimaPosicionMirada) return;
        const deltaX = event.clientX - ultimaPosicionMirada.x;
        const deltaY = event.clientY - ultimaPosicionMirada.y;
        ultimaPosicionMirada = { x: event.clientX, y: event.clientY };
        controles.getObject().rotation.y -= deltaX * SENSIBILIDAD_MIRADA_TACTIL;
        camera.rotation.x = THREE.MathUtils.clamp(
            camera.rotation.x - deltaY * SENSIBILIDAD_MIRADA_TACTIL,
            -Math.PI / 2 + 0.01,
            Math.PI / 2 - 0.01
        );
    });

    function soltarMirada(event) {
        if (event.pointerId !== punteroMirada) return;
        punteroMirada = null;
        ultimaPosicionMirada = null;
    }

    zonaMirada.addEventListener('pointerup', soltarMirada);
    zonaMirada.addEventListener('pointercancel', soltarMirada);
    zonaMirada.addEventListener('lostpointercapture', soltarMirada);

    function enlazarBotonMovimiento(boton, tecla) {
        boton.addEventListener('pointerdown', event => {
            if (!controles.isLocked) return;
            event.preventDefault();
            event.stopPropagation();
            boton.setPointerCapture(event.pointerId);
            teclas[tecla] = true;
        });
        const soltar = event => {
            teclas[tecla] = false;
        };
        boton.addEventListener('pointerup', soltar);
        boton.addEventListener('pointercancel', soltar);
        boton.addEventListener('lostpointercapture', soltar);
    }

    enlazarBotonMovimiento(botonSaltar, 'Space');
    enlazarBotonMovimiento(botonAgacharse, 'ShiftLeft');

    function enlazarAccionTactil(boton, accion) {
        let punteroActivo = null;
        let ultimoAccionPorPuntero = 0;
        boton.addEventListener('pointerdown', event => {
            event.preventDefault();
            event.stopPropagation();
            punteroActivo = event.pointerId;
            boton.setPointerCapture(event.pointerId);
        });
        boton.addEventListener('pointerup', event => {
            if (event.pointerId !== punteroActivo) return;
            event.preventDefault();
            event.stopPropagation();
            punteroActivo = null;
            ultimoAccionPorPuntero = performance.now();
            accion();
        });
        const cancelar = event => {
            if (event.pointerId === punteroActivo) punteroActivo = null;
        };
        boton.addEventListener('pointercancel', cancelar);
        boton.addEventListener('lostpointercapture', cancelar);
        boton.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            // Conserva activación por teclado/tecnología asistiva sin repetir el toque.
            if (event.detail === 0 || performance.now() - ultimoAccionPorPuntero > 400) accion();
        });
    }

    function alternarSprintTactil() {
        sprintTactilActivo = !sprintTactilActivo;
        botonCorrer.classList.toggle('activo', sprintTactilActivo);
        botonCorrer.setAttribute('aria-pressed', String(sprintTactilActivo));
        botonCorrer.setAttribute('aria-label', sprintTactilActivo ? 'Desactivar carrera' : 'Activar carrera');
    }

    // Pausa solo en click: al pausar aparece el menú bajo el dedo y el pointerup
    // podía confundirse con un toque de reanudación en algunos móviles.
    botonPausa.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        pausarJuegoTactil();
    });
    // Estos dos controladores se declaran en 10-player.js, que carga después de este archivo.
    // Resolverlos al pulsar evita una ReferenceError durante la inicialización táctil.
    enlazarAccionTactil(botonZoom, () => alternarZoom());
    enlazarAccionTactil(botonPantallaCompleta, () => alternarPantallaCompleta());
    enlazarAccionTactil(botonMusica, alternarMusicaTactil);
    enlazarAccionTactil(botonInventario, alternarInventario);
    enlazarAccionTactil(botonCerrarInventario, cerrarInventario);
    enlazarAccionTactil(botonInteraccion, interactuarJugador);
    enlazarAccionTactil(botonCorrer, alternarSprintTactil);
 }
