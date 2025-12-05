---
title: 如何在 Next.js 中实现文件上传？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  学习如何在 Next.js 中实现文件上传功能，包括使用 Route Handlers 处理文件、Server Actions 上传文件、以及集成云存储服务的完整方案。
tags:
  - Next.js
  - 文件上传
  - Route Handlers
  - Server Actions
estimatedTime: 25 分钟
keywords:
  - Next.js 文件上传
  - FormData
  - 文件处理
  - 云存储
highlight: 掌握 Next.js 中文件上传的多种实现方式和最佳实践
order: 313
---

## 问题 1：如何使用 Route Handler 实现文件上传？

Route Handler 可以处理 FormData 格式的文件上传请求。

### 基本文件上传

```typescript
// app/api/upload/route.ts
import { NextRequest } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    // 获取 FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: "Invalid file type" }, { status: 400 });
    }

    // 验证文件大小（5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return Response.json({ error: "File too large" }, { status: 400 });
    }

    // 读取文件内容
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 生成唯一文件名
    const filename = `${Date.now()}-${file.name}`;
    const filepath = join(process.cwd(), "public/uploads", filename);

    // 保存文件
    await writeFile(filepath, buffer);

    return Response.json({
      success: true,
      filename,
      url: `/uploads/${filename}`,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

### 客户端上传组件

```typescript
// app/upload/page.tsx
"use client";

import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadedUrl(data.url);
        alert("Upload successful!");
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1>Upload File</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          accept="image/*"
          required
        />
        <button type="submit" disabled={!file || uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {uploadedUrl && (
        <div>
          <h2>Uploaded Image:</h2>
          <img src={uploadedUrl} alt="Uploaded" style={{ maxWidth: "400px" }} />
        </div>
      )}
    </div>
  );
}
```

---

## 问题 2：如何使用 Server Actions 实现文件上传？

Server Actions 提供了更简洁的文件上传方式，与表单原生集成。

### Server Action 文件上传

```typescript
// app/actions/upload.ts
"use server";

import { writeFile } from "fs/promises";
import { join } from "path";

export async function uploadFile(formData: FormData) {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // 验证文件
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "File too large (max 5MB)" };
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Invalid file type" };
    }

    // 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}-${file.name.replace(/\s/g, "-")}`;
    const filepath = join(process.cwd(), "public/uploads", filename);

    await writeFile(filepath, buffer);

    return {
      success: true,
      url: `/uploads/${filename}`,
      filename,
      size: file.size,
      type: file.type,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: "Upload failed" };
  }
}
```

### 使用 Server Action 的表单

```typescript
// app/upload/page.tsx
import { uploadFile } from "@/app/actions/upload";
import UploadForm from "./UploadForm";

export default function UploadPage() {
  return (
    <div>
      <h1>Upload with Server Action</h1>
      <UploadForm />
    </div>
  );
}

// app/upload/UploadForm.tsx
("use client");

import { uploadFile } from "@/app/actions/upload";
import { useState } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Uploading..." : "Upload"}
    </button>
  );
}

