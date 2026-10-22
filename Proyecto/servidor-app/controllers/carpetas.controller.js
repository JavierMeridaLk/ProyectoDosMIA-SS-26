import Carpeta from "../models/Carpeta.js";
import Documento from "../models/Documento.js";
import { buscarCarpetaPropia, nombreValido } from "../services/carpetas.service.js";
import { accesoACarpeta } from "../services/permisos.service.js";
import { registrar, recursoDe, ACCIONES } from "../services/actividad.service.js";

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

    await registrar(req.usuario, ACCIONES.CREAR_CARPETA, recursoDe.carpeta(carpeta))
    res.status(201).json({ carpeta })
}

//Todas mis carpetas activas, para elegir el destino al mover
export const arbol = async (req, res) => {
    const carpetas = await Carpeta.find(
        { propietarioId: req.usuario._id, "eliminacion.enPapelera": false },
        { nombre: 1, padreId: 1, ruta: 1 }
    ).collation({ locale: "es" }).sort({ nombre: 1 }).lean()
    res.json({ carpetas })
}

//Busca si en el destino ya hay otra carpeta activa con ese nombre 
const nombreOcupado = (usuario, padreId, nombre, excepto) => {
    return Carpeta.exists({
        _id: { $ne: excepto },
        propietarioId: usuario._id,
        padreId,
        nombre,
        "eliminacion.enPapelera": false
    }).collation({ locale: "es", strength: 2 })
}

export const renombrar = async (req, res) => {
    const { nombre } = req.body
    if (!nombreValido(nombre)) {
        return res.status(400).json({ mensaje: "El nombre no es válido" })
    }

    const carpeta = await buscarCarpetaPropia(req.params.id, req.usuario)
    if (!carpeta) {
        return res.status(404).json({ mensaje: "Carpeta no encontrada" })
    }
    if (await nombreOcupado(req.usuario, carpeta.padreId, nombre.trim(), carpeta._id)) {
        return res.status(409).json({ mensaje: "Ya existe una carpeta con ese nombre aquí" })
    }

    const anterior = carpeta.nombre
    carpeta.nombre = nombre.trim()
    await carpeta.save()
    await registrar(req.usuario, ACCIONES.RENOMBRAR, recursoDe.carpeta(carpeta), `Antes: ${anterior}`)

    res.json({ carpeta })
}

export const mover = async (req, res) => {
    const carpeta = await buscarCarpetaPropia(req.params.id, req.usuario)
    if (!carpeta) {
        return res.status(404).json({ mensaje: "Carpeta no encontrada" })
    }

    const destinoId = req.body.padreId || null
    let destino = null
    if (destinoId) {
        destino = await buscarCarpetaPropia(destinoId, req.usuario)
        if (!destino) {
            return res.status(404).json({ mensaje: "La carpeta destino no existe" })
        }
    }

    if (destino && (destino._id.equals(carpeta._id) || destino.ruta.some((id) => id.equals(carpeta._id)))) {
        return res.status(400).json({ mensaje: "No puedes mover una carpeta dentro de sí misma o de una de sus subcarpetas" })
    }
    if (String(carpeta.padreId) === String(destino?._id ?? null)) {
        return res.status(400).json({ mensaje: "La carpeta ya está en ese lugar" })
    }
    if (await nombreOcupado(req.usuario, destino?._id ?? null, carpeta.nombre, carpeta._id)) {
        return res.status(409).json({ mensaje: "En el destino ya existe una carpeta con ese nombre" })
    }

    const nuevaRuta = destino ? [...destino.ruta, destino._id] : []

    await Carpeta.collection.updateMany(
        { ruta: carpeta._id },
        [{
            $set: {
                ruta: {
                    $concatArrays: [
                        nuevaRuta,
                        { $slice: ["$ruta", { $indexOfArray: ["$ruta", carpeta._id] }, { $size: "$ruta" }] }
                    ]
                }
            }
        }]
    )

    const origen = carpeta.padreId
        ? (await Carpeta.findById(carpeta.padreId, { nombre: 1 }).lean())?.nombre ?? "Mi Unidad"
        : "Mi Unidad"

    carpeta.padreId = destino?._id ?? null
    carpeta.ruta = nuevaRuta
    await carpeta.save()
    await registrar(req.usuario, ACCIONES.MOVER, recursoDe.carpeta(carpeta), `De ${origen} a ${destino?.nombre ?? "Mi Unidad"}`)

    res.json({ carpeta })
}
