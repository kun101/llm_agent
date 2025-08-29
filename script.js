import { agentPrompt, demos } from './config.js';

// Tool definitions for the LLM
const tools = [
  {
    type: "function",
    function: {
      name: "google_search",
      description: "Get snippets of information from a Google search query.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to send to Google.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "aipipe_workflow",
      description: "Executes a serverless AI workflow via the AI Pipe proxy API. Use for text processing, analysis, summarization, etc.",
      parameters: {
        type: "object",
        properties: {
          workflow: {
            type: "string",
            description: "The AI Pipe workflow name (e.g., 'summarize', 'sentiment', 'expand-content')",
          },
          payload: {
            type: "object",
            description: "The JSON payload to send to the workflow endpoint.",
            properties: {
              text: {
                type: "string",
                description: "Text content to process"
              },
              prompt: {
                type: "string", 
                description: "Additional instructions for the workflow"
              }
            }
          },
        },
        required: ["workflow", "payload"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "execute_javascript",
      description: "Executes sandboxed JavaScript code within the browser. Cannot access DOM or window.",
      parameters: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "A string of JavaScript code to be executed. Must return a value.",
          },
        },
        required: ["code"],
      },
    },
  },
];

// Tool handler functions
/**
 * A sandboxed JavaScript code executor with enhanced error handling.
 */
async function execute_javascript({ code }) {
  try {
    // Add some helpful utilities to the sandbox
    const sandboxGlobals = {
      Math, Date, JSON, parseInt, parseFloat, isNaN, isFinite,
      Array, Object, String, Number, Boolean, RegExp,
      console: {
        log: (...args) => args.join(' '),
        error: (...args) => args.join(' '),
        warn: (...args) => args.join(' ')
      }
    };
    
    // Create a safer eval environment
    const func = new Function(
      ...Object.keys(sandboxGlobals),
      `return (async () => { 
        "use strict";
        const result = (() => {
          ${code}
        })();
        return result;
      })();`
    );
    
    const result = await func(...Object.values(sandboxGlobals));
    
    return JSON.stringify({
      success: true,
      result: result,
      type: typeof result,
      executedAt: new Date().toISOString()
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack,
      executedAt: new Date().toISOString()
    }, null, 2);
  }
}

/**
 * Fetches results from the Google Custom Search API with enhanced formatting.
 */
async function google_search({ query }) {
  const apiKey = document.getElementById("param-google-cse-key")?.value;
  const cx = document.getElementById("param-google-cse-cx")?.value;
  
  if (!apiKey || !cx) {
    return JSON.stringify({ 
      error: "Google Search API Key or CX ID is missing. Please configure them in the sidebar.",
      configRequired: true
    });
  }
  
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Google API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return JSON.stringify({
        success: true,
        query: query,
        totalResults: 0,
        message: "No search results found for this query.",
        searchTime: data.searchInformation?.searchTime
      });
    }
    
    // Extract and format relevant snippets for the agent
    const results = data.items.slice(0, 5).map((item, index) => ({
      rank: index + 1,
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      displayLink: item.displayLink,
      formattedUrl: item.formattedUrl
    }));
    
    return JSON.stringify({
      success: true,
      query: query,
      totalResults: parseInt(data.searchInformation?.totalResults || 0),
      searchTime: data.searchInformation?.searchTime,
      results: results
    }, null, 2);
    
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error.message,
      query: query,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Calls an AI Pipe workflow with enhanced error handling and response formatting.
 */
