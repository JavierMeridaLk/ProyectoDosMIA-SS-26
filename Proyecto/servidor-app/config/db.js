
import mongoose from "mongoose";

//Conexion a MongoDB usando la URI definida en el .env
export const conectarDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log(`MongoDB conectado: ${mongoose.connection.name}`)
    } catch (error) {
        console.error("Error al conectar con MongoDB:", error.message)
        process.exit(1)
    }
}

export const obtenerBucket = () => {
    return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "archivos" })
}
