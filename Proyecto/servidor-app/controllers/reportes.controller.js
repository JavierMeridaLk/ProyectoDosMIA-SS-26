import mongoose from "mongoose";
import Documento from "../models/Documento.js";
import Comparticion from "../models/Comparticion.js";
import Log from "../models/Log.js";

const TOP = 10
const MAXIMO_FILAS = 500
const PERIODOS = { dia: "day", semana: "week", mes: "month" }
const FORMATO_PERIODO = { dia: "%Y-%m-%d", semana: "%Y-%m-%d", mes: "%Y-%m" }

//arma el filtro de fechas para el campo indicado
const rangoDeFechas = (query, campo) => {
    const rango = {}
    for (const [operador, valor] of [["$gte", query.desde], ["$lte", query.hasta]]) {
        if (!valor) continue
        const fecha = new Date(valor)
        if (Number.isNaN(fecha.getTime())) return { error: "Fecha no válida" }
        rango[operador] = fecha
    }
    return { filtro: Object.keys(rango).length ? { [campo]: rango } : {} }
}

const usuarioValido = (id) => mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null

//Etapas para traer el nombre de un usuario 
const conNombreDeUsuario = (campoId, como) => [
    { $lookup: { from: "usuarios", localField: campoId, foreignField: "_id", as: como, pipeline: [{ $project: { user: 1 } }] } },
    { $set: { [como]: { $ifNull: [{ $first: `$${como}.user` }, "Desconocido"] } } }
]

//Etapas para traer el nombre del recurso de una comparticion 
const conNombreDeRecurso = [
    { $lookup: { from: "documentos", localField: "recursoId", foreignField: "_id", as: "documento", pipeline: [{ $project: { nombre: 1, extension: 1 } }] } },
    { $lookup: { from: "carpetas", localField: "recursoId", foreignField: "_id", as: "carpeta", pipeline: [{ $project: { nombre: 1 } }] } },
    {
        $set: {
            recurso: {
                $ifNull: [
                    { $concat: [{ $first: "$documento.nombre" }, ".", { $first: "$documento.extension" }] },
                    { $first: "$carpeta.nombre" },
                    "Eliminado"
                ]
            },
            tipo: "$tipoRecurso"
        }
    }
]

const responder = (res, filas) => res.json({ filas })

//Archivos y almacenamiento

// archivos agrupados por tipo 
export const archivosPorTipo = async (req, res) => {
    const filas = await Documento.aggregate([
        {
            $group: {
                _id: "$extension",
                cantidad: { $sum: 1 },
                enPapelera: { $sum: { $cond: ["$eliminacion.enPapelera", 1, 0] } },
                tamano: { $sum: "$tamano" }
            }
        },
        { $sort: { cantidad: -1 } },
        {
            $project: {
                _id: 0,
                tipo: { $toUpper: "$_id" },
                activos: { $subtract: ["$cantidad", "$enPapelera"] },
                enPapelera: 1,
                cantidad: 1,
                tamano: 1
            }
        }
    ])
    responder(res, filas)
}

//Archivos cargados dentro de un rango de fechas
export const archivosPorFecha = async (req, res) => {
    const { filtro, error } = rangoDeFechas(req.query, "fechaCarga")
    if (error) return res.status(400).json({ mensaje: error })

    const filas = await Documento.aggregate([
        { $match: filtro },
        { $sort: { fechaCarga: -1 } },
        { $limit: MAXIMO_FILAS },
        ...conNombreDeUsuario("propietarioId", "propietario"),
        {
            $project: {
                _id: 0,
                nombre: { $concat: ["$nombre", ".", "$extension"] },
                tipo: { $toUpper: "$extension" },
                propietario: 1,
                tamano: 1,
                fechaCarga: 1
            }
        }
    ])
    responder(res, filas)
}

