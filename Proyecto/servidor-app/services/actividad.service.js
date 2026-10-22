import Log from "../models/Log.js";

export const ACCIONES = {
    REGISTRO: "REGISTRO",
    INICIO_SESION: "INICIO_SESION",
    CREAR_CARPETA: "CREAR_CARPETA",
    CREAR_DOCUMENTO: "CREAR_DOCUMENTO",
    SUBIR_DOCUMENTO: "SUBIR_DOCUMENTO",
    EDITAR_DOCUMENTO: "EDITAR_DOCUMENTO",
    DESCARGAR_DOCUMENTO: "DESCARGAR_DOCUMENTO",
    COMENTAR: "COMENTAR",
    RENOMBRAR: "RENOMBRAR",
    MOVER: "MOVER",
    ELIMINAR: "ELIMINAR",
    RESTAURAR: "RESTAURAR",
    ELIMINAR_DEFINITIVO: "ELIMINAR_DEFINITIVO",
    COMPARTIR: "COMPARTIR",
    CAMBIAR_PERMISO: "CAMBIAR_PERMISO",
    RETIRAR_PERMISO: "RETIRAR_PERMISO",
    CAMBIAR_ROL: "CAMBIAR_ROL",
    CAMBIAR_ALMACENAMIENTO: "CAMBIAR_ALMACENAMIENTO",
    ACTIVAR_USUARIO: "ACTIVAR_USUARIO",
    DESACTIVAR_USUARIO: "DESACTIVAR_USUARIO"
}

//Forma en la que se guarda cada tipo de recurso dentro del log
export const recursoDe = {
    documento: (d) => ({ id: d._id, tipo: "DOCUMENTO", nombre: `${d.nombre}.${d.extension}`, propietarioId: d.propietarioId }),
    carpeta: (c) => ({ id: c._id, tipo: "CARPETA", nombre: c.nombre, propietarioId: c.propietarioId }),
    usuario: (u) => ({ id: u._id, tipo: "USUARIO", nombre: u.user, propietarioId: u._id })
}

//Registra una accion. Si falla no interrumpe la operacion principal, solo se reporta en consola
export const registrar = async (usuario, accion, recurso, detalle = null) => {
    try {
        await Log.create({
            usuarioId: usuario._id,
            usuarioNombre: usuario.user,
            accion,
            recurso: { id: recurso.id, tipo: recurso.tipo, nombre: recurso.nombre },
            propietarioId: recurso.propietarioId ?? usuario._id,
            detalle
        })
    } catch (error) {
        console.error("No se pudo registrar la actividad:", error.message)
    }
}
