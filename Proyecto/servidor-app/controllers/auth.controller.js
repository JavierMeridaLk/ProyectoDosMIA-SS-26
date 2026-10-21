import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

const generarToken = (usuario) => {
    return jwt.sign(
        { id: usuario._id, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRA }
    )
}

export const registro = async (req, res) => {
    const { correo, user, contrasena, confirmacion } = req.body

    if (!correo || !user || !contrasena || !confirmacion) {
        return res.status(400).json({ mensaje: "Todos los campos son obligatorios" })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        return res.status(400).json({ mensaje: "El correo no es válido" })
    }
    if (contrasena.length < 4) {
        return res.status(400).json({ mensaje: "La contraseña debe tener al menos 4 caracteres" })
    }
    if (contrasena !== confirmacion) {
        return res.status(400).json({ mensaje: "Las contraseñas no coinciden" })
    }

    try {
        //El rol y el almacenamiento no se toman del body
        const usuario = await Usuario.create({ correo, user, contrasena })
        res.status(201).json({ token: generarToken(usuario), usuario })
    } catch (error) {
        //indice unico duplicado
        if (error.code === 11000) {
            const campo = Object.keys(error.keyPattern)[0] === "user" ? "usuario" : "correo"
            return res.status(409).json({ mensaje: `El ${campo} ya está registrado` })
        }
        res.status(500).json({ mensaje: "Error al registrar el usuario" })
    }
}

export const login = async (req, res) => {
    const { user, contrasena } = req.body

    if (!user || !contrasena) {
        return res.status(400).json({ mensaje: "Usuario y contraseña son obligatorios" })
    }

    try {
        const usuario = await Usuario.findOne({ user: user.trim() }).select("+contrasena")

        if (!usuario || !(await usuario.compararContrasena(contrasena))) {
            return res.status(401).json({ mensaje: "Usuario o contraseña incorrectos" })
        }
        if (!usuario.activo) {
            return res.status(403).json({ mensaje: "El usuario está desactivado" })
        }

        res.json({ token: generarToken(usuario), usuario })
    } catch (error) {
        res.status(500).json({ mensaje: "Error al iniciar sesión" })
    }
}

export const perfil = (req, res) => {
    res.json({ usuario: req.usuario })
}
