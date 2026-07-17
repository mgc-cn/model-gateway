import React, { useState, useRef, useEffect } from "react";
import { Modal, Select, Switch, Collapse, Input, Divider } from "antd";
import { Button, TextInput } from "@tremor/react";
import {
  CodeOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CaretRightOutlined,
  SaveOutlined,
  UsergroupAddOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { createGuardrailCall, updateGuardrailCall, testCustomCodeGuardrail } from "../../networking";
import NotificationsManager from "../../molecules/notifications_manager";
import { useTranslation } from "react-i18next";

const { Panel } = Collapse;
const { TextArea } = Input;

// Code templates
const CODE_TEMPLATES = {
  empty: {
    code: `async def apply_guardrail(inputs, request_data, input_type):
    # inputs: {texts, images, tools, tool_calls, structured_messages, model}
    # request_data: {model, user_id, team_id, end_user_id, metadata}
    # input_type: "request" or "response"
    return allow()`,
  },
  blockSSN: {
    code: `def apply_guardrail(inputs, request_data, input_type):
    for text in inputs["texts"]:
        if regex_match(text, r"\\d{3}-\\d{2}-\\d{4}"):
            return block("SSN detected")
    return allow()`,
  },
  redactEmail: {
    code: `def apply_guardrail(inputs, request_data, input_type):
    pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
    modified = []
    for text in inputs["texts"]:
        modified.append(regex_replace(text, pattern, "[EMAIL REDACTED]"))
    return modify(texts=modified)`,
  },
  blockSQL: {
    code: `def apply_guardrail(inputs, request_data, input_type):
    if input_type != "request":
        return allow()
    for text in inputs["texts"]:
        if contains_code_language(text, ["sql"]):
            return block("SQL code not allowed")
    return allow()`,
  },
  validateJSON: {
    code: `def apply_guardrail(inputs, request_data, input_type):
    if input_type != "response":
        return allow()
    
    schema = {"type": "object", "required": ["name", "value"]}
    
    for text in inputs["texts"]:
        obj = json_parse(text)
        if obj is None:
            return block("Invalid JSON response")
        if not json_schema_valid(obj, schema):
            return block("Response missing required fields")
    return allow()`,
  },
  externalAPI: {
    code: `async def apply_guardrail(inputs, request_data, input_type):
    # Call an external moderation API (async for non-blocking)
    for text in inputs["texts"]:
        response = await http_post(
            "https://api.example.com/moderate",
            body={"text": text, "user_id": request_data["user_id"]},
            headers={"Authorization": "Bearer YOUR_API_KEY"},
            timeout=10
        )
        
        if not response["success"]:
            # API call failed, allow by default or block
            return allow()
        
        if response["body"].get("flagged"):
            return block(response["body"].get("reason", "Content flagged"))
    
    return allow()`,
  },
};

// Available primitives organized by category
const PRIMITIVES = {
  returnValues: [
    { name: "allow()", descriptionKey: "allow" },
    { name: "block(reason)", descriptionKey: "block" },
    { name: "modify(texts=[], images=[], tool_calls=[])", descriptionKey: "modify" },
  ],
  httpRequests: [
    { name: "await http_request(url, method, headers, body)", descriptionKey: "httpRequest" },
    { name: "await http_get(url, headers)", descriptionKey: "httpGet" },
    { name: "await http_post(url, body, headers)", descriptionKey: "httpPost" },
  ],
  regexFunctions: [
    { name: "regex_match(text, pattern)", descriptionKey: "regexMatch" },
    { name: "regex_replace(text, pattern, replacement)", descriptionKey: "regexReplace" },
    { name: "regex_find_all(text, pattern)", descriptionKey: "regexFindAll" },
  ],
  jsonFunctions: [
    { name: "json_parse(text)", descriptionKey: "jsonParse" },
    { name: "json_stringify(obj)", descriptionKey: "jsonStringify" },
    { name: "json_schema_valid(obj, schema)", descriptionKey: "jsonSchemaValid" },
  ],
  urlFunctions: [
    { name: "extract_urls(text)", descriptionKey: "extractUrls" },
    { name: "is_valid_url(url)", descriptionKey: "isValidUrl" },
    { name: "all_urls_valid(text)", descriptionKey: "allUrlsValid" },
  ],
  codeDetection: [
    { name: "detect_code(text)", descriptionKey: "detectCode" },
    { name: "detect_code_languages(text)", descriptionKey: "detectCodeLanguages" },
    { name: 'contains_code_language(text, ["sql"])', descriptionKey: "containsCodeLanguage" },
  ],
  textUtilities: [
    { name: "contains(text, substring)", descriptionKey: "contains" },
    { name: "contains_any(text, [substr1, substr2])", descriptionKey: "containsAny" },
    { name: "word_count(text)", descriptionKey: "wordCount" },
    { name: "char_count(text)", descriptionKey: "charCount" },
    { name: "lower(text) / upper(text) / trim(text)", descriptionKey: "stringTransforms" },
  ],
};

const MODE_OPTIONS = [
  "pre_call",
  "post_call",
  "during_call",
  "logging_only",
  "pre_mcp_call",
  "post_mcp_call",
  "during_mcp_call",
];

// Data for editing an existing guardrail
export interface EditGuardrailData {
  guardrail_id: string;
  guardrail_name: string;
  litellm_params: {
    mode?: string | string[];
    default_on?: boolean;
    custom_code?: string;
    [key: string]: any;
  };
}

interface CustomCodeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accessToken: string | null;
  /** If provided, the modal will be in edit mode */
  editData?: EditGuardrailData | null;
}

