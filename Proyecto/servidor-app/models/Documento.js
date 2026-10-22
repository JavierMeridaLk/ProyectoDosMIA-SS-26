import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types

//Datos de la papelera
const eliminacionSchema = new mongoose.Schema({
    enPapelera: { type: Boolean, default: false },
    fecha: { type: Date, default: null },
    origenId: { type: ObjectId, default: null }
}, { _id: false })

//siempre se leen junto con el documento y son pocos por documento y se guarda el nombre del autor 
const comentarioSchema = new mongoose.Schema({
    usuarioId: { type: ObjectId, ref: "Usuario", required: true },
    usuarioNombre: { type: String, required: true },
    texto: { type: String, required: true, trim: true, maxlength: 1000 },
    fecha: { type: Date, default: Date.now }
})

const documentoSchema = new mongoose.Schema({
    //Nombre sin la extension
    nombre: { type: String, required: true, trim: true },
    extension: { type: String, enum: ["txt", "md"], required: true },
    //Tamano del contenido en bytes
    tamano: { type: Number, min: 0, required: true },
    propietarioId: { type: ObjectId, ref: "Usuario", required: true },
    carpetaId: { type: ObjectId, default: null },
    gridfsId: { type: ObjectId, required: true },
    eliminacion: { type: eliminacionSchema, default: () => ({}) },
    comentarios: { type: [comentarioSchema], default: [] },
    fechaCarga: { type: Date, default: Date.now },
    fechaModificacion: { type: Date, default: Date.now }
}, {
    collection: "documentos",
    versionKey: false
})

export default mongoose.model("Documento", documentoSchema)
