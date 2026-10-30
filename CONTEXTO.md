# Contexto del proyecto: Actividad 1 — MongoDB Cluster

> Documento para el equipo (y para cualquier asistente de IA que use alguno de nosotros).
> Resume **qué estamos construyendo, qué decisiones ya tomamos, en qué paso vamos y qué sigue**.
> Si usas una IA para ayudarte, pásale este archivo completo antes de pedirle algo.

**Materia:** Bases de Datos Avanzadas — UACH, Facultad de Ingeniería, Grupo 5k2
**Docente:** José Saúl De Lira Miramontes
**Equipo:**

| Integrante | Matrícula | Parte |
|---|---|---|
| Osvaldo Hernández Juárez | 385493 | Pasos 1–3: estructura del repo y Docker Compose |
| Luis Felipe Domínguez Chávez | 385500 | Pasos 4–7: configuración del cluster, shard key, carga de datos y plantilla del reporte |
| Diego Flores Verdad Grijalva | 385660 | Paso 8: operaciones CRUD y verificación de la distribución |

**Repositorio:** https://github.com/LF-Dguez/MongoDB_cluster_sharding

---

## 1. Lo que pide el profe

**Objetivo:** implementar soluciones para bases de datos distribuidas.

**Actividad:**
- Configurar un cluster de MongoDB sobre Docker con estos nodos: `configsvr`, `shard1`, `shard2`, `shard3` y `mongos` (router).
- Definir el **shard key** de la colección.
- Realizar operaciones **CRUD** sobre la base de datos distribuida.
- Definir la estructura del documento (nosotros elegimos **usuarios**).

**Evidencia (repositorio en GitHub):**
1. Reporte de la práctica
2. Docker Compose
3. Operaciones de configuración
4. Operaciones CRUD

---

## 2. Arquitectura

```
                 ┌──────────────┐
  cliente ──────▶│    mongos    │  router: no guarda datos, decide a qué shard va cada operación
                 └──────┬───────┘   (único nodo expuesto al host, puerto 27030)
                        │
                 ┌──────▼───────┐
                 │  configsvr   │  metadatos del cluster: qué chunks tiene cada shard
                 └──────────────┘
        ┌───────────────┼───────────────┐
  ┌─────▼────┐    ┌─────▼────┐    ┌─────▼────┐
  │  shard1  │    │  shard2  │    │  shard3  │  aquí viven los documentos, repartidos por shard key
  └──────────┘    └──────────┘    └──────────┘
```

Conceptos clave:
- El cliente **siempre** entra por `mongos`. Si te conectas directo a un shard solo ves su pedazo de los datos.
- El config server es el "mapa" del cluster; si cae, `mongos` no sabe a dónde mandar las consultas.
- MongoDB exige que **cada shard y el config server sean un replica set**, aunque tengan un solo nodo. Por eso hay que inicializar cada uno.

---

## 3. Decisiones ya tomadas (no cambiarlas sin hablarlo)

| Decisión | Valor | Por qué |
|---|---|---|
| Base de datos | `bdcluster` | |
| Colección | `usuarios` (estructura en la sección 5) | Simple y suficiente para demostrar sharding |
| Shard key | `{ idUsuario: "hashed" }` | Ver sección 5 |
| Validación | `$jsonSchema` en la colección | Formaliza la estructura del documento; un insert que no la cumpla falla |
| Nodos por shard | **1 nodo** (replica set de un miembro) | La actividad pide exactamente 5 nodos; 3 por shard serían 13 contenedores |
| Imagen | `mongo:8.0` (fija, no `latest`) | Que el cluster se comporte igual en todas las máquinas; el libro de referencia usa 8.0 |
| Puerto interno | `27017` en todos los contenedores | Cada contenedor tiene su red propia, no chocan; evita los defaults 27018/27019 |
| Puerto publicado | Solo `mongos` → **`27030:27017`** | El 27017 del equipo lo ocupa el MongoDB instalado en Windows; si se publicara ahí, `localhost:27017` podría llegar al servidor local y no al cluster sin marcar error |
| Red | `mongo-cluster` (bridge de Compose) | Los contenedores se encuentran por nombre |
| Scripts | `configuracion/` y `crud/` montados (solo lectura) en `mongos` en `/scripts/...` | Se ejecutan con `mongosh --file` dentro del contenedor, sin depender de que cada quien tenga `mongosh` instalado ni de cómo PowerShell maneja las comillas |
| `docker-compose.yaml` | **Sin** la clave `version:` | Está obsoleta en Compose v2 y genera warning |
| Hosts en `replSetInitiate` / `addShard` | `nombreContenedor:27017`, **nunca** `localhost` | Esa dirección se guarda en la config y la usan otros nodos para conectarse |
| Autenticación | Ninguna | Práctica local; solo `mongos` está publicado |
| Commits | **Uno por paso** | El historial sirve como evidencia del avance |

### Nombres que deben coincidir en todos lados

