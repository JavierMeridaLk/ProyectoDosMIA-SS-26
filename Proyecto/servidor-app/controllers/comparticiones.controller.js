import mongoose from "mongoose";
import Comparticion from "../models/Comparticion.js";
import Documento from "../models/Documento.js";
import Carpeta from "../models/Carpeta.js";
import Usuario from "../models/Usuario.js";
import { PERMISOS } from "../services/permisos.service.js";
import { contiene } from "../services/texto.service.js";
import { registrar, recursoDe, ACCIONES } from "../services/actividad.service.js";

const TIPOS = {
    documentos: { modelo: Documento, tipoRecurso: "DOCUMENTO" },
    carpetas: { modelo: Carpeta, tipoRecurso: "CARPETA" }
}

const MAXIMO_USUARIOS = 20

//Solo el propietario puede compartir, y el recurso debe estar activo 
const buscarRecursoPropio = (tipo, id, usuario) => {
    if (!TIPOS[tipo] || !mongoose.isValidObjectId(id)) return null
    return TIPOS[tipo].modelo.findOne({
        _id: id,
        propietarioId: usuario._id,
        "eliminacion.enPapelera": false
    }, { nombre: 1, extension: 1, propietarioId: 1 })
}

const recursoComoLog = (tipo, recurso) =>
    tipo === "documentos" ? recursoDe.documento(recurso) : recursoDe.carpeta(recurso)

//cambio d permiso, retiro o comparticion de un recurso propio
const registrarSobreComparticion = async (usuario, accion, comparticion, extra = "") => {
    const tipo = comparticion.tipoRecurso === "DOCUMENTO" ? "documentos" : "carpetas"
    const [recurso, afectado] = await Promise.all([
        TIPOS[tipo].modelo.findById(comparticion.recursoId, { nombre: 1, extension: 1, propietarioId: 1 }).lean(),
        Usuario.findById(comparticion.usuarioId, { user: 1 }).lean()
    ])
    if (!recurso) return
    const detalle = [`Con ${afectado?.user ?? "usuario eliminado"}`, extra].filter(Boolean).join(" · ")
    await registrar(usuario, accion, recursoComoLog(tipo, recurso), detalle)
}

const conUsuario = (comparticion, usuarios) => {
    const usuario = usuarios.find((u) => u._id.equals(comparticion.usuarioId))
    return {
        _id: comparticion._id,
        permiso: comparticion.permiso,
        fecha: comparticion.fecha,
        usuario: usuario ? { _id: usuario._id, user: usuario.user, correo: usuario.correo } : null
    }
}

//Con quien esta compartido un recurso 
export const listarDeRecurso = async (req, res) => {
    const recurso = await buscarRecursoPropio(req.params.tipo, req.params.id, req.usuario)
    if (!recurso) {
        return res.status(404).json({ mensaje: "Recurso no encontrado" })
    }

    const comparticiones = await Comparticion.find({ recursoId: recurso._id }).sort({ fecha: 1 }).lean()
    const usuarios = await Usuario.find({ _id: { $in: comparticiones.map((c) => c.usuarioId) } }, { user: 1, correo: 1 }).lean()

    res.json({ comparticiones: comparticiones.map((c) => conUsuario(c, usuarios)) })
}

//Comparte un recurso con uno o varios usuarios 
export const compartir = async (req, res) => {
    const { tipo, recursoId, permiso } = req.body
    const identificadores = Array.isArray(req.body.usuarios)
        ? [...new Set(req.body.usuarios.map((u) => String(u).trim()).filter(Boolean))]
        : []

    if (!PERMISOS.includes(permiso)) {
        return res.status(400).json({ mensaje: "Permiso no válido" })
    }
    if (!identificadores.length) {
        return res.status(400).json({ mensaje: "Indica al menos un usuario" })
    }
    if (identificadores.length > MAXIMO_USUARIOS) {
        return res.status(400).json({ mensaje: `Puedes compartir con máximo ${MAXIMO_USUARIOS} usuarios a la vez` })
    }

    const recurso = await buscarRecursoPropio(tipo, recursoId, req.usuario)
    if (!recurso) {
        return res.status(404).json({ mensaje: "El recurso no existe o está en la papelera" })
    }

    const compartidas = []
    const errores = []

    for (const identificador of identificadores) {
        //Se busca por usuario o por correo
        const usuario = await Usuario.findOne({
            $or: [{ user: identificador }, { correo: identificador.toLowerCase() }]
        }).collation({ locale: "es", strength: 2 })

        if (!usuario) {
            errores.push({ usuario: identificador, mensaje: "No existe" })
        } else if (usuario._id.equals(req.usuario._id)) {
            errores.push({ usuario: identificador, mensaje: "Es tu propio usuario" })
        } else if (!usuario.activo) {
            errores.push({ usuario: identificador, mensaje: "Está desactivado" })
        } else {
            //Si ya estaba compartido con ese usuario solo se actualiza el permiso 
            const comparticion = await Comparticion.findOneAndUpdate(
                { recursoId: recurso._id, usuarioId: usuario._id },
                {
                    $set: { permiso },
                    $setOnInsert: {
                        tipoRecurso: TIPOS[tipo].tipoRecurso,
                        propietarioId: req.usuario._id,
                        fecha: new Date()
                    }
                },
                { upsert: true, returnDocument: "after" }
            ).lean()
            compartidas.push(conUsuario(comparticion, [usuario]))
            await registrar(req.usuario, ACCIONES.COMPARTIR, recursoComoLog(tipo, recurso), `Con ${usuario.user} · ${permiso}`)
        }
    }

    if (!compartidas.length) {
        return res.status(400).json({
            mensaje: errores.map((e) => `${e.usuario}: ${e.mensaje}`).join(", "),
            errores
        })
    }
    res.status(201).json({ compartidas, errores })
}

