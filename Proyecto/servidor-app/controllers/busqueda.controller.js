import Carpeta from "../models/Carpeta.js";
import Documento from "../models/Documento.js";
import Usuario from "../models/Usuario.js";
import Comparticion from "../models/Comparticion.js";

const TIPOS = ["todos", "carpeta", "txt", "md"]
const LIMITE = 100

const VARIANTES = { a: "aáàäâ", e: "eéèëê", i: "iíìïî", o: "oóòöô", u: "uúùüû", n: "nñ" }


const contiene = (texto) => {
    const patron = texto.trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .split("")
        .map((letra) => {
            const base = letra.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
            return VARIANTES[base] ? `[${VARIANTES[base]}]` : letra
        })
        .join("")
    return new RegExp(patron, "i")
}

//Lo que el usuario puede ver
const alcanceDelUsuario = async (usuario) => {
    const comparticiones = await Comparticion.find({ usuarioId: usuario._id }, { recursoId: 1, tipoRecurso: 1 }).lean()
    const carpetasCompartidas = comparticiones.filter((c) => c.tipoRecurso === "CARPETA").map((c) => c.recursoId)
    const documentosCompartidos = comparticiones.filter((c) => c.tipoRecurso === "DOCUMENTO").map((c) => c.recursoId)

    const subcarpetas = carpetasCompartidas.length
        ? await Carpeta.find({ ruta: { $in: carpetasCompartidas } }, { _id: 1 }).lean()
        : []
    const carpetasVisibles = [...carpetasCompartidas, ...subcarpetas.map((c) => c._id)]

    return {
        carpetas: { $or: [{ propietarioId: usuario._id }, { _id: { $in: carpetasVisibles } }] },
        documentos: {
            $or: [
                { propietarioId: usuario._id },
                { _id: { $in: documentosCompartidos } },
                { carpetaId: { $in: carpetasVisibles } }
            ]
        }
    }
}

const fechaValida = (valor) => {
    if (!valor) return null
    const fecha = new Date(valor)
    return Number.isNaN(fecha.getTime()) ? undefined : fecha
}

export const buscar = async (req, res) => {
    const { q = "", tipo = "todos", autor = "" } = req.query
    const desde = fechaValida(req.query.desde)
    const hasta = fechaValida(req.query.hasta)

    if (!TIPOS.includes(tipo)) {
        return res.status(400).json({ mensaje: "Tipo de archivo no válido" })
    }
    if (desde === undefined || hasta === undefined) {
        return res.status(400).json({ mensaje: "Fecha no válida" })
    }

    const filtro = { "eliminacion.enPapelera": false }

    if (q.trim()) {
        filtro.nombre = contiene(q)
    }

    if (autor.trim()) {
        const autores = await Usuario.find({ user: contiene(autor) }, { _id: 1 }).lean()
        filtro.propietarioId = { $in: autores.map((a) => a._id) }
    }

    const rango = {}
    if (desde) rango.$gte = desde
    if (hasta) rango.$lte = hasta
    const hayRango = desde || hasta

    const alcance = await alcanceDelUsuario(req.usuario)

    //Las carpetas se filtran por fecha de creacion y los documentos por fecha de modificacion
    const filtroCarpetas = { $and: [alcance.carpetas, filtro, hayRango ? { fechaCreacion: rango } : {}] }
    const filtroDocumentos = {
        $and: [
            alcance.documentos,
            filtro,
            hayRango ? { fechaModificacion: rango } : {},
            tipo === "txt" || tipo === "md" ? { extension: tipo } : {}
        ]
    }

    const [carpetas, documentos] = await Promise.all([
        tipo === "todos" || tipo === "carpeta"
            ? Carpeta.find(filtroCarpetas).sort({ fechaCreacion: -1 }).limit(LIMITE).lean()
            : [],
        tipo !== "carpeta"
            ? Documento.find(filtroDocumentos).sort({ fechaModificacion: -1 }).limit(LIMITE).lean()
            : []
    ])

    //Nombres de autores y de carpetas contenedoras en una consulta cada uno
    const idsAutores = [...carpetas, ...documentos].map((e) => e.propietarioId)
    const idsPadres = [...carpetas.map((c) => c.padreId), ...documentos.map((d) => d.carpetaId)].filter(Boolean)
    const [autores, padres] = await Promise.all([
        Usuario.find({ _id: { $in: idsAutores } }, { user: 1 }).lean(),
        Carpeta.find({ _id: { $in: idsPadres } }, { nombre: 1 }).lean()
    ])
    const nombreAutor = (id) => autores.find((a) => a._id.equals(id))?.user ?? "Desconocido"
    const ubicacion = (id) => (id && padres.find((p) => p._id.equals(id))?.nombre) || "Mi Unidad"

    const resultados = [
        ...carpetas.map((c) => ({
            tipo: "carpeta",
            _id: c._id,
            nombre: c.nombre,
            extension: null,
            tamano: null,
            fecha: c.fechaCreacion,
            autor: nombreAutor(c.propietarioId),
            propio: c.propietarioId.equals(req.usuario._id),
            ubicacion: ubicacion(c.padreId)
        })),
        ...documentos.map((d) => ({
            tipo: "documento",
            _id: d._id,
            nombre: d.nombre,
            extension: d.extension,
            tamano: d.tamano,
            fecha: d.fechaModificacion,
            autor: nombreAutor(d.propietarioId),
            propio: d.propietarioId.equals(req.usuario._id),
            ubicacion: ubicacion(d.carpetaId)
        }))
    ].sort((a, b) => b.fecha - a.fecha)

    res.json({ resultados })
}
