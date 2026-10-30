# MongoDB Cluster con Sharding en Docker

Actividad 1 — Bases de Datos Avanzadas, UACH Facultad de Ingeniería.

## Arquitectura
- `configsvr`: config server (replica set `configReplSet`)
- `shard1`, `shard2`, `shard3`: shards (replica sets de un nodo)
- `mongos`: router de consultas, único nodo publicado al equipo (puerto **27030**)

Base de datos: `bdcluster`, colección `usuarios`, shard key `{ idUsuario: "hashed" }`.

## Requisitos
- Docker Desktop (Docker y Docker Compose v2)

## Cómo levantar el cluster

Todos los comandos se corren desde la raíz del repositorio. Los scripts de
`configuracion/` y `crud/` se montan dentro del contenedor `mongos` en `/scripts`,
así que se ejecutan con el `mongosh` de ese contenedor. Los comandos están pensados
para PowerShell; en Git Bash hay que anteponer `MSYS_NO_PATHCONV=1` para que no
cambie las rutas `/scripts/...`.

1. Levantar los contenedores:
   ```bash
   docker compose up -d
   docker compose ps
   ```

2. Inicializar el replica set del config server y el de cada shard:
   ```bash
   docker exec mongos mongosh --nodb --quiet --file /scripts/configuracion/01-init-configsvr.js
   docker exec mongos mongosh --nodb --quiet --file /scripts/configuracion/02-init-shards.js
   ```
   Cada uno debe terminar mostrando su miembro como `PRIMARY`.

3. Registrar los shards en `mongos`:
   ```bash
   docker exec mongos mongosh --quiet --file /scripts/configuracion/03-add-shards.js
   ```

4. Crear la colección `usuarios` y fragmentarla por `idUsuario` (hashed):
   ```bash
   docker exec mongos mongosh --quiet --file /scripts/configuracion/04-shard-collection.js
   ```

5. Cargar 3000 usuarios de ejemplo:
   ```bash
   docker exec mongos mongosh --quiet --file /scripts/configuracion/05-cargar-usuarios.js
   ```

6. Revisar el estado del cluster:
   ```bash
   docker exec -it mongos mongosh --eval "sh.status()"
   ```

Desde el equipo (por ejemplo, con Compass) la conexión es `mongodb://localhost:27030`.
Para confirmar que se está hablando con el router y no con otro MongoDB,
`db.hello().msg` debe responder `isdbgrid`.

## Operaciones CRUD

_(pendiente)_

## Estructura
- `docker-compose.yaml`: definición de los contenedores
- `configuracion/`: scripts de inicialización y sharding, en el orden en que se ejecutan
- `crud/`: operaciones CRUD sobre la colección `usuarios`
- `reporte/`: reporte de la práctica en LaTeX
- `CONTEXTO.md`: decisiones y avance del proyecto

## Apagar el cluster
```bash
docker compose down        # conserva los datos en los volúmenes
docker compose down -v     # borra también los volúmenes (hay que volver a configurar)
```
