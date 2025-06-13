const OpenAI = require('openai');
const { db } = require('../config/database');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIService {
  constructor() {
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    this.maxTokens = 1000;
    this.temperature = 0.7;
  }

  /**
   * Get system prompt for a category
   */
  async getCategoryPrompt(categorySlug) {
    try {
      const category = await db.get(
        'SELECT system_prompt FROM categories WHERE slug = ? AND is_active = 1',
        [categorySlug]
      );
      
      if (!category) {
        throw new Error(`Category ${categorySlug} not found or inactive`);
      }
      
      return category.system_prompt;
    } catch (error) {
      console.error('Error getting category prompt:', error);
      throw error;
    }
  }

  /**
   * Generate AI response for chat
   */
  async generateChatResponse(sessionId, messages, categorySlug, userContext = {}) {
    try {
      // Get system prompt for category
      const systemPrompt = await this.getCategoryPrompt(categorySlug);
      
      // Enhance system prompt with user context
      const enhancedSystemPrompt = this.enhanceSystemPrompt(systemPrompt, userContext);
      
      // Prepare messages for OpenAI
      const openaiMessages = [
        { role: 'system', content: enhancedSystemPrompt },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      console.log(`🤖 Generating AI response for session ${sessionId}`);

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: openaiMessages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        user: `session_${sessionId}`
      });

      const aiResponse = response.choices[0].message.content;
      
      console.log(`✅ AI response generated (${response.usage?.total_tokens} tokens)`);

      return {
        content: aiResponse,
        usage: response.usage,
        model: this.model
      };
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  }

  /**
   * Enhance system prompt with user context
   */
  enhanceSystemPrompt(basePrompt, userContext) {
    let enhancedPrompt = basePrompt;
    
    // Add user location for shopping category
    if (userContext.location) {
      enhancedPrompt += `\n\nBenutzer-Standort: ${userContext.location}. Berücksichtige lokale Geschäfte und Angebote in dieser Region.`;
    }
    
    // Add user preferences
    if (userContext.preferences) {
      try {
        const prefs = JSON.parse(userContext.preferences);
        if (prefs.dietary_restrictions) {
          enhancedPrompt += `\n\nErnährungseinschränkungen: ${prefs.dietary_restrictions.join(', ')}`;
        }
        if (prefs.fitness_level) {
          enhancedPrompt += `\n\nFitness-Level: ${prefs.fitness_level}`;
        }
        if (prefs.budget_range) {
          enhancedPrompt += `\n\nBudget-Bereich: ${prefs.budget_range}`;
        }
      } catch (e) {
        console.warn('Could not parse user preferences:', e);
      }
    }
    
    // Add current date for relevance
    enhancedPrompt += `\n\nAktuelles Datum: ${new Date().toLocaleDateString('de-DE')}`;
    
    // Add response format instructions
    enhancedPrompt += `\n\nAntworte immer auf Deutsch, sei konkret und hilfreich. Strukturiere deine Antworten mit Aufzählungen oder Schritten, wenn das sinnvoll ist.`;
    
    return enhancedPrompt;
  }

  /**
   * Generate price comparison (Mock implementation)
   */
  async generatePriceComparison(productQuery, location = null) {
    try {
      const pricePrompt = `Führe einen Preisvergleich für folgendes Produkt durch:
Produkt: ${productQuery}
${location ? `Standort: ${location}` : ''}

Da ich keine Echtzeitdaten habe, erstelle eine realistische Beispiel-Antwort mit typischen deutschen Einzelhändlern und aktuellen Preisbereichen.

Strukturiere die Antwort so:
- Produktname
- 3-5 Geschäfte mit realistischen Preisen
- Bester Preis und Ersparnis
- 2-3 Spartipps
- Alternative Produkte`;

      const messages = [
        { 
          role: 'system', 
          content: 'Du bist ein Preisvergleichs-Experte für deutsche Einzelhändler. Erstelle realistische Preisvergleiche basierend auf typischen Marktpreisen.'
        },
        { role: 'user', content: pricePrompt }
      ];

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: 800,
        temperature: 0.4
      });

      return {
        content: response.choices[0].message.content,
        usage: response.usage,
        model: this.model
      };
      
    } catch (error) {
      console.error('Error generating price comparison:', error);
      throw error;
    }
  }
}

module.exports = new AIService();