// --- LLUVIA VISUAL ---
// Se genera una cortina local alrededor del jugador para mantenerla ligera.
let climaActual = 'nublado'; // despejado, nublado, cubierto, olaCalor, niebla, lluvia, nevada, granizado o tormenta
const DURACION_TRANSICION_CLIMA = 6;
let lluviaComplementariaCubierto = false;
let objetivoLluviaComplementariaCubierto = false;
let pesoLluviaComplementariaCubierto = 0;
let pesoInicioLluviaComplementariaCubierto = 0;
let tiempoTransicionLluviaComplementariaCubierto = DURACION_TRANSICION_CLIMA;
const TIPOS_CLIMA = ['despejado', 'nublado', 'cubierto', 'olaCalor', 'niebla', 'lluvia', 'nevada', 'granizado', 'tormenta'];
const pesosVisualesClima = Object.fromEntries(TIPOS_CLIMA.map(tipo => [tipo, tipo === climaActual ? 1 : 0]));
let climaObjetivoVisual = climaActual;
let pesosInicioTransicionClima = { ...pesosVisualesClima };
let tiempoTransicionClima = DURACION_TRANSICION_CLIMA;

function obtenerPesoVisualClima(tipo) {
    return pesosVisualesClima[tipo] || 0;
}

function obtenerIntensidadLluviaVisual() {
    return obtenerPesoVisualClima('lluvia')
        + obtenerPesoVisualClima('tormenta')
        + pesoLluviaComplementariaCubierto * obtenerPesoVisualClima('cubierto');
}

function actualizarTransicionVisualClima(dt) {
    if (climaActual !== climaObjetivoVisual) {
        if (climaActual !== 'cubierto') lluviaComplementariaCubierto = false;
        climaObjetivoVisual = climaActual;
        pesosInicioTransicionClima = { ...pesosVisualesClima };
        tiempoTransicionClima = 0;
    }

    if (tiempoTransicionClima < DURACION_TRANSICION_CLIMA) {
        tiempoTransicionClima = Math.min(DURACION_TRANSICION_CLIMA, tiempoTransicionClima + dt);
        const avance = tiempoTransicionClima / DURACION_TRANSICION_CLIMA;
        const mezcla = avance * avance * (3 - 2 * avance);
        for (const tipo of TIPOS_CLIMA) {
            const destino = tipo === climaObjetivoVisual ? 1 : 0;
            pesosVisualesClima[tipo] = THREE.MathUtils.lerp(pesosInicioTransicionClima[tipo], destino, mezcla);
        }
    }

    if (lluviaComplementariaCubierto !== objetivoLluviaComplementariaCubierto) {
        objetivoLluviaComplementariaCubierto = lluviaComplementariaCubierto;
        pesoInicioLluviaComplementariaCubierto = pesoLluviaComplementariaCubierto;
        tiempoTransicionLluviaComplementariaCubierto = 0;
    }
    if (tiempoTransicionLluviaComplementariaCubierto < DURACION_TRANSICION_CLIMA) {
        tiempoTransicionLluviaComplementariaCubierto = Math.min(
            DURACION_TRANSICION_CLIMA,
            tiempoTransicionLluviaComplementariaCubierto + dt
        );
        const avanceLluviaComplementaria = tiempoTransicionLluviaComplementariaCubierto / DURACION_TRANSICION_CLIMA;
        const mezclaLluviaComplementaria = avanceLluviaComplementaria * avanceLluviaComplementaria
            * (3 - 2 * avanceLluviaComplementaria);
        const destinoLluviaComplementaria = objetivoLluviaComplementariaCubierto ? 1 : 0;
        pesoLluviaComplementariaCubierto = THREE.MathUtils.lerp(
            pesoInicioLluviaComplementariaCubierto,
            destinoLluviaComplementaria,
            mezclaLluviaComplementaria
        );
    }
}

