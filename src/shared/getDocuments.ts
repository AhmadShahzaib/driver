import { AppService } from '../app.service';
import DriverDocument from 'mongoDb/document/document';

export const getDocuments = async (
  driver: DriverDocument,
  awsService: AppService,
): Promise<DriverDocument> => {
  if (driver?.driverProfile?.key) {
    let url = await awsService.getObject(driver.driverProfile.key);
   
    if(driver.driverProfile["_doc"])
    {
      driver.driverProfile['imagePath'] = `data:image/${driver.driverProfile.name
        .split('.')
        .pop()};base64,${url.replace(/\s+/g, '')}`;
    // 
  }else if(driver.driverProfile){}
  // driver.driverProfile['imageUrl'] = url;
  driver.driverProfile['imagePath'] = `data:image/${driver.driverProfile.name
      .split('.')
      .pop()};base64,${url.replace(/\s+/g, '')}`;
    //changes in this file

  }
  return driver;
};
