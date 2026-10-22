import { Router } from "express";
import { obtenerContenido, crear, arbol, renombrar, mover } from "../controllers/carpetas.controller.js";
import { verificarToken } from "../middlewares/auth.js";
import { enviarCarpetaAPapelera } from "../controllers/papelera.controller.js";

const router = Router()

router.use(verificarToken)

router.get("/contenido", obtenerContenido)
router.get("/arbol", arbol)
router.get("/:id/contenido", obtenerContenido)
router.post("/", crear)
router.patch("/:id/nombre", renombrar)
router.patch("/:id/mover", mover)
router.delete("/:id", enviarCarpetaAPapelera)

export default router