const CustomCodeModal: React.FC<CustomCodeModalProps> = ({ visible, onClose, onSuccess, accessToken, editData }) => {
  const { t } = useTranslation();
  const isEditMode = !!editData;
  const [guardrailName, setGuardrailName] = useState("");
  const [mode, setMode] = useState<string[]>(["pre_call"]);
  const [defaultOn, setDefaultOn] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("empty");
  const [code, setCode] = useState(CODE_TEMPLATES.empty.code);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testExpanded, setTestExpanded] = useState(false);

  // Test input examples for pre_call and post_call
  const TEST_INPUT_EXAMPLES = {
    pre_call: {
      name: "Pre-call (Request)",
      data: {
        texts: ["Hello, my SSN is 123-45-6789"],
        images: [],
        tools: [
          {
            type: "function",
            function: {
              name: "get_weather",
              description: "Get the current weather in a location",
              parameters: {
                type: "object",
                properties: {
                  location: { type: "string", description: "City name" },
                },
                required: ["location"],
              },
            },
          },
        ],
        tool_calls: [],
        structured_messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Hello, my SSN is 123-45-6789" },
        ],
        model: "gpt-4",
      },
    },
    post_call: {
      name: "Post-call (Response)",
      data: {
        texts: ["The weather in San Francisco is 72°F and sunny."],
        images: [],
        tools: [],
        tool_calls: [
          {
            id: "call_abc123",
            type: "function",
            function: {
              name: "get_weather",
              arguments: '{"location": "San Francisco"}',
            },
          },
        ],
        structured_messages: [],
        model: "gpt-4",
      },
    },
    pre_mcp_call: {
      name: "Pre MCP (MCP tool as OpenAI tool)",
      data: {
        texts: ['Tool: read_wiki_structure\nArguments: {"repoName": "BerriAI/litellm"}'],
        images: [],
        tools: [
          {
            type: "function",
            function: {
              name: "read_wiki_structure",
              description: "Read the structure of a GitHub repository (MCP tool passed as OpenAI tool)",
              parameters: {
                type: "object",
                properties: {
                  repoName: { type: "string", description: "Repository name, e.g. BerriAI/litellm" },
                },
                required: ["repoName"],
              },
            },
          },
        ],
        tool_calls: [
          {
            id: "call_mcp_001",
            type: "function",
            function: {
              name: "read_wiki_structure",
              arguments: '{"repoName": "BerriAI/litellm"}',
            },
          },
        ],
        structured_messages: [
          { role: "user", content: 'Tool: read_wiki_structure\nArguments: {"repoName": "BerriAI/litellm"}' },
        ],
        model: "mcp-tool-call",
      },
    },
  };

  const [testInput, setTestInput] = useState(JSON.stringify(TEST_INPUT_EXAMPLES.pre_call.data, null, 2));
  const [testResult, setTestResult] = useState<any>(null);
  const [copiedPrimitive, setCopiedPrimitive] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle template change
  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey);

    // Check if it's a standard template
    setCode(CODE_TEMPLATES[templateKey as keyof typeof CODE_TEMPLATES].code);
  };

  // Normalize mode from API (string or string[]) to string[]
  const normalizeMode = (m: string | string[] | undefined): string[] => {
    if (m === undefined || m === null) return ["pre_call"];
    if (Array.isArray(m)) return m.length ? m : ["pre_call"];
    return [m];
  };

  // Reset form when modal opens or editData changes
  useEffect(() => {
    if (visible) {
      if (editData) {
        // Edit mode: populate with existing data
        setGuardrailName(editData.guardrail_name || "");
        setMode(normalizeMode(editData.litellm_params?.mode));
        setDefaultOn(editData.litellm_params?.default_on || false);
        setCode(editData.litellm_params?.custom_code || CODE_TEMPLATES.empty.code);
        setSelectedTemplate(""); // No template selected in edit mode
      } else {
        // Create mode: reset to defaults
        setGuardrailName("");
        setMode(["pre_call"]);
        setDefaultOn(false);
        setSelectedTemplate("empty");
        setCode(CODE_TEMPLATES.empty.code);
      }
      setTestResult(null);
      setTestExpanded(false);
    }
  }, [visible, editData]);

  // Copy primitive to clipboard
  const copyPrimitive = async (primitive: string) => {
    try {
      await navigator.clipboard.writeText(primitive);
      setCopiedPrimitive(primitive);
      setTimeout(() => setCopiedPrimitive(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Handle tab key in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = code.substring(0, start) + "    " + code.substring(end);
      setCode(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  // Save guardrail (create or update)
  const handleSave = async () => {
    if (!guardrailName.trim()) {
      NotificationsManager.fromBackend(t("guardrailManagement.customCode.notifications.nameRequired"));
      return;
    }
    if (!code.trim()) {
      NotificationsManager.fromBackend(t("guardrailManagement.customCode.notifications.codeRequired"));
      return;
    }
    if (!accessToken) {
      NotificationsManager.fromBackend(t("guardrailManagement.customCode.notifications.noAccessToken"));
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && editData) {
        // Update existing guardrail
        const updateData: any = {
          litellm_params: {
            custom_code: code,
          },
        };

        // Only include changed fields
        if (guardrailName !== editData.guardrail_name) {
          updateData.guardrail_name = guardrailName;
        }
        const existingMode = normalizeMode(editData.litellm_params?.mode);
        const modeChanged = mode.length !== existingMode.length || mode.some((m, i) => m !== existingMode[i]);
        if (modeChanged) {
          updateData.litellm_params.mode = mode;
        }
        if (defaultOn !== editData.litellm_params?.default_on) {
          updateData.litellm_params.default_on = defaultOn;
        }

        await updateGuardrailCall(accessToken, editData.guardrail_id, updateData);
        NotificationsManager.success(t("guardrailManagement.customCode.notifications.updated"));
      } else {
        // Create new guardrail
        const guardrailData = {
          guardrail_name: guardrailName,
          litellm_params: {
            guardrail: "custom_code",
            mode: mode,
            default_on: defaultOn,
            custom_code: code,
          },
          guardrail_info: {},
        };

        await createGuardrailCall(accessToken, guardrailData);
        NotificationsManager.success(t("guardrailManagement.customCode.notifications.created"));
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to save guardrail:", error);
      NotificationsManager.fromBackend(
        t("guardrailManagement.customCode.notifications.saveFailed", {
          action: t(`guardrailManagement.customCode.notifications.${isEditMode ? "updateAction" : "createAction"}`),
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Test guardrail using backend endpoint
  const handleTest = async () => {
    if (!accessToken) {
      setTestResult({ error: t("guardrailManagement.customCode.notifications.noAccessToken") });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Parse test input JSON
      let parsedInput;
      try {
        parsedInput = JSON.parse(testInput);
      } catch (e) {
        setTestResult({ error: t("guardrailManagement.customCode.test.invalidJson") });
        setIsTesting(false);
        return;
      }

      // Ensure texts array exists
      if (!parsedInput.texts) {
        parsedInput.texts = [];
      }

      // Use first request-like or response-like mode for test input_type
      const requestModes = ["pre_call", "pre_mcp_call"];
      const responseModes = ["post_call", "post_mcp_call"];
      const testInputType: "request" | "response" = mode.some((m) => requestModes.includes(m))
        ? "request"
        : mode.some((m) => responseModes.includes(m))
          ? "response"
          : "request";

      const response = await testCustomCodeGuardrail(accessToken, {
        custom_code: code,
        test_input: parsedInput,
        input_type: testInputType,
        request_data: {
          model: "test-model",
          metadata: {},
        },
      });

      if (response.success && response.result) {
        setTestResult(response.result);
      } else if (response.error) {
        setTestResult({
          error: response.error,
          error_type: response.error_type,
        });
      } else {
        setTestResult({ error: t("guardrailManagement.customCode.test.unknownError") });
      }
    } catch (error) {
      console.error("Failed to test custom code:", error);
      setTestResult({
        error: error instanceof Error ? error.message : t("guardrailManagement.customCode.test.failed"),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const lineCount = code.split("\n").length;

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1400}
      className="custom-code-modal"
      closable={true}
      destroyOnClose
    >
      <div className="flex flex-col h-[80vh]">
        {/* Header */}
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {t(`guardrailManagement.customCode.${isEditMode ? "editTitle" : "createTitle"}`)}
          </h2>
          <p className="text-sm text-gray-500 mt-1">{t("guardrailManagement.customCode.description")}</p>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-4 py-4 border-b border-gray-100">
          <div className="flex-1 max-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {t("guardrailManagement.customCode.name")}
            </label>
            <TextInput
              value={guardrailName}
              onValueChange={setGuardrailName}
              placeholder={t("guardrailManagement.customCode.namePlaceholder")}
            />
          </div>
          <div className="w-[280px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {t("guardrailManagement.customCode.mode")}
            </label>
            <Select
              mode="multiple"
              value={mode}
              onChange={setMode}
              options={MODE_OPTIONS.map((value) => ({
                value,
                label: t(`guardrailManagement.customCode.modes.${value}`),
              }))}
              className="w-full"
              size="middle"
              placeholder={t("guardrailManagement.customCode.modePlaceholder")}
            />
          </div>
          <div className="w-[180px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {t("guardrailManagement.customCode.template")}
            </label>
            <Select
              value={selectedTemplate}
              onChange={handleTemplateChange}
              className="w-full"
              size="middle"
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: "8px 0" }} />
                  <div
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      color: "#1890ff",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      window.open("https://models.litellm.ai/guardrails", "_blank");
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f0f0f0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <UsergroupAddOutlined />
                    <span>{t("guardrailManagement.customCode.browseTemplates")}</span>
                    <ExportOutlined style={{ fontSize: "10px" }} />
                  </div>
                </>
              )}
            >
              <Select.OptGroup label={t("guardrailManagement.customCode.standardTemplates")}>
                {Object.keys(CODE_TEMPLATES).map((key) => (
                  <Select.Option key={key} value={key}>
                    {t(`guardrailManagement.customCode.templates.${key}`)}
                  </Select.Option>
                ))}
              </Select.OptGroup>
            </Select>
          </div>
          <div className="flex items-center gap-2 pt-5">
            <span className="text-sm text-gray-600">{t("guardrailManagement.customCode.defaultOn")}</span>
            <Switch checked={defaultOn} onChange={setDefaultOn} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden mt-4 gap-6">
          {/* Code Editor */}
          <div className="flex-2 flex flex-col min-w-0 overflow-y-auto">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t("guardrailManagement.customCode.pythonLogic")}
              </span>
              <span className="text-xs text-gray-400">{t("guardrailManagement.customCode.restrictedEnvironment")}</span>
            </div>
            <div
              className="relative rounded-lg overflow-hidden border border-gray-700 bg-[#1e1e1e] shrink-0"
              style={{ minHeight: "300px", maxHeight: "400px" }}
            >
              {/* Line numbers */}
              <div
                className="absolute left-0 top-0 bottom-0 w-12 bg-[#1e1e1e] border-r border-gray-700 text-right pr-3 pt-3 select-none overflow-hidden"
                style={{
                  fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                {Array.from({ length: Math.max(lineCount, 20) }, (_, i) => (
                  <div key={i + 1} className="text-gray-500 h-[22.4px]">
                    {i + 1}
                  </div>
                ))}
              </div>
              {/* Code textarea */}
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                className="w-full h-full pl-14 pr-4 pt-3 pb-3 resize-none focus:outline-hidden bg-transparent text-gray-200"
                style={{
                  fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  tabSize: 4,
                }}
              />
            </div>

            {/* Test Section */}
            <Collapse
              activeKey={testExpanded ? ["test"] : []}
              onChange={(keys) => setTestExpanded(keys.includes("test"))}
              className="mt-3 bg-white border border-gray-200 rounded-lg shrink-0"
              expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
            >
              <Panel
                header={
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <PlayCircleOutlined className="text-blue-500" />
                    {t("guardrailManagement.customCode.test.title")}
                  </span>
                }
                key="test"
              >
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-gray-600">
                        {t("guardrailManagement.customCode.test.input")}
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {t("guardrailManagement.customCode.test.loadExample")}
                        </span>
                        <button
                          type="button"
                          onClick={() => setTestInput(JSON.stringify(TEST_INPUT_EXAMPLES.pre_call.data, null, 2))}
                          className="px-2 py-1 text-xs rounded-sm border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors"
                        >
                          {t("guardrailManagement.customCode.test.preCall")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTestInput(JSON.stringify(TEST_INPUT_EXAMPLES.pre_mcp_call.data, null, 2))}
                          className="px-2 py-1 text-xs rounded-sm border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                        >
                          {t("guardrailManagement.customCode.test.preMcp")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTestInput(JSON.stringify(TEST_INPUT_EXAMPLES.post_call.data, null, 2))}
                          className="px-2 py-1 text-xs rounded-sm border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                        >
                          {t("guardrailManagement.customCode.test.postCall")}
                        </button>
                      </div>
                    </div>
                    <div className="mb-2 p-2 bg-gray-50 rounded-sm text-xs text-gray-600 border border-gray-200">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div>
                          <strong>texts</strong>: {t("guardrailManagement.customCode.test.fields.texts")}
                        </div>
                        <div>
                          <strong>images</strong>: {t("guardrailManagement.customCode.test.fields.images")}
                        </div>
                        <div>
                          <strong>tools</strong>: {t("guardrailManagement.customCode.test.fields.tools")}{" "}
                          <span className="text-orange-600">(pre_call)</span>,{" "}
                          {t("guardrailManagement.customCode.test.fields.mcpTool")}{" "}
                          <span className="text-purple-600">(pre_mcp_call)</span>
                        </div>
                        <div>
                          <strong>tool_calls</strong>: {t("guardrailManagement.customCode.test.fields.toolCalls")}{" "}
                          <span className="text-green-600">(post_call)</span>
                        </div>
                        <div>
                          <strong>structured_messages</strong>:{" "}
                          {t("guardrailManagement.customCode.test.fields.structuredMessages")}{" "}
                          <span className="text-orange-600">(pre_call)</span>
                        </div>
                        <div>
                          <strong>model</strong>: {t("guardrailManagement.customCode.test.fields.model")}
                        </div>
                      </div>
                    </div>
                    <TextArea
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      rows={8}
                      className="font-mono text-xs"
                      placeholder='{"texts": ["test message"], ...}'
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Button size="xs" onClick={handleTest} disabled={isTesting} icon={PlayCircleOutlined}>
                      {t(`guardrailManagement.customCode.test.${isTesting ? "running" : "run"}`)}
                    </Button>
                    {testResult && (
                      <div
                        className={`flex items-center gap-2 text-sm ${
                          testResult.error
                            ? "text-red-600"
                            : testResult.action === "allow"
                              ? "text-green-600"
                              : testResult.action === "block"
                                ? "text-orange-600"
                                : "text-blue-600"
                        }`}
                      >
                        {testResult.error ? (
                          <>
                            <CloseCircleOutlined />
                            <span>
                              {testResult.error_type && <span className="font-medium">[{testResult.error_type}] </span>}
                              {testResult.error}
                            </span>
                          </>
                        ) : testResult.action === "allow" ? (
                          <>
                            <CheckCircleOutlined /> {t("guardrailManagement.customCode.test.allowed")}
                          </>
                        ) : testResult.action === "block" ? (
                          <>
                            <CloseCircleOutlined /> {t("guardrailManagement.customCode.test.blocked")}:{" "}
                            {testResult.reason}
                          </>
                        ) : testResult.action === "modify" ? (
                          <>
                            <CheckCircleOutlined /> {t("guardrailManagement.customCode.test.modified")}
                            {testResult.texts && testResult.texts.length > 0 && (
                              <span className="text-xs text-gray-500 ml-1">
                                → {testResult.texts[0].substring(0, 50)}
                                {testResult.texts[0].length > 50 ? "..." : ""}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <CheckCircleOutlined />{" "}
                            {testResult.action || t("guardrailManagement.customCode.test.unknown")}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
            </Collapse>
            {/* Contribution CTA Banner */}
            <div className="mt-3 p-4 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <UsergroupAddOutlined className="text-blue-600 text-lg" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {t("guardrailManagement.customCode.contribution.title")}
                  </div>
                  <div className="text-xs text-gray-600">
                    {t("guardrailManagement.customCode.contribution.description")}
                  </div>
                </div>
              </div>
              <Button
                size="xs"
                onClick={() => window.open("https://github.com/BerriAI/litellm-guardrails", "_blank")}
                icon={ExportOutlined}
                className="bg-blue-600 hover:bg-blue-700 text-white border-0"
              >
                {t("guardrailManagement.customCode.contribution.action")}
              </Button>
            </div>
          </div>

          {/* Primitives Panel */}
          <div className="w-[300px] shrink-0 overflow-auto border-l border-gray-200 pl-6">
            <div className="flex items-center gap-2 mb-3">
              <CodeOutlined className="text-blue-500" />
              <span className="font-semibold text-gray-700">
                {t("guardrailManagement.customCode.primitives.title")}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3">{t("guardrailManagement.customCode.primitives.description")}</p>

            <Collapse
              defaultActiveKey={["returnValues"]}
              className="primitives-collapse bg-transparent border-0"
              expandIconPosition="end"
            >
              {Object.entries(PRIMITIVES).map(([category, primitives]) => (
                <Panel
                  header={
                    <span className="text-sm font-medium text-gray-700">
                      {t(`guardrailManagement.customCode.primitives.categories.${category}`)}
                    </span>
                  }
                  key={category}
                  className="bg-white mb-2 rounded-lg border border-gray-200"
                >
                  <div className="space-y-2">
                    {primitives.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => copyPrimitive(p.name)}
                        className={`w-full text-left px-2 py-2 rounded transition-colors ${
                          copiedPrimitive === p.name ? "bg-green-100" : "bg-gray-50 hover:bg-blue-50"
                        }`}
                      >
                        {copiedPrimitive === p.name ? (
                          <span className="flex items-center gap-1 text-xs font-mono text-green-700">
                            <CheckCircleOutlined /> {t("guardrailManagement.customCode.primitives.copied")}
                          </span>
                        ) : (
                          <>
                            <div className="text-xs font-mono text-gray-800">{p.name}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {t(`guardrailManagement.customCode.primitives.descriptions.${p.descriptionKey}`)}
                            </div>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </Panel>
              ))}
            </Collapse>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
          <span className="text-xs text-gray-400">{t("guardrailManagement.customCode.draftSaved")}</span>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onClose}>
              {t("guardrailManagement.actions.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              loading={isSaving}
              disabled={isSaving || !guardrailName.trim()}
              icon={SaveOutlined}
            >
              {t(`guardrailManagement.customCode.${isEditMode ? "update" : "save"}`)}
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        .custom-code-modal .ant-modal-content {
          padding: 24px;
        }
        .custom-code-modal .ant-modal-close {
          top: 20px;
          right: 20px;
        }
        .primitives-collapse .ant-collapse-item {
          border: none !important;
        }
        .primitives-collapse .ant-collapse-header {
          padding: 8px 12px !important;
        }
        .primitives-collapse .ant-collapse-content-box {
          padding: 8px 12px !important;
        }
      `}</style>
    </Modal>
  );
};

export default CustomCodeModal;
