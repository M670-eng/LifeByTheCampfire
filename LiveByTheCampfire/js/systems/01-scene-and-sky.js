// --- 1. CONFIGURACIÓN DE LA ESCENA ---
let scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaccff);
scene.fog = new THREE.FogExp2(0xaaccff, 0.03);

// Far plane ampliado de 150 a 800 para renderizar los astros fuera del mapa
const dispositivoTactil = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 900;
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 800);
camera.rotation.order = 'YXZ';
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
const PIXEL_RATIO_MAXIMO = 1.0;
const PIXEL_RATIO_MINIMO = 0.65;
let pixelRatioNativoLimitado = Math.min(window.devicePixelRatio || 1, PIXEL_RATIO_MAXIMO);
let pixelRatioActual = pixelRatioNativoLimitado;
let ultimoAjustePixelRatio = performance.now();
renderer.setPixelRatio(pixelRatioActual);
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

function ajustarPixelRatioSegunFPS(fps) {
    const ahora = performance.now();
    if (ahora - ultimoAjustePixelRatio < 2500) return;

    let nuevoPixelRatio = pixelRatioActual;
    if (fps < 50) nuevoPixelRatio = Math.max(PIXEL_RATIO_MINIMO, pixelRatioActual - 0.1);
    else if (fps < 59) nuevoPixelRatio = Math.max(PIXEL_RATIO_MINIMO, pixelRatioActual - 0.05);
    else if (fps >= 60) nuevoPixelRatio = Math.min(pixelRatioNativoLimitado, pixelRatioActual + 0.05);

    if (Math.abs(nuevoPixelRatio - pixelRatioActual) >= 0.01) {
        pixelRatioActual = nuevoPixelRatio;
        renderer.setPixelRatio(pixelRatioActual);
        renderer.setSize(window.innerWidth, window.innerHeight);
        ultimoAjustePixelRatio = ahora;
    }
}

// --- 2. ILUMINACIÓN, SOL Y LUNA (ESTILIZADOS MULTICAPA) ---
const luzGeneral = new THREE.HemisphereLight(0xffffff, 0x667799, 0.7);
scene.add(luzGeneral);

// --- GRUPO DEL SOL ---
const sol = new THREE.Group();

// Núcleo hexagonal plano por delante y facetado por detrás para conservar volumen al verlo desde abajo.
const geoSolCore = new THREE.CylinderGeometry(21, 0, 12, 6, 1);
geoSolCore.rotateX(Math.PI / 2);
const matSolCore = new THREE.MeshBasicMaterial({ color: 0xfffcd0, fog: false, transparent: true });
const solCore = new THREE.Mesh(geoSolCore, matSolCore);
sol.add(solCore);

// Aura del Sol
const geoSolAura = new THREE.IcosahedronGeometry(30, 0);
const matSolAura = new THREE.MeshBasicMaterial({ 
    color: 0xff7a00, 
    transparent: true, 
    opacity: 0.3, 
    fog: false,
    side: THREE.DoubleSide
});
const solAura = new THREE.Mesh(geoSolAura, matSolAura);
sol.add(solAura);

sol.userData = { core: solCore, aura: solAura };
scene.add(sol);

// Resplandor radial de amanecer/atardecer, generado localmente sin cargar imágenes.
const canvasResplandorSol = document.createElement('canvas');
canvasResplandorSol.width = canvasResplandorSol.height = 256;
const contextoResplandorSol = canvasResplandorSol.getContext('2d');
const degradadoResplandorSol = contextoResplandorSol.createRadialGradient(128, 128, 5, 128, 128, 128);
degradadoResplandorSol.addColorStop(0, 'rgba(255, 244, 204, 0.95)');
degradadoResplandorSol.addColorStop(0.18, 'rgba(255, 190, 120, 0.66)');
degradadoResplandorSol.addColorStop(0.48, 'rgba(255, 112, 83, 0.24)');
degradadoResplandorSol.addColorStop(1, 'rgba(255, 95, 70, 0)');
contextoResplandorSol.fillStyle = degradadoResplandorSol;
contextoResplandorSol.fillRect(0, 0, 256, 256);
const texturaResplandorSol = new THREE.CanvasTexture(canvasResplandorSol);
const resplandorSol = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texturaResplandorSol,
    color: 0xffbd83,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false
}));
resplandorSol.scale.set(360, 230, 1);
resplandorSol.visible = false;
scene.add(resplandorSol);

