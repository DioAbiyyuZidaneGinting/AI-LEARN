import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Increase request size limit for document uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Shared Gemini Client
let ai: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.includes("MY_GEMINI_API_KEY")) {
      throw new Error("GEMINI_API_KEY is not configured. Please add it via the Secrets panel in AI Studio settings.");
    }
    ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

interface GenerateParams {
  contents: any;
  config?: any;
}

async function generateContentWithFallback(params: GenerateParams): Promise<any> {
  const client = getGemini();
  // We prioritize gemini-3.5-flash, falling back to fully functional alternatives immediately on 503/errors
  const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  
  let lastError: any = null;
  for (const modelName of modelsToTry) {
    try {
      console.log(`[Gemini] Attempting generation with model: ${modelName}`);
      const response = await client.models.generateContent({
        ...params,
        model: modelName,
      });
      console.log(`[Gemini] Generation successful with model: ${modelName}`);
      return response;
    } catch (err: any) {
      console.warn(`[Gemini] Model ${modelName} failed. Error:`, err.message || err);
      lastError = err;
    }
  }
  
  throw lastError || new Error("Failed to generate content with any available Gemini model.");
}

// In-Memory Document Store for RAG
interface RAGChunk {
  documentId: string;
  documentName: string;
  text: string;
  vector: number[];
}

interface RAGDocument {
  id: string;
  name: string;
  content: string;
  sizeBytes: number;
  uploadedAt: string;
  chunksCount: number;
}

const documentStore: {
  files: RAGDocument[];
  chunks: RAGChunk[];
} = {
  files: [],
  chunks: [],
};

// Vector arithmetic helper functions
function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

function magnitude(a: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * a[i];
  }
  return Math.sqrt(sum);
}

function cosineSimilarity(a: number[], b: number[]): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
}

// Helper to chunk text
function chunkText(text: string, maxChunkSize = 800, overlap = 150): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentWords: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    currentWords.push(word);
    currentLength += word.length + 1; // +1 space

    if (currentLength >= maxChunkSize) {
      chunks.push(currentWords.join(" "));
      // Maintain overlap by keeping last N words
      const overlapWordsCount = Math.floor(words.length * (overlap / maxChunkSize)) || 10;
      currentWords = currentWords.slice(-Math.min(overlapWordsCount, currentWords.length));
      currentLength = currentWords.join(" ").length;
    }
  }

  if (currentWords.length > 0) {
    chunks.push(currentWords.join(" "));
  }

  return chunks.filter(c => c.trim().length > 10);
}

// ==========================================
// API ROUTES
// ==========================================

// 1. Ask Anything (General Q&A)
app.post("/api/qa", async (req, res) => {
  try {
    const { question, history } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const client = getGemini();
    
    // Construct system instructions
    const systemInstruction = 
      "You are a friendly, expert AI Smart Learning Companion. " +
      "Your goal is to explain difficult topics in a comprehensive, encouraging, and highly structured manner. " +
      "Always format your response using professional, stylized Markdown, incorporating key terms to emphasize main points. " +
      "Use well-structured bullet points, mini-tables, or inline definitions for maximum readability. " +
      "Provide practical examples, analogies, and a short, motivational takeaway at the end.";

    // Convert client-supplied history to contents if provided with strict alternation and user-first rules
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        if (!msg.text || typeof msg.text !== "string" || msg.text.trim() === "") {
          return;
        }
        const role = msg.sender === "user" ? "user" : "model";
        
        // Skip any leading model/assistant default greeting since Gemini history must start with "user"
        if (contents.length === 0 && role === "model") {
          return;
        }

        // Handle same consecutives by appending text inside the previous message
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += "\n" + msg.text;
        } else {
          contents.push({
            role,
            parts: [{ text: msg.text }]
          });
        }
      });
    }

    // Append the current question. If the last message was a user message, append to it.
    if (contents.length > 0 && contents[contents.length - 1].role === "user") {
      contents[contents.length - 1].parts[0].text += "\n" + question;
    } else {
      contents.push({ role: "user", parts: [{ text: question }] });
    }

    const response = await generateContentWithFallback({
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "Sorry, I was unable to generate a response.";
    res.json({ answer: reply });
  } catch (error: any) {
    console.error("Q&A Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response." });
  }
});

