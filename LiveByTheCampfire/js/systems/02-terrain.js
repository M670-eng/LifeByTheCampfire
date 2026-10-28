// --- 3. GENERADOR DE RUIDO PROCEDIMENTAL ------ CONFIGURACIÓN Y MUESTRA DE SEMILLA ---


//* Déjalo en null para generar mundos aleatorios. Cuando elijas tu favorita, pon su número aquí (ej: 338726).
const SEMILLA_FIXED = 338726; 

const semillaJuego = SEMILLA_FIXED;
const semillaX = (semillaJuego * 12.9898) % 5000;
const semillaZ = (semillaJuego * 78.233) % 5000;

console.log(`%c 🗺️ MUNDO CARGADO CON SEMILLA: ${semillaJuego}`, 'color: #00ffcc; font-size: 14px; font-weight: bold;');

// Algoritmo de azar determinista por coordenada para vegetación y objetos
function hash2D(x, z, subSemilla = 0) {
    let n = Math.sin(x * 12.9898 + z * 78.233 + (semillaJuego + subSemilla)) * 43758.5453;
    return n - Math.floor(n);
}

function ruido2D(x, z) {
    // --- OCTAVA 1: Valles y colinas principales (Frecuencia muy baja) ---
    let x1 = x * 0.022 + semillaX;
    let z1 = z * 0.022 + semillaZ;
    let ondasGrandes = Math.sin(x1) * Math.cos(z1) + Math.sin(x1 * 0.6 + z1 * 1.2);

    // --- OCTAVA 2: Rotación de 37° (Desalinea la rejilla) ---
    let rx2 = (x * 0.798 - z * 0.601) * 0.055 + semillaZ;
    let rz2 = (x * 0.601 + z * 0.798) * 0.055 - semillaX;
    let ondasMedias = Math.sin(rx2) * Math.cos(rz2 * 1.3);

    // --- OCTAVA 3: Rotación de 73° (Detalles finos y rugosidad) ---
    let rx3 = (x * 0.292 - z * 0.956) * 0.13 + semillaX;
    let rz3 = (x * 0.956 + z * 0.292) * 0.13 + semillaZ;
    let ondasChicas = (Math.sin(rx3 * 1.7) + Math.cos(rz3 * 1.1)) * 0.5;

    // --- COMBINACIÓN SUAVE ---
    let alturaFinal = (ondasGrandes * 4.5) + (ondasMedias * 2.0) + ondasChicas;

    return alturaFinal;
}

const TAM_BLOQUE = 1;
const TAMAÑO_MAPA_INICIAL = 20;
const TAMAÑO_MAPA_EXTENDIDO = 45;
// Capacidad máxima del mundo: radio 120 desde la fogata en cada dirección.
const TAMAÑO_MAPA_MAXIMO = 120;
let tamañoMapa = TAMAÑO_MAPA_INICIAL;
const ANCHO_TERRENO_BLOQUES = TAMAÑO_MAPA_MAXIMO * 2 + 1;
const ALTURA_NO_CALCULADA = -128;
const cacheAlturasTerreno = new Int8Array(ANCHO_TERRENO_BLOQUES * ANCHO_TERRENO_BLOQUES);
cacheAlturasTerreno.fill(ALTURA_NO_CALCULADA);
const NIVEL_AGUA = -1;
let aguaCongelada = false;
let aguaSeCongelo = false;
let progresoTransparenciaAguaNieve = 0;

function obtenerAlturaTerreno(x, z) {
    if (Number.isInteger(x) && Number.isInteger(z)
        && x >= -TAMAÑO_MAPA_MAXIMO && x <= TAMAÑO_MAPA_MAXIMO
        && z >= -TAMAÑO_MAPA_MAXIMO && z <= TAMAÑO_MAPA_MAXIMO) {
        const indice = (x + TAMAÑO_MAPA_MAXIMO) * ANCHO_TERRENO_BLOQUES + z + TAMAÑO_MAPA_MAXIMO;
        const alturaGuardada = cacheAlturasTerreno[indice];
        if (alturaGuardada !== ALTURA_NO_CALCULADA) return alturaGuardada;

        const altura = Math.round(ruido2D(x, z) * 2);
        cacheAlturasTerreno[indice] = altura;
        return altura;
    }

    return Math.round(ruido2D(x, z) * 2);
}

