import Documento from "../models/Documento.js";
import Carpeta from "../models/Carpeta.js";
import { guardarEnGridFS, leerDeGridFS, abrirDescargaGridFS, eliminarDeGridFS } from "../services/gridfs.service.js";
import { TAMANO_MAXIMO } from "../middlewares/subida.js";
import { convertirAUtf8 } from "../services/codificacion.service.js";
import { buscarCarpetaPropia, nombreValido } from "../services/carpetas.service.js";
import { accesoADocumento, tienePermiso } from "../services/permisos.service.js";
import Usuario from "../models/Usuario.js";
import { registrar, recursoDe, ACCIONES } from "../services/actividad.service.js";

const EXTENSIONES = ["txt", "md"]

const TIPOS_CONTENIDO = {
    txt: "text/plain; charset=utf-8",
    md: "text/markdown; charset=utf-8"
}

//separa el nombre con la extension del archivo
const separarNombre = (nombreCompleto) => {
    const punto = nombreCompleto.lastIndexOf(".")
    if (punto <= 0) return { nombre: nombreCompleto, extension: "" }
    return {
        nombre: nombreCompleto.slice(0, punto).trim(),
        extension: nombreCompleto.slice(punto + 1).toLowerCase()
    }
}

const espacioUsado = async (propietarioId) => {
    const [resultado] = await Documento.aggregate([
        { $match: { propietarioId } },
        { $group: { _id: null, total: { $sum: "$tamano" } } }
    ])
    return resultado?.total ?? 0
}

const hayEspacio = async (usuario, bytesExtra) => {
    return (await espacioUsado(usuario._id)) + bytesExtra <= usuario.almacenamiento
}

const crearDocumento = async (usuario, carpetaId, nombre, extension, buffer) => {
    const gridfsId = await guardarEnGridFS(`${nombre}.${extension}`, buffer, { propietarioId: usuario._id })
    try {
        return await Documento.create({
            nombre,
            extension,
            tamano: buffer.length,
            propietarioId: usuario._id,
            carpetaId,
            gridfsId
        })
    } catch (error) {
        //Si falla el documento no dejamos el contenido huerfano en GridFS
        await eliminarDeGridFS(gridfsId)
        throw error
    }
}

//Valida la carpeta destino que viene en el body. null = raiz
const carpetaDestino = async (carpetaId, usuario) => {
    if (!carpetaId) return { valida: true, id: null, nombre: "Mi Unidad" }
    const carpeta = await buscarCarpetaPropia(carpetaId, usuario)
    return { valida: !!carpeta, id: carpeta?._id ?? null, nombre: carpeta?.nombre }
}

export const obtenerAlmacenamiento = async (req, res) => {
    res.json({
        usado: await espacioUsado(req.usuario._id),
        total: req.usuario.almacenamiento
    })
}

export const crear = async (req, res) => {
    const { nombre, extension, contenido = "" } = req.body

    if (!nombreValido(nombre)) {
        return res.status(400).json({ mensaje: "El nombre no es válido" })
    }
    if (!EXTENSIONES.includes(extension)) {
        return res.status(400).json({ mensaje: "Solo se permiten documentos .txt y .md" })
    }
    if (typeof contenido !== "string") {
        return res.status(400).json({ mensaje: "El contenido no es válido" })
    }

    const carpeta = await carpetaDestino(req.body.carpetaId, req.usuario)
    if (!carpeta.valida) {
        return res.status(404).json({ mensaje: "La carpeta destino no existe" })
    }

    const buffer = Buffer.from(contenido, "utf8")
    if (!(await hayEspacio(req.usuario, buffer.length))) {
        return res.status(400).json({ mensaje: "No tienes espacio suficiente" })
    }

    const documento = await crearDocumento(req.usuario, carpeta.id, nombre.trim(), extension, buffer)
    await registrar(req.usuario, ACCIONES.CREAR_DOCUMENTO, recursoDe.documento(documento))
    res.status(201).json({ documento })
}

export const subir = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ mensaje: "No se envió ningún archivo" })
    }

    
    const nombreOriginal = Buffer.from(req.file.originalname, "latin1").toString("utf8")
    const { nombre, extension } = separarNombre(nombreOriginal)

    if (!EXTENSIONES.includes(extension)) {
        return res.status(400).json({ mensaje: "Solo se permiten archivos .txt y .md" })
    }
    if (!nombreValido(nombre)) {
        return res.status(400).json({ mensaje: "El nombre del archivo no es válido" })
    }

    //Se acepta cualquier codificacion 
    const carpeta = await carpetaDestino(req.body.carpetaId, req.usuario)
    if (!carpeta.valida) {
        return res.status(404).json({ mensaje: "La carpeta destino no existe" })
    }

    const convertido = convertirAUtf8(req.file.buffer)
    if (!convertido) {
        return res.status(400).json({ mensaje: "El archivo no es un texto válido" })
    }

    const buffer = Buffer.from(convertido.texto, "utf8")
    if (!(await hayEspacio(req.usuario, buffer.length))) {
        return res.status(400).json({ mensaje: "No tienes espacio suficiente" })
    }

    const documento = await crearDocumento(req.usuario, carpeta.id, nombre, extension, buffer)
    await registrar(req.usuario, ACCIONES.SUBIR_DOCUMENTO, recursoDe.documento(documento), `Codificación original: ${convertido.codificacion}`)
    res.status(201).json({ documento, codificacionOriginal: convertido.codificacion })
}

//Propietario o cualquier usuario con permiso 
export const obtener = async (req, res) => {
    const acceso = await accesoADocumento(req.params.id, req.usuario)
    if (!acceso) {
        return res.status(404).json({ mensaje: "Documento no encontrado" })
    }

    const { documento, permiso, carpetaAccesible } = acceso
    const contenido = (await leerDeGridFS(documento.gridfsId)).toString("utf8")
    res.json({ documento, contenido, permiso, carpetaAccesible })
}

