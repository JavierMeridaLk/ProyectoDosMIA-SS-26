import mongoose from "mongoose";
import Usuario from "../models/Usuario.js";

export const listarUsuarios = async (req, res) => {
    const usuarios = await Usuario.find().sort({ fechaCreacion: -1 })
    res.json({ usuarios })
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
    res.json({ usuario })
}