const hudViento = document.getElementById('hud-viento');
const DIRECCIONES_VIENTO = [
    { nombre: 'norte', x: 0, z: -1 },
    { nombre: 'sur', x: 0, z: 1 },
    { nombre: 'este', x: 1, z: 0 },
    { nombre: 'oeste', x: -1, z: 0 }
];
let vientoActivo = false;
let direccionVientoActual = null;
const direccionMiradaViento = new THREE.Vector3();

function actualizarHudViento() {
    if (!hudViento) return;
    hudViento.textContent = vientoActivo ? `Viento del ${direccionVientoActual.nombre}` : '';
    hudViento.classList.toggle('visible', vientoActivo);
    hudViento.setAttribute('aria-hidden', String(!vientoActivo));
}

function iniciarVientoAleatorio() {
    direccionVientoActual = DIRECCIONES_VIENTO[Math.floor(Math.random() * DIRECCIONES_VIENTO.length)];
    vientoActivo = true;
    actualizarHudViento();
}

function detenerViento() {
    vientoActivo = false;
    direccionVientoActual = null;
    actualizarHudViento();
}

function aplicarClimaProgramadoDelDia(dia) {
    lluviaComplementariaCubierto = dia === 21;
    if (dia === 2) {
        climaActual = 'nublado';
        iniciarVientoAleatorio();
    } else if (dia >= 3 && dia <= 6) {
        climaActual = 'despejado';
        detenerViento();
    } else if (dia >= 7 && dia <= 9) {
        climaActual = 'nublado';
        detenerViento();
    } else if (dia >= 10 && dia <= 12 ) {
        climaActual = 'despejado';
        detenerViento();
    } else if (dia === 13 ) {
        climaActual = 'cubierto';
        iniciarVientoAleatorio();
    } else if (dia === 14) {
        climaActual = 'nublado';
        detenerViento();
    } else if (dia >= 15 && dia <= 16) {
        climaActual = 'cubierto';
        detenerViento();
    } else if (dia >= 17 && dia <= 18 ) {
        climaActual = 'nublado';
        detenerViento();
    } else if (dia === 19) {
        climaActual = 'cubierto';
        iniciarVientoAleatorio();
    } else if (dia === 20) {
        climaActual = 'lluvia';
        iniciarVientoAleatorio();
    } else if (dia === 21) {
        climaActual = 'cubierto';
        iniciarVientoAleatorio();
    } else {
        detenerViento();
    }
}

function obtenerMultiplicadorViento(entradaX, entradaZ) {
    if (!vientoActivo || (!entradaX && !entradaZ)) return 1;

    const direccionMirada = camera.getWorldDirection(direccionMiradaViento);
    direccionMirada.y = 0;
    const largoMirada = Math.hypot(direccionMirada.x, direccionMirada.z);
    if (largoMirada < 0.001) return 1;
    direccionMirada.x /= largoMirada;
    direccionMirada.z /= largoMirada;

    const derechaX = -direccionMirada.z;
    const derechaZ = direccionMirada.x;
    const movimientoX = direccionMirada.x * entradaZ + derechaX * entradaX;
    const movimientoZ = direccionMirada.z * entradaZ + derechaZ * entradaX;
    const largoMovimiento = Math.hypot(movimientoX, movimientoZ);
    if (largoMovimiento < 0.001) return 1;

    // La dirección seleccionada indica de dónde viene el viento: moverse
    // hacia su origen cuesta más; alejarse de él da impulso a favor del viento.
    const alineacion = (movimientoX * direccionVientoActual.x
        + movimientoZ * direccionVientoActual.z) / largoMovimiento;
    return alineacion > 0
        ? 1 - alineacion * 0.25
        : 1 - alineacion * 0.27;
}

const CANTIDAD_GOTAS = 700;
const datosGotas = [];
const posicionesLluvia = new Float32Array(CANTIDAD_GOTAS * 2 * 3);
const geometriaLluvia = new THREE.BufferGeometry();
geometriaLluvia.setAttribute('position', new THREE.BufferAttribute(posicionesLluvia, 3));

for (let i = 0; i < CANTIDAD_GOTAS; i++) {
    datosGotas.push({
        x: (Math.random() - 0.5) * 48,
        y: Math.random() * 24 - 4,
        z: (Math.random() - 0.5) * 48,
        velocidad: 20 + Math.random() * 9
    });
}

