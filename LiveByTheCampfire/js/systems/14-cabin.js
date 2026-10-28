// --- CABAÑA ABANDONADA ---
const POSICION_CABANA = { x: 18, z: 87 };
const colisionesCasa = [];
let cabanaCreada = false;
let celularCabanaInteractuable = null;

const materialParedCabana = new THREE.MeshPhongMaterial({ color: 0x604638, flatShading: true });
const materialRellenoParedCabana = new THREE.MeshPhongMaterial({ color: 0x49372d, flatShading: true });
const materialesParedCabana = [
    materialParedCabana,
    new THREE.MeshPhongMaterial({ color: 0x684b3a, flatShading: true }),
    new THREE.MeshPhongMaterial({ color: 0x584033, flatShading: true })
];
const materialSueloCabana = new THREE.MeshPhongMaterial({ color: 0x594332, flatShading: true });
const materialTechoCabana = new THREE.MeshPhongMaterial({ color: 0x382d27, flatShading: true });
const materialMarcoCabana = new THREE.MeshPhongMaterial({ color: 0x392b22, flatShading: true });
const materialPuertaCabana = new THREE.MeshPhongMaterial({ color: 0x50382a, flatShading: true });
const materialCorteCabana = new THREE.MeshPhongMaterial({ color: 0xa77f54, flatShading: true });
const materialPiedraEntradaCabana = new THREE.MeshPhongMaterial({ color: 0x5b5c56, flatShading: true });
const materialMetalCabana = new THREE.MeshPhongMaterial({ color: 0x39332b, flatShading: true });
const materialColchonCabana = new THREE.MeshPhongMaterial({ color: 0xb5a58d, flatShading: true });
const materialFundaColchonCabana = new THREE.MeshPhongMaterial({ color: 0xc9bba5, flatShading: true });
const materialMovilCabana = new THREE.MeshPhongMaterial({ color: 0x24282b, flatShading: true });
const materialPantallaMovilCabana = new THREE.MeshPhongMaterial({ color: 0x577b83, flatShading: true });

const geoTroncoParedHorizontal = new THREE.CylinderGeometry(0.19, 0.19, 7.25, 7);
geoTroncoParedHorizontal.rotateZ(Math.PI / 2);
geoTroncoParedHorizontal.clearGroups();
const geoTroncoParedLateral = new THREE.CylinderGeometry(0.19, 0.19, 6.55, 7);
geoTroncoParedLateral.rotateX(Math.PI / 2);
geoTroncoParedLateral.clearGroups();
const geoTroncoFrenteCorto = new THREE.CylinderGeometry(0.19, 0.19, 2.1, 7);
geoTroncoFrenteCorto.rotateZ(Math.PI / 2);
geoTroncoFrenteCorto.clearGroups();

function añadirVigaCabana(grupo, geometria, material, x, y, z, rotacionY = 0) {
    const viga = new THREE.Mesh(geometria, material);
    viga.position.set(x, y, z);
    viga.rotation.y = rotacionY;
    grupo.add(viga);
    return viga;
}

function añadirColisionCasa(minX, maxX, minZ, maxZ, minY, maxY) {
    colisionesCasa.push({
        minX: POSICION_CABANA.x + minX,
        maxX: POSICION_CABANA.x + maxX,
        minZ: POSICION_CABANA.z + minZ,
        maxZ: POSICION_CABANA.z + maxZ,
        minY,
        maxY
    });
}