//Archivos con mayor cantidad de operaciones registradas 
export const archivosConMasOperaciones = async (req, res) => {
    const filas = await Log.aggregate([
        { $match: { "recurso.tipo": "DOCUMENTO" } },
        { $sort: { fecha: -1 } },
        {
            $group: {
                _id: "$recurso.id",
                nombre: { $first: "$recurso.nombre" },
                propietarioId: { $first: "$propietarioId" },
                operaciones: { $sum: 1 },
                ultima: { $first: "$fecha" }
            }
        },
        { $sort: { operaciones: -1, ultima: -1 } },
        { $limit: TOP },
        ...conNombreDeUsuario("propietarioId", "propietario"),
        { $lookup: { from: "documentos", localField: "_id", foreignField: "_id", as: "documento", pipeline: [{ $project: { eliminacion: 1 } }] } },
        {
            $project: {
                _id: 0,
                nombre: 1,
                propietario: 1,
                operaciones: 1,
                ultima: 1,
                estado: {
                    $switch: {
                        branches: [
                            { case: { $eq: [{ $size: "$documento" }, 0] }, then: "Eliminado" },
                            { case: { $first: "$documento.eliminacion.enPapelera" }, then: "En papelera" }
                        ],
                        default: "Activo"
                    }
                }
            }
        }
    ])
    responder(res, filas)
}

//Usuarios

//Top 10 usuarios con mayor cantidad de archivos almacenados
export const topUsuariosPorArchivos = async (req, res) => {
    const filas = await Documento.aggregate([
        { $group: { _id: "$propietarioId", archivos: { $sum: 1 }, tamano: { $sum: "$tamano" } } },
        { $sort: { archivos: -1, tamano: -1 } },
        { $limit: TOP },
        { $lookup: { from: "usuarios", localField: "_id", foreignField: "_id", as: "usuario", pipeline: [{ $project: { user: 1, correo: 1 } }] } },
        {
            $project: {
                _id: 0,
                usuario: { $ifNull: [{ $first: "$usuario.user" }, "Desconocido"] },
                correo: { $first: "$usuario.correo" },
                archivos: 1,
                tamano: 1
            }
        }
    ])
    responder(res, filas)
}

//Usuarios con mayor cantidad de recursos compartidos
export const usuariosQueMasComparten = async (req, res) => {
    const filas = await Comparticion.aggregate([
        {
            $group: {
                _id: "$propietarioId",
                recursos: { $addToSet: "$recursoId" },
                destinatarios: { $addToSet: "$usuarioId" },
                comparticiones: { $sum: 1 }
            }
        },
        { $set: { recursos: { $size: "$recursos" }, destinatarios: { $size: "$destinatarios" } } },
        { $sort: { recursos: -1, comparticiones: -1 } },
        { $limit: TOP },
        ...conNombreDeUsuario("_id", "usuario"),
        { $project: { _id: 0, usuario: 1, recursos: 1, destinatarios: 1, comparticiones: 1 } }
    ])
    responder(res, filas)
}

//Comparticion 

//Archivos compartidos con mayor cantidad de usuarios
export const archivosMasCompartidos = async (req, res) => {
    const filas = await Comparticion.aggregate([
        { $match: { tipoRecurso: "DOCUMENTO" } },
        { $group: { _id: "$recursoId", usuarios: { $sum: 1 }, propietarioId: { $first: "$propietarioId" } } },
        { $sort: { usuarios: -1 } },
        { $limit: TOP },
        { $lookup: { from: "documentos", localField: "_id", foreignField: "_id", as: "documento", pipeline: [{ $project: { nombre: 1, extension: 1 } }] } },
        ...conNombreDeUsuario("propietarioId", "propietario"),
        {
            $project: {
                _id: 0,
                nombre: {
                    $ifNull: [{ $concat: [{ $first: "$documento.nombre" }, ".", { $first: "$documento.extension" }] }, "Eliminado"]
                },
                propietario: 1,
                usuarios: 1
            }
        }
    ])
    responder(res, filas)
}

//Recursos compartidos por un usuario seleccionado 
export const compartidosPorUsuario = async (req, res) => {
    const usuarioId = usuarioValido(req.query.usuarioId)
    if (!usuarioId) return res.status(400).json({ mensaje: "Selecciona un usuario" })

    const filas = await Comparticion.aggregate([
        { $match: { propietarioId: usuarioId } },
        { $sort: { fecha: -1 } },
        ...conNombreDeRecurso,
        ...conNombreDeUsuario("usuarioId", "compartidoCon"),
        { $project: { _id: 0, recurso: 1, tipo: 1, compartidoCon: 1, permiso: 1, fecha: 1 } }
    ])
    responder(res, filas)
}

