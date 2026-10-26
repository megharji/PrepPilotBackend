import fs from "node:fs/promises";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

// Resume file (PDF / DOCX) se plain text, taaki AI uske projects/skills pe sawaal pooch sake.
// File na mile ya padh na paaye to null: interview bina resume ke chal jaata hai.
export const extractResumeText = async (filePath: string, mimeType: string): Promise<string | null> => {
    try {
        const buffer = await fs.readFile(filePath);

        if (mimeType === "application/pdf") {
            const parser = new PDFParse({ data: buffer });
            try {
                return (await parser.getText()).text.trim() || null;
            } finally {
                await parser.destroy();
            }
        }

        if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            return (await mammoth.extractRawText({ buffer })).value.trim() || null;
        }

        return null;
    } catch (err) {
        console.error("Resume text extract nahi hua:", err);
        return null;
    }
};
