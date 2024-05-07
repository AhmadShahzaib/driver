import { Schema, Document } from 'mongoose';
import * as mongoose from 'mongoose';

const TimeZoneSchema = new mongoose.Schema(
  {
    tzCode: { type: String, required: true },
    utc: { type: String, required: true },
    label: { type: String },
    name: { type: String },
  },
  { _id: false },
);
const Documents = new mongoose.Schema(
  {
    name: { type: String, required: false },
    key: { type: String, required: false },
    date: { type: Number, required: false },
  },
  { _id: true },
);
export const DriverSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true, index: true },
    driverId: { type: String, required: true },
    email: { type: String, required: true, index: true },
    firstName: { type: String, required: true, index: true },
    lastName: { type: String, required: true, index: true },
    fullName: { type: String },
    licenseNumber: { type: String, required: true, index: true },
    phoneNumber: { type: String, required: true },
    deviceToken: { type: String, required: false },
    deviceType: { type: String },
    homeTerminalTimeZone: { type: TimeZoneSchema, required: true },
    homeTerminalAddress: {
      type: String,
      required: true,
    },
    state: { type: String, required: true },
    coDriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
      index: true,
    },
    cycleRule: { type: String, required: true },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    vehicles: [{}],
    assignedVehicles: [], // stores the assigned vehicles from day one
    currentVehicle: String,
    driverProfile: { type: Documents, required: false },
    documents: { type: [Documents], required: false },
    deviceVersion: { type: String, required: false },
    deviceModel: { type: String, required: false },
    password: { type: String, required: true },
    trailerNumber: { type: String },
    enableEld: { type: Boolean, required: true },
    enableElog: { type: Boolean, required: true },
    notes: { type: String, index: true },
    yardMove: { type: Boolean, required: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    personalConveyance: { type: Boolean, required: true },
    tenantId: { type: Schema.Types.ObjectId },
    assignTo: { type: Schema.Types.ObjectId, default: null },
  },
  {
    timestamps: true,
  },
);

DriverSchema.pre('save', function (next) {
  this.fullName = `${this.firstName} ${this.lastName}`;
  next();
});
