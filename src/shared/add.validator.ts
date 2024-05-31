import { DriverResponse } from '../models/response.model';
import { DriverModel } from '../models/request.model';
import { EditDriverModel } from '../models/editRequest.model';
import { AppService } from '../app.service';
import {
  NotFoundException,
  Logger,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import DriverDocument from '../mongoDb/document/document';
import { State } from 'country-state-city';
import timezones from 'timezones-list';
import { DriverValidatorResponse } from '../models';
import { FilterQuery } from 'mongoose';

export const addValidations = async (
  driver: DriverDocument | EditDriverModel,
  driverModel: DriverModel | EditDriverModel,
) => {
  try {
    if (driver?.email.toLowerCase() == driverModel.email.toLowerCase()) {
      Logger.log(`Driver email already exists`);
      throw new ConflictException(`Driver email already exists`);
    }
    if (driver?.userName.toLowerCase() == driverModel.userName.toLowerCase()) {
      Logger.log(`Username already exist`);
      throw new ConflictException(`Driver ID already exists`);
    }
    if (
      driver?.licenseNumber.toLowerCase() ==
      driverModel.licenseNumber.toLowerCase()
    ) {
      Logger.log(`Driver license number already exists`);
      throw new ConflictException(`Driver license number already exists`);
    }
    // if (driver?.phoneNumber && driver?.phoneNumber == driverModel.phoneNumber) {
    //   Logger.log(`${driverModel.phoneNumber} Phone number already exists`);
    //   throw new ConflictException(`Phone number already exists`);Driver license number already exists
    // }
  } catch (err) {
    throw err;
  }
};

/**
 * Add Or Update
 * farzan-driverbook
 */
export const addOrUpdate = async (
  appService: AppService,
  driverModel: DriverModel | EditDriverModel,
  option: FilterQuery<DriverDocument>,
  id: string = null,
): Promise<DriverValidatorResponse> => {
  try {
    if (
      driverModel.isCoDriver == 'true' &&
      (driverModel.vehicleId || driverModel.coDriverId)
    ) {
      delete driverModel.vehicleId;
      delete driverModel.coDriverId;
      throw new BadRequestException(
        `coDriver can'nt have vehicle & have'nt coDriver `,
      );
    }
    // Checking for coDriver and his availability.
    let requestedCoDriver: DriverDocument | null = null;
    let isCoDriverUpdating: boolean = true;
    let isCodriverUpdated: boolean = false;

    // CO driver handling
    if (driverModel && driverModel.coDriverId) {
      const toUpdateDriver = await appService.findDriverById(
        driverModel.coDriverId,
      );
      console.log(toUpdateDriver.get('coDriverId', String));
      isCoDriverUpdating =
        driverModel.coDriverId !== toUpdateDriver.get('coDriverId', String);
    }

    if (driverModel.coDriverId !== '' && driverModel.coDriverId !== undefined) {
      requestedCoDriver = await appService.findOne({
        _id: driverModel.coDriverId,
      });
    }

    if (requestedCoDriver && requestedCoDriver['_doc'].vehicleId == null) {
      throw new NotFoundException(
        'The requested Co-Driver does not have any vehicle linked yet!',
      );
    } else {
      let isCoDriverAlreadyAssigned;
      if (
        driverModel.coDriverId !== '' &&
        driverModel.coDriverId !== undefined
      ) {
        isCoDriverAlreadyAssigned = await appService.findOne({
          coDriverId: driverModel.coDriverId,
        });
      }

      if (driverModel.coDriverId && isCoDriverAlreadyAssigned) {
        throw new ConflictException(
          'The requested Co-Driver is already assigned to another driver or has a Co-Driver assigned to him',
        );
      }
    }

    if (driverModel.isCoDriver == 'true' && isCoDriverUpdating) {
      if (
        requestedCoDriver?.assignTo === null &&
        requestedCoDriver?.coDriverId === null
      ) {
        driverModel.coDriverId = requestedCoDriver.id;
        isCodriverUpdated = true;
      } else if (!requestedCoDriver) {
        throw new NotFoundException('The requested Co-Driver does not exist.');
      } else {
        throw new ConflictException(
          'The requested Co-Driver is already assigned to another driver or has a Co-Driver assigned to him',
        );
      }
    } else {
      driverModel.coDriverId = requestedCoDriver ? requestedCoDriver.id : null;
      isCodriverUpdated = true;
    }

    //  vehicle handling
    // comment for now as one vehicle can associate to multiple driver
    // if (driverModel.vehicleId) {
    //   // const vehicle = await appService.findOne({ vehicleId: driverModel.vehicleId });
    //   // if (vehicle) {
    //   //   throw new ConflictException('vehicle already assigned');
    //   // }
    //   const getVehicle = await appService.populateVehicle(
    //     driverModel.vehicleId,
    //   );
    //   if (getVehicle) {
    //     // Check to see if eld is assigned to vehicle
    //     if (getVehicle?.data?.eldId == null) {
    //       throw new ConflictException('ELD not assigned to vehicle yet!');
    //     }

    //     const isVehicleAssigned = await appService.isVehicleAssigned(
    //       driverModel.vehicleId,
    //       id,
    //     );
    //     if (isVehicleAssigned) {
    //       throw new ConflictException('vehicle already assigned');
    //     }
    //   }
    //   // Finding timezone object
    // }

    // Office handling
    const getOffice = await appService.populateOffices(
      driverModel.homeTerminalAddress,
    );
    if (getOffice) {
      const index = timezones.findIndex((ele) => {
        return ele.tzCode === 'America/Chicago';
        // return ele.tzCode === (driverModel.homeTerminalTimeZone as string);
      });
      if (index >= 0) {
        driverModel.homeTerminalTimeZone = timezones[index];
      } else {
        throw new NotFoundException(`TimeZone you select does not exist`);
      }

      // Finding State Name
      // const state = State.getStateByCodeAndCountry(driverModel.state, 'US');
      const state = { name: 'California' };
      if (state) {
        driverModel.state = state.name;
        return { requestedCoDriver, isCodriverUpdated };
      } else {
        throw new NotFoundException(`state you select does not exist`);
      }
    }
  } catch (err) {
    throw err;
  }
};

// Co-Driver functionality starts here
export const addOrUpdateCoDriver = async (
  appService: AppService,
  driverModel: DriverModel | EditDriverModel,
  option: FilterQuery<DriverDocument>,
  id: string = null,
): Promise<DriverValidatorResponse> => {
  try {
    if (
      driverModel.isCoDriver == 'true' &&
      (driverModel.vehicleId || driverModel.coDriverId)
    ) {
      delete driverModel.vehicleId;
      delete driverModel.coDriverId;
      throw new BadRequestException(
        `coDriver can'nt have vehicle & have'nt coDriver `,
      );
    }
    // Checking for coDriver and his availability.
    let requestedCoDriver: DriverDocument | null = null;
    let isCoDriverUpdating: boolean = true;
    let isCodriverUpdated: boolean = false;

    // CO driver handling
    if (driverModel && driverModel.coDriverId) {
      const toUpdateDriver = await appService.findDriverById(
        driverModel.coDriverId,
      );
      console.log(toUpdateDriver.get('coDriverId', String));
      isCoDriverUpdating =
        driverModel.coDriverId !== toUpdateDriver.get('coDriverId', String);
    }

    if (driverModel.coDriverId !== '' && driverModel.coDriverId !== undefined) {
      requestedCoDriver = await appService.findOne({
        _id: driverModel.coDriverId,
      });
    }

    if (requestedCoDriver && requestedCoDriver['_doc'].vehicleId == null) {
      throw new NotFoundException(
        'The requested Co-Driver does not have any vehicle linked yet!',
      );
    } else {
      let isCoDriverAlreadyAssigned;
      if (
        driverModel.coDriverId !== '' &&
        driverModel.coDriverId !== undefined
      ) {
        isCoDriverAlreadyAssigned = await appService.findOne({
          coDriverId: driverModel.coDriverId,
        });
      }

      if (driverModel.coDriverId && isCoDriverAlreadyAssigned) {
        throw new ConflictException(
          'The requested Co-Driver is already assigned to another driver or has a Co-Driver assigned to him',
        );
      }
    }

    if (driverModel.isCoDriver == 'true' && isCoDriverUpdating) {
      if (
        requestedCoDriver?.assignTo === null &&
        requestedCoDriver?.coDriverId === null
      ) {
        driverModel.coDriverId = requestedCoDriver.id;
        isCodriverUpdated = true;
      } else if (!requestedCoDriver) {
        throw new NotFoundException('The requested Co-Driver does not exist.');
      } else {
        throw new ConflictException(
          'The requested Co-Driver is already assigned to another driver or has a Co-Driver assigned to him',
        );
      }
    } else {
      driverModel.coDriverId = requestedCoDriver ? requestedCoDriver.id : null;
      isCodriverUpdated = true;
    }

    //  vehicle handling
    // comment for now as one vehicle can associate to multiple driver
    // if (driverModel.vehicleId) {
    //   // const vehicle = await appService.findOne({ vehicleId: driverModel.vehicleId });
    //   // if (vehicle) {
    //   //   throw new ConflictException('vehicle already assigned');
    //   // }
    //   const getVehicle = await appService.populateVehicle(
    //     driverModel.vehicleId,
    //   );
    //   if (getVehicle) {
    //     // Check to see if eld is assigned to vehicle
    //     if (getVehicle?.data?.eldId == null) {
    //       throw new ConflictException('ELD not assigned to vehicle yet!');
    //     }

    //     const isVehicleAssigned = await appService.isVehicleAssigned(
    //       driverModel.vehicleId,
    //       id,
    //     );
    //     if (isVehicleAssigned) {
    //       throw new ConflictException('vehicle already assigned');
    //     }
    //   }
    //   // Finding timezone object
    // }

    // Office handling
    const getOffice = await appService.populateOffices(
      driverModel.homeTerminalAddress,
    );
    if (getOffice) {
      const index = timezones.findIndex((ele) => {
        return ele.tzCode === 'America/Chicago';
        // return ele.tzCode === (driverModel.homeTerminalTimeZone as string);
      });
      if (index >= 0) {
        driverModel.homeTerminalTimeZone = timezones[index];
      } else {
        throw new NotFoundException(`TimeZone you select does not exist`);
      }

      // Finding State Name
      // const state = State.getStateByCodeAndCountry(driverModel.state, 'US');
      const state = { name: 'California' };
      if (state) {
        driverModel.state = state.name;
        return { requestedCoDriver, isCodriverUpdated };
      } else {
        throw new NotFoundException(`state you select does not exist`);
      }
    }
  } catch (err) {
    throw err;
  }
};
