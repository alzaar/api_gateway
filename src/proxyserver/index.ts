import "dotenv/config";
// import multer from "multer";
import AWS from "aws-sdk";
import busboy from "busboy";
import express, { Request, Response } from "express";

const app = express();
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Your AWS Access Key ID
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Your AWS Secret Access Key
  region: process.env.AWS_REGION, // Your AWS Region
});

// interface MulterRequest extends Request {
//   file?: Express.Multer.File;
// }

interface CustomRequest extends Request {
  file?: Express.Multer.File;
}

// const storage = multer.diskStorage({
//   destination: (
//     req: Request,
//     file: Express.Multer.File,
//     cb: (error: Error | null, destination: string) => void
//   ) => {
//     cb(null, "./uploads"); // Directory to save uploaded files
//   },
//   filename: (
//     req: Request,
//     file: Express.Multer.File,
//     cb: (error: Error | null, filename: string) => void
//   ) => {
//     cb(null, `${Date.now()}-${file.originalname}`); // Add timestamp to the filename
//   },
// });

app.get("/", (req: Request, res: Response) => {
  res.send({ message: "hello world" });
});

// const upload = multer({ storage });

app.post("/upload", (req: Request, res: Response) => {
  const bb = busboy({ headers: req.headers });

  bb.on(
    "file",
    (
      fieldname: string,
      fileStream: NodeJS.ReadableStream,
      filename: string,
      encoding: string,
      mimetype: string
    ) => {
      console.log(`Uploading file: ${filename}`);

      const params: AWS.S3.PutObjectRequest = {
        Bucket: process.env.AWS_S3_BUCKET_NAME || "",
        Key: `${Date.now()}-${filename}`,
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

  req.pipe(bb);
});

app.listen(process.env.PORT, () =>
  console.log(`Listening on ${process.env.PORT}`)
);
