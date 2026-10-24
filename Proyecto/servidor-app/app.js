import "dotenv/config";
import { conectarDB } from "./config/db.js";
import app from "./aplicacion.js";

const PORT = process.env.PORT || 3001

//Primero conectamos a la base y luego ponemos a escuchar el servidor en el puerto
await conectarDB()
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
