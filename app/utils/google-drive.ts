/**
 * Google DriveのファイルIDからURLを生成する
 * @param fileId Google DriveのファイルID
 * @returns Google DriveのURL
 */
export const getGoogleDriveUrl = (fileId: string): string => {
  return `https://drive.google.com/file/d/${fileId}/view`;
};
