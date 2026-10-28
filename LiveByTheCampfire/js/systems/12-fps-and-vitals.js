// --- CONTADOR DE FPS ---
let ultimoTiempo = performance.now();
let frames = 0;
let ultimoFrameTime = performance.now();

function actualizarFPS() {
    frames++;
    const tiempoActual = performance.now();
    if (tiempoActual >= ultimoTiempo + 1000) {
        fpsElemento.textContent = `FPS: ${frames}`;
        ajustarPixelRatioSegunFPS(frames);
        frames = 0; ultimoTiempo = tiempoActual;
    }
} 

// --- SISTEMA DE VIDA Y HAMBRE (FUNCIONES) ---
function actualizarHUDVida() {
    const barra = document.getElementById('barra-vida-actual');
    const texto = document.getElementById('texto-vida');
    
    if (!barra) return;

    const porcentaje = (jugador.vidaActual / jugador.vidaMaxima) * 100;
    
    barra.style.width = `${Math.max(0, porcentaje)}%`;
    if (texto) {
        texto.textContent = `${Math.max(0, Math.round(jugador.vidaActual))}/${jugador.vidaMaxima}`;
    }
    
    if (porcentaje < 30) {
        barra.style.background = '#ff0000';
    } else {
        barra.style.background = 'linear-gradient(90deg, #ff4d4d, #ff7676)';
    }
}
function actualizarHUDOxigeno() {
    const barra = document.getElementById('barra-oxigeno-actual');
    const texto = document.getElementById('texto-oxigeno');

    if (!barra) {
        console.warn('[Oxígeno] No se encontró #barra-oxigeno-actual en el HTML. Revisá el id.');
        return;
    }

    const porcentaje = (jugador.oxigenoActual / jugador.oxigenoMaximo) * 100;

    barra.style.width = `${Math.max(0, porcentaje)}%`;
    if (texto) {
        texto.textContent = `${Math.max(0, Math.ceil(jugador.oxigenoActual))}/${jugador.oxigenoMaximo}`;
    }

    if (porcentaje < 30) {
        barra.style.background = '#ff3b3b';
    } else {
        barra.style.background = 'linear-gradient(90deg, #4479ff, #1e54c9)';
    }
}

function actualizarHUDHambre() {
    const barra = document.getElementById('barra-hambre-actual');
    const texto = document.getElementById('texto-hambre');
    
    if (!barra) return;

    const porcentaje = (jugador.hambreActual / jugador.hambreMaxima) * 100;
    
    barra.style.width = `${Math.max(0, porcentaje)}%`;
    if (texto) {
        texto.textContent = `${Math.max(0, Math.round(jugador.hambreActual))}/${jugador.hambreMaxima}`;
    }
}

function recibirDaño(cantidad) {
    if (jugador.modoEspectador || jugador.estaMuerto) return;

    jugador.vidaActual -= cantidad;
    actualizarHUDVida();

    if (jugador.vidaActual <= 0) {
        morir();
    }
}

function morir() {
    location.reload();
}

