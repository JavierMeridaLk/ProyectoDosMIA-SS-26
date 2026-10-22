import { Router } from "express";
import {
    obtenerAlmacenamiento,
    crear,
    subir,
    obtener,
    guardarContenido,
    descargar,
    comentar,
    renombrar,
    mover
} from "../controllers/documentos.controller.js";
import { verificarToken } from "../middlewares/auth.js";
import { recibirArchivo } from "../middlewares/subida.js";
import { enviarDocumentoAPapelera } from "../controllers/papelera.controller.js";

const router = Router()

router.use(verificarToken)

router.get("/almacenamiento", obtenerAlmacenamiento)
router.post("/", crear)
router.post("/subir", recibirArchivo, subir)
router.get("/:id", obtener)
router.put("/:id/contenido", guardarContenido)
router.get("/:id/descargar", descargar)
router.post("/:id/comentarios", comentar)
router.patch("/:id/nombre", renombrar)
router.patch("/:id/mover", mover)
router.delete("/:id", enviarDocumentoAPapelera)

export default router