| Nodo | Contenedor | Replica set (`--replSet` / `_id`) | Volumen |
|---|---|---|---|
| Config server | `configsvr` | `configReplSet` | `configsvr_data` → `/data/configdb` |
| Shard 1 | `shard1` | `shard1ReplSet` | `shard1_data` → `/data/db` |
| Shard 2 | `shard2` | `shard2ReplSet` | `shard2_data` → `/data/db` |
| Shard 3 | `shard3` | `shard3ReplSet` | `shard3_data` → `/data/db` |
| Router | `mongos` | — (no es replica set) | — (no guarda datos; monta `./configuracion` y `./crud`) |

`mongos` se conecta al config server con: `--configdb configReplSet/configsvr:27017`

---

## 4. Estructura del repositorio

```
MongoDB_cluster_sharding/
├── docker-compose.yaml           → evidencia "Docker Compose"
├── configuracion/                → evidencia "Operaciones de Configuración"
│   ├── 01-init-configsvr.js        replica set del config server
│   ├── 02-init-shards.js           replica sets de los 3 shards
│   ├── 03-add-shards.js            registro de los shards en mongos
│   ├── 04-shard-collection.js      colección usuarios + validador + shardCollection
│   └── 05-cargar-usuarios.js       carga de 3000 usuarios de ejemplo
├── crud/                         → evidencia "Operaciones CRUD" (Diego, ver sección 7)
│   ├── create.js
│   ├── read.js
│   ├── update.js
│   └── delete.js
├── reporte/                      → evidencia "Reporte de la práctica" (LaTeX)
│   ├── main.tex
│   ├── logo-uach.png
│   ├── logo-fing.png
│   └── img/                      capturas de terminal
├── CONTEXTO.md                   este archivo
├── .gitignore                    ignora auxiliares de LaTeX (el PDF sí se sube)
└── README.md                     cómo levantar el cluster paso a paso
```

- Los scripts van **numerados** porque el orden importa (no puedes registrar shards antes de que existan sus replica sets).
- Las carpetas vacías tienen un `.gitkeep` para que Git las suba; se borra cuando la carpeta ya tiene contenido.

---

## 5. Estructura del documento y shard key

```js
{
  idUsuario: 1,                  // entero, único (shard key)
  nombre: "Ana",
  apellido: "Torres",
  email: "ana.torres1@correo.com",
  edad: 24,
  direccion: { ciudad: "Chihuahua", estado: "Chihuahua", pais: "México" },
  intereses: ["música", "cine"],
  fechaRegistro: ISODate("2025-03-14"),
  activo: true
}
```

- **Obligatorios** (validador): `idUsuario` (número), `nombre`, `apellido`, `email` (con `@`), `fechaRegistro` (fecha, usar `new Date(...)`), `activo` (booleano). `edad` debe ser número ≥ 0 si viene.
- La carga inicial (`05-cargar-usuarios.js`) crea los ids **1 a 3000**, con una semilla fija: siempre salen los mismos datos. Para inserts nuevos usar ids **mayores a 3000** para no chocar.

**Por qué `{ idUsuario: "hashed" }`:**
- **Cardinalidad** alta: cada usuario tiene un id distinto.
- **Frecuencia** pareja: ningún valor se repite.
- **No monotónico**: idUsuario sí crece, pero el hash reparte los valores consecutivos entre los shards. Por rangos, todos los inserts nuevos caerían en el último chunk.
- **Consultas**: las operaciones por idUsuario van a un solo shard (*targeted*). Las consultas por otro campo (o por rango de idUsuario) van a todos (*scatter-gather*).
- Con hashed, la colección vacía se reparte entre los 3 shards desde el inicio. Con ranged y pocos datos todo se quedaría en un shard (en MongoDB 8.0 el chunk es de 128 MB y el balanceador solo mueve datos cuando la diferencia es grande).

---

## 6. Avance

- [x] **Paso 1** — Estructura del repo, `.gitignore`, `README.md` inicial (Osvaldo).
- [x] **Paso 2** — `docker-compose.yaml` con los 5 nodos (Osvaldo).
- [x] **Paso 3** — `docker compose up -d`: los 5 contenedores levantan correctamente (Osvaldo).
- [x] **Paso 4** — Inicializar replica sets: `01-init-configsvr.js`, `02-init-shards.js` (Luis Felipe).
- [x] **Paso 5** — Registrar los shards en `mongos`: `03-add-shards.js` (Luis Felipe).
- [x] **Paso 6** — Documento de usuarios y shard key (Luis Felipe).
- [x] **Paso 7** — Shardear la colección y cargar datos: `04-shard-collection.js`, `05-cargar-usuarios.js` (Luis Felipe).
- [ ] **Paso 8** — Operaciones CRUD y verificar distribución ← **siguiente, Diego** (sección 7).
- [ ] **Paso 9** — Reporte: secciones 1 a 6 y conclusión ya escritas (Luis Felipe); falta la sección CRUD (Diego), compilar el PDF y subirlo.

---

## 7. Lo que sigue: Paso 8 (Diego)

