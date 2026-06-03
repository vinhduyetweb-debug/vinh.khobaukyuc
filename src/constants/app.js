import { AGE_STAGES } from "./age-stages.js";
import { EVENT_TYPES } from "./event-types.js";

export const ROOT_FOLDER = "KHOBAUKYUC";
export const SETTINGS_KEY = "khobaukyuc_settings";
export const BACKUP_HEALTH_KEY = "khobaukyuc_backup_health";

export const DEFAULT_SETTINGS = {
  rootFolder: ROOT_FOLDER,
  driveRootUrl: "",
  apiKey: "",
  clientId: "",
};

export const FOLDER_STRUCTURE = [
  "00_CONFIG/memories.json",
  "00_CONFIG/folder_map.json",
  "00_CONFIG/settings.json",
  "00_CONFIG/backup/",
  "00_CONFIG/cover.jpg",
  ...AGE_STAGES.flatMap((age) => [
    `${age}/ANH_OFFLINE/`,
    `${age}/ANH_GOC_GOOGLEDRIVE/`,
    `${age}/VIDEO_YOUTUBE/`,
    `${age}/GHICHU/`,
  ]),
  ...EVENT_TYPES.map((eventType) => `SU_KIEN_DAC_BIET/${eventType}/`),
];
