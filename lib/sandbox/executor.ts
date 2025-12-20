import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { sandboxQueue, SandboxJob } from './queue';

const EXEC_TIMEOUT = 10 * 60 * 1000; // 10 min
const execAsync = promisify(exec);

// --- LIVE LOGGER ---
const createLogger = (jobId: string) => (message: string) => {
  console.log(`[Job ${jobId}] ${message}`);
  sandboxQueue.setJobStatus(jobId, "running", message);
};

// --- STUB PROJECT DETECTOR ---
async function detectProjectType(dir: string): Promise<'node' | 'python' | 'unknown'> {
  const files = await fs.readdir(dir);
  if (files.includes("package.json")) return "node";
  if (files.includes("requirements.txt") || files.includes("setup.py") || files.includes("pyproject.toml")) return "python";
  return "unknown";
}

// ------------------------------------------------------------------------

export async function runSandbox(
  job: SandboxJob
): Promise<{ success: boolean; logs: string[] }> {
  const log = createLogger(job.id);
  const tmpDir = path.join("/tmp", `troql-${job.id}`);
  const collectedLogs: string[] = [];

  // wrapper to collect stdout/stderr
  const runCmd = async (command: string, cwd: string) => {
    log(`> ${command}`);
    collectedLogs.push(`> ${command}`);

    try {
      const { stdout, stderr } = await execAsync(command, { cwd, timeout: EXEC_TIMEOUT });

      if (stdout) collectedLogs.push(stdout.trim());
      if (stderr) collectedLogs.push(`[stderr] ${stderr.trim()}`);

      return { stdout, stderr };

    } catch (error: any) {
      const errMsg =
        error?.stderr?.trim() ||
        error?.stdout?.trim() ||
        error?.message ||
        JSON.stringify(error);

      log(`❌ CMD FAILED: ${command}`);
      console.error(`[Sandbox Executor Error]`, errMsg);

      collectedLogs.push(`[EXECUTOR ERROR] ${errMsg}`);
      throw error;
    }
  };

  try {
    log("Initializing sandbox...");

    await fs.mkdir(tmpDir, { recursive: true });

    // clone
    log(`Cloning repo: ${job.repoUrl}`);
    await runCmd(`git clone --depth 1 ${job.repoUrl} .`, tmpDir);

    // apply diff
    log(`Applying patch → ${job.targetFile}`);
    const patchPath = path.join(tmpDir, "troql_edit.patch");
    await fs.writeFile(patchPath, job.diff);

    await runCmd(`patch -p1 -i troql_edit.patch`, tmpDir);

    log("Patch applied successfully ✔");

    // detect language
    const projectType = await detectProjectType(tmpDir);
    log(`Detected project type: ${projectType}`);

    switch (projectType) {
      case "node":
        log("Installing node deps...");
        await runCmd(`npm install --ignore-scripts --no-audit`, tmpDir);

        const pkgJson = JSON.parse(await fs.readFile(path.join(tmpDir, "package.json"), 'utf-8'));

        if (pkgJson.scripts?.build) {
          log("Running build...");
          await runCmd(`npm run build`, tmpDir);
        } else {
          log("No build script — skipping");
        }
        break;

      case "python":
        log("Installing python deps...");
        if (await fs.stat(path.join(tmpDir, 'requirements.txt')).catch(() => false)) {
          await runCmd(`pip install -r requirements.txt`, tmpDir);
        }

        if (await fs.stat(path.join(tmpDir, 'setup.py')).catch(() => false)) {
          log("Running setup build...");
          await runCmd(`python3 setup.py build`, tmpDir);
        }
        break;

      default:
        log("Unknown project type → skipping build");
    }

    log("🎯 SANDBOX VERIFICATION PASSED");
    return { success: true, logs: collectedLogs };

  } catch (err) {
    log("❌ SANDBOX VERIFICATION FAILED");
    return { success: false, logs: collectedLogs };

  } finally {
    log("Cleaning temp directory...");

    await fs.rm(tmpDir, { recursive: true, force: true })
      .catch(e => console.warn("Cleanup failed:", e));
  }
}
