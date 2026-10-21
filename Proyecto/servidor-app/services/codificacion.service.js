import chardet from "chardet";
import iconv from "iconv-lite";


const BOMS = [
    { bytes: [0xef, 0xbb, 0xbf], codificacion: "utf-8" },
    { bytes: [0xff, 0xfe], codificacion: "utf-16le" },
    { bytes: [0xfe, 0xff], codificacion: "utf-16be" }
]

const esUtf8 = (buffer) => {
    try {
        new TextDecoder("utf-8", { fatal: true }).decode(buffer)
        return true
    } catch {
        return false
    }
}

const detectarCodificacion = (buffer) => {
    const bom = BOMS.find(({ bytes }) => bytes.every((byte, i) => buffer[i] === byte))
    if (bom) return bom.codificacion
    if (esUtf8(buffer)) return "utf-8"

    const detectada = chardet.detect(buffer)
    if (!detectada || detectada === "ISO-8859-1") return "windows-1252"
    return iconv.encodingExists(detectada) ? detectada : "windows-1252"
}

//Convierte cualquier archivo de texto a UTF-8
export const convertirAUtf8 = (buffer) => {
    const codificacion = detectarCodificacion(buffer)
    const texto = iconv.decode(buffer, codificacion)

    if (texto.includes("\u0000")) return null

    return { texto, codificacion }
}
