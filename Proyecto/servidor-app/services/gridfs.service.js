import { obtenerBucket } from "../config/db.js";

//Guarda un buffer en GridFS y devuelve el id del archivo creado
export const guardarEnGridFS = (nombre, buffer, metadata) => {
    return new Promise((resolve, reject) => {
        const subida = obtenerBucket().openUploadStream(nombre, { metadata })
        subida.on("error", reject)
        subida.on("finish", () => resolve(subida.id))
        subida.end(buffer)
    })
}

//Lee todo el contenido de un archivo de GridFS
export const leerDeGridFS = async (id) => {
    const partes = []
    for await (const parte of obtenerBucket().openDownloadStream(id)) {
        partes.push(parte)
    }
    return Buffer.concat(partes)
}

export const abrirDescargaGridFS = (id) => obtenerBucket().openDownloadStream(id)

export const eliminarDeGridFS = (id) => obtenerBucket().delete(id)
