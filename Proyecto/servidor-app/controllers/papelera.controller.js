import mongoose from "mongoose";
import Carpeta from "../models/Carpeta.js";
import Documento from "../models/Documento.js";
import { buscarCarpetaPropia } from "../services/carpetas.service.js";
import { eliminarDeGridFS } from "../services/gridfs.service.js";


const FUERA_DE_PAPELERA = { enPapelera: false, fecha: null, origenId: null }

const MODELOS = { carpetas: Carpeta, documentos: Documento }

//Busca un elemento eliminado directamente por el usuario
const buscarEnPapelera = (Modelo, id, usuario) => {
    if (!mongoose.isValidObjectId(id)) return null
    return Modelo.findOne({
        _id: id,
        propietarioId: usuario._id,
        "eliminacion.enPapelera": true,
        "eliminacion.origenId": null
    })
}

//Si ya existe una carpeta activa con ese nombre en el destino se agrega
const nombreDisponible = async (usuario, padreId, nombre) => {
    let candidato = nombre
    for (let n = 1; ; n++) {
        const existe = await Carpeta.exists({
            propietarioId: usuario._id,
            padreId,
            nombre: candidato,
            "eliminacion.enPapelera": false
        }).collation({ locale: "es", strength: 2 })
        if (!existe) return candidato
        candidato = `${nombre} (${n})`
    }
}

export const enviarDocumentoAPapelera = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ mensaje: "Documento no encontrado" })
    }

    const documento = await Documento.findOneAndUpdate(
        { _id: req.params.id, propietarioId: req.usuario._id, "eliminacion.enPapelera": false },
        { $set: { eliminacion: { enPapelera: true, fecha: new Date(), origenId: null } } },
        { returnDocument: "after" }
    )
    if (!documento) {
        return res.status(404).json({ mensaje: "Documento no encontrado" })
    }
    res.json({ documento })
}

export const enviarCarpetaAPapelera = async (req, res) => {
    const carpeta = await buscarCarpetaPropia(req.params.id, req.usuario)
    if (!carpeta) {
        return res.status(404).json({ mensaje: "Carpeta no encontrada" })
    }

    const fecha = new Date()
    const filtro = { propietarioId: req.usuario._id, "eliminacion.enPapelera": false }

    //Todas las subcarpetas activas salen del indice de ruta en una sola consulta
    const subcarpetas = await Carpeta.find({ ...filtro, ruta: carpeta._id }, { _id: 1 })
    const idsSubcarpetas = subcarpetas.map((c) => c._id)

    //El contenido se marca con origenId  para poder restaurarlo o borrarlo junto con ella
    const porCarpeta = { $set: { eliminacion: { enPapelera: true, fecha, origenId: carpeta._id } } }
    await Documento.updateMany({ ...filtro, carpetaId: { $in: [carpeta._id, ...idsSubcarpetas] } }, porCarpeta)
    await Carpeta.updateMany({ _id: { $in: idsSubcarpetas } }, porCarpeta)

    carpeta.eliminacion = { enPapelera: true, fecha, origenId: null }
    await carpeta.save()

    res.json({ carpeta })
}

export const listarPapelera = async (req, res) => {
    const filtro = {
        propietarioId: req.usuario._id,
        "eliminacion.enPapelera": true,
        "eliminacion.origenId": null
    }

    const [carpetas, documentos] = await Promise.all([
        Carpeta.find(filtro).sort({ "eliminacion.fecha": -1 }).lean(),
        Documento.find(filtro).sort({ "eliminacion.fecha": -1 }).lean()
    ])

    //Nombre de la ubicacion a la que regresaria cada elemento al restaurarlo
    const idsPadres = [...carpetas.map((c) => c.padreId), ...documentos.map((d) => d.carpetaId)].filter(Boolean)
    const padresActivos = await Carpeta.find(
        { _id: { $in: idsPadres }, "eliminacion.enPapelera": false },
        { nombre: 1 }
    ).lean()

    const ubicacion = (padreId) => {
        const padre = padreId && padresActivos.find((p) => p._id.equals(padreId))
        return padre ? padre.nombre : "Mi Unidad"
    }

    res.json({
        carpetas: carpetas.map((c) => ({ ...c, ubicacion: ubicacion(c.padreId) })),
        documentos: documentos.map((d) => ({ ...d, ubicacion: ubicacion(d.carpetaId) }))
    })
}

