import { Router } from "express";
import { listarPapelera, restaurar, eliminarDefinitivo } from "../controllers/papelera.controller.js";
import { verificarToken } from "../middlewares/auth.js";

const router = Router()

router.use(verificarToken)

router.get("/", listarPapelera)
router.post("/:tipo/:id/restaurar", restaurar)
router.delete("/:tipo/:id", eliminarDefinitivo)

export default router
