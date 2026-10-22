import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types

//Recurso que un propietario comparte con otro usuario
const comparticionSchema = new mongoose.Schema({
    recursoId: { type: ObjectId, required: true },
    tipoRecurso: { type: String, enum: ["DOCUMENTO", "CARPETA"], required: true },
    propietarioId: { type: ObjectId, ref: "Usuario", required: true },
    usuarioId: { type: ObjectId, ref: "Usuario", required: true },
    permiso: { type: String, enum: ["LECTURA", "EDICION", "COMENTAR"], required: true },
    fecha: { type: Date, default: Date.now }
}, {
    collection: "comparticiones",
    versionKey: false
})

export default mongoose.model("Comparticion", comparticionSchema)
