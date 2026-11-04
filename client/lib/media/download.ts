import { toast } from "@/lib/notify";

/**
 * Save a file to the device instead of navigating to it. We fetch the bytes and
 * hand the browser a blob with a download name, so nothing opens in a new tab.
 * Cross origin media needs the bucket's CORS to allow a GET from this origin; if
 * it does not, the fetch throws and we say so rather than failing silently.
 */
export async function downloadFile(url: string, name: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(String(response.status));
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = name || "download";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    toast("Could not download that file.");
  }
}
