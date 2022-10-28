require('dotenv').config();
const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;  
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: 'com.rubii.tracker',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: "developer@rubii.com",
    appleIdPassword: "hnfi-craj-qnxp-pwfa"
  });
};