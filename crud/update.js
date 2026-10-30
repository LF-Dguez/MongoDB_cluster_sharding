// Paso 8 (Diego). Update: updateOne (por idUsuario) y updateMany.
//
// docker exec mongos mongosh bdcluster --quiet --file /scripts/crud/update.js

print("--- updateOne por idUsuario ---");
const resultadoUno = db.usuarios.updateOne(
  { idUsuario: 1500 },
  { $set: { edad: 99, activo: true } }
);
printjson(resultadoUno);
printjson(db.usuarios.findOne({ idUsuario: 1500 }));

print("\n--- updateMany ---");
const resultadoVarios = db.usuarios.updateMany(
  { "direccion.pais": "Colombia" },
  { $set: { activo: false } }
);
printjson(resultadoVarios);
print(`Inactivos en Colombia despues del update: ${db.usuarios.countDocuments({ "direccion.pais": "Colombia", activo: false })}`);
