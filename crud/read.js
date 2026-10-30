// Paso 8 (Diego). Read: consultas por idUsuario (shard key) y por otros
// campos, mas explain() para comparar como enruta mongos cada una.
//
// docker exec mongos mongosh bdcluster --quiet --file /scripts/crud/read.js

print("--- find por idUsuario (va a un solo shard) ---");
printjson(db.usuarios.findOne({ idUsuario: 1500 }));

print("\n--- find por direccion.pais (va a todos los shards) ---");
db.usuarios.find({ "direccion.pais": "Colombia" }).limit(3).forEach(printjson);
print(`Total con direccion.pais "Colombia": ${db.usuarios.countDocuments({ "direccion.pais": "Colombia" })}`);

print("\n--- find por intereses (va a todos los shards) ---");
print(`Total con "cine" en intereses: ${db.usuarios.countDocuments({ intereses: "cine" })}`);

print("\n--- explain: find por idUsuario ---");
const explainPorId = db.usuarios.find({ idUsuario: 1500 }).explain("executionStats");
print(`winningPlan.stage: ${explainPorId.queryPlanner.winningPlan.stage}`);
printjson(Object.keys(explainPorId.queryPlanner.winningPlan.shards ?? {}));
print(`nReturned: ${explainPorId.executionStats.nReturned}`);

print("\n--- explain: find por direccion.pais ---");
const explainPorPais = db.usuarios.find({ "direccion.pais": "Colombia" }).explain("executionStats");
print(`winningPlan.stage: ${explainPorPais.queryPlanner.winningPlan.stage}`);
print(`nReturned: ${explainPorPais.executionStats.nReturned}`);
