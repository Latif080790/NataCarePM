"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAIInsight = void 0;
const generative_ai_1 = require("@google/generative-ai");
// Helper function to generate AI insights using Google Gemini
const generateAIInsight = async (projectContext, apiKey) => {
    try {
        // Initialize Google Generative AI with the provided API key
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        // Select the model
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        // Create a prompt based on project context
        const prompt = `
      Analyze the following construction project data and provide insights:
      
      Project Name: ${projectContext.projectName}
      Location: ${projectContext.location}
      Start Date: ${projectContext.startDate}
      Total Budget: ${projectContext.totalBudget}
      Total Actual Cost: ${projectContext.totalActualCost}
      
      Work Items:
      ${projectContext.workItems.map((item) => `- ${item.uraian} (${item.volume} ${item.satuan})`).join('\n')}
      
      Recent Reports:
      ${projectContext.recentReports.map((report) => `- ${report.date}: ${report.notes}`).join('\n')}
      
      Inventory Status:
      ${projectContext.inventoryStatus.map((item) => `- ${item.name}: ${item.quantity} ${item.unit}`).join('\n')}
      
      Please provide:
      1. A summary of the project status
      2. Key risks and opportunities
      3. Predictions for completion date and final cost
      4. Recommendations for improvement
    `;
        // Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return {
            summary: text,
            generatedAt: new Date().toISOString()
        };
    }
    catch (error) {
        console.error('Error generating AI insight:', error);
        throw new Error('Failed to generate AI insight');
    }
};
exports.generateAIInsight = generateAIInsight;
//# sourceMappingURL=aiInsightService.js.map