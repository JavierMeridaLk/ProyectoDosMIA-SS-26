import Carpeta from "../models/Carpeta.js";
import Documento from "../models/Documento.js";
import { buscarCarpetaPropia, nombreValido } from "../services/carpetas.service.js";
import { accesoACarpeta } from "../services/permisos.service.js";

//Contenido de una carpeta, subcarpetas, documentos y la ruta para la navegacion
export const obtenerContenido = async (req, res) => {
    let carpeta = null
    let permiso = "PROPIETARIO"
    let rutaVisible = []

    if (req.params.id) {
        const acceso = await accesoACarpeta(req.params.id, req.usuario)
        if (!acceso) {
            return res.status(404).json({ mensaje: "Carpeta no encontrada" })
        }
        ;({ carpeta, permiso, rutaVisible } = acceso)
    }

    //Dentro de una carpeta compartida el contenido es del propietario
    const propietarioId = carpeta?.propietarioId ?? req.usuario._id
    const filtro = { propietarioId, "eliminacion.enPapelera": false }
    const idActual = carpeta?._id ?? null

    const [carpetas, documentos, antecesores] = await Promise.all([
        Carpeta.find({ ...filtro, padreId: idActual }).collation({ locale: "es" }).sort({ nombre: 1 }),
        Documento.find({ ...filtro, carpetaId: idActual }, { comentarios: 0 }).sort({ fechaModificacion: -1 }),
        rutaVisible.length ? Carpeta.find({ _id: { $in: rutaVisible } }, { nombre: 1 }) : []
    ])

    //se acomodan en el mismo orden que ruta
    const ruta = rutaVisible.map((id) => antecesores.find((a) => a._id.equals(id))).filter(Boolean)

    res.json({ carpeta, ruta, carpetas, documentos, permiso, propio: permiso === "PROPIETARIO" })
}

export const crear = async (req, res) => {
    const { nombre } = req.body
    const padreId = req.body.padreId || null

    if (!nombreValido(nombre)) {
        return res.status(400).json({ mensaje: "El nombre no es válido" })
    }

    let padre = null
    if (padreId) {
        padre = await buscarCarpetaPropia(padreId, req.usuario)
        if (!padre) {
            return res.status(404).json({ mensaje: "La carpeta destino no existe" })
        }
    }

    //validacion de carpetas repetidas
    const repetida = await Carpeta.exists({
        propietarioId: req.usuario._id,
        padreId: padre?._id ?? null,
        nombre: nombre.trim(),
        "eliminacion.enPapelera": false
    }).collation({ locale: "es", strength: 2 })

    if (repetida) {
        return res.status(409).json({ mensaje: "Ya existe una carpeta con ese nombre aquí" })
    }

    const carpeta = await Carpeta.create({
        nombre: nombre.trim(),
        propietarioId: req.usuario._id,
        padreId: padre?._id ?? null,
        ruta: padre ? [...padre.ruta, padre._id] : []
     //Para la ruta del hijo se suma la ruta del padre y del padre en si
    })

    res.status(201).json({ carpeta })
}
