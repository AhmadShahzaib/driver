import { AppService } from '../app.service';
import { DriverModel } from 'models';
import moment from 'moment';

export const uploadDocument = async (
  doc: any,
  profile: Express.Multer.File,
  appService: AppService,
  driverModel: DriverModel,
  tenantId: string,
) => {
  // const awsService= AwsService,
  if (doc && doc.length > 0) {
    driverModel.documents = [];
    doc?.forEach(async (item) => {
      let key = await appService.uploadFile(
        item?.buffer,
        `${tenantId}/${driverModel.email}/driverDocuments/${moment().unix()}-${
          item?.originalname
        }`,
        item.mimetype,
      );
      driverModel.documents.push({
        key: key.key,
        name: item?.originalname,
        date: moment().unix(),
      });
    });
  }
  if (profile) {
    try {
      let keyProfile = await appService.uploadFile(
        profile[0]?.buffer,
        `${tenantId}/${driverModel.email}/driverProfile/${moment().unix()}-${
          profile[0]?.originalname
        }`,
        profile[0].mimetype,
      );
      driverModel.driverProfile = {
        key: keyProfile.key,
        name: profile[0]?.originalname,
        date: moment().unix(),
      };
      return driverModel;
    } catch (error) {
      return error;
    }
  }
  return driverModel;
};