// NUNCA SPAWNEA EN EL AGUA 
function encontrarTierraSeca(xCentro, zCentro, radioMax = 40) {
    if (obtenerAlturaTerreno(xCentro, zCentro) > NIVEL_AGUA) {
        return { x: xCentro, z: zCentro };
    }
    for (let r = 1; r <= radioMax; r++) {
        for (let i = -r; i <= r; i++) {
            const candidatos = [
                { x: xCentro + i, z: zCentro - r },
                { x: xCentro + i, z: zCentro + r },
                { x: xCentro - r, z: zCentro + i },
                { x: xCentro + r, z: zCentro + i }
            ];
            for (const c of candidatos) {
                if (obtenerAlturaTerreno(c.x, c.z) > NIVEL_AGUA) return c;
            }
        }
    }
    // Si por alguna razón extrema no se encontró nada (mapa todo de agua), no rompemos nada
    return { x: xCentro, z: zCentro };
}

function comprobarSiEstaEnAgua() {
    const posicion = controles.getObject().position;
    if (aguaCongelada) {
        jugador.nadando = false;
        jugador.sumergido = false;
        return false;
    }

    // Los pies del jugador entran en el agua
    const piesY = posicion.y - jugador.alturaOjos;
    const estaEnAgua = piesY < NIVEL_AGUA;

    // Altura del terreno debajo del jugador
    const alturaTerreno = obtenerAlturaTerreno(
        Math.round(posicion.x),
        Math.round(posicion.z)
    );

    const profundidad = NIVEL_AGUA - alturaTerreno;

    jugador.nadando = estaEnAgua && profundidad > 1;

    // Sumergido de verdad: la cabeza (posición de la cámara) queda bajo el agua
    jugador.sumergido = jugador.nadando && posicion.y < NIVEL_AGUA;

    return jugador.nadando;
}

// Objeto global de color reutilizable para evitar recolección de basura (GC)
const colorAux = new THREE.Color();
const geoPasto = new THREE.BoxGeometry(TAM_BLOQUE, TAM_BLOQUE, TAM_BLOQUE);
const colorTop = new THREE.Color(0x4b6f44);
const colorSideGrass = new THREE.Color(0x3f5f39);
const colorSideDirt = new THREE.Color(0x8A5A5A);
const colorBase = new THREE.Color(0x6A4242);

const posArr = geoPasto.attributes.position.array;
const colorsPasto = new Float32Array(posArr.length);
const GRASS_THRESHOLD = 0.25;

for (let i = 0; i < posArr.length / 3; i++) {
    const py = posArr[i * 3 + 1];
    const isTop = py >= 0.499;
    const isBottom = py <= -0.499;
    let c;
    
    if (isTop) {
        c = colorTop.clone();
        const jitter = (Math.random() - 0.5) * 0.06;
        c.r = Math.max(0, Math.min(1, c.r + jitter));
        c.g = Math.max(0, Math.min(1, c.g + jitter));
    } else if (isBottom) {
        c = colorBase.clone();
    } else {
        c = (py >= GRASS_THRESHOLD ? colorSideGrass : colorSideDirt).clone();
        const jitter = (Math.random() - 0) * 0.04;
        c.r = Math.max(0, Math.min(1, c.r + jitter));
        c.g = Math.max(0, Math.min(1, c.g + jitter));
        c.b = Math.max(0, Math.min(1, c.b + jitter));
    }
    
    colorsPasto[i * 3]     = c.r;
    colorsPasto[i * 3 + 1] = c.g;
    colorsPasto[i * 3 + 2] = c.b;
}
geoPasto.setAttribute('color', new THREE.Float32BufferAttribute(colorsPasto, 3));
const matPasto = new THREE.MeshLambertMaterial({ vertexColors: true });