export const cambiarPermiso = async (req, res) => {
    const { permiso } = req.body
    if (!PERMISOS.includes(permiso)) {
        return res.status(400).json({ mensaje: "Permiso no válido" })
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ mensaje: "Compartición no encontrada" })
    }

    const comparticion = await Comparticion.findOneAndUpdate(
        { _id: req.params.id, propietarioId: req.usuario._id },
        { $set: { permiso } },
        { returnDocument: "after" }
    )
    if (!comparticion) {
        return res.status(404).json({ mensaje: "Compartición no encontrada" })
    }
    await registrarSobreComparticion(req.usuario, ACCIONES.CAMBIAR_PERMISO, comparticion, `Nuevo permiso: ${permiso}`)
    res.json({ comparticion })
}

export const retirar = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ mensaje: "Compartición no encontrada" })
    }

    const comparticion = await Comparticion.findOneAndDelete({ _id: req.params.id, propietarioId: req.usuario._id })
    if (!comparticion) {
        return res.status(404).json({ mensaje: "Compartición no encontrada" })
    }
    await registrarSobreComparticion(req.usuario, ACCIONES.RETIRAR_PERMISO, comparticion)
    res.json({ eliminada: true })
}

//Recursos que otros usuarios compartieron conmigo 
export const compartidosConmigo = async (req, res) => {
    const comparticiones = await Comparticion.find({ usuarioId: req.usuario._id }).sort({ fecha: -1 }).lean()

    const ids = (tipoRecurso) => comparticiones.filter((c) => c.tipoRecurso === tipoRecurso).map((c) => c.recursoId)
    const activos = { "eliminacion.enPapelera": false }

    const [documentos, carpetas, propietarios] = await Promise.all([
        Documento.find({ _id: { $in: ids("DOCUMENTO") }, ...activos }, { comentarios: 0 }).lean(),
        Carpeta.find({ _id: { $in: ids("CARPETA") }, ...activos }).lean(),
        Usuario.find({ _id: { $in: comparticiones.map((c) => c.propietarioId) } }, { user: 1 }).lean()
    ])

    const recursos = comparticiones
        .map((c) => {
            const recurso = c.tipoRecurso === "DOCUMENTO"
                ? documentos.find((d) => d._id.equals(c.recursoId))
                : carpetas.find((d) => d._id.equals(c.recursoId))
            if (!recurso) return null
            return {
                tipo: c.tipoRecurso === "DOCUMENTO" ? "documento" : "carpeta",
                _id: recurso._id,
                nombre: recurso.nombre,
                extension: recurso.extension ?? null,
                tamano: recurso.tamano ?? null,
                permiso: c.permiso,
                propietario: propietarios.find((p) => p._id.equals(c.propietarioId))?.user ?? "Desconocido",
                fecha: c.fecha
            }
        })
        .filter(Boolean)

    res.json({ recursos })
}

//Sugerencias para el campo de usuarios al compartir 
export const sugerirUsuarios = async (req, res) => {
    const q = String(req.query.q ?? "").trim()
    if (!q) return res.json({ usuarios: [] })

    const usuarios = await Usuario.find({
        _id: { $ne: req.usuario._id },
        activo: true,
        $or: [{ user: contiene(q) }, { correo: contiene(q) }]
    }, { user: 1, correo: 1 }).limit(8).lean()

    res.json({ usuarios })
}
