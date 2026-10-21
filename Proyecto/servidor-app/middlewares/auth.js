import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

//Verifica el token enviado en el header Authorization
export const verificarToken = async (req, res, next) => {
    const header = req.headers.authorization || ""
    const token = header.startsWith("Bearer ") ? header.slice(7) : null

    if (!token) {
        return res.status(401).json({ mensaje: "No autenticado" })
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        const usuario = await Usuario.findById(payload.id)

        if (!usuario || !usuario.activo) {
            return res.status(401).json({ mensaje: "Usuario no válido" })
        }

        req.usuario = usuario
        next()
    } catch (error) {
        return res.status(401).json({ mensaje: "Token inválido o expirado" })
    }
}

export const soloAdmin = (req, res, next) => {
    if (req.usuario.rol !== "ADMIN") {
        return res.status(403).json({ mensaje: "Acceso solo para administradores" })
    }
    next()
}
