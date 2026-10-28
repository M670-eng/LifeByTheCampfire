// --- 5. FOGATA OPTIMIZADA ---
let fogataEncendida = false;
let nivelFogata = 1;
let maderaAportadaFogata = 0;
const fogata = new THREE.Group();

const geoLeño = new THREE.CylinderGeometry(0.09, 0.12, 1.0, 6);
const matLeño = new THREE.MeshPhongMaterial({ color: 0x4a2f15, flatShading: true });

const geoPiedritaFogata = new THREE.CylinderGeometry(0.12, 0.12, 0.15, 5);
const matPiedritaFogata = new THREE.MeshPhongMaterial({ color: 0x4a4f54, flatShading: true });

const leño1 = new THREE.Mesh(geoLeño, matLeño);
leño1.rotation.z = Math.PI / 2;
leño1.rotation.y = Math.PI / 6;
leño1.position.set(0.1, 0.12, 0);
fogata.add(leño1);

const leño2 = new THREE.Mesh(geoLeño, matLeño);
leño2.rotation.z = Math.PI / 2;
leño2.rotation.y = -Math.PI / 3;
leño2.position.set(-0.08, 0.12, 0.05);
fogata.add(leño2);

const leño3 = new THREE.Mesh(geoLeño, matLeño);
leño3.rotation.z = Math.PI / 2;
leño3.rotation.y = Math.PI / 2.2;
leño3.position.set(0, 0.12, -0.1);
leño3.scale.set(0.88, 0.88, 0.88);
fogata.add(leño3);

const geoBrasa = new THREE.CircleGeometry(0.04, 5);
const matBrasaBase = new THREE.MeshBasicMaterial({
    transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide
});
const instBrasas = new THREE.InstancedMesh(geoBrasa, matBrasaBase, 12);
const brasasData = [];

for (let i = 0; i < 12; i++) {
    const ang = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.28;
    dummy.position.set(Math.cos(ang) * r, 0.08 + Math.random() * 0.04, Math.sin(ang) * r);
    dummy.rotation.set(-Math.PI / 2, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    instBrasas.setMatrixAt(i, dummy.matrix);
    brasasData.push({ fase: Math.random() * Math.PI * 2, vel: 1.5 + Math.random() * 2.5 });
}
instBrasas.visible = fogataEncendida;
fogata.add(instBrasas);

// --- SISTEMENT DE PARTÍCULAS ---
const NUM_PARTICULAS = 48;
const geoParticula = new THREE.PlaneGeometry(1, 1);

function crearTexturaLlama() {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(size/2, size*0.65, 2, size/2, size*0.55, size*0.42);
    grad.addColorStop(0,   'rgba(255,255,200,1)');
    grad.addColorStop(0.15,'rgba(255,180,30,0.92)');
    grad.addColorStop(0.45,'rgba(255,80,10,0.7)');
    grad.addColorStop(0.75,'rgba(200,30,0,0.3)');
    grad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(size*0.5, size*0.02);
    ctx.bezierCurveTo(size*0.8, size*0.25, size*0.95, size*0.55, size*0.7, size*0.85);
    ctx.bezierCurveTo(size*0.6, size*0.98, size*0.4, size*0.98, size*0.3, size*0.85);
    ctx.bezierCurveTo(size*0.05, size*0.55, size*0.2, size*0.25, size*0.5, size*0.02);
    ctx.closePath();
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
}

function crearTexturaHumo() {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size*0.48);
    grad.addColorStop(0,   'rgba(160,150,140,0.55)');
    grad.addColorStop(0.5, 'rgba(120,115,110,0.25)');
    grad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(size/2, size/2, size*0.48, 0, Math.PI*2);
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
}

const texLlama = crearTexturaLlama();
const texHumo  = crearTexturaHumo();

function resetParticula(p) {
    const ang = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.18;
    p.x = Math.cos(ang) * r;
    p.z = Math.sin(ang) * r;
    p.y = 0.15 + Math.random() * 0.1;
    p.vy = 0.012 + Math.random() * 0.018;
    p.vx = (Math.random() - 0.5) * 0.006;
    p.vz = (Math.random() - 0.5) * 0.006;
    p.vida = 0;
    p.vidaMax = 0.55 + Math.random() * 0.55;
    p.esHumo = Math.random() < 0.22;
    p.escalaBase = p.esHumo ? (0.28 + Math.random() * 0.22) : (0.18 + Math.random() * 0.28);
    p.rot = Math.random() * Math.PI * 2;
    p.rotVel = (Math.random() - 0.5) * 0.04;
    p.swing = Math.random() * Math.PI * 2;
}

