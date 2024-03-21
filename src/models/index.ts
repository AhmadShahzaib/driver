export * from './editRequest.model';
export * from './editStatusRequest.model';
export * from './request.model';
export * from './response.model';
export * from './timeZone.model';
export * from './coDriverResponse.model';
export * from './';
import DriverDocument from '../mongoDb/document/document';

export const searchableAtrributes = [
  'email',
  'firstName',
  'lastName',
  'fullName',
  'notes',
  'userName',
  'driverId',
  'cycleRule',
  'currentVehicle',
];

export interface DriverValidatorResponse {
  requestedCoDriver: DriverDocument;
  isCodriverUpdated: boolean;
}

export const searchableIds = ['id', 'vehicleId'];

export const sortableAttributes = [
  'id',
  'email',
  'firstName',
  'lastName',
  'fullName',
  'notes',
  'userName',
  'isActive',
  'cycleRule',
];