const lluvia = new THREE.LineSegments(
    geometriaLluvia,
    new THREE.LineBasicMaterial({
        color: 0xb8d7e8,
        transparent: true,
        opacity: 0.62,
        depthWrite: false
    })
);



scene.fog.density = 0.04;

lluvia.frustumCulled = false;
lluvia.visible = false;
scene.add(lluvia);

// Copos lentos alrededor del jugador.
const CANTIDAD_COPOS = 350; // Reduce el coste de la nevada a la mitad.
const datosCopos = [];
const posicionesCopos = new Float32Array(CANTIDAD_COPOS * 3);
const geometriaCopos = new THREE.BufferGeometry();
geometriaCopos.setAttribute('position', new THREE.BufferAttribute(posicionesCopos, 3));
for (let i = 0; i < CANTIDAD_COPOS; i++) {
    datosCopos.push({
        x: (Math.random() - 0.5) * 56, y: 1 + Math.random() * 25,
        z: (Math.random() - 0.5) * 56,
        velocidad: 1.4 + Math.random() * 3.2,
        deriva: (Math.random() - 0.5) * 1.2, fase: Math.random() * Math.PI * 2
    });
}
const coposNieve = new THREE.Points(geometriaCopos, new THREE.PointsMaterial({
    color: 0xf3f8ff, size: 0.08, transparent: true, opacity: 0.9,
    depthWrite: false, sizeAttenuation: true
}));
coposNieve.frustumCulled = false;
coposNieve.visible = false;
scene.add(coposNieve);
let tiempoNieve = 0;
let progresoManchasNieve = 0;
let progresoManchasNieveAplicado = -1;

function actualizarNevada(dt) {
    const pesoNevada = obtenerPesoVisualClima('nevada');
    const pesoGranizo = obtenerPesoVisualClima('granizado');
    const intensidadNevada = pesoNevada + pesoGranizo;
    const estaNevando = intensidadNevada > 0.001;
    const velocidadCopo = intensidadNevada > 0 ? (pesoNevada + pesoGranizo * 2.8) / intensidadNevada : 1;
    coposNieve.visible = estaNevando;
    coposNieve.material.opacity = 0.9 * intensidadNevada;
    if (estaNevando) {
        tiempoNieve += dt;
        progresoTransparenciaAguaNieve = Math.min(1, progresoTransparenciaAguaNieve + dt / 30);
        if (tiempoNieve >= 20) aguaSeCongelo = true;
        if (tiempoNieve > 30) {
            progresoManchasNieve = Math.min(1, progresoManchasNieve + dt / 30);
        }
        const centro = controles.getObject().position;
        for (let i = 0; i < datosCopos.length; i++) {
            const copo = datosCopos[i];
            copo.y -= copo.velocidad * velocidadCopo * dt;
            copo.x += copo.deriva * dt;
            copo.z += Math.sin(tiempoNieve * 0.8 + copo.fase) * dt * 0.35;

            const xMundo = centro.x + copo.x;
            const zMundo = centro.z + copo.z;
            const alturaTerreno = obtenerAlturaTerreno(Math.round(xMundo), Math.round(zMundo));
            const superficie = alturaTerreno > NIVEL_AGUA
                ? alturaTerreno + 0.5
                : (aguaCongelada ? agua.position.y : NIVEL_AGUA);
            const yMundo = centro.y + copo.y;
            if (yMundo <= superficie || Math.abs(copo.x) > 30 || Math.abs(copo.z) > 30) {
                copo.x = (Math.random() - 0.5) * 56;
                copo.y = 20 + Math.random() * 8;
                copo.z = (Math.random() - 0.5) * 56;
            }

            const j = i * 3;
            posicionesCopos[j] = centro.x + copo.x;
            posicionesCopos[j + 1] = centro.y + copo.y;
            posicionesCopos[j + 2] = centro.z + copo.z;
        }
        geometriaCopos.attributes.position.needsUpdate = true;
    }

    if (!estaNevando) {
        tiempoNieve = 0;
        // La tormenta conserva el hielo y la nieve acumulada en el suelo.
        if (obtenerPesoVisualClima('tormenta') < 0.99) {
            progresoTransparenciaAguaNieve = Math.max(0, progresoTransparenciaAguaNieve - dt / 30);
            progresoManchasNieve = Math.max(0, progresoManchasNieve - dt / 30);
            if (progresoTransparenciaAguaNieve <= 0) aguaSeCongelo = false;
        }
    }

    // Opacidad sube durante 30 s de nevada y vuelve a la normalidad en 30 s al despejar.
    aguaCongelada = aguaSeCongelo && progresoTransparenciaAguaNieve > 0.1;
    // Conserva el material transparente durante toda la transición visual.
    // Cambiar `transparent` al congelarse provocaba un salto repentino de apariencia.
    aguaMat.color.copy(colorAguaNormal).lerp(colorAguaHielo, progresoTransparenciaAguaNieve);
    aguaMat.opacity = 0.65 + 0.35 * progresoTransparenciaAguaNieve;

    if (Math.abs(progresoManchasNieve - progresoManchasNieveAplicado) < 0.001) return;
    for (const malla of manchasNievePasto) {
        malla.count = Math.floor(malla.userData.cantidadManchas * progresoManchasNieve);
    }
    for (const malla of manchasNievePiedra) {
        malla.count = Math.floor(malla.userData.cantidadManchas * progresoManchasNieve);
    }
    for (const malla of manchasNieveArena) {
        malla.count = Math.floor(malla.userData.cantidadManchas * progresoManchasNieve);
    }
    progresoManchasNieveAplicado = progresoManchasNieve;
}