const matParticulaFuego = new THREE.MeshBasicMaterial({
    map: texLlama, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide
});
const matParticulaHumo = new THREE.MeshBasicMaterial({
    map: texHumo, transparent: true, depthWrite: false,
    opacity: 0.35, side: THREE.DoubleSide
});

const NUM_FUEGO = 36;
const NUM_HUMO  = 12;

const instFuego = new THREE.InstancedMesh(geoParticula, matParticulaFuego, NUM_FUEGO);
const instHumo  = new THREE.InstancedMesh(geoParticula, matParticulaHumo,  NUM_HUMO);
instFuego.frustumCulled = false;
instHumo.frustumCulled  = false;

const particsFuego = [];
const particHumo   = [];

for (let i = 0; i < NUM_FUEGO; i++) {
    const p = { x:0, y:0, z:0, vy:0, vx:0, vz:0, vida:0, vidaMax:1, escalaBase:0.2, rot:0, rotVel:0, swing:0, esHumo: false };
    p.vida = Math.random();
    resetParticula(p);
    p.vida = Math.random() * p.vidaMax;
    particsFuego.push(p);
}
for (let i = 0; i < NUM_HUMO; i++) {
    const p = { x:0, y:0, z:0, vy:0, vx:0, vz:0, vida:0, vidaMax:1, escalaBase:0.3, rot:0, rotVel:0, swing:0, esHumo: true };
    resetParticula(p);
    p.vida = Math.random() * p.vidaMax;
    particHumo.push(p);
}

instFuego.visible = fogataEncendida;
instHumo.visible = fogataEncendida;
fogata.add(instFuego);
fogata.add(instHumo);

const luzFogata = new THREE.PointLight(0xff6a18, 1.5, 8, 2);
luzFogata.position.set(0, 0.6, 0);
luzFogata.visible = fogataEncendida;
luzFogata.intensity = fogataEncendida ? 1.5 : 0;
fogata.add(luzFogata);

for (let i = 0; i < 8; i++) {
    const piedra = new THREE.Mesh(geoPiedritaFogata, matPiedritaFogata);
    const ang = (Math.PI * 2 * i) / 8;
    piedra.position.set(Math.cos(ang) * 0.44, 0.1, Math.sin(ang) * 0.44);
    piedra.rotation.set((Math.random() - 0.5) * 0.4, Math.random() * Math.PI, (Math.random() - 0.5) * 0.4);
    piedra.scale.setScalar(0.8 + Math.random() * 0.5);
    fogata.add(piedra);
}

scene.add(fogata);
const posFogataSeca = encontrarTierraSeca(2, 0);
const alturaFogata = obtenerAlturaTerreno(posFogataSeca.x, posFogataSeca.z);
fogata.position.set(posFogataSeca.x, alturaFogata + 0.51, posFogataSeca.z);

// --- POLLO: pasea cerca de la fogata y huye del jugador ---
const matPolloAmarillo = new THREE.MeshPhongMaterial({ color: 0xffdf45, flatShading: true });
const matPolloNaranja = new THREE.MeshPhongMaterial({ color: 0xf28a24, flatShading: true });
const matPolloOjos = new THREE.MeshBasicMaterial({ color: 0x17130f });
const geoCuerpoPollo = new THREE.SphereGeometry(0.42, 10, 8);
const geoOjoPollo = new THREE.SphereGeometry(0.045, 6, 5);
const geoAlaPollo = new THREE.SphereGeometry(0.22, 7, 6);
const geoPataPollo = new THREE.CylinderGeometry(0.035, 0.035, 0.22, 5);
const geoPiePollo = new THREE.BoxGeometry(0.13, 0.045, 0.16);
const geoPicoPollo = new THREE.ConeGeometry(0.105, 0.19, 4);
const POLLOS_NIVEL_1 = 2 + Math.floor(Math.random() * 2);
const POLLOS_POR_NIVEL = 8;
const CANTIDAD_MAXIMA_POLLOS = POLLOS_NIVEL_1 + POLLOS_POR_NIVEL * 2;
const RADIO_CARGA_TERRENO_POLLOS_CUADRADO = 52 ** 2;
const POLLOS_POR_FOTOGRAMA = 3;