export const guardarContenido = async (req, res) => {
    const { contenido } = req.body

    if (typeof contenido !== "string") {
        return res.status(400).json({ mensaje: "El contenido no es válido" })
    }

    const acceso = await accesoADocumento(req.params.id, req.usuario)
    if (!acceso) {
        return res.status(404).json({ mensaje: "Documento no encontrado" })
    }
    if (!tienePermiso(acceso.permiso, "EDICION")) {
        return res.status(403).json({ mensaje: "No tienes permiso para editar este documento" })
    }
    const { documento } = acceso

    const buffer = Buffer.from(contenido, "utf8")
    if (buffer.length > TAMANO_MAXIMO) {
        return res.status(400).json({ mensaje: "El documento supera el tamaño máximo de 5 MB" })
    }
    //El espacio que se usa es el del propietario aunque edite otro usuario
    const propietario = acceso.permiso === "PROPIETARIO" ? req.usuario : await Usuario.findById(documento.propietarioId)
    if (!(await hayEspacio(propietario, buffer.length - documento.tamano))) {
        return res.status(400).json({ mensaje: "El propietario no tiene espacio suficiente" })
    }

    //Los archivos de GridFS no se modifican
    const anteriorId = documento.gridfsId
    documento.gridfsId = await guardarEnGridFS(
        `${documento.nombre}.${documento.extension}`, buffer, { propietarioId: documento.propietarioId }
    )
    documento.tamano = buffer.length
    documento.fechaModificacion = new Date()
    await documento.save()
    await eliminarDeGridFS(anteriorId)
    await registrar(req.usuario, ACCIONES.EDITAR_DOCUMENTO, recursoDe.documento(documento))

    res.json({ documento })
}

export const descargar = async (req, res) => {
    const acceso = await accesoADocumento(req.params.id, req.usuario)
    if (!acceso) {
        return res.status(404).json({ mensaje: "Documento no encontrado" })
    }
    const { documento } = acceso

    const nombreArchivo = encodeURIComponent(`${documento.nombre}.${documento.extension}`)
    res.setHeader("Content-Type", TIPOS_CONTENIDO[documento.extension])
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${nombreArchivo}`)
    await registrar(req.usuario, ACCIONES.DESCARGAR_DOCUMENTO, recursoDe.documento(documento))
    abrirDescargaGridFS(documento.gridfsId).pipe(res)
}

//Comentar requiere permiso de comentar o de edicion 
export const comentar = async (req, res) => {
    const texto = typeof req.body.texto === "string" ? req.body.texto.trim() : ""
    if (!texto || texto.length > 1000) {
        return res.status(400).json({ mensaje: "El comentario debe tener entre 1 y 1000 caracteres" })
    }

    const acceso = await accesoADocumento(req.params.id, req.usuario)
    if (!acceso) {
        return res.status(404).json({ mensaje: "Documento no encontrado" })
    }
    if (!tienePermiso(acceso.permiso, "COMENTAR")) {
        return res.status(403).json({ mensaje: "No tienes permiso para comentar este documento" })
    }

    const comentario = { usuarioId: req.usuario._id, usuarioNombre: req.usuario.user, texto, fecha: new Date() }
    const documento = await Documento.findByIdAndUpdate(
        acceso.documento._id,
        { $push: { comentarios: comentario } },
        { returnDocument: "after", projection: { comentarios: { $slice: -1 } } }
    )
    await registrar(req.usuario, ACCIONES.COMENTAR, recursoDe.documento(acceso.documento), texto.slice(0, 100))
    res.status(201).json({ comentario: documento.comentarios[0] })
}

//Renombrar y mover solo los puede hacer el propietario
const accesoDePropietario = async (req, res) => {
    const acceso = await accesoADocumento(req.params.id, req.usuario)
    if (!acceso) {
        res.status(404).json({ mensaje: "Documento no encontrado" })
        return null
    }
    if (acceso.permiso !== "PROPIETARIO") {
        res.status(403).json({ mensaje: "Solo el propietario puede hacer esto" })
        return null
    }
    return acceso.documento
}

export const renombrar = async (req, res) => {
    const { nombre } = req.body
    if (!nombreValido(nombre)) {
        return res.status(400).json({ mensaje: "El nombre no es válido" })
    }

    const documento = await accesoDePropietario(req, res)
    if (!documento) return

    const anterior = `${documento.nombre}.${documento.extension}`
    documento.nombre = nombre.trim()
    await documento.save()
    await registrar(req.usuario, ACCIONES.RENOMBRAR, recursoDe.documento(documento), `Antes: ${anterior}`)

    res.json({ documento })
}

export const mover = async (req, res) => {
    const documento = await accesoDePropietario(req, res)
    if (!documento) return

    const destino = await carpetaDestino(req.body.carpetaId, req.usuario)
    if (!destino.valida) {
        return res.status(404).json({ mensaje: "La carpeta destino no existe" })
    }
    if (String(documento.carpetaId) === String(destino.id)) {
        return res.status(400).json({ mensaje: "El documento ya está en esa carpeta" })
    }

    const origen = documento.carpetaId
        ? (await Carpeta.findById(documento.carpetaId, { nombre: 1 }).lean())?.nombre ?? "Mi Unidad"
        : "Mi Unidad"

    documento.carpetaId = destino.id
    await documento.save()
    await registrar(req.usuario, ACCIONES.MOVER, recursoDe.documento(documento), `De ${origen} a ${destino.nombre}`)

    res.json({ documento })
}
