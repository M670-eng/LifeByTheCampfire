// --- 4. VEGETACIÓN, PIEDRAS Y SOMBRAS SIMPLES ---
const troncoGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.0, 4);
const hojasGeo = new THREE.ConeGeometry(0.6, 2.5, 5);
const piedraGeo = new THREE.DodecahedronGeometry(0.35, 0);

const pastoDecorativoGeo = new THREE.ConeGeometry(0.15, 0.38, 4);
pastoDecorativoGeo.translate(0, 0.19, 0); 

const geoSombraCirculo = new THREE.RingGeometry(0, 0.55, 16);
const geoSombraHexagono = new THREE.RingGeometry(0, 1.0, 6);

geoSombraCirculo.rotateX(-Math.PI / 2);
geoSombraHexagono.rotateX(-Math.PI / 2);

const matSombraFalsa = new THREE.MeshBasicMaterial({
    color: 0x111612,
    transparent: true,
    opacity: 0.4,
    depthWrite: false
});

const matTronco = new THREE.MeshPhongMaterial({ color: 0x5d4037, flatShading: true });
const matHojas = new THREE.MeshPhongMaterial({ color: 0x1b5e20, flatShading: true });

const matPiedraOscura = new THREE.MeshPhongMaterial({ color: 0x263238, flatShading: true });
const matPiedraMusgo = new THREE.MeshPhongMaterial({ color: 0x37474f, flatShading: true });
const matPiedraCaliza = new THREE.MeshPhongMaterial({ color: 0x90a4ae, flatShading: true });

const matPastoDecorativo = new THREE.MeshPhongMaterial({ color: 0x3b6331, flatShading: true, shininess: 5 });

// Decoración automática desactivada: los árboles, rocas y hierba se colocarán
// manualmente mediante coordenadas en una siguiente iteración.
const cantArboles = 0;
const cantPiedrasPorTipo = 0;
const cantPastoDecorativo = 0; 

const instancedSombrasArbol = new THREE.InstancedMesh(geoSombraCirculo, matSombraFalsa, cantArboles);
const instancedSombrasRoca1 = new THREE.InstancedMesh(geoSombraHexagono, matSombraFalsa, cantPiedrasPorTipo);
const instancedSombrasRoca2 = new THREE.InstancedMesh(geoSombraHexagono, matSombraFalsa, cantPiedrasPorTipo);
const instancedSombrasRoca3 = new THREE.InstancedMesh(geoSombraHexagono, matSombraFalsa, cantPiedrasPorTipo);

const instancedTroncos = new THREE.InstancedMesh(troncoGeo, matTronco, cantArboles);
const instancedHojas = new THREE.InstancedMesh(hojasGeo, matHojas, cantArboles);

const instancedPiedras1 = new THREE.InstancedMesh(piedraGeo, matPiedraOscura, cantPiedrasPorTipo);
const instancedPiedras2 = new THREE.InstancedMesh(piedraGeo, matPiedraMusgo, cantPiedrasPorTipo);
const instancedPiedras3 = new THREE.InstancedMesh(piedraGeo, matPiedraCaliza, cantPiedrasPorTipo);

const instancedPastoDecorativo = new THREE.InstancedMesh(pastoDecorativoGeo, matPastoDecorativo, cantPastoDecorativo);

const posicionesArboles = [];
const distanciaMinArboles = 3.5;
const pendienteMaxArboles = 1;

function terrenoAptoParaArbol(x, z) {
    const centro = obtenerAlturaTerreno(x, z);
    if (centro <= NIVEL_AGUA) return false;
    if (centro > 5) return false;

    const h1 = obtenerAlturaTerreno(x + 1, z);
    const h2 = obtenerAlturaTerreno(x - 1, z);
    const h3 = obtenerAlturaTerreno(x, z + 1);
    const h4 = obtenerAlturaTerreno(x, z - 1);
    const pendiente = Math.max(Math.abs(centro - h1), Math.abs(centro - h2), Math.abs(centro - h3), Math.abs(centro - h4));
    if (pendiente > pendienteMaxArboles) return false;
    
    for (const arbol of posicionesArboles) {
        if (Math.sqrt((x - arbol.x)**2 + (z - arbol.z)**2) < distanciaMinArboles) return false;
    }
    return true;
}

