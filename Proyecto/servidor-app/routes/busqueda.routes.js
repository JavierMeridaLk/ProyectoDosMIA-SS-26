import { Router } from "express";
import { buscar } from "../controllers/busqueda.controller.js";
import { verificarToken } from "../middlewares/auth.js";

const router = Router()

router.use(verificarToken)

router.get("/", buscar)

export default router
