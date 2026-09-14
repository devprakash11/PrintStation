import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const runPowerShell = async (script) => {
  const { stdout } = await execFileAsync('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script,
  ], { windowsHide: true, maxBuffer: 1024 * 1024 * 4 });
  return stdout.trim();
};

export async function discoverPrinters() {
  if (process.platform !== 'win32') throw new Error('The PrintStation Agent currently supports Windows only.');
  const script = `Get-Printer | Select-Object Name,PrinterStatus,DriverName,PortName,Shared,WorkOffline | ConvertTo-Json -Compress`;
  const raw = await runPowerShell(script);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  const printers = Array.isArray(parsed) ? parsed : [parsed];
  return printers.map((printer) => ({
    systemPrinterName: printer.Name,
    status: normalizeStatus(printer),
    capabilities: {
      driverName: printer.DriverName || null,
      portName: printer.PortName || null,
      shared: Boolean(printer.Shared),
      workOffline: Boolean(printer.WorkOffline),
    },
  }));
}

function normalizeStatus(printer) {
  if (printer.WorkOffline) return 'offline';
  const value = String(printer.PrinterStatus || '').toLowerCase();
  if (value.includes('error') || value.includes('blocked')) return 'error';
  if (value.includes('busy') || value.includes('printing')) return 'busy';
  if (value.includes('offline')) return 'offline';
  return 'online';
}

export async function printFile(filePath, printerName, copies = 1) {
  if (process.platform !== 'win32') throw new Error('Printing is currently supported on Windows only.');
  if (!filePath || !printerName) throw new Error('A file path and printer name are required.');
  const escapedFile = filePath.replace(/'/g, "''");
  const escapedPrinter = printerName.replace(/'/g, "''");
  const count = Math.max(1, Math.min(100, Number(copies) || 1));
  const script = `$file='${escapedFile}'; $printer='${escapedPrinter}'; $count=${count}; if (!(Test-Path -LiteralPath $file)) { throw 'Print file not found.' }; 1..$count | ForEach-Object { Start-Process -FilePath $file -Verb PrintTo -ArgumentList ('"' + $printer + '"') -PassThru | Out-Null; Start-Sleep -Milliseconds 800 }`;
  await runPowerShell(script);
}
