import { CpanelClient } from './cpanel-client';
import { CpanelCredentials } from './cpanel-types';

export class CpanelFileAdapter {
  private client: CpanelClient;

  constructor(credentials: CpanelCredentials) {
    this.client = new CpanelClient(credentials);
  }

  /**
   * Check if destination directory exists and list its contents
   */
  async checkDirectory(destinationDir: string): Promise<{ exists: boolean; files: string[] }> {
    const cleanDir = destinationDir.replace(/^\/+/, '');
    try {
      const res = await this.client.execute('Fileman', 'list_files', {
        dir: cleanDir,
        check_for_leaf_directories: 1,
      });

      const fileList: string[] = [];
      if (Array.isArray(res.data)) {
        res.data.forEach((item: any) => {
          if (item.file) fileList.push(item.file);
        });
      }
      return { exists: true, files: fileList };
    } catch (err: any) {
      return { exists: false, files: [] };
    }
  }

  /**
   * Extract ZIP archive in destination directory using cPanel Fileman
   */
  async extractArchive(archivePath: string, destinationDir: string): Promise<boolean> {
    const cleanDir = destinationDir.replace(/^\/+/, '');
    const cleanFile = archivePath.replace(/^\/+/, '');

    const res = await this.client.execute('Fileman', 'extract_files', {
      dir: cleanDir,
      file: cleanFile,
    });

    return res.status === 1;
  }

  /**
   * Save or update file content (such as .env or htaccess) via cPanel Fileman
   */
  async saveFile(dir: string, filename: string, content: string): Promise<boolean> {
    const cleanDir = dir.replace(/^\/+/, '');
    const res = await this.client.execute('Fileman', 'save_file_content', {
      dir: cleanDir,
      filename,
      content,
    });

    return res.status === 1;
  }

  /**
   * Write production .env file to destination directory
   */
  async writeEnvironmentConfig(destinationDir: string, envVariables: Record<string, string>): Promise<boolean> {
    const envLines = Object.entries(envVariables).map(([key, value]) => {
      // Escape and quote values containing spaces or quotes
      if (value.includes(' ') || value.includes('"') || value.includes('\n')) {
        return `${key}="${value.replace(/"/g, '\\"')}"`;
      }
      return `${key}=${value}`;
    });

    const envContent = envLines.join('\n') + '\n';
    return this.saveFile(destinationDir, '.env', envContent);
  }
}