const centroPollo = new THREE.Vector2(posFogataSeca.x, posFogataSeca.z);
function obtenerLimiteMovimientoPollo() {
    // El pollo no debe abandonar el terreno existente mientras el mapa se expande.
    return Math.max(2, tamañoMapa - 2);
}
function obtenerPosicionSpawnPollo(coordenadas, posicionesReservadas) {
    const limite = obtenerLimiteMovimientoPollo();
    const posicion = {
        x: THREE.MathUtils.clamp(Math.round(coordenadas.x), -limite, limite),
        z: THREE.MathUtils.clamp(Math.round(coordenadas.z), -limite, limite)
    };
    const esPosicionValida = (x, z) => Math.abs(x) <= limite && Math.abs(z) <= limite
        && obtenerAlturaTerreno(x, z) > NIVEL_AGUA
        && posicionesReservadas.every(otra => Math.hypot(otra.x - x, otra.z - z) >= 1.5);

    if (esPosicionValida(posicion.x, posicion.z)) return posicion;
    for (let radio = 1; radio <= limite * 2; radio++) {
        for (let i = -radio; i <= radio; i++) {
            const candidatos = [
                { x: posicion.x + i, z: posicion.z - radio },
                { x: posicion.x + i, z: posicion.z + radio },
                { x: posicion.x - radio, z: posicion.z + i },
                { x: posicion.x + radio, z: posicion.z + i }
            ];
            const valido = candidatos.find(candidato => esPosicionValida(candidato.x, candidato.z));
            if (valido) return valido;
        }
    }
    return { x: posFogataSeca.x, z: posFogataSeca.z };
}

function crearPollo(pollo, posicion) {
    const grupo = new THREE.Group();
    const cuerpo = new THREE.Mesh(geoCuerpoPollo, matPolloAmarillo);
    cuerpo.position.y = 0.52;
    grupo.add(cuerpo);
    const patas = [];
    const pies = [];
    const ojos = [];

    for (const lado of [-1, 1]) {
        const ojo = new THREE.Mesh(geoOjoPollo, matPolloOjos);
        ojo.position.set(lado * 0.14, 0.63, 0.355);
        ojo.scale.setScalar(1.35);
        grupo.add(ojo);
        ojos.push(ojo);

        const ala = new THREE.Mesh(geoAlaPollo, matPolloAmarillo);
        ala.position.set(lado * 0.36, 0.48, -0.02);
        ala.scale.set(0.55, 0.72, 1);
        grupo.add(ala);

        const pata = new THREE.Mesh(geoPataPollo, matPolloNaranja);
        pata.position.set(lado * 0.14, 0.12, 0.03);
        grupo.add(pata);
        patas.push(pata);

        const pie = new THREE.Mesh(geoPiePollo, matPolloNaranja);
        pie.position.set(lado * 0.14, 0.025, 0.09);
        grupo.add(pie);
        pies.push(pie);
    }

    const pico = new THREE.Mesh(geoPicoPollo, matPolloNaranja);
    pico.rotation.x = Math.PI / 2;
    pico.position.set(0, 0.49, 0.43);
    grupo.add(pico);
    grupo.scale.setScalar(0.68);
    const alturaBase = obtenerAlturaTerreno(posicion.x, posicion.z) + 0.5;
    grupo.position.set(posicion.x, alturaBase, posicion.z);
    scene.add(grupo);

    Object.assign(pollo, {
        grupo, cuerpo, patas, pies, ojos,
        escalaOjos: 1.35,
        alturaBase,
        saltoAltura: 0,
        saltoVelocidad: 0,
        objetivo: new THREE.Vector2(posicion.x, posicion.z),
        tiempoNuevoObjetivo: 0,
        direccionHuida: new THREE.Vector2(),
        huyendo: false,
        fasePatas: 0,
        vivo: true,
        golpes: 0
    });
}