const colorCieloLluvia = new THREE.Color(0x65717d);
const colorCieloNiebla = new THREE.Color(0x858d91);
const colorCieloNevada = new THREE.Color(0xaabcc7);
const colorCieloTormenta = new THREE.Color(0x424b55);
const colorCieloNieblaNoche = new THREE.Color(0x171d24);
const colorCieloCubiertoNoche = new THREE.Color(0x151a20);
const colorCieloNevadaNoche = new THREE.Color(0x222d38);
const colorCieloClimaTemporal = new THREE.Color();

// Avisos de sombra y proyectiles para el granizado.
const eventosGranizo = [];
let tiempoProximoGranizo = 0.5;
const canvasSombraGranizo = document.createElement('canvas');
canvasSombraGranizo.width = canvasSombraGranizo.height = 128;
const contextoSombraGranizo = canvasSombraGranizo.getContext('2d');
const degradadoSombraGranizo = contextoSombraGranizo.createRadialGradient(64, 64, 5, 64, 64, 64);
degradadoSombraGranizo.addColorStop(0, 'rgba(12, 14, 16, 0.72)');
degradadoSombraGranizo.addColorStop(0.35, 'rgba(18, 20, 22, 0.48)');
degradadoSombraGranizo.addColorStop(1, 'rgba(20, 22, 24, 0)');
contextoSombraGranizo.fillStyle = degradadoSombraGranizo;
contextoSombraGranizo.fillRect(0, 0, 128, 128);
const texturaSombraGranizo = new THREE.CanvasTexture(canvasSombraGranizo);
const geometriaSombraGranizo = new THREE.PlaneGeometry(1.7, 1.7);
const materialSombraGranizo = new THREE.MeshBasicMaterial({
    map: texturaSombraGranizo,
    transparent: true,
    depthWrite: false,
    opacity: 1,
    side: THREE.DoubleSide
});
const geometriaProyectilGranizo = new THREE.IcosahedronGeometry(0.24, 0);
const materialProyectilGranizo = new THREE.MeshBasicMaterial({ color: 0xe5f2fa, transparent: true });

function eliminarEventosGranizo() {
    for (const evento of eventosGranizo) {
        scene.remove(evento.sombra);
        if (evento.granizo) scene.remove(evento.granizo);
    }
    eventosGranizo.length = 0;
}

