import "dotenv/config";
import mongoose from "mongoose";
import { conectarDB } from "../config/db.js";
import Usuario from "../models/Usuario.js";

//Crea el usuario administrador inicial con los datos del .env
await conectarDB()

const existe = await Usuario.findOne({ user: process.env.ADMIN_USER })

if (existe) {
    console.log(`El admin "${existe.user}" ya existe`)
} else {
    await Usuario.create({
        user: process.env.ADMIN_USER,
        correo: process.env.ADMIN_CORREO,
        contrasena: process.env.ADMIN_CONTRASENA,
        rol: "ADMIN"
    })
    console.log(`Admin "${process.env.ADMIN_USER}" creado`)
}

await mongoose.disconnect()
