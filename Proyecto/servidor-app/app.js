
//Importamos express
import "dotenv/config";
import express from "express";
import cors from "cors";
import { conectarDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";

//Instancia dse nuestra aplicacion
const app = express()

app.use(cors({ origin: "http://localhost:4200" }))
app.use(express.json())

app.get("/", (req, res) => {
    res.send("Hola mundo desde express")
})

app.use("/api/auth", authRoutes)
app.use("/api/usuarios", usuariosRoutes)

const PORT = process.env.PORT || 3001

//Primero conectamos a la base y luego ponemos a escuchar el servidor en el puerto
await conectarDB()
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
