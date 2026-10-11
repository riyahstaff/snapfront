import { Directory, File, Paths } from "expo-file-system";
import * as MediaLibrary from "expo-media-library/legacy";
import * as Sharing from "expo-sharing";

/** Download a file from Snapfront into the app's cache. */
async function download(url: string): Promise<File> {
  const dir = new Directory(Paths.cache, "snapfront-media");
  if (!dir.exists) dir.create({ intermediates: true });
  const name = url.split("/").pop()?.split("?")[0] || `file-${Date.now()}`;
  const existing = new File(dir, name);
  if (existing.exists) return existing;
  return File.downloadFileAsync(url, dir);
}

/** Save photos or videos to the phone's gallery. Returns false if the person said no to access. */
export async function saveToPhone(urls: string[]): Promise<boolean> {
  const perm = await MediaLibrary.requestPermissionsAsync(true);
  if (!perm.granted) return false;
  for (const url of urls) {
    const f = await download(url);
    await MediaLibrary.saveToLibraryAsync(f.uri);
  }
  return true;
}

/** Open the share sheet (Instagram, TikTok, Messages...) with one file. */
export async function shareFile(url: string): Promise<void> {
  const f = await download(url);
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(f.uri);
}
