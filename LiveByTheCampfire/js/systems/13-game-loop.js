// --- GAME LOOP ---
const posicionesPollosActivos = [];
const colorCieloBaseVisual = new THREE.Color();
const colorAporteCieloVisual = new THREE.Color();
const colorMezclaIluminacionVisual = new THREE.Color();
const colorAporteIluminacionVisual = new THREE.Color();
const colorLuzAstroBaseVisual = new THREE.Color();
const colorNubesCubierto = new THREE.Color(0xa4aaae);
const colorNubesNoche = new THREE.Color(0x718399);
// Día 1: cuarto menguante; día 12: llena. Cada una de las 16 noches tiene un dibujo propio.
const aparienciasPorNocheLunar = [
    { colorBase: 0xffffff, franjasIluminadas: 8, desdeIzquierda: false },  // 1: cuarto menguante
    { colorBase: 0xffffff, franjasIluminadas: 4, desdeIzquierda: false },  // 2: menguante
    { colorBase: 0xffffff, franjasIluminadas: 1, desdeIzquierda: false },  // 3: menguante fino
    { colorBase: 0x101521, franjasIluminadas: 0, desdeIzquierda: true },   // 4: nueva
    { colorBase: 0x101521, franjasIluminadas: 1, desdeIzquierda: true },   // 5: creciente fino
    { colorBase: 0x101521, franjasIluminadas: 4, desdeIzquierda: true },   // 6: creciente
    { colorBase: 0x101521, franjasIluminadas: 6, desdeIzquierda: true },   // 7: creciente avanzada
    { colorBase: 0x101521, franjasIluminadas: 8, desdeIzquierda: true },   // 8: cuarto creciente
    { colorBase: 0x101521, franjasIluminadas: 10, desdeIzquierda: true }, // 9: gibosa creciente
    { colorBase: 0x101521, franjasIluminadas: 12, desdeIzquierda: true }, // 10: gibosa creciente
    { colorBase: 0x101521, franjasIluminadas: 14, desdeIzquierda: true }, // 11: casi llena
    { colorBase: 0xffffff, franjasIluminadas: 16, desdeIzquierda: true }, // 12: llena
    { colorBase: 0xffffff, franjasIluminadas: 12, desdeIzquierda: false },// 13: gibosa menguante
    { colorBase: 0xffffff, franjasIluminadas: 11, desdeIzquierda: false },// 14: menguante
    { colorBase: 0xffffff, franjasIluminadas: 10, desdeIzquierda: false },// 15: menguante
    { colorBase: 0xffffff, franjasIluminadas: 9, desdeIzquierda: false } // 16: cuarto menguante
];
let ultimaNocheLunarAplicada = -1;

function actualizarFaseVisualLuna() {
    const indiceNocheLunar = ((nochesTranscurridasLuna % 16) + 16) % 16;
    if (indiceNocheLunar === ultimaNocheLunarAplicada) return;

    const apariencia = aparienciasPorNocheLunar[indiceNocheLunar];
    luna.userData.core.material.color.setHex(apariencia.colorBase);
    const fraccionIluminada = apariencia.franjasIluminadas / 16;
    actualizarTexturaFaseLunar(fraccionIluminada, apariencia.desdeIzquierda);
    ultimaNocheLunarAplicada = indiceNocheLunar;
}

function mezclarColorIluminacion(colorBase, colorAdverso, colorCubierto, pesoBase, pesoAdverso, pesoCubierto, destino) {
    if (typeof colorBase === 'number') destino.setHex(colorBase);
    else destino.copy(colorBase);
    destino.multiplyScalar(pesoBase);
    colorAporteIluminacionVisual.setHex(colorAdverso).multiplyScalar(pesoAdverso);
    destino.add(colorAporteIluminacionVisual);
    colorAporteIluminacionVisual.setHex(colorCubierto).multiplyScalar(pesoCubierto);
    destino.add(colorAporteIluminacionVisual);
}

