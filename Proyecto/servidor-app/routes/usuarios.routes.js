import { Router } from "express";
import { listarUsuarios, cambiarRol, cambiarAlmacenamiento } from "../controllers/usuarios.controller.js";
import { verificarToken, soloAdmin } from "../middlewares/auth.js";

const router = Router()

//Todas las rutas de usuarios son solo para el admin
router.use(verificarToken, soloAdmin)

router.get("/", listarUsuarios)
router.patch("/:id/rol", cambiarRol)
router.patch("/:id/almacenamiento", cambiarAlmacenamiento)

export default router