const pollos = Array.from({ length: CANTIDAD_MAXIMA_POLLOS }, (_, indice) => ({
    coordenadas: null,
    grupo: null,
    vivo: false,
    nivelDesbloqueo: indice < POLLOS_NIVEL_1
        ? 1
        : (indice < POLLOS_NIVEL_1 + POLLOS_POR_NIVEL ? 2 : 3)
}));

function actualizarSpawnsPendientesPollos() {
    // Un pequeño grupo aparece desde el nivel 1; los otros se desbloquean en 2 y 3.
    if (colaExtensionMapa !== null) return;
    const limite = obtenerLimiteMovimientoPollo();
    let creadosEsteFotograma = 0;
    for (const pollo of pollos) {
        if (pollo.grupo || nivelFogata < pollo.nivelDesbloqueo) continue;
        const posicionesReservadas = pollos
            .filter(otro => otro.vivo && otro.grupo)
            .map(otro => otro.grupo.position);
        let posicion = null;
        for (let intento = 0; intento < 40; intento++) {
            const candidato = {
                x: Math.floor(Math.random() * (limite * 2 + 1)) - limite,
                z: Math.floor(Math.random() * (limite * 2 + 1)) - limite
            };
            if (obtenerAlturaTerreno(candidato.x, candidato.z) <= NIVEL_AGUA) continue;
            if (posicionesReservadas.some(otra => Math.hypot(otra.x - candidato.x, otra.z - candidato.z) < 2)) continue;
            posicion = candidato;
            break;
        }
        if (!posicion) posicion = obtenerPosicionSpawnPollo({ x: 0, z: 0 }, posicionesReservadas);
        pollo.coordenadas = posicion;
        crearPollo(pollo, posicion);
        creadosEsteFotograma++;
        if (creadosEsteFotograma >= POLLOS_POR_FOTOGRAMA) break;
    }
}
actualizarSpawnsPendientesPollos();

function elegirDestinoPollo(pollo, posicionJugador = null) {
    const limite = obtenerLimiteMovimientoPollo();
    for (let intento = 0; intento < 24; intento++) {
        const x = Math.floor(Math.random() * (limite * 2 + 1)) - limite;
        const z = Math.floor(Math.random() * (limite * 2 + 1)) - limite;
        const altura = obtenerAlturaTerreno(x, z);
        const alturaActual = obtenerAlturaTerreno(Math.round(pollo.grupo.position.x), Math.round(pollo.grupo.position.z));
        const suficientementeLejosDelJugador = !posicionJugador
            || Math.hypot(x - posicionJugador.x, z - posicionJugador.z) >= 7;
        if (altura > NIVEL_AGUA && Math.abs(altura - alturaActual) <= 1 && suficientementeLejosDelJugador) {
            pollo.objetivo.set(x, z);
            pollo.tiempoNuevoObjetivo = 12 + Math.random() * 14;
            return;
        }
    }
    // Si no hay destino libre, se queda quieto y vuelve a buscar más tarde.
    pollo.objetivo.set(pollo.grupo.position.x, pollo.grupo.position.z);
    pollo.tiempoNuevoObjetivo = 1;
}

