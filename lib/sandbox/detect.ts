import * as fs from 'fs/promises';

export type ProjectType = 'node' | 'python' | 'go' | 'rust' | 'unknown';

/**
 * Detects the project type based on the presence of configuration files 
 * in the root directory.
 * * @param dirPath The absolute path to the repository root
 */
export async function detectProjectType(dirPath: string): Promise<ProjectType> {
  try {
    const files = await fs.readdir(dirPath);
    const fileSet = new Set(files);

    if (fileSet.has('package.json')) {
      return 'node';
    }

    if (fileSet.has('requirements.txt') || fileSet.has('pyproject.toml') || fileSet.has('setup.py')) {
      return 'python';
    }

    if (fileSet.has('go.mod')) {
      return 'go';
    }

    if (fileSet.has('Cargo.toml')) {
      return 'rust';
    }

    return 'unknown';
  } catch (error) {
    console.warn(`[Project Detect] Failed to read directory ${dirPath}:`, error);
    return 'unknown';
  }
}