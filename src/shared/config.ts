import { Injectable } from '@nestjs/common';
import S3 from 'aws-sdk/clients/s3';
import { getEnvByKey } from '../utils/getEnvByKey';
import dotenv from 'dotenv';

// Set the AWS Region.
const REGION = 'us-east-1'; // This will be the region of the AWS services and will be stored in .env and retrieved using configuration service

@Injectable()
export default class AwsClient {
  s3Client = null;

  constructor() {
    this.createS3Client();
    dotenv.config();
  }

  private createS3Client() {
    // const accessKeyId = process.env['AWS_CREDENTIALS_ACCESS_KEY_ID'];
    // const secretAccessKey = process.env['AWS_CREDENTIALS_SECRET_ACCESS_KEY'];
    const accessKeyId = getEnvByKey('AWS_CREDENTIALS_ACCESS_KEY_ID');
    const secretAccessKey = getEnvByKey('AWS_CREDENTIALS_SECRET_ACCESS_KEY');

    // console.log('access Key:' + accessKeyId); // for testing only Should be removed
    // console.log('Secret access Key:' + secretAccessKey);
    // console.log(
    //   'HOS_MICROSERVICE_HOST:' + process.env['HOS_MICROSERVICE_HOST'],
    // );
    this.s3Client = new S3({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      apiVersion: '2006-03-01',
      signatureVersion: 'v4',
      // region:getEnvByKey('AWS_REGION'),
      region: 'us-east-1',
    });
  }
}
