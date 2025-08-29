# LLM Agent POC - Browser-Based Multi-Tool Reasoning

A sophisticated browser-based AI agent that demonstrates the power of multi-tool reasoning. Built as a proof-of-concept, this agent can automatically chain multiple tools together to accomplish complex tasks, making it easier for users to get comprehensive answers and solutions.

## 🚀 Key Features

### **Intelligent Multi-Tool Reasoning**
- **Automatic Tool Selection**: Agent proactively chooses appropriate tools based on user queries
- **Tool Chaining**: Seamlessly combines web search, code execution, and AI workflows
- **Iterative Problem Solving**: Loops through multiple reasoning steps until task completion

### **Available Tools**
- **🔍 Google Search**: Real-time web search with snippet extraction and result ranking
- **⚙️ AI Pipe Workflows**: Serverless AI workflow execution for complex data processing
- **💻 JavaScript Executor**: Sandboxed code execution with comprehensive error handling

### **Enhanced User Experience**
- **Smart Suggestions**: Dynamic placeholder text with conversation starters
- **Real-time Status**: Live progress updates and typing indicators
- **Error Handling**: Graceful error display with actionable suggestions
- **Export/Import**: Save and load conversation history
- **Keyboard Shortcuts**: `Ctrl+Enter` to send, `Ctrl+K` to clear
- **Responsive Design**: Works seamlessly on desktop and mobile

## 🎯 Example Use Cases

### **Multi-Step Research & Analysis**
```
User: "Interview me to create a blog post about artificial intelligence"
Agent: 
1. 🔍 Searches for latest AI trends and news
2. 💻 Generates interview questions based on findings
3. ⚙️ Processes responses and creates structured content
4. 📝 Outputs a complete blog post draft
```

### **Financial Calculations with Context**
```
User: "Find IBM's current stock price and calculate potential returns"
Agent:
1. 🔍 Searches for IBM's current stock price
2. 💻 Calculates various return scenarios
3. 📊 Provides investment analysis with current market context
```

### **Smart Problem Solving**
```
User: "Calculate the tip for a $127.50 restaurant bill split 4 ways"
Agent:
1. 💻 Calculates 15%, 18%, and 20% tip options
2. 💻 Divides total by 4 people
3. 💰 Shows per-person amounts with tip included
```

## 📋 Quick Start

### **Local Development**
1. **Open** `index.html` in a modern web browser, or
2. **Serve locally** with `npm run dev` (requires Node.js)

### **Deploy to Vercel**
1. **Push** this repository to GitHub
2. **Connect** your GitHub repo to [Vercel](https://vercel.com)
3. **Deploy** automatically - Vercel will detect the static site
4. **Share** your deployed URL with others

### **Configuration**
- **AI Pipe Token**: Get from [aipipe.org](https://aipipe.org) (provides access to multiple AI models)
- **Google Search**: API Key + CX ID from Google Cloud Console
- **AI Pipe Workflows**: Optional API key for workflow access
- **All credentials** are saved locally in your browser's localStorage

## � Deployment

### **Vercel (Recommended)**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/llm-agent-poc)

1. **Fork** or clone this repository
2. **Connect** to Vercel dashboard
3. **Deploy** with one click
4. **Environment**: No environment variables needed - all configuration is done in the UI

### **Other Static Hosts**
This project works with any static hosting service:
- **Netlify**: Drag and drop the folder
- **GitHub Pages**: Enable Pages in repository settings
- **Surge.sh**: `npm run build && surge`
- **Firebase Hosting**: Use `firebase deploy`

### **Local Development**
```bash
# Clone the repository
git clone <your-repo-url>
cd llm-agent-poc

# Install dependencies (optional)
npm install

# Start local development server
npm run dev

# Open in browser
# http://localhost:3000
```

## 🔧 Advanced Features

### **Keyboard Shortcuts**
- `Ctrl + Enter`: Send message
- `Ctrl + K`: Clear conversation
- `Tab`: Cycle through suggested questions

### **Export & Analysis**
- Export conversations as JSON for analysis
- Import previous conversations to continue where you left off
- Track tool usage and reasoning patterns

### **Smart Configuration**
- Auto-detects missing API keys and provides setup guidance
- Validates tool configurations before execution
- Provides helpful error messages with resolution steps

## 🎨 UI/UX Enhancements

- **Progressive Disclosure**: Shows complexity only when needed
- **Smart Placeholders**: Rotating suggestions to inspire user queries
- **Real-time Feedback**: Live status updates during multi-step processes
- **Error Recovery**: Graceful handling of API failures with retry suggestions
- **Mobile Responsive**: Works perfectly on all device sizes

## 🧠 Agent Intelligence

The agent demonstrates several advanced AI capabilities:

### **Proactive Tool Use**
- Automatically determines when web search is needed for current information
- Uses JavaScript execution for any computational tasks
- Leverages AI workflows for complex data processing

### **Context Awareness**
- Maintains conversation context across multiple tool calls
- References previous results in subsequent reasoning steps
- Builds comprehensive answers from multiple information sources

### **Error Resilience**
- Gracefully handles API failures and missing configurations
- Provides alternative approaches when tools are unavailable
- Continues reasoning even when individual tools fail

## API Keys Required

### AI Pipe Token
- The application uses AI Pipe's OpenRouter proxy by default
- Get your token from [AI Pipe](https://aipipe.org)
- Provides access to multiple AI models (OpenAI, Anthropic, etc.)

### Google Custom Search Engine
- **API Key**: Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- **CX ID**: Create a custom search engine at [Programmable Search Engine](https://programmablesearchengine.google.com/)

### AI Pipe (Optional)
- Get your API key from [AI Pipe](https://aipipe.org/keys)
- Used for executing serverless AI workflows

## Usage

1. Enter your API credentials in the sidebar
2. Type a question or task in the main input field
3. The agent will automatically:
   - Determine which tools are needed
   - Call the appropriate tools
   - Gather information
   - Provide a comprehensive answer

## Example Queries

- "What is the latest news about OpenAI?" (uses Google Search)
- "Calculate the compound interest for $1000 at 5% annual rate for 10 years" (uses JavaScript)
- "Analyze the sentiment of 'I love this product'" (uses AI Pipe)

## Technical Details

- **Framework**: Vanilla JavaScript with Bootstrap 5
- **Architecture**: Tool-calling loop with OpenAI-compatible APIs
- **Tools**: Modular tool system with easy extensibility
- **Security**: Sandboxed JavaScript execution environment

## Files

- `index.html`: Main application interface
- `script.js`: Core application logic and tool implementations
- `config.js`: Configuration and tool definitions

## Customization

You can easily add new tools by:
1. Adding a tool definition to the `tools` array in `script.js`
2. Implementing the corresponding handler function
3. Adding a demo configuration in `config.js`

The agent will automatically discover and use new tools in its reasoning loop.