function buscarPosicionArbolSegura() {
    for (let intento = 0; intento < 150; intento++) {
        let rx = Math.floor((Math.random() - 0.5) * (tamañoMapa * 1.6));
        let rz = Math.floor((Math.random() - 0.5) * (tamañoMapa * 1.6));
        if (Math.abs(rx) < 3 && Math.abs(rz) < 3) rx += 4;
        if (terrenoAptoParaArbol(rx, rz)) return { x: rx, z: rz, y: obtenerAlturaTerreno(rx, rz), valido: true };
    }
    return { x: 0, z: 0, y: 0, valido: false };
}

let arbolesColocadosRealmente = 0;
for (let i = 0; i < cantArboles; i++) {
    const pos = buscarPosicionArbolSegura();
    if(!pos.valido) continue;

    posicionesArboles.push({ x: pos.x, z: pos.z });

    dummy.position.set(pos.x, pos.y + 1.0, pos.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    instancedTroncos.setMatrixAt(arbolesColocadosRealmente, dummy.matrix);

    dummy.position.set(pos.x, pos.y + 2.75, pos.z);
    dummy.updateMatrix();
    instancedHojas.setMatrixAt(arbolesColocadosRealmente, dummy.matrix);

    dummy.position.set(pos.x, pos.y + 0.505, pos.z);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    instancedSombrasArbol.setMatrixAt(arbolesColocadosRealmente, dummy.matrix);
    
    arbolesColocadosRealmente++;
}
instancedTroncos.count = arbolesColocadosRealmente;
instancedHojas.count = arbolesColocadosRealmente;
instancedSombrasArbol.count = arbolesColocadosRealmente;

function esparcirPiedrasYSombras(instancedMesh, instancedSombraMesh, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        let rx = Math.floor((Math.random() - 0.5) * (tamañoMapa * 1.6));
        let rz = Math.floor((Math.random() - 0.5) * (tamañoMapa * 1.6));
        let ry = obtenerAlturaTerreno(rx, rz);

        if (ry <= NIVEL_AGUA) {
            i--;
            continue;
        }

        let escalaRnd = 0.7 + Math.random() * 0.5;

        dummy.position.set(rx, ry + 0.7, rz);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        dummy.scale.set(escalaRnd, escalaRnd, escalaRnd);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);

        dummy.position.set(rx, ry + 0.505, rz);
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        let escalaSombra = escalaRnd * 0.45;
        dummy.scale.set(escalaSombra, 1, escalaSombra);
        dummy.updateMatrix();
        instancedSombraMesh.setMatrixAt(i, dummy.matrix);
    }
}

esparcirPiedrasYSombras(instancedPiedras1, instancedSombrasRoca1, cantPiedrasPorTipo);
esparcirPiedrasYSombras(instancedPiedras2, instancedSombrasRoca2, cantPiedrasPorTipo);
esparcirPiedrasYSombras(instancedPiedras3, instancedSombrasRoca3, cantPiedrasPorTipo);

