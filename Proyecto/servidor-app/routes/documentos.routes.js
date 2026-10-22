import { Router } from "express";
import {
    obtenerAlmacenamiento,
    crear,
    subir,
    obtener,
    guardarContenido,
    descargar
} from "../controllers/documentos.controller.js";
import { verificarToken } from "../middlewares/auth.js";
import { recibirArchivo } from "../middlewares/subida.js";

const router = Router()

router.use(verificarToken)

router.get("/almacenamiento", obtenerAlmacenamiento)
router.post("/", crear)
router.post("/subir", recibirArchivo, subir)
router.get("/:id", obtener)
router.put("/:id/contenido", guardarContenido)
router.get("/:id/descargar", descargar)

export default router