// --- ESTILO DEL BLOQUE DE PIEDRA ---
const geoPiedra = new THREE.BoxGeometry(TAM_BLOQUE, TAM_BLOQUE, TAM_BLOQUE);
const colorPiedraTop = new THREE.Color(0x99a3a4);
const colorPiedraSide = new THREE.Color(0x92a0a1);
const colorPiedraBase = new THREE.Color(0x667373);

const posArrPiedra = geoPiedra.attributes.position.array;
const colorsPiedra = new Float32Array(posArrPiedra.length);

for (let i = 0; i < posArrPiedra.length / 3; i++) {
    const py = posArrPiedra[i * 3 + 1];
    const isTopPiedra = py >= 0.499;
    const isBottomPiedra = py <= -0.499;
    let c = isTopPiedra ? colorPiedraTop.clone() : (isBottomPiedra ? colorPiedraBase.clone() : colorPiedraSide.clone());
    
    const jitter = (Math.random() - 0.5) * 0.09;
    c.r = Math.max(0, Math.min(1, c.r + jitter));
    c.g = Math.max(0, Math.min(1, c.g + jitter));
    c.b = Math.max(0, Math.min(1, c.b + jitter));
    
    colorsPiedra[i * 3]     = c.r;
    colorsPiedra[i * 3 + 1] = c.g;
    colorsPiedra[i * 3 + 2] = c.b;
}

geoPiedra.setAttribute('color', new THREE.Float32BufferAttribute(colorsPiedra, 3));
const matPiedraBase = new THREE.MeshLambertMaterial({ vertexColors: true });

// --- ESTILO DEL BLOQUE DE ARENA ---
const geoArena = new THREE.BoxGeometry(TAM_BLOQUE, TAM_BLOQUE, TAM_BLOQUE);

const colorArenaTop = new THREE.Color(0xd9c27a);
const colorArenaSide = new THREE.Color(0xc8b36a);
const colorArenaBase = new THREE.Color(0xb09a58);

const posArrArena = geoArena.attributes.position.array;
const colorsArena = new Float32Array(posArrArena.length);

for (let i = 0; i < posArrArena.length / 3; i++) {
    const py = posArrArena[i * 3 + 1];
    const isTopArena = py >= 0.499;
    const isBottomArena = py <= -0.499;

    let c = isTopArena ? colorArenaTop.clone() :
            (isBottomArena ? colorArenaBase.clone() : colorArenaSide.clone());

    const jitter = (Math.random() - 0.5) * 0.09;

    c.r = Math.max(0, Math.min(1, c.r + jitter));
    c.g = Math.max(0, Math.min(1, c.g + jitter));
    c.b = Math.max(0, Math.min(1, c.b + jitter));

    colorsArena[i * 3] = c.r;
    colorsArena[i * 3 + 1] = c.g;
    colorsArena[i * 3 + 2] = c.b;
}


geoArena.setAttribute('color', new THREE.Float32BufferAttribute(colorsArena, 3));

const matArena = new THREE.MeshLambertMaterial({ vertexColors: true });

// --- ESTILO DEL BLOQUE DE GRANITO ---
const geoNieve = new THREE.BoxGeometry(TAM_BLOQUE, TAM_BLOQUE, TAM_BLOQUE);
const colorNieveTop = new THREE.Color(0x92a4a6);
const colorNieveSide = new THREE.Color(0xdee5ed);
const colorNieveBase = new THREE.Color(0xbcc6d1);

const posArrNieve = geoNieve.attributes.position.array;
const colorsNieve = new Float32Array(posArrNieve.length);

