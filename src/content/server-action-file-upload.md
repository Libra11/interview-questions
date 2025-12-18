---
title: Server Action 支持文件上传吗？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  详细讲解如何在 Server Action 中处理文件上传，包括本地存储、云存储和文件验证等完整方案。
tags:
  - Next.js
  - Server Action
  - 文件上传
  - FormData
estimatedTime: 25 分钟
keywords:
  - Server Action
  - 文件上传
  - FormData
  - 云存储
highlight: Server Action 完全支持文件上传，可以直接处理 File 对象
order: 204
---

## 问题 1：Server Action 如何接收文件？

Server Action 通过 FormData 接收文件，文件会作为 File 对象传递。

### 基本文件上传

```tsx
// app/actions/upload.ts
"use server";

export async function uploadFile(formData: FormData) {
  // 获取文件对象
  const file = formData.get("file") as File;

  if (!file) {
    return { success: false, error: "No file provided" };
  }

  // 文件信息
  console.log("File name:", file.name);
  console.log("File size:", file.size);
  console.log("File type:", file.type);

  // 读取文件内容
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return {
    success: true,
    file: {
      name: file.name,
      size: file.size,
      type: file.type,
    },
  };
}

// app/components/UploadForm.tsx
import { uploadFile } from "@/app/actions/upload";

export function UploadForm() {
  return (
    <form action={uploadFile}>
      <input type="file" name="file" required />
      <button type="submit">Upload</button>
    </form>
  );
}
```

### 多文件上传

```tsx
"use server";

export async function uploadMultipleFiles(formData: FormData) {
  // 获取所有文件
  const files = formData.getAll("files") as File[];

  if (files.length === 0) {
    return { success: false, error: "No files provided" };
  }

  const uploadedFiles = [];

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 处理每个文件
    uploadedFiles.push({
      name: file.name,
      size: file.size,
      type: file.type,
    });
  }

  return {
    success: true,
    files: uploadedFiles,
  };
}

// 表单
<form action={uploadMultipleFiles}>
  <input type="file" name="files" multiple required />
  <button type="submit">Upload Files</button>
</form>;
```

---

## 问题 2：如何验证和处理上传的文件？

文件上传需要进行严格的验证以确保安全性。

### 文件类型和大小验证

```tsx
"use server";

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadImage(formData: FormData) {
  const file = formData.get("image") as File;

  if (!file) {
    return { success: false, error: "No file provided" };
  }

  // 1. 验证文件类型
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.",
    };
  }

  // 2. 验证文件大小
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `File too large. Maximum size is ${
        MAX_FILE_SIZE / 1024 / 1024
      }MB.`,
    };
  }

  // 3. 验证文件名
  const filename = file.name;
  if (!/^[\w\-. ]+$/.test(filename)) {
    return {
      success: false,
      error: "Invalid filename",
    };
  }

  // 处理文件
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return { success: true };
}
```

### 使用 Magic Bytes 验证真实文件类型

```tsx
"use server";

// 检查文件的 magic bytes（文件头）
function getFileType(buffer: Buffer): string | null {
  const magicNumbers = {
    ffd8ff: "image/jpeg",
    "89504e47": "image/png",
    "47494638": "image/gif",
    "52494646": "image/webp",
  };

  const header = buffer.toString("hex", 0, 4);

  for (const [magic, type] of Object.entries(magicNumbers)) {
    if (header.startsWith(magic)) {
      return type;
    }
  }

  return null;
}

export async function uploadSecureImage(formData: FormData) {
  const file = formData.get("image") as File;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 验证真实文件类型（不依赖扩展名）
  const realType = getFileType(buffer);

  if (!realType || !ALLOWED_FILE_TYPES.includes(realType)) {
    return {
      success: false,
      error: "Invalid file type detected",
    };
  }

  // 文件类型验证通过
  return { success: true };
}
```

---

## 问题 3：如何存储上传的文件？

文件可以存储到本地文件系统或云存储服务。

### 存储到本地文件系统

```tsx
"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function saveFileLocally(formData: FormData) {
  const file = formData.get("file") as File;

  if (!file) {
    return { success: false, error: "No file provided" };
  }

  try {
    // 读取文件内容
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const ext = file.name.split(".").pop();
    const filename = `${timestamp}-${randomString}.${ext}`;

    // 确保上传目录存在
    const uploadDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 保存文件
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // 返回公开访问的 URL
    const url = `/uploads/${filename}`;

    return {
      success: true,
      url,
      filename,
    };
  } catch (error) {
    console.error("File upload error:", error);
    return {
      success: false,
      error: "Failed to upload file",
    };
  }
}
```

### 上传到云存储（AWS S3）

