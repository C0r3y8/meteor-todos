import { EJSON } from 'meteor/ejson';

export const decodeData = (data) => {
  const decodedData = decodeURIComponent(data);
  return (!decodedData) ? null : EJSON.parse(decodedData);
};

export const encodeData = (data) => {
  const encodedData = EJSON.stringify(data);
  return encodeURIComponent(encodedData);
};
