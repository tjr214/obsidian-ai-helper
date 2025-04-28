"use strict";
// To run this code you need to install the following dependencies:
// npm install @google/genai mime dotenv
// npm install -D @types/node tsx
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
exports.__esModule = true;
var genai_1 = require("@google/genai");
var dotenv_1 = require("dotenv");
// Load environment variables from .env file
dotenv_1["default"].config();
// Check if API key is present
if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY environment variable is required. Add it to your .env file.");
}
var apiKey = process.env.GOOGLE_API_KEY;
function main() {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function () {
        var ai, config, model, contents, response, response_1, response_1_1, chunk, e_1_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    ai = new genai_1.GoogleGenAI({ apiKey: apiKey });
                    config = {
                        responseMimeType: "text/plain"
                    };
                    model = "gemini-2.5-pro-preview-03-25";
                    contents = [
                        {
                            role: "user",
                            parts: [
                                {
                                    fileData: {
                                        fileUri: "https://youtu.be/6ZrO90AI0c8",
                                        mimeType: "video/*"
                                    }
                                },
                                {
                                    text: "Summarize this video with Markdown headings and formatting. Provide a Table of Contents that links each heading to the timecode in the youtube video."
                                },
                            ]
                        },
                    ];
                    console.log("Sending request to Gemini API...");
                    return [4 /*yield*/, ai.models.generateContentStream({
                            model: model,
                            config: config,
                            contents: contents
                        })];
                case 1:
                    response = _b.sent();
                    console.log("Response received, streaming content:");
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 7, 8, 13]);
                    response_1 = __asyncValues(response);
                    _b.label = 3;
                case 3: return [4 /*yield*/, response_1.next()];
                case 4:
                    if (!(response_1_1 = _b.sent(), !response_1_1.done)) return [3 /*break*/, 6];
                    chunk = response_1_1.value;
                    console.log(chunk.text);
                    _b.label = 5;
                case 5: return [3 /*break*/, 3];
                case 6: return [3 /*break*/, 13];
                case 7:
                    e_1_1 = _b.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 13];
                case 8:
                    _b.trys.push([8, , 11, 12]);
                    if (!(response_1_1 && !response_1_1.done && (_a = response_1["return"]))) return [3 /*break*/, 10];
                    return [4 /*yield*/, _a.call(response_1)];
                case 9:
                    _b.sent();
                    _b.label = 10;
                case 10: return [3 /*break*/, 12];
                case 11:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 12: return [7 /*endfinally*/];
                case 13: return [2 /*return*/];
            }
        });
    });
}
main()["catch"](function (error) {
    console.error("Error:", error.message);
    if (error.cause) {
        console.error("Cause:", error.cause);
    }
});
