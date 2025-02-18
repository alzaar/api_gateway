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

app.get("/", (req: Request, res: Response) => {
  res.send({ message: "hello world" });
});

app.post("/upload", (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  console.log(req, "hello");
  const bb = busboy({ headers: req.headers });

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
