import "dotenv/config";
import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import { conectarDB } from "../config/db.js";

const eliminacion = {
    bsonType: "object",
    required: ["enPapelera"],
    properties: {
        enPapelera: { bsonType: "bool" },
        fecha: { bsonType: ["date", "null"] },
        origenId: { bsonType: ["objectId", "null"] }
    }
}

const COLECCIONES = {
    usuarios: {
        esquema: {
            bsonType: "object",
            required: ["user", "correo", "contrasena", "rol", "activo", "almacenamiento", "fechaCreacion"],
            properties: {
                user: { bsonType: "string" },
                correo: { bsonType: "string" },
                contrasena: { bsonType: "string" },
                rol: { enum: ["ADMIN", "USUARIO"] },
                activo: { bsonType: "bool" },
                almacenamiento: { bsonType: "number", minimum: 0 },
                fechaCreacion: { bsonType: "date" }
            }
        },
        indices: [
            { campos: { user: 1 }, opciones: { unique: true } },
            { campos: { correo: 1 }, opciones: { unique: true } }
        ]
    },
    carpetas: {
        esquema: {
            bsonType: "object",
            required: ["nombre", "propietarioId", "padreId", "ruta", "eliminacion", "fechaCreacion"],
            properties: {
                nombre: { bsonType: "string" },
                propietarioId: { bsonType: "objectId" },
                padreId: { bsonType: ["objectId", "null"] },
                ruta: { bsonType: "array", items: { bsonType: "objectId" } },
                eliminacion,
                fechaCreacion: { bsonType: "date" }
            }
        },
        indices: [
            { campos: { propietarioId: 1, padreId: 1 } },
            { campos: { ruta: 1 } }
        ]
    },
    documentos: {
        esquema: {
            bsonType: "object",
            required: ["nombre", "extension", "tamano", "propietarioId", "carpetaId", "gridfsId", "eliminacion", "fechaCarga", "fechaModificacion"],
            properties: {
                nombre: { bsonType: "string" },
                extension: { enum: ["txt", "md"] },
                tamano: { bsonType: "number", minimum: 0 },
                propietarioId: { bsonType: "objectId" },
                carpetaId: { bsonType: ["objectId", "null"] },
                gridfsId: { bsonType: "objectId" },
                eliminacion,
                fechaCarga: { bsonType: "date" },
                fechaModificacion: { bsonType: "date" }
            }
        },
        indices: [
            { campos: { propietarioId: 1, carpetaId: 1 } },
            { campos: { nombre: "text" } },
            { campos: { fechaCarga: 1 } }
        ]
    },
    comparticiones: {
        esquema: {
            bsonType: "object",
            required: ["recursoId", "tipoRecurso", "propietarioId", "usuarioId", "permiso", "fecha"],
            properties: {
                recursoId: { bsonType: "objectId" },
                tipoRecurso: { enum: ["DOCUMENTO", "CARPETA"] },
                propietarioId: { bsonType: "objectId" },
                usuarioId: { bsonType: "objectId" },
                permiso: { enum: ["LECTURA", "EDICION", "COMENTAR"] },
                fecha: { bsonType: "date" }
            }
        },
        indices: [
            { campos: { recursoId: 1, usuarioId: 1 }, opciones: { unique: true } },
            { campos: { usuarioId: 1 } }
        ]
    },
    logs: {
        esquema: {
            bsonType: "object",
            required: ["usuarioId", "usuarioNombre", "accion", "recurso", "fecha"],
            properties: {
                usuarioId: { bsonType: "objectId" },
                usuarioNombre: { bsonType: "string" },
                accion: { bsonType: "string" },
                recurso: {
                    bsonType: "object",
                    required: ["id", "tipo", "nombre"],
                    properties: {
                        id: { bsonType: "objectId" },
                        tipo: { enum: ["DOCUMENTO", "CARPETA", "USUARIO"] },
                        nombre: { bsonType: "string" }
                    }
                },
                fecha: { bsonType: "date" }
            }
        },
        indices: [
            { campos: { usuarioId: 1, fecha: -1 } },
            { campos: { accion: 1 } },
            { campos: { propietarioId: 1, fecha: -1 } },
            { campos: { "recurso.id": 1 } }
        ]
    }
}

export const crearBaseDatos = async (db) => {
    const existentes = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name)

    for (const [nombre, { esquema, indices }] of Object.entries(COLECCIONES)) {
        const validator = { $jsonSchema: esquema }
        if (existentes.includes(nombre)) {
            await db.command({ collMod: nombre, validator })
        } else {
            await db.createCollection(nombre, { validator })
        }
        for (const { campos, opciones = {} } of indices) {
            await db.collection(nombre).createIndex(campos, opciones)
        }
        console.log(`Colección ${nombre} lista (${indices.length} índices)`)
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    await conectarDB()
    await crearBaseDatos(mongoose.connection.db)
    await mongoose.disconnect()
}
