import mongoose from "mongoose";
import Carpeta from "../models/Carpeta.js";
import Documento from "../models/Documento.js";
import Comparticion from "../models/Comparticion.js";

/*
 * Niveles de acceso, cada uno incluye a los anteriores:
 *  LECTURA    -> ver y descargar
 *  COMENTAR   -> lo anterior + agregar comentarios
 *  EDICION    -> lo anterior + modificar el contenido
 *  PROPIETARIO-> todo (compartir, eliminar, crear dentro...)
 */
export const NIVELES = { LECTURA: 1, COMENTAR: 2, EDICION: 3, PROPIETARIO: 4 }
export const PERMISOS = ["LECTURA", "COMENTAR", "EDICION"]

export const tienePermiso = (permiso, minimo) => NIVELES[permiso] >= NIVELES[minimo]

/*
 * Un permiso sobre una carpeta se hereda a todo lo que contiene.
 * Se busca en una sola consulta si el usuario tiene comparticiones sobre el recurso
 * o sobre cualquiera de sus carpetas antecesoras (que salen del arreglo ruta) y gana el mayor.
 */
const mejorComparticion = async (usuario, recursoId, antecesores) => {
    const comparticiones = await Comparticion.find(
        { usuarioId: usuario._id, recursoId: { $in: [recursoId, ...antecesores] } },
        { recursoId: 1, permiso: 1 }
    ).lean()

    let mejor = null
    for (const c of comparticiones) {
        if (!mejor || NIVELES[c.permiso] > NIVELES[mejor.permiso]) mejor = c
    }
    return { mejor, comparticiones }
}

//Devuelve { documento, permiso, carpetaAccesible } o null si el usuario no tiene ningun acceso
export const accesoADocumento = async (id, usuario) => {
    if (!mongoose.isValidObjectId(id)) return null

    //Lo que esta en la papelera no lo puede ver nadie (ni el propietario) hasta restaurarlo
    const documento = await Documento.findOne({ _id: id, "eliminacion.enPapelera": false })
    if (!documento) return null

    if (documento.propietarioId.equals(usuario._id)) {
        return { documento, permiso: "PROPIETARIO", carpetaAccesible: true }
    }

    let antecesores = []
    if (documento.carpetaId) {
        const carpeta = await Carpeta.findById(documento.carpetaId, { ruta: 1 }).lean()
        antecesores = carpeta ? [documento.carpetaId, ...carpeta.ruta] : []
    }

    const { mejor, comparticiones } = await mejorComparticion(usuario, documento._id, antecesores)
    if (!mejor) return null

    //Si el acceso viene de una carpeta, el usuario puede regresar a ella desde el editor
    const carpetaAccesible = comparticiones.some((c) => !c.recursoId.equals(documento._id))
    return { documento, permiso: mejor.permiso, carpetaAccesible }
}

//Devuelve { carpeta, permiso, rutaVisible } o null si el usuario no tiene ningun acceso
export const accesoACarpeta = async (id, usuario) => {
    if (!mongoose.isValidObjectId(id)) return null

    const carpeta = await Carpeta.findOne({ _id: id, "eliminacion.enPapelera": false })
    if (!carpeta) return null

    if (carpeta.propietarioId.equals(usuario._id)) {
        return { carpeta, permiso: "PROPIETARIO", rutaVisible: carpeta.ruta }
    }

    const { mejor, comparticiones } = await mejorComparticion(usuario, carpeta._id, carpeta.ruta)
    if (!mejor) return null

    //Para la barra de navegacion solo se muestran los antecesores desde la primera carpeta compartida
    const compartidas = comparticiones.map((c) => c.recursoId.toString())
    const inicio = carpeta.ruta.findIndex((idAntecesor) => compartidas.includes(idAntecesor.toString()))
    const rutaVisible = inicio === -1 ? [] : carpeta.ruta.slice(inicio)

    return { carpeta, permiso: mejor.permiso, rutaVisible }
}