function combinarMallasEstaticasCabana(grupo) {
    grupo.updateMatrixWorld(true);
    const inversaGrupo = grupo.matrixWorld.clone().invert();
    const piezasPorMaterial = new Map();
    const mallasOriginales = [];

    grupo.traverse(pieza => {
        if (!pieza.isMesh || pieza.isInstancedMesh || pieza.userData.interactuable || Array.isArray(pieza.material)) return;
        const geometria = pieza.geometry.toNonIndexed().clone();
        geometria.applyMatrix4(inversaGrupo.clone().multiply(pieza.matrixWorld));

        const idMaterial = pieza.material.uuid;
        if (!piezasPorMaterial.has(idMaterial)) {
            piezasPorMaterial.set(idMaterial, { material: pieza.material, atributos: {} });
        }
        const conjunto = piezasPorMaterial.get(idMaterial);
        for (const [nombre, atributo] of Object.entries(geometria.attributes)) {
            if (!conjunto.atributos[nombre]) conjunto.atributos[nombre] = [];
            const destino = conjunto.atributos[nombre];
            for (let i = 0; i < atributo.array.length; i++) destino.push(atributo.array[i]);
        }
        mallasOriginales.push(pieza);
    });

    for (const malla of mallasOriginales) malla.parent.remove(malla);
    for (const conjunto of piezasPorMaterial.values()) {
        const geometriaCombinada = new THREE.BufferGeometry();
        for (const [nombre, valores] of Object.entries(conjunto.atributos)) {
            const tamaño = nombre === 'uv' ? 2 : 3;
            geometriaCombinada.setAttribute(nombre, new THREE.Float32BufferAttribute(valores, tamaño));
        }
        geometriaCombinada.computeBoundingSphere();
        grupo.add(new THREE.Mesh(geometriaCombinada, conjunto.material));
    }
}