const restaurarDocumento = async (documento, usuario) => {
    //Regresa a su carpeta si sigue existiendo, si no a la raiz
    const padre = documento.carpetaId ? await buscarCarpetaPropia(documento.carpetaId, usuario) : null
    documento.carpetaId = padre?._id ?? null
    documento.eliminacion = FUERA_DE_PAPELERA
    await documento.save()
    return padre?.nombre ?? "Mi Unidad"
}

const restaurarCarpeta = async (carpeta, usuario) => {
    const padre = carpeta.padreId ? await buscarCarpetaPropia(carpeta.padreId, usuario) : null

    //El padre ya no existe o esta en la papelera
    if (carpeta.padreId && !padre) {
        //se limpia l ruta
        await Carpeta.collection.updateMany(
            { ruta: carpeta._id },
            [{ $set: { ruta: { $slice: ["$ruta", { $indexOfArray: ["$ruta", carpeta._id] }, { $size: "$ruta" }] } } }]
        )
        carpeta.padreId = null
        carpeta.ruta = []
    }

    const regresan = { "eliminacion.origenId": carpeta._id, propietarioId: usuario._id }
    await Documento.updateMany(regresan, { $set: { eliminacion: FUERA_DE_PAPELERA } })
    await Carpeta.updateMany(regresan, { $set: { eliminacion: FUERA_DE_PAPELERA } })

    carpeta.nombre = await nombreDisponible(usuario, carpeta.padreId, carpeta.nombre)
    carpeta.eliminacion = FUERA_DE_PAPELERA
    await carpeta.save()
    return padre?.nombre ?? "Mi Unidad"
}

export const restaurar = async (req, res) => {
    const { tipo, id } = req.params
    const Modelo = MODELOS[tipo]
    if (!Modelo) {
        return res.status(404).json({ mensaje: "Tipo no válido" })
    }

    const elemento = await buscarEnPapelera(Modelo, id, req.usuario)
    if (!elemento) {
        return res.status(404).json({ mensaje: "El elemento no está en la papelera" })
    }

    const ubicacion = tipo === "carpetas"
        ? await restaurarCarpeta(elemento, req.usuario)
        : await restaurarDocumento(elemento, req.usuario)

    res.json({ ubicacion })
}

export const eliminarDefinitivo = async (req, res) => {
    const { tipo, id } = req.params
    const Modelo = MODELOS[tipo]
    if (!Modelo) {
        return res.status(404).json({ mensaje: "Tipo no válido" })
    }

    const elemento = await buscarEnPapelera(Modelo, id, req.usuario)
    if (!elemento) {
        return res.status(404).json({ mensaje: "El elemento no está en la papelera" })
    }

    if (tipo === "documentos") {
        await Documento.deleteOne({ _id: elemento._id })
        await eliminarDeGridFS(elemento.gridfsId)
        return res.json({ eliminados: 1 })
    }

    //Carpeta se borra junto con todo lo que se fue a la papelera con ella
    const deLaCarpeta = { "eliminacion.origenId": elemento._id, propietarioId: req.usuario._id }
    const documentos = await Documento.find(deLaCarpeta, { gridfsId: 1 })

    await Documento.deleteMany({ _id: { $in: documentos.map((d) => d._id) } })
    await Promise.all(documentos.map((d) => eliminarDeGridFS(d.gridfsId)))
    const { deletedCount } = await Carpeta.deleteMany({ $or: [{ _id: elemento._id }, deLaCarpeta] })

    res.json({ eliminados: deletedCount + documentos.length })
}
