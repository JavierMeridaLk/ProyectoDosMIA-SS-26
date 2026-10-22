import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types

//el historial se conserva aunque el recurso se borre o renombre
const recursoSchema = new mongoose.Schema({
    id: { type: ObjectId, required: true },
    tipo: { type: String, enum: ["DOCUMENTO", "CARPETA", "USUARIO"], required: true },
    nombre: { type: String, required: true }
}, { _id: false })

const logSchema = new mongoose.Schema({
    usuarioId: { type: ObjectId, ref: "Usuario", required: true },
    usuarioNombre: { type: String, required: true },
    accion: { type: String, required: true },
    recurso: { type: recursoSchema, required: true },
    propietarioId: { type: ObjectId, ref: "Usuario", default: null },
    detalle: { type: String, default: null },
    fecha: { type: Date, default: Date.now }
}, {
    collection: "logs",
    versionKey: false
})

//Ademas de los indices creados en la base 
logSchema.index({ propietarioId: 1, fecha: -1 })
logSchema.index({ "recurso.id": 1 })

export default mongoose.model("Log", logSchema)
