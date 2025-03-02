import "dotenv/config";
// import multer from "multer";
import AWS from "aws-sdk";
import busboy from "busboy";
import express, { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";

const app = express();
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
interface CustomRequest extends Request {
  file?: Express.Multer.File;
}
interface AuthenticatedRequest extends Request {
  user?: JwtPayload | string;
}

const checkBucketExists = async (bucketName: string | undefined) => {
  if (!bucketName) {
    return false;
  }
  try {
    await s3.headBucket({ Bucket: bucketName }).promise();
    console.log(`✅ Bucket "${bucketName}" exists.`);
    return true;
  } catch (error: any) {
    if (error.statusCode === 404) {
      console.log(`❌ Bucket "${bucketName}" does not exist.`);
      return false;
    }
    console.error("Error checking bucket:", error);
    return false;
  }
};

app.get("/", (req: Request, res: Response) => {
  res.send({ message: "hello world" });
});

app.post("/upload", async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.headers["x-user-id"];
  const username = req.headers["x-user-username"];
  const bb = busboy({ headers: req.headers });

  if (!userId || !username) {
    res.status(403).json({ message: "Forbidden: Missing user details" });
    return;
  }

  const bucketExists = await checkBucketExists(process.env.AWS_S3_BUCKET_NAME);

  if (!bucketExists) {
    res.status(500).json({ error: "Failed to upload file to S3" });
    return;
  }

  bb.on(
    "file",
    (
      fieldname: string,
      fileStream: NodeJS.ReadableStream,
      uploadObject: any,
      encoding: string,
      mimetype: string
    ) => {
      const { filename } = uploadObject;
      const date = new Date();
      const timestamp = `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
      console.log(`Uploading file: ${filename}`);

      const params: AWS.S3.PutObjectRequest = {
        Bucket: process.env.AWS_S3_BUCKET_NAME || "",
        Key: `${filename}-[${timestamp}]`,
        Body: fileStream,
        ContentType: mimetype,
      };

      s3.upload(params, (err: any, data: any) => {
        if (err) {
          console.error("Error uploading file:", err);
          res.status(500).json({ error: "Failed to upload file to S3" });
          return;
        }

        console.log("File uploaded successfully:", data.Location);
        res.status(200).json({
          message: "File uploaded successfully!",
          fileUrl: data.Location,
        });
      });
    }
  );

  bb.on("error", (err: Error) => {
    console.error("Error processing file:", err);
    res.status(500).json({ error: "File processing error" });
  });

  bb.on("finish", () => console.log("Successfully uploaded file."));

  req.pipe(bb);
});

app.listen(process.env.PORT, () =>
  console.log(`Listening on ${process.env.PORT}`)
);
