import { Router } from "express";
import {
    listarDeRecurso,
    compartir,
    cambiarPermiso,
    retirar,
    compartidosConmigo,
    sugerirUsuarios
} from "../controllers/comparticiones.controller.js";
import { verificarToken } from "../middlewares/auth.js";

const router = Router()

router.use(verificarToken)

router.get("/conmigo", compartidosConmigo)
router.get("/usuarios", sugerirUsuarios)
router.get("/:tipo/:id", listarDeRecurso)
router.post("/", compartir)
router.patch("/:id", cambiarPermiso)
router.delete("/:id", retirar)

export default router
