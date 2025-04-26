const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.REGION,
});

const s3 = new AWS.S3();

const uploadToS3 = async (text) => {
  const params = {
    Bucket: "voice20250420",
    Key: `transcripts/${Date.now()}.txt`,
    Body: text,
    ContentType: "text/plain",
  };

  return s3.putObject(params).promise();
};

module.exports = { uploadToS3 };
