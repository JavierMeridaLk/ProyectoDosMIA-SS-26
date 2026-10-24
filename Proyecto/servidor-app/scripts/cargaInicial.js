import { reloj } from "./carga/reloj.js";
import "dotenv/config";
import mongoose from "mongoose";
import { conectarDB } from "../config/db.js";
import app from "../aplicacion.js";
import Usuario from "../models/Usuario.js";
import Carpeta from "../models/Carpeta.js";
import Documento from "../models/Documento.js";
import Comparticion from "../models/Comparticion.js";
import Log from "../models/Log.js";
import { crearBaseDatos } from "./crearBaseDatos.js";
import { crearCliente } from "./carga/cliente.js";
import { INICIO, USUARIOS, CARPETAS, DOCUMENTOS, ACTIVIDAD } from "./carga/escenario.js";

const [ADMIN] = USUARIOS

const entre = (min, max) => min + Math.floor(Math.random() * (max - min + 1))

const DIA = 24 * 60 * 60 * 1000
const diaHabil = (n) => new Date(new Date(INICIO).getTime() + (Math.floor(n / 5) * 7 + (n % 5)) * DIA)

const ids = { usuarios: {}, carpetas: {}, documentos: {} }

const buscarRecurso = (referencia) => {
    const [tipo, ...clave] = referencia.split(":")
    const recurso = tipo === "d" ? ids.documentos[clave[0]] : ids.carpetas[clave.join(":")]
    if (!recurso) throw new Error(`No existe el recurso ${referencia}`)
    return { ...recurso, tipo: tipo === "d" ? "documentos" : "carpetas" }
}

const crearDocumento = async (cliente, { numero, user, nombre, extension, forma, ruta }) => {
    const carpetaId = ruta ? ids.carpetas[`${user}:${ruta}`].id : null
    const contenido = `${extension === "md" ? "# " : ""}${nombre}\n\nContenido de prueba.\n`

    let respuesta
    if (forma === "crear") {
        respuesta = await cliente.post("/documentos", { json: { nombre, extension, carpetaId } })
        reloj.avanzarMinutos(entre(5, 25))
        await cliente.put(`/documentos/${respuesta.documento._id}/contenido`, { json: { contenido } })
    } else {
        const form = new FormData()
        if (carpetaId) form.append("carpetaId", carpetaId)
        form.append("archivo", new Blob([contenido], { type: "text/plain" }), `${nombre}.${extension}`)
        respuesta = await cliente.post("/documentos/subir", { form })
    }
    ids.documentos[numero] = { id: respuesta.documento._id }
}

const ACCIONES = {
    compartir: async (cliente, referencia, usuarios, permiso) => {
        const recurso = buscarRecurso(referencia)
        const { errores } = await cliente.post("/comparticiones", {
            json: { tipo: recurso.tipo, recursoId: recurso.id, usuarios, permiso }
        })
        if (errores?.length) throw new Error(`No se pudo compartir ${referencia}: ${JSON.stringify(errores)}`)
    },
    comentar: async (cliente, referencia, texto) => {
        await cliente.post(`/documentos/${buscarRecurso(referencia).id}/comentarios`, { json: { texto } })
    },
    editar: async (cliente, referencia) => {
        const { id } = buscarRecurso(referencia)
        const { contenido } = await cliente.get(`/documentos/${id}`)
        reloj.avanzarMinutos(entre(3, 20))
        const nuevo = `${contenido.trimEnd()}\n\nEditado por ${cliente.user}.\n`
        await cliente.put(`/documentos/${id}/contenido`, { json: { contenido: nuevo } })
    },
    descargar: async (cliente, referencia) => {
        await cliente.get(`/documentos/${buscarRecurso(referencia).id}/descargar`)
    },
    mover: async (cliente, referencia, destino) => {
        const carpetaId = buscarRecurso(destino).id
        await cliente.patch(`/documentos/${buscarRecurso(referencia).id}/mover`, { json: { carpetaId } })
    },
    papelera: async (cliente, referencia) => {
        const recurso = buscarRecurso(referencia)
        await cliente.delete(`/${recurso.tipo}/${recurso.id}`)
    },
    restaurar: async (cliente, referencia) => {
        const recurso = buscarRecurso(referencia)
        await cliente.post(`/papelera/${recurso.tipo}/${recurso.id}/restaurar`)
    },
    eliminarDefinitivo: async (cliente, referencia) => {
        const recurso = buscarRecurso(referencia)
        await cliente.delete(`/papelera/${recurso.tipo}/${recurso.id}`)
    },
    rol: async (cliente, user, rol) => {
        await cliente.patch(`/usuarios/${ids.usuarios[user]}/rol`, { json: { rol } })
    }
}

