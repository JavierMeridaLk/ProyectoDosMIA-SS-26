import multer from "multer";

export const TAMANO_MAXIMO = 5 * 1024 * 1024

//El archivo se queda en memoria y despues se manda a GridFS
const subida = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: TAMANO_MAXIMO }
}).single("archivo")

export const recibirArchivo = (req, res, next) => {
    subida(req, res, (error) => {
        if (error) {
            const mensaje = error.code === "LIMIT_FILE_SIZE"
                ? "El archivo supera el tamaño máximo de 5 MB"
                : "No se pudo recibir el archivo"
            return res.status(400).json({ mensaje })
        }
        next()
    })
}
