// Pasos 6 y 7a. Crea la coleccion usuarios con su estructura y la fragmenta.
//
// docker exec mongos mongosh --quiet
//   --file /scripts/configuracion/04-shard-collection.js
//
// Estructura de un documento de usuarios:
// {
//   idUsuario: 1,                  // entero, unico (shard key)
//   nombre: "Ana",
//   apellido: "Torres",
//   email: "ana.torres1@correo.com",
//   edad: 24,
//   direccion: { ciudad: "Chihuahua", estado: "Chihuahua", pais: "México" },
//   intereses: ["música", "cine"],
//   fechaRegistro: ISODate("2025-03-14"),
//   activo: true
// }
//
// Shard key: { idUsuario: "hashed" }
//  - Cardinalidad alta: cada usuario tiene un id distinto.
//  - idUsuario crece con cada registro; por rangos, todas las inserciones
//    nuevas caerian en el ultimo chunk. El hash lo evita.
//  - Con hash, MongoDB reparte la coleccion vacia entre los tres shards
//    desde el inicio, aunque haya pocos documentos.
//  - Buscar, actualizar o borrar por idUsuario va a un solo shard.

const bd = db.getSiblingDB("bdcluster");

bd.usuarios.drop();

bd.createCollection("usuarios", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["idUsuario", "nombre", "apellido", "email",
                 "fechaRegistro", "activo"],
      properties: {
        idUsuario: { bsonType: "number" },
        nombre: { bsonType: "string" },
        apellido: { bsonType: "string" },
        email: { bsonType: "string", pattern: "^.+@.+$" },
        edad: { bsonType: "number", minimum: 0 },
        direccion: {
          bsonType: "object",
          properties: {
            ciudad: { bsonType: "string" },
            estado: { bsonType: "string" },
            pais: { bsonType: "string" }
          }
        },
        intereses: { bsonType: "array", items: { bsonType: "string" } },
        fechaRegistro: { bsonType: "date" },
        activo: { bsonType: "bool" }
      }
    }
  }
});
print("Coleccion bdcluster.usuarios creada con validador");

printjson(sh.enableSharding("bdcluster"));
printjson(sh.shardCollection("bdcluster.usuarios", { idUsuario: "hashed" }));

// Chunks que quedaron en cada shard antes de insertar datos
print("\nChunks por shard:");
db.getSiblingDB("config").chunks.aggregate([
  { $lookup: { from: "collections", localField: "uuid",
               foreignField: "uuid", as: "col" } },
  { $match: { "col._id": "bdcluster.usuarios" } },
  { $group: { _id: "$shard", chunks: { $sum: 1 } } },
  { $sort: { _id: 1 } }
]).forEach(c => print(`  ${c._id}: ${c.chunks}`));
