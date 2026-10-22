
//Importamos express
import "dotenv/config";
import express from "express";
import cors from "cors";
import { conectarDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import documentosRoutes from "./routes/documentos.routes.js";
import carpetasRoutes from "./routes/carpetas.routes.js";
import papeleraRoutes from "./routes/papelera.routes.js";
import busquedaRoutes from "./routes/busqueda.routes.js";
import comparticionesRoutes from "./routes/comparticiones.routes.js";
import actividadRoutes from "./routes/actividad.routes.js";

//Instancia dse nuestra aplicacion
const app = express()

app.use(cors({ origin: "http://localhost:4200" }))
//Limite mayor al de por defecto (100kb) para poder guardar documentos desde el editor
app.use(express.json({ limit: "6mb" }))

app.get("/", (req, res) => {
    res.send("Hola mundo desde express")
})

app.use("/api/auth", authRoutes)
app.use("/api/usuarios", usuariosRoutes)
app.use("/api/documentos", documentosRoutes)
app.use("/api/carpetas", carpetasRoutes)
app.use("/api/papelera", papeleraRoutes)
app.use("/api/busqueda", busquedaRoutes)
app.use("/api/comparticiones", comparticionesRoutes)
app.use("/api/actividad", actividadRoutes)

//Cualquier error no controlado responde en JSON
app.use((error, req, res, next) => {
    console.error(error)
    res.status(500).json({ mensaje: "Error interno del servidor" })
})

const PORT = process.env.PORT || 3001

//Primero conectamos a la base y luego ponemos a escuchar el servidor en el puerto
await conectarDB()
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
