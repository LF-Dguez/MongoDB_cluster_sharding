// Paso 8 (Diego). Create: insertOne e insertMany sobre bdcluster.usuarios.
//
// docker exec mongos mongosh bdcluster --quiet --file /scripts/crud/create.js
//
// La carga inicial (05-cargar-usuarios.js) uso los ids 1 a 3000, asi que
// aqui se insertan ids mayores a 3000 para no chocar con esos documentos.

print("--- insertOne ---");
const resultadoUno = db.usuarios.insertOne({
  idUsuario: 3001,
  nombre: "Renata",
  apellido: "Salcido",
  email: "renata.salcido3001@correo.com",
  edad: 29,
  direccion: { ciudad: "Chihuahua", estado: "Chihuahua", pais: "México" },
  intereses: ["fotografía", "viajes"],
  fechaRegistro: new Date("2026-10-29"),
  activo: true
});
printjson(resultadoUno);

print("\n--- insertMany ---");
const resultadoVarios = db.usuarios.insertMany([
  {
    idUsuario: 3002,
    nombre: "Emiliano",
    apellido: "Bustillos",
    email: "emiliano.bustillos3002@correo.com",
    edad: 34,
    direccion: { ciudad: "Monterrey", estado: "Nuevo León", pais: "México" },
    intereses: ["deportes", "música"],
    fechaRegistro: new Date("2026-10-29"),
    activo: true
  },
  {
    idUsuario: 3003,
    nombre: "Ximena",
    apellido: "Quiñones",
    email: "ximena.quinones3003@correo.com",
    edad: 22,
    direccion: { ciudad: "Guadalajara", estado: "Jalisco", pais: "México" },
    intereses: ["cine", "lectura"],
    fechaRegistro: new Date("2026-10-29"),
    activo: false
  },
  {
    idUsuario: 3004,
    nombre: "Tomás",
    apellido: "Nevárez",
    email: "tomas.nevarez3004@correo.com",
    edad: 41,
    direccion: { ciudad: "Bogotá", estado: "Cundinamarca", pais: "Colombia" },
    intereses: ["programación"],
    fechaRegistro: new Date("2026-10-29"),
    activo: true
  }
]);
printjson(resultadoVarios);

print("\n--- Insert invalido (debe fallar el validador) ---");
try {
  db.usuarios.insertOne({
    idUsuario: 3005,
    nombre: "Sin apellido ni email"
    // Faltan apellido, email, fechaRegistro y activo: el $jsonSchema lo rechaza.
  });
} catch (error) {
  print(`Rechazado por el validador: ${error.message}`);
}

print(`\nTotal de documentos en bdcluster.usuarios: ${db.usuarios.countDocuments()}`);
