# ============================================================
# backup_service/Dockerfile
#
# Estrategia: node:20-slim como imagen base (basada en Debian)
# y se instala encima el paquete "default-mysql-client" que
# incluye el binario "mysqldump" que necesitamos para generar
# los respaldos.
#
# NOTA: No usamos mysql:8.0 como base porque esa imagen está
# construida sobre Oracle Linux, que usa "microdnf" en lugar
# de "apt-get", lo que complica instalar Node.js.
# En cambio, node:20-slim ya trae Node.js y usa Debian/apt-get,
# permitiéndonos instalar el cliente MySQL de forma sencilla.
# ============================================================

FROM node:20-slim

# ── Instalar el cliente MySQL (incluye mysqldump) ─────────────
# "default-mysql-client" es el paquete Debian que provee las
# herramientas de línea de comandos de MySQL, entre ellas
# "mysqldump", que es el comando que ejecutamos para hacer
# el respaldo. Sin este paquete, mysqldump no existiría
# dentro del contenedor y el servicio fallaría.
RUN apt-get update && \
    apt-get install -y --no-install-recommends default-mysql-client && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# ── Directorio de trabajo ────────────────────────────────────
WORKDIR /app

# ── Copiar dependencias primero (aprovecha cache de Docker) ──
# Si package.json no cambia entre builds, Docker reutiliza
# la capa de node_modules sin reinstalar todo.
COPY package.json ./
RUN npm install --omit=dev

# ── Copiar el código fuente del servicio ─────────────────────
COPY src/ ./src/

# ── Crear el directorio donde se guardarán los respaldos ─────
# Este path coincide con el punto de montaje del volumen
# "backup_data" declarado en docker-compose.yml,
# por lo que los archivos .sql persisten entre reinicios.
RUN mkdir -p /app/uploads

# ── Puerto que expone el servicio HTTP ────────────────────────
EXPOSE 3000

# ── Comando de inicio ─────────────────────────────────────────
CMD ["node", "src/index.js"]
