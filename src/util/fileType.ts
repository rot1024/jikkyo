export type FileKind = "video" | "comment";

const videoExtensions = /\.(mp4|m4v|webm|mkv|mov|ogv)$/i;
const commentExtensions = /\.(xml|json)$/i;
const commentTypes = ["text/xml", "application/xml", "application/json"];

// MIME types are often empty or generic (e.g. .mkv, .xml on some OSes),
// so the extension is checked as well
export const getFileKind = (file: File): FileKind | undefined => {
  if (file.type.startsWith("video/") || videoExtensions.test(file.name)) {
    return "video";
  }
  if (commentTypes.includes(file.type) || commentExtensions.test(file.name)) {
    return "comment";
  }
  return undefined;
};
