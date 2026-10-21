import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const usuarioSchema = new mongoose.Schema({
    user: { type: String, required: true, unique: true, trim: true },
    correo: { type: String, required: true, unique: true, trim: true, lowercase: true },
    contrasena: { type: String, required: true, select: false },
    rol: { type: String, enum: ["ADMIN", "USUARIO"], default: "USUARIO" },
    activo: { type: Boolean, default: true },
    //Espacio asignado en bytes, solo el admin lo puede cambiar
    almacenamiento: { type: Number, min: 0, default: () => Number(process.env.ESPACIO_PREDETERMINADO) },
    fechaCreacion: { type: Date, default: Date.now }
}, {
    collection: "usuarios",
    versionKey: false
})

//encripta la contrasena
usuarioSchema.pre("save", async function () {
    if (!this.isModified("contrasena")) return
    this.contrasena = await bcrypt.hash(this.contrasena, 10)
})

usuarioSchema.methods.compararContrasena = function (contrasena) {
    return bcrypt.compare(contrasena, this.contrasena)
}

//Nunca devolver la contrasena en las respuestas
usuarioSchema.set("toJSON", {
    transform: (doc, ret) => {
        delete ret.contrasena
        return ret
    }
})

export default mongoose.model("Usuario", usuarioSchema)
