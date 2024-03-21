export class TimeZone {
  tzCode: string;
  utc: string;
  label?: string;
  name?: string;
}
export type Documents = {
  name?: string;
  date?: number;
  key?: string;
};
export class DriverVehicleToUnitRequest {
  driverId: string;
  vehicleId: string;
  deviceId: string;
  coDriverId?: string;
  deviceVendor: string;
  deviceSerialNo: string;
  vehicleLicensePlateNo: string;
  vehicleMake: string;
  vehicleVinNo: string;
  manualVehicleId: string;
  eldNo: string;
  headOffice: string;
  manualDriverId: string;
  driverLicense: string;
  trailerNumber?: string;
  homeTerminalAddress: string;
  driverUserName: string;
  driverLicenseState: string;
  headOfficeId: string;
  homeTerminalAddressId: string;
  driverFirstName: string;
  driverLastName: string;
  driverFullName: string;
  cycleRule: string;
  tenantId: string;
  deviceVersion: string;
  eldType: string;
  deviceModel: string;
  homeTerminalTimeZone: string | TimeZone;
  driverProfile?: Documents;
  vehicles: [{}];
  driverEmail: string;
  phoneNumber: string;
  enableEld: boolean;
  enableElog: boolean;
  yardMove: boolean;
  personalConveyance: boolean;
}