for (let i = 0; i < posArrNieve.length / 3; i++) {
    const py = posArrNieve[i * 3 + 1];
    const isTopNieve = py >= 0.499;
    const isBottomNieve = py <= -0.499;
    let c = isTopNieve ? colorNieveTop.clone() : (isBottomNieve ? colorNieveBase.clone() : colorNieveSide.clone());
    
    const jitter = (Math.random() - 0.5) * 0.05;
    c.r = Math.max(0, Math.min(1, c.r + jitter));
    c.g = Math.max(0, Math.min(1, c.g + jitter));
    c.b = Math.max(0, Math.min(1, c.b + jitter));
    
    colorsNieve[i * 3]     = c.r;
    colorsNieve[i * 3 + 1] = c.g;
    colorsNieve[i * 3 + 2] = c.b;
}
geoNieve.setAttribute('color', new THREE.Float32BufferAttribute(colorsNieve, 3));
const matNieveBase = new THREE.MeshLambertMaterial({ vertexColors: true });

// --- TERRENO DIVIDIDO EN SECTORES ---
const TAMAÑO_SECTOR_TERRENO = 24;
// Con niebla despejada (densidad 0.05), nueve sectores cubren el horizonte útil
// y evitan mantener hasta trece sectores de terreno en cada render.
const RADIO_SECTORES_ACTIVOS = 1.7;
const DISTANCIA_ACTUALIZACION_SECTORES = 8;
const DURACION_TRANSICION_SECTOR = 0.0;
const anchoMapa = TAMAÑO_MAPA_MAXIMO * 2 + 1;
const cantidadSectoresPorEje = Math.ceil(anchoMapa / TAMAÑO_SECTOR_TERRENO);
const sectoresTerreno = new Map();
let sectoresTerrenoNuevos = false;
const meshesTerreno = { pasto: [], piedra: [], nieve: [], arena: [] };
let dummy = new THREE.Object3D();
const posicionesBloquesPasto = [];
const posicionesBloquesPiedra = [];
const posicionesBloquesArena = [];
let colaExtensionMapa = null;
let siguienteLimiteExtension = null;
let indiceExtensionMapa = 0;
let indiceInicioPastoExtension = 0;
let indiceInicioPiedraExtension = 0;
let indiceInicioArenaExtension = 0;
const BLOQUES_EXTENSION_POR_FOTOGRAMA = 400;
const PRESUPUESTO_EXTENSION_MS = 4;

function crearSectorTerreno(sx, sz) {
    const clave = `${sx},${sz}`;
    let sector = sectoresTerreno.get(clave);
    if (sector) return sector;

    const capacidad = TAMAÑO_SECTOR_TERRENO * TAMAÑO_SECTOR_TERRENO;
    const grupo = new THREE.Group();
    grupo.visible = false;
    scene.add(grupo);
    const materialesSector = [];
    const crearMalla = (geometria, material, tipo) => {
        const materialSector = material.clone();
        materialesSector.push(materialSector);
        const malla = new THREE.InstancedMesh(geometria, materialSector, capacidad);
        malla.count = 0;
        malla.userData.sector = clave;
        malla.userData.tipoTerreno = tipo;
        // Mantén el atributo en todos los sectores, incluso si un sector no
        // contiene instancias de ese tipo (Three.js prepara el shader al renderizar).
        malla.instanceColor = new THREE.InstancedBufferAttribute(
            new Float32Array(capacidad * 3).fill(1), 3
        );
        grupo.add(malla);
        meshesTerreno[tipo].push(malla);
        return malla;
    };

    sector = {
        sx, sz, visible: false, opacidad: 0, grupo, materiales: materialesSector,
        pasto: crearMalla(geoPasto, matPasto, 'pasto'),
        piedra: crearMalla(geoPiedra, matPiedraBase, 'piedra'),
        nieve: crearMalla(geoNieve, matNieveBase, 'nieve'),
        arena: crearMalla(geoArena, matArena, 'arena'),
        manchas: { pasto: null, piedra: null, arena: null }
    };
    sectoresTerreno.set(clave, sector);
    sectoresTerrenoNuevos = true;
    return sector;
}

