import { Injectable, Logger } from '@nestjs/common';
import { Base64 } from 'aws-sdk/clients/ecr';
import AwsClient from './config';
@Injectable()
export class AWSService {
  bucket = 'eld-uploads';
  constructor(private readonly awsClient: AwsClient) { }

  async checkBucketExists(bucket) {
    const options = {
      Bucket: bucket,
    };
    try {
      await this.awsClient.s3Client.headBucket(options).promise();
      return true;
    } catch (err) {
      Logger.error('Error while uploading file', err);
      return false;
    }
  }

  
  async getObject(objectKey: string) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: objectKey,
      };
      const data = await this.awsClient.s3Client.getObject(params).promise();
      return Buffer.from(data.Body).toString('base64');
    } catch (err) {
      Logger.error('Error while uploading file', err);
      throw err;
    }
  }

  async deleteObject(objectKey: string) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: objectKey,
      };
      const data = await this.awsClient.s3Client.deleteObject(params).promise();
      return true;
    } catch (err) {
      Logger.error('Error while uploading file', err);
      throw err;
    }
  }
}
