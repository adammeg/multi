import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getEnv } from "@/lib/config/env";

export interface StorageAdapter {
  save(buffer: Buffer, filename: string, subfolder?: string): Promise<string>;
  delete(filePath: string): Promise<void>;
  getPublicUrl(filePath: string): string;
}

class LocalStorageAdapter implements StorageAdapter {
  private basePath: string;

  constructor() {
    this.basePath = path.resolve(getEnv().STORAGE_LOCAL_PATH);
  }

  async save(buffer: Buffer, filename: string, subfolder = "videos"): Promise<string> {
    const dir = path.join(this.basePath, subfolder);
    await fs.mkdir(dir, { recursive: true });
    const ext = path.extname(filename);
    const uniqueName = `${uuidv4()}${ext}`;
    const filePath = path.join(subfolder, uniqueName);
    await fs.writeFile(path.join(this.basePath, filePath), buffer);
    return filePath;
  }

  async delete(filePath: string): Promise<void> {
    try {
      await fs.unlink(path.join(this.basePath, filePath));
    } catch {
      // File may already be deleted
    }
  }

  getPublicUrl(filePath: string): string {
    return `/api/files/${filePath.replace(/\\/g, "/")}`;
  }
}

class S3StorageAdapter implements StorageAdapter {
  async save(buffer: Buffer, filename: string, subfolder = "videos"): Promise<string> {
    // Migration path: implement AWS SDK upload when STORAGE_TYPE=s3
    throw new Error("S3 storage not configured. Set STORAGE_TYPE=local for MVP.");
  }

  async delete(_filePath: string): Promise<void> {
    throw new Error("S3 storage not configured.");
  }

  getPublicUrl(filePath: string): string {
    const { AWS_S3_BUCKET, AWS_REGION } = getEnv();
    return `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${filePath}`;
  }
}

let storageInstance: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    storageInstance =
      getEnv().STORAGE_TYPE === "s3"
        ? new S3StorageAdapter()
        : new LocalStorageAdapter();
  }
  return storageInstance;
}
