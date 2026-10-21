
//Importamos express 
import express from "express";

//Instancia dse nuestra aplicacion
const app = express()

app.get("/", (req, res) => {
    res.send("Hola mundo desde express")
})

const PORT = 3001

//Ponemos a escuchar el servidor en el puerto 
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
})