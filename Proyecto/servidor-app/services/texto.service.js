const VARIANTES = { a: "aáàäâ", e: "eéèëê", i: "iíìïî", o: "oóòöô", u: "uúùüû", n: "nñ" }

/*
 * Expresion regular para buscar por "contiene" (no igualdad exacta), sin importar mayusculas ni acentos:
 * "propu" -> /pr[oóòöô]p[uúùüû]/i  encuentra "Propuesta", "PROPUESTA final", "mi própuesta"...
 */
export const contiene = (texto) => {
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
