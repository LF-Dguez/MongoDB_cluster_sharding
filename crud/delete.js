// Paso 8 (Diego). Delete: deleteOne (por idUsuario) y deleteMany.
//
// docker exec mongos mongosh bdcluster --quiet --file /scripts/crud/delete.js

print(`Total antes de borrar: ${db.usuarios.countDocuments()}`);

print("\n--- deleteOne por idUsuario ---");
const resultadoUno = db.usuarios.deleteOne({ idUsuario: 3001 });
printjson(resultadoUno);

print("\n--- deleteMany (resto de los usuarios insertados en create.js) ---");
const resultadoVarios = db.usuarios.deleteMany({ idUsuario: { $gt: 3000 } });
printjson(resultadoVarios);

print(`\nTotal despues de borrar: ${db.usuarios.countDocuments()}`);
