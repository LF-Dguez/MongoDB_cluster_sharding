// Paso 7b. Carga inicial de usuarios a traves de mongos.
//
// docker exec mongos mongosh --quiet
//   --file /scripts/configuracion/05-cargar-usuarios.js
//
// Genera 3000 usuarios con datos de ejemplo. Usa un generador con semilla
// fija para que cada vez que se corra salgan los mismos datos.

const TOTAL = 3000;
const bd = db.getSiblingDB("bdcluster");

let semilla = 2026;
function azar(n) {
  semilla = (semilla * 16807) % 2147483647;
  return semilla % n;
}
const elegir = lista => lista[azar(lista.length)];

const nombres = [
  "Ana", "Luis", "María", "Carlos", "Sofía", "Jorge", "Valeria",
  "Diego", "Fernanda", "Miguel", "Daniela", "José", "Camila", "Andrés",
  "Paola", "Ricardo", "Lucía", "Fernando", "Gabriela", "Raúl"
];
const apellidos = [
  "García", "Hernández", "Martínez", "López", "González", "Pérez",
  "Rodríguez", "Sánchez", "Ramírez", "Torres", "Flores", "Rivera",
  "Gómez", "Díaz", "Cruz", "Morales", "Reyes", "Ortiz", "Chávez",
  "Domínguez"
];
const ubicaciones = [
  { ciudad: "Chihuahua", estado: "Chihuahua", pais: "México" },
  { ciudad: "Ciudad Juárez", estado: "Chihuahua", pais: "México" },
  { ciudad: "Monterrey", estado: "Nuevo León", pais: "México" },
  { ciudad: "Guadalajara", estado: "Jalisco", pais: "México" },
  { ciudad: "Ciudad de México", estado: "CDMX", pais: "México" },
  { ciudad: "Puebla", estado: "Puebla", pais: "México" },
  { ciudad: "El Paso", estado: "Texas", pais: "Estados Unidos" },
  { ciudad: "Bogotá", estado: "Cundinamarca", pais: "Colombia" },
  { ciudad: "Madrid", estado: "Madrid", pais: "España" },
  { ciudad: "Buenos Aires", estado: "Buenos Aires", pais: "Argentina" }
];
const temas = [
  "música", "cine", "deportes", "videojuegos", "lectura", "viajes",
  "programación", "cocina", "fotografía", "arte"
];

// Para el email: minusculas y sin acentos
const sinAcentos = t => t.toLowerCase()
  .replace(/[áéíóú]/g, c => "aeiou"["áéíóú".indexOf(c)]);

const inicio = new Date("2023-01-01").getTime();
const dias = 1370; // hasta octubre de 2026

const usuarios = [];
for (let id = 1; id <= TOTAL; id++) {
  const nombre = elegir(nombres);
  const apellido = elegir(apellidos);
  usuarios.push({
    idUsuario: id,
    nombre: nombre,
    apellido: apellido,
    email: `${sinAcentos(nombre)}.${sinAcentos(apellido)}${id}@correo.com`,
    edad: 18 + azar(53),
    direccion: elegir(ubicaciones),
    intereses: [...new Set([elegir(temas), elegir(temas), elegir(temas)])],
    fechaRegistro: new Date(inicio + azar(dias) * 86400000),
    activo: azar(10) < 8
  });
}

bd.usuarios.deleteMany({});
for (let i = 0; i < usuarios.length; i += 1000) {
  bd.usuarios.insertMany(usuarios.slice(i, i + 1000));
}

print(`Usuarios en bdcluster.usuarios: ${bd.usuarios.countDocuments()}`);
print("\nDocumentos por shard:");
bd.usuarios.aggregate([{ $collStats: { count: {} } }, { $sort: { shard: 1 } }])
  .forEach(s => print(`  ${s.shard}: ${s.count}`));