let pastoColocadoRealmente = 0;
for (let intento = 0; intento < 600 && pastoColocadoRealmente < cantPastoDecorativo; intento++) {
    let rx = Math.floor((Math.random() - 0.5) * (tamañoMapa * 1.6));
    let rz = Math.floor((Math.random() - 0.5) * (tamañoMapa * 1.6));
    let ry = obtenerAlturaTerreno(rx, rz);

    if (ry > NIVEL_AGUA && ry <= 5 && !(Math.abs(rx) < 3 && Math.abs(rz) < 3)) {
        let escalaRnd = 0.6 + Math.random() * 0.7;
        let offsetX = (Math.random() - 0.5) * 0.35;
        let offsetZ = (Math.random() - 0.5) * 0.35;

        dummy.position.set(rx + offsetX, ry + 0.5, rz + offsetZ);
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        dummy.scale.set(escalaRnd, escalaRnd, escalaRnd);
        dummy.updateMatrix();
        
        instancedPastoDecorativo.setMatrixAt(pastoColocadoRealmente, dummy.matrix);
        pastoColocadoRealmente++;
    }
}
instancedPastoDecorativo.count = pastoColocadoRealmente;

scene.add(instancedSombrasArbol);
scene.add(instancedSombrasRoca1);
scene.add(instancedSombrasRoca2);
scene.add(instancedSombrasRoca3);
scene.add(instancedTroncos);
scene.add(instancedHojas);
scene.add(instancedPiedras1);
scene.add(instancedPiedras2);
scene.add(instancedPiedras3);
scene.add(instancedPastoDecorativo); 

//* Primeros objetos colocados manualmente: coordenadas X y Z de ejemplo 
const pino = { x: 0, z: 0 }; 
const roca = { x: 13, z: 8 };
const hierba = { x: 8, z: 10 };

// El terreno determina automáticamente la altura Y
const yRoca = obtenerAlturaTerreno(roca.x, roca.z);
const yHierba = obtenerAlturaTerreno(hierba.x, hierba.z);

const pinosManuales = [];
const RADIO_CARGA_PINOS = 54;
const RADIO_DESCARGA_PINOS = 62;
const DISTANCIA_ACTUALIZACION_CARGA_PINOS = 4;
let ultimaPosicionCargaPinos = null;
const GOLPES_PARA_TALAR_PINO = 10;
const COORDENADAS_PILAS_TRONCOS = [{ x: 27, z: 7 }, { x: 19, z: -26 }];
const RADIO_SEPARACION_PILA_PINO = 5.5;

function cercaDeUnaPilaDeTroncos(x, z) {
    return COORDENADAS_PILAS_TRONCOS.some(pila =>
        Math.hypot(x - pila.x, z - pila.z) < RADIO_SEPARACION_PILA_PINO
    );
}

function crearPinoManual(x, z) {
    // No coloques árboles en coordenadas que todavía estén fuera del mapa activo.
    if (Math.abs(x) > tamañoMapa || Math.abs(z) > tamañoMapa) return null;
    if (cercaDeUnaPilaDeTroncos(x, z)) return null;
    const altura = obtenerAlturaTerreno(x, z);
    // La punta de la copa llega a altura + 3.5; mantenemos el pino entero bajo Y=8.
    if (altura <= 0 || altura + 3.5 >= 9) return null;

    const tronco = new THREE.Mesh(troncoGeo, matTronco);
    tronco.position.set(x, altura + 0.5, z);
    scene.add(tronco);

    const copa = new THREE.Mesh(hojasGeo, matHojas);
    copa.position.set(x, altura + 2.25, z);
    scene.add(copa);

    const pinoCreado = {
        tronco, copa, golpes: 0, talado: false, sacudida: 0,
        cargado: true,
        rotacionBaseTronco: { x: tronco.rotation.x, z: tronco.rotation.z },
        rotacionBaseCopa: { x: copa.rotation.x, z: copa.rotation.z }
    };
    pinosManuales.push(pinoCreado);
    return pinoCreado;
}

