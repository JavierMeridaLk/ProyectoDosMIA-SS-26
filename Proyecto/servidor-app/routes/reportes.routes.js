import { Router } from "express";
import {
    archivosPorTipo,
    archivosPorFecha,
    archivosConMasOperaciones,
    topUsuariosPorArchivos,
    usuariosQueMasComparten,
    archivosMasCompartidos,
    compartidosPorUsuario,
    recibidosPorUsuario,
    actividadDeUsuario,
    operacionesPorTipo,
    operacionesPorPeriodo,
    principalesAcciones
} from "../controllers/reportes.controller.js";
import { verificarToken, soloAdmin } from "../middlewares/auth.js";

const router = Router()

//Los reportes solo los puede consultar el admin
router.use(verificarToken, soloAdmin)

//Archivos y almacenamiento
router.get("/archivos-por-tipo", archivosPorTipo)
router.get("/archivos-por-fecha", archivosPorFecha)                 
router.get("/archivos-mas-operaciones", archivosConMasOperaciones)
//Usuarios
router.get("/top-usuarios-archivos", topUsuariosPorArchivos)
router.get("/usuarios-mas-comparten", usuariosQueMasComparten)
//Comparticion
router.get("/archivos-mas-compartidos", archivosMasCompartidos)
router.get("/compartidos-por-usuario", compartidosPorUsuario)       
router.get("/recibidos-por-usuario", recibidosPorUsuario)           
//Actividad
router.get("/actividad-usuario", actividadDeUsuario)                
router.get("/operaciones-por-tipo", operacionesPorTipo)             
router.get("/operaciones-por-periodo", operacionesPorPeriodo)       
router.get("/principales-acciones", principalesAcciones)            

export default router
