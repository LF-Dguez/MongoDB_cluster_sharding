// Paso 4b. Inicializa el replica set de cada shard.
//
// docker exec mongos mongosh --nodb --quiet
//   --file /scripts/configuracion/02-init-shards.js
//
// Es lo mismo que en el config server, con tres diferencias: el _id del
// replica set, el host del miembro y que no lleva configsvr: true.

const shards = [
  { rs: "shard1ReplSet", host: "shard1:27017" },
  { rs: "shard2ReplSet", host: "shard2:27017" },
  { rs: "shard3ReplSet", host: "shard3:27017" }
];

shards.forEach(s => {
  const uri = `mongodb://${s.host}/?directConnection=true`;
  const admin = new Mongo(uri).getDB("admin");

  const res = admin.runCommand({
    replSetInitiate: {
      _id: s.rs,
      members: [{ _id: 0, host: s.host }]
    }
  });

  if (res.ok === 1) {
    print(`${s.rs}: replica set iniciado`);
  } else if (res.codeName === "AlreadyInitialized") {
    print(`${s.rs}: ya estaba iniciado`);
  } else {
    printjson(res);
    quit(1);
  }

  for (let i = 0; i < 30; i++) {
    if (admin.runCommand({ hello: 1 }).isWritablePrimary) break;
    sleep(1000);
  }

  const estado = admin.runCommand({ replSetGetStatus: 1 });
  estado.members.forEach(m => print(`  ${m.name}  ${m.stateStr}`));
});