function actualizarCargaPinos(posicionJugador) {
    if (ultimaPosicionCargaPinos) {
        const dx = posicionJugador.x - ultimaPosicionCargaPinos.x;
        const dz = posicionJugador.z - ultimaPosicionCargaPinos.z;
        if (dx * dx + dz * dz < DISTANCIA_ACTUALIZACION_CARGA_PINOS ** 2) return;
    }
    ultimaPosicionCargaPinos = { x: posicionJugador.x, z: posicionJugador.z };

    const radioCargaCuadrado = RADIO_CARGA_PINOS ** 2;
    const radioDescargaCuadrado = RADIO_DESCARGA_PINOS ** 2;
    for (const pino of pinosManuales) {
        if (pino.talado) continue;
        const dx = pino.tronco.position.x - posicionJugador.x;
        const dz = pino.tronco.position.z - posicionJugador.z;
        const distanciaCuadrada = dx * dx + dz * dz;
        const cargado = pino.cargado
            ? distanciaCuadrada <= radioDescargaCuadrado
            : distanciaCuadrada <= radioCargaCuadrado;
        if (cargado === pino.cargado) continue;
        pino.cargado = cargado;
        pino.tronco.visible = cargado;
        pino.copa.visible = cargado;
    }
}

const particulasGolpe = [];
const geoPlumaGolpe = new THREE.SphereGeometry(0.055, 5, 4);
const geoHojaGolpe = new THREE.IcosahedronGeometry(0.065, 0);
const matPlumaGolpe = new THREE.MeshPhongMaterial({ color: 0xfff2c2, flatShading: true });
const matHojaGolpe = new THREE.MeshPhongMaterial({ color: 0x4f9b36, flatShading: true });

function emitirParticulasGolpe(tipo, punto, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        const pluma = tipo === 'pluma';
        const malla = new THREE.Mesh(pluma ? geoPlumaGolpe : geoHojaGolpe, pluma ? matPlumaGolpe : matHojaGolpe);
        malla.position.copy(punto);
        malla.position.y += 0.04;
        if (pluma) malla.scale.set(0.62, 1.8, 0.45);
        const angulo = Math.random() * Math.PI * 2;
        const velocidad = pluma ? 1.1 + Math.random() * 1.2 : 0.8 + Math.random() * 1.5;
        particulasGolpe.push({
            malla,
            velocidad: new THREE.Vector3(Math.cos(angulo) * velocidad, 1.4 + Math.random() * 1.5, Math.sin(angulo) * velocidad),
            vida: 0.55 + Math.random() * 0.3,
            vidaMaxima: 0.85,
            gravedad: pluma ? 4.8 : 5.8,
            giro: (Math.random() - 0.5) * 9
        });
        scene.add(malla);
    }
}

function actualizarParticulasGolpe(dt) {
    for (let i = particulasGolpe.length - 1; i >= 0; i--) {
        const particula = particulasGolpe[i];
        particula.vida -= dt;
        if (particula.vida <= 0) {
            scene.remove(particula.malla);
            particulasGolpe.splice(i, 1);
            continue;
        }
        particula.velocidad.y -= particula.gravedad * dt;
        particula.malla.position.addScaledVector(particula.velocidad, dt);
        particula.malla.rotation.x += particula.giro * dt;
        particula.malla.rotation.z += particula.giro * dt * 0.7;
        if (particula.vida < 0.18) {
            particula.malla.scale.multiplyScalar(Math.max(0.75, particula.vida / 0.18));
        }
    }
}

function actualizarSacudidaPinos(dt) {
    for (const pino of pinosManuales) {
        if (pino.talado) continue;
        pino.sacudida = Math.max(0, pino.sacudida - dt);
        const progreso = pino.sacudida > 0 ? pino.sacudida / 0.38 : 0;
        const bamboleo = Math.sin((1 - progreso) * Math.PI * 7) * progreso * 0.075;
        pino.tronco.rotation.z = pino.rotacionBaseTronco.z + bamboleo;
        pino.tronco.rotation.x = pino.rotacionBaseTronco.x + bamboleo * 0.45;
        pino.copa.rotation.z = pino.rotacionBaseCopa.z + bamboleo * 1.35;
        pino.copa.rotation.x = pino.rotacionBaseCopa.x + bamboleo * 0.8;
    }
}
crearPinoManual(pino.x, pino.z);