// 2. Personalized Study Plan Generator
app.post("/api/study-plan", async (req, res) => {
  try {
    const { subject, goal, timelineWeeks = 2, difficulty = "intermediate", dailyTimeMinutes = 60 } = req.body;
    if (!subject || !goal) {
      return res.status(400).json({ error: "Subject and core goal are required" });
    }

    const client = getGemini();

    const response = await generateContentWithFallback({
      contents: `Generate a highly personalized study plan for learning "${subject}" over the next ${timelineWeeks} weeks. My objective is: "${goal}". My preferred level is "${difficulty}" and I can study for "${dailyTimeMinutes}" minutes per day.`,
      config: {
        systemInstruction: "You are an elite educational therapist and curriculum architect. Design a personalized, balanced learning roadmap. Output purely valid JSON following the schema perfectly. Make sure the generated daily 'materialContent' is highly comprehensive, engaging, educational, and explains the concepts/theories/formulas in high detail in Bahasa Indonesia.",
        temperature: 0.5,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A high-level encouraging roadmap summary emphasizing the custom methodology." },
            days: {
              type: Type.ARRAY,
              description: "Day-by-day lesson assignments for critical days of the plan. Propose about 5 action-packed study days per week.",
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.INTEGER, description: "Day number (e.g. 1, 2, 3...)" },
                  title: { type: Type.STRING, description: "Theme of this day" },
                  materialContent: { type: Type.STRING, description: "Materi belajar lengkap berisi ringkasan teori, rumus, dan penjelasan materi mendalam untuk dipelajari hari ini (minimal 2-3 paragraf berpenjelasan tinggi dalam Bahasa Indonesia, dapat menggunakan markdown sederhana seperti sub-heading, tebal, list, dan baris baru)." },
                  topics: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Core bulleted concept definitions or formulas" },
                  tasks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific interactive exercises or practice objectives" },
                  durationMinutes: { type: Type.INTEGER, description: "Total recommended intensive minutes" },
                  learningOutcome: { type: Type.STRING, description: "Clear goal statement explaining what gets mastered" },
                  resources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Recommended books, keywords, or types of articles" }
                },
                required: ["day", "title", "materialContent", "topics", "tasks", "durationMinutes", "learningOutcome"]
              }
            }
          },
          required: ["summary", "days"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from AI");
    }

    const planData = JSON.parse(responseText.trim());
    res.json(planData);
  } catch (error: any) {
    console.error("Study Plan Generator Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate personalized study plan." });
  }
});

// 3. Interactive Quiz Generator
app.post("/api/quiz", async (req, res) => {
  try {
    const { subject, difficulty = "medium", count = 5 } = req.body;
    if (!subject) {
      return res.status(400).json({ error: "Subject is required to build a quiz" });
    }

    const client = getGemini();

    const response = await generateContentWithFallback({
      contents: `Construct an interactive multiple-choice quiz about "${subject}". Focus on difficulty: "${difficulty}". Provide exactly ${count} educational questions designed to build deep cognitive recall. Ensure options are challenging and explanations inside the json are highly educational.`,
      config: {
        systemInstruction: "You are a master learning evaluation professional. Design valid, engaging multiple choice questions that check true intuition.",
        temperature: 0.6,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A creative, friendly quiz title based on the topic" },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: "The multiple-choice question" },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Exactly 4 options"
                  },
                  correctAnswerIndex: { type: Type.INTEGER, description: "0-based index of correct answer (0 to 3)" },
                  explanation: { type: Type.STRING, description: "A short, excellent paragraph explaining why correct choice is ideal and other choices are inaccurate" }
                },
                required: ["question", "options", "correctAnswerIndex", "explanation"]
              }
            }
          },
          required: ["title", "questions"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Quiz compilation produced nothing.");
    }

    const quizData = JSON.parse(responseText.trim());
    res.json(quizData);
  } catch (error: any) {
    console.error("Quiz Generator Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate interactive quiz." });
  }
});

