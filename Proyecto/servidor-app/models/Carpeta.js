import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types

const eliminacionSchema = new mongoose.Schema({
    enPapelera: { type: Boolean, default: false },
    fecha: { type: Date, default: null },
    origenId: { type: ObjectId, default: null }
}, { _id: false })

const carpetaSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    propietarioId: { type: ObjectId, ref: "Usuario", required: true },
    padreId: { type: ObjectId, default: null },
    //Ids de todos los antecesores desde la raiz hasta el padre 
    ruta: { type: [ObjectId], default: [] },
    eliminacion: { type: eliminacionSchema, default: () => ({}) },
    fechaCreacion: { type: Date, default: Date.now }
}, {
    collection: "carpetas",
    versionKey: false
})

export default mongoose.model("Carpeta", carpetaSchema)