//* CREACION DE LOS PINOS

[[6, -4], [-4, 4], [-6, -5], [0, 9], [8, 8], [12, 0], [-10, 8], [10, -15], [14, 8], [-18, -2], [16, 18]].forEach(([x, z]) => crearPinoManual(x, z));

// 70 pinos nuevos: coordenadas X/Z hasta el radio 120.
// La altura Y de todo el pino, incluida la punta de la copa, queda entre 0 y 7.
const coordenadasNuevosPinos = [
    [66, 12], [-120, -120], [-102, 120], [24, -120], [-66, 0], [0, 90], [120, -66], [-120, 48], [-48, -120], [0, -6],
    [54, -48], [120, 36], [-48, 120], [-24, 42], [108, -18], [42, 66], [78, -84], [30, -78], [12, 30], [-102, 18],
    [90, -48], [-54, 30], [-30, 6], [6, 60], [36, 6], [60, -18], [-30, 96], [-6, -120], [48, 36], [96, 12],
    [-78, 108], [18, -54], [-78, 24], [84, -24], [114, -42], [-96, -120], [48, -120], [-90, 0], [-12, 18], [60, -72],
    [96, -72], [-48, 12], [-24, 114], [-6, 36], [6, 12], [24, 72], [72, -54], [78, -6], [102, 30], [-102, 36],
    [-30, 24], [18, -6], [114, 12], [-66, 120], [-18, -6], [-6, 72], [36, -108], [48, -6], [48, 18], [66, -36],
    [78, 24], [96, -6], [-90, 114], [-84, 12], [-66, 18], [-60, 108], [-42, 36], [-42, 102], [-18, 30], [-18, 102]
];
// 30 pinos adicionales en terreno con altura Y entre 1 y 3.
const coordenadasPinosAlturaBaja = [
    [9, -113], [62, 28], [93, -89], [33, -57], [6, 44], [-113, 27], [100, -39], [7, 74], [107, -64], [47, -19],
    [-78, -5], [-37, 114], [35, 78], [60, -59], [91, 24], [114, 25], [-108, -117], [83, 13], [35, 18], [36, -120],
    [31, 62], [56, -29], [-113, 39], [-99, 7], [-41, 3], [-11, 93], [25, 3], [41, -75], [71, -75], [83, -94]
];
// 4 pinos reservados para la expansión del nivel 2 (fuera del radio inicial de 20).
const coordenadasPinosNivel2 = [[-29, -5], [43, 27], [26, 13], [43, 44]];
const pinosNuevosGenerados = new Set();
function generarPinosCoordenadosDentroDelMapa() {
    for (const [x, z] of [...coordenadasNuevosPinos, ...coordenadasPinosAlturaBaja, ...coordenadasPinosNivel2]) {
        const clave = `${x},${z}`;
        if (pinosNuevosGenerados.has(clave)) continue;
        if (crearPinoManual(x, z)) pinosNuevosGenerados.add(clave);
    }
}
generarPinosCoordenadosDentroDelMapa();

// Pilas de troncos: diez troncos colocados en filas triangulares.
const RADIO_TRONCO_APILADO = 0.165;
const LARGO_TRONCO_APILADO = 1.75;
const geometriaTroncoApilado = new THREE.CylinderGeometry(
    RADIO_TRONCO_APILADO, RADIO_TRONCO_APILADO, LARGO_TRONCO_APILADO, 10, 1, false
);
geometriaTroncoApilado.rotateZ(Math.PI / 2);
const materialCorteTronco = new THREE.MeshPhongMaterial({ color: 0xd9b887, flatShading: true });
const materialAnillosTronco = new THREE.MeshPhongMaterial({ color: 0xb99668, flatShading: true });
const geometriaAnilloTronco = new THREE.RingGeometry(0.105, 0.132, 12);
const geometriaNudoTronco = new THREE.SphereGeometry(0.026, 6, 4);
const materialNudoTronco = new THREE.MeshPhongMaterial({ color: 0x49332b, flatShading: true });
const variacionesCortezaTronco = [0x5d4037, 0x63473b, 0x584037, 0x60443a];
const pilasTroncos = [];