// --- GRUPO DE LA LUNA ---
const luna = new THREE.Group();
const escalaVisualLuna = 16 / 22;
const posicionCamaraAstros = new THREE.Vector3();

// El frente es un hexágono plano; la parte trasera facetada evita que se vea como una lámina.
const geoLunaCore = new THREE.CylinderGeometry(16, 0, 9, 6, 1);
geoLunaCore.rotateX(Math.PI / 2);
const matLunaCore = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, transparent: true });
const lunaCore = new THREE.Mesh(geoLunaCore, matLunaCore);
lunaCore.renderOrder = 1;
luna.add(lunaCore);

function crearGeometriaFrenteLunar() {
    const radio = 16;
    const xMaximo = Math.sqrt(3) * radio / 2;
    const verticesHexagono = [
        new THREE.Vector2(0, -radio),
        new THREE.Vector2(xMaximo, -radio / 2),
        new THREE.Vector2(xMaximo, radio / 2),
        new THREE.Vector2(0, radio),
        new THREE.Vector2(-xMaximo, radio / 2),
        new THREE.Vector2(-xMaximo, -radio / 2)
    ];
    const forma = new THREE.Shape();
    forma.moveTo(verticesHexagono[0].x, verticesHexagono[0].y);
    for (let i = 1; i < verticesHexagono.length; i++) {
        forma.lineTo(verticesHexagono[i].x, verticesHexagono[i].y);
    }
    forma.closePath();
    const geometria = new THREE.ShapeGeometry(forma);
    const posiciones = geometria.getAttribute('position');
    const coordenadasUV = [];
    for (let i = 0; i < posiciones.count; i++) {
        coordenadasUV.push(
            posiciones.getX(i) / (2 * xMaximo) + 0.5,
            posiciones.getY(i) / (2 * radio) + 0.5
        );
    }
    geometria.setAttribute('uv', new THREE.Float32BufferAttribute(coordenadasUV, 2));
    return geometria;
}

const lienzoFaseLunar = document.createElement('canvas');
lienzoFaseLunar.width = lienzoFaseLunar.height = 256;
const contextoFaseLunar = lienzoFaseLunar.getContext('2d');
const texturaFaseLunar = new THREE.CanvasTexture(lienzoFaseLunar);
texturaFaseLunar.encoding = THREE.sRGBEncoding;
texturaFaseLunar.minFilter = THREE.LinearFilter;
texturaFaseLunar.magFilter = THREE.LinearFilter;
texturaFaseLunar.generateMipmaps = false;

function actualizarTexturaFaseLunar(fraccionIluminada, iluminadaDesdeLaIzquierda) {
    const ancho = lienzoFaseLunar.width;
    const inicioBorde = iluminadaDesdeLaIzquierda ? fraccionIluminada : 1 - fraccionIluminada;
    const mitadDegradado = 0.12;
    const inicioDegradado = THREE.MathUtils.clamp(inicioBorde - mitadDegradado, 0, 1);
    const finDegradado = THREE.MathUtils.clamp(inicioBorde + mitadDegradado, 0, 1);
    const gradiente = contextoFaseLunar.createLinearGradient(0, 0, ancho, 0);
    const colorOscuro = '#101521';
    const colorClaro = '#ffffff';

    if (fraccionIluminada <= 0) {
        gradiente.addColorStop(0, colorOscuro);
        gradiente.addColorStop(1, colorOscuro);
    } else if (fraccionIluminada >= 1) {
        gradiente.addColorStop(0, colorClaro);
        gradiente.addColorStop(1, colorClaro);
    } else if (iluminadaDesdeLaIzquierda) {
        gradiente.addColorStop(0, colorClaro);
        if (inicioDegradado > 0) gradiente.addColorStop(inicioDegradado, colorClaro);
        gradiente.addColorStop(finDegradado, colorOscuro);
        if (finDegradado < 1) gradiente.addColorStop(1, colorOscuro);
    } else {
        gradiente.addColorStop(0, colorOscuro);
        if (inicioDegradado > 0) gradiente.addColorStop(inicioDegradado, colorOscuro);
        gradiente.addColorStop(finDegradado, colorClaro);
        if (finDegradado < 1) gradiente.addColorStop(1, colorClaro);
    }

    contextoFaseLunar.fillStyle = gradiente;
    contextoFaseLunar.fillRect(0, 0, ancho, lienzoFaseLunar.height);
    texturaFaseLunar.needsUpdate = true;
}

