import { TimeZone } from './../../models/timeZone.model';
import { Document, Schema } from 'mongoose';

type StringOrTimeZone = string | TimeZone;
export type Documents = {
  name?: string;
  date?: number;
  key?: string;
};
export default interface DriverDocument extends Document {
  driverId: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  driverProfile?: Documents;
  documents?: Documents[];
  homeTerminalAddress: string;
  state: string;
  phoneNumber: string;
  homeTerminalTimeZone?: StringOrTimeZone;
  password: string;
  licenseNumber: string;
  vehicleId?: string;
  vehicles: [{}];
  assignedVehicles: []; // stores the assigned vehicles from day one
  currentVehicle: String;
  coDriverId?: string;
  tenantId?: string;
  notes?: string;
  trailerNumber?: string;
  enableEld: boolean;
  enableElog: boolean;
  cycleRule: string;
  deviceToken?: string;
  deviceType?: string;
  yardMove: boolean;
  personalConveyance: boolean;
  isActive: boolean;
  assignTo: string;
  eldInfo: any;
  deviceVersion?: string;
  deviceModel?: string;
}
