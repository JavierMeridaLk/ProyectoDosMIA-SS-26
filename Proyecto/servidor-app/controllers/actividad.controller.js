import Log from "../models/Log.js";
import { ACCIONES } from "../services/actividad.service.js";
import { contiene } from "../services/texto.service.js";

const LIMITE = 50

const TIPOS_RECURSO = ["DOCUMENTO", "CARPETA", "USUARIO"]

//Filtros de accion y fechas
const filtrosComunes = ({ accion, desde, hasta, antes }) => {
    const filtro = {}

    if (accion) {
        if (!Object.values(ACCIONES).includes(accion)) return { error: "Acción no válida" }
        filtro.accion = accion
    }

    const fecha = {}
    for (const [operador, valor] of [["$gte", desde], ["$lte", hasta], ["$lt", antes]]) {
        if (!valor) continue
        const f = new Date(valor)
        if (Number.isNaN(f.getTime())) return { error: "Fecha no válida" }
        fecha[operador] = f
    }
    if (Object.keys(fecha).length) filtro.fecha = fecha

    return { filtro }
}

//Historial de todo el sistema, con filtros por usuario, accion, tipo de recurso y fechas
export const listarLogs = async (req, res) => {
    const { filtro, error } = filtrosComunes(req.query)
    if (error) return res.status(400).json({ mensaje: error })

    const { usuario, tipo } = req.query
    if (usuario?.trim()) {
        filtro.usuarioNombre = contiene(usuario)
    }
    if (tipo) {
        if (!TIPOS_RECURSO.includes(tipo)) return res.status(400).json({ mensaje: "Tipo de recurso no válido" })
        filtro["recurso.tipo"] = tipo
    }

    const registros = await Log.find(filtro).sort({ fecha: -1 }).limit(LIMITE + 1).lean()
    res.json({
        registros: registros.slice(0, LIMITE).map((r) => ({ ...r, propio: r.usuarioId.equals(req.usuario._id) })),
        hayMas: registros.length > LIMITE
    })
}