function generarCabanaDentroDelMapa() {
    if (cabanaCreada
        || Math.abs(POSICION_CABANA.x) + 4 > tamañoMapa
        || Math.abs(POSICION_CABANA.z) + 4 > tamañoMapa) return;

    const alturas = [];
    for (let x = -3; x <= 3; x++) {
        for (let z = -3; z <= 3; z++) alturas.push(obtenerAlturaTerreno(POSICION_CABANA.x + x, POSICION_CABANA.z + z));
    }
    const alturaSuelo = Math.max(...alturas);
    const alturaMinima = Math.min(...alturas);
    if (alturas.some(altura => altura <= NIVEL_AGUA) || alturaSuelo - alturaMinima > 1) return;

    cabanaCreada = true;
    const grupo = new THREE.Group();
    grupo.position.set(POSICION_CABANA.x, alturaSuelo + 0.5, POSICION_CABANA.z);
    scene.add(grupo);

    // Suelo de tablones y vigas de apoyo.
    const suelo = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.16, 7.4), materialSueloCabana);
    suelo.position.set(0, 0.08, 0);
    grupo.add(suelo);
    for (const z of [-3.15, 3.15]) {
        const apoyo = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.22, 0.28), materialMarcoCabana);
        apoyo.position.set(0, -0.05, z);
        grupo.add(apoyo);
    }
    for (let z = -3.15; z <= 3.16; z += 0.48) {
        const tabla = new THREE.Mesh(new THREE.BoxGeometry(7.18, 0.045, 0.43), materialSueloCabana);
        tabla.position.set(0, 0.18, z);
        grupo.add(tabla);
    }

    // Muros formados por troncos horizontales. La pared delantera deja libre la puerta.
    const niveles = 6;
    for (let nivel = 0; nivel < niveles; nivel++) {
        const y = 0.38 + nivel * 0.39;
        const material = materialesParedCabana[nivel % materialesParedCabana.length];
        añadirVigaCabana(grupo, geoTroncoParedHorizontal, material, 0, y, -3.18);
        añadirVigaCabana(grupo, geoTroncoParedLateral, material, -3.18, y, 0);
        añadirVigaCabana(grupo, geoTroncoParedLateral, material, 3.18, y, 0);

        if (nivel < 5) {
            añadirVigaCabana(grupo, geoTroncoFrenteCorto, material, -2.25, y, 3.18);
            añadirVigaCabana(grupo, geoTroncoFrenteCorto, material, 2.25, y, 3.18);
        } else {
            añadirVigaCabana(grupo, geoTroncoParedHorizontal, material, 0, y, 3.18);
        }
    }

    // Paneles opacos detrás de los troncos para cerrar las juntas desde ambos lados.
    const panelLateral = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.42, 6.2), materialRellenoParedCabana);
    for (const x of [-3.12, 3.12]) {
        const paredLateral = panelLateral.clone();
        paredLateral.position.set(x, 1.55, 0);
        grupo.add(paredLateral);
    }
    const paredTrasera = new THREE.Mesh(new THREE.BoxGeometry(6.2, 2.42, 0.1), materialRellenoParedCabana);
    paredTrasera.position.set(0, 1.55, -3.12);
    grupo.add(paredTrasera);
    // Deja despejado el hueco de entrada y conserva la puerta entreabierta.
    for (const x of [-2.05, 2.05]) {
        const lateralEntrada = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.42, 0.1), materialRellenoParedCabana);
        lateralEntrada.position.set(x, 1.55, 3.12);
        grupo.add(lateralEntrada);
    }

    //! esto es muy importante
    // Frontones de troncos apilados, a juego con las paredes.
    for (const z of [-3.18, 3.18]) {
        for (let fila = 0; fila < 6; fila++) {
            const y = 2.62 + fila * 0.27;
            const ancho = Math.max(0.45, 2.85 * (1 - (y - 2.62) / 1.62));
            const geometriaTroncoFronton = new THREE.CylinderGeometry(0.16, 0.16, ancho * 2, 7);
            geometriaTroncoFronton.clearGroups();
            const troncoFronton = new THREE.Mesh(geometriaTroncoFronton, materialesParedCabana[fila % materialesParedCabana.length]);
            troncoFronton.rotation.z = Math.PI / 2;
            troncoFronton.position.set(0, y, z);
            grupo.add(troncoFronton);
        }
    }
    const formaRellenoFronton = new THREE.Shape();
    formaRellenoFronton.moveTo(-2.9, 0);
    formaRellenoFronton.lineTo(2.9, 0);
    formaRellenoFronton.lineTo(0, 1.55);
    formaRellenoFronton.closePath();
    const geoRellenoFronton = new THREE.ShapeGeometry(formaRellenoFronton);
    for (const z of [-3.1, 3.1]) {
        const rellenoFronton = new THREE.Mesh(geoRellenoFronton, materialRellenoParedCabana);
        rellenoFronton.position.set(0, 2.55, z);
        if (z < 0) rellenoFronton.rotation.y = Math.PI;
        grupo.add(rellenoFronton);
    }

    // Techo a dos aguas con aleros anchos.
    const faldonTechoGeo = new THREE.BoxGeometry(3.9, 0.22, 7.55);
    const inclinacionTecho = Math.atan2(1.82, 3.05);
    const faldonIzquierdo = new THREE.Mesh(faldonTechoGeo, materialTechoCabana);
    faldonIzquierdo.position.set(-1.6, 3.2, 0);
    faldonIzquierdo.rotation.z = inclinacionTecho;
    grupo.add(faldonIzquierdo);
    const faldonDerecho = new THREE.Mesh(faldonTechoGeo, materialTechoCabana);
    faldonDerecho.position.set(1.6, 3.2, 0);
    faldonDerecho.rotation.z = -inclinacionTecho;
    grupo.add(faldonDerecho);

    // Puerta cerrada y ajustada al hueco que dejan los troncos.
    const hojaPuerta = new THREE.Group();
    hojaPuerta.position.set(0, 0, 3.08);
    grupo.add(hojaPuerta);
    const puerta = new THREE.Mesh(new THREE.BoxGeometry(2.34, 2.08, 0.12), materialPuertaCabana);
    puerta.position.set(0, 1.04, 0);
    hojaPuerta.add(puerta);
    for (let indice = 0; indice < 8; indice++) {
        const tablaPuerta = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.98, 0.035), materialesParedCabana[indice % 3]);
        tablaPuerta.position.set(-1.0 + indice * 0.285, 1.04, 0.078);
        hojaPuerta.add(tablaPuerta);
        const tablaReverso = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.98, 0.035), materialesParedCabana[(indice + 1) % 3]);
        tablaReverso.position.set(-1.0 + indice * 0.285, 1.04, -0.078);
        hojaPuerta.add(tablaReverso);
    }
    for (const y of [0.12, 1.96]) {
        const travesaño = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.12, 0.08), materialMarcoCabana);
        travesaño.position.set(0, y, 0.09);
        hojaPuerta.add(travesaño);
        const travesañoReverso = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.12, 0.08), materialMarcoCabana);
        travesañoReverso.position.set(0, y, -0.09);
        hojaPuerta.add(travesañoReverso);
    }
    const refuerzoReverso = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.11, 0.07), materialMarcoCabana);
    refuerzoReverso.position.set(0, 1.04, -0.1);
    refuerzoReverso.rotation.z = -Math.atan2(1.65, 2.1);
    hojaPuerta.add(refuerzoReverso);
    for (const y of [0.35, 1.72]) {
        const bisagra = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.07, 0.035), materialMetalCabana);
        bisagra.position.set(-1.02, y, 0.14);
        hojaPuerta.add(bisagra);
    }
    const pomo = new THREE.Mesh(new THREE.SphereGeometry(0.07, 7, 5), materialCorteCabana);
    pomo.position.set(0.92, 1.04, 0.15);
    hojaPuerta.add(pomo);

    // Colchón sencillo en la esquina interior izquierda del fondo.
    const colchon = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.28, 2.0), materialColchonCabana);
    colchon.position.set(-2.05, 0.36, -1.92);
    grupo.add(colchon);
    const fundaColchon = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.06, 1.88), materialFundaColchonCabana);
    fundaColchon.position.set(-2.05, 0.53, -1.92);
    grupo.add(fundaColchon);
    const almohada = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 0.42), materialFundaColchonCabana);
    almohada.position.set(-2.05, 0.62, -2.58);
    grupo.add(almohada);

    // Mesita de noche colocada junto al costado derecho del colchón.
    const tableroMesita = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.12, 0.62), materialMarcoCabana);
    tableroMesita.position.set(-1.05, 0.68, -2.5);
    grupo.add(tableroMesita);
    for (const x of [-1.31, -0.79]) {
        for (const z of [-2.75, -2.25]) {
            const pataMesita = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.08), materialMarcoCabana);
            pataMesita.position.set(x, 0.41, z);
            grupo.add(pataMesita);
        }
    }
    const cajonMesita = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.035), materialParedCabana);
    cajonMesita.position.set(-1.05, 0.51, -2.17);
    grupo.add(cajonMesita);
    const tiradorMesita = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), materialMetalCabana);
    tiradorMesita.position.set(-1.05, 0.51, -2.14);
    grupo.add(tiradorMesita);
    const movil = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.26), materialMovilCabana);
    movil.position.set(-1.05, 0.76, -2.5);
    movil.userData.interactuable = true;
    celularCabanaInteractuable = movil;
    grupo.add(movil);
    const pantallaMovil = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.006, 0.205), materialPantallaMovilCabana);
    pantallaMovil.position.set(-1.05, 0.781, -2.5);
    grupo.add(pantallaMovil);

    // Sin ventanas: los muros laterales quedan cerrados con troncos completos.
    // Unifica la geometría estática por material para reducir las llamadas de dibujo.
    combinarMallasEstaticasCabana(grupo);

    // Colisiones de los muros; la abertura de la puerta queda libre.
    const minY = grupo.position.y + 0.15;
    const maxY = grupo.position.y + 2.55;
    añadirColisionCasa(-3.4, -3.0, -3.4, 3.4, minY, maxY);
    añadirColisionCasa(3.0, 3.4, -3.4, 3.4, minY, maxY);
    añadirColisionCasa(-3.4, 3.4, -3.4, -3.0, minY, maxY);
    añadirColisionCasa(-3.4, -0.9, 3.0, 3.4, minY, maxY);
    añadirColisionCasa(0.9, 3.4, 3.0, 3.4, minY, maxY);
}

generarCabanaDentroDelMapa();