```tsx
"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToS3(formData: FormData) {
  const file = formData.get("file") as File;

  if (!file) {
    return { success: false, error: "No file provided" };
  }

  try {
    // 读取文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 生成 S3 key
    const timestamp = Date.now();
    const key = `uploads/${timestamp}-${file.name}`;

    // 上传到 S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        ACL: "public-read", // 或 'private'
      })
    );

    // 生成公开 URL
    const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return {
      success: true,
      url,
      key,
    };
  } catch (error) {
    console.error("S3 upload error:", error);
    return {
      success: false,
      error: "Failed to upload to S3",
    };
  }
}
```

### 上传到 Vercel Blob

```tsx
"use server";

import { put } from "@vercel/blob";

export async function uploadToVercelBlob(formData: FormData) {
  const file = formData.get("file") as File;

  if (!file) {
    return { success: false, error: "No file provided" };
  }

  try {
    // 上传到 Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return {
      success: true,
      url: blob.url,
      pathname: blob.pathname,
    };
  } catch (error) {
    console.error("Vercel Blob upload error:", error);
    return {
      success: false,
      error: "Failed to upload file",
    };
  }
}
```

---

## 问题 4：如何处理图片上传和优化？

图片上传通常需要额外的处理，如压缩、调整大小等。

### 使用 Sharp 处理图片

```tsx
"use server";

import sharp from "sharp";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function uploadAndOptimizeImage(formData: FormData) {
  const file = formData.get("image") as File;

  if (!file) {
    return { success: false, error: "No image provided" };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 生成文件名
    const timestamp = Date.now();
    const filename = `${timestamp}.webp`;

    // 使用 Sharp 处理图片
    const optimized = await sharp(buffer)
      .resize(1200, 1200, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();

    // 保存优化后的图片
    const filepath = join(process.cwd(), "public", "uploads", filename);
    await writeFile(filepath, optimized);

    // 生成缩略图
    const thumbnail = await sharp(buffer)
      .resize(300, 300, { fit: "cover" })
      .webp({ quality: 70 })
      .toBuffer();

    const thumbnailFilename = `${timestamp}-thumb.webp`;
    const thumbnailPath = join(
      process.cwd(),
      "public",
      "uploads",
      thumbnailFilename
    );
    await writeFile(thumbnailPath, thumbnail);

    return {
      success: true,
      image: {
        url: `/uploads/${filename}`,
        thumbnail: `/uploads/${thumbnailFilename}`,
        size: optimized.length,
        originalSize: buffer.length,
      },
    };
  } catch (error) {
    console.error("Image processing error:", error);
    return {
      success: false,
      error: "Failed to process image",
    };
  }
}
```

### 完整的图片上传示例

```tsx
// app/actions/images.ts
"use server";

import sharp from "sharp";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadProfileImage(formData: FormData) {
  // 1. 验证用户
  const session = await auth();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  // 2. 获取文件
  const file = formData.get("image") as File;
  if (!file) {
    return { success: false, error: "No image provided" };
  }

  // 3. 验证文件
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Invalid file type" };
  }

  if (file.size > MAX_SIZE) {
    return { success: false, error: "File too large" };
  }

  try {
    // 4. 处理图片
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 调整大小并优化
    const optimized = await sharp(buffer)
      .resize(400, 400, { fit: "cover" })
      .webp({ quality: 85 })
      .toBuffer();

    // 5. 上传到云存储
    const blob = await put(`avatars/${session.user.id}.webp`, optimized, {
      access: "public",
    });

    // 6. 更新数据库
    await db.user.update({
      where: { id: session.user.id },
      data: { avatar: blob.url },
    });

    // 7. 重新验证页面
    revalidatePath("/profile");

    return {
      success: true,
      url: blob.url,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: "Failed to upload image",
    };
  }
}

// app/components/ProfileImageUpload.tsx
("use client");

import { useState } from "react";
import { uploadProfileImage } from "@/app/actions/images";
import Image from "next/image";

export function ProfileImageUpload({
  currentAvatar,
}: {
  currentAvatar?: string;
}) {
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);

    const formData = new FormData(e.currentTarget);
    const result = await uploadProfileImage(formData);

    setUploading(false);

    if (result.success) {
      alert("Profile image updated!");
    } else {
      alert(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col items-center gap-4">
        {preview && (
          <Image
            src={preview}
            alt="Preview"
            width={200}
            height={200}
            className="rounded-full"
          />
        )}

        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleFileChange}
          required
        />

        <button
          type="submit"
          disabled={uploading}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          {uploading ? "Uploading..." : "Upload Image"}
        </button>
      </div>
    </form>
  );
}
```

## 延伸阅读

- [Next.js 官方文档 - File Uploads](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#file-uploads)
- [Sharp 图片处理库](https://sharp.pixelplumbing.com/)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
- [AWS S3 SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/welcome.html)
- [FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