function crearPilaTroncos(x, z) {
    const alturaTerreno = obtenerAlturaTerreno(x, z);
    if (alturaTerreno <= NIVEL_AGUA) return null;

    const grupo = new THREE.Group();
    const superficie = alturaTerreno + 0.5;
    const filas = [4, 3, 2, 1];
    let indiceTronco = 0;
    filas.forEach((cantidad, nivel) => {
        for (let indice = 0; indice < cantidad; indice++) {
            const materialCorteza = matTronco.clone();
            materialCorteza.color.setHex(variacionesCortezaTronco[indiceTronco % variacionesCortezaTronco.length]);
            const tronco = new THREE.Mesh(
                geometriaTroncoApilado,
                [materialCorteza, materialCorteTronco, materialCorteTronco]
            );
            tronco.position.set(
                0,
                superficie + RADIO_TRONCO_APILADO + nivel * 0.29,
                (indice - (cantidad - 1) / 2) * 0.32
            );

            // Un anillo tenue en cada extremo y un pequeño nudo en la corteza.
            for (const lado of [-1, 1]) {
                const anillo = new THREE.Mesh(geometriaAnilloTronco, materialAnillosTronco);
                anillo.position.x = lado * (LARGO_TRONCO_APILADO / 2 + 0.001);
                anillo.rotation.y = lado * Math.PI / 2;
                tronco.add(anillo);
            }
            const nudo = new THREE.Mesh(geometriaNudoTronco, materialNudoTronco);
            nudo.position.set(-0.28 + (indiceTronco % 3) * 0.24, 0.035, RADIO_TRONCO_APILADO * 0.94);
            nudo.scale.set(1.7, 0.8, 0.35);
            tronco.add(nudo);
            grupo.add(tronco);
            indiceTronco++;
        }
    });
    grupo.position.set(x, 0, z);
    scene.add(grupo);
    const pila = { x, z, grupo, recogida: false };
    pilasTroncos.push(pila);
    return pila;
}

function generarPilasTroncosDentroDelMapa() {
    for (const posicion of COORDENADAS_PILAS_TRONCOS) {
        if (Math.abs(posicion.x) > tamañoMapa || Math.abs(posicion.z) > tamañoMapa) continue;
        if (pilasTroncos.some(pila => pila.x === posicion.x && pila.z === posicion.z)) continue;
        crearPilaTroncos(posicion.x, posicion.z);
    }
}

function recogerMaderaDePila() {
    const jugador = controles.getObject().position;
    const pilaCercana = pilasTroncos.find(pila =>
        !pila.recogida && Math.hypot(jugador.x - pila.x, jugador.z - pila.z) <= 3.5
    );
    if (!pilaCercana) return false;

    const maderaActual = [...hotbar, ...inventario]
        .reduce((total, item) => total + (item && item.id === 'Madera' ? item.cantidad : 0), 0);
    if (maderaActual >= 5) {
        return true;
    }

    if (!agregarItemAlInventario('Madera', '🪵', 10)) {
        return true;
    }

    pilaCercana.recogida = true;
    scene.remove(pilaCercana.grupo);
    return true;
}
generarPilasTroncosDentroDelMapa();

// Roca
const rocaManual = new THREE.Mesh(piedraGeo, matPiedraOscura);
rocaManual.position.set(roca.x, yRoca + 0.7, roca.z);
scene.add(rocaManual);

// Hierba decorativa
const hierbaManual = new THREE.Mesh(pastoDecorativoGeo, matPastoDecorativo);
hierbaManual.position.set(hierba.x, yHierba + 0.5, hierba.z);
scene.add(hierbaManual);