function actualizarPollos(dt, posicionJugador) {
    for (const pollo of pollos) {
        if (!pollo.vivo || !pollo.grupo) continue;
        const grupo = pollo.grupo;
        const limite = obtenerLimiteMovimientoPollo();
        const dxJugador = grupo.position.x - posicionJugador.x;
        const dzJugador = grupo.position.z - posicionJugador.z;
        const distanciaJugador = Math.hypot(dxJugador, dzJugador);
        // Umbral de entrada/salida distinto: evita alternar entre caminar hacia el jugador y huir.
        const estabaHuyendo = pollo.huyendo;
        const huyendo = estabaHuyendo ? distanciaJugador < 6 : distanciaJugador < 4;
        let dx, dz, velocidad;

        if (huyendo) {
            const largo = Math.max(distanciaJugador, 0.001);
            const lejosX = distanciaJugador < 0.001 ? Math.sin(grupo.rotation.y) : dxJugador / largo;
            const lejosZ = distanciaJugador < 0.001 ? Math.cos(grupo.rotation.y) : dzJugador / largo;
            // Actualiza la dirección en cada fotograma: da igual cuál de los dos se acerque.
            pollo.direccionHuida.set(lejosX, lejosZ);
            pollo.huyendo = true;
            dx = pollo.direccionHuida.x;
            dz = pollo.direccionHuida.y;
            velocidad = 2.1;
        } else {
            pollo.huyendo = false;
            pollo.tiempoNuevoObjetivo -= dt;
            if (estabaHuyendo) pollo.tiempoNuevoObjetivo = 0;
            dx = pollo.objetivo.x - grupo.position.x;
            dz = pollo.objetivo.y - grupo.position.z;
            velocidad = 0.72;
            if (pollo.tiempoNuevoObjetivo <= 0 || Math.hypot(dx, dz) < 0.45) {
                elegirDestinoPollo(pollo, posicionJugador);
                dx = pollo.objetivo.x - grupo.position.x;
                dz = pollo.objetivo.y - grupo.position.z;
            }
        }

        const largoMovimiento = Math.hypot(dx, dz);
        let caminando = false;
        if (largoMovimiento > 0.001) {
            dx /= largoMovimiento;
            dz /= largoMovimiento;
            const paso = velocidad * dt;
            const alturaActual = obtenerAlturaTerreno(Math.round(grupo.position.x), Math.round(grupo.position.z));
            const puedeCaminar = (dirX, dirZ) => {
                const x = THREE.MathUtils.clamp(grupo.position.x + dirX * paso, -limite, limite);
                const z = THREE.MathUtils.clamp(grupo.position.z + dirZ * paso, -limite, limite);
                if (Math.hypot(x - grupo.position.x, z - grupo.position.z) < 0.001) return null;
                const altura = obtenerAlturaTerreno(Math.round(x), Math.round(z));
                if (altura <= NIVEL_AGUA || Math.abs(altura - alturaActual) > 1) return null;
                return { x, z };
            };

            let pasoElegido = puedeCaminar(dx, dz);
            if (!pasoElegido && huyendo) {
                // Si la salida directa está bloqueada, busca una alternativa transitable que siga alejándose.
                let mejorPuntuacion = -Infinity;
                for (let i = 0; i < 24; i++) {
                    const angulo = i * Math.PI / 12;
                    const candidatoX = dx * Math.cos(angulo) - dz * Math.sin(angulo);
                    const candidatoZ = dx * Math.sin(angulo) + dz * Math.cos(angulo);
                    const pasoAlternativo = puedeCaminar(candidatoX, candidatoZ);
                    const puntuacion = candidatoX * (dxJugador / Math.max(distanciaJugador, 0.001))
                        + candidatoZ * (dzJugador / Math.max(distanciaJugador, 0.001));
                    if (pasoAlternativo && puntuacion > mejorPuntuacion) {
                        mejorPuntuacion = puntuacion;
                        pasoElegido = pasoAlternativo;
                        pollo.direccionHuida.set(candidatoX, candidatoZ);
                    }
                }
            } else if (!pasoElegido) {
                pollo.tiempoNuevoObjetivo = 0.5;
            }

            if (pasoElegido) {
                grupo.position.x = pasoElegido.x;
                grupo.position.z = pasoElegido.z;
                caminando = true;
                let diferencia = Math.atan2(dx, dz) - grupo.rotation.y;
                if (huyendo) diferencia = Math.atan2(pollo.direccionHuida.x, pollo.direccionHuida.y) - grupo.rotation.y;
                diferencia = Math.atan2(Math.sin(diferencia), Math.cos(diferencia));
                grupo.rotation.y += diferencia * Math.min(1, dt * 8);
            }
        }

        const alturaSuelo = obtenerAlturaTerreno(Math.round(grupo.position.x), Math.round(grupo.position.z)) + 0.5;
        pollo.alturaBase += (alturaSuelo - pollo.alturaBase) * Math.min(1, dt * 7);
        if (pollo.saltoAltura > 0 || pollo.saltoVelocidad > 0) {
            pollo.saltoVelocidad -= 8 * dt;
            pollo.saltoAltura += pollo.saltoVelocidad * dt;
            if (pollo.saltoAltura <= 0) {
                pollo.saltoAltura = 0;
                pollo.saltoVelocidad = 0;
            }
        }
        grupo.position.y = pollo.alturaBase + pollo.saltoAltura;
        const escalaOjosObjetivo = huyendo ? 0.62 : 1.35;
        pollo.escalaOjos += (escalaOjosObjetivo - pollo.escalaOjos) * Math.min(1, dt * 12);
        pollo.ojos.forEach(ojo => ojo.scale.setScalar(pollo.escalaOjos));
        if (caminando) pollo.fasePatas += dt * (huyendo ? 15 : 7);
        const balanceo = caminando ? Math.sin(pollo.fasePatas) * 0.42 : 0;
        pollo.patas.forEach((pata, indice) => { pata.rotation.z = indice === 0 ? balanceo : -balanceo; });
        pollo.pies.forEach((pie, indice) => { pie.rotation.y = caminando ? Math.sin(pollo.fasePatas + indice * Math.PI) * 0.22 : 0; });
        pollo.cuerpo.position.y = 0.52 + (caminando ? Math.abs(Math.sin(pollo.fasePatas)) * 0.035 : 0);
    }
}

