// --- MOTOR DE COLISIÓN ---
function manejarColisiones(posicionAnterior) {
    const objetoJugador = controles.getObject();
    const posActual = objetoJugador.position;

    const limiteBorde = tamañoMapa - 0.2;
    if (!jugador.modoEspectador) {
        if (posActual.x > limiteBorde) posActual.x = limiteBorde;
        if (posActual.x < -limiteBorde) posActual.x = -limiteBorde;
        if (posActual.z > limiteBorde) posActual.z = limiteBorde;
        if (posActual.z < -limiteBorde) posActual.z = -limiteBorde;
    }

    if (jugador.modoEspectador) return;
    
    const piesY = posActual.y - jugador.alturaOjos;
    const cabezaY = posActual.y + 0.1;
    jugador.enSuelo = false;
    
    const gx = Math.round(posActual.x);
    const gz = Math.round(posActual.z);

    for (let x = gx - 1; x <= gx + 1; x++) {
        for (let z = gz - 1; z <= gz + 1; z++) {

            const y = obtenerAlturaTerreno(x, z);
            const minX = x - 0.5; const maxX = x + 0.5;
            const minY = y - 0.5; const maxY = y + 0.5;
            const minZ = z - 0.5; const maxZ = z + 0.5;

            if (posActual.x + jugador.ancho > minX && posActual.x - jugador.ancho < maxX &&
                cabezaY > minY && piesY < maxY &&
                posActual.z + jugador.ancho > minZ && posActual.z - jugador.ancho < maxZ) {
                
                if (posicionAnterior.y - jugador.alturaOjos >= maxY - 0.12) {
                    posActual.y = maxY + jugador.alturaOjos;
                    jugador.velocidadY = 0;
                    jugador.enSuelo = true;
                    continue;
                }
                if (posicionAnterior.y + 0.1 <= minY + 0.1) {
                    posActual.y = minY - 0.1; jugador.velocidadY = 0; continue;
                }
                if (posicionAnterior.x + jugador.ancho <= minX + 0.05) posActual.x = minX - jugador.ancho;
                else if (posicionAnterior.x - jugador.ancho >= maxX - 0.05) posActual.x = maxX + jugador.ancho;
                if (posicionAnterior.z + jugador.ancho <= minZ + 0.05) posActual.z = minZ - jugador.ancho;
                else if (posicionAnterior.z - jugador.ancho >= maxZ - 0.05) posActual.z = maxZ + jugador.ancho;
            }
        }
    }

    for (const caja of colisionesCasa) {
        const colisionHorizontal = posActual.x + jugador.ancho > caja.minX
            && posActual.x - jugador.ancho < caja.maxX
            && posActual.z + jugador.ancho > caja.minZ
            && posActual.z - jugador.ancho < caja.maxZ;
        if (!colisionHorizontal || cabezaY <= caja.minY || piesY >= caja.maxY) continue;

        if (posicionAnterior.x + jugador.ancho <= caja.minX) {
            posActual.x = caja.minX - jugador.ancho;
        } else if (posicionAnterior.x - jugador.ancho >= caja.maxX) {
            posActual.x = caja.maxX + jugador.ancho;
        } else if (posicionAnterior.z + jugador.ancho <= caja.minZ) {
            posActual.z = caja.minZ - jugador.ancho;
        } else if (posicionAnterior.z - jugador.ancho >= caja.maxZ) {
            posActual.z = caja.maxZ + jugador.ancho;
        } else if (Math.abs(posActual.x - posicionAnterior.x) >= Math.abs(posActual.z - posicionAnterior.z)) {
            posActual.x = posActual.x < (caja.minX + caja.maxX) / 2
                ? caja.minX - jugador.ancho
                : caja.maxX + jugador.ancho;
        } else {
            posActual.z = posActual.z < (caja.minZ + caja.maxZ) / 2
                ? caja.minZ - jugador.ancho
                : caja.maxZ + jugador.ancho;
        }
    }

    // Sobre el agua congelada, los pies del jugador descansan en la superficie del hielo.
    if (aguaCongelada && obtenerAlturaTerreno(gx, gz) <= NIVEL_AGUA) {
        const piesActuales = posActual.y - jugador.alturaOjos;
        if (piesActuales <= agua.position.y + 0.05) {
            posActual.y = agua.position.y + jugador.alturaOjos;
            jugador.velocidadY = 0;
            jugador.enSuelo = true;
        }
    }
}