function obtenerSectorIndice(coordenada) {
    return Math.max(0, Math.min(
        cantidadSectoresPorEje - 1,
        Math.floor((coordenada + TAMAÑO_MAPA_MAXIMO) / TAMAÑO_SECTOR_TERRENO)
    ));
}

let ultimaPosicionActualizacionSectores = null;
let ultimaClaveSectoresPollos = null;
function actualizarSectoresTerreno(xJugador, zJugador, forzar = false, posicionesPollos = []) {
    const centrosPollos = posicionesPollos.map(posicion => ({
        x: obtenerSectorIndice(posicion.x),
        z: obtenerSectorIndice(posicion.z)
    }));
    const claveSectoresPollos = centrosPollos.map(centro => `${centro.x},${centro.z}`).join('|');
    if (!forzar && ultimaPosicionActualizacionSectores) {
        const dx = xJugador - ultimaPosicionActualizacionSectores.x;
        const dz = zJugador - ultimaPosicionActualizacionSectores.z;
        if (dx * dx + dz * dz < DISTANCIA_ACTUALIZACION_SECTORES ** 2
            && claveSectoresPollos === ultimaClaveSectoresPollos) return;
    }

    ultimaPosicionActualizacionSectores = { x: xJugador, z: zJugador };
    ultimaClaveSectoresPollos = claveSectoresPollos;
    const centroX = obtenerSectorIndice(xJugador);
    const centroZ = obtenerSectorIndice(zJugador);
    for (const sector of sectoresTerreno.values()) {
        const cercaDelJugador = Math.abs(sector.sx - centroX) <= RADIO_SECTORES_ACTIVOS
            && Math.abs(sector.sz - centroZ) <= RADIO_SECTORES_ACTIVOS
            && (sector.sx - centroX) ** 2 + (sector.sz - centroZ) ** 2
                <= RADIO_SECTORES_ACTIVOS ** 2;
        const cercaDeUnPollo = centrosPollos.some(centro =>
            Math.abs(sector.sx - centro.x) <= RADIO_SECTORES_ACTIVOS
            && Math.abs(sector.sz - centro.z) <= RADIO_SECTORES_ACTIVOS
            && (sector.sx - centro.x) ** 2 + (sector.sz - centro.z) ** 2
                <= RADIO_SECTORES_ACTIVOS ** 2
        );
        const activo = cercaDelJugador || cercaDeUnPollo;
        if (sector.visible !== activo) {
            sector.visible = activo;
            if (DURACION_TRANSICION_SECTOR <= 0) {
                sector.opacidad = activo ? 1 : 0;
                sector.grupo.visible = activo;
            } else if (activo) {
                sector.grupo.visible = true;
            }
        }
    }
    sectoresTerrenoNuevos = false;
}

function actualizarTransicionSectoresTerreno(dt) {
    if (DURACION_TRANSICION_SECTOR <= 0) return;
    const cambio = DURACION_TRANSICION_SECTOR > 0 ? dt / DURACION_TRANSICION_SECTOR : 1;
    for (const sector of sectoresTerreno.values()) {
        const opacidadObjetivo = sector.visible ? 1 : 0;
        if (sector.opacidad === opacidadObjetivo) continue;

        sector.opacidad = THREE.MathUtils.clamp(
            sector.opacidad + (sector.visible ? cambio : -cambio),
            0,
            1
        );
        const esTransparente = sector.opacidad < 1;
        for (const material of sector.materiales) {
            material.opacity = sector.opacidad;
            if (material.transparent !== esTransparente) {
                material.transparent = esTransparente;
                material.depthWrite = !esTransparente;
                material.needsUpdate = true;
            }
        }

        if (!sector.visible && sector.opacidad === 0) sector.grupo.visible = false;
    }
}

