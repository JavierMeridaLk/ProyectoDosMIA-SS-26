export const INICIO = "2026-08-31T08:00:00-06:00"

const DIAS_PARA_DOCUMENTOS = 20

export const USUARIOS = [
    { user: "Javier", rol: "ADMIN", dia: 0 },
    { user: "Admin", rol: "ADMIN", dia: 0 },
    { user: "Marcelino", rol: "ADMIN", dia: 0 },
    { user: "Emilie", rol: "USUARIO", dia: 1 },
    { user: "Danny", rol: "USUARIO", dia: 1 },
    { user: "Bernny", rol: "USUARIO", dia: 2 },
    { user: "Jacky", rol: "USUARIO", dia: 2 },
    { user: "Bryan", rol: "USUARIO", dia: 3 },
    { user: "Blanqui", rol: "USUARIO", dia: 3 },
    { user: "Alejandra", rol: "USUARIO", dia: 4 }
].map((u) => ({ ...u, correo: `${u.user.toLowerCase()}@gestor.com`, contrasena: "1234" }))

const NOMBRES = USUARIOS.map((u) => u.user)

export const CARPETAS = Object.fromEntries(NOMBRES.map((user, i) => {
    const [a, b, c] = [1, 2, 3].map((n) => `Carpeta de prueba - ${i * 3 + n}`)
    return [user, [a, b, `${a}/${c}`]]
}))

const ACTIVOS_POR_USUARIO = { Javier: 6, Admin: 3, Marcelino: 5, Emilie: 8, Danny: 6, Bernny: 4, Jacky: 7, Bryan: 5, Blanqui: 3, Alejandra: 3 }

const EN_PAPELERA = Object.fromEntries(NOMBRES.map((user, i) => [user, 51 + i]))
const ELIMINADOS = { Danny: 61, Jacky: 62 }

const extensionDe = (numero) => (numero % 5 === 2 || numero % 5 === 4 ? "md" : "txt")

export const DOCUMENTOS = (() => {
    const documentos = []
    let siguiente = 1
    for (const { user, dia } of USUARIOS) {
        const ubicaciones = ["", ...CARPETAS[user]]
        const numeros = Array.from({ length: ACTIVOS_POR_USUARIO[user] }, () => siguiente++)
        numeros.splice(1, 0, EN_PAPELERA[user], ...(ELIMINADOS[user] ? [ELIMINADOS[user]] : []))
        numeros.forEach((numero, i) => {
            documentos.push({
                numero,
                user,
                nombre: `Archivo de prueba - ${numero}`,
                extension: extensionDe(numero),
                forma: numero % 2 === 0 ? "subir" : "crear",
                ruta: ubicaciones[i % ubicaciones.length],
                dia: dia + Math.floor((i * DIAS_PARA_DOCUMENTOS) / numeros.length)
            })
        })
    }
    return documentos
})()

const documentosDe = (user) => DOCUMENTOS.filter((d) => d.user === user && d.numero <= 50)
const otro = (i, salto) => NOMBRES[(i + salto) % NOMBRES.length]

export const ACTIVIDAD = (() => {
    const actividad = []
    const agregar = (dia, ...evento) => actividad.push([dia, ...evento])

    agregar(1, "Javier", "rol", "Admin", "ADMIN")
    agregar(1, "Javier", "rol", "Marcelino", "ADMIN")

    NOMBRES.forEach((user, i) => {
        const [a, b] = documentosDe(user)
        const dia = Math.max(a.dia, b.dia, 5)

        agregar(dia + 2, user, "compartir", `d:${a.numero}`, [otro(i, 1)], "LECTURA")
        agregar(dia + 2, user, "compartir", `d:${a.numero}`, [otro(i, 2)], "COMENTAR")
        agregar(dia + 2, user, "compartir", `d:${b.numero}`, [otro(i, 3)], "EDICION")
        agregar(dia + 3, user, "compartir", `c:${user}:${CARPETAS[user][0]}`, [otro(i, 5)], "LECTURA")

        agregar(dia + 4, otro(i, 1), "descargar", `d:${a.numero}`)
        agregar(dia + 4, otro(i, 2), "comentar", `d:${a.numero}`, "Comentario de prueba")
        agregar(dia + 5, otro(i, 3), "editar", `d:${b.numero}`)
        agregar(dia + 6, user, "editar", `d:${a.numero}`)

        agregar(20 + (i % 5), user, "mover", `d:${a.numero}`, `c:${user}:${CARPETAS[user][1]}`)
        agregar(28 + (i % 8), user, "papelera", `d:${EN_PAPELERA[user]}`)
    })

    for (const [user, numero] of Object.entries(ELIMINADOS)) {
        agregar(27, user, "papelera", `d:${numero}`)
        agregar(32, user, "eliminarDefinitivo", `d:${numero}`)
    }
    const restaurado = documentosDe("Emilie")[4].numero
    agregar(33, "Emilie", "papelera", `d:${restaurado}`)
    agregar(34, "Emilie", "restaurar", `d:${restaurado}`)

    return actividad.sort((x, y) => x[0] - y[0])
})()
