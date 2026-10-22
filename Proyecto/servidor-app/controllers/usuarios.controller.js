import mongoose from "mongoose";
import Usuario from "../models/Usuario.js";
import Documento from "../models/Documento.js";
import { registrar, recursoDe, ACCIONES } from "../services/actividad.service.js";

//Todos los usuarios con el espacio que usa cada uno 
export const listarUsuarios = async (req, res) => {
    const [usuarios, uso] = await Promise.all([
        Usuario.find().sort({ fechaCreacion: -1 }).lean(),
        Documento.aggregate([
            { $group: { _id: "$propietarioId", usado: { $sum: "$tamano" }, documentos: { $sum: 1 } } }
        ])
    ])

    res.json({
        usuarios: usuarios.map(({ contrasena, ...usuario }) => {
            const suyo = uso.find((u) => u._id.equals(usuario._id))
            return { ...usuario, usado: suyo?.usado ?? 0, documentos: suyo?.documentos ?? 0 }
        })
    })
}

export const cambiarActivo = async (req, res) => {
    const { id } = req.params
    const { activo } = req.body

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ mensaje: "Id no válido" })
    }
    if (typeof activo !== "boolean") {
        return res.status(400).json({ mensaje: "El estado no es válido" })
    }
    if (id === req.usuario.id && !activo) {
        return res.status(400).json({ mensaje: "No puedes desactivar tu propia cuenta" })
    }

    const usuario = await Usuario.findByIdAndUpdate(id, { activo }, { returnDocument: "after" })
    if (!usuario) {
        return res.status(404).json({ mensaje: "Usuario no encontrado" })
    }
    await registrar(req.usuario, activo ? ACCIONES.ACTIVAR_USUARIO : ACCIONES.DESACTIVAR_USUARIO, recursoDe.usuario(usuario))
    res.json({ usuario })
}

export const cambiarRol = async (req, res) => {
    const { id } = req.params
    const { rol } = req.body

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ mensaje: "Id no válido" })
    }
    if (!["ADMIN", "USUARIO"].includes(rol)) {
        return res.status(400).json({ mensaje: "Rol no válido" })
    }
    //Evita que el admin se quite el rol a si mismo 
    if (id === req.usuario.id && rol !== "ADMIN") {
        return res.status(400).json({ mensaje: "No puedes quitarte el rol de administrador" })
    }

    const usuario = await Usuario.findByIdAndUpdate(id, { rol }, { returnDocument: "after", runValidators: true })
    if (!usuario) {
        return res.status(404).json({ mensaje: "Usuario no encontrado" })
    }
    await registrar(req.usuario, ACCIONES.CAMBIAR_ROL, recursoDe.usuario(usuario), `Nuevo rol: ${rol}`)
    res.json({ usuario })
}

export const cambiarAlmacenamiento = async (req, res) => {
    const { id } = req.params
    const almacenamiento = Number(req.body.almacenamiento)

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ mensaje: "Id no válido" })
    }
    if (!Number.isFinite(almacenamiento) || almacenamiento < 0) {
        return res.status(400).json({ mensaje: "El almacenamiento debe ser un número mayor o igual a 0" })
    }

    const usuario = await Usuario.findByIdAndUpdate(id, { almacenamiento }, { returnDocument: "after", runValidators: true })
    if (!usuario) {
        return res.status(404).json({ mensaje: "Usuario no encontrado" })
    }
    await registrar(req.usuario, ACCIONES.CAMBIAR_ALMACENAMIENTO, recursoDe.usuario(usuario), `Nuevo espacio: ${+(almacenamiento / 1024 ** 3).toFixed(2)} GB`)
    res.json({ usuario })
}
