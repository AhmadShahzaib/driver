import { Logger } from '@nestjs/common';
import {
  MessagePatternResponseType,
  mapMessagePatternResponseToException,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { firstValueFrom } from 'rxjs';

export const dispatchNotification = async (
  title,
  notfObj,
  deviceInfo,
  pushNotificationClient,
  isSilent,
) => {
  //"notifcationType -> [ 1 = editLog || 2 = unidentifiedLog || 3 = insertLog" || 4 = ['deleteLog', 'normalize', 'transfer'] - known as syncing ones]
  const notificationObj = notfObj;

  let messagePatternPushNotification;
  if (deviceInfo.deviceToken) {
    if (deviceInfo.deviceType == 'IOS') {
      Logger.log(
        `About to emit an event 'send_notification' to notification-service <IOS>`,
      );

      pushNotificationClient.connect();
      messagePatternPushNotification = await firstValueFrom(
        pushNotificationClient.send(
          { cmd: 'send_notification_IOS' },
          {
            deviceToken: deviceInfo.deviceToken,
            data: {
              title: title,
              notificationObj,
              isSilent,
            },
          },
        ),
      );

      if (
        Object.keys(messagePatternPushNotification?.data).length == 0 ||
        messagePatternPushNotification?.data.failed.length > 0
      ) {
        messagePatternPushNotification['isMessagePattern'] = false;
        // Logger.log(`Error while sending notification to IOS`);
        // mapMessagePatternResponseToException(messagePatternPushNotification);
      } else if (messagePatternPushNotification?.data.sent.length > 0) {
        messagePatternPushNotification['isMessagePattern'] = true;
      }
      pushNotificationClient.close();
    } else {
      Logger.log(
        `About to emit an event 'send_notification' to notification-service <ANDROID>`,
      );

      pushNotificationClient.connect();
      messagePatternPushNotification =
        await firstValueFrom<MessagePatternResponseType>(
          pushNotificationClient.send(
            { cmd: 'send_notification' },
            {
              deviceToken: deviceInfo.deviceToken,
              data: {
                title: title,
                notificationObj,
                isSilent,
              },
            },
          ),
        );

      if (messagePatternPushNotification.isError) {
        Logger.log(`Error while sending notification`);
        mapMessagePatternResponseToException(messagePatternPushNotification);
      }
      pushNotificationClient.close();
    }
  }
  return messagePatternPushNotification?.isMessagePattern == true
    ? 'Sent'
    : 'Fail';
};