// --- ANIMACIÓN DE LA FOGATA ---
const _dummyP = new THREE.Object3D();
let tiempoFogata = 0;

function animarFogata(dt) {
    if (!fogataEncendida) return;
    tiempoFogata += dt;

    luzFogata.intensity = 1.5 * (0.75 + 0.25 * Math.sin(tiempoFogata * 8.3) * Math.sin(tiempoFogata * 5.7));

    for (let i = 0; i < brasasData.length; i++) {
        const b = brasasData[i];
        const v = 0.5 + 0.5 * Math.sin(b.fase + tiempoFogata * b.vel);
        colorAux.setRGB(1, 0.2 + 0.5 * v, 0);
        instBrasas.setColorAt(i, colorAux);
    }
    instBrasas.instanceColor.needsUpdate = true;

    for (let i = 0; i < NUM_FUEGO; i++) {
        const p = particsFuego[i];
        p.vida += dt;
        if (p.vida >= p.vidaMax) { resetParticula(p); continue; }

        const t = p.vida / p.vidaMax;
        p.y   += p.vy;
        p.x   += p.vx + Math.sin(tiempoFogata * 3.1 + p.swing) * 0.003;
        p.z   += p.vz + Math.cos(tiempoFogata * 2.7 + p.swing) * 0.003;
        p.rot += p.rotVel;

        const escala = p.escalaBase * (t < 0.2 ? t/0.2 : 1 - (t-0.2)/0.8);

        _dummyP.position.set(p.x, p.y, p.z);
        _dummyP.rotation.set(0, 0, p.rot);
        _dummyP.scale.setScalar(Math.max(0.001, escala));
        _dummyP.updateMatrix();
        instFuego.setMatrixAt(i, _dummyP.matrix);
        
        colorAux.setRGB(1, 0.3 + 0.4 * (1 - t), Math.max(0, 0.1 - t * 0.1));
        instFuego.setColorAt(i, colorAux);
    }
    instFuego.instanceMatrix.needsUpdate = true;
    if (instFuego.instanceColor) instFuego.instanceColor.needsUpdate = true;

    for (let i = 0; i < NUM_HUMO; i++) {
        const p = particHumo[i];
        p.vida += dt;
        if (p.vida >= p.vidaMax) { resetParticula(p); p.esHumo = true; continue; }

        const t = p.vida / p.vidaMax;
        p.y   += p.vy * 0.6;
        p.x   += p.vx + Math.sin(tiempoFogata * 1.8 + p.swing) * 0.004;
        p.z   += p.vz + Math.cos(tiempoFogata * 2.2 + p.swing) * 0.004;
        p.rot += p.rotVel * 0.5;

        const escala = p.escalaBase * (0.6 + t * 1.8);

        _dummyP.position.set(p.x, p.y + 0.5, p.z);
        _dummyP.rotation.set(0, 0, p.rot);
        _dummyP.scale.setScalar(Math.max(0.001, escala));
        _dummyP.updateMatrix();
        instHumo.setMatrixAt(i, _dummyP.matrix);
    }
    instHumo.instanceMatrix.needsUpdate = true;

    const camPos = camera.position;
    const fogPos = fogata.position;
    const angle = Math.atan2(camPos.x - fogPos.x, camPos.z - fogPos.z);
    instFuego.rotation.y = angle;
    instHumo.rotation.y  = angle;
}