function crearEventoGranizo() {
    const jugadorPos = controles.getObject().position;
    const x = jugadorPos.x + (Math.random() - 0.5) * 48;
    const z = jugadorPos.z + (Math.random() - 0.5) * 48;
    const alturaTerreno = obtenerAlturaTerreno(x, z);
    const superficie = alturaTerreno > NIVEL_AGUA
        ? alturaTerreno + 0.52
        : (aguaCongelada ? agua.position.y : NIVEL_AGUA);
    const sombra = new THREE.Mesh(geometriaSombraGranizo, materialSombraGranizo);
    sombra.rotation.x = -Math.PI / 2;
    sombra.position.set(x, superficie + 0.025, z);
    scene.add(sombra);
    eventosGranizo.push({ x, z, superficie, sombra, granizo: null, avisoRestante: 4 });
}

function actualizarGranizo(dt) {
    const pesoGranizo = obtenerPesoVisualClima('granizado');
    if (pesoGranizo <= 0.001) {
        if (eventosGranizo.length > 0) eliminarEventosGranizo();
        tiempoProximoGranizo = 0.5;
        return;
    }
    materialSombraGranizo.opacity = pesoGranizo;
    materialProyectilGranizo.opacity = pesoGranizo;

    tiempoProximoGranizo -= dt;
    if (tiempoProximoGranizo <= 0) {
        crearEventoGranizo();
        tiempoProximoGranizo = 0.2 + Math.random() * 0.45;
    }

    const posicionJugador = controles.getObject().position;
    const piesJugador = posicionJugador.y - jugador.alturaOjos;
    const cabezaJugador = posicionJugador.y + 0.1;
    for (let i = eventosGranizo.length - 1; i >= 0; i--) {
        const evento = eventosGranizo[i];
        if (!evento.granizo) {
            evento.avisoRestante -= dt;
            if (evento.avisoRestante > 0) continue;

            evento.granizo = new THREE.Mesh(geometriaProyectilGranizo, materialProyectilGranizo);
            evento.granizo.position.set(evento.x, evento.superficie + 22, evento.z);
            scene.add(evento.granizo);
        }

        const alturaAnterior = evento.granizo.position.y;
        evento.granizo.position.y -= 300 * dt;
        const distanciaX = evento.x - posicionJugador.x;
        const distanciaZ = evento.z - posicionJugador.z;
        const radioJugador = jugador.ancho + 0.28;
        const cercaDelJugador = distanciaX * distanciaX + distanciaZ * distanciaZ < radioJugador * radioJugador;
        const atraviesaJugador = alturaAnterior >= piesJugador - 0.15
            && evento.granizo.position.y <= cabezaJugador + 0.25;
        const golpeoJugador = cercaDelJugador && atraviesaJugador;
        const tocoSuelo = evento.granizo.position.y <= evento.superficie;

        if (golpeoJugador || tocoSuelo) {
            if (golpeoJugador && pesoGranizo > 0.5) recibirDaño(10);
            scene.remove(evento.sombra);
            scene.remove(evento.granizo);
            eventosGranizo.splice(i, 1);
        }
    }
}

// Nubes claras que flotan alrededor del jugador cuando el clima está parcialmente nublado.
const nubesClima = new THREE.Group();
const geometriaPuffNube = new THREE.SphereGeometry(1, 10, 8);
const materialNube = new THREE.MeshBasicMaterial({
    color: 0xdce4e8, fog: false, depthWrite: true, transparent: true, opacity: 0
});
const mallaNubes = new THREE.InstancedMesh(geometriaPuffNube, materialNube, 30 * 7);
mallaNubes.count = 0;
mallaNubes.frustumCulled = false;
const datosNubes = [];
const dummyNube = new THREE.Object3D();
let cantidadPuffsNubes = 0;
for (let i = 0; i < 30; i++) {
    const nube = {
        x: (Math.random() - 0.5) * 280,
        y: 70 + Math.random() * 35,
        z: (Math.random() - 0.5) * 280,
        puffs: []
    };
    const cantidadPuffs = 5 + Math.floor(Math.random() * 3);
    for (let j = 0; j < cantidadPuffs; j++) {
        nube.puffs.push({
            x: (j - (cantidadPuffs - 1) / 2) * 5,
            y: Math.random() * 2,
            z: (Math.random() - 0.5) * 5,
            escalaX: 5 + Math.random() * 4,
            escalaY: 2 + Math.random() * 2,
            escalaZ: 3 + Math.random() * 3
        });
    }
    cantidadPuffsNubes += cantidadPuffs;
    datosNubes.push(nube);
}
mallaNubes.count = cantidadPuffsNubes;
nubesClima.add(mallaNubes);
nubesClima.visible = false;
scene.add(nubesClima);

