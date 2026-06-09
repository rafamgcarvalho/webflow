import { Schema, model, type Document, type Model, type Types } from 'mongoose';

export interface FlowDoc extends Document {
  ownerId: Types.ObjectId;
  name: string;
  statements: unknown[];
  createdAt: Date;
  updatedAt: Date;
}

const flowSchema = new Schema<FlowDoc>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    statements: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true },
);

flowSchema.index({ ownerId: 1, updatedAt: -1 });

export const Flow: Model<FlowDoc> = model<FlowDoc>('Flow', flowSchema);
