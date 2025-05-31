-- Create config table if it doesn't exist
CREATE TABLE IF NOT EXISTS "config" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "systemPrompt" text NOT NULL,
    "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
);

-- Insert default system prompt if table is empty
INSERT OR IGNORE INTO "config" ("id", "systemPrompt") 
VALUES (1, 'Você é um assistente prestativo.');