function actualizarNubes(dt) {
    const posicionJugador = controles.getObject().position;
    nubesClima.position.set(posicionJugador.x, 0, posicionJugador.z);
    const pesoNublado = obtenerPesoVisualClima('nublado');
    materialNube.opacity = pesoNublado;
    nubesClima.visible = pesoNublado > 0.001;
    if (!nubesClima.visible) return;

    let indicePuff = 0;
    const derivaX = vientoActivo ? -direccionVientoActual.x : 1;
    const derivaZ = vientoActivo ? -direccionVientoActual.z : 0;
    for (const nube of datosNubes) {
        nube.x += dt * 2 * derivaX;
        nube.z += dt * 2 * derivaZ;
        if (nube.x > 155 || nube.x < -155) {
            nube.x = nube.x > 155 ? -155 : 155;
            nube.z = (Math.random() - 0.5) * 280;
        }
        if (nube.z > 155 || nube.z < -155) {
            nube.z = nube.z > 155 ? -155 : 155;
            nube.x = (Math.random() - 0.5) * 280;
        }
        for (const puff of nube.puffs) {
            dummyNube.position.set(nube.x + puff.x, nube.y + puff.y, nube.z + puff.z);
            dummyNube.scale.set(puff.escalaX, puff.escalaY, puff.escalaZ);
            dummyNube.rotation.set(0, 0, 0);
            dummyNube.updateMatrix();
            mallaNubes.setMatrixAt(indicePuff++, dummyNube.matrix);
        }
    }
    mallaNubes.instanceMatrix.needsUpdate = true;
}

// Rayo grande y brillante colocado lejos, en el horizonte.
const formaRayo = new THREE.Shape();
formaRayo.moveTo(-2, 58);
formaRayo.lineTo(5, 37);
formaRayo.lineTo(0, 37);
formaRayo.lineTo(10, 17);
formaRayo.lineTo(4, 17);
formaRayo.lineTo(12, -4);
formaRayo.lineTo(-3, 23);
formaRayo.lineTo(3, 23);
formaRayo.lineTo(-7, 43);
formaRayo.lineTo(-1, 43);
formaRayo.closePath();
const geometriaRayo = new THREE.ShapeGeometry(formaRayo);
const rayoVisual = new THREE.Group();
const haloRayo = new THREE.Mesh(geometriaRayo, new THREE.MeshBasicMaterial({
    color: 0x65bfff, transparent: true, opacity: 0.42, depthWrite: false,
    side: THREE.DoubleSide, fog: false
}));
haloRayo.scale.set(1.8, 1.12, 1);
haloRayo.position.z = -0.1;
const nucleoRayo = new THREE.Mesh(geometriaRayo, new THREE.MeshBasicMaterial({
    color: 0xf4fbff, side: THREE.DoubleSide, fog: false
}));
nucleoRayo.position.z = 0.05;
rayoVisual.add(haloRayo, nucleoRayo);
rayoVisual.visible = false;
scene.add(rayoVisual);

const luzRelampago = new THREE.DirectionalLight(0xdceeff, 0);
scene.add(luzRelampago, luzRelampago.target);
let tiempoProximoRelampago = 0;
let duracionRelampago = 0;
let tiempoSonidoRelampagoPendiente = 0;
let alternarSonidoRelampago = true;

