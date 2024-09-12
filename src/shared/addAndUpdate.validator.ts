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
import moment from 'moment';
import { CoDriverUnitUpdateRequest } from 'models/coDriverUnitRequest';

export const addAndUpdateCodriver = async (
  appService: AppService,
  driverModel: DriverModel,
  option: FilterQuery<DriverDocument>,
  id: string = null,
  vehicleData,
  currentDriver,
): Promise<DriverValidatorResponse> => {
  try {
    const driver = await appService.findOne(option);
    if (driver?.email.toLowerCase() == driverModel.email.toLowerCase()) {
      Logger.log(`Email already exists`);
      throw new ConflictException(`Email already exists`);
    }
    if (driver?.userName.toLowerCase() == driverModel.userName.toLowerCase()) {
      Logger.log(`Username already exist`);
      throw new ConflictException(`Username already exists`);
    }
    // if (driver?.phoneNumber && driver?.phoneNumber == driverModel.phoneNumber) {
    //   Logger.log(`${driverModel.phoneNumber} Phone number already exists`);
    //   throw new ConflictException(`Phone number already exists`);
    // }
    if (
      driver?.licenseNumber.toLowerCase() ==
      driverModel.licenseNumber.toLowerCase()
    ) {
      Logger.log(`Driver license number already exists`);
      throw new ConflictException(`Driver license number already exists`);
    }
    // option.$and = [
    //   { userName: { $regex: new RegExp(`^${driverModel.userName}`, 'i') } },
    //   { _id: { $ne: id } },
    // ];
    // option.$or = [{}];
    // const driverIdtenant = await appService.findOne(option);
    // if (driverIdtenant) {
    //   throw new ConflictException(`Driver Already exists with same driver Id`);
    // }
    let requestedCoDriver: DriverDocument | null = null;
    let isCodriverUpdated: boolean = false;
    const codriver = currentDriver.get('coDriverId', String);

    // if (driver?.vehicleId.toString() == driverModel.vehicleId) {
    //   Logger.log(`${driverModel.vehicleId} already exist`);
    //   throw new ConflictException(`${driverModel.vehicleId} already exists`);
    // }

    // Checking for coDriver and his availability.
    if (
      driverModel.isCoDriver == 'true' &&
      driverModel.coDriverId &&
      codriver != driverModel?.coDriverId
    ) {
      requestedCoDriver = await appService.findDriverCo({
        _id: driverModel.coDriverId,
      });
      if (
        requestedCoDriver?.assignTo === null &&
        requestedCoDriver?.coDriverId === null
      ) {
        driverModel.coDriverId = requestedCoDriver.id;
        driverModel.assignTo =
          requestedCoDriver.firstName + ' ' + requestedCoDriver.lastName;
        isCodriverUpdated = true;
        let codriverData: any = JSON.stringify(requestedCoDriver);
        codriverData = JSON.parse(codriverData);
        codriverData.assignTo =
          driverModel.firstName + ' ' + driverModel.lastName;
        codriverData.coDriverId = currentDriver.id;
        //vehicle assigning
        if (vehicleData) {
          if (driverModel.vehicleId) {
            let flag = false;
            if (codriverData?.assignedVehicles?.length > 0)
              for (let i = 0; i < codriverData.assignedVehicles.length; i++) {
                if (
                  codriverData.assignedVehicles[i].id === driverModel.vehicleId
                ) {
                  flag = true;
                }
              }

            if (!flag) {
              codriverData.assignedVehicles.push({
                id: vehicleData?.id,
                vehicleId: vehicleData?.vehicleId,
                vinNo: vehicleData?.vinNo,
                date: (() => {
                  const date = moment().format('YYYY-MM-DD');
                  return date;
                })(),
              });
            }
          }
          codriverData.currentVehicle = vehicleData?.vehicleId;
          codriverData.vehicleId = driverModel.vehicleId;
          delete codriverData.password;
        }
        // code for codriver
        await appService.updateDriver(driverModel.coDriverId, codriverData);
        // now need to remove already assigned co driver to this driver
        if (codriver) {
          let oldRequestedCoDriver: DriverDocument | null = null;
          oldRequestedCoDriver = await appService.findOne({
            _id: codriver,
          });

          // last previous codriver unassigned to main driver and update
          if (oldRequestedCoDriver) {
            let previousCoDriver: any = JSON.stringify(oldRequestedCoDriver);
            previousCoDriver = JSON.parse(previousCoDriver);
            previousCoDriver.assignTo = null;
            previousCoDriver.coDriverId = null;
            previousCoDriver.vehicleId = null;
            previousCoDriver.currentVehicle = null;
            await appService.updateDriver(codriver, previousCoDriver);

            // last previous codriver unit update
            const coDriverData: CoDriverUnitUpdateRequest = {
              driverId: codriver,
              coDriverId: null,
              deviceId: null,
              eldNo: null,
              deviceVersion: '',
              deviceSerialNo: '',
              deviceVendor: null,
              manualVehicleId: null,
              vehicleId: null,
              vehicleLicensePlateNo: null,
              vehicleMake: null,
              vehicleVinNo: null,
            };
            // Co Driver Unit update
            await appService.updateCoDriverUnit(coDriverData);
          }
        }
      } else if (!requestedCoDriver) {
        throw new NotFoundException('The requested Co-Driver does not exist.');
      } else {
        throw new ConflictException(
          'The requested Co-Driver is already assigned to another driver or has a Co-Driver assigned to him.',
        );
      }
    } else if (codriver && driverModel?.isCoDriver === 'false') {
      driverModel.coDriverId = null;
      driverModel.assignTo = null;
      requestedCoDriver = await appService.findOne({
        _id: codriver,
      });
      let codriverData: any = JSON.stringify(requestedCoDriver);
      codriverData = JSON.parse(codriverData);
      codriverData.assignTo = null;
      codriverData.coDriverId = null;
      codriverData.vehicleId = null;
      codriverData.currentVehicle = null;
      await appService.updateDriver(codriver, codriverData);
    } else if (
      driverModel.isCoDriver == 'true' &&
      driverModel.coDriverId &&
      driverModel.vehicleId != currentDriver.get('vehicleId', String)
    ) {
      requestedCoDriver = await appService.findOne({
        _id: driverModel.coDriverId,
      });
    }

    // if (driverModel.vehicleId) {
    //   // const vehicle = await appService.findOne({ vehicleId: driverModel.vehicleId });
    //   // if (vehicle) {
    //   //   throw new ConflictException('vehicle already assigned');
    //   // }
    //   const getVehicle = await appService.populateVehicle(
    //     driverModel.vehicleId,
    //   );
    //   if (getVehicle) {
    //     const isVehicleAssigned = await appService.isVehicleAssigned(
    //       driverModel.vehicleId,
    //       id,
    //     );
    //     // if (isVehicleAssigned) {
    //     //   throw new ConflictException('vehicle already assigned');
    //     // }
    //   }
    //   // Finding timezone object
    // }

    const getOffice = await appService.populateOffices(
      driverModel.homeTerminalAddress,
    );
    if (getOffice) {
      const index = timezones.findIndex((ele) => {
        return ele.tzCode === (getOffice?.data?.timeZone?.tzCode as string);
      });
      if (index >= 0) {
        driverModel.homeTerminalTimeZone = timezones[index];
      } else {
        throw new NotFoundException(`TimeZone you select does not exist`);
      }

      // Finding State Name
      const state = State.getStateByCodeAndCountry(driverModel.state, 'US');
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

export const addOrUpdate = async (
  appService: AppService,
  driverModel: DriverModel | EditDriverModel,
  option: FilterQuery<DriverDocument>,
  id: string = null,
): Promise<DriverValidatorResponse> => {
  try {
    // Checking for coDriver and his availability.
    let requestedCoDriver: DriverDocument | null = null;
    let isCodriverUpdated: boolean = false;
    if (driverModel && driverModel.coDriverId) {
      requestedCoDriver = await appService.findOne({
        _id: driverModel.coDriverId,
      });
      isCodriverUpdated = true;
      if (
        requestedCoDriver?.assignTo !== null &&
        requestedCoDriver?.coDriverId !== null
      ) {
        throw new ConflictException(
          'The requested Co-Driver is already assigned to another driver or has a Co-Driver assigned to him',
        );
      }
    }

    // Office handling
    const getOffice = await appService.populateOffices(
      driverModel.homeTerminalAddress,
    );
    if (getOffice) {
      const index = timezones.findIndex((ele) => {
        return ele.tzCode === (getOffice?.data?.timeZone?.tzCode as string);
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

/**
 * Add Or Update
 * farzan-driverbook
 */
// export const addOrUpdate = async (
//   appService: AppService,
//   driverModel: DriverModel | EditDriverModel,
//   option: FilterQuery<DriverDocument>,
//   id: string = null,
// ): Promise<DriverValidatorResponse> => {
//   try {
//     if (
//       driverModel.isCoDriver == 'true' &&
//       (driverModel.vehicleId || driverModel.coDriverId)
//     ) {
//       delete driverModel.vehicleId;
//       delete driverModel.coDriverId;
//       throw new BadRequestException(
//         `coDriver can'nt have vehicle & have'nt coDriver `,
//       );
//     }
//     // Checking for coDriver and his availability.
//     let requestedCoDriver: DriverDocument | null = null;
//     let isCoDriverUpdating: boolean = true;
//     let isCodriverUpdated: boolean = false;

//     // CO driver handling
//     if (driverModel && driverModel.coDriverId) {
//       const toUpdateDriver = await appService.findDriverById(
//         driverModel.coDriverId,
//       );
//       console.log(toUpdateDriver.get('coDriverId', String));
//       isCoDriverUpdating =
//         driverModel.coDriverId !== toUpdateDriver.get('coDriverId', String);
//     }

//     if (driverModel.coDriverId !== '' && driverModel.coDriverId !== undefined) {
//       requestedCoDriver = await appService.findOne({
//         _id: driverModel.coDriverId,
//       });
//     }

//     if (requestedCoDriver && requestedCoDriver['_doc'].vehicleId == null) {
//       throw new NotFoundException(
//         'The requested Co-Driver does not have any vehicle linked yet!',
//       );
//     } else {
//       let isCoDriverAlreadyAssigned;
//       if (
//         driverModel.coDriverId !== '' &&
//         driverModel.coDriverId !== undefined
//       ) {
//         isCoDriverAlreadyAssigned = await appService.findOne({
//           coDriverId: driverModel.coDriverId,
//         });
//       }

//       if (driverModel.coDriverId && isCoDriverAlreadyAssigned) {
//         throw new ConflictException(
//           'The requested Co-Driver is already assigned to another driver or has a Co-Driver assigned to him',
//         );
//       }
//     }

//     if (driverModel.isCoDriver == 'true' && isCoDriverUpdating) {
//       if (
//         requestedCoDriver?.assignTo === null &&
//         requestedCoDriver?.coDriverId === null
//       ) {
//         driverModel.coDriverId = requestedCoDriver.id;
//         isCodriverUpdated = true;
//       } else if (!requestedCoDriver) {
//         throw new NotFoundException('The requested Co-Driver does not exist.');
//       } else {
//         throw new ConflictException(
//           'The requested Co-Driver is already assigned to another driver or has a Co-Driver assigned to him',
//         );
//       }
//     } else {
//       driverModel.coDriverId = requestedCoDriver ? requestedCoDriver.id : null;
//       isCodriverUpdated = true;
//     }

//     //  vehicle handling
//     // comment for now as one vehicle can associate to multiple driver
//     // if (driverModel.vehicleId) {
//     //   // const vehicle = await appService.findOne({ vehicleId: driverModel.vehicleId });
//     //   // if (vehicle) {
//     //   //   throw new ConflictException('vehicle already assigned');
//     //   // }
//     //   const getVehicle = await appService.populateVehicle(
//     //     driverModel.vehicleId,
//     //   );
//     //   if (getVehicle) {
//     //     // Check to see if eld is assigned to vehicle
//     //     if (getVehicle?.data?.eldId == null) {
//     //       throw new ConflictException('ELD not assigned to vehicle yet!');
//     //     }

//     //     const isVehicleAssigned = await appService.isVehicleAssigned(
//     //       driverModel.vehicleId,
//     //       id,
//     //     );
//     //     if (isVehicleAssigned) {
//     //       throw new ConflictException('vehicle already assigned');
//     //     }
//     //   }
//     //   // Finding timezone object
//     // }

//     // Office handling
//     const getOffice = await appService.populateOffices(
//       driverModel.homeTerminalAddress,
//     );
//     if (getOffice) {
//       const index = timezones.findIndex((ele) => {
//         return ele.tzCode === 'America/Chicago';
//         // return ele.tzCode === (driverModel.homeTerminalTimeZone as string);
//       });
//       if (index >= 0) {
//         driverModel.homeTerminalTimeZone = timezones[index];
//       } else {
//         throw new NotFoundException(`TimeZone you select does not exist`);
//       }

//       // Finding State Name
//       // const state = State.getStateByCodeAndCountry(driverModel.state, 'US');
//       const state = { name: 'California' };
//       if (state) {
//         driverModel.state = state.name;
//         return { requestedCoDriver, isCodriverUpdated };
//       } else {
//         throw new NotFoundException(`state you select does not exist`);
//       }
//     }
//   } catch (err) {
//     throw err;
//   }
// };

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
        // return ele.tzCode === 'America/Chicago';
        return ele.tzCode === (getOffice?.data?.timeZone?.tzCode as string);
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