// 4. RAG - Store Document and compute vector embeddings locally
app.post("/api/rag/upload", async (req, res) => {
  try {
    const { name, content: rawContent, fileData, mimeType } = req.body;
    let content = "";

    if (fileData && mimeType) {
      // It's a file upload (Base64 encoded)
      const isText = mimeType.startsWith("text/") || 
                     mimeType === "application/json" || 
                     mimeType === "application/javascript" || 
                     name.endsWith(".txt") || 
                     name.endsWith(".md") || 
                     name.endsWith(".json");
                     
      if (isText) {
        content = Buffer.from(fileData, "base64").toString("utf8");
      } else {
        // Binary or rich-media file (PDF, PPTX, DOCX, Image), extract notes via Gemini 3.5 Flash!
        const client = getGemini();
        
        let typeToUse = mimeType;
        if (name.endsWith(".docx") && (!mimeType || mimeType === "application/octet-stream")) {
          typeToUse = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else if (name.endsWith(".pptx") && (!mimeType || mimeType === "application/octet-stream")) {
          typeToUse = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        } else if (name.endsWith(".pdf") && (!mimeType || mimeType === "application/octet-stream")) {
          typeToUse = "application/pdf";
        }

        try {
          const extractionResponse = await generateContentWithFallback({
            contents: [
              {
                inlineData: {
                  mimeType: typeToUse,
                  data: fileData,
                },
              },
              "Ekstrak dan transkripsikan seluruh isi materi pembelajaran, teks penting, catatan, daftar rumus/teori, dan bab penting dari dokumen ini secara lengkap dan terstruktur dalam Bahasa Indonesia. Jangan meringkas secara berlebihan sehingga nilai-nilai akademis penting hilang. Output berupa teks catatan bersih dalam format Markdown."
            ],
          });
          
          content = extractionResponse.text || "";
        } catch (extractionErr: any) {
          console.error("Gemini document text extraction error:", extractionErr);
          return res.status(400).json({ 
            error: `Gagal mengekstrak teks dari dokumen ${name}. Harap pastikan format file valid (PDF/Gambar/Word/PPT/Text).` 
          });
        }
      }
    } else {
      content = rawContent || "";
    }

    if (!name || !content || content.trim().length < 10) {
      return res.status(400).json({ error: "Nama file tidak valid atau materi yang diekstrak terlalu pendek (min 10 karakter)." });
    }

    const client = getGemini();

    // 1. Break text into cohesive chunks (e.g., paragraphs or size limited)
    const textChunks = chunkText(content, 700, 150);
    if (textChunks.length === 0) {
      return res.status(400).json({ error: "Internal document content is too short or empty" });
    }

    const docId = `doc_${Date.now()}`;
    const newDocument: RAGDocument = {
      id: docId,
      name,
      content,
      sizeBytes: Buffer.byteLength(content, "utf8"),
      uploadedAt: new Date().toISOString(),
      chunksCount: textChunks.length,
    };

    // 2. Fetch Embeddings via Gemini API for each chunk
    const embedPromises = textChunks.map(async (chunk) => {
      try {
        const embedResponse = await client.models.embedContent({
          model: "gemini-embedding-2-preview",
          contents: chunk,
        });

        const embeddingValues = embedResponse.embeddings?.[0]?.values;
        if (!embeddingValues) {
          throw new Error("No vector generated for this chunk");
        }

        return {
          documentId: docId,
          documentName: name,
          text: chunk,
          vector: embeddingValues,
        };
      } catch (err) {
        console.error(`Error embedding chunk:`, err);
        return null;
      }
    });

    const resolvedChunks = await Promise.all(embedPromises);
    const validChunks = resolvedChunks.filter((c): c is RAGChunk => c !== null);

    if (validChunks.length === 0) {
      throw new Error("Failed to generate vector embeddings for any of the document content chunks.");
    }

    // 3. Save into our local server store
    documentStore.files.push(newDocument);
    documentStore.chunks.push(...validChunks);

    res.json({
      success: true,
      document: newDocument,
    });
  } catch (error: any) {
    console.error("RAG Document Upload Error:", error);
    res.status(500).json({ error: error.message || "Failed to process and vectorize current document." });
  }
});

// 5. RAG - Get list of uploaded documents
app.get("/api/rag/documents", (req, res) => {
  res.json({ files: documentStore.files });
});

// 6. RAG - Delete uploaded document
app.delete("/api/rag/documents/:id", (req, res) => {
  const { id } = req.params;
  documentStore.files = documentStore.files.filter((f) => f.id !== id);
  documentStore.chunks = documentStore.chunks.filter((c) => c.documentId !== id);
  res.json({ success: true, message: "Document removed successfully" });
});

// 7. RAG - Query vector database and answer on grounded context
app.post("/api/rag/query", async (req, res) => {
  try {
    const { question, activeDocIds } = req.body;
    if (!question) {
      return res.status(400).json({ error: "RAG question query is required" });
    }

    if (documentStore.files.length === 0) {
      return res.status(400).json({ error: "Please upload or paste a study document first before utilizing RAG Q&A." });
    }

    const client = getGemini();

    // 1. Generate query embedding vector
    const queryEmbedResponse = await client.models.embedContent({
      model: "gemini-embedding-2-preview",
      contents: question,
    });

    const queryVector = queryEmbedResponse.embeddings?.[0]?.values;
    if (!queryVector) {
      throw new Error("Query could not be vectorized.");
    }

    // 2. Filter active chunks if specific documents selected
    const targetChunks = activeDocIds && Array.isArray(activeDocIds) && activeDocIds.length > 0
      ? documentStore.chunks.filter((c) => activeDocIds.includes(c.documentId))
      : documentStore.chunks;

    if (targetChunks.length === 0) {
      return res.status(400).json({ error: "No document fragments matched your document filters." });
    }

    // 3. Score cosine similarities between query vector and chunk vectors
    const scoredChunks = targetChunks.map((chunk) => {
      const score = cosineSimilarity(queryVector, chunk.vector);
      return { chunk, score };
    });

    // 4. Extract top 4 relevant chunks
    const topScored = scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    const relevantContextText = topScored
      .map((item, idx) => `[Source file: ${item.chunk.documentName} | Score: ${(item.score * 100).toFixed(1)}%]\n${item.chunk.text}`)
      .join("\n\n---\n\n");

    // 5. Query gemini-3.5-flash with Grounded Context
    const systemInstruction = 
      "You are a state-of-the-art Document Q&A Learning Companion powered by precise Local Retrieval-Augmented Generation (RAG). " +
      "Answer the user's question with utmost analytical accuracy, using exclusively the context blocks provided. " +
      "If the context block doesn't contain answers, acknowledge this clearly. " +
      "Present complex calculations or listings using descriptive styled Markdown tables and clear bullet lists. " +
      "Always encourage student intellectual efforts and write the answer in clean formatted markdown.";

    const contents = `Reference contexts from the user's uploaded materials:\n${relevantContextText}\n\nClient Question: "${question}"`;

    const qaResponse = await generateContentWithFallback({
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    const answer = qaResponse.text || "Could not synthesize answer from references.";

    // Track matching sources to display to user
    const sources = topScored.map(item => ({
      name: item.chunk.documentName,
      snippet: item.chunk.text,
      matchScore: item.score
    }));

    res.json({
      answer,
      sources,
    });
  } catch (error: any) {
    console.error("RAG Query Error:", error);
    res.status(500).json({ error: error.message || "Failed to resolve RAG contextual answering." });
  }
});


// ==========================================
// VITE AND DEVELOPMENT SETUP
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode - Configure Vite Dev Server Middleware
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode - Serve assets built by 'npm run build'
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server launched and listening on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