const materialFrenteFasesLunares = new THREE.MeshBasicMaterial({
    map: texturaFaseLunar,
    color: 0xffffff,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    fog: false,
    side: THREE.DoubleSide
});
const frenteFasesLunares = new THREE.Mesh(crearGeometriaFrenteLunar(), materialFrenteFasesLunares);
frenteFasesLunares.position.z = 5.25;
frenteFasesLunares.renderOrder = 2;
lunaCore.add(frenteFasesLunares);

// Aura de la Luna
const geoLunaAura = new THREE.IcosahedronGeometry(30 * escalaVisualLuna, 0);
const matLunaAura = new THREE.MeshBasicMaterial({ 
    color: 0x4aa3df, 
    transparent: true, 
    opacity: 0.3, 
    depthWrite: false,
    fog: false,
    side: THREE.DoubleSide
});
const lunaAura = new THREE.Mesh(geoLunaAura, matLunaAura);
lunaAura.renderOrder = 0;
luna.add(lunaAura);

luna.userData = {
    core: lunaCore,
    aura: lunaAura,
    frenteFases: frenteFasesLunares
};
scene.add(luna);

// Resplandor radial lunar, con la misma forma y proporción que el del Sol.
const canvasResplandorLuna = document.createElement('canvas');
canvasResplandorLuna.width = canvasResplandorLuna.height = 256;
const contextoResplandorLuna = canvasResplandorLuna.getContext('2d');
const degradadoResplandorLuna = contextoResplandorLuna.createRadialGradient(128, 128, 5, 128, 128, 128);
degradadoResplandorLuna.addColorStop(0, 'rgba(225, 242, 255, 0.95)');
degradadoResplandorLuna.addColorStop(0.18, 'rgba(155, 207, 255, 0.66)');
degradadoResplandorLuna.addColorStop(0.48, 'rgba(89, 156, 225, 0.24)');
degradadoResplandorLuna.addColorStop(1, 'rgba(72, 133, 207, 0)');
contextoResplandorLuna.fillStyle = degradadoResplandorLuna;
contextoResplandorLuna.fillRect(0, 0, 256, 256);
const texturaResplandorLuna = new THREE.CanvasTexture(canvasResplandorLuna);
const resplandorLuna = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texturaResplandorLuna,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false
}));
resplandorLuna.scale.set(360 * escalaVisualLuna, 230 * escalaVisualLuna, 1);
resplandorLuna.visible = false;
scene.add(resplandorLuna);


// Luz Direccional Dinámica (Actuará como luz del Sol de día y luz de Luna de noche)
const luzAstro = new THREE.DirectionalLight(0xfff5b5, 0.8);
scene.add(luzAstro);

// Variables de control del tiempo (Ciclo de 5 minutos reales = 300)
let dayTime = 0; 
let dayCount = 1;
let nochesTranscurridasLuna = dayCount - 1;
const DURACION_CICLO_SEGUNDOS = 45;
const hudCalendario = document.getElementById('hud-calendario');
const hudCoordenadas = document.getElementById('hud-coordenadas');
let ultimaActualizacionHudCoordenadas = 0;

function obtenerEstacionActual(dia) {
    if (dia <= 91) return 'Primavera';
    if (dia <= 182) return 'Verano';
    if (dia <= 273) return 'Otoño';
    return 'Invierno';
}

function actualizarHUDCalendario() {
    if (hudCalendario) {
        hudCalendario.textContent = `Día ${dayCount} / 365 · ${obtenerEstacionActual(dayCount)}`;
    }
}

function actualizarHUDCoordenadas(ahora) {
    if (!hudCoordenadas || dispositivoTactil || ahora - ultimaActualizacionHudCoordenadas < 100) return;
    ultimaActualizacionHudCoordenadas = ahora;
    const posicion = controles.getObject().position;
    hudCoordenadas.textContent = `X: ${Math.round(posicion.x)} · Y: ${Math.round(posicion.y)} · Z: ${Math.round(posicion.z)}`;
}

actualizarHUDCalendario();

// Colores base para las transiciones del cielo
const colorCieloDia = new THREE.Color(0xaaccff);
const colorCieloNoche = new THREE.Color(0x050515);
const colorCieloAmanecer = new THREE.Color(0xffa47f);
const colorCieloAtardecer = new THREE.Color(0xf27868);
const colorLuzCrepusculo = new THREE.Color(0xffbd83);
const colorNubesBase = new THREE.Color(0xdce4e8);

    
