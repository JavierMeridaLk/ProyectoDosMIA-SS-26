import { Router } from "express";
import { listarLogs } from "../controllers/actividad.controller.js";
import { verificarToken, soloAdmin } from "../middlewares/auth.js";

const router = Router()

router.use(verificarToken, soloAdmin)

router.get("/", listarLogs)

export default router
