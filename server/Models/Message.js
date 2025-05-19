import mongoose from "mongoose";

// Definir el esquema sin ninguna opción que pueda crear índices automáticos
const MessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'userinfos',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'userinfos',
      required: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'books',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
    id: false, // Desactivar completamente el campo virtual id
    _id: true // Asegurar que se use _id como identificador primario
  }
);

// Eliminar cualquier índice automático sobre el campo id
MessageSchema.set('autoIndex', false);

// No incluir virtuals en la serialización
MessageSchema.set('toJSON', {
  virtuals: false,
  transform: function (doc, ret) {
    // Asegurar que el campo id no esté presente en la serialización
    if (ret.id) delete ret.id;
    return ret;
  }
});

// Crear y exportar el modelo
const MessageModel = mongoose.model("messages", MessageSchema);
export default MessageModel; 