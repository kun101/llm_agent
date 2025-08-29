// System prompt for the multi-tool reasoning agent
export const agentPrompt = (apiInfo) => `You are an intelligent multi-tool reasoning agent. Your goal is to help users accomplish their tasks by automatically using the appropriate tools and reasoning through problems step by step.

Key behaviors:
1. Be proactive - if a user asks something that could benefit from web search, code execution, or AI workflows, use those tools automatically
2. Chain tool calls logically - search for information first, then process it with code or workflows as needed
3. Always explain what you're doing and why you're using specific tools
4. For calculations, use JavaScript execution to show your work
5. For current information, use Google search
6. For AI workflows, use simple workflow names like 'summarize', 'sentiment', 'expand-content' with appropriate text payload
7. Be conversational and helpful - guide users through multi-step processes

Available tools: 
- google_search: Search the web for current information
- execute_javascript: Run calculations and data processing
- aipipe_workflow: Use AI workflows for text processing (workflow names: 'summarize', 'sentiment', 'expand-content')

Important: For AI workflows, use workflow names (not URLs) and include text content in the payload.`;

// Demo configurations for available tools
export const demos = [
  {
    icon: "google",
    title: "Google Search",
    description: "Search the web using Google Custom Search API.",
    prompt: "Use the google_search tool to find information on the web. You will receive a list of search result snippets.",
    questions: [
      "What's the latest news about OpenAI and summarize the key points?",
      "Find IBM's current stock price and calculate a 15% gain",
      "Search for today's weather in New York and suggest what to wear",
      "Interview me to create a blog post about artificial intelligence",
    ],
    params: [
      {
        label: "Google CSE API Key",
        link: "https://developers.google.com/custom-search/v1/introduction",
        required: true,
        key: "google-cse-key",
        type: "password",
      },
      {
        label: "Google CSE CX ID",
        link: "https://programmablesearchengine.google.com/controlpanel/all",
        required: true,
        key: "google-cse-cx",
        type: "password",
      },
    ],
  },
  {
    icon: "cpu",
    title: "AI Pipe (OpenRouter)",
    description: "Access multiple AI models through the AI Pipe OpenRouter proxy for text processing tasks.",
    prompt: "Use the aipipe_workflow tool for text processing tasks like summarize, sentiment analysis, content expansion, translation, and analysis. This uses OpenRouter models through AI Pipe.",
    questions: [
      "Summarize this text: 'Artificial intelligence has revolutionized many industries...'",
      "Analyze the sentiment of this review: 'This product exceeded my expectations!'",
      "Expand this outline: '1. AI Benefits 2. Implementation 3. Future Outlook'",
      "Translate 'Hello, how are you?' to Spanish",
    ],
    params: [
      {
        label: "AI Pipe API Key",
        link: "https://aipipe.org",
        required: true,
        key: "aipipe-key",
        type: "password",
        note: "Provides access to OpenRouter models via AI Pipe proxy. Get your key from aipipe.org"
      },
    ],
  },
  {
    icon: "code-slash",
    title: "JavaScript Executor",
    description: "Execute JavaScript code in a sandboxed environment.",
    prompt: "Use the execute_javascript tool to run calculations, data processing, or other computational tasks.",
    questions: [
      "Calculate compound interest: $10,000 at 7% for 5 years",
      "Generate a secure password with special characters",
      "Sort and analyze this data: [64, 34, 25, 12, 22, 11, 90]",
      "Create a simple budget calculator for monthly expenses",
      "Calculate the tip and split a $127.50 restaurant bill for 4 people",
    ],
    params: [],
  },
];
