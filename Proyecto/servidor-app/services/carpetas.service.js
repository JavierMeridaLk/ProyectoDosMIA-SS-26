import mongoose from "mongoose";
import Carpeta from "../models/Carpeta.js";

//Busca una carpeta del usuario que no este en la papelera
export const buscarCarpetaPropia = (id, usuario) => {
    if (!mongoose.isValidObjectId(id)) return null
    return Carpeta.findOne({ _id: id, propietarioId: usuario._id, "eliminacion.enPapelera": false })
}

//Nombres para carpetas y documentos
export const nombreValido = (nombre) => {
    return typeof nombre === "string" && nombre.trim().length > 0 && nombre.length <= 100 && !/[\\/]/.test(nombre)
}
