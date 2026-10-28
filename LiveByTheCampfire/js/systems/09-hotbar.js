let slotSeleccionado = 0; // Índice de 0 a 8

// Generar los 9 slots de la Hotbar fija al iniciar el juego
function inicializarHotbarHUD() {
    const contenedor = document.getElementById('hotbar-hud');
    contenedor.innerHTML = '';

    for (let i = 0; i < 9; i++) {
        const slot = document.createElement('div');
        slot.classList.add('slot');
        if (i === slotSeleccionado) slot.classList.add('seleccionado');
        
        // Asignar evento de clic para seleccionar el ítem activo
        slot.addEventListener('click', () => seleccionarSlot(i));
        contenedor.appendChild(slot);
    }
    actualizarHotbarHUD();
}

// Actualizar los ítems y la selección activa
function actualizarHotbarHUD() {
    const slots = document.querySelectorAll('#hotbar-hud .slot');
    
    slots.forEach((slot, index) => {
        if (index === slotSeleccionado) {
            slot.classList.add('seleccionado');
        } else {
            slot.classList.remove('seleccionado');
        }

        // LÍNEA CORREGIDA (antes decía inventarioHotbar[index]):
        const item = hotbar[index]; 

        if (item) {
            slot.innerHTML = `
                <div class="inventario-item">${obtenerIconoItem(item)}</div>
                <div class="inventario-cantidad">${item.cantidad > 1 ? item.cantidad : ''}</div>
            `;
        } else {
            slot.innerHTML = '';
        }
    });
}

// Detectar teclas de acceso rápido (1-9) y rueda del ratón
window.addEventListener('keydown', (e) => {
    if (e.key >= '1' && e.key <= '9') {
        seleccionarSlot(parseInt(e.key) - 1);
    }
});

window.addEventListener('wheel', (e) => {
    if (e.deltaY > 0) {
        slotSeleccionado = (slotSeleccionado + 1) % 9;
    } else {
        slotSeleccionado = (slotSeleccionado - 1 + 9) % 9;
    }
    actualizarHotbarHUD();
});

function seleccionarSlot(index) {
    slotSeleccionado = index;
    actualizarHotbarHUD();
}

const selectorDiaInicio = document.getElementById('dia-inicio');
let diaInicioAplicado = false;

if (selectorDiaInicio) selectorDiaInicio.value = String(dayCount);

menuInicial.addEventListener('click', event => {
    if (event.target.closest('#selector-dia-inicio')
        && !event.target.closest('#boton-iniciar-juego')) return;
    if (dispositivoTactil && window.matchMedia('(orientation: portrait)').matches) return;

    if (!diaInicioAplicado) {
        const diaElegido = Number.parseInt(selectorDiaInicio?.value, 10);
        dayCount = THREE.MathUtils.clamp(Number.isFinite(diaElegido) ? diaElegido : 1, 1, 365);
        nochesTranscurridasLuna = dayCount - 1;
        actualizarFaseVisualLuna();
        if (selectorDiaInicio) selectorDiaInicio.value = String(dayCount);
        dayTime = 0;
        aplicarClimaProgramadoDelDia(dayCount);
        actualizarHUDCalendario();
        diaInicioAplicado = true;
        if (selectorDiaInicio) selectorDiaInicio.closest('#selector-dia-inicio').style.display = 'none';
        const instruccionesMenu = document.getElementById('instrucciones-menu');
        if (instruccionesMenu) instruccionesMenu.textContent = 'Partida pausada. Haz clic o toca para continuar.';
    }

    if (musicaActiva && !musicaIniciada && temporizadorMusica === null) reproducirSiguienteMusica();
    if (dispositivoTactil) {
        activarJuegoTactil();
    } else {
        solicitarPointerLock();
    }
});

controles.addEventListener('lock', () => { 
    cancelarEsperaPointerLock();
    intentoPointerLockPendiente = false;
    pointerLockFallbackActivo = false;
    menuInicial.style.display = 'none'; 
    juegoPausado = false;
    ultimoFrameTime = performance.now(); // Evita saltos bruscos en la simulación al reanudar
    document.body.classList.remove('juego-activo-tactil');
    reanudarMusicaPausada();
});

controles.addEventListener('unlock', () => { 
    if (!inventarioAbierto) { 
        menuInicial.style.display = 'flex';
        juegoPausado = true;
        document.body.classList.remove('juego-activo-tactil');
        if (!audioMusica.paused) {
            audioMusica.pause();
            musicaPausadaPorEscape = true;
        }
    }
});

scene.add(controles.getObject());

