// Paso 5. Registra los tres shards en el cluster.
//
// docker exec mongos mongosh --quiet
//   --file /scripts/configuracion/03-add-shards.js
//
// Sin --nodb, mongosh se conecta al mongos del propio contenedor. El formato
// es "nombreReplicaSet/host:puerto". mongos guarda el registro en el config
// server, y desde ese momento sabe a que nodos puede mandar los datos.

const shards = [
  "shard1ReplSet/shard1:27017",
  "shard2ReplSet/shard2:27017",
  "shard3ReplSet/shard3:27017"
];

shards.forEach(cadena => {
  const res = sh.addShard(cadena);
  print(`addShard ${cadena}: ok ${res.ok}`);
});

print("\nShards registrados:");
db.adminCommand({ listShards: 1 }).shards
  .forEach(s => print(`  ${s._id}  ${s.host}`));