function añadirBloqueTerreno(x, z) {
    const sector = crearSectorTerreno(obtenerSectorIndice(x), obtenerSectorIndice(z));
    const alturaY = obtenerAlturaTerreno(x, z);
    dummy.position.set(x, alturaY, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();

    let mallaModificada;
    if (alturaY <= NIVEL_AGUA) {
        mallaModificada = sector.arena;
        sector.arena.setMatrixAt(sector.arena.count, dummy.matrix);
        const patronDuna = ruido2D(x * 2.7, z * 2.7) * 0.05;
        const esArenaMojada = alturaY <= NIVEL_AGUA - 1;
        const grano = (Math.random() - 0.5) * 0.14;
        if (esArenaMojada) {
            const v = 0.68 + grano + patronDuna;
            colorAux.setRGB(v * 0.72, v * 0.63, v * 0.42);
        } else {
            const v = 0.92 + grano + patronDuna;
            colorAux.setRGB(v * 0.85, v * 0.75, v * 0.48);
        }
        sector.arena.setColorAt(sector.arena.count, colorAux);
        posicionesBloquesArena.push({ x, z, y: alturaY + 0.512 });
        sector.arena.count++;
    } else if (alturaY >= 10) {
        mallaModificada = sector.nieve;
        sector.nieve.setMatrixAt(sector.nieve.count, dummy.matrix);
        const v = 0.95 + Math.random() * 0.05;
        colorAux.setRGB(v, v, v);
        sector.nieve.setColorAt(sector.nieve.count, colorAux);
        sector.nieve.count++;
    } else if (alturaY > 5) {
        mallaModificada = sector.piedra;
        sector.piedra.setMatrixAt(sector.piedra.count, dummy.matrix);
        const v = 0.85 + Math.random() * 0.25;
        colorAux.setRGB(v * 0.95, v * 0.97, v * 1.0);
        sector.piedra.setColorAt(sector.piedra.count, colorAux);
        posicionesBloquesPiedra.push({ x, z, y: alturaY + 0.512 });
        sector.piedra.count++;
    } else {
        mallaModificada = sector.pasto;
        sector.pasto.setMatrixAt(sector.pasto.count, dummy.matrix);
        const v = 0.88 + Math.random() * 0.24;
        colorAux.setRGB(v * 0.42, v * 0.72, v * 0.28);
        sector.pasto.setColorAt(sector.pasto.count, colorAux);
        posicionesBloquesPasto.push({ x, z, y: alturaY + 0.512 });
        sector.pasto.count++;
    }
    return mallaModificada;
}

for (let x = -tamañoMapa; x <= tamañoMapa; x++) {
    for (let z = -tamañoMapa; z <= tamañoMapa; z++) añadirBloqueTerreno(x, z);
}
for (const malla of Object.values(meshesTerreno).flat()) {
    malla.instanceMatrix.needsUpdate = true;
    if (malla.instanceColor) malla.instanceColor.needsUpdate = true;
}

// Pocas manchas de nieve sobre hierba, roca y arena.
const geometriaManchaNieve = new THREE.BoxGeometry(0.18, 0.018, 0.18);
const materialManchaNieve = new THREE.MeshBasicMaterial({ color: 0xf1f3f2 });
function crearManchasNieve(posiciones) {
    const seleccion = posiciones.filter(() => Math.random() < 0.22);
    for (let i = seleccion.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [seleccion[i], seleccion[j]] = [seleccion[j], seleccion[i]];
    }

    const malla = new THREE.InstancedMesh(
        geometriaManchaNieve,
        materialManchaNieve,
        Math.max(1, seleccion.length)
    );
    malla.userData.cantidadManchas = seleccion.length;
    malla.count = seleccion.length;
    for (let i = 0; i < seleccion.length; i++) {
        const bloque = seleccion[i];
        dummy.position.set(
            bloque.x + (Math.random() - 0.5) * 0.82,
            bloque.y,
            bloque.z + (Math.random() - 0.5) * 0.82
        );
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        const escala = 0.45 + Math.random() * 0.8;
        dummy.scale.set(escala, 1, escala);
        dummy.updateMatrix();
        malla.setMatrixAt(i, dummy.matrix);
    }
    malla.instanceMatrix.needsUpdate = true;
    return malla;
}
const asignarManchasPorSector = (tipo, posiciones) => {
    const grupos = new Map();
    for (const bloque of posiciones) {
        const sx = obtenerSectorIndice(bloque.x);
        const sz = obtenerSectorIndice(bloque.z);
        const clave = `${sx},${sz}`;
        if (!grupos.has(clave)) grupos.set(clave, []);
        grupos.get(clave).push(bloque);
    }
    for (const [clave, bloques] of grupos) {
        const sector = sectoresTerreno.get(clave);
        sector.manchas[tipo] = crearManchasNieve(bloques);
        sector.grupo.add(sector.manchas[tipo]);
    }
};
asignarManchasPorSector('pasto', posicionesBloquesPasto);
asignarManchasPorSector('piedra', posicionesBloquesPiedra);
asignarManchasPorSector('arena', posicionesBloquesArena);
const manchasNievePasto = [...sectoresTerreno.values()].map(s => s.manchas.pasto).filter(Boolean);
const manchasNievePiedra = [...sectoresTerreno.values()].map(s => s.manchas.piedra).filter(Boolean);
const manchasNieveArena = [...sectoresTerreno.values()].map(s => s.manchas.arena).filter(Boolean);
const maxManchasNievePasto = manchasNievePasto.reduce((n, m) => n + m.userData.cantidadManchas, 0);
const maxManchasNievePiedra = manchasNievePiedra.reduce((n, m) => n + m.userData.cantidadManchas, 0);
const maxManchasNieveArena = manchasNieveArena.reduce((n, m) => n + m.userData.cantidadManchas, 0);
actualizarSectoresTerreno(0, 0, true);

const aguaGeo = new THREE.PlaneGeometry(tamañoMapa * 2 + 1, tamañoMapa * 2 + 1);
const aguaMat = new THREE.MeshPhongMaterial({
    color: 0x2f8fba,
    transparent: true,
    opacity: 0.65,
    shininess: 100,
    side: THREE.DoubleSide,
    depthWrite: false
});
const agua = new THREE.Mesh(aguaGeo, aguaMat);
agua.rotation.x = -Math.PI / 2;
agua.position.y = NIVEL_AGUA;
scene.add(agua);
const colorAguaNormal = aguaMat.color.clone();
const colorAguaHielo = new THREE.Color(0x8eb2c2);   

function añadirManchasDeExtension(tipo, posiciones, coleccion) {
    const grupos = new Map();
    for (const bloque of posiciones) {
        const clave = `${obtenerSectorIndice(bloque.x)},${obtenerSectorIndice(bloque.z)}`;
        if (!grupos.has(clave)) grupos.set(clave, []);
        grupos.get(clave).push(bloque);
    }
    for (const [clave, bloques] of grupos) {
        const sector = sectoresTerreno.get(clave);
        const malla = crearManchasNieve(bloques);
        malla.count = Math.floor(malla.userData.cantidadManchas * progresoManchasNieve);
        sector.grupo.add(malla);
        coleccion.push(malla);
    }
}

function iniciarExtensionMapa(limiteDestino = TAMAÑO_MAPA_EXTENDIDO) {
    if (tamañoMapa >= limiteDestino) return;
    if (colaExtensionMapa) {
        siguienteLimiteExtension = Math.max(siguienteLimiteExtension || tamañoMapa, limiteDestino);
        return;
    }

    const limiteAnterior = tamañoMapa;
    tamañoMapa = limiteDestino;
    // Añade los pinos cuyas coordenadas entran en el área recién desbloqueada.
    if (typeof generarPinosCoordenadosDentroDelMapa === 'function') {
        generarPinosCoordenadosDentroDelMapa();
    }
    if (typeof generarPilasTroncosDentroDelMapa === 'function') {
        generarPilasTroncosDentroDelMapa();
    }
    indiceInicioPastoExtension = posicionesBloquesPasto.length;
    indiceInicioPiedraExtension = posicionesBloquesPiedra.length;
    indiceInicioArenaExtension = posicionesBloquesArena.length;
    // La geometría del agua conserva el tamaño inicial (41 × 41), así que
    // la escala debe calcularse respecto a ese tamaño, también en la segunda expansión.
    const escalaAgua = (tamañoMapa * 2 + 1) / (TAMAÑO_MAPA_INICIAL * 2 + 1);
    agua.scale.set(escalaAgua, escalaAgua, 1);

    colaExtensionMapa = [];
    for (let x = -tamañoMapa; x <= tamañoMapa; x++) {
        for (let z = -tamañoMapa; z <= tamañoMapa; z++) {
            if (Math.abs(x) <= limiteAnterior && Math.abs(z) <= limiteAnterior) continue;
            const dxFogata = x - fogata.position.x;
            const dzFogata = z - fogata.position.z;
            colaExtensionMapa.push({ x, z, distanciaFogataCuadrada: dxFogata * dxFogata + dzFogata * dzFogata });
        }
    }
    colaExtensionMapa.sort((a, b) => a.distanciaFogataCuadrada - b.distanciaFogataCuadrada);
    indiceExtensionMapa = 0;
}

function procesarExtensionMapa() {
    if (!colaExtensionMapa) return;

    const mallasTocadas = new Set();
    const limite = Math.min(indiceExtensionMapa + BLOQUES_EXTENSION_POR_FOTOGRAMA, colaExtensionMapa.length);
    const inicioProcesamiento = performance.now();
    let bloquesProcesados = 0;

    while (indiceExtensionMapa < limite
        && (bloquesProcesados < 16
            || bloquesProcesados % 16 !== 0
            || performance.now() - inicioProcesamiento < PRESUPUESTO_EXTENSION_MS)) {
        const bloque = colaExtensionMapa[indiceExtensionMapa++];
        mallasTocadas.add(añadirBloqueTerreno(bloque.x, bloque.z));
        bloquesProcesados++;
    }

    for (const malla of mallasTocadas) {
        malla.instanceMatrix.needsUpdate = true;
        malla.instanceColor.needsUpdate = true;
        malla.boundingSphere = null;
    }

    // Los sectores recién creados necesitan calcular visibilidad una vez.
    // Los bloques añadidos a sectores existentes ya aparecen en sus mallas visibles.
    if (sectoresTerrenoNuevos) {
        actualizarSectoresTerreno(
            controles.getObject().position.x,
            controles.getObject().position.z,
            true,
            pollos.filter(pollo => pollo.vivo && pollo.grupo).map(pollo => pollo.grupo.position)
        );
    }

    if (indiceExtensionMapa < colaExtensionMapa.length) return;

    añadirManchasDeExtension('pasto', posicionesBloquesPasto.slice(indiceInicioPastoExtension), manchasNievePasto);
    añadirManchasDeExtension('piedra', posicionesBloquesPiedra.slice(indiceInicioPiedraExtension), manchasNievePiedra);
    añadirManchasDeExtension('arena', posicionesBloquesArena.slice(indiceInicioArenaExtension), manchasNieveArena);
    colaExtensionMapa = null;
    if (typeof generarCabanaDentroDelMapa === 'function') {
        generarCabanaDentroDelMapa();
    }
    if (siguienteLimiteExtension !== null) {
        const limitePendiente = siguienteLimiteExtension;
        siguienteLimiteExtension = null;
        iniciarExtensionMapa(limitePendiente);
    }
}