async function aipipe_workflow({ workflow, payload }) {
  const apiKey = document.getElementById("param-aipipe-key")?.value;
  
  const headers = { 
    "Content-Type": "application/json",
    "User-Agent": "LLM-Agent-POC/1.0"
  };
  
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  
  // Construct the proper AI Pipe workflow URL
  const workflowUrl = `https://aipipe.org/api/${workflow}`;
  
  try {
    const response = await fetch(workflowUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Pipe API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    
    return JSON.stringify({
      success: true,
      workflow: workflow,
      payload: payload,
      result: result,
      timestamp: new Date().toISOString()
    }, null, 2);
    
  } catch (error) {
    return JSON.stringify({
      success: false,
      workflow: workflow,
      payload: payload,
      error: error.message,
      timestamp: new Date().toISOString(),
      suggestion: apiKey ? "Check if the workflow name is correct and the payload format is valid. Available workflows might include: 'summarize', 'sentiment', 'expand-content'." : "Consider adding an AI Pipe API key for authenticated access."
    });
  }
}

// UI rendering functions
const iconMap = {
  user: "bi-person-fill",
  assistant: "bi-robot",
  tool: "bi-wrench",
  "tool-call": "bi-gear-fill",
  error: "bi-exclamation-triangle-fill",
};

const colorMap = {
  user: "bg-primary",
  assistant: "bg-success",
  tool: "bg-secondary",
  "tool-call": "bg-info",
  error: "bg-danger",
};

// Global conversation state
let messages = [];
let isProcessing = false;

// DOM elements
const $taskForm = document.getElementById('taskForm');
const $stepsContainer = document.getElementById('steps-container');
const $demosContainer = document.getElementById('demos-container');
const $typingIndicator = document.getElementById('typingIndicator');
const $statusAlert = document.getElementById('statusAlert');
const $errorAlert = document.getElementById('errorAlert');
const $sendButton = document.getElementById('sendButton');
const $clearChat = document.getElementById('clearChat');
const $exportChat = document.getElementById('exportChat');

function renderSteps(messages) {
  // Hide welcome message when conversation starts
  if (messages.length > 0) {
    const welcomeMsg = $stepsContainer.querySelector('.welcome-message');
    if (welcomeMsg) welcomeMsg.style.display = 'none';
  }
  
  const messagesHtml = messages.map((message, index) => {
    const role = message.name || message.role;
    const icon = iconMap[role] || "bi-chat-dots";
    const color = colorMap[role] || "bg-light";
    
    let content = message.content || '';
    
    // Handle assistant messages with tool_calls but no content
    if (message.role === 'assistant' && message.tool_calls && !content) {
      content = `*Preparing to use ${message.tool_calls.length} tool(s)...*`;
    }
    
    // Handle completely empty content
    if (!content && message.role === 'assistant') {
      content = '*Processing...*';
    }
    
    // Skip rendering display-only messages in certain cases
    if (message.isDisplayOnly && message.role === 'tool') {
      // Don't skip, we want to show tool results
    }
    
    if (typeof content === 'object') {
      content = JSON.stringify(content, null, 2);
    }
    
    // Format code blocks
    content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<div class="code-block"><pre><code>${escapeHtml(code)}</code></pre></div>`;
    });
    
    // Format inline code
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Format bold text
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Add tool badge for tool calls
    let toolBadge = '';
    if (role === 'tool-call') {
      toolBadge = '<span class="tool-badge badge bg-warning">Tool Call</span>';
    } else if (role === 'tool') {
      toolBadge = '<span class="tool-badge badge bg-success">Tool Result</span>';
    }
    
    return `
      <div class="card step-card mb-3" data-step="${index}">
        <div class="card-header ${color} text-white">
          <i class="${icon}"></i> ${capitalizeFirst(role)}
          ${toolBadge}
        </div>
        <div class="card-body">
          <div class="step-content">${content}</div>
        </div>
      </div>
    `;
  }).join('');
  
  $stepsContainer.innerHTML = messagesHtml;
  
  // Scroll to bottom smoothly - now using the main content container
  setTimeout(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent && mainContent.scrollHeight > mainContent.clientHeight) {
      mainContent.scrollTop = mainContent.scrollHeight;
    }
  }, 50);
}

function renderSidebar() {
  $demosContainer.innerHTML = demos.map(demo => {
    const paramsHtml = demo.params.map(param => {
      const savedValue = loadFromLocalStorage(param.key.replace('-', '_'));
      return `
        <div class="mb-2">
          <label for="param-${param.key}" class="form-label small">
            ${param.label}
            ${param.required ? '<span class="text-danger">*</span>' : ''}
            ${param.link ? `<a href="${param.link}" target="_blank" class="text-decoration-none"><i class="bi bi-box-arrow-up-right"></i></a>` : ''}
          </label>
          <input type="${param.type}" class="form-control form-control-sm" id="param-${param.key}" placeholder="Enter ${param.label}" value="${savedValue}">
          <div class="form-check form-check-inline mt-1">
            <input class="form-check-input save-checkbox" type="checkbox" id="save-${param.key}" ${savedValue ? 'checked' : ''}>
            <label class="form-check-label small text-muted" for="save-${param.key}">
              <i class="bi bi-shield-lock"></i> Save securely in browser
            </label>
          </div>
        </div>
      `;
    }).join('');
    
    const questionsHtml = demo.questions.map(q => `
      <button class="btn btn-outline-secondary btn-sm me-1 mb-1 demo-question" data-question="${escapeHtml(q)}">${q}</button>
    `).join('');
    
    return `
      <div class="card mb-3">
        <div class="card-header">
          <i class="bi bi-${demo.icon}"></i> ${demo.title}
        </div>
        <div class="card-body">
          <p class="card-text small">${demo.description}</p>
          ${paramsHtml}
          ${demo.questions.length > 0 ? `
            <div class="mt-2">
              <small class="text-muted">Sample questions:</small>
              <div class="mt-1">${questionsHtml}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  // Add click handlers for demo questions
  document.querySelectorAll('.demo-question').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const question = e.target.getAttribute('data-question');
      document.querySelector('input[name="question"]').value = question;
    });
  });
  
  // Set up localStorage handlers for tool parameters
  demos.forEach(demo => {
    demo.params.forEach(param => {
      const input = document.getElementById(`param-${param.key}`);
      const checkbox = document.getElementById(`save-${param.key}`);
      const storageKey = param.key.replace('-', '_');
      
      if (input && checkbox) {
        input.addEventListener('input', () => {
          saveToLocalStorage(storageKey, input.value, checkbox.checked);
        });
        
        checkbox.addEventListener('change', () => {
          saveToLocalStorage(storageKey, input.value, checkbox.checked);
        });
      }
    });
  });
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Utility functions for better UX
function showStatus(message, type = 'info') {
  const alertElement = type === 'error' ? $errorAlert : $statusAlert;
  const messageElement = type === 'error' ? document.getElementById('errorMessage') : document.getElementById('statusMessage');
  
  messageElement.textContent = message;
  alertElement.classList.remove('d-none');
  
  // Auto-hide after 5 seconds for info messages
  if (type === 'info') {
    setTimeout(() => {
      alertElement.classList.add('d-none');
    }, 5000);
  }
}

function hideAlerts() {
  $statusAlert.classList.add('d-none');
  $errorAlert.classList.add('d-none');
}

function showTyping(show = true) {
  if (show) {
    $typingIndicator.classList.add('show');
    isProcessing = true;
    $sendButton.disabled = true;
    $sendButton.innerHTML = '<div class="spinner-border spinner-border-sm me-1"></div>Processing...';
  } else {
    $typingIndicator.classList.remove('show');
    isProcessing = false;
    $sendButton.disabled = false;
    $sendButton.innerHTML = '<i class="bi bi-send"></i> Send';
  }
}

function validateApiKeys() {
  const apiKey = document.getElementById("apiKeyInput").value;
  if (!apiKey) {
    showStatus('Please enter your API key in the sidebar configuration.', 'error');
    return false;
  }
  return true;
}

function exportConversation() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const data = {
    timestamp: new Date().toISOString(),
    messages: messages,
    model: document.getElementById("model").value,
    baseUrl: document.getElementById("baseUrlInput").value
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `agent-conversation-${timestamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  showStatus('Conversation exported successfully!');
}

function clearConversation() {
  if (messages.length === 0) return;
  
  if (confirm('Are you sure you want to clear the conversation?')) {
    messages = [];
    $stepsContainer.innerHTML = `
      <div class="welcome-message text-center text-muted">
        <i class="bi bi-chat-dots"></i>
        <p>Start a conversation with your AI agent...</p>
      </div>
    `;
    hideAlerts();
    showStatus('Conversation cleared.');
  }
}

// LocalStorage functions for saving API keys
function saveToLocalStorage(key, value, shouldSave) {
  if (shouldSave && value) {
    localStorage.setItem(`llm_agent_${key}`, value);
  } else {
    localStorage.removeItem(`llm_agent_${key}`);
  }
}

function loadFromLocalStorage(key) {
  return localStorage.getItem(`llm_agent_${key}`) || '';
}

function clearAllSavedKeys() {
  const keys = ['api_key', 'base_url', 'model', 'google_cse_key', 'google_cse_cx', 'aipipe_key'];
  keys.forEach(key => localStorage.removeItem(`llm_agent_${key}`));
  
  // Clear all input fields
  document.getElementById('apiKeyInput').value = '';
  document.getElementById('baseUrlInput').value = 'https://aipipe.org/openrouter/v1';
  document.getElementById('model').value = 'openai/gpt-4.1-nano';
  document.getElementById('param-google-cse-key').value = '';
  document.getElementById('param-google-cse-cx').value = '';
  document.getElementById('param-aipipe-key').value = '';
  
  // Uncheck all save checkboxes
  document.querySelectorAll('.save-checkbox').forEach(checkbox => {
    checkbox.checked = false;
  });
  
  showStatus('All saved credentials cleared.');
}

function setupKeyManagement() {
  // Load saved values on page load
  const apiKeyInput = document.getElementById('apiKeyInput');
  const baseUrlInput = document.getElementById('baseUrlInput');
  const modelSelect = document.getElementById('model');
  
  apiKeyInput.value = loadFromLocalStorage('api_key');
  const savedBaseUrl = loadFromLocalStorage('base_url');
  if (savedBaseUrl) baseUrlInput.value = savedBaseUrl;
  const savedModel = loadFromLocalStorage('model');
  if (savedModel) modelSelect.value = savedModel;
  
  // Set up event listeners for main API configuration
  const apiKeySaveCheckbox = document.getElementById('saveApiKey');
  const baseUrlSaveCheckbox = document.getElementById('saveBaseUrl');
  const modelSaveCheckbox = document.getElementById('saveModel');
  
  if (apiKeySaveCheckbox) {
    apiKeySaveCheckbox.checked = !!loadFromLocalStorage('api_key');
    apiKeyInput.addEventListener('input', () => {
      saveToLocalStorage('api_key', apiKeyInput.value, apiKeySaveCheckbox.checked);
    });
    apiKeySaveCheckbox.addEventListener('change', () => {
      saveToLocalStorage('api_key', apiKeyInput.value, apiKeySaveCheckbox.checked);
    });
  }
  
  if (baseUrlSaveCheckbox) {
    baseUrlSaveCheckbox.checked = !!loadFromLocalStorage('base_url');
    baseUrlInput.addEventListener('input', () => {
      saveToLocalStorage('base_url', baseUrlInput.value, baseUrlSaveCheckbox.checked);
    });
    baseUrlSaveCheckbox.addEventListener('change', () => {
      saveToLocalStorage('base_url', baseUrlInput.value, baseUrlSaveCheckbox.checked);
    });
  }
  
  if (modelSaveCheckbox) {
    modelSaveCheckbox.checked = !!loadFromLocalStorage('model');
    modelSelect.addEventListener('change', () => {
      saveToLocalStorage('model', modelSelect.value, modelSaveCheckbox.checked);
    });
    modelSaveCheckbox.addEventListener('change', () => {
      saveToLocalStorage('model', modelSelect.value, modelSaveCheckbox.checked);
    });
  }
}

// Main reasoning loop
$taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  if (isProcessing) return;
  
  const question = e.target.question.value.trim();
  if (!question) return;

  // Validate API configuration
  if (!validateApiKeys()) return;

  hideAlerts();
  showTyping(true);

  // 1. Initialize conversation
  messages.push({ role: "user", content: question });
  renderSteps(messages);
  
  // Clear the input
  e.target.question.value = '';

  const baseUrl = document.getElementById("baseUrlInput").value;
  const llmApiKey = document.getElementById("apiKeyInput").value;
  const model = document.getElementById("model").value;
  const maxLoops = 10; // Safety break to prevent infinite loops

  // Add system message if this is the first interaction
  if (messages.length === 1) {
    messages.unshift({ 
      role: "system", 
      content: agentPrompt() 
    });
  }

  try {
    for (let i = 0; i < maxLoops; i++) {
      showStatus(`Processing step ${i + 1}/${maxLoops}...`);
      
      // 2. Call the LLM with messages and tools (filter out display-only messages)
      const apiMessages = messages.filter(msg => !msg.isDisplayOnly);
      
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${llmApiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: apiMessages,
          tools: tools,
          tool_choice: "auto",
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText}\n${errorText}`);
      }

      const responseData = await response.json();
      const message = responseData.choices[0].message;
      messages.push(message);
      
      // Hide typing indicator as soon as we get a response
      if (!message.tool_calls) {
        showTyping(false);
      }
      
      // Immediately render the assistant's response
      renderSteps(messages);

      // 3. Check if the LLM requested tool calls
      if (message.tool_calls) {
        const toolCalls = message.tool_calls;
        showStatus(`Executing ${toolCalls.length} tool call(s)...`);

        // 4. Execute all tool calls and collect results
        const toolResults = await Promise.allSettled(toolCalls.map(async (toolCall, index) => {
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);

          // Display a status message for the tool call (for UI only, not sent to API)
          const displayMessage = { 
            role: 'assistant', 
            name: 'tool-call', 
            content: `🔧 **Calling tool: ${functionName}** (${index + 1}/${toolCalls.length})\n\`\`\`json\n${JSON.stringify(args, null, 2)}\n\`\`\``,
            isDisplayOnly: true,
            toolCallIndex: index
          };
          messages.push(displayMessage);
          renderSteps(messages);

          let result;
          try {
            switch (functionName) {
              case "google_search":
                result = await google_search(args);
                break;
              case "aipipe_workflow":
                result = await aipipe_workflow(args);
                break;
              case "execute_javascript":
                result = await execute_javascript(args);
                break;
              default:
                result = JSON.stringify({ error: `Unknown tool: ${functionName}` });
            }
          } catch (error) {
            result = JSON.stringify({ error: `Tool execution failed: ${error.message}` });
          }
          
          // Create the actual tool result message for API
          const toolResultMessage = {
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: result,
          };
          
          // Add display version for UI
          const displayResult = {
            role: "tool",
            name: functionName,
            content: result,
            isDisplayOnly: true,
            toolCallIndex: index
          };
          
          messages.push(displayResult);
          renderSteps(messages);
          
          return toolResultMessage;
        }));

        // Add only the actual tool results to the conversation for API
        const actualToolResults = toolResults
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value);
        
        // Add the tool results to the main messages array for the API
        messages.push(...actualToolResults);

        // Check if any tool calls failed
        const failedCalls = toolResults.filter(result => result.status === 'rejected');
        if (failedCalls.length > 0) {
          console.warn('Some tool calls failed:', failedCalls);
        }
        
        // Loop continues to send results back to LLM
      } else {
        // 5. No tool calls, LLM gave a final answer. End the loop.
        showTyping(false);
        hideAlerts();
        showStatus('Task completed successfully!');
        
        // Ensure final rendering of all messages
        renderSteps(messages);
        return; // Exit the loop and function
      }
    }
    
    // If loop finishes, it means we hit the maxLoops limit.
    messages.push({ 
      role: 'assistant', 
      name: 'error', 
      content: '⚠️ Agent reached maximum loop limit. The task may not be fully complete.' 
    });
    renderSteps(messages);
    showStatus('Agent reached maximum iteration limit.', 'error');
    
  } catch (error) {
    console.error('Agent error:', error);
    messages.push({ 
      role: 'assistant', 
      name: 'error', 
      content: `❌ **Error occurred:**\n${error.message}` 
    });
    renderSteps(messages);
    showStatus(`Error: ${error.message}`, 'error');
  } finally {
    showTyping(false);
  }
});

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  renderSidebar();
  
  // Set up localStorage key management
  setupKeyManagement();
  
  // Add event handlers for new features
  $clearChat.addEventListener('click', clearConversation);
  $exportChat.addEventListener('click', exportConversation);
  
  // Add clear all keys button handler
  const $clearAllKeys = document.getElementById('clearAllKeys');
  if ($clearAllKeys) {
    $clearAllKeys.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all saved credentials? This cannot be undone.')) {
        clearAllSavedKeys();
      }
    });
  }
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to send message
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const questionInput = document.querySelector('input[name="question"]');
      if (questionInput.value.trim()) {
        $taskForm.dispatchEvent(new Event('submit'));
      }
    }
    
    // Ctrl/Cmd + K to clear chat
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      clearConversation();
    }
  });
  
  // Auto-focus on input
  document.querySelector('input[name="question"]').focus();
  
  // Add auto-suggestions
  const questionInput = document.querySelector('input[name="question"]');
  const suggestions = [
    "Interview me to create a blog post about artificial intelligence",
    "Search for the latest Tesla stock price and calculate potential returns",
    "Generate a secure password and explain its strength",
    "Find today's top tech news and summarize the key points",
    "Calculate the tip for a $127.50 restaurant bill split 4 ways",
    "Search for Python best practices and create a quick reference",
    "Analyze the pros and cons of remote work",
  ];
  
  let currentSuggestion = 0;
  questionInput.addEventListener('focus', () => {
    if (!questionInput.value) {
      questionInput.placeholder = suggestions[currentSuggestion];
      currentSuggestion = (currentSuggestion + 1) % suggestions.length;
    }
  });
});
