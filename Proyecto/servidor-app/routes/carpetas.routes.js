import { Router } from "express";
import { obtenerContenido, crear } from "../controllers/carpetas.controller.js";
import { verificarToken } from "../middlewares/auth.js";
import { enviarCarpetaAPapelera } from "../controllers/papelera.controller.js";

const router = Router()

router.use(verificarToken)

router.get("/contenido", obtenerContenido)
router.get("/:id/contenido", obtenerContenido)
router.post("/", crear)
router.delete("/:id", enviarCarpetaAPapelera)

export default router
