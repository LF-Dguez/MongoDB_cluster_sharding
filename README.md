# MongoDB Cluster con Sharding en Docker

Actividad 1 — Bases de Datos Avanzadas, UACH Facultad de Ingeniería.

## Arquitectura
- `configsvr`: config server (replica set)
- `shard1`, `shard2`, `shard3`: shards (replica sets de un nodo)
- `mongos`: router de consultas

## Requisitos
- Docker y Docker Compose

## Cómo levantar el cluster
_(pendiente)_

## Estructura
- `docker-compose.yml`: definición de los contenedores
- `configuracion/`: scripts de inicialización y sharding
- `crud/`: operaciones CRUD sobre la colección `usuarios`
- `reporte/`: reporte de la práctica en LaTeX