### Levantar y configurar el cluster en tu máquina
Desde la raíz del repo (todo está también en el README):
```bash
docker compose up -d
docker exec mongos mongosh --nodb --quiet --file /scripts/configuracion/01-init-configsvr.js
docker exec mongos mongosh --nodb --quiet --file /scripts/configuracion/02-init-shards.js
docker exec mongos mongosh --quiet --file /scripts/configuracion/03-add-shards.js
docker exec mongos mongosh --quiet --file /scripts/configuracion/04-shard-collection.js
docker exec mongos mongosh --quiet --file /scripts/configuracion/05-cargar-usuarios.js
```
Si ya tenías el cluster levantado con el compose anterior (puerto 27017), corre `docker compose up -d` otra vez para que `mongos` tome el puerto 27030 y el montaje de los scripts.

### Qué falta hacer
1. Escribir `crud/create.js`, `crud/read.js`, `crud/update.js` y `crud/delete.js` (borrar `crud/.gitkeep`). Se ejecutan así:
   ```bash
   docker exec mongos mongosh bdcluster --quiet --file /scripts/crud/create.js
   ```
   Con `--file` no se imprime nada automáticamente: usar `print()` / `printjson()` para mostrar resultados.
2. Lo mínimo que debe cubrir:
   - **Create:** `insertOne` e `insertMany` (ids > 3000, respetando el validador). Opcional: un insert inválido para mostrar que el validador lo rechaza.
   - **Read:** `find` por `idUsuario` y por otros campos (p. ej. `direccion.pais`, `intereses`). Mostrar con `explain()` que la consulta por `idUsuario` va a **un solo shard** (`SINGLE_SHARD`) y la otra a **todos** (`SHARD_MERGE`).
   - **Update:** `updateOne` (por `idUsuario`) y `updateMany`.
   - **Delete:** `deleteOne` (por `idUsuario`) y `deleteMany`.
   - **Distribución:** `db.usuarios.getShardDistribution()` y `sh.status()` al final.
3. Tomar capturas de cada script y guardarlas en `reporte/img/` numeradas desde **08** (`08-create.png`, `09-read.png`, …). Las 01–07 son de la configuración.
4. Llenar la sección "Realizar operaciones CRUD…" de `reporte/main.tex`: ahí hay recuadros `\pendiente{...}` y un comentario con el formato. Quitar los `\pendiente` al terminar y agregar una o dos oraciones de CRUD en la conclusión (hay un comentario marcando dónde).
5. Completar la sección "Operaciones CRUD" del `README.md`.
6. Commits uno por paso (por ejemplo: un commit por cada script CRUD y uno para el reporte).

---

## 8. Formato del reporte

- `reporte/main.tex` ya tiene la plantilla de la materia: XeLaTeX + fontspec, **Arial** (respaldo Liberation Sans), código en monoespaciada (Consolas o DejaVu Sans Mono), color institucional `#371E49`, portada de equipo con los tres nombres y matrículas, índice y referencias en APA escritas a mano (no hay `.bib`).
- **Compilar con XeLaTeX**, no con pdfLaTeX. En Overleaf: Menu → Compiler → XeLaTeX. Local: `xelatex main.tex` dos veces dentro de `reporte/`.
- Estilos de código: `jsStyle` para los scripts `.js` (`\lstinputlisting[style=jsStyle]{../crud/create.js}`) y `plainStyle` para comandos.
- Capturas con `\captura{archivo.png}{pie de figura}{ancho}`; si la imagen todavía no existe se ve un recuadro con el nombre del archivo que falta. Ancho sugerido: `(ancho en px / 90) / 16`, máximo 1.0.
- Subtítulos con la redacción literal de la actividad. Español simple pero formal, una o dos oraciones por operación, sin exceso de negritas ni comillas.
- La fecha de la portada (`\fechaEntrega`) se ajusta el día de la entrega.

---

## 9. Instrucciones para asistentes de IA

- Responde en **español**.
- Respeta las decisiones y nombres de las secciones 3 y 5; no propongas otra arquitectura (p. ej. 3 nodos por shard, Atlas, Kubernetes) a menos que se pida explícitamente.
- Trabajamos **paso a paso**, explicando el porqué de cada comando; no generes todo el proyecto de golpe.
- Nunca uses `localhost` como host dentro de `replSetInitiate` o `sh.addShard()`.
- Todo acceso del cliente al cluster es vía `mongos`: `mongodb://localhost:27030` desde el host, o `docker exec mongos mongosh ...`.
- Los scripts de configuración y CRUD van en `configuracion/` y `crud/` como archivos `.js` que se ejecutan con `mongosh --file /scripts/...` dentro del contenedor `mongos`.

## 10. Referencias usadas

- Borucki, A. (2025). Capítulo 9 "Using replication and sharding", *MongoDB 8.0 in Action* (3a ed.). Manning.
- Harsh, "Setting Up MongoDB Cluster: Replication, Sharding, and High Availability" (Medium, 2024).
- udaykirankavaturu, *sharding-demo* — https://github.com/udaykirankavaturu/sharding-demo
- Documentación oficial: https://www.mongodb.com/docs/manual/sharding