const armarAgenda = () => {
    const agenda = new Map()
    const agregar = (dia, user, tarea) => {
        if (!agenda.has(dia)) agenda.set(dia, [])
        agenda.get(dia).push({ user, tarea })
    }

    for (const { user, dia, correo } of USUARIOS) {
        if (user !== ADMIN.user) {
            agregar(dia, user, async (cliente) => {
                const usuario = await cliente.registrar(correo)
                ids.usuarios[user] = usuario._id
            })
        }
        for (const ruta of CARPETAS[user]) {
            agregar(dia, user, async (cliente) => {
                const partes = ruta.split("/")
                const padre = partes.length > 1 ? ids.carpetas[`${user}:${partes.slice(0, -1).join("/")}`].id : null
                const { carpeta } = await cliente.post("/carpetas", { json: { nombre: partes.at(-1), padreId: padre } })
                ids.carpetas[`${user}:${ruta}`] = { id: carpeta._id }
            })
        }
    }
    for (const documento of DOCUMENTOS) {
        agregar(documento.dia, documento.user, (cliente) => crearDocumento(cliente, documento))
    }

    for (const [dia, user, accion, ...datos] of ACTIVIDAD) {
        agregar(dia, user, (cliente) => ACCIONES[accion](cliente, ...datos))
    }
    return agenda
}

reloj.reiniciar(INICIO)
mongoose.set("autoCreate", false)
mongoose.set("autoIndex", false)
await conectarDB()
const db = mongoose.connection.db
console.log(`Se borrará y volverá a crear la base "${db.databaseName}"`)
await db.dropDatabase()
await crearBaseDatos(db)

const admin = await Usuario.create({ user: ADMIN.user, correo: ADMIN.correo, contrasena: ADMIN.contrasena, rol: "ADMIN" })
ids.usuarios[ADMIN.user] = admin._id

const servidor = app.listen(0)
await new Promise((resolve) => servidor.once("listening", resolve))
const api = crearCliente(`http://127.0.0.1:${servidor.address().port}/api`)

const clientes = Object.fromEntries(USUARIOS.map((u) => [u.user, api.usuario(u)]))

try {
    const agenda = armarAgenda()
    for (const dia of [...agenda.keys()].sort((a, b) => a - b)) {
        reloj.fijar(diaHabil(dia))
        reloj.avanzarMinutos(entre(0, 45))
        for (const { user, tarea } of agenda.get(dia)) {
            await tarea(clientes[user])
            reloj.avanzarMinutos(entre(4, 30))
        }
    }

    const [usuarios, carpetas, documentos, enPapelera, comparticiones, logs] = await Promise.all([
        Usuario.countDocuments(),
        Carpeta.countDocuments(),
        Documento.countDocuments(),
        Documento.countDocuments({ "eliminacion.enPapelera": true }),
        Comparticion.countDocuments(),
        Log.countDocuments()
    ])
    console.log(`\nCarga completada hasta el ${reloj.ahora().toLocaleString("es-GT")}`)
    console.table({ usuarios, carpetas, documentos, "documentos en papelera": enPapelera, comparticiones, logs })
    console.log("Contraseña de todos los usuarios: 1234")
} catch (error) {
    console.error("\nLa carga inicial falló:", error.message)
    process.exitCode = 1
} finally {
    servidor.close()
    await mongoose.disconnect()
}
