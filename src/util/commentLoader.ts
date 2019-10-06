export interface Comment {
  id: string;
  text: string;
  date: Date;
  vpos: number;
  commenter: string;
  mail: string;
}

export const readText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      if (!e.target) {
        throw new Error("cannot read file");
      }
      resolve(e.target.result as string);
    };
    reader.onerror = () => reject(new Error("cannot read file"));
    reader.readAsText(file);
  });

export const readComments = async (xml: string): Promise<Comment[]> => {
  const parser = new DOMParser();
  const dom = parser.parseFromString(xml, "application/xml");
  if (dom.documentElement.nodeName === "parsererror") {
    throw new Error("xml parse error");
  }

  const comments = Array.from(dom.querySelectorAll("chat")).map((node, i) => {
    const c: Comment = {
      id: i + "",
      text: node.textContent || "",
      date: new Date(parseInt(node.getAttribute("date") || "", 10) * 1000),
      vpos: parseInt(node.getAttribute("vpos") || "", 10) * 10,
      commenter: node.getAttribute("user_id") || "",
      mail: node.getAttribute("mail") || ""
    };
    return c;
  });

  let validComments = comments
    .filter(
      c => c.text !== "" && !isNaN(c.vpos)
      // && !isNaN(c.date.getTime()) && c.commenter !== ""
    )
    .sort((a, b) => a.vpos - b.vpos);

  const invalidCommnents = comments.length - validComments.length;
  if (invalidCommnents > 0) {
    console.warn(`${invalidCommnents} invalid comments are ignored.`);
  }

  // adjust vpos
  if (validComments[0] && validComments[0].vpos < 0) {
    const first = validComments[0].vpos;
    validComments = validComments.map(c => ({ ...c, vpos: c.vpos - first }));
  }

  return validComments;
};

export default async (file: File) => readComments(await readText(file));
