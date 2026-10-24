import { reloj } from "./reloj.js";

const DURACION_SESION = 4 * 60 * 60 * 1000

export const crearCliente = (base) => {
    const peticion = async (metodo, ruta, { token, json, form } = {}) => {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        let body
        if (json) {
            headers["Content-Type"] = "application/json"
            body = JSON.stringify(json)
        } else if (form) {
            body = form
        }

        const respuesta = await fetch(`${base}${ruta}`, { method: metodo, headers, body })
        const datos = await respuesta.json().catch(() => ({}))
        if (!respuesta.ok) {
            throw new Error(`${metodo} ${ruta} respondió ${respuesta.status}: ${datos.mensaje ?? "sin mensaje"}`)
        }
        return datos
    }

    const usuario = ({ user, contrasena }) => {
        let token = null
        let inicio = 0

        const sesion = async () => {
            const ahora = reloj.ahora().getTime()
            if (!token || ahora - inicio > DURACION_SESION) {
                const datos = await peticion("POST", "/auth/login", { json: { user, contrasena } })
                token = datos.token
                inicio = ahora
            }
            return token
        }

        const conToken = (metodo) => async (ruta, opciones = {}) =>
            peticion(metodo, ruta, { ...opciones, token: await sesion() })

        return {
            user,
            registrar: async (correo) => {
                const datos = await peticion("POST", "/auth/registro", {
                    json: { correo, user, contrasena, confirmacion: contrasena }
                })
                token = datos.token
                inicio = reloj.ahora().getTime()
                return datos.usuario
            },
            get: conToken("GET"),
            post: conToken("POST"),
            put: conToken("PUT"),
            patch: conToken("PATCH"),
            delete: conToken("DELETE")
        }
    }

    return { usuario }
}