function actualizarLluvia(dt) {
    const pesoLluvia = obtenerPesoVisualClima('lluvia');
    const pesoTormenta = obtenerPesoVisualClima('tormenta');
    const pesoLluviaCubierto = pesoLluviaComplementariaCubierto * obtenerPesoVisualClima('cubierto');
    const intensidadLluvia = pesoLluvia + pesoTormenta + pesoLluviaCubierto;
    if (intensidadLluvia <= 0.001) {
        lluvia.visible = false;
        return;
    }

    lluvia.visible = true;
    const centro = controles.getObject().position;
    lluvia.material.opacity = (pesoLluvia + pesoLluviaCubierto) * 0.62 + pesoTormenta * 0.82;
    for (let i = 0; i < datosGotas.length; i++) {
        const gota = datosGotas[i];
        gota.y -= gota.velocidad * dt * (1 + pesoTormenta * 0.65);
        if (pesoTormenta > 0.001) {
            gota.x += dt * 1.5; // El viento inclina la lluvia durante la tormenta.
        }
        if (gota.y < -5) {
            gota.y = 18 + Math.random() * 8;
            gota.x = (Math.random() - 0.5) * 48;
            gota.z = (Math.random() - 0.5) * 48;
        }

        const indice = i * 6;
        posicionesLluvia[indice] = centro.x + gota.x;
        posicionesLluvia[indice + 1] = centro.y + gota.y;
        posicionesLluvia[indice + 2] = centro.z + gota.z;
        posicionesLluvia[indice + 3] = centro.x + gota.x + 0.08;
        posicionesLluvia[indice + 4] = centro.y + gota.y - 0.7;
        posicionesLluvia[indice + 5] = centro.z + gota.z + 0.03;
    }
    geometriaLluvia.attributes.position.needsUpdate = true;
}

function actualizarRelampagos(dt) {
    if (obtenerPesoVisualClima('tormenta') < 0.5) {
        luzRelampago.intensity = 0;
        rayoVisual.visible = false;
        duracionRelampago = 0;
        tiempoProximoRelampago = 0;
        tiempoSonidoRelampagoPendiente = 0;
        return;
    }

    if (tiempoSonidoRelampagoPendiente > 0) {
        tiempoSonidoRelampagoPendiente -= dt;
        if (tiempoSonidoRelampagoPendiente <= 0) {
            if (alternarSonidoRelampago) reproducirSonidoRayo();
            else reproducirTrueno();
        }
    }

    const posicionJugador = controles.getObject().position;
    if (duracionRelampago > 0) {
        duracionRelampago -= dt;
        luzRelampago.intensity = duracionRelampago > 0 ? 2.8 : 0;
        rayoVisual.visible = duracionRelampago > 0;
        return;
    }

    tiempoProximoRelampago -= dt;
    if (tiempoProximoRelampago <= 0) {
        // Elige cualquier dirección alrededor del jugador, incluso detrás de él.
        const anguloRayo = Math.random() * Math.PI * 2;
        const distanciaRayo = 250 + Math.random() * 100;
        rayoVisual.position.set(
            posicionJugador.x + Math.sin(anguloRayo) * distanciaRayo,
            posicionJugador.y + 60 + Math.random() * 35,
            posicionJugador.z + Math.cos(anguloRayo) * distanciaRayo
        );
        rayoVisual.rotation.set(0, Math.atan2(posicionJugador.x - rayoVisual.position.x,
            posicionJugador.z - rayoVisual.position.z), 0);
        const escalaAnchoRayo = 1.1 + Math.random() * 0.35;
        const escalaAltoRayo = 3.2 + Math.random() * 0.8;
        rayoVisual.scale.set(escalaAnchoRayo, escalaAltoRayo, 1);

        luzRelampago.position.copy(rayoVisual.position);
        luzRelampago.target.position.copy(posicionJugador);
        duracionRelampago = 0.14 + Math.random() * 0.12;
        alternarSonidoRelampago = !alternarSonidoRelampago;
        tiempoSonidoRelampagoPendiente = 2 + Math.random();
        tiempoProximoRelampago = 5 + Math.random() * 9;
        luzRelampago.intensity = 2.8;
        rayoVisual.visible = true;
    }
}