function frame() {
    requestAnimationFrame(frame);
    actualizarFPS();
    actualizarAudioLluvia();

    if (juegoPausado) {
        ultimoFrameTime = performance.now();
        actualizarCoccionFogata(ultimoFrameTime);
        renderer.render(scene, camera);
        return;
    }

    const ahora = performance.now();
    const dt = Math.min((ahora - ultimoFrameTime) / 1000, 0.05);
    ultimoFrameTime = ahora;
    actualizarTransicionVisualClima(dt);
    actualizarCoccionFogata(ahora);
    // Las velocidades originales están expresadas por fotograma a 60 FPS.
    // Escalarlas por dt conserva ese ritmo en pantallas con otras frecuencias.
    const escalaFotograma = dt * 60;
    procesarExtensionMapa();
    actualizarSpawnsPendientesPollos();
    const posicionJugadorSectores = controles.getObject().position;
    actualizarCargaPinos(posicionJugadorSectores);
    actualizarHUDCoordenadas(ahora);
    actualizarTransicionSectoresTerreno(dt);
    
    animarFogata(dt);
    actualizarPollos(dt, posicionJugadorSectores);
    actualizarSacudidaPinos(dt);
    actualizarParticulasGolpe(dt);
    posicionesPollosActivos.length = 0;
    for (const pollo of pollos) {
        if (!pollo.vivo || !pollo.grupo) continue;
        const dx = pollo.grupo.position.x - posicionJugadorSectores.x;
        const dz = pollo.grupo.position.z - posicionJugadorSectores.z;
        if (dx * dx + dz * dz <= RADIO_CARGA_TERRENO_POLLOS_CUADRADO) {
            posicionesPollosActivos.push(pollo.grupo.position);
        }
    }
    // Los pollos ya se movieron: una sola comprobación actualiza sus sectores y los del jugador.
    actualizarSectoresTerreno(
        posicionJugadorSectores.x,
        posicionJugadorSectores.z,
        false,
        posicionesPollosActivos
    );
    actualizarLluvia(dt);
    actualizarRelampagos(dt);
    actualizarNubes(dt);
    actualizarNevada(dt);
    actualizarGranizo(dt);

    // --- ACTUALIZACIÓN DEL CICLO DÍA / NOCHE ---
    dayTime += dt / DURACION_CICLO_SEGUNDOS;
    if (dayTime >= 1.0) {
        dayTime = 0;
        dayCount = dayCount >= 365 ? 1 : dayCount + 1;
        nochesTranscurridasLuna++;
        actualizarFaseVisualLuna();
        aplicarClimaProgramadoDelDia(dayCount);
        actualizarHUDCalendario();
    }

    let anguloSol;
    if (climaActual === 'olaCalor') {
        const fraccionDiaOlaCalor = 3.5 / 5;
        anguloSol = dayTime <= fraccionDiaOlaCalor
            ? (dayTime / fraccionDiaOlaCalor) * Math.PI
            : Math.PI + ((dayTime - fraccionDiaOlaCalor) / (1 - fraccionDiaOlaCalor)) * Math.PI;
    } else {
        anguloSol = dayTime * Math.PI * 2;
    }
    const radioOrbita = 350; // Órbita fuera del mapa

    sol.position.x = Math.cos(anguloSol) * radioOrbita;
    sol.position.y = Math.sin(anguloSol) * radioOrbita;
    sol.position.z = -100; 
    
    sol.userData.aura.rotation.z -= 0.012;
    sol.userData.aura.rotation.x += 0.005;

    const anguloLuna = anguloSol + Math.PI;
    luna.position.x = Math.cos(anguloLuna) * radioOrbita;
    luna.position.y = Math.sin(anguloLuna) * radioOrbita;
    luna.position.z = -100;
    
    luna.userData.aura.rotation.z -= 0.012;
    luna.userData.aura.rotation.x += 0.005;

    // Transición suave de iluminación proporcional al nuevo radio
    let factorDia = Math.max(0, Math.min(1, sol.position.y / radioOrbita));

    const pesoDespejado = obtenerPesoVisualClima('despejado');
    const pesoNublado = obtenerPesoVisualClima('nublado');
    const pesoCubierto = obtenerPesoVisualClima('cubierto');
    const pesoOlaCalor = obtenerPesoVisualClima('olaCalor');
    const pesoNiebla = obtenerPesoVisualClima('niebla');
    const pesoLluvia = obtenerPesoVisualClima('lluvia');
    const pesoNevada = obtenerPesoVisualClima('nevada');
    const pesoGranizo = obtenerPesoVisualClima('granizado');
    const pesoTormenta = obtenerPesoVisualClima('tormenta');
    const pesoNieveGranizo = pesoNevada + pesoGranizo;
    const pesoClimaAdverso = pesoNiebla + pesoLluvia + pesoNieveGranizo + pesoTormenta;
    const pesoClimaNeutro = Math.max(0, 1 - pesoCubierto - pesoClimaAdverso);

    colorCieloBaseVisual.copy(colorCieloDia).lerp(colorCieloNoche, 1 - factorDia);
    scene.background.copy(colorCieloBaseVisual).multiplyScalar(pesoClimaNeutro);
    if (pesoCubierto > 0) {
        colorCieloClimaTemporal.copy(colorCieloCubiertoNoche).lerp(colorCieloNiebla, factorDia);
        colorAporteCieloVisual.copy(colorCieloBaseVisual).lerp(colorCieloClimaTemporal, 0.92).multiplyScalar(pesoCubierto);
        scene.background.add(colorAporteCieloVisual);
    }
    if (pesoLluvia > 0) {
        colorAporteCieloVisual.copy(colorCieloBaseVisual).lerp(colorCieloLluvia, 0.82).multiplyScalar(pesoLluvia);
        scene.background.add(colorAporteCieloVisual);
    }
    if (pesoNiebla > 0) {
        colorCieloClimaTemporal.copy(colorCieloNieblaNoche).lerp(colorCieloNiebla, factorDia);
        colorAporteCieloVisual.copy(colorCieloBaseVisual).lerp(colorCieloClimaTemporal, 0.7).multiplyScalar(pesoNiebla);
        scene.background.add(colorAporteCieloVisual);
    }
    if (pesoNieveGranizo > 0) {
        colorCieloClimaTemporal.copy(colorCieloNevadaNoche).lerp(colorCieloNevada, factorDia);
        colorAporteCieloVisual.copy(colorCieloBaseVisual).lerp(colorCieloClimaTemporal, 0.72).multiplyScalar(pesoNieveGranizo);
        scene.background.add(colorAporteCieloVisual);
    }
    if (pesoTormenta > 0) {
        colorAporteCieloVisual.copy(colorCieloBaseVisual).lerp(colorCieloTormenta, 0.9).multiplyScalar(pesoTormenta);
        scene.background.add(colorAporteCieloVisual);
    }

    const pesoPermiteCrepusculo = pesoDespejado + pesoNublado + pesoCubierto + pesoOlaCalor;
    const climaPermiteCrepusculo = pesoPermiteCrepusculo > 0.001;
    let fuerzaCrepusculo = 0;
    let colorCrepusculo = colorCieloAmanecer;
    if (climaPermiteCrepusculo) {
        const alturaSolNormalizada = sol.position.y / radioOrbita;
        const suavizar = (valor, desde, hasta) => {
            const t = THREE.MathUtils.clamp((valor - desde) / (hasta - desde), 0, 1);
            return t * t * (3 - 2 * t);
        };
        const intensidadCrepusculo = suavizar(alturaSolNormalizada, -0.25, 0.04)
            * (1 - suavizar(alturaSolNormalizada, 0.03, 0.38));
        colorCrepusculo = Math.cos(anguloSol) >= 0
            ? colorCieloAmanecer
            : colorCieloAtardecer;
        const intensidadClimaCrepusculo = pesoCubierto * 0.22
            + (pesoDespejado + pesoNublado + pesoOlaCalor) * 0.9;
        fuerzaCrepusculo = intensidadCrepusculo * intensidadClimaCrepusculo;

        scene.background.lerp(colorCrepusculo, fuerzaCrepusculo);
        const visibilidadResplandorSol = 1 - pesoCubierto;
        sol.userData.core.material.color.setHex(0xfffcd0).lerp(colorLuzCrepusculo, fuerzaCrepusculo);
        sol.userData.aura.material.color.setHex(0xff7a00).lerp(colorCieloAtardecer, fuerzaCrepusculo * 0.65);
        sol.userData.aura.material.opacity = 0.3 + fuerzaCrepusculo * 0.3;
        const aumentoSolCrepusculo = pesoOlaCalor * 1.8 + (1 - pesoOlaCalor) * 0.55;
        const escalaSolCrepusculo = 1 + fuerzaCrepusculo * aumentoSolCrepusculo * visibilidadResplandorSol;
        sol.userData.aura.scale.setScalar(escalaSolCrepusculo);
        sol.userData.core.scale.setScalar(escalaSolCrepusculo);
        resplandorSol.position.copy(sol.position);
        resplandorSol.material.color.copy(colorCrepusculo);
        resplandorSol.material.opacity = fuerzaCrepusculo * 0.72 * visibilidadResplandorSol;
        resplandorSol.visible = resplandorSol.material.opacity > 0.01;
    }

    luna.userData.aura.material.opacity = 0.3 + fuerzaCrepusculo * 0.3;
    luna.userData.aura.scale.setScalar(1);
    luna.userData.core.scale.setScalar(1);
    resplandorLuna.position.copy(luna.position);
    resplandorLuna.material.opacity = fuerzaCrepusculo * 0.72 * (1 - pesoCubierto);

    scene.fog.density = 0.06 + pesoTormenta * 0.015 + pesoNiebla * 0.07;

    if (sol.position.y > 0) {
        luzAstro.position.copy(sol.position);
        luzAstro.color.setHex(0xfff5b5); 
        luzAstro.intensity = factorDia * 0.8; 
        luzGeneral.intensity = 0.2 + (factorDia * 0.5); 
    } else {
        let factorLuna = Math.max(0, Math.min(1, luna.position.y / radioOrbita));
        luzAstro.position.copy(luna.position);
        luzAstro.color.setHex(0x5c768d); 
        luzAstro.intensity = factorLuna * 0.25; 
        luzGeneral.intensity = 0.12 + (factorLuna * 0.08);  
    }
    colorLuzAstroBaseVisual.copy(luzAstro.color);

    const pesoBaseIluminacion = Math.max(0, 1 - pesoClimaAdverso - pesoCubierto);
    const factorAstroClima = 1
        + (0.08 - 1) * pesoTormenta
        + (0.6 - 1) * pesoNiebla
        + (0.42 - 1) * pesoNieveGranizo
        + (0.18 - 1) * pesoLluvia
        + (0.78 - 1) * pesoCubierto;
    const factorGeneralClima = 1
        + (0.58 - 1) * pesoTormenta
        + (0.85 - 1) * pesoNiebla
        + (0.88 - 1) * pesoNieveGranizo
        + (0.72 - 1) * pesoLluvia
        + (0.9 - 1) * pesoCubierto;
    luzAstro.intensity *= factorAstroClima;
    luzGeneral.intensity *= factorGeneralClima;
    mezclarColorIluminacion(colorLuzAstroBaseVisual, 0x87919a, 0xb7bec2, pesoBaseIluminacion, pesoClimaAdverso, pesoCubierto, colorMezclaIluminacionVisual);
    luzAstro.color.copy(colorMezclaIluminacionVisual);
    mezclarColorIluminacion(0xffffff, 0xc3c8cc, 0xd7dcdf, pesoBaseIluminacion, pesoClimaAdverso, pesoCubierto, colorMezclaIluminacionVisual);
    luzGeneral.color.copy(colorMezclaIluminacionVisual);
    mezclarColorIluminacion(0x667799, 0x596168, 0x777f83, pesoBaseIluminacion, pesoClimaAdverso, pesoCubierto, colorMezclaIluminacionVisual);
    luzGeneral.groundColor.copy(colorMezclaIluminacionVisual);

    const pesoIluminacionNoche = pesoNiebla + pesoCubierto + pesoNevada;
    const factorNoche = 0.68 + 0.32 * factorDia;
    luzGeneral.intensity *= 1 - pesoIluminacionNoche * (1 - factorNoche);
    luzAstro.intensity *= 1 - pesoIluminacionNoche * (1 - (0.76 + 0.24 * factorDia));

    if (climaPermiteCrepusculo && fuerzaCrepusculo > 0) {
        if (sol.position.y > 0) {
            luzAstro.color.lerp(colorLuzCrepusculo, fuerzaCrepusculo);
            luzAstro.intensity *= 1 + fuerzaCrepusculo * 0.3;
        }
        luzGeneral.color.lerp(colorLuzCrepusculo, fuerzaCrepusculo * 0.22);
        luzGeneral.groundColor.lerp(colorCrepusculo, fuerzaCrepusculo * 0.12);
    }
    if (!climaPermiteCrepusculo) {
        resplandorSol.visible = false;
        resplandorSol.material.opacity = 0;
        sol.userData.aura.material.opacity = 0.3;
        sol.userData.aura.scale.setScalar(1);
        sol.userData.core.scale.setScalar(1);
    }

    const opacidadAstrosClima = 1 - THREE.MathUtils.clamp(pesoCubierto + pesoClimaAdverso, 0, 1);
    const alturaSolNormalizada = sol.position.y / radioOrbita;
    const progresoNocheLunar = THREE.MathUtils.clamp(-alturaSolNormalizada / 0.08, 0, 1);
    const opacidadNocheLunar = progresoNocheLunar * progresoNocheLunar * (3 - 2 * progresoNocheLunar);
    const opacidadLuna = opacidadAstrosClima * opacidadNocheLunar;
    actualizarFaseVisualLuna();
    sol.visible = opacidadAstrosClima > 0.001;
    luna.visible = opacidadLuna > 0.001;
    sol.userData.core.material.opacity = opacidadAstrosClima;
    luna.userData.core.material.opacity = opacidadLuna;
    luna.userData.frenteFases.material.opacity = opacidadLuna;
    sol.userData.aura.material.opacity *= opacidadAstrosClima;
    luna.userData.aura.material.opacity *= opacidadLuna;
    resplandorSol.material.opacity *= opacidadAstrosClima;
    resplandorSol.visible = resplandorSol.material.opacity > 0.01;
    resplandorLuna.material.opacity *= opacidadLuna;
    resplandorLuna.visible = resplandorLuna.material.opacity > 0.01;

    materialNube.color.copy(colorNubesBase);
    materialNube.color.lerp(colorNubesCubierto, pesoCubierto);
    if (sol.position.y <= 0) {
        materialNube.color.lerp(colorNubesNoche, pesoNublado);
    } else if (fuerzaCrepusculo > 0) {
        materialNube.color.lerp(colorCrepusculo, fuerzaCrepusculo * 0.5 * pesoNublado);
    }
    scene.fog.color.copy(scene.background);

    if (controles.isLocked && !inventarioAbierto) {
        const posicionAnterior = {
            x: controles.getObject().position.x,
            y: controles.getObject().position.y,
            z: controles.getObject().position.z
        };
    comprobarSiEstaEnAgua();

    contenedorOxigeno.style.display = jugador.sumergido ? 'flex' : 'none';
        
    // --- SISTEMA DE OXÍGENO ---
    if (jugador.sumergido) {
    
        // Acumular tiempo dentro del agua
        tiempoEnAgua += dt;
    
        // 30 segundos = 100% de oxígeno
        jugador.oxigenoActual = Math.max(
            0,
            jugador.oxigenoMaximo * (1 - tiempoEnAgua / 30)
        );
    
        // Sin oxígeno: -20 de vida por segundo
        if (jugador.oxigenoActual <= 0) {
            recibirDaño(20 * dt);
        }
    
    } else {
    
        // Fuera del agua se recupera instantáneamente
        tiempoEnAgua = 0;
        jugador.oxigenoActual = jugador.oxigenoMaximo;
    }
    
    actualizarHUDOxigeno();

        if (jugador.modoEspectador) {
            let entradaX = Number(Boolean(teclas['KeyD'])) - Number(Boolean(teclas['KeyA']));
            let entradaZ = Number(Boolean(teclas['KeyW'])) - Number(Boolean(teclas['KeyS']));
            const largoEntrada = Math.hypot(entradaX, entradaZ);
            if (largoEntrada > 1) {
                entradaX /= largoEntrada;
                entradaZ /= largoEntrada;
            }
            controles.moveForward(entradaZ * jugador.velocidadMov * 1.8 * escalaFotograma);
            controles.moveRight(entradaX * jugador.velocidadMov * 1.8 * escalaFotograma);
            if (teclas['Space']) controles.getObject().position.y += 0.12 * escalaFotograma;
            if (teclas['ShiftLeft'] || teclas['ShiftRight']) controles.getObject().position.y -= 0.12 * escalaFotograma;
            
            if (camera.fov !== FOV_BASE) {
                camera.fov += (FOV_BASE - camera.fov) * (1 - Math.pow(0.85, escalaFotograma));
                camera.updateProjectionMatrix();
            }
            jugador.bobbingY = 0;
        } else {
            const quiereAgacharse = teclas['ShiftLeft'] || teclas['ShiftRight'];
            const estaApretandoCtrl = teclas['ControlLeft'] || teclas['ControlRight'];
            const quiereCorrer = (estaApretandoCtrl || sprintActivoPorDobleToque || sprintTactilActivo) && !quiereAgacharse;

            let fovObjetivo = quiereCorrer && (teclas['KeyW'] || teclas['KeyS'] || teclas['KeyA'] || teclas['KeyD']) ? FOV_CORRER : FOV_BASE;
            if (Math.abs(camera.fov - fovObjetivo) > 0.01) {
                camera.fov += (fovObjetivo - camera.fov) * (1 - Math.pow(0.85, escalaFotograma));
                camera.updateProjectionMatrix();
            }

            jugador.estaAgachado = quiereAgacharse;
            jugador.alturaObjetivo = quiereAgacharse ? jugador.alturaOjosAgachado : jugador.alturaOjosNormal;

            const alturaAnterior = jugador.alturaOjos;
            jugador.alturaOjos += (jugador.alturaObjetivo - jugador.alturaOjos) * (1 - Math.pow(0.8, escalaFotograma));

            const deltaAltura = jugador.alturaOjos - alturaAnterior;
            if (Math.abs(deltaAltura) > 0.00001) controles.getObject().position.y += deltaAltura;

            let velocidadActual = jugador.velocidadMov;

            if (jugador.nadando) {
                // Movimiento lento dentro del agua
                velocidadActual = jugador.velocidadNado;
            
                // Sprint acuático
                if (quiereCorrer) {
                    velocidadActual = jugador.velocidadNadoSprint;
                }
            
            } else {
            
                // Movimiento normal
                if (quiereAgacharse) {
                    velocidadActual *= jugador.velocidadAgachado;
                
                } else if (quiereCorrer) {
                    velocidadActual *= jugador.velocidadSprintMultiplicador;
                }
            }
            
            const seEstaMoviendo = teclas['KeyW'] || teclas['KeyS'] || teclas['KeyA'] || teclas['KeyD'];
            let entradaMovimientoX = Number(Boolean(teclas['KeyD'])) - Number(Boolean(teclas['KeyA']));
            let entradaMovimientoZ = Number(Boolean(teclas['KeyW'])) - Number(Boolean(teclas['KeyS']));
            const largoEntradaMovimiento = Math.hypot(entradaMovimientoX, entradaMovimientoZ);
            if (largoEntradaMovimiento > 1) {
                entradaMovimientoX /= largoEntradaMovimiento;
                entradaMovimientoZ /= largoEntradaMovimiento;
            }

            if (!jugador.nadando) {
                velocidadActual *= obtenerMultiplicadorViento(entradaMovimientoX, entradaMovimientoZ);
            }

            if (jugador.nadando) {
                        
                const direccionNado = new THREE.Vector3();
                        
                camera.getWorldDirection(direccionNado);
                        
                // W = nadar hacia donde estás mirando
                controles.getObject().position.addScaledVector(
                    direccionNado,
                    entradaMovimientoZ * velocidadActual * escalaFotograma
                );
                controles.moveRight(entradaMovimientoX * velocidadActual * escalaFotograma);
            
            } else {
                controles.moveForward(entradaMovimientoZ * velocidadActual * escalaFotograma);
                controles.moveRight(entradaMovimientoX * velocidadActual * escalaFotograma);
            }

            if (jugador.nadando) {
            
                // En el agua no usamos el salto normal
                jugador.enSuelo = false;
            
                // SUBIR
                if (teclas['Space']) {
                    jugador.velocidadY += jugador.velocidadVerticalAgua * escalaFotograma;
                }
            
                // BAJAR
                if (teclas['ShiftLeft'] || teclas['ShiftRight']) {
                    jugador.velocidadY -= jugador.velocidadVerticalAgua * escalaFotograma;
                }
            
                // GRAVEDAD MUY REDUCIDA
                jugador.velocidadY -= jugador.gravedadAgua * escalaFotograma;
            
                // FLOTACIÓN
                if (!teclas['Space'] &&
                    !teclas['ShiftLeft'] &&
                    !teclas['ShiftRight']) {
                    
                    if (controles.getObject().position.y < NIVEL_AGUA) {
                        jugador.velocidadY += jugador.flotacionAgua * escalaFotograma;
                    }
                
                    // Frenar movimiento vertical
                    jugador.velocidadY *= Math.pow(0.90, escalaFotograma);
                }
            
                // LÍMITES DE VELOCIDAD VERTICAL
                if (jugador.velocidadY > 0.10) {
                    jugador.velocidadY = 0.10;
                }
            
                if (jugador.velocidadY < -0.10) {
                    jugador.velocidadY = -0.10;
                }
            
            } else {
            
                if (teclas['Space'] && jugador.enSuelo) {
                    jugador.velocidadY = jugador.fuerzaSalto;
                    jugador.enSuelo = false;
                }
            
                if (!jugador.enSuelo && juegoCargado) {
                    jugador.velocidadY -= jugador.gravedad * escalaFotograma;
                
                    if (jugador.velocidadY < -0.45) {
                        jugador.velocidadY = -0.45;
                    }
                }
            }

            // Aplicar movimiento vertical
            controles.getObject().position.y += jugador.velocidadY * escalaFotograma;

            // Colisiones
            manejarColisiones(posicionAnterior);
            if (!jugador.modoEspectador && !jugador.estaMuerto) {
                if (jugador.enSuelo) {
                    if (!jugador.estabaEnSuelo) {
                        // El jugador acaba de impactar contra el suelo duro
                        const distanciaCaida = jugador.alturaMaximaCaida - controles.getObject().position.y;
                        
                        // Aumentamos la zona segura a 4 bloques (antes 3.0)
                        if (!jugador.nadando && distanciaCaida > 4.0) {  
                            // Daño: 5 puntos de daño por cada bloque extra (antes era 12)
                            const dañoCalculado = Math.round((distanciaCaida - 4.0) * 5);
                            if (dañoCalculado > 0) recibirDaño(dañoCalculado);
                        }
                    }
                    // Mientras esté en el suelo, su altura máxima se ancla a sus pies
                    jugador.alturaMaximaCaida = controles.getObject().position.y;
                } else {
                    // Si está en el aire (saltando/cayendo), registramos dinámicamente la cima del trayecto
                    if (controles.getObject().position.y > jugador.alturaMaximaCaida) {
                        jugador.alturaMaximaCaida = controles.getObject().position.y;
                    }
                }
                jugador.estabaEnSuelo = jugador.enSuelo;
            }

            // --- SISTEMA DE DAÑO Y HAMBRE DINÁMICO ---
            if (!jugador.modoEspectador && !jugador.estaMuerto) {
                const posJugador = controles.getObject().position;

                // 1. Daño por caer al vacío
                if (posJugador.y < -30) {
                    recibirDaño(50); 
                    posJugador.set(posFogataSeca.x, obtenerAlturaTerreno(posFogataSeca.x, posFogataSeca.z) + 4, posFogataSeca.z);
                    jugador.velocidadY = 0;
                }

                let tasaDesgasteHambre = 0.2; 
                if (seEstaMoviendo) {
                    tasaDesgasteHambre = quiereCorrer ? 3.5 : 1.2; 
                }

                // 3. Mecánica de hambre y frío
                const posFogata = fogata.position;
                const distanciaAFogata = Math.sqrt((posJugador.x - posFogata.x)**2 + (posJugador.z - posFogata.z)**2);
                jugador.hambreActual = Math.max(0, jugador.hambreActual - (tasaDesgasteHambre * dt));

                //Daño fulminante de 20 puntos de vida por segundo si el hambre llega a 0

                if (jugador.hambreActual <= 0) {
                    recibirDaño(20 * dt); 
                } else if ((!fogataEncendida || distanciaAFogata > 15) && jugador.hambreActual <= (jugador.hambreMaxima / 2)) {
                    // Mantiene el daño leve por congelamiento gradual si estás alejado y a menos de la mitad
                    recibirDaño(0.4 * dt); 
                }

                actualizarHUDHambre();
            }
        }
    }
    camera.position.y += jugador.bobbingY;

    camera.getWorldPosition(posicionCamaraAstros);
    sol.lookAt(posicionCamaraAstros);
    luna.lookAt(posicionCamaraAstros);

    if (!aguaCongelada && progresoTransparenciaAguaNieve <= 0.001) {
        agua.material.opacity = 0.62 + Math.sin(ahora * 0.0015) * 0.04;
        agua.rotation.z = Math.sin(ahora * 0.0004) * 0.003;
    } else {
        agua.rotation.z = 0;
    }

    renderer.render(scene, camera);

    camera.position.y -= jugador.bobbingY;
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    pixelRatioNativoLimitado = Math.min(window.devicePixelRatio || 1, PIXEL_RATIO_MAXIMO);
    pixelRatioActual = Math.max(PIXEL_RATIO_MINIMO, Math.min(pixelRatioActual, pixelRatioNativoLimitado));
    renderer.setPixelRatio(pixelRatioActual);
    renderer.setSize(window.innerWidth, window.innerHeight);
    actualizarOrientacionMovil();
});

actualizarFaseVisualLuna();
frame();
inicializarHotbarHUD();