export default function UploadForm() {
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (formData: FormData) => {
    const result = await uploadFile(formData);
    setResult(result);
  };

  return (
    <div>
      <form action={handleSubmit}>
        <input type="file" name="file" accept="image/*" required />
        <SubmitButton />
      </form>

      {result && (
        <div>
          {result.success ? (
            <div>
              <p>Upload successful!</p>
              <img
                src={result.url}
                alt="Uploaded"
                style={{ maxWidth: "400px" }}
              />
            </div>
          ) : (
            <p style={{ color: "red" }}>Error: {result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 问题 3：如何实现多文件上传和进度显示？

处理多文件上传需要更复杂的逻辑。

### 多文件上传 API

```typescript
// app/api/upload/multiple/route.ts
import { NextRequest } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return Response.json({ error: "No files uploaded" }, { status: 400 });
    }

    // 限制文件数量
    if (files.length > 10) {
      return Response.json(
        { error: "Too many files (max 10)" },
        { status: 400 }
      );
    }

    const uploadedFiles = [];

    for (const file of files) {
      // 验证每个文件
      if (file.size > 5 * 1024 * 1024) {
        return Response.json(
          { error: `File ${file.name} is too large` },
          { status: 400 }
        );
      }

      // 保存文件
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filename = `${Date.now()}-${file.name}`;
      const filepath = join(process.cwd(), "public/uploads", filename);

      await writeFile(filepath, buffer);

      uploadedFiles.push({
        originalName: file.name,
        filename,
        url: `/uploads/${filename}`,
        size: file.size,
        type: file.type,
      });
    }

    return Response.json({
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

### 带进度的多文件上传组件

```typescript
// app/upload/MultiUpload.tsx
"use client";

import { useState } from "react";

type UploadProgress = {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  url?: string;
  error?: string;
};

export default function MultiUpload() {
  const [files, setFiles] = useState<UploadProgress[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    setFiles(
      selectedFiles.map((file) => ({
        file,
        progress: 0,
        status: "pending",
      }))
    );
  };

  const uploadFiles = async () => {
    const formData = new FormData();
    files.forEach(({ file }) => {
      formData.append("files", file);
    });

    // 更新状态为上传中
    setFiles((prev) =>
      prev.map((f) => ({ ...f, status: "uploading" as const }))
    );

    try {
      const response = await fetch("/api/upload/multiple", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // 更新成功状态
        setFiles((prev) =>
          prev.map((f, i) => ({
            ...f,
            status: "success",
            progress: 100,
            url: data.files[i]?.url,
          }))
        );
      } else {
        // 更新错误状态
        setFiles((prev) =>
          prev.map((f) => ({
            ...f,
            status: "error",
            error: data.error,
          }))
        );
      }
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: "error",
          error: "Upload failed",
        }))
      );
    }
  };

  return (
    <div>
      <h2>Multi-File Upload</h2>

      <input
        type="file"
        multiple
        onChange={handleFileChange}
        accept="image/*"
      />

      {files.length > 0 && (
        <div>
          <button onClick={uploadFiles}>Upload {files.length} file(s)</button>

          <div style={{ marginTop: "20px" }}>
            {files.map((file, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "10px",
                  padding: "10px",
                  border: "1px solid #ccc",
                }}
              >
                <p>
                  <strong>{file.file.name}</strong>
                </p>
                <p>Size: {(file.file.size / 1024).toFixed(2)} KB</p>
                <p>Status: {file.status}</p>

                {file.status === "uploading" && (
                  <div
                    style={{
                      width: "100%",
                      height: "20px",
                      backgroundColor: "#f0f0f0",
                    }}
                  >
                    <div
                      style={{
                        width: `${file.progress}%`,
                        height: "100%",
                        backgroundColor: "#4CAF50",
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                )}

                {file.status === "success" && file.url && (
                  <img
                    src={file.url}
                    alt="Uploaded"
                    style={{ maxWidth: "200px", marginTop: "10px" }}
                  />
                )}

                {file.status === "error" && (
                  <p style={{ color: "red" }}>Error: {file.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 问题 4：如何集成云存储服务（如 AWS S3）？

生产环境通常使用云存储服务而不是本地文件系统。

### 集成 AWS S3

```typescript
// lib/s3.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToS3(
  file: File,
  folder: string = "uploads"
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `${folder}/${Date.now()}-${file.name}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: filename,
    Body: buffer,
    ContentType: file.type,
  });

  await s3Client.send(command);

  // 返回文件 URL
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
}

// app/api/upload/s3/route.ts
import { NextRequest } from "next/server";
import { uploadToS3 } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 上传到 S3
    const url = await uploadToS3(file);

    return Response.json({
      success: true,
      url,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("S3 upload error:", error);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

### 使用 Vercel Blob

```typescript
// app/api/upload/blob/route.ts
import { NextRequest } from "next/server";
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 上传到 Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
    });

    return Response.json({
      success: true,
      url: blob.url,
      filename: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error("Blob upload error:", error);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

## 总结

**核心概念总结**：

### 1. 文件上传方式

- Route Handler：处理 FormData，适合 API 端点
- Server Actions：与表单原生集成，更简洁
- 两者都支持文件验证和处理

### 2. 文件处理

- 验证文件类型和大小
- 生成唯一文件名
- 保存到本地或云存储

### 3. 云存储集成

- AWS S3：企业级存储方案
- Vercel Blob：Next.js 官方推荐
- 其他：Cloudinary、UploadThing 等

## 延伸阅读

- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
- [AWS S3 SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