//Recursos recibidos por un usuario seleccionado 
export const recibidosPorUsuario = async (req, res) => {
    const usuarioId = usuarioValido(req.query.usuarioId)
    if (!usuarioId) return res.status(400).json({ mensaje: "Selecciona un usuario" })

    const filas = await Comparticion.aggregate([
        { $match: { usuarioId } },
        { $sort: { fecha: -1 } },
        ...conNombreDeRecurso,
        ...conNombreDeUsuario("propietarioId", "propietario"),
        { $project: { _id: 0, recurso: 1, tipo: 1, propietario: 1, permiso: 1, fecha: 1 } }
    ])
    responder(res, filas)
}

// Actividad

//Historial de actividad de un usuario dentro de un rango de fechas
export const actividadDeUsuario = async (req, res) => {
    const usuarioId = usuarioValido(req.query.usuarioId)
    if (!usuarioId) return res.status(400).json({ mensaje: "Selecciona un usuario" })
    const { filtro, error } = rangoDeFechas(req.query, "fecha")
    if (error) return res.status(400).json({ mensaje: error })

    const filas = await Log.aggregate([
        { $match: { usuarioId, ...filtro } },
        { $sort: { fecha: -1 } },
        { $limit: MAXIMO_FILAS },
        {
            $project: {
                _id: 0,
                accion: 1,
                tipo: "$recurso.tipo",
                recurso: "$recurso.nombre",
                detalle: 1,
                fecha: 1
            }
        }
    ])
    responder(res, filas)
}

//antidad de operaciones agrupadas por tipo de recurso
export const operacionesPorTipo = async (req, res) => {
    const { filtro, error } = rangoDeFechas(req.query, "fecha")
    if (error) return res.status(400).json({ mensaje: error })

    const filas = await Log.aggregate([
        { $match: filtro },
        {
            $group: {
                _id: "$recurso.tipo",
                operaciones: { $sum: 1 },
                usuarios: { $addToSet: "$usuarioId" }
            }
        },
        { $sort: { operaciones: -1 } },
        { $project: { _id: 0, tipo: "$_id", operaciones: 1, usuarios: { $size: "$usuarios" } } }
    ])
    responder(res, filas)
}

//Cantidad de operaciones agrupadas por periodo 
export const operacionesPorPeriodo = async (req, res) => {
    const periodo = req.query.periodo ?? "dia"
    if (!PERIODOS[periodo]) return res.status(400).json({ mensaje: "Periodo no válido" })
    const { filtro, error } = rangoDeFechas(req.query, "fecha")
    if (error) return res.status(400).json({ mensaje: error })

    const zona = req.query.zona || "UTC"
    try {
        Intl.DateTimeFormat("es", { timeZone: zona })
    } catch {
        return res.status(400).json({ mensaje: "Zona horaria no válida" })
    }

    const filas = await Log.aggregate([
        { $match: filtro },
        {
            $group: {
                _id: { $dateTrunc: { date: "$fecha", unit: PERIODOS[periodo], timezone: zona, startOfWeek: "monday" } },
                operaciones: { $sum: 1 },
                usuarios: { $addToSet: "$usuarioId" }
            }
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                _id: 0,
                periodo: { $dateToString: { date: "$_id", format: FORMATO_PERIODO[periodo], timezone: zona } },
                operaciones: 1,
                usuarios: { $size: "$usuarios" }
            }
        }
    ])
    responder(res, filas)
}

//Principales acciones realizadas en el sistema
export const principalesAcciones = async (req, res) => {
    const { filtro, error } = rangoDeFechas(req.query, "fecha")
    if (error) return res.status(400).json({ mensaje: error })

    const filas = await Log.aggregate([
        { $match: filtro },
        { $group: { _id: "$accion", cantidad: { $sum: 1 }, usuarios: { $addToSet: "$usuarioId" } } },
        { $setWindowFields: { output: { total: { $sum: "$cantidad", window: { documents: ["unbounded", "unbounded"] } } } } },
        { $sort: { cantidad: -1 } },
        { $limit: TOP },
        {
            $project: {
                _id: 0,
                accion: "$_id",
                cantidad: 1,
                usuarios: { $size: "$usuarios" },
                porcentaje: { $round: [{ $multiply: [{ $divide: ["$cantidad", "$total"] }, 100] }, 1] }
            }
        }
    ])
    responder(res, filas)
}